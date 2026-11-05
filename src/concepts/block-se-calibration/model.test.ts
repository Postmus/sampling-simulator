import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import { CENTER_EFFECTS, DEFAULT_CONFIGURATION, analyse, histogram, reportedSEBox, simulate, summarize, validConfiguration } from "./model";
import { messages } from "./messages";

describe("fixed-center SE calibration", () => {
  it("matches independent R lm fits, including residual variance and df", () => {
    // R: j=rep(0:5,each=20); i=rep(0:19,6); t=as.numeric(i>=10)
    // y=360+10*t+c(-17,16,8,-29,27,-5)[j+1]+3*((i%%10)-4.5)+(j-2.5)*t
    // coef(summary(lm(y~t))); coef(summary(lm(y~t+factor(j)))); sigma(...)
    const patients = CENTER_EFFECTS.flatMap((effect, center) => Array.from({ length: 20 }, (_, i) => ({ center, treated: i >= 10,
      outcome: 360 + 10 * Number(i >= 10) + effect + 3 * (i % 10 - 4.5) + (center - 2.5) * Number(i >= 10) })));
    const result = analyse(patients);
    expect(result.treatment.estimate).toBeCloseTo(10, 12);
    expect(result.center.estimate).toBeCloseTo(10, 12);
    expect(result.treatment.se).toBeCloseTo(3.89570964938564, 11);
    expect(result.center.se).toBeCloseTo(1.62915002179367, 11);
    expect(result.treatment.residualSD).toBeCloseTo(21.3376805245906, 11);
    expect(result.center.residualSD).toBeCloseTo(8.92322216496428, 11);
    expect(result.treatment.df).toBe(118);
    expect(result.center.df).toBe(113);
    expect(() => analyse(patients.slice(1))).toThrow();
  });

  it("holds center effects fixed, preserves balanced cells and replays seeds", () => {
    const a = simulate(DEFAULT_CONFIGURATION, createRng(158));
    expect(a).toEqual(simulate(DEFAULT_CONFIGURATION, createRng(158)));
    for (let j = 0; j < 6; j++) {
      expect(a.patients.filter(p => p.center === j && p.treated)).toHaveLength(10);
      expect(a.patients.filter(p => p.center === j && !p.treated)).toHaveLength(10);
    }
    // Remove only the known effect; identical RNG streams must reproduce all individual errors.
    const b = simulate({ ...DEFAULT_CONFIGURATION, effect: 0 }, createRng(158));
    a.patients.forEach((p, i) => expect(p.outcome - b.patients[i].outcome).toBeCloseTo(p.treated ? 10 : 0, 12));
    expect(a.result.treatment.estimate).toBe(a.result.center.estimate);
  });

  it("reproduces the analytic sampling variance and the fixed-center residual-variance inflation", () => {
    const rng = createRng(7731);
    const results = Array.from({ length: 12000 }, () => simulate(DEFAULT_CONFIGURATION, rng).result);
    const treatment = summarize(results, "treatment", 10);
    const center = summarize(results, "center", 10);
    const trueVariance = 24 ** 2 * 2 / 60;
    const treatmentVariance = (24 ** 2 + 20 * CENTER_EFFECTS.reduce((s, c) => s + c * c, 0) / 118) * 2 / 60;
    expect(Math.abs(treatment.bias!)).toBeLessThan(.12);
    expect(treatment.empiricalSE! ** 2 / trueVariance).toBeGreaterThan(.96);
    expect(treatment.empiricalSE! ** 2 / trueVariance).toBeLessThan(1.04);
    const meanEstimatedVariance = (key: "treatment" | "center") => results.reduce((sum, result) => sum + result[key].se ** 2, 0) / results.length;
    expect(meanEstimatedVariance("center") / trueVariance).toBeCloseTo(1, 2);
    expect(meanEstimatedVariance("treatment") / treatmentVariance).toBeCloseTo(1, 2);
    expect(treatment.reportedSE!).toBeGreaterThan(treatment.empiricalSE! * 1.2);
    expect(center.empiricalSE).toBe(treatment.empiricalSE);
    const centerMeans = Array.from({ length: 6 }, (_, j) => {
      const stream = createRng(7731);
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += simulate(DEFAULT_CONFIGURATION, stream).patients.filter(p => p.center === j).reduce((s, p) => s + p.outcome - 10 * Number(p.treated), 0) / 20;
      return sum / 1000;
    });
    centerMeans.forEach((value, j) => expect(Math.abs(value - 360 - CENTER_EFFECTS[j])).toBeLessThan(.6));
  });

  it("handles empty/one-dataset summaries, arithmetic-mean SE aggregation, and extreme chart values", () => {
    expect(summarize([], "center", 10).reportedSE).toBeNull();
    const a = simulate(DEFAULT_CONFIGURATION, createRng(2)).result;
    expect(summarize([a], "center", 10).empiricalSE).toBeNull();
    const b = { ...a, center: { ...a.center, se: 2 } };
    const c = { ...a, center: { ...a.center, se: 4 } };
    expect(summarize([b, c], "center", 10).reportedSE).toBe(3);
    expect(summarize([b], "center", 10).reportedSE).toBe(2);
    const h = histogram([-200, 250], 10, 24);
    expect(h.low).toBeLessThan(-200); expect(h.high).toBeGreaterThan(250);
    expect(h.bins.reduce((s, n) => s + n, 0)).toBe(2);
    expect(validConfiguration({ effect: NaN, residualSD: 24 })).toBe(false);
    expect(validConfiguration({ effect: 10, residualSD: 0 })).toBe(false);
    expect(Object.keys(messages.nl).sort()).toEqual(Object.keys(messages.en).sort());
  });
  it("uses Tukey hinges and preserves outliers in the reported-SE boxplot", () => {
    const values = [...Array.from({ length: 59 }, (_, i) => i + 1), 200].reverse();
    const original = [...values];
    const box = reportedSEBox(values)!;
    // R boxplot.stats(c(1:59, 200))$stats
    expect([box.low, box.q1, box.median, box.q3, box.high]).toEqual([1, 15.5, 30.5, 45.5, 59]);
    expect(box.outliers).toEqual([200]);
    expect(values).toEqual(original);
    expect(reportedSEBox([])).toBeNull();
    expect(reportedSEBox([4])).toEqual({ n: 1, low: 4, q1: 4, median: 4, q3: 4, high: 4, outliers: [] });
    expect(reportedSEBox([1, 2, 3, 4, 5])).toEqual({ n: 5, low: 1, q1: 2, median: 3, q3: 4, high: 5, outliers: [] });
    expect(() => reportedSEBox([NaN])).toThrow();
  });

});
