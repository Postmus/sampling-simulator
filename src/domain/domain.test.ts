import { describe, expect, it } from "vitest";
import { drawNormalSample, normalDensity } from "./distributions/normal";
import { createRng } from "./rng";
import { mean, standardDeviation } from "./statistics";

describe("deterministic domain functions", () => {
  it("replays the same normal sample from the same seed", () => {
    const distribution = { mean: 100, sd: 15 };
    const first = drawNormalSample(distribution, 10, createRng(314159));
    const replay = drawNormalSample(distribution, 10, createRng(314159));

    expect(replay).toEqual(first);
    expect(first).toHaveLength(10);
  });

  it("computes descriptive statistics", () => {
    expect(mean([2, 4, 6, 8])).toBe(5);
    expect(standardDeviation([2, 4, 6, 8])).toBeCloseTo(2.58199, 5);
  });

  it("places the peak of a normal density at its mean", () => {
    const distribution = { mean: 10, sd: 2 };
    expect(normalDensity(10, distribution)).toBeGreaterThan(normalDensity(12, distribution));
    expect(normalDensity(8, distribution)).toBeCloseTo(normalDensity(12, distribution));
  });
});
