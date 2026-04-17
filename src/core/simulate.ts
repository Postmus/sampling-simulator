import { drawSample } from "./populations";
import {
  practicalMeanDifferenceInterval,
  practicalMeanInterval,
  practicalProportionDifferenceInterval,
  practicalProportionInterval,
} from "./inference";
import { createRng } from "./rng";
import { sampleMean, sampleProportion, standardDeviation } from "./statistics";
import {
  theoreticalMean,
  theoreticalMeanDifference,
  theoreticalMeanDifferenceSE,
  theoreticalSE,
  theoreticalProportionDifference,
  theoreticalProportionDifferenceSE,
} from "./theory";
import type {
  PopulationConfig,
  SimulationSummary,
  TeachingMode,
  TwoGroupMeanPopulationConfig,
  TwoGroupProportionPopulationConfig,
  TwoGroupSimulationSummary,
} from "./types";

function buildNormalPopulation(mean: number, sd: number): PopulationConfig {
  return {
    kind: "normal",
    params: {
      mean,
      sd,
    },
  };
}

function buildBernoulliPopulation(p: number): PopulationConfig {
  return {
    kind: "bernoulli",
    params: {
      p,
    },
  };
}

export function computeEstimate(mode: TeachingMode, sample: number[]): number {
  return mode === "mean" ? sampleMean(sample) : sampleProportion(sample);
}

export function drawSingleSample(
  mode: TeachingMode,
  population: PopulationConfig,
  sampleSize: number,
  seed: number,
) {
  const rng = createRng(seed);
  const sample = drawSample(population, sampleSize, rng);
  return {
    sample,
    estimate: computeEstimate(mode, sample),
  };
}

