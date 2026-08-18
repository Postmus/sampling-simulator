import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import { createHistogramPlan, histogramBin, histogramCounts, readableBinWidth } from "./histogram";
import { empiricalStandardError, simulateBatch, theoreticalStandardError } from "./model";

describe("sampling-distribution model", () => {
  const configuration = { mean: 100, sd: 15, sampleSize: 25 };

  it("returns one estimate for every simulated sample", () => {
    const results = simulateBatch(configuration, 100, createRng(42));
    expect(results).toHaveLength(100);
    expect(results.every((result) => result.sample.length === 25)).toBe(true);
    expect(results.every((result) => Number.isFinite(result.estimate))).toBe(true);
  });

  it("computes the theoretical standard error", () => {
    expect(theoreticalStandardError(configuration)).toBe(3);
  });

  it("keeps the empirical standard error absent until two estimates exist", () => {
    expect(empiricalStandardError([])).toBeNull();
    expect(empiricalStandardError([100])).toBeNull();
    expect(empiricalStandardError([98, 102])).toBeCloseTo(Math.sqrt(8));
  });
});

describe("sampling-distribution histogram", () => {
  it("rounds raw widths to readable intervals", () => {
    expect(readableBinWidth(1.42)).toBe(1);
    expect(readableBinWidth(2.4)).toBe(2.5);
    expect(readableBinWidth(0.47)).toBe(0.5);
  });

  it("accounts for every estimate exactly once", () => {
    const plan = createHistogramPlan([40, 160], 100, 4.75);
    const values = [40, 95, 100, 102, 160];
    const counts = histogramCounts(values, plan);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(values.length);
    expect(histogramBin(40, plan)).toBe(0);
    expect(histogramBin(160, plan)).toBe(plan.binCount - 1);
  });
});
