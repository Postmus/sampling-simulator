import { mean } from "../../domain/statistics";
import { studentTCritical95, twoSidedStudentTPValue } from "../ancova-additive/model";
import type { ImplantObservation, JawGroup } from "./data";

export type InteractionModelKind = "additive" | "interaction";
export type InteractionTerm = "intercept" | "torque" | "lower" | "interaction";

export interface InteractionCoefficient {
  term: InteractionTerm;
  estimate: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface InteractionFit {
  kind: InteractionModelKind;
  coefficients: readonly InteractionCoefficient[];
  coefficientMap: Record<InteractionTerm, number>;
  sse: number;
  residualStandardError: number;
  residualDegreesOfFreedom: number;
  rSquared: number;
}

function transpose(matrix: readonly (readonly number[])[]) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiply(left: readonly (readonly number[])[], right: readonly (readonly number[])[]) {
  return left.map((row) => right[0].map((_, column) =>
    row.reduce((sum, value, index) => sum + value * right[index][column], 0),
  ));
}

function invert(matrix: readonly (readonly number[])[]) {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => Number(index === column)),
  ]);
  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) pivotRow = row;
    }
    if (Math.abs(augmented[pivotRow][column]) < 1e-12) throw new Error("The model matrix is singular.");
    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];
    const pivot = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / pivot);
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index]);
    }
  }
  return augmented.map((row) => row.slice(size));
}

function designRow(observation: ImplantObservation, kind: InteractionModelKind) {
  const lower = Number(observation.jaw === "lower");
  return kind === "interaction"
    ? [1, observation.torque, lower, observation.torque * lower]
    : [1, observation.torque, lower];
}

export function fitInteractionModel(data: readonly ImplantObservation[], kind: InteractionModelKind): InteractionFit {
  const terms: InteractionTerm[] = kind === "interaction"
    ? ["intercept", "torque", "lower", "interaction"]
    : ["intercept", "torque", "lower"];
  const design = data.map((observation) => designRow(observation, kind));
  const outcome = data.map((observation) => [observation.isq]);
  const designTranspose = transpose(design);
  const informationInverse = invert(multiply(designTranspose, design));
  const estimates = multiply(multiply(informationInverse, designTranspose), outcome).map((row) => row[0]);
  const fitted = design.map((row) => row.reduce((sum, value, index) => sum + value * estimates[index], 0));
  const residuals = data.map((observation, index) => observation.isq - fitted[index]);
  const sse = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const degreesOfFreedom = data.length - terms.length;
  const residualVariance = sse / degreesOfFreedom;
  const critical = studentTCritical95(degreesOfFreedom);
  const coefficients = terms.map((term, index): InteractionCoefficient => {
    const estimate = estimates[index];
    const standardError = Math.sqrt(residualVariance * informationInverse[index][index]);
    const tStatistic = estimate / standardError;
    return {
      term,
      estimate,
      standardError,
      tStatistic,
      pValue: twoSidedStudentTPValue(tStatistic, degreesOfFreedom),
      confidenceLow: estimate - critical * standardError,
      confidenceHigh: estimate + critical * standardError,
    };
  });
  const coefficientMap: Record<InteractionTerm, number> = { intercept: 0, torque: 0, lower: 0, interaction: 0 };
  coefficients.forEach((coefficient) => { coefficientMap[coefficient.term] = coefficient.estimate; });
  const outcomeMean = mean(data.map((observation) => observation.isq));
  const totalSumOfSquares = data.reduce((sum, observation) => sum + (observation.isq - outcomeMean) ** 2, 0);
  return {
    kind,
    coefficients,
    coefficientMap,
    sse,
    residualStandardError: Math.sqrt(residualVariance),
    residualDegreesOfFreedom: degreesOfFreedom,
    rSquared: 1 - sse / totalSumOfSquares,
  };
}

export function predictJaw(fit: InteractionFit, jaw: JawGroup, torque: number) {
  const lower = Number(jaw === "lower");
  return fit.coefficientMap.intercept
    + fit.coefficientMap.torque * torque
    + fit.coefficientMap.lower * lower
    + fit.coefficientMap.interaction * torque * lower;
}

export function jawDifference(fit: InteractionFit, torque: number) {
  return predictJaw(fit, "lower", torque) - predictJaw(fit, "upper", torque);
}

export function compareInteractionModels(additive: InteractionFit, interaction: InteractionFit) {
  const numeratorDf = additive.residualDegreesOfFreedom - interaction.residualDegreesOfFreedom;
  const fStatistic = ((additive.sse - interaction.sse) / numeratorDf)
    / (interaction.sse / interaction.residualDegreesOfFreedom);
  const interactionCoefficient = interaction.coefficients.find((entry) => entry.term === "interaction")!;
  return {
    rSquaredChange: interaction.rSquared - additive.rSquared,
    fStatistic,
    numeratorDf,
    denominatorDf: interaction.residualDegreesOfFreedom,
    pValue: interactionCoefficient.pValue,
  };
}
