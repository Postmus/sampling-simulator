import { mean } from "./statistics";

export interface RegressionPoint {
  id: string;
  x: number;
  y: number;
}

export interface RegressionLine {
  slope: number;
  intercept: number;
}

export interface RegressionFit extends RegressionLine {
  sse: number;
  sst: number;
  rSquared: number;
  xMean: number;
  yMean: number;
}

export interface Residual {
  point: RegressionPoint;
  predicted: number;
  residual: number;
}

export function predict(line: RegressionLine, x: number) {
  return line.intercept + line.slope * x;
}

export function residuals(points: readonly RegressionPoint[], line: RegressionLine): Residual[] {
  return points.map((point) => {
    const predicted = predict(line, point.x);
    return { point, predicted, residual: point.y - predicted };
  });
}

export function sumSquaredErrors(points: readonly RegressionPoint[], line: RegressionLine) {
  return residuals(points, line).reduce((sum, item) => sum + item.residual ** 2, 0);
}

export function fitLeastSquares(points: readonly RegressionPoint[]): RegressionFit {
  if (points.length < 2) {
    throw new Error("At least two observations are required to fit a regression line.");
  }

  const xMean = mean(points.map((point) => point.x));
  const yMean = mean(points.map((point) => point.y));
  const xVariation = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);

  if (xVariation === 0) {
    throw new Error("A regression line requires variation in the explanatory variable.");
  }

  const crossVariation = points.reduce(
    (sum, point) => sum + (point.x - xMean) * (point.y - yMean),
    0,
  );
  const slope = crossVariation / xVariation;
  const intercept = yMean - slope * xMean;
  const line = { slope, intercept };
  const sse = sumSquaredErrors(points, line);
  const sst = points.reduce((sum, point) => sum + (point.y - yMean) ** 2, 0);
  const rSquared = sst === 0 ? 1 : 1 - sse / sst;

  return { ...line, sse, sst, rSquared, xMean, yMean };
}
