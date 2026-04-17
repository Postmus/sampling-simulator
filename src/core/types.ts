export type TeachingMode = "mean" | "proportion";
export type WorkflowMode = "estimation" | "testing";
export type TestingKind = "mean" | "proportion";
export type StudyDesign = "oneGroup" | "twoGroups";
export type TestDirection = "two-sided" | "greater" | "less";
export type TestTruth = "h0" | "h1";

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

export interface TwoGroupMeanPopulationConfig {
  groupA: {
    mean: number;
  };
  groupB: {
    mean: number;
  };
  sd: number;
}

export interface TwoGroupProportionPopulationConfig {
  groupA: {
    p: number;
  };
  groupB: {
    p: number;
  };
}

export type TwoGroupPopulationConfig =
  | TwoGroupMeanPopulationConfig
  | TwoGroupProportionPopulationConfig;

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

export interface TwoGroupSimulationSummary extends SimulationSummary {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}

export interface TestingSummary {
  statistics: number[];
  empiricalRejectionRate: number | null;
  theoreticalRejectionRate: number | null;
  criticalValue: number | null;
  criticalLower: number | null;
  criticalUpper: number | null;
  rejectionMask: boolean[] | null;
  rejectionCount: number;
  latestSample: number[] | null;
  latestStatistic: number | null;
  latestPValue: number | null;
  latestReject: boolean | null;
}

export interface TwoGroupTestingSummary extends Omit<TestingSummary, "latestSample"> {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}

export interface TwoGroupProportionTestingSummary extends Omit<TestingSummary, "latestSample"> {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}

export interface TwoGroupProportionTestingRunResult extends TwoGroupProportionTestingSummary {
  latestSampleA: number[] | null;
  latestSampleB: number[] | null;
  latestDifference: number | null;
}
