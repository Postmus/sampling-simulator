import { describe, expect, it } from "vitest";
import { createRng } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";
import { analyseHospitals, DEFAULT_CONFIGURATION, displayHospitals, outcomeDomain, simulateTrial, summariseTrial, trueEffect, type Configuration } from "./model";

function fixture(offsets = [-10, -6, -2, 2, 6, 10]) {
  return offsets.map((offset, id) => ({ id, sampleMean: NaN,
    patients: Array.from({ length: 20 }, (_, patientId) => ({ id: patientId, treated: patientId >= 10,
      outcome: 130 - (patientId >= 10 ? 2 : 0) + offset + (patientId % 10) - 4.5 })),
  }));
}

function repeat(configuration: Configuration, count = 12_000) {
  const rng = createRng(618273);
  return Array.from({ length: count }, () => summariseTrial(simulateTrial(configuration, rng), trueEffect(configuration)));
}

describe("balanced treatment randomisation within hospitals", () => {
  it("matches independent R lm, fixed-hospital regression and nlme REML results", () => {
    // y = 130 - 2*treatment + hospitalOffset + rep((1:10)-5.5, 12).
    const trial = analyseHospitals(fixture());
    expect(trial.ordinary.estimate).toBeCloseTo(-2, 12);
    expect(trial.mixed.estimate).toBeCloseTo(-2, 12);
    expect(trial.ordinary.se).toBeCloseTo(1.364398006780, 10);
    expect(trial.ordinary.pValue).toBeCloseTo(0.145349427807, 10);
    expect(trial.mixed.se).toBeCloseTo(0.540402996134, 10);
    expect(trial.mixed.pValue).toBeCloseTo(0.000333564034205, 12);
    expect(trial.residualVariance).toBeCloseTo(990 / 113, 12);
    expect(trial.hospitalVariance).toBeCloseTo((1120 - 990 / 113) / 20, 12);
    expect(trial.ordinary.df).toBe(118);
    expect(trial.mixed.df).toBe(113);
    expect(trial.ordinary.rejected).toBe(false);
    expect(trial.mixed.rejected).toBe(true);
  });

  it("keeps boundary fits finite and includes them in summaries", () => {
    const trial = analyseHospitals(fixture([0, 0, 0, 0, 0, 0]));
    expect(trial.boundaryFit).toBe(true);
    expect(trial.hospitalVariance).toBe(0);
    expect(trial.residualVariance).toBeCloseTo(990 / 118, 12);
    expect(trial.mixed.se).toBe(trial.ordinary.se);
    expect(trial.mixed.df).toBe(113);
    expect(summariseTrial(trial, -2).mixedCovered).toBe(true);
    const constant = fixture().map((hospital) => ({ ...hospital, patients: hospital.patients.map((patient) => ({ ...patient, outcome: 130 })) }));
    expect(analyseHospitals(constant).mixed.pValue).toBe(1);
  });

  it("randomises exactly ten patients to each arm in all six hospitals and replays seeds", () => {
    const rng = createRng(42);
    const allocations = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const trial = simulateTrial(DEFAULT_CONFIGURATION, rng);
      expect(trial.hospitals).toHaveLength(6);
      for (const hospital of trial.hospitals) {
        expect(hospital.patients).toHaveLength(20);
        expect(hospital.patients.filter((patient) => patient.treated)).toHaveLength(10);
        expect(hospital.patients.filter((patient) => !patient.treated)).toHaveLength(10);
        allocations.add(hospital.patients.map((patient) => Number(patient.treated)).join(""));
      }
    }
    expect(allocations.size).toBeGreaterThan(100);
    expect(simulateTrial(DEFAULT_CONFIGURATION, createRng(42))).toEqual(simulateTrial(DEFAULT_CONFIGURATION, createRng(42)));
  });

  it("centres both treatment groups on their observed hospital mean without mutating the trial", () => {
    const trial = simulateTrial({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" }, createRng(42));
    const original = JSON.stringify(trial);
    const displayed = displayHospitals(trial, true);
    displayed.forEach((hospital, id) => {
      expect(mean(hospital.patients.map((patient) => patient.outcome))).toBeCloseTo(0, 12);
      hospital.patients.forEach((patient, index) => expect(patient.outcome).toBeCloseTo(trial.hospitals[id].patients[index].outcome - trial.hospitals[id].sampleMean, 12));
      const difference = (patients: typeof hospital.patients) => mean(patients.filter((patient) => patient.treated).map((patient) => patient.outcome))
        - mean(patients.filter((patient) => !patient.treated).map((patient) => patient.outcome));
      expect(difference(hospital.patients)).toBeCloseTo(difference(trial.hospitals[id].patients), 12);
    });
    const patients = displayed.flatMap((hospital) => hospital.patients);
    const difference = mean(patients.filter((patient) => patient.treated).map((patient) => patient.outcome))
      - mean(patients.filter((patient) => !patient.treated).map((patient) => patient.outcome));
    expect(difference).toBeCloseTo(trial.ordinary.estimate, 12);
    expect(JSON.stringify(trial)).toBe(original);
    expect(displayHospitals(trial, false)).toEqual(trial.hospitals);
  });

  it("fits every patient on the raw and centred outcome scales, including extreme observations", () => {
    const trial = simulateTrial(DEFAULT_CONFIGURATION, createRng(42));
    trial.hospitals[0].patients[0].outcome = 1000;
    const fitted = analyseHospitals(trial.hospitals);
    for (const centered of [false, true]) {
      const domain = outcomeDomain(DEFAULT_CONFIGURATION, fitted, centered);
      for (const hospital of displayHospitals(fitted, centered)) {
        for (const patient of hospital.patients) {
          expect(patient.outcome).toBeGreaterThan(domain[0]);
          expect(patient.outcome).toBeLessThan(domain[1]);
        }
      }
    }
  });

  it.each([0.1, 0.3, 0.9])("controls null error while ordinary regression is conservative at ICC %s", (icc) => {
    const configuration = { ...DEFAULT_CONFIGURATION, icc };
    const results = repeat(configuration);
    const mixed = results.filter((result) => result.mixedRejected).length / results.length;
    const ordinary = results.filter((result) => result.ordinaryRejected).length / results.length;
    expect(mixed).toBeGreaterThan(0.035);
    expect(mixed).toBeLessThan(0.065);
    expect(ordinary).toBeLessThan(mixed);
    const expectedSE = 12 * Math.sqrt(2 * (1 - icc) / 60);
    const estimates = results.map((result) => result.estimate);
    expect(Math.abs(mean(estimates))).toBeLessThan(expectedSE * 0.03);
    expect(standardDeviation(estimates) / expectedSE).toBeGreaterThan(0.97);
    expect(standardDeviation(estimates) / expectedSE).toBeLessThan(1.03);
    expect(results.every((result) => result.mixedCovered === !result.mixedRejected)).toBe(true);
  });

  it("gains power by using the blocks and by increasing ICC at a fixed total SD", () => {
    const configuration = { ...DEFAULT_CONFIGURATION, hypothesis: "h1" as const };
    const results = repeat(configuration, 6000);
    const mixed = results.filter((result) => result.mixedRejected).length / results.length;
    const ordinary = results.filter((result) => result.ordinaryRejected).length / results.length;
    expect(mixed).toBeGreaterThan(ordinary + 0.05);
    expect(mixed).toBeGreaterThan(0.7);
    expect(mixed).toBeLessThan(0.85);
    const highICC = repeat({ ...configuration, icc: 0.9 }, 6000);
    expect(highICC.filter((result) => result.mixedRejected).length / highICC.length).toBeGreaterThan(mixed + 0.1);
    expect(results.filter((result) => result.mixedCovered).length / results.length).toBeGreaterThan(0.93);
  });

  it("changes only treated outcomes under H1 and rejects invalid allocations", () => {
    const nullTrial = simulateTrial(DEFAULT_CONFIGURATION, createRng(17));
    const alternative = simulateTrial({ ...DEFAULT_CONFIGURATION, hypothesis: "h1" }, createRng(17));
    nullTrial.hospitals.forEach((hospital, id) => hospital.patients.forEach((patient, index) => {
      expect(alternative.hospitals[id].patients[index].outcome - patient.outcome).toBeCloseTo(patient.treated ? -5 : 0, 12);
    }));
    expect(alternative.mixed.estimate - nullTrial.mixed.estimate).toBeCloseTo(-5, 12);
    expect(alternative.mixed.se).toBeCloseTo(nullTrial.mixed.se, 12);
    expect(() => analyseHospitals(fixture().slice(1))).toThrow();
    expect(() => analyseHospitals(fixture().map((hospital) => ({ ...hospital, patients: hospital.patients.map((patient) => ({ ...patient, treated: true })) })))).toThrow();
    expect(() => simulateTrial({ ...DEFAULT_CONFIGURATION, icc: 0 }, createRng(42))).toThrow();
  });
});
