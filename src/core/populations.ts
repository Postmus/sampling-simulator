import type {
  BernoulliPopulationConfig,
  MeanPopulationConfig,
  MeanPopulationKind,
  PopulationConfig,
} from "./types";
import type { RNG } from "./rng";

export function drawSample(
  population: PopulationConfig,
  sampleSize: number,
  rng: RNG,
): number[] {
  return Array.from({ length: sampleSize }, () => drawOne(population, rng));
}

function drawOne(population: PopulationConfig, rng: RNG): number {
  switch (population.kind) {
    case "normal":
      return drawNormal(population, rng);
    case "uniform":
      return drawUniform(population, rng);
    case "rightSkewed":
      return drawRightSkewed(population, rng);
    case "bernoulli":
      return drawBernoulli(population, rng);
    default:
      return 0;
  }
}

function drawNormal(population: MeanPopulationConfig, rng: RNG): number {
  const u1 = Math.max(rng.next(), Number.EPSILON);
  const u2 = rng.next();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return population.params.mean + population.params.sd * z;
}

function drawUniform(population: MeanPopulationConfig, rng: RNG): number {
  const halfWidth = (Math.sqrt(12) * population.params.sd) / 2;
  const min = population.params.mean - halfWidth;
  const max = population.params.mean + halfWidth;
  return min + (max - min) * rng.next();
}

function drawRightSkewed(population: MeanPopulationConfig, rng: RNG): number {
  const { muLog, sigmaLog } = getLogNormalParameters(
    population.params.mean,
    population.params.sd,
  );
  const u1 = Math.max(rng.next(), Number.EPSILON);
  const u2 = rng.next();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(muLog + sigmaLog * z);
}

function drawBernoulli(population: BernoulliPopulationConfig, rng: RNG): number {
  return rng.next() < population.params.p ? 1 : 0;
}

function getLogNormalParameters(mean: number, sd: number) {
  const variance = sd ** 2;
  const sigmaLog = Math.sqrt(Math.log(1 + variance / mean ** 2));
  const muLog = Math.log(mean) - sigmaLog ** 2 / 2;
  return { muLog, sigmaLog };
}

export interface PopulationCurvePoint {
  x: number;
  y: number;
}

export function populationCurve(
  population: PopulationConfig,
  pointCount = 120,
): PopulationCurvePoint[] {
  if (population.kind === "bernoulli") {
    const { p } = population.params;
    return [
      { x: 0, y: 1 - p },
      { x: 1, y: p },
    ];
  }

  const range = getMeanPopulationRange(population.kind, population.params.mean, population.params.sd);
  const step = (range.max - range.min) / (pointCount - 1);

  return Array.from({ length: pointCount }, (_, index) => {
    const x = range.min + index * step;
    return {
      x,
      y: density(population, x),
    };
  });
}

function density(population: MeanPopulationConfig, x: number): number {
  const { mean, sd } = population.params;

  switch (population.kind) {
    case "normal": {
      const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
      const exponent = -((x - mean) ** 2) / (2 * sd ** 2);
      return coefficient * Math.exp(exponent);
    }
    case "uniform": {
      const halfWidth = (Math.sqrt(12) * sd) / 2;
      const min = mean - halfWidth;
      const max = mean + halfWidth;
      return x >= min && x <= max ? 1 / (max - min) : 0;
    }
    case "rightSkewed": {
      if (x <= 0) {
        return 0;
      }
      const { muLog, sigmaLog } = getLogNormalParameters(mean, sd);
      const coefficient = 1 / (x * sigmaLog * Math.sqrt(2 * Math.PI));
      const exponent = -((Math.log(x) - muLog) ** 2) / (2 * sigmaLog ** 2);
      return coefficient * Math.exp(exponent);
    }
  }
}

export function getMeanPopulationRange(
  kind: MeanPopulationKind,
  mean: number,
  sd: number,
) {
  if (kind === "rightSkewed") {
    return { min: 0, max: Math.max(mean + 5 * sd, mean * 3) };
  }

  return { min: mean - 4 * sd, max: mean + 4 * sd };
}
