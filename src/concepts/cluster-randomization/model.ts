import { drawNormal } from "../../domain/distributions/normal";
import { studentTCritical95, twoSidedStudentTPValue } from "../../domain/distributions/studentT";
import type { RNG } from "../../domain/rng";
import { mean } from "../../domain/statistics";

export const HOSPITALS = 6;
export const PATIENTS_PER_HOSPITAL = 20;
export const HOSPITALS_PER_ARM = HOSPITALS / 2;
export const CONTROL_MEAN = 130;
export const ALPHA = 0.05;
export const MAX_TRIALS = 20_000;
export const ORDINARY_DF = HOSPITALS * PATIENTS_PER_HOSPITAL - 2;
export const MIXED_DF = HOSPITALS - 2;
const ORDINARY_CRITICAL = studentTCritical95(ORDINARY_DF);
const MIXED_CRITICAL = studentTCritical95(MIXED_DF);

export interface Configuration {
  hypothesis: "h0" | "h1";
  totalSD: number;
  icc: number;
  alternativeEffect: number;
}

export const DEFAULT_CONFIGURATION: Configuration = {
  hypothesis: "h0", totalSD: 12, icc: 0.3, alternativeEffect: -5,
};

export interface Hospital {
  id: number;
  treated: boolean;
  outcomes: number[];
  sampleMean: number;
}

export interface Analysis {
  estimate: number;
  se: number;
  df: number;
  low: number;
  high: number;
  pValue: number;
  rejected: boolean;
}

export interface Trial {
  hospitals: Hospital[];
  ordinary: Analysis;
  mixed: Analysis;
  hospitalVariance: number;
  residualVariance: number;
  boundaryFit: boolean;
}

export interface TrialSummary {
  estimate: number;
  ordinaryRejected: boolean;
  mixedRejected: boolean;
  ordinaryCovered: boolean;
  mixedCovered: boolean;
}

export function trueEffect(configuration: Configuration) {
  return configuration.hypothesis === "h0" ? 0 : configuration.alternativeEffect;
}

export function varianceComponents(configuration: Configuration) {
  const variance = configuration.totalSD ** 2;
  return { hospital: variance * configuration.icc, residual: variance * (1 - configuration.icc) };
}

export function validateConfiguration(configuration: Configuration) {
  return (configuration.hypothesis === "h0" || configuration.hypothesis === "h1")
    && Number.isFinite(configuration.totalSD) && configuration.totalSD >= 1 && configuration.totalSD <= 40
    && Number.isFinite(configuration.icc) && configuration.icc >= 0.1 && configuration.icc <= 0.9
    && Number.isFinite(configuration.alternativeEffect) && Math.abs(configuration.alternativeEffect) >= 0.5
    && Math.abs(configuration.alternativeEffect) <= 30;
}

function inference(estimate: number, se: number, df: number, critical: number): Analysis {
  const pValue = se === 0 ? (estimate === 0 ? 1 : 0) : twoSidedStudentTPValue(estimate / se, df);
  return { estimate, se, df, low: estimate - critical * se, high: estimate + critical * se,
    pValue, rejected: pValue < ALPHA };
}

/** Balanced Gaussian random-intercept REML, with a nonnegative hospital variance.
 * Interior fits equal a pooled t-test on hospital means. At the zero-variance
 * boundary REML pools both residual sums of squares; the pre-specified t(4)
 * reference is retained, providing conservative small-sample inference there.
 * Fitting uses the observed data only, never the generating ICC or total SD.
 */
export function analyseHospitals(hospitals: Hospital[]): Trial {
  if (hospitals.length !== HOSPITALS
    || hospitals.filter((hospital) => hospital.treated).length !== HOSPITALS_PER_ARM
    || hospitals.some((hospital) => hospital.outcomes.length !== PATIENTS_PER_HOSPITAL
      || hospital.outcomes.some((value) => !Number.isFinite(value)))) {
    throw new Error("Expected six hospitals, three per arm, with twenty finite outcomes each.");
  }
  const observed = hospitals.map((hospital) => ({ ...hospital, sampleMean: mean(hospital.outcomes) }));
  const controlMean = mean(observed.filter((hospital) => !hospital.treated).map((hospital) => hospital.sampleMean));
  const treatmentMean = mean(observed.filter((hospital) => hospital.treated).map((hospital) => hospital.sampleMean));
  const estimate = treatmentMean - controlMean;
  const withinSS = observed.reduce((sum, hospital) => sum + hospital.outcomes.reduce(
    (subtotal, outcome) => subtotal + (outcome - hospital.sampleMean) ** 2, 0), 0);
  const betweenSS = PATIENTS_PER_HOSPITAL * observed.reduce((sum, hospital) => sum
    + (hospital.sampleMean - (hospital.treated ? treatmentMean : controlMean)) ** 2, 0);
  const withinMS = withinSS / (HOSPITALS * (PATIENTS_PER_HOSPITAL - 1));
  const betweenMS = betweenSS / MIXED_DF;
  const ordinaryVariance = (withinSS + betweenSS) / ORDINARY_DF;
  const boundaryFit = betweenMS <= withinMS;
  const residualVariance = boundaryFit ? ordinaryVariance : withinMS;
  const hospitalVariance = boundaryFit ? 0 : (betweenMS - withinMS) / PATIENTS_PER_HOSPITAL;
  const ordinarySE = Math.sqrt(2 * ordinaryVariance / (HOSPITALS_PER_ARM * PATIENTS_PER_HOSPITAL));
  const mixedSE = Math.sqrt(2 * (hospitalVariance + residualVariance / PATIENTS_PER_HOSPITAL) / HOSPITALS_PER_ARM);
  return {
    hospitals: observed,
    ordinary: inference(estimate, ordinarySE, ORDINARY_DF, ORDINARY_CRITICAL),
    mixed: inference(estimate, mixedSE, MIXED_DF, MIXED_CRITICAL),
    hospitalVariance, residualVariance, boundaryFit,
  };
}

