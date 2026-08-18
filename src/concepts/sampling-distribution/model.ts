import { drawNormalSample } from "../../domain/distributions/normal";
import type { RNG } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";

export interface SamplingConfiguration {
  mean: number;
  sd: number;
  sampleSize: number;
}

export interface SamplingResult {
  sample: number[];
  estimate: number;
}

export function simulateSample(configuration: SamplingConfiguration, rng: RNG): SamplingResult {
  const sample = drawNormalSample(
    { mean: configuration.mean, sd: configuration.sd },
    configuration.sampleSize,
    rng,
  );
  return { sample, estimate: mean(sample) };
}

export function simulateBatch(configuration: SamplingConfiguration, count: number, rng: RNG) {
  return Array.from({ length: count }, () => simulateSample(configuration, rng));
}

export function theoreticalStandardError(configuration: SamplingConfiguration) {
  return configuration.sd / Math.sqrt(configuration.sampleSize);
}

export function empiricalStandardError(estimates: readonly number[]) {
  return estimates.length > 1 ? standardDeviation(estimates) : null;
}
