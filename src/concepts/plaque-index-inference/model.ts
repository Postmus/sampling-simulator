import { drawNormalSample } from "../../domain/distributions/normal";
import { studentTCritical95, twoSidedStudentTPValue } from "../../domain/distributions/studentT";
import type { RNG } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";

export interface Configuration {
  hypothesis: "h0" | "h1";
  controlMean: number;
  sd: number;
  sampleSize: number;
  alternativeDifference: number;
}

export const DEFAULT_CONFIGURATION: Configuration = {
  hypothesis: "h0", controlMean: 1.5, sd: 0.6, sampleSize: 24, alternativeDifference: -0.3,
};
export const ALPHA = 0.05;
export const MAX_EXPERIMENTS = 20_000;

export interface Estimate {
  difference: number;
  t: number;
  rejected: boolean;
}

export interface Experiment extends Estimate {
  control: number[];
  treatment: number[];
  controlMean: number;
  treatmentMean: number;
  pooledSd: number;
  estimatedSe: number;
  pValue: number;
}

export function trueDifference(configuration: Configuration) {
  return configuration.hypothesis === "h0" ? 0 : configuration.alternativeDifference;
}

export function theoreticalSe(configuration: Configuration) {
  return configuration.sd * Math.sqrt(2 / configuration.sampleSize);
}

export function treatmentPopulationMean(configuration: Configuration) {
  return configuration.controlMean + trueDifference(configuration);
}

/** A common, close-up score scale. Keep it stable as SD changes, but include every drawn patient. */
export function populationDomain(configuration: Configuration, latest: Experiment | null): [number, number] {
  const treatmentMean = treatmentPopulationMean(configuration);
  let low = Math.min(configuration.controlMean, treatmentMean) - 3 * DEFAULT_CONFIGURATION.sd;
  let high = Math.max(configuration.controlMean, treatmentMean) + 3 * DEFAULT_CONFIGURATION.sd;
  if (latest) {
    for (const value of [...latest.control, ...latest.treatment]) {
      low = Math.min(low, value - 0.05);
      high = Math.max(high, value + 0.05);
    }
  }
  return [low, high];
}

export function validateConfiguration(configuration: Configuration) {
  return (configuration.hypothesis === "h0" || configuration.hypothesis === "h1")
    && Number.isFinite(configuration.controlMean) && configuration.controlMean >= 0 && configuration.controlMean <= 3
    && Number.isFinite(configuration.sd) && configuration.sd >= 0.05 && configuration.sd <= 1.2
    && Number.isInteger(configuration.sampleSize) && configuration.sampleSize >= 2 && configuration.sampleSize <= 500
    && Number.isFinite(configuration.alternativeDifference)
    && Math.abs(configuration.alternativeDifference) >= 0.05 && Math.abs(configuration.alternativeDifference) <= 0.8;
}

export function summarizeExperiment(
  control: number[], treatment: number[], criticalValue: number,
): Experiment {
  if (control.length < 2 || control.length !== treatment.length) {
    throw new Error("Two equally sized samples with at least two observations are required.");
  }
  const controlMean = mean(control);
  const treatmentMean = mean(treatment);
  const difference = treatmentMean - controlMean;
  const pooledSd = Math.sqrt((standardDeviation(control) ** 2 + standardDeviation(treatment) ** 2) / 2);
  const estimatedSe = pooledSd * Math.sqrt(2 / control.length);
  // A continuous Normal model has probability zero of a zero sample variance.
  // Explicitly handle degenerate samples without inventing a finite t-statistic.
  const t = estimatedSe > 0 ? difference / estimatedSe : difference === 0 ? 0 : Math.sign(difference) * Infinity;
  const pValue = twoSidedStudentTPValue(t, 2 * control.length - 2);
  return { control, treatment, controlMean, treatmentMean, difference, pooledSd,
    estimatedSe, t, pValue, rejected: Math.abs(t) > criticalValue };
}

export function simulateExperiment(configuration: Configuration, rng: RNG, criticalValue?: number) {
  if (!validateConfiguration(configuration)) throw new Error("Invalid plaque-index configuration.");
  const control = drawNormalSample({ mean: configuration.controlMean, sd: configuration.sd }, configuration.sampleSize, rng);
  const treatment = drawNormalSample({ mean: treatmentPopulationMean(configuration), sd: configuration.sd }, configuration.sampleSize, rng);
  return summarizeExperiment(control, treatment, criticalValue ?? studentTCritical95(2 * configuration.sampleSize - 2));
}

export function experimentEstimate(experiment: Experiment): Estimate {
  return { difference: experiment.difference, t: experiment.t, rejected: experiment.rejected };
}

export function empiricalSe(estimates: readonly Estimate[]) {
  return estimates.length < 2 ? null : standardDeviation(estimates.map((result) => result.difference));
}

/** Empirical plot ranges include every result, zero, and the two-sided rejection boundaries. */
export function samplingDomain(kind: "difference" | "t", values: readonly number[], critical: number): [number, number] {
  if (values.length === 0) return kind === "difference" ? [-0.5, 0.5] : [-critical * 1.25, critical * 1.25];
  let low = kind === "t" ? -critical : 0;
  let high = kind === "t" ? critical : 0;
  for (const value of values) { low = Math.min(low, value); high = Math.max(high, value); }
  const minimumSpan = kind === "t" ? 2 * critical : 0.2;
  const span = Math.max(minimumSpan, high - low);
  const centre = (low + high) / 2;
  return [centre - span * 0.58, centre + span * 0.58];
}

/** Every observation is counted, including values beyond an initially proposed axis. */
export function histogram(values: readonly number[], domain: [number, number], bins = 36) {
  const width = (domain[1] - domain[0]) / bins;
  const counts = Array<number>(bins).fill(0);
  for (const value of values) {
    const index = Math.max(0, Math.min(bins - 1, Math.floor((value - domain[0]) / width)));
    counts[index] += 1;
  }
  return counts.map((count, index) => ({
    low: domain[0] + index * width, high: domain[0] + (index + 1) * width,
    count, density: values.length ? count / (values.length * width) : 0,
  }));
}
