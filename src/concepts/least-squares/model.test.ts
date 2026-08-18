import { describe, expect, it } from "vitest";
import { fitLeastSquares, residuals, sumSquaredErrors } from "./model";
import { regressionScenarios } from "./scenarios";

describe("least-squares model", () => {
  it("recovers an exact linear relationship", () => {
    const points = [
      { id: "a", x: 0, y: 1 },
      { id: "b", x: 1, y: 3 },
      { id: "c", x: 2, y: 5 },
      { id: "d", x: 3, y: 7 },
    ];
    const fit = fitLeastSquares(points);

    expect(fit.slope).toBeCloseTo(2);
    expect(fit.intercept).toBeCloseTo(1);
    expect(fit.sse).toBeCloseTo(0);
    expect(fit.rSquared).toBeCloseTo(1);
  });

  it("produces residuals that sum to zero", () => {
    const scenario = regressionScenarios[0];
    const fit = fitLeastSquares(scenario.points);
    const residualSum = residuals(scenario.points, fit).reduce(
      (sum, item) => sum + item.residual,
      0,
    );

    expect(residualSum).toBeCloseTo(0, 10);
    expect(fit.intercept + fit.slope * fit.xMean).toBeCloseTo(fit.yMean, 10);
  });

  it("has no larger SSE than nearby lines", () => {
    regressionScenarios.forEach((scenario) => {
      const fit = fitLeastSquares(scenario.points);
      const meanOnlySse = sumSquaredErrors(scenario.points, { slope: 0, intercept: fit.yMean });
      expect(fit.sst).toBeCloseTo(meanOnlySse, 10);
      expect(fit.sse).toBeLessThanOrEqual(meanOnlySse);
      expect(sumSquaredErrors(scenario.points, fit)).toBeLessThanOrEqual(
        sumSquaredErrors(scenario.points, { slope: fit.slope + scenario.slopeStep, intercept: fit.intercept }),
      );
      expect(sumSquaredErrors(scenario.points, fit)).toBeLessThanOrEqual(
        sumSquaredErrors(scenario.points, { slope: fit.slope, intercept: fit.intercept + scenario.interceptStep }),
      );
    });
  });

  it("keeps every fitted solution inside its teaching controls", () => {
    regressionScenarios.forEach((scenario) => {
      const fit = fitLeastSquares(scenario.points);
      expect(fit.slope).toBeGreaterThanOrEqual(scenario.slopeDomain[0]);
      expect(fit.slope).toBeLessThanOrEqual(scenario.slopeDomain[1]);
      expect(fit.intercept).toBeGreaterThanOrEqual(scenario.interceptDomain[0]);
      expect(fit.intercept).toBeLessThanOrEqual(scenario.interceptDomain[1]);
    });
  });

  it("starts every scenario on its horizontal mean line", () => {
    regressionScenarios.forEach((scenario) => {
      const fit = fitLeastSquares(scenario.points);
      expect(scenario.initialSlope).toBe(0);
      expect(scenario.initialIntercept).toBeCloseTo(fit.yMean, 10);
    });
  });

  it("shows that a symmetric curved relationship can have almost no linear fit", () => {
    const curved = regressionScenarios.find((scenario) => scenario.id === "curved");
    expect(curved).toBeDefined();
    const fit = fitLeastSquares(curved!.points);
    expect(Math.abs(fit.slope)).toBeLessThan(1);
    expect(fit.rSquared).toBeLessThan(0.05);
  });
});
