import type { PopulationConfig, TeachingMode } from "./types";

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
