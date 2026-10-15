import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";
import { DEFAULT_CONFIGURATION, rejectionBoundary, experimentEstimate, histogram, populationDomain, samplingDomain, simulateExperiment, summarizeExperiment, theoreticalSe, treatmentPopulationMean, trueDifference, validateConfiguration, type Configuration } from "./model";
import { plaqueMessages } from "./messages";

function repeat(configuration: Configuration, count = 10_000) {
  const rng = createRng(732451);
  return Array.from({ length: count }, () => experimentEstimate(simulateExperiment(configuration, rng)));
}

describe("plaque-index inference", () => {
  it("uses the lecture defaults and generates H0/H1 as specified", () => {
    expect(theoreticalSe(DEFAULT_CONFIGURATION)).toBeCloseTo(0.1732050808);
    expect(trueDifference(DEFAULT_CONFIGURATION)).toBe(0);
    expect(DEFAULT_CONFIGURATION.controlMean).toBe(1.5);
    expect(trueDifference({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" })).toBe(-0.3);
    expect(treatmentPopulationMean({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" })).toBe(1.2);
    const result = simulateExperiment(DEFAULT_CONFIGURATION, createRng(42));
    expect(result.control).toHaveLength(24);
    expect(result.treatment).toHaveLength(24);
  });

  it("uses experimental minus control and fixed known-SD rejection boundaries", () => {
    const critical = rejectionBoundary(DEFAULT_CONFIGURATION);
    expect(critical).toBeCloseTo(0.3394757202, 9);
    // Same difference, different sample spread: the known population SD determines the test.
    const narrow = summarizeExperiment([1.5, 1.5], [1.1, 1.1], critical);
    const wide = summarizeExperiment([0.5, 2.5], [0.1, 2.1], critical);
    expect(narrow.difference).toBeCloseTo(-0.4);
    expect(wide.difference).toBeCloseTo(-0.4);
    expect(narrow.rejected).toBe(true);
    expect(wide.rejected).toBe(true);
    expect(summarizeExperiment([1, 2, 3], [0.8, 1.8, 2.8], critical).rejected).toBe(false);
    expect(summarizeExperiment([1, 2, 3], [1.4, 2.4, 3.4], critical).rejected).toBe(true);
    expect(rejectionBoundary({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" })).toBe(critical);
  });

  it("scales the raw cutoff with SD and the square root of sample size", () => {
    const critical = rejectionBoundary(DEFAULT_CONFIGURATION);
    expect(rejectionBoundary({ ...DEFAULT_CONFIGURATION, sd: 1.2 })).toBeCloseTo(critical * 2);
    expect(rejectionBoundary({ ...DEFAULT_CONFIGURATION, sampleSize: 96 })).toBeCloseTo(critical / 2);
    const first = simulateExperiment(DEFAULT_CONFIGURATION, createRng(19));
    const second = simulateExperiment({ ...DEFAULT_CONFIGURATION, sd: 1.2 }, createRng(19));
    expect(second.difference).toBeCloseTo(first.difference * 2, 12);
    expect(second.rejected).toBe(first.rejected);
  });

  it("reproduces the null sampling distribution and a roughly 5% false-positive rate", () => {
    const results = repeat(DEFAULT_CONFIGURATION);
    expect(mean(results.map((result) => result.difference))).toBeCloseTo(0, 2);
    expect(standardDeviation(results.map((result) => result.difference))).toBeCloseTo(theoreticalSe(DEFAULT_CONFIGURATION), 2);
    const rate = results.filter((result) => result.rejected).length / results.length;
    expect(rate).toBeGreaterThan(0.04);
    expect(rate).toBeLessThan(0.06);
  });

  it("shows approximately 40% power at n=24 and 80% at n=63; more SD reduces power", () => {
    const base = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" as const };
    const power = (configuration: Configuration) => {
      const results = repeat(configuration);
      expect(mean(results.map((result) => result.difference))).toBeCloseTo(-0.3, 2);
      return results.filter((result) => result.rejected).length / results.length;
    };
    expect(power(base)).toBeGreaterThan(0.37);
    expect(power(base)).toBeLessThan(0.43);
    const larger = power({ ...base, sampleSize: 63 });
    expect(larger).toBeGreaterThan(0.78);
    expect(larger).toBeLessThan(0.83);
    expect(power({ ...base, sd: 1.2 })).toBeLessThan(0.16);
  });

  it("validates controls and counts every histogram result, including extreme tails", () => {
    expect(validateConfiguration(DEFAULT_CONFIGURATION)).toBe(true);
    for (const configuration of [
      { ...DEFAULT_CONFIGURATION, sd: 0 }, { ...DEFAULT_CONFIGURATION, sd: NaN },
      { ...DEFAULT_CONFIGURATION, sampleSize: 2.5 }, { ...DEFAULT_CONFIGURATION, sampleSize: 501 },
      { ...DEFAULT_CONFIGURATION, controlMean: NaN }, { ...DEFAULT_CONFIGURATION, controlMean: -0.1 },
      { ...DEFAULT_CONFIGURATION, controlMean: 3.1 }, { ...DEFAULT_CONFIGURATION, alternativeDifference: 0 },
    ]) expect(validateConfiguration(configuration)).toBe(false);
    expect(histogram([-100, 0, 100], [-100, 100]).reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
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

  it("shifts both populations with the control mean while preserving their difference and decision", () => {
    const configuration: Configuration = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" };
    const original = simulateExperiment(configuration, createRng(17));
    const shifted = simulateExperiment({ ...configuration, controlMean: 2 }, createRng(17));
    expect(shifted.controlMean - original.controlMean).toBeCloseTo(0.5, 12);
    expect(shifted.treatmentMean - original.treatmentMean).toBeCloseTo(0.5, 12);
    expect(shifted.difference).toBeCloseTo(original.difference, 12);
    expect(shifted.rejected).toBe(original.rejected);
  });

  it("fits empirical results and rejection boundaries without using theoretical sampling curves", () => {
    const values = [-0.45, -0.3, -0.2];
    const critical = rejectionBoundary(DEFAULT_CONFIGURATION);
    const domain = samplingDomain(values, critical);
    expect(domain[0]).toBeLessThan(-0.45);
    expect(domain[1]).toBeGreaterThan(critical);
    expect(domain[1] - domain[0]).toBeLessThan(1);
    const [low, high] = samplingDomain([], critical);
    expect(low).toBeLessThan(-critical);
    expect(high).toBeGreaterThan(critical);
  });
});
