import {
  fitLeastSquares,
  type RegressionFit,
  type RegressionPoint,
} from "../../domain/regression";

export type PredictorKind = "raw" | "log";

export interface DiagnosticResidual {
  point: RegressionPoint;
  modelX: number;
  predicted: number;
  residual: number;
}

export interface DiagnosticModel {
  predictor: PredictorKind;
  fit: RegressionFit;
  residuals: DiagnosticResidual[];
  residualStandardDeviation: number;
}

export function transformPredictor(x: number, predictor: PredictorKind) {
  if (predictor === "log") {
    if (x <= 0) {
      throw new Error("A logarithmic predictor requires positive x values.");
    }
    return Math.log2(x);
  }
  return x;
}

export function fitDiagnosticModel(
  points: readonly RegressionPoint[],
  predictor: PredictorKind,
): DiagnosticModel {
  const transformed = points.map((point) => ({
    ...point,
    x: transformPredictor(point.x, predictor),
  }));
  const fit = fitLeastSquares(transformed);
  const residuals = points.map((point, index) => {
    const modelX = transformed[index].x;
    const predicted = fit.intercept + fit.slope * modelX;
    return { point, modelX, predicted, residual: point.y - predicted };
  });
  const residualStandardDeviation = Math.sqrt(
    residuals.reduce((sum, item) => sum + item.residual ** 2, 0) /
      Math.max(1, residuals.length - 2),
  );

  return { predictor, fit, residuals, residualStandardDeviation };
}

export function normalDensity(value: number, standardDeviation: number) {
  if (standardDeviation <= 0) return 0;
  const z = value / standardDeviation;
  return Math.exp(-0.5 * z * z) / (standardDeviation * Math.sqrt(2 * Math.PI));
}
