import { describe, expect, it } from "vitest";
import { implantData } from "./data";
import { compareInteractionModels, fitInteractionModel, jawDifference, predictJaw } from "./model";

function coefficient(fit: ReturnType<typeof fitInteractionModel>, term: string) {
  return fit.coefficients.find((entry) => entry.term === term)!;
}

describe("additive versus interaction models", () => {
  it("reproduces the lecture's additive model", () => {
    const fit = fitInteractionModel(implantData, "additive");
    expect(coefficient(fit, "intercept").estimate).toBeCloseTo(53.2378651, 5);
    expect(coefficient(fit, "torque").estimate).toBeCloseTo(0.4034747, 6);
    expect(coefficient(fit, "lower").estimate).toBeCloseTo(2.0825419, 6);
    expect(fit.rSquared).toBeCloseTo(0.438251, 6);
    expect(jawDifference(fit, 25)).toBeCloseTo(jawDifference(fit, 45), 10);
  });

  it("reproduces the lecture's interaction coefficient and group-specific slopes", () => {
    const fit = fitInteractionModel(implantData, "interaction");
    expect(coefficient(fit, "interaction").estimate).toBeCloseTo(0.2611628, 6);
    expect(coefficient(fit, "interaction").standardError).toBeCloseTo(0.09475739, 6);
    expect(coefficient(fit, "interaction").pValue).toBeCloseTo(0.007052446, 8);
    expect(coefficient(fit, "torque").estimate).toBeCloseTo(0.2859627, 6);
    expect(coefficient(fit, "torque").estimate + coefficient(fit, "interaction").estimate).toBeCloseTo(0.5471255, 6);
    expect(jawDifference(fit, 45)).toBeGreaterThan(jawDifference(fit, 25) + 5);
  });

  it("reproduces the partial F comparison", () => {
    const additive = fitInteractionModel(implantData, "additive");
    const interaction = fitInteractionModel(implantData, "interaction");
    const comparison = compareInteractionModels(additive, interaction);
    expect(comparison.rSquaredChange).toBeCloseTo(0.0428446, 5);
    expect(comparison.fStatistic).toBeCloseTo(7.5962, 4);
    expect(comparison.numeratorDf).toBe(1);
    expect(comparison.denominatorDf).toBe(92);
    expect(predictJaw(interaction, "upper", 35)).not.toBeCloseTo(predictJaw(interaction, "lower", 35));
  });
});
