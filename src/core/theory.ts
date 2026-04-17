import type {
  PopulationConfig,
  TeachingMode,
  TwoGroupMeanPopulationConfig,
  TwoGroupProportionPopulationConfig,
} from "./types";

export function theoreticalMean(
  mode: TeachingMode,
  population: PopulationConfig,
): number | null {
  if (mode === "mean" && population.kind !== "bernoulli") {
    return population.params.mean;
  }

  if (mode === "proportion" && population.kind === "bernoulli") {
    return population.params.p;
  }

  return null;
}

export function theoreticalSE(
  mode: TeachingMode,
  population: PopulationConfig,
  sampleSize: number,
): number | null {
  if (sampleSize <= 0) {
    return null;
  }

  if (mode === "mean" && population.kind !== "bernoulli") {
    return population.params.sd / Math.sqrt(sampleSize);
  }

  if (mode === "proportion" && population.kind === "bernoulli") {
    const { p } = population.params;
    return Math.sqrt((p * (1 - p)) / sampleSize);
  }

  return null;
}

export function theoreticalMeanDifference(
  population: TwoGroupMeanPopulationConfig,
): number {
  return population.groupA.mean - population.groupB.mean;
}

export function theoreticalMeanDifferenceSE(
  population: TwoGroupMeanPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
): number | null {
  if (sampleSizeA <= 0 || sampleSizeB <= 0) {
    return null;
  }

  return population.sd * Math.sqrt(1 / sampleSizeA + 1 / sampleSizeB);
}

export function theoreticalProportionDifference(
  population: TwoGroupProportionPopulationConfig,
): number {
  return population.groupA.p - population.groupB.p;
}

export function theoreticalProportionDifferenceSE(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
): number | null {
  if (sampleSizeA <= 0 || sampleSizeB <= 0) {
    return null;
  }

  return Math.sqrt(
    (population.groupA.p * (1 - population.groupA.p)) / sampleSizeA +
      (population.groupB.p * (1 - population.groupB.p)) / sampleSizeB,
  );
}
