import { drawNormal } from "../../domain/distributions/normal";
import { studentTCritical95, twoSidedStudentTPValue } from "../../domain/distributions/studentT";
import type { RNG } from "../../domain/rng";
import { mean } from "../../domain/statistics";
import { ALPHA, CONTROL_MEAN, DEFAULT_CONFIGURATION, HOSPITALS, MAX_TRIALS, ORDINARY_DF, PATIENTS_PER_HOSPITAL,
  paddedDomain, trueEffect, validateConfiguration, varianceComponents,
  type Analysis, type Configuration, type TrialSummary } from "../cluster-randomization/model";

export { DEFAULT_CONFIGURATION, HOSPITALS, MAX_TRIALS, ORDINARY_DF, PATIENTS_PER_HOSPITAL, trueEffect, validateConfiguration, varianceComponents };
export type { Configuration, TrialSummary };
export const PATIENTS_PER_ARM_PER_HOSPITAL = 10;
export const PATIENTS_PER_ARM = HOSPITALS * PATIENTS_PER_ARM_PER_HOSPITAL;
export const MIXED_DF = HOSPITALS * PATIENTS_PER_HOSPITAL - HOSPITALS - 1;
const ORDINARY_CRITICAL = studentTCritical95(ORDINARY_DF);
const MIXED_CRITICAL = studentTCritical95(MIXED_DF);

export interface Patient { id: number; treated: boolean; outcome: number }
export interface Hospital { id: number; patients: Patient[]; sampleMean: number }
export interface Trial {
  hospitals: Hospital[];
  ordinary: Analysis;
  mixed: Analysis;
  hospitalVariance: number;
  residualVariance: number;
  boundaryFit: boolean;
}

function inference(estimate: number, se: number, df: number, critical: number): Analysis {
  const pValue = se === 0 ? (estimate === 0 ? 1 : 0) : twoSidedStudentTPValue(estimate / se, df);
  return { estimate, se, df, low: estimate - critical * se, high: estimate + critical * se, pValue, rejected: pValue < ALPHA };
}

/** Balanced Gaussian random-intercept REML for treatment randomised within hospitals.
 * Hospital-mean contrasts have 5 df; within-hospital residuals after estimating the
 * common treatment effect have 120 - 6 - 1 = 113 df. Orthogonality makes treatment
 * uncertainty depend only on residual variance. The nonnegative-variance boundary
 * pools both residual sums of squares and retains the pre-specified t(113) reference.
 */
export function analyseHospitals(hospitals: Hospital[]): Trial {
  if (hospitals.length !== HOSPITALS || hospitals.some((hospital) =>
    hospital.patients.length !== PATIENTS_PER_HOSPITAL
    || hospital.patients.filter((patient) => patient.treated).length !== PATIENTS_PER_ARM_PER_HOSPITAL
    || hospital.patients.some((patient) => !Number.isFinite(patient.outcome)))) {
    throw new Error("Expected six hospitals with ten control and ten intervention patients each.");
  }
  const observed = hospitals.map((hospital) => ({ ...hospital, sampleMean: mean(hospital.patients.map((patient) => patient.outcome)) }));
  const patients = observed.flatMap((hospital) => hospital.patients);
  const controlMean = mean(patients.filter((patient) => !patient.treated).map((patient) => patient.outcome));
  const treatmentMean = mean(patients.filter((patient) => patient.treated).map((patient) => patient.outcome));
  const estimate = treatmentMean - controlMean;
  const grandMean = mean(observed.map((hospital) => hospital.sampleMean));
  const withinSS = observed.reduce((sum, hospital) => sum + hospital.patients.reduce((subtotal, patient) => subtotal
    + (patient.outcome - hospital.sampleMean - estimate * (Number(patient.treated) - 0.5)) ** 2, 0), 0);
  const betweenSS = PATIENTS_PER_HOSPITAL * observed.reduce((sum, hospital) => sum + (hospital.sampleMean - grandMean) ** 2, 0);
  const withinMS = withinSS / MIXED_DF;
  const betweenMS = betweenSS / (HOSPITALS - 1);
  const ordinaryVariance = (withinSS + betweenSS) / ORDINARY_DF;
  const boundaryFit = betweenMS <= withinMS;
  const residualVariance = boundaryFit ? ordinaryVariance : withinMS;
  const hospitalVariance = boundaryFit ? 0 : (betweenMS - withinMS) / PATIENTS_PER_HOSPITAL;
  return {
    hospitals: observed,
    ordinary: inference(estimate, Math.sqrt(2 * ordinaryVariance / PATIENTS_PER_ARM), ORDINARY_DF, ORDINARY_CRITICAL),
    mixed: inference(estimate, Math.sqrt(2 * residualVariance / PATIENTS_PER_ARM), MIXED_DF, MIXED_CRITICAL),
    hospitalVariance, residualVariance, boundaryFit,
  };
}

