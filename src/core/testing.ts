import binomial from "@stdlib/stats-base-dists-binomial";
import chisquare from "@stdlib/stats-base-dists-chisquare";
import normalCdf from "@stdlib/stats-base-dists-normal-cdf";
import tDist from "@stdlib/stats-base-dists-t";
import { drawSample } from "./populations";
import { createRng } from "./rng";
import { sampleMean, standardDeviation } from "./statistics";
import type {
  TestDirection,
  TestingKind,
  TestingSummary,
  TwoGroupMeanPopulationConfig,
  TwoGroupProportionPopulationConfig,
  TwoGroupTestingSummary,
  TwoGroupProportionTestingRunResult,
} from "./types";

function criticalT(alpha: number, direction: TestDirection, degreesOfFreedom: number) {
  if (degreesOfFreedom <= 0) {
    return Number.NaN;
  }

  if (direction === "two-sided") {
    return tDist.quantile(1 - alpha / 2, degreesOfFreedom);
  }

  return tDist.quantile(1 - alpha, degreesOfFreedom);
}

function simpsonEstimate(
  f: (value: number) => number,
  left: number,
  right: number,
): number {
  const midpoint = (left + right) / 2;
  return ((right - left) / 6) * (f(left) + 4 * f(midpoint) + f(right));
}

function adaptiveSimpson(
  f: (value: number) => number,
  left: number,
  right: number,
  epsilon: number,
  whole: number,
  depth: number,
): number {
  const midpoint = (left + right) / 2;
  const leftEstimate = simpsonEstimate(f, left, midpoint);
  const rightEstimate = simpsonEstimate(f, midpoint, right);
  const delta = leftEstimate + rightEstimate - whole;

  if (depth <= 0 || Math.abs(delta) <= 15 * epsilon) {
    return leftEstimate + rightEstimate + delta / 15;
  }

  return (
    adaptiveSimpson(f, left, midpoint, epsilon / 2, leftEstimate, depth - 1) +
    adaptiveSimpson(f, midpoint, right, epsilon / 2, rightEstimate, depth - 1)
  );
}

function integrateUnitInterval(f: (value: number) => number) {
  const left = 0;
  const right = 1;
  const whole = simpsonEstimate(f, left, right);
  return adaptiveSimpson(f, left, right, 1e-8, whole, 18);
}

export function computeTStatistic(sample: number[], nullMean: number) {
  if (sample.length < 2) {
    return null;
  }

  const mean = sampleMean(sample);
  const sd = standardDeviation(sample);

  if (sd === 0) {
    return mean === nullMean ? 0 : mean > nullMean ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }

  return (mean - nullMean) / (sd / Math.sqrt(sample.length));
}

export function computeBinomialStatistic(sample: number[]) {
  return sample.reduce((sum, value) => sum + value, 0);
}

export function computePooledTStatistic(
  sampleA: number[],
  sampleB: number[],
  nullDifference: number,
) {
  if (sampleA.length < 2 || sampleB.length < 2) {
    return null;
  }

  const meanA = sampleMean(sampleA);
  const meanB = sampleMean(sampleB);
  const pooledSD = Math.sqrt(
    (((sampleA.length - 1) * standardDeviation(sampleA) ** 2) +
      ((sampleB.length - 1) * standardDeviation(sampleB) ** 2)) /
      (sampleA.length + sampleB.length - 2),
  );

  if (pooledSD === 0) {
    const observedDifference = meanA - meanB;
    if (observedDifference === nullDifference) {
      return 0;
    }
    return observedDifference > nullDifference ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }

  return ((meanA - meanB) - nullDifference) / (pooledSD * Math.sqrt(1 / sampleA.length + 1 / sampleB.length));
}

export function shouldReject(
  statistic: number,
  criticalValue: number,
  direction: TestDirection,
) {
  if (!Number.isFinite(statistic)) {
    return direction === "greater" ? statistic === Number.POSITIVE_INFINITY : statistic === Number.NEGATIVE_INFINITY || direction === "two-sided";
  }

  if (direction === "two-sided") {
    return Math.abs(statistic) >= criticalValue;
  }

  if (direction === "greater") {
    return statistic >= criticalValue;
  }

  return statistic <= -criticalValue;
}

