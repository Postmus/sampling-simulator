import type { RNG } from "../rng";

export interface NormalDistribution {
  mean: number;
  sd: number;
}

export function drawNormal(distribution: NormalDistribution, rng: RNG): number {
  const firstUniform = Math.max(rng.next(), Number.EPSILON);
  const secondUniform = rng.next();
  const standardNormal =
    Math.sqrt(-2 * Math.log(firstUniform)) * Math.cos(2 * Math.PI * secondUniform);
  return distribution.mean + distribution.sd * standardNormal;
}

export function drawNormalSample(
  distribution: NormalDistribution,
  sampleSize: number,
  rng: RNG,
): number[] {
  return Array.from({ length: sampleSize }, () => drawNormal(distribution, rng));
}

export function normalDensity(value: number, distribution: NormalDistribution): number {
  const z = (value - distribution.mean) / distribution.sd;
  return Math.exp(-0.5 * z * z) / (distribution.sd * Math.sqrt(2 * Math.PI));
}
