import { describe, expect, it } from "vitest";
import { periodontalData } from "./data";
import { fitAncova, predictGroup, studentTCritical95, twoSidedStudentTPValue } from "./model";

function coefficient(fit: ReturnType<typeof fitAncova>, term: string) {
  return fit.coefficients.find((entry) => entry.term === term)!;
}

describe("additive ANCOVA models", () => {
  it("reproduces the treatment-only coefficients and inference from the lecture dataset", () => {
    const fit = fitAncova(periodontalData, "unadjusted");
    expect(coefficient(fit, "intercept").estimate).toBeCloseTo(4.4226643, 6);
    expect(coefficient(fit, "rinse").estimate).toBeCloseTo(-0.3552707, 6);
    expect(coefficient(fit, "rinse").standardError).toBeCloseTo(0.1653012, 6);
    expect(coefficient(fit, "rinse").confidenceLow).toBeCloseTo(-0.6838247, 6);
    expect(coefficient(fit, "rinse").pValue).toBeCloseTo(0.03439281, 7);
    expect(fit.rSquared).toBeCloseTo(0.1974214, 6);
  });

  it("reproduces the baseline-adjusted coefficients and narrower treatment intervals", () => {
    const unadjusted = fitAncova(periodontalData, "unadjusted");
    const adjusted = fitAncova(periodontalData, "adjusted");
    expect(coefficient(adjusted, "baseline").estimate).toBeCloseTo(0.6993761, 6);
    expect(coefficient(adjusted, "rinse").estimate).toBeCloseTo(-0.4727218, 6);
    expect(coefficient(adjusted, "rinse").standardError).toBeCloseTo(0.1024787, 6);
    expect(coefficient(adjusted, "rinse").pValue).toBeCloseTo(0.00001374003, 10);
    expect(coefficient(adjusted, "adjunct").estimate).toBeCloseTo(-0.7599521, 6);
    expect(adjusted.rSquared).toBeCloseTo(0.6978938, 6);
    expect(coefficient(adjusted, "rinse").standardError)
      .toBeLessThan(coefficient(unadjusted, "rinse").standardError);
  });

  it("uses horizontal group-mean fits before adjustment and parallel lines after adjustment", () => {
    const unadjusted = fitAncova(periodontalData, "unadjusted");
    const adjusted = fitAncova(periodontalData, "adjusted");
    expect(predictGroup(unadjusted, "standard", 4)).toBeCloseTo(unadjusted.treatmentMeans.standard);
    expect(predictGroup(unadjusted, "standard", 7)).toBeCloseTo(unadjusted.treatmentMeans.standard);
    expect(predictGroup(adjusted, "rinse", 7) - predictGroup(adjusted, "rinse", 4))
      .toBeCloseTo(predictGroup(adjusted, "standard", 7) - predictGroup(adjusted, "standard", 4));
  });

  it("computes Student t inference accurately", () => {
    expect(studentTCritical95(87)).toBeCloseTo(1.987608, 5);
    expect(twoSidedStudentTPValue(2.149233, 87)).toBeCloseTo(0.03439281, 6);
  });
});
