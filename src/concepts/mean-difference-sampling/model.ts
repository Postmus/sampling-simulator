import { drawNormalSample } from "../../domain/distributions/normal";
import type { RNG } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";

export interface MeanDifferenceConfiguration {
  vehicleMean: number;
  trueEffect: number;
  sd: number;
  sampleSizePerGroup: number;
}

export interface MeanDifferenceResult {
  vehicleSample: number[];
  gelXSample: number[];
  vehicleSampleMean: number;
  gelXSampleMean: number;
  estimate: number;
}

export function gelXPopulationMean(configuration: MeanDifferenceConfiguration) {
  return configuration.vehicleMean + configuration.trueEffect;
}

export function simulateExperiment(
  configuration: MeanDifferenceConfiguration,
  rng: RNG,
): MeanDifferenceResult {
  const vehicleSample = drawNormalSample(
    { mean: configuration.vehicleMean, sd: configuration.sd },
    configuration.sampleSizePerGroup,
    rng,
  );
  const gelXSample = drawNormalSample(
    { mean: gelXPopulationMean(configuration), sd: configuration.sd },
    configuration.sampleSizePerGroup,
    rng,
  );
  const vehicleSampleMean = mean(vehicleSample);
  const gelXSampleMean = mean(gelXSample);
  return {
    vehicleSample,
    gelXSample,
    vehicleSampleMean,
    gelXSampleMean,
    estimate: gelXSampleMean - vehicleSampleMean,
  };
}

export function simulateExperimentBatch(
  configuration: MeanDifferenceConfiguration,
  count: number,
  rng: RNG,
) {
  return Array.from({ length: count }, () => simulateExperiment(configuration, rng));
}

export function theoreticalMeanDifferenceStandardError(
  configuration: MeanDifferenceConfiguration,
) {
  return configuration.sd * Math.sqrt(2 / configuration.sampleSizePerGroup);
}

export function empiricalMeanDifferenceStandardError(estimates: readonly number[]) {
  return estimates.length > 1 ? standardDeviation(estimates) : null;
}