export function simulateTrial(configuration: Configuration, rng: RNG): Trial {
  if (!validateConfiguration(configuration)) throw new Error("Invalid blocked-trial configuration.");
  const variances = varianceComponents(configuration);
  return analyseHospitals(Array.from({ length: HOSPITALS }, (_, id) => {
    const ids = Array.from({ length: PATIENTS_PER_HOSPITAL }, (_, patientId) => patientId);
    for (let index = ids.length - 1; index > 0; index -= 1) {
      const other = Math.floor(rng.next() * (index + 1));
      [ids[index], ids[other]] = [ids[other], ids[index]];
    }
    const treatedIds = new Set(ids.slice(0, PATIENTS_PER_ARM_PER_HOSPITAL));
    const hospitalEffect = drawNormal({ mean: 0, sd: Math.sqrt(variances.hospital) }, rng);
    const patients = Array.from({ length: PATIENTS_PER_HOSPITAL }, (_, patientId) => {
      const treated = treatedIds.has(patientId);
      return { id: patientId, treated, outcome: CONTROL_MEAN + hospitalEffect + (treated ? trueEffect(configuration) : 0)
        + drawNormal({ mean: 0, sd: Math.sqrt(variances.residual) }, rng) };
    });
    return { id, patients, sampleMean: mean(patients.map((patient) => patient.outcome)) };
  }));
}

export function summariseTrial(trial: Trial, effect: number): TrialSummary {
  return {
    estimate: trial.ordinary.estimate, ordinaryRejected: trial.ordinary.rejected, mixedRejected: trial.mixed.rejected,
    ordinaryCovered: trial.ordinary.low <= effect && trial.ordinary.high >= effect,
    mixedCovered: trial.mixed.low <= effect && trial.mixed.high >= effect,
  };
}

/** A display transformation only; fitting and simulation always retain raw outcomes. */
export function displayHospitals(trial: Trial, centered: boolean): Hospital[] {
  return trial.hospitals.map((hospital) => ({ ...hospital, sampleMean: centered ? 0 : hospital.sampleMean,
    patients: hospital.patients.map((patient) => ({ ...patient, outcome: patient.outcome - (centered ? hospital.sampleMean : 0) })) }));
}

export function outcomeDomain(configuration: Configuration, trial: Trial | null, centered: boolean): [number, number] {
  const effect = trueEffect(configuration);
  const values = trial ? displayHospitals(trial, centered).flatMap((hospital) => hospital.patients.map((patient) => patient.outcome)) : [];
  if (centered) {
    const spread = Math.abs(effect) / 2 + 3 * Math.sqrt(varianceComponents(configuration).residual);
    return paddedDomain(values, [-spread, spread]);
  }
  return paddedDomain(values, [CONTROL_MEAN + Math.min(0, effect) - 3 * configuration.totalSD,
    CONTROL_MEAN + Math.max(0, effect) + 3 * configuration.totalSD]);
}