export function simulateAdditionalEstimates(
  mode: TeachingMode,
  population: PopulationConfig,
  sampleSize: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): SimulationSummary {
  const estimates = [...existing];
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalMean(mode, population);

  for (let i = 0; i < repetitions; i += 1) {
    const sample = drawSample(population, sampleSize, randomStream);
    estimates.push(computeEstimate(mode, sample));

    if (target !== null) {
      const interval =
        mode === "mean" ? practicalMeanInterval(sample) : practicalProportionInterval(sample);
      if (interval !== null && interval.lower <= target && target <= interval.upper) {
        practicalCoverageCount += 1;
      }
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalSE(mode, population, sampleSize),
    practicalCoverageCount,
  };
}

export interface SamplingRunResult extends SimulationSummary {
  latestSample: number[] | null;
  latestEstimate: number | null;
}

export function runSamplingBatch(
  mode: TeachingMode,
  population: PopulationConfig,
  sampleSize: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): SamplingRunResult {
  const estimates = [...existing];
  let latestSample: number[] | null = null;
  let latestEstimate: number | null = null;
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalMean(mode, population);

  for (let i = 0; i < repetitions; i += 1) {
    latestSample = drawSample(population, sampleSize, randomStream);
    latestEstimate = computeEstimate(mode, latestSample);
    estimates.push(latestEstimate);

    if (target !== null) {
      const interval =
        mode === "mean" ? practicalMeanInterval(latestSample) : practicalProportionInterval(latestSample);
      if (interval !== null && interval.lower <= target && target <= interval.upper) {
        practicalCoverageCount += 1;
      }
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalSE(mode, population, sampleSize),
    practicalCoverageCount,
    latestSample,
    latestEstimate,
  };
}

export function computeMeanDifference(sampleA: number[], sampleB: number[]): number {
  return sampleMean(sampleA) - sampleMean(sampleB);
}

export function simulateAdditionalTwoGroupEstimates(
  population: TwoGroupMeanPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): TwoGroupSimulationSummary {
  const estimates = [...existing];
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalMeanDifference(population);

  for (let i = 0; i < repetitions; i += 1) {
    const sampleA = drawSample(
      buildNormalPopulation(population.groupA.mean, population.sd),
      sampleSizeA,
      randomStream,
    );
    const sampleB = drawSample(
      buildNormalPopulation(population.groupB.mean, population.sd),
      sampleSizeB,
      randomStream,
    );
    const difference = computeMeanDifference(sampleA, sampleB);
    estimates.push(difference);

    const interval = practicalMeanDifferenceInterval(sampleA, sampleB);
    if (interval !== null && interval.lower <= target && target <= interval.upper) {
      practicalCoverageCount += 1;
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalMeanDifferenceSE(population, sampleSizeA, sampleSizeB),
    practicalCoverageCount,
    latestSampleA: null,
    latestSampleB: null,
    latestDifference: null,
  };
}

export interface TwoGroupSamplingRunResult extends TwoGroupSimulationSummary {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}

export function runTwoGroupSamplingBatch(
  population: TwoGroupMeanPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): TwoGroupSamplingRunResult {
  const estimates = [...existing];
  let latestSampleA: number[] | null = null;
  let latestSampleB: number[] | null = null;
  let latestDifference: number | null = null;
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalMeanDifference(population);

  for (let i = 0; i < repetitions; i += 1) {
    latestSampleA = drawSample(
      buildNormalPopulation(population.groupA.mean, population.sd),
      sampleSizeA,
      randomStream,
    );
    latestSampleB = drawSample(
      buildNormalPopulation(population.groupB.mean, population.sd),
      sampleSizeB,
      randomStream,
    );
    latestDifference = computeMeanDifference(latestSampleA, latestSampleB);
    estimates.push(latestDifference);

    const interval = practicalMeanDifferenceInterval(latestSampleA, latestSampleB);
    if (interval !== null && interval.lower <= target && target <= interval.upper) {
      practicalCoverageCount += 1;
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalMeanDifferenceSE(population, sampleSizeA, sampleSizeB),
    practicalCoverageCount,
    latestSampleA,
    latestSampleB,
    latestDifference,
  };
}

export function computeProportionDifference(sampleA: number[], sampleB: number[]): number {
  return sampleProportion(sampleA) - sampleProportion(sampleB);
}

export function simulateAdditionalTwoGroupProportionEstimates(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): TwoGroupSimulationSummary {
  const estimates = [...existing];
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalProportionDifference(population);

  for (let i = 0; i < repetitions; i += 1) {
    const sampleA = drawSample(
      buildBernoulliPopulation(population.groupA.p),
      sampleSizeA,
      randomStream,
    );
    const sampleB = drawSample(
      buildBernoulliPopulation(population.groupB.p),
      sampleSizeB,
      randomStream,
    );
    const difference = computeProportionDifference(sampleA, sampleB);
    estimates.push(difference);

    const interval = practicalProportionDifferenceInterval(sampleA, sampleB);
    if (interval !== null && interval.lower <= target && target <= interval.upper) {
      practicalCoverageCount += 1;
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalProportionDifferenceSE(population, sampleSizeA, sampleSizeB),
    practicalCoverageCount,
    latestSampleA: null,
    latestSampleB: null,
    latestDifference: null,
  };
}

export interface TwoGroupProportionSamplingRunResult extends TwoGroupSimulationSummary {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}

export function runTwoGroupProportionSamplingBatch(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  repetitions: number,
  existing: number[],
  existingPracticalCoverageCount: number,
  randomStream: { next: () => number },
): TwoGroupProportionSamplingRunResult {
  const estimates = [...existing];
  let latestSampleA: number[] | null = null;
  let latestSampleB: number[] | null = null;
  let latestDifference: number | null = null;
  let practicalCoverageCount = existingPracticalCoverageCount;
  const target = theoreticalProportionDifference(population);

  for (let i = 0; i < repetitions; i += 1) {
    latestSampleA = drawSample(
      buildBernoulliPopulation(population.groupA.p),
      sampleSizeA,
      randomStream,
    );
    latestSampleB = drawSample(
      buildBernoulliPopulation(population.groupB.p),
      sampleSizeB,
      randomStream,
    );
    latestDifference = computeProportionDifference(latestSampleA, latestSampleB);
    estimates.push(latestDifference);

    const interval = practicalProportionDifferenceInterval(latestSampleA, latestSampleB);
    if (interval !== null && interval.lower <= target && target <= interval.upper) {
      practicalCoverageCount += 1;
    }
  }

  return {
    estimates,
    empiricalMean: estimates.length > 0 ? sampleMean(estimates) : null,
    empiricalSE: estimates.length > 1 ? standardDeviation(estimates) : null,
    theoreticalMean: target,
    theoreticalSE: theoreticalProportionDifferenceSE(population, sampleSizeA, sampleSizeB),
    practicalCoverageCount,
    latestSampleA,
    latestSampleB,
    latestDifference,
  };
}
