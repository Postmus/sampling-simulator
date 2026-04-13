import { drawSample } from "./populations";
import { practicalMeanInterval, practicalProportionInterval } from "./inference";
import { createRng } from "./rng";
import { sampleMean, sampleProportion, standardDeviation } from "./statistics";
import { theoreticalMean, theoreticalSE } from "./theory";
import type { PopulationConfig, SimulationSummary, TeachingMode } from "./types";

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