export function simulateTrial(configuration: Configuration, rng: RNG): Trial {
  if (!validateConfiguration(configuration)) throw new Error("Invalid clustered-data configuration.");
  const ids = Array.from({ length: HOSPITALS }, (_, id) => id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng.next() * (index + 1));
    [ids[index], ids[other]] = [ids[other], ids[index]];
  }
  const treatedIds = new Set(ids.slice(0, HOSPITALS_PER_ARM));
  const variances = varianceComponents(configuration);
  const hospitals = Array.from({ length: HOSPITALS }, (_, id) => {
    const treated = treatedIds.has(id);
    const hospitalEffect = drawNormal({ mean: 0, sd: Math.sqrt(variances.hospital) }, rng);
    const expected = CONTROL_MEAN + hospitalEffect + (treated ? trueEffect(configuration) : 0);
    const outcomes = Array.from({ length: PATIENTS_PER_HOSPITAL }, () => drawNormal(
      { mean: expected, sd: Math.sqrt(variances.residual) }, rng));
    return { id, treated, outcomes, sampleMean: mean(outcomes) };
  });
  return analyseHospitals(hospitals);
}

export function summariseTrial(trial: Trial, effect: number): TrialSummary {
  return {
    estimate: trial.ordinary.estimate,
    ordinaryRejected: trial.ordinary.rejected,
    mixedRejected: trial.mixed.rejected,
    ordinaryCovered: trial.ordinary.low <= effect && trial.ordinary.high >= effect,
    mixedCovered: trial.mixed.low <= effect && trial.mixed.high >= effect,
  };
}

export function histogram(values: readonly number[], domain: [number, number], count = 32) {
  const width = (domain[1] - domain[0]) / count;
  const bins = Array.from({ length: count }, (_, index) => ({ low: domain[0] + index * width, high: domain[0] + (index + 1) * width, count: 0 }));
  for (const value of values) {
    const index = Math.max(0, Math.min(count - 1, Math.floor((value - domain[0]) / width)));
    bins[index].count += 1;
  }
  return bins;
}

export function paddedDomain(values: readonly number[], fallback: [number, number]): [number, number] {
  let low = fallback[0], high = fallback[1];
  for (const value of values) { low = Math.min(low, value); high = Math.max(high, value); }
  const padding = Math.max((high - low) * 0.08, 0.5);
  return [low - padding, high + padding];
}

export function outcomeDomain(configuration: Configuration, trial: Trial | null): [number, number] {
  const effect = trueEffect(configuration);
  return paddedDomain(trial?.hospitals.flatMap((hospital) => hospital.outcomes) ?? [],
    [CONTROL_MEAN + Math.min(0, effect) - 3 * configuration.totalSD,
      CONTROL_MEAN + Math.max(0, effect) + 3 * configuration.totalSD]);
}

/** Tukey hinges and 1.5-IQR whiskers, matching R's default boxplot.stats(). */
export function boxPlotSummary(values: readonly number[]) {
  if (values.length === 0) return null;
  if (values.some((value) => !Number.isFinite(value))) throw new Error("Boxplots require finite observations.");
  const sorted = [...values].sort((first, second) => first - second);
  const n = sorted.length;
  const at = (position: number) => (sorted[Math.floor(position) - 1] + sorted[Math.ceil(position) - 1]) / 2;
  const hinge = Math.floor((n + 3) / 2) / 2;
  const q1 = at(hinge), median = at((n + 1) / 2), q3 = at(n + 1 - hinge);
  const iqr = q3 - q1;
  const low = sorted.find((value) => value >= q1 - 1.5 * iqr)!;
  const high = [...sorted].reverse().find((value) => value <= q3 + 1.5 * iqr)!;
  return { n, q1, median, q3, low, high, mean: mean(sorted), outliers: sorted.filter((value) => value < low || value > high) };
}