function computeTStatPValue(statistic: number | null, sampleSize: number, direction: TestDirection) {
  if (statistic === null || sampleSize <= 1 || !Number.isFinite(statistic)) {
    return null;
  }

  const degreesOfFreedom = sampleSize - 1;

  if (direction === "two-sided") {
    return Math.min(1, 2 * (1 - tDist.cdf(Math.abs(statistic), degreesOfFreedom)));
  }

  if (direction === "greater") {
    return 1 - tDist.cdf(statistic, degreesOfFreedom);
  }

  return tDist.cdf(statistic, degreesOfFreedom);
}

function computePooledTStatPValue(
  statistic: number | null,
  sampleSizeA: number,
  sampleSizeB: number,
  direction: TestDirection,
) {
  if (statistic === null || sampleSizeA <= 1 || sampleSizeB <= 1 || !Number.isFinite(statistic)) {
    return null;
  }

  const degreesOfFreedom = sampleSizeA + sampleSizeB - 2;

  if (direction === "two-sided") {
    return Math.min(1, 2 * (1 - tDist.cdf(Math.abs(statistic), degreesOfFreedom)));
  }

  if (direction === "greater") {
    return 1 - tDist.cdf(statistic, degreesOfFreedom);
  }

  return tDist.cdf(statistic, degreesOfFreedom);
}

function computeBinomialPValue(
  count: number,
  sampleSize: number,
  nullProbability: number,
  direction: TestDirection,
) {
  if (sampleSize <= 0) {
    return null;
  }

  if (direction === "greater") {
    return 1 - binomial.cdf(count - 1, sampleSize, nullProbability);
  }

  if (direction === "less") {
    return binomial.cdf(count, sampleSize, nullProbability);
  }

  const probabilities = Array.from({ length: sampleSize + 1 }, (_, k) =>
    binomial.pmf(k, sampleSize, nullProbability),
  );
  const observedProbability = probabilities[count] ?? 0;
  const threshold = observedProbability + 1e-15;

  return probabilities.reduce(
    (sum, probability) => (probability <= threshold ? sum + probability : sum),
    0,
  );
}

function computeChiSquareHomogeneityStatistic(sampleA: number[], sampleB: number[]) {
  if (sampleA.length === 0 || sampleB.length === 0) {
    return null;
  }

  const successesA = computeBinomialStatistic(sampleA);
  const successesB = computeBinomialStatistic(sampleB);
  const failuresA = sampleA.length - successesA;
  const failuresB = sampleB.length - successesB;
  const totalSuccesses = successesA + successesB;
  const totalFailures = failuresA + failuresB;
  const totalSampleSize = sampleA.length + sampleB.length;

  if (totalSampleSize <= 0 || totalSuccesses <= 0 || totalFailures <= 0) {
    return null;
  }

  const expectedASuccess = (sampleA.length * totalSuccesses) / totalSampleSize;
  const expectedAFailure = (sampleA.length * totalFailures) / totalSampleSize;
  const expectedBSuccess = (sampleB.length * totalSuccesses) / totalSampleSize;
  const expectedBFailure = (sampleB.length * totalFailures) / totalSampleSize;

  const expectedCounts = [expectedASuccess, expectedAFailure, expectedBSuccess, expectedBFailure];
  if (expectedCounts.some((count) => count <= 0)) {
    return null;
  }

  const observedCounts = [successesA, failuresA, successesB, failuresB];
  return observedCounts.reduce((sum, observed, index) => {
    const expected = expectedCounts[index];
    return sum + ((observed - expected) ** 2) / expected;
  }, 0);
}

function chiSquareSurvival(value: number, degreesOfFreedom: number) {
  if (!Number.isFinite(value) || value < 0 || degreesOfFreedom <= 0) {
    return null;
  }

  return 1 - chisquare.cdf(value, degreesOfFreedom);
}

function noncentralChiSquareSurvival(
  value: number,
  degreesOfFreedom: number,
  lambda: number,
) {
  if (!Number.isFinite(value) || value < 0 || degreesOfFreedom <= 0 || lambda < 0) {
    return null;
  }

  const halfLambda = lambda / 2;
  let weight = Math.exp(-halfLambda);
  let sum = 0;

  for (let k = 0; k < 1000; k += 1) {
    const df = degreesOfFreedom + 2 * k;
    const tail = chiSquareSurvival(value, df);
    if (tail !== null) {
      sum += weight * tail;
    }

    const nextWeight = weight * (halfLambda / (k + 1));
    if (nextWeight < 1e-12 && k > 20) {
      break;
    }
    weight = nextWeight;
  }

  return sum;
}

