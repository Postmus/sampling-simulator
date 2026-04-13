import { standardDeviation } from "./statistics";

const T_CRITICAL_975: number[] = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228,
  2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086,
  2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

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

  if (df <= T_CRITICAL_975.length) {
    return T_CRITICAL_975[df - 1];
  }

  if (df <= 40) {
    return 2.021;
  }

  if (df <= 60) {
    return 2.0;
  }

  if (df <= 80) {
    return 1.99;
  }

  if (df <= 120) {
    return 1.98;
  }

  return 1.96;
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
