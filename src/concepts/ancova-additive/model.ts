import { mean } from "../../domain/statistics";
import type { AncovaObservation, TreatmentGroup } from "./data";

export type AncovaModelKind = "unadjusted" | "adjusted";
export type AncovaTerm = "intercept" | "baseline" | "rinse" | "adjunct";

export interface CoefficientInference {
  term: AncovaTerm;
  estimate: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface AncovaFit {
  kind: AncovaModelKind;
  coefficients: readonly CoefficientInference[];
  coefficientMap: Record<AncovaTerm, number>;
  fitted: readonly number[];
  residuals: readonly number[];
  sse: number;
  residualStandardError: number;
  residualDegreesOfFreedom: number;
  rSquared: number;
  treatmentMeans: Record<TreatmentGroup, number>;
  overallBaselineMean: number;
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

// Lanczos approximation, followed by the continued-fraction form of the incomplete beta.
function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  const shifted = value - 1;
  let series = 0.9999999999998099;
  coefficients.forEach((coefficient, index) => { series += coefficient / (shifted + index + 1); });
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(series);
}

function betaContinuedFraction(a: number, b: number, x: number) {
  const maximumIterations = 200;
  const epsilon = 3e-14;
  const floor = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < floor) d = floor;
  d = 1 / d;
  let result = d;
  for (let iteration = 1; iteration <= maximumIterations; iteration += 1) {
    const doubled = 2 * iteration;
    let numerator = (iteration * (b - iteration) * x) / ((qam + doubled) * (a + doubled));
    d = 1 + numerator * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + numerator / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    result *= d * c;
    numerator = -((a + iteration) * (qab + iteration) * x) / ((a + doubled) * (qap + doubled));
    d = 1 + numerator * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + numerator / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    const delta = d * c;
    result *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return result;
}

function regularizedIncompleteBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (factor * betaContinuedFraction(a, b, x)) / a;
  return 1 - (factor * betaContinuedFraction(b, a, 1 - x)) / b;
}

export function twoSidedStudentTPValue(tStatistic: number, degreesOfFreedom: number) {
  const x = degreesOfFreedom / (degreesOfFreedom + tStatistic ** 2);
  return regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);
}

export function studentTCritical95(degreesOfFreedom: number) {
  let low = 0;
  let high = 10;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const middle = (low + high) / 2;
    if (twoSidedStudentTPValue(middle, degreesOfFreedom) > 0.05) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function rowForObservation(observation: AncovaObservation, kind: AncovaModelKind) {
  const indicators = [Number(observation.group === "rinse"), Number(observation.group === "adjunct")];
  return kind === "adjusted" ? [1, observation.baseline, ...indicators] : [1, ...indicators];
}

export function fitAncova(data: readonly AncovaObservation[], kind: AncovaModelKind): AncovaFit {
  if (data.length < 5) throw new Error("At least five observations are required.");
  const terms: AncovaTerm[] = kind === "adjusted"
    ? ["intercept", "baseline", "rinse", "adjunct"]
    : ["intercept", "rinse", "adjunct"];
  const design = data.map((observation) => rowForObservation(observation, kind));
  const outcome = data.map((observation) => [observation.outcome]);
  const designTranspose = transpose(design);
  const informationInverse = invert(multiply(designTranspose, design));
  const estimates = multiply(multiply(informationInverse, designTranspose), outcome).map((row) => row[0]);
  const fitted = design.map((row) => row.reduce((sum, value, index) => sum + value * estimates[index], 0));
  const residuals = data.map((observation, index) => observation.outcome - fitted[index]);
  const sse = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const degreesOfFreedom = data.length - terms.length;
  const residualVariance = sse / degreesOfFreedom;
  const critical = studentTCritical95(degreesOfFreedom);
  const coefficients = terms.map((term, index): CoefficientInference => {
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
  const coefficientMap: Record<AncovaTerm, number> = { intercept: 0, baseline: 0, rinse: 0, adjunct: 0 };
  coefficients.forEach((coefficient) => { coefficientMap[coefficient.term] = coefficient.estimate; });
  const outcomeMean = mean(data.map((observation) => observation.outcome));
  const totalSumOfSquares = data.reduce((sum, observation) => sum + (observation.outcome - outcomeMean) ** 2, 0);
  const treatmentMeans = Object.fromEntries(
    (["standard", "rinse", "adjunct"] as TreatmentGroup[]).map((group) => [
      group,
      mean(data.filter((observation) => observation.group === group).map((observation) => observation.outcome)),
    ]),
  ) as Record<TreatmentGroup, number>;

  return {
    kind,
    coefficients,
    coefficientMap,
    fitted,
    residuals,
    sse,
    residualStandardError: Math.sqrt(residualVariance),
    residualDegreesOfFreedom: degreesOfFreedom,
    rSquared: 1 - sse / totalSumOfSquares,
    treatmentMeans,
    overallBaselineMean: mean(data.map((observation) => observation.baseline)),
  };
}

export function predictGroup(fit: AncovaFit, group: TreatmentGroup, baseline: number) {
  return fit.coefficientMap.intercept
    + fit.coefficientMap.baseline * baseline
    + (group === "rinse" ? fit.coefficientMap.rinse : 0)
    + (group === "adjunct" ? fit.coefficientMap.adjunct : 0);
}
