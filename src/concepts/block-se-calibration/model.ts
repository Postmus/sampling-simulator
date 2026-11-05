import { drawNormal } from "../../domain/distributions/normal";
import type { RNG } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";

export const CENTER_EFFECTS = [-17, 16, 8, -29, 27, -5] as const;
export const BASELINE = 360;
export const CENTERS = CENTER_EFFECTS.length;
export const PER_CENTER = 20;
export const PER_ARM = CENTERS * PER_CENTER / 2;
export const MAX_DATASETS = 20_000;
export const BATCH_SIZE = 1_000;
export const MIN_CALIBRATION_DATASETS = BATCH_SIZE;
export const INITIAL_SEED = 158;
export type AnalysisKey = "treatment" | "center";
export interface Configuration { effect: number; residualSD: number }
export const DEFAULT_CONFIGURATION: Configuration = { effect: 10, residualSD: 24 };
export interface Patient { center: number; treated: boolean; outcome: number }
export interface Analysis { estimate: number; se: number; residualSD: number; df: number }
export type Result = Record<AnalysisKey, Analysis>;
export interface Dataset { patients: Patient[]; result: Result }

export function validConfiguration(c: Configuration) {
  return Number.isFinite(c.effect) && Math.abs(c.effect) <= 50
    && Number.isFinite(c.residualSD) && c.residualSD >= 1 && c.residualSD <= 60;
}

/** Exact OLS for the specified balanced additive design, not a random-intercept fit. */
export function analyse(patients: Patient[]): Result {
  const groups = CENTER_EFFECTS.map((_, j) => patients.filter(p => p.center === j));
  if (patients.length !== CENTERS * PER_CENTER || groups.some(group => group.length !== PER_CENTER
    || group.filter(p => p.treated).length !== PER_CENTER / 2)
    || patients.some(p => !Number.isFinite(p.outcome))) throw new Error("Expected six centers with ten patients per treatment in each.");
  const groupMeans = [false, true].map(t => mean(patients.filter(p => p.treated === t).map(p => p.outcome)));
  const estimate = groupMeans[1] - groupMeans[0];
  const centerMeans = groups.map(group => mean(group.map(p => p.outcome)));
  const treatmentSS = patients.reduce((sum, p) => sum + (p.outcome - groupMeans[Number(p.treated)]) ** 2, 0);
  const centerSS = patients.reduce((sum, p) => sum + (p.outcome - centerMeans[p.center] - estimate * (Number(p.treated) - 0.5)) ** 2, 0);
  const fit = (ss: number, df: number): Analysis => {
    const residualSD = Math.sqrt(ss / df);
    return { estimate, residualSD, se: residualSD * Math.sqrt(2 / PER_ARM), df };
  };
  return { treatment: fit(treatmentSS, patients.length - 2), center: fit(centerSS, patients.length - CENTERS - 1) };
}

export function simulate(c: Configuration, rng: RNG): Dataset {
  if (!validConfiguration(c)) throw new Error("Invalid generating parameters.");
  const patients = CENTER_EFFECTS.flatMap((effect, center) => {
    const allocation = Array.from({ length: PER_CENTER }, (_, i) => i < PER_CENTER / 2);
    for (let i = PER_CENTER - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [allocation[i], allocation[j]] = [allocation[j], allocation[i]];
    }
    return allocation.map(treated => ({ center, treated,
      outcome: BASELINE + effect + c.effect * Number(treated) + drawNormal({ mean: 0, sd: c.residualSD }, rng) }));
  });
  return { patients, result: analyse(patients) };
}

export function summarize(results: readonly Result[], key: AnalysisKey, truth: number) {
  const estimates = results.map(r => r[key].estimate);
  return {
    n: results.length,
    mean: results.length ? mean(estimates) : null,
    bias: results.length ? mean(estimates) - truth : null,
    empiricalSE: results.length > 1 ? standardDeviation(estimates) : null,
    reportedSE: results.length ? mean(results.map(r => r[key].se)) : null,
  };
}

export function histogram(estimates: number[], truth: number, residualSD: number) {
  const halfWidth = Math.max(1, 4 * residualSD * Math.sqrt(2 / PER_ARM));
  let low = truth - halfWidth, high = truth + halfWidth;
  for (const estimate of estimates) { low = Math.min(low, estimate); high = Math.max(high, estimate); }
  const padding = (high - low) * .05;
  low -= padding; high += padding;
  const bins = Array<number>(28).fill(0);
  for (const value of estimates) bins[Math.min(27, Math.max(0, Math.floor(28 * (value - low) / (high - low))))]++;
  return { low, high, bins, max: Math.max(2, ...bins) };
}

/** Tukey hinges and 1.5-IQR whiskers, consistent with R boxplot.stats(). */
export function reportedSEBox(values: readonly number[]) {
  if (!values.length) return null;
  if (values.some(value => !Number.isFinite(value) || value < 0)) throw new Error("Expected finite, nonnegative SEs.");
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const at = (position: number) => (sorted[Math.floor(position) - 1] + sorted[Math.ceil(position) - 1]) / 2;
  const hinge = Math.floor((n + 3) / 2) / 2;
  const q1 = at(hinge), median = at((n + 1) / 2), q3 = at(n + 1 - hinge);
  const iqr = q3 - q1;
  const low = sorted.find(value => value >= q1 - 1.5 * iqr)!;
  const high = [...sorted].reverse().find(value => value <= q3 + 1.5 * iqr)!;
  return { n, low, q1, median, q3, high, outliers: sorted.filter(value => value < low || value > high) };
}
