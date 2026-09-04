import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import {
  empiricalMeanDifferenceStandardError,
  gelXPopulationMean,
  simulateExperiment,
  simulateExperimentBatch,
  theoreticalMeanDifferenceStandardError,
} from "./model";

describe("mean-difference sampling model", () => {
  const configuration = {
    vehicleMean: 56,
    trueEffect: 10,
    sd: 13.2,
    sampleSizePerGroup: 12,
  };

  it("draws one equally sized sample from each treatment population", () => {
    const result = simulateExperiment(configuration, createRng(314159));
    expect(result.vehicleSample).toHaveLength(12);
    expect(result.gelXSample).toHaveLength(12);
    expect(result.estimate).toBeCloseTo(result.gelXSampleMean - result.vehicleSampleMean);
  });

  it("centres the Gel X population at the vehicle mean plus the true effect", () => {
    expect(gelXPopulationMean(configuration)).toBe(66);
  });

  it("uses the equal-allocation standard error for a difference in means", () => {
    expect(theoreticalMeanDifferenceStandardError(configuration)).toBeCloseTo(
      13.2 * Math.sqrt(2 / 12),
    );
  });

  it("produces one treatment-effect estimate per repeated experiment", () => {
    const results = simulateExperimentBatch(configuration, 100, createRng(42));
    expect(results).toHaveLength(100);
    expect(results.every((result) => Number.isFinite(result.estimate))).toBe(true);
  });

  it("waits for two estimates before reporting an empirical standard error", () => {
    expect(empiricalMeanDifferenceStandardError([])).toBeNull();
    expect(empiricalMeanDifferenceStandardError([10])).toBeNull();
    expect(empiricalMeanDifferenceStandardError([8, 12])).toBeCloseTo(Math.sqrt(8));
  });
});
