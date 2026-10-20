import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";
import { analyseHospitals, boxPlotSummary, DEFAULT_CONFIGURATION, HOSPITALS, PATIENTS_PER_HOSPITAL, histogram, outcomeDomain, paddedDomain,
  simulateTrial, summariseTrial, trueEffect, validateConfiguration, varianceComponents, type Configuration } from "./model";

function fixture(offsets = [-8, 0, 8, -8, 0, 8]) {
  return offsets.map((offset, id) => ({
    id, treated: id >= 3, sampleMean: NaN,
    outcomes: Array.from({ length: 20 }, (_, index) => 130 - (id >= 3 ? 5 : 0) + offset + index - 9.5),
  }));
}

function repeated(configuration: Configuration, count = 12_000) {
  const rng = createRng(572913);
  return Array.from({ length: count }, () => summariseTrial(simulateTrial(configuration, rng), trueEffect(configuration)));
}

describe("balanced hospital cluster randomisation", () => {
  it("matches R boxplot hinges and whiskers while keeping extreme patients as outliers", () => {
    // grDevices::boxplot.stats(c(1:59, 200))$stats = c(1, 15.5, 30.5, 45.5, 59).
    const values = [...Array.from({ length: 59 }, (_, index) => index + 1), 200].reverse();
    const original = [...values];
    const summary = boxPlotSummary(values)!;
    expect([summary.low, summary.q1, summary.median, summary.q3, summary.high]).toEqual([1, 15.5, 30.5, 45.5, 59]);
    expect(summary.n).toBe(60);
    expect(summary.mean).toBeCloseTo(1970 / 60, 12);
    expect(summary.outliers).toEqual([200]);
    expect(values).toEqual(original);
    expect(boxPlotSummary(Array(60).fill(130))).toEqual({ n: 60, low: 130, q1: 130, median: 130, q3: 130, high: 130, mean: 130, outliers: [] });
    expect(boxPlotSummary([])).toBeNull();
    expect(() => boxPlotSummary([NaN])).toThrow();
  });

  it("pools sixty patients per arm without changing the effect or losing extreme values from the common scale", () => {
    const trial = simulateTrial(DEFAULT_CONFIGURATION, createRng(42));
    const control = boxPlotSummary(trial.hospitals.filter((hospital) => !hospital.treated).flatMap((hospital) => hospital.outcomes))!;
    const intervention = boxPlotSummary(trial.hospitals.filter((hospital) => hospital.treated).flatMap((hospital) => hospital.outcomes))!;
    expect(control.n).toBe(60);
    expect(intervention.n).toBe(60);
    expect(intervention.mean - control.mean).toBeCloseTo(trial.ordinary.estimate, 12);
    trial.hospitals[0].outcomes[0] = 1000;
    const domain = outcomeDomain(DEFAULT_CONFIGURATION, trial);
    expect(domain[1]).toBeGreaterThan(1000);
    expect(domain[0]).toBeLessThan(Math.min(...trial.hospitals.flatMap((hospital) => hospital.outcomes)));
  });

  it("matches independent R lm and nlme::lme REML reference calculations", () => {
    // R fixture: y = 130 - 5*treatment + hospitalOffset + (1:20)-10.5.
    // nlme::lme(y ~ treatment, random = ~1|hospital, method = 'REML').
    const trial = analyseHospitals(fixture());
    expect(trial.ordinary.estimate).toBeCloseTo(-5, 12);
    expect(trial.mixed.estimate).toBeCloseTo(-5, 12);
    expect(trial.ordinary.se).toBeCloseTo(1.60419647415, 10);
    expect(trial.ordinary.pValue).toBeCloseTo(0.00229632663917, 12);
    expect(trial.mixed.se).toBeCloseTo(6.53197264717, 8);
    expect(trial.mixed.pValue).toBeCloseTo(0.486664789249, 8);
    expect(trial.hospitalVariance).toBeCloseTo(62.25, 12);
    expect(trial.residualVariance).toBeCloseTo(35, 12);
    expect(trial.ordinary.df).toBe(118);
    expect(trial.mixed.df).toBe(4);
    expect(trial.ordinary.rejected).toBe(true);
    expect(trial.mixed.rejected).toBe(false);
    expect((trial.mixed.high - trial.mixed.estimate) / trial.mixed.se).toBeCloseTo(2.7764451051978, 10);
  });

  it("fits interior mixed-model SEs from the six observed hospital means", () => {
    const trial = analyseHospitals(fixture());
    const controls = trial.hospitals.filter((hospital) => !hospital.treated).map((hospital) => hospital.sampleMean);
    const treatments = trial.hospitals.filter((hospital) => hospital.treated).map((hospital) => hospital.sampleMean);
    const pooledVariance = (2 * standardDeviation(controls) ** 2 + 2 * standardDeviation(treatments) ** 2) / 4;
    expect(trial.mixed.se).toBeCloseTo(Math.sqrt(pooledVariance * 2 / 3), 12);
  });

  it("keeps zero-variance REML fits finite, nonnegative and counted", () => {
    const trial = analyseHospitals(fixture([0, 0, 0, 0, 0, 0]));
    expect(trial.boundaryFit).toBe(true);
    expect(trial.hospitalVariance).toBe(0);
    expect(trial.residualVariance).toBeCloseTo(3990 / 118, 12);
    expect(trial.mixed.se).toBe(trial.ordinary.se);
    expect(trial.mixed.df).toBe(4);
    expect(trial.mixed.high - trial.mixed.low).toBeGreaterThan(trial.ordinary.high - trial.ordinary.low);
    expect(Object.values(summariseTrial(trial, -5))).toHaveLength(5);
    const constant = fixture().map((hospital) => ({ ...hospital, outcomes: Array(20).fill(130) }));
    expect(analyseHospitals(constant).mixed.pValue).toBe(1);
  });

  it("preserves total variance when changing ICC, including both allowed endpoints", () => {
    for (const icc of [0.1, 0.3, 0.9]) {
      const components = varianceComponents({ ...DEFAULT_CONFIGURATION, icc });
      expect(components.hospital + components.residual).toBeCloseTo(12 ** 2, 12);
      expect(components.hospital / (components.hospital + components.residual)).toBeCloseTo(icc, 12);
    }
  });

  it("randomises exactly three entire hospitals per arm and replays deterministically", () => {
    const rng = createRng(42);
    const assignments = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      const trial = simulateTrial(DEFAULT_CONFIGURATION, rng);
      expect(trial.hospitals).toHaveLength(HOSPITALS);
      expect(trial.hospitals.filter((hospital) => hospital.treated)).toHaveLength(3);
      expect(trial.hospitals.every((hospital) => hospital.outcomes.length === PATIENTS_PER_HOSPITAL)).toBe(true);
      expect(trial.hospitals.map((hospital) => hospital.id)).toEqual([0, 1, 2, 3, 4, 5]);
      assignments.add(trial.hospitals.map((hospital) => Number(hospital.treated)).join(""));
    }
    expect(assignments.size).toBeGreaterThan(10);
    expect(simulateTrial(DEFAULT_CONFIGURATION, createRng(42))).toEqual(simulateTrial(DEFAULT_CONFIGURATION, createRng(42)));
  });

  it("adds the H1 effect only to treated patients without changing either SE", () => {
    const nullTrial = simulateTrial(DEFAULT_CONFIGURATION, createRng(21));
    const alternative = simulateTrial({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" }, createRng(21));
    nullTrial.hospitals.forEach((hospital, id) => {
      hospital.outcomes.forEach((outcome, index) => expect(alternative.hospitals[id].outcomes[index] - outcome).toBeCloseTo(hospital.treated ? -5 : 0, 12));
    });
    expect(alternative.mixed.estimate - nullTrial.mixed.estimate).toBeCloseTo(-5, 12);
    expect(alternative.mixed.se).toBeCloseTo(nullTrial.mixed.se, 12);
    expect(alternative.ordinary.se).toBeCloseTo(nullTrial.ordinary.se, 12);
  });

  it.each([0.1, 0.3, 0.9])("controls null error near 5%% at ICC %s while ordinary regression inflates it", (icc) => {
    const configuration = { ...DEFAULT_CONFIGURATION, icc };
    const results = repeated(configuration);
    const ordinaryRate = results.filter((result) => result.ordinaryRejected).length / results.length;
    const mixedRate = results.filter((result) => result.mixedRejected).length / results.length;
    expect(mixedRate).toBeGreaterThan(0.035);
    expect(mixedRate).toBeLessThan(0.065);
    expect(ordinaryRate).toBeGreaterThan(0.2);
    const estimates = results.map((result) => result.estimate);
    const expectedSE = configuration.totalSD * Math.sqrt(2 * (icc + (1 - icc) / 20) / 3);
    expect(Math.abs(mean(estimates))).toBeLessThan(expectedSE * 0.03);
    expect(standardDeviation(estimates) / expectedSE).toBeGreaterThan(0.97);
    expect(standardDeviation(estimates) / expectedSE).toBeLessThan(1.03);
    expect(results.every((result) => result.mixedCovered === !result.mixedRejected)).toBe(true);
  });

  it("increases correctly analysed power with a larger treatment effect", () => {
    const configuration = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" as const };
    const small = repeated(configuration, 6000);
    const large = repeated({ ...configuration, alternativeEffect: -15 }, 6000);
    const rejectionCount = (results: typeof small) => results.filter((result) => result.mixedRejected).length;
    expect(rejectionCount(large)).toBeGreaterThan(rejectionCount(small) + 1500);
    expect(large.filter((result) => result.mixedCovered).length / large.length).toBeGreaterThan(0.93);
  });

  it("rejects invalid inputs and includes all histogram tails", () => {
    for (const changes of [{ icc: 0 }, { icc: 1 }, { icc: NaN }, { totalSD: 0 }, { totalSD: 41 }, { totalSD: Infinity }, { alternativeEffect: 0 }]) {
      expect(validateConfiguration({ ...DEFAULT_CONFIGURATION, ...changes })).toBe(false);
    }
    expect(validateConfiguration(DEFAULT_CONFIGURATION)).toBe(true);
    expect(() => analyseHospitals(fixture().slice(1))).toThrow();
    expect(() => analyseHospitals(fixture().map((hospital) => ({ ...hospital, treated: true })))).toThrow();
    expect(() => simulateTrial({ ...DEFAULT_CONFIGURATION, icc: 1 }, createRng(1))).toThrow();
    const domain = paddedDomain([-1000, 0, 1000], [-10, 10]);
    expect(domain[0]).toBeLessThan(-1000);
    expect(domain[1]).toBeGreaterThan(1000);
    expect(histogram([-1000, 0, 1000], domain).reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
  });
});
