export type TeachingMode = "mean" | "proportion";

export type MeanPopulationKind = "normal" | "uniform" | "rightSkewed";
export type PopulationKind = MeanPopulationKind | "bernoulli";

export interface MeanPopulationParams {
  mean: number;
  sd: number;
}

export interface BernoulliPopulationParams {
  p: number;
}

export interface MeanPopulationConfig {
  kind: MeanPopulationKind;
  params: MeanPopulationParams;
}

export interface BernoulliPopulationConfig {
  kind: "bernoulli";
  params: BernoulliPopulationParams;
}

export type PopulationConfig = MeanPopulationConfig | BernoulliPopulationConfig;

export interface SamplingState {
  sampleSize: number;
  estimates: number[];
  currentSample: number[];
  currentEstimate: number | null;
}

export interface SimulationSummary {
  estimates: number[];
  empiricalMean: number | null;
  empiricalSE: number | null;
  theoreticalMean: number | null;
  theoreticalSE: number | null;
  practicalCoverageCount: number;
}