function exactChiSquareHomogeneityRejectionRate(
  truthGroupA: number,
  truthGroupB: number,
  sampleSizeA: number,
  sampleSizeB: number,
  alpha: number,
) {
  if (sampleSizeA <= 0 || sampleSizeB <= 0) {
    return null;
  }

  const criticalValue = chisquare.quantile(1 - alpha, 1);
  if (!Number.isFinite(criticalValue)) {
    return null;
  }

  const total = sampleSizeA + sampleSizeB;
  const pooledProbability = (sampleSizeA * truthGroupA + sampleSizeB * truthGroupB) / total;
  if (pooledProbability <= 0 || pooledProbability >= 1) {
    return null;
  }

  const lambda =
    (sampleSizeA * sampleSizeB / total) *
    ((truthGroupA - truthGroupB) ** 2) /
    (pooledProbability * (1 - pooledProbability));

  return noncentralChiSquareSurvival(criticalValue, 1, lambda);
}

function buildBinomialTestPlan(
  sampleSize: number,
  nullProbability: number,
  alpha: number,
  direction: TestDirection,
) {
  const rejectMask = Array.from({ length: sampleSize + 1 }, () => false);
  const pValues = Array.from({ length: sampleSize + 1 }, (_, count) =>
    computeBinomialPValue(count, sampleSize, nullProbability, direction),
  );

  for (let count = 0; count <= sampleSize; count += 1) {
    rejectMask[count] = (pValues[count] ?? 1) <= alpha;
  }

  const rejectionValues = rejectMask
    .map((reject, count) => (reject ? count : null))
    .filter((value): value is number => value !== null);

  const criticalLower = rejectionValues.length > 0 ? Math.min(...rejectionValues) : null;
  const criticalUpper = rejectionValues.length > 0 ? Math.max(...rejectionValues) : null;

  return {
    rejectMask,
    pValues,
    criticalLower,
    criticalUpper,
  };
}

export function exactRejectionRate(
  testKind: TestingKind,
  truthValue: number,
  nullValue: number,
  sd: number,
  sampleSize: number,
  alpha: number,
  direction: TestDirection,
) {
  if (testKind === "mean") {
    if (sampleSize <= 1 || sd <= 0) {
      return null;
    }

    const degreesOfFreedom = sampleSize - 1;
    const criticalValue = criticalT(alpha, direction, degreesOfFreedom);

    if (!Number.isFinite(criticalValue)) {
      return null;
    }

    const noncentrality = (truthValue - nullValue) / (sd / Math.sqrt(sampleSize));
    const tailProbability = (u: number) => {
      if (u < 0 || u >= 1) {
        return 0;
      }

      const transformedVariance = chisquare.quantile(u, degreesOfFreedom);
      if (!Number.isFinite(transformedVariance)) {
        return 0;
      }

      const scale = Math.sqrt(transformedVariance / degreesOfFreedom);

      if (direction === "two-sided") {
        return (
          (1 - normalCdf(criticalValue * scale - noncentrality, 0, 1)) +
          normalCdf(-criticalValue * scale - noncentrality, 0, 1)
        );
      }

      if (direction === "greater") {
        return 1 - normalCdf(criticalValue * scale - noncentrality, 0, 1);
      }

      return normalCdf(-criticalValue * scale - noncentrality, 0, 1);
    };

    return integrateUnitInterval(tailProbability);
  }

  if (sampleSize <= 0) {
    return null;
  }

  const { rejectMask } = buildBinomialTestPlan(sampleSize, nullValue, alpha, direction);
  const truthProbabilities = Array.from({ length: sampleSize + 1 }, (_, count) =>
    binomial.pmf(count, sampleSize, truthValue),
  );

  return truthProbabilities.reduce(
    (sum, probability, count) => (rejectMask[count] ? sum + probability : sum),
    0,
  );
}

export function exactPooledMeanDifferenceRejectionRate(
  truthDifference: number,
  nullDifference: number,
  sd: number,
  sampleSizeA: number,
  sampleSizeB: number,
  alpha: number,
  direction: TestDirection,
) {
  if (sampleSizeA <= 1 || sampleSizeB <= 1 || sd <= 0) {
    return null;
  }

  const degreesOfFreedom = sampleSizeA + sampleSizeB - 2;
  const criticalValue = criticalT(alpha, direction, degreesOfFreedom);

  if (!Number.isFinite(criticalValue)) {
    return null;
  }

  const noncentrality = (truthDifference - nullDifference) / (sd * Math.sqrt(1 / sampleSizeA + 1 / sampleSizeB));
  const tailProbability = (u: number) => {
    if (u < 0 || u >= 1) {
      return 0;
    }

    const transformedVariance = chisquare.quantile(u, degreesOfFreedom);
    if (!Number.isFinite(transformedVariance)) {
      return 0;
    }

    const scale = Math.sqrt(transformedVariance / degreesOfFreedom);

    if (direction === "two-sided") {
      return (
        (1 - normalCdf(criticalValue * scale - noncentrality, 0, 1)) +
        normalCdf(-criticalValue * scale - noncentrality, 0, 1)
      );
    }

    if (direction === "greater") {
      return 1 - normalCdf(criticalValue * scale - noncentrality, 0, 1);
    }

    return normalCdf(-criticalValue * scale - noncentrality, 0, 1);
  };

  return integrateUnitInterval(tailProbability);
}

