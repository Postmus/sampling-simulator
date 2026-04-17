import { standardDeviation } from "./statistics";
import tDist from "@stdlib/stats-base-dists-t";

export interface IntervalSummary {
  lower: number;
  upper: number;
  margin: number;
  standardError: number;
  center: number;
}

export function tCritical95(df: number): number {
  if (df <= 0) {
    return Number.NaN;
  }

  return tDist.quantile(0.975, df);
}

export function theoreticalMeanInterval(
  estimate: number | null,
  theoreticalSE: number | null,
): IntervalSummary | null {
  if (estimate === null || theoreticalSE === null) {
    return null;
  }

  const margin = 1.96 * theoreticalSE;
  return {
    lower: estimate - margin,
    upper: estimate + margin,
    margin,
    standardError: theoreticalSE,
    center: estimate,
  };
}

export function practicalMeanInterval(sample: number[]): (IntervalSummary & {
  sampleSD: number;
  tCritical: number;
}) | null {
  if (sample.length < 2) {
    return null;
  }

  const center = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  const sampleSD = standardDeviation(sample);
  const standardError = sampleSD / Math.sqrt(sample.length);
  const tValue = tCritical95(sample.length - 1);
  const margin = tValue * standardError;

  return {
    lower: center - margin,
    upper: center + margin,
    margin,
    standardError,
    center,
    sampleSD,
    tCritical: tValue,
  };
}

export function practicalProportionInterval(sample: number[]): IntervalSummary | null {
  if (sample.length === 0) {
    return null;
  }

  const center = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  const standardError = Math.sqrt((center * (1 - center)) / sample.length);
  const margin = 1.96 * standardError;

  return {
    lower: center - margin,
    upper: center + margin,
    margin,
    standardError,
    center,
  };
}

export function practicalMeanDifferenceInterval(sampleA: number[], sampleB: number[]): IntervalSummary | null {
  if (sampleA.length < 2 || sampleB.length < 2) {
    return null;
  }

  const meanA = sampleA.reduce((sum, value) => sum + value, 0) / sampleA.length;
  const meanB = sampleB.reduce((sum, value) => sum + value, 0) / sampleB.length;
  const sampleSDA = standardDeviation(sampleA);
  const sampleSDB = standardDeviation(sampleB);
  const pooledVariance =
    (((sampleA.length - 1) * sampleSDA ** 2) + ((sampleB.length - 1) * sampleSDB ** 2)) /
    (sampleA.length + sampleB.length - 2);
  const standardError = Math.sqrt(pooledVariance * (1 / sampleA.length + 1 / sampleB.length));
  const center = meanA - meanB;
  const margin = tCritical95(sampleA.length + sampleB.length - 2) * standardError;

  return {
    lower: center - margin,
    upper: center + margin,
    margin,
    standardError,
    center,
  };
}

export function practicalProportionDifferenceInterval(
  sampleA: number[],
  sampleB: number[],
): IntervalSummary | null {
  if (sampleA.length === 0 || sampleB.length === 0) {
    return null;
  }

  const proportionA = sampleA.reduce((sum, value) => sum + value, 0) / sampleA.length;
  const proportionB = sampleB.reduce((sum, value) => sum + value, 0) / sampleB.length;
  const center = proportionA - proportionB;
  const standardError = Math.sqrt(
    (proportionA * (1 - proportionA)) / sampleA.length +
      (proportionB * (1 - proportionB)) / sampleB.length,
  );
  const margin = 1.96 * standardError;

  return {
    lower: center - margin,
    upper: center + margin,
    margin,
    standardError,
    center,
  };
}

export function pooledStandardDeviation(sampleA: number[], sampleB: number[]): number | null {
  if (sampleA.length < 2 || sampleB.length < 2) {
    return null;
  }

  const sampleSDA = standardDeviation(sampleA);
  const sampleSDB = standardDeviation(sampleB);
  const pooledVariance =
    (((sampleA.length - 1) * sampleSDA ** 2) + ((sampleB.length - 1) * sampleSDB ** 2)) /
    (sampleA.length + sampleB.length - 2);

  return Math.sqrt(pooledVariance);
}

export function pooledMeanDifferenceSE(sampleA: number[], sampleB: number[]): number | null {
  if (sampleA.length < 2 || sampleB.length < 2) {
    return null;
  }

  const pooledSD = pooledStandardDeviation(sampleA, sampleB);
  if (pooledSD === null) {
    return null;
  }

  return pooledSD * Math.sqrt(1 / sampleA.length + 1 / sampleB.length);
}

export function proportionDifferenceSE(sampleA: number[], sampleB: number[]): number | null {
  if (sampleA.length === 0 || sampleB.length === 0) {
    return null;
  }

  const proportionA = sampleA.reduce((sum, value) => sum + value, 0) / sampleA.length;
  const proportionB = sampleB.reduce((sum, value) => sum + value, 0) / sampleB.length;

  return Math.sqrt(
    (proportionA * (1 - proportionA)) / sampleA.length +
      (proportionB * (1 - proportionB)) / sampleB.length,
  );
}
