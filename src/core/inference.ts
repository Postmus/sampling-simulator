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