function computeChiSquarePValue(statistic: number | null) {
  if (statistic === null || !Number.isFinite(statistic) || statistic < 0) {
    return null;
  }

  return 1 - chisquare.cdf(statistic, 1);
}

export interface TestingRunResult extends TestingSummary {}

export interface TwoGroupTestingRunResult extends TwoGroupTestingSummary {}

export function runTestingBatch(
  testKind: TestingKind,
  truthValue: number,
  nullValue: number,
  alternativeValue: number,
  sd: number,
  sampleSize: number,
  repetitions: number,
  existingStatistics: number[],
  existingRejectionCount: number,
  alpha: number,
  direction: TestDirection,
  randomStream: { next: () => number },
): TestingRunResult {
  const statistics = [...existingStatistics];
  let rejectionCount = existingRejectionCount;
  let latestSample: number[] | null = null;
  let latestStatistic: number | null = null;
  let latestReject: boolean | null = null;
  let latestPValue: number | null = null;

  if (testKind === "mean") {
    const degreesOfFreedom = sampleSize - 1;
    const criticalValue = criticalT(alpha, direction, degreesOfFreedom);

    for (let i = 0; i < repetitions; i += 1) {
      const sample = drawSample(
        {
          kind: "normal",
          params: {
            mean: truthValue,
            sd,
          },
        },
        sampleSize,
        randomStream,
      );

      const statistic = computeTStatistic(sample, nullValue);
      latestSample = sample;
      latestStatistic = statistic;
      latestReject = statistic === null ? null : shouldReject(statistic, criticalValue, direction);
      latestPValue = computeTStatPValue(statistic, sampleSize, direction);

      if (statistic !== null) {
        statistics.push(statistic);
        if (latestReject) {
          rejectionCount += 1;
        }
      }
    }

    return {
      statistics,
      empiricalRejectionRate: statistics.length > 0 ? rejectionCount / statistics.length : null,
      theoreticalRejectionRate: exactRejectionRate(
        testKind,
        truthValue,
        nullValue,
        sd,
        sampleSize,
        alpha,
        direction,
      ),
      criticalValue,
      criticalLower: null,
      criticalUpper: null,
      rejectionMask: null,
      rejectionCount,
      latestSample,
      latestStatistic,
      latestPValue,
      latestReject,
    };
  }

  const binomialPlan = buildBinomialTestPlan(sampleSize, nullValue, alpha, direction);

  for (let i = 0; i < repetitions; i += 1) {
    const sample = drawSample(
      {
        kind: "bernoulli",
        params: {
          p: truthValue,
        },
      },
      sampleSize,
      randomStream,
    );

    const statistic = computeBinomialStatistic(sample);
    latestSample = sample;
    latestStatistic = statistic;
    latestPValue = computeBinomialPValue(statistic, sampleSize, nullValue, direction);
    latestReject = (binomialPlan.pValues[statistic] ?? 1) <= alpha;

    statistics.push(statistic);
    if (latestReject) {
      rejectionCount += 1;
    }
  }

  return {
    statistics,
    empiricalRejectionRate: statistics.length > 0 ? rejectionCount / statistics.length : null,
    theoreticalRejectionRate: exactRejectionRate(
      testKind,
      truthValue,
      nullValue,
      sd,
      sampleSize,
      alpha,
      direction,
    ),
    criticalValue: null,
    criticalLower: binomialPlan.criticalLower,
    criticalUpper: binomialPlan.criticalUpper,
    rejectionMask: binomialPlan.rejectMask,
    rejectionCount,
    latestSample,
    latestStatistic,
    latestPValue,
    latestReject,
  };
}

