import { describe, expect, it } from "vitest";
import { studentTCritical95, studentTDensity, twoSidedStudentTPValue } from "../../domain/distributions/studentT";
import { createRng } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";
import { DEFAULT_CONFIGURATION, empiricalSe, experimentEstimate, histogram, populationDomain, simulateExperiment, summarizeExperiment, theoreticalSe, trueDifference, validateConfiguration, type Configuration } from "./model";
import { plaqueMessages } from "./messages";

function repeat(configuration: Configuration, count = 10_000) {
  const rng = createRng(732451);
  const critical = studentTCritical95(2 * configuration.sampleSize - 2);
  return Array.from({ length: count }, () => experimentEstimate(simulateExperiment(configuration, rng, critical)));
}

describe("plaque-index inference", () => {
  it("uses the lecture defaults and generates H0/H1 as specified", () => {
    expect(theoreticalSe(DEFAULT_CONFIGURATION)).toBeCloseTo(0.1732050808);
    expect(trueDifference(DEFAULT_CONFIGURATION)).toBe(0);
    expect(trueDifference({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" })).toBe(0.3);
    const result = simulateExperiment(DEFAULT_CONFIGURATION, createRng(42));
    expect(result.control).toHaveLength(24);
    expect(result.treatment).toHaveLength(24);
  });

  it("calculates t from sample variability, using control minus treatment", () => {
    const result = summarizeExperiment([1, 2, 3], [0, 1, 2], studentTCritical95(4));
    expect(result.difference).toBe(1);
    expect(result.pooledSd).toBeCloseTo(1);
    expect(result.estimatedSe).toBeCloseTo(Math.sqrt(2 / 3));
    expect(result.t).toBeCloseTo(Math.sqrt(1.5));
    expect(result.pValue).toBeCloseTo(0.2878641347266908, 8);
    expect(result.rejected).toBe(false);
  });

  it("matches known t reference values and preserves the null testing rule", () => {
    expect(studentTCritical95(2)).toBeCloseTo(4.302652729911275, 8);
    expect(studentTCritical95(46)).toBeCloseTo(2.0128955989194286, 8);
    expect(studentTDensity(0, 1)).toBeCloseTo(1 / Math.PI, 10);
    expect(twoSidedStudentTPValue(0, 46)).toBe(1);
    expect(twoSidedStudentTPValue(Infinity, 46)).toBe(0);
    const h1 = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" as const };
    const result = simulateExperiment(h1, createRng(17));
    expect(result.t).toBeCloseTo(result.difference / result.estimatedSe, 12);
    expect(result.rejected).toBe(Math.abs(result.t) > studentTCritical95(46));
  });

  it("under H0 changes SD and SE together while leaving t unchanged", () => {
    const first = simulateExperiment(DEFAULT_CONFIGURATION, createRng(19));
    const second = simulateExperiment({ ...DEFAULT_CONFIGURATION, sd: 1.2 }, createRng(19));
    expect(second.difference).toBeCloseTo(first.difference * 2, 12);
    expect(second.estimatedSe).toBeCloseTo(first.estimatedSe * 2, 12);
    expect(second.t).toBeCloseTo(first.t, 12);
  });

  it("reproduces the null sampling distribution and a roughly 5% false-positive rate", () => {
    const results = repeat(DEFAULT_CONFIGURATION);
    expect(mean(results.map((result) => result.difference))).toBeCloseTo(0, 2);
    expect(empiricalSe(results)).toBeCloseTo(theoreticalSe(DEFAULT_CONFIGURATION), 2);
    const rate = results.filter((result) => result.rejected).length / results.length;
    expect(rate).toBeGreaterThan(0.04);
    expect(rate).toBeLessThan(0.06);
    expect(standardDeviation(results.map((result) => result.t))).toBeGreaterThan(1);
  });

  it("shows approximately 40% power at n=24 and 80% at n=64; more SD reduces power", () => {
    const base = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" as const };
    const power = (configuration: Configuration) => {
      const results = repeat(configuration);
      expect(mean(results.map((result) => result.difference))).toBeCloseTo(0.3, 2);
      return results.filter((result) => result.rejected).length / results.length;
    };
    expect(power(base)).toBeGreaterThan(0.37);
    expect(power(base)).toBeLessThan(0.43);
    const larger = power({ ...base, sampleSize: 64 });
    expect(larger).toBeGreaterThan(0.78);
    expect(larger).toBeLessThan(0.83);
    expect(power({ ...base, sd: 1.2 })).toBeLessThan(0.16);
  });

  it("validates controls and counts every histogram result, including extreme tails", () => {
    expect(validateConfiguration(DEFAULT_CONFIGURATION)).toBe(true);
    for (const configuration of [
      { ...DEFAULT_CONFIGURATION, sd: 0 }, { ...DEFAULT_CONFIGURATION, sd: NaN },
      { ...DEFAULT_CONFIGURATION, sampleSize: 2.5 }, { ...DEFAULT_CONFIGURATION, sampleSize: 501 },
    ]) expect(validateConfiguration(configuration)).toBe(false);
    expect(histogram([-100, 0, 100], [-100, 100]).reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
    expect(empiricalSe([])).toBeNull();
    expect(empiricalSe([{ difference: 0, t: 0, rejected: false }])).toBeNull();
    expect(Object.keys(plaqueMessages.en).sort()).toEqual(Object.keys(plaqueMessages.nl).sort());
  });

  it("uses a close-up common score scale without hiding extreme sampled patients", () => {
    const domain = populationDomain(DEFAULT_CONFIGURATION, null);
    expect(domain[1] - domain[0]).toBeCloseTo(3.6);
    expect(populationDomain({ ...DEFAULT_CONFIGURATION, sd: 1.2 }, null)).toEqual(domain);
    const experiment = simulateExperiment({ ...DEFAULT_CONFIGURATION, sd: 1.2 }, createRng(17));
    const sampledDomain = populationDomain(DEFAULT_CONFIGURATION, experiment);
    for (const value of [...experiment.control, ...experiment.treatment]) {
      expect(value).toBeGreaterThan(sampledDomain[0]);
      expect(value).toBeLessThan(sampledDomain[1]);
    }
  });
});
