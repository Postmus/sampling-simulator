import { describe, expect, it } from "vitest";
import { fitDiagnosticModel, transformPredictor } from "./model";
import { diagnosticScenarios } from "./scenarios";

function scenario(id: string) {
  return diagnosticScenarios.find((entry) => entry.id === id)!;
}

function skewness(values: readonly number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const deviation = Math.sqrt(variance);
  return values.reduce((sum, value) => sum + ((value - mean) / deviation) ** 3, 0) / values.length;
}

function excessKurtosis(values: readonly number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return values.reduce(
    (sum, value) => sum + ((value - mean) / Math.sqrt(variance)) ** 4,
    0,
  ) / values.length - 3;
}

describe("regression diagnostic models", () => {
  it("offers the lecture case followed by one reference case and focused departures", () => {
    expect(diagnosticScenarios.map((entry) => entry.id)).toEqual([
      "masseter-bite-force",
      "well-behaved",
      "log-relationship",
      "increasing-spread",
      "skewed-errors",
    ]);
    const controlledExamples = diagnosticScenarios.filter((entry) => entry.id !== "masseter-bite-force");
    expect(new Set(controlledExamples.map((entry) => entry.copy.en.xLabel))).toEqual(
      new Set(["Analgesic dose (mg/day)"]),
    );
    expect(new Set(controlledExamples.map((entry) => entry.copy.en.yLabel))).toEqual(
      new Set(["Pain reduction score (0–100)"]),
    );
  });

  it("carries the lecture fit into the diagnostic module unchanged", () => {
    const lecture = scenario("masseter-bite-force");
    const fit = fitDiagnosticModel(lecture.points, "raw").fit;

    expect(lecture.points).toHaveLength(30);
    expect(fit.intercept).toBeCloseTo(83.1, 0);
    expect(fit.slope).toBeCloseTo(29.1, 0);
    expect(fit.rSquared).toBeCloseTo(0.72, 1);
  });

  it("fits every teaching dataset with residuals summing to zero", () => {
    diagnosticScenarios.forEach((entry) => {
      const model = fitDiagnosticModel(entry.points, "raw");
      expect(model.residuals.reduce((sum, item) => sum + item.residual, 0)).toBeCloseTo(0, 9);
    });
  });

  it("makes the logarithmic teaching relationship substantially more linear", () => {
    const entry = scenario("log-relationship");
    const raw = fitDiagnosticModel(entry.points, "raw");
    const logged = fitDiagnosticModel(entry.points, "log");

    expect(logged.fit.sse).toBeLessThan(raw.fit.sse * 0.25);
    expect(logged.fit.rSquared).toBeGreaterThan(0.95);
    expect(transformPredictor(8, "log")).toBeCloseTo(3);
  });

  it("makes the final third visibly more variable in the funnel example", () => {
    const model = fitDiagnosticModel(scenario("increasing-spread").points, "raw");
    const first = model.residuals.slice(0, 8);
    const last = model.residuals.slice(-8);
    const rootMeanSquare = (items: typeof first) => Math.sqrt(
      items.reduce((sum, item) => sum + item.residual ** 2, 0) / items.length,
    );

    expect(rootMeanSquare(last)).toBeGreaterThan(rootMeanSquare(first) * 2.5);
  });

  it("keeps the skewed example more asymmetric than the symmetric example", () => {
    const symmetric = fitDiagnosticModel(scenario("well-behaved").points, "raw");
    const skewed = fitDiagnosticModel(scenario("skewed-errors").points, "raw");
    const symmetricSkew = skewness(symmetric.residuals.map((item) => item.residual));
    const skewedSkew = skewness(skewed.residuals.map((item) => item.residual));

    expect(Math.abs(symmetricSkew)).toBeLessThan(0.35);
    expect(skewedSkew).toBeGreaterThan(1);
  });

  it("keeps the correctly specified normal-error examples close to a normal shape", () => {
    const examples = [
      fitDiagnosticModel(scenario("log-relationship").points, "log"),
      fitDiagnosticModel(scenario("well-behaved").points, "raw"),
    ];

    examples.forEach((model) => {
      const values = model.residuals.map((item) => item.residual);
      expect(Math.abs(skewness(values))).toBeLessThan(0.25);
      expect(Math.abs(excessKurtosis(values))).toBeLessThan(0.5);
    });
  });
});