export function runTwoGroupTestingBatch(
  population: TwoGroupMeanPopulationConfig,
  nullDifference: number,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existingStatistics: number[],
  existingRejectionCount: number,
  alpha: number,
  direction: TestDirection,
  randomStream: { next: () => number },
): TwoGroupTestingRunResult {
  const statistics = [...existingStatistics];
  let rejectionCount = existingRejectionCount;
  let latestSampleA: number[] | null = null;
  let latestSampleB: number[] | null = null;
  let latestDifference: number | null = null;
  let latestStatistic: number | null = null;
  let latestReject: boolean | null = null;
  let latestPValue: number | null = null;

  const degreesOfFreedom = sampleSizeA + sampleSizeB - 2;
  const criticalValue = criticalT(alpha, direction, degreesOfFreedom);
  for (let i = 0; i < repetitions; i += 1) {
    latestSampleA = drawSample(
      {
        kind: "normal",
        params: {
          mean: population.groupA.mean,
          sd: population.sd,
        },
      },
      sampleSizeA,
      randomStream,
    );
    latestSampleB = drawSample(
      {
        kind: "normal",
        params: {
          mean: population.groupB.mean,
          sd: population.sd,
        },
      },
      sampleSizeB,
      randomStream,
    );

    latestDifference = sampleMean(latestSampleA) - sampleMean(latestSampleB);
    latestStatistic = computePooledTStatistic(latestSampleA, latestSampleB, nullDifference);
    latestReject = latestStatistic === null ? null : shouldReject(latestStatistic, criticalValue, direction);
    latestPValue = computePooledTStatPValue(latestStatistic, sampleSizeA, sampleSizeB, direction);

    if (latestStatistic !== null) {
      statistics.push(latestStatistic);
      if (latestReject) {
        rejectionCount += 1;
      }
    }
  }

  const truthDifference = population.groupA.mean - population.groupB.mean;

  return {
    statistics,
    empiricalRejectionRate: statistics.length > 0 ? rejectionCount / statistics.length : null,
    theoreticalRejectionRate: exactPooledMeanDifferenceRejectionRate(
      truthDifference,
      nullDifference,
      population.sd,
      sampleSizeA,
      sampleSizeB,
      alpha,
      direction,
    ),
    criticalValue,
    criticalLower: null,
    criticalUpper: null,
    rejectionMask: null,
    rejectionCount,
    latestSampleA,
    latestSampleB,
    latestDifference,
    latestStatistic,
    latestPValue,
    latestReject,
  };
}

export function runTwoGroupProportionTestingBatch(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existingStatistics: number[],
  existingRejectionCount: number,
  alpha: number,
  randomStream: { next: () => number },
): TwoGroupProportionTestingRunResult {
  const statistics = [...existingStatistics];
  let rejectionCount = existingRejectionCount;
  let latestSampleA: number[] | null = null;
  let latestSampleB: number[] | null = null;
  let latestDifference: number | null = null;
  let latestStatistic: number | null = null;
  let latestReject: boolean | null = null;
  let latestPValue: number | null = null;
  const criticalValue = chisquare.quantile(1 - alpha, 1);

  for (let i = 0; i < repetitions; i += 1) {
    latestSampleA = drawSample(
      {
        kind: "bernoulli",
        params: {
          p: population.groupA.p,
        },
      },
      sampleSizeA,
      randomStream,
    );
    latestSampleB = drawSample(
      {
        kind: "bernoulli",
        params: {
          p: population.groupB.p,
        },
      },
      sampleSizeB,
      randomStream,
    );

    latestDifference = sampleMean(latestSampleA) - sampleMean(latestSampleB);
    latestStatistic = computeChiSquareHomogeneityStatistic(latestSampleA, latestSampleB);
    latestPValue = computeChiSquarePValue(latestStatistic);
    latestReject = latestPValue === null ? null : latestPValue <= alpha;

    if (latestStatistic !== null) {
      statistics.push(latestStatistic);
      if (latestReject) {
        rejectionCount += 1;
      }
    }
  }

  return {
    statistics,
    empiricalRejectionRate: statistics.length > 0 ? rejectionCount / statistics.length : null,
    theoreticalRejectionRate: exactChiSquareHomogeneityRejectionRate(
      population.groupA.p,
      population.groupB.p,
      sampleSizeA,
      sampleSizeB,
      alpha,
    ),
    criticalValue,
    criticalLower: null,
    criticalUpper: null,
    rejectionMask: null,
    rejectionCount,
    latestSampleA,
    latestSampleB,
    latestDifference,
    latestStatistic,
    latestPValue,
    latestReject,
  };
}
