import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ModeSidebar } from "./components/ModeSidebar";
import TwoGroupEstimationWorkspace from "./components/TwoGroupEstimationWorkspace";
import TwoGroupProportionWorkspace from "./components/TwoGroupProportionWorkspace";
import TwoGroupProportionTestingWorkspace from "./components/TwoGroupProportionTestingWorkspace";
import TwoGroupTestingWorkspace from "./components/TwoGroupTestingWorkspace";
import { createRng, randomSeed } from "./core/rng";
import {
  runSamplingBatch,
  runTwoGroupSamplingBatch,
  runTwoGroupProportionSamplingBatch,
  simulateAdditionalEstimates,
  simulateAdditionalTwoGroupProportionEstimates,
} from "./core/simulate";
import {
  runTestingBatch,
  runTwoGroupTestingBatch,
  runTwoGroupProportionTestingBatch,
  type TestingRunResult,
} from "./core/testing";
import type {
  MeanPopulationConfig,
  PopulationConfig,
  StudyDesign,
  TeachingMode,
  TestingKind,
  TestDirection,
  TestTruth,
  TwoGroupMeanPopulationConfig,
  TwoGroupProportionPopulationConfig,
  TwoGroupProportionTestingRunResult,
  TwoGroupSimulationSummary,
  TwoGroupTestingSummary,
  WorkflowMode,
} from "./core/types";

const EstimationWorkspace = lazy(() => import("./components/EstimationWorkspace"));
const TestingWorkspace = lazy(() => import("./components/TestingWorkspace"));

function getDefaultPopulation(mode: TeachingMode): PopulationConfig {
  if (mode === "mean") {
    return {
      kind: "normal",
      params: {
        mean: 100,
        sd: 15,
      },
    };
  }

  return {
    kind: "bernoulli",
    params: {
      p: 0.35,
    },
  };
}

function getDefaultTwoGroupPopulation(): TwoGroupMeanPopulationConfig {
  return {
    groupA: {
      mean: 100,
    },
    groupB: {
      mean: 108,
    },
    sd: 15,
  };
}

function getDefaultTwoGroupTestingPopulation(): TwoGroupMeanPopulationConfig {
  return {
    groupA: {
      mean: 100,
    },
    groupB: {
      mean: 108,
    },
    sd: 15,
  };
}

function getDefaultTwoGroupProportionPopulation(): TwoGroupProportionPopulationConfig {
  return {
    groupA: {
      p: 0.35,
    },
    groupB: {
      p: 0.55,
    },
  };
}

function getDefaultSampleSize(mode: TeachingMode) {
  return 60;
}

function getDefaultOutcomeLabel(mode: TeachingMode) {
  return mode === "mean" ? "Outcome" : "Outcome";
}

function getDefaultUnitLabel(mode: TeachingMode) {
  return mode === "mean" ? "" : "";
}

function getDefaultBinaryLabels() {
  return {
    successLabel: "Yes",
    failureLabel: "No",
  };
}

function getInitialState() {
  const mode: TeachingMode = "mean";
  return {
    mode,
    population: getDefaultPopulation(mode),
    sampleSize: getDefaultSampleSize(mode),
    outcomeLabel: getDefaultOutcomeLabel(mode),
    unitLabel: getDefaultUnitLabel(mode),
  };
}

function getInitialTwoGroupState() {
  return {
    population: getDefaultTwoGroupPopulation(),
    sampleSizeA: getDefaultSampleSize("mean"),
    sampleSizeB: getDefaultSampleSize("mean"),
    outcomeLabel: getDefaultOutcomeLabel("mean"),
    unitLabel: getDefaultUnitLabel("mean"),
  };
}

function getInitialTwoGroupProportionState() {
  return {
    population: getDefaultTwoGroupProportionPopulation(),
    sampleSizeA: getDefaultSampleSize("proportion"),
    sampleSizeB: getDefaultSampleSize("proportion"),
    outcomeLabel: getDefaultOutcomeLabel("proportion"),
  };
}

function getDefaultTestingState(testKind: TestingKind) {
  if (testKind === "mean") {
    return {
      outcomeLabel: "Outcome",
      unitLabel: "",
      nullMean: 100,
      alternativeMean: 105,
      populationSD: 15,
      direction: "two-sided" as TestDirection,
      alpha: 0.05,
      truth: "h1" as TestTruth,
      sampleSize: 60,
    };
  }

  return {
    outcomeLabel: "Outcome",
    unitLabel: "",
    nullMean: 0.35,
    alternativeMean: 0.55,
    populationSD: 1,
    direction: "two-sided" as TestDirection,
    alpha: 0.05,
    truth: "h1" as TestTruth,
    sampleSize: 60,
  };
}

function getDefaultTwoGroupTestingState() {
  return {
    population: getDefaultTwoGroupTestingPopulation(),
    outcomeLabel: "Outcome",
    unitLabel: "",
    decimalPlaces: 0,
    direction: "two-sided" as TestDirection,
    alpha: 0.05,
    sampleSizeA: 60,
    sampleSizeB: 60,
  };
}

function getDefaultTwoGroupProportionTestingState() {
  return {
    population: getDefaultTwoGroupProportionPopulation(),
    outcomeLabel: "Outcome",
    alpha: 0.05,
    sampleSizeA: 60,
    sampleSizeB: 60,
  };
}

function buildSummary(
  nextMode: TeachingMode,
  nextPopulation: PopulationConfig,
  nextSampleSize: number,
) {
  const emptySummary = simulateAdditionalEstimates(
    nextMode,
    nextPopulation,
    nextSampleSize,
    0,
    [],
    0,
    createRng(1),
  );

  return {
    empiricalMean: emptySummary.empiricalMean,
    empiricalSE: emptySummary.empiricalSE,
    theoreticalMean: emptySummary.theoreticalMean,
    theoreticalSE: emptySummary.theoreticalSE,
    practicalCoverageCount: emptySummary.practicalCoverageCount,
  };
}

function buildTwoGroupSummary(
  population: TwoGroupMeanPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
) {
  return runTwoGroupSamplingBatch(
    population,
    sampleSizeA,
    sampleSizeB,
    0,
    [],
    0,
    createRng(1),
  );
}

function buildTwoGroupProportionSummary(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
) {
  return runTwoGroupProportionSamplingBatch(
    population,
    sampleSizeA,
    sampleSizeB,
    0,
    [],
    0,
    createRng(1),
  );
}

function buildTwoGroupProportionTestingSummary(
  population: TwoGroupProportionPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  alpha: number,
) {
  return runTwoGroupProportionTestingBatch(
    population,
    sampleSizeA,
    sampleSizeB,
    0,
    [],
    0,
    alpha,
    createRng(1),
  );
}

function buildTestingSummary(
  testKind: TestingKind,
  truthValue: number,
  nullValue: number,
  alternativeValue: number,
  populationSD: number,
  sampleSize: number,
  alpha: number,
  direction: TestDirection,
) {
  return runTestingBatch(
    testKind,
    truthValue,
    nullValue,
    alternativeValue,
    populationSD,
    sampleSize,
    0,
    [],
    0,
    alpha,
    direction,
    createRng(1),
  );
}

function buildTwoGroupTestingSummary(
  population: TwoGroupMeanPopulationConfig,
  sampleSizeA: number,
  sampleSizeB: number,
  alpha: number,
  direction: TestDirection,
) {
  return runTwoGroupTestingBatch(
    population,
    0,
    sampleSizeA,
    sampleSizeB,
    0,
    [],
    0,
    alpha,
    direction,
    createRng(1),
  );
}

function createEmptyTestingSummary(): TestingRunResult {
  return {
    statistics: [],
    empiricalRejectionRate: null,
    theoreticalRejectionRate: null,
    criticalValue: null,
    criticalLower: null,
    criticalUpper: null,
    rejectionMask: null,
    rejectionCount: 0,
    latestSample: null,
    latestStatistic: null,
    latestPValue: null,
    latestReject: null,
  };
}

function createEmptyTwoGroupSummary(): TwoGroupSimulationSummary {
  return {
    estimates: [],
    empiricalMean: null,
    empiricalSE: null,
    theoreticalMean: null,
    theoreticalSE: null,
    practicalCoverageCount: 0,
    latestSampleA: null,
    latestSampleB: null,
    latestDifference: null,
  };
}

function createEmptyTwoGroupTestingSummary(): TwoGroupTestingSummary {
  return {
    statistics: [],
    empiricalRejectionRate: null,
    theoreticalRejectionRate: null,
    criticalValue: null,
    criticalLower: null,
    criticalUpper: null,
    rejectionMask: null,
    rejectionCount: 0,
    latestSampleA: null,
    latestSampleB: null,
    latestDifference: null,
    latestStatistic: null,
    latestPValue: null,
    latestReject: null,
  };
}

function createEmptyTwoGroupProportionTestingSummary(): TwoGroupProportionTestingRunResult {
  return {
    statistics: [],
    empiricalRejectionRate: null,
    theoreticalRejectionRate: null,
    criticalValue: null,
    criticalLower: null,
    criticalUpper: null,
    rejectionMask: null,
    rejectionCount: 0,
    latestSampleA: null,
    latestSampleB: null,
    latestDifference: null,
    latestStatistic: null,
    latestPValue: null,
    latestReject: null,
  };
}

export default function App() {
  const initial = getInitialState();
  const initialTwoGroup = getInitialTwoGroupState();
  const initialTwoGroupProportion = getInitialTwoGroupProportionState();
  const initialTwoGroupTesting = getDefaultTwoGroupTestingState();
  const [testingKind, setTestingKind] = useState<TestingKind>("mean");
  const testingInitial = getDefaultTestingState(testingKind);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("estimation");
  const [studyDesign, setStudyDesign] = useState<StudyDesign>("oneGroup");
  const [mode, setMode] = useState<TeachingMode>(initial.mode);
  const [population, setPopulation] = useState<PopulationConfig>(initial.population);
  const [sampleSize, setSampleSize] = useState(initial.sampleSize);
  const [outcomeLabel, setOutcomeLabel] = useState(initial.outcomeLabel);
  const [unitLabel, setUnitLabel] = useState(initial.unitLabel);
  const [successLabel, setSuccessLabel] = useState(getDefaultBinaryLabels().successLabel);
  const [failureLabel, setFailureLabel] = useState(getDefaultBinaryLabels().failureLabel);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [currentSample, setCurrentSample] = useState<number[]>([]);
  const [currentEstimate, setCurrentEstimate] = useState<number | null>(null);
  const [estimates, setEstimates] = useState<number[]>([]);
  const [summary, setSummary] = useState(() =>
    buildSummary(initial.mode, initial.population, initial.sampleSize),
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [twoGroupProportionPopulation, setTwoGroupProportionPopulation] =
    useState<TwoGroupProportionPopulationConfig>(
      initialTwoGroupProportion.population,
    );
  const [twoGroupProportionSampleSizeA, setTwoGroupProportionSampleSizeA] = useState(
    initialTwoGroupProportion.sampleSizeA,
  );
  const [twoGroupProportionSampleSizeB, setTwoGroupProportionSampleSizeB] = useState(
    initialTwoGroupProportion.sampleSizeB,
  );
  const [twoGroupProportionEqualSampleSizes, setTwoGroupProportionEqualSampleSizes] = useState(true);
  const [twoGroupProportionOutcomeLabel, setTwoGroupProportionOutcomeLabel] = useState(
    initialTwoGroupProportion.outcomeLabel,
  );
  const [twoGroupProportionCurrentSampleA, setTwoGroupProportionCurrentSampleA] = useState<number[]>([]);
  const [twoGroupProportionCurrentSampleB, setTwoGroupProportionCurrentSampleB] = useState<number[]>([]);
  const [twoGroupProportionCurrentDifference, setTwoGroupProportionCurrentDifference] =
    useState<number | null>(null);
  const [twoGroupProportionEstimates, setTwoGroupProportionEstimates] = useState<number[]>([]);
  const [twoGroupProportionSummary, setTwoGroupProportionSummary] = useState<TwoGroupSimulationSummary>(
    () => createEmptyTwoGroupSummary(),
  );
  const [twoGroupProportionSummaryLoading, setTwoGroupProportionSummaryLoading] = useState(false);
  const [twoGroupProportionTestingPopulation, setTwoGroupProportionTestingPopulation] =
    useState<TwoGroupProportionPopulationConfig>(
      getDefaultTwoGroupProportionTestingState().population,
    );
  const [twoGroupProportionTestingOutcomeLabel, setTwoGroupProportionTestingOutcomeLabel] = useState(
    getDefaultTwoGroupProportionTestingState().outcomeLabel,
  );
  const [twoGroupProportionTestingAlpha, setTwoGroupProportionTestingAlpha] = useState(
    getDefaultTwoGroupProportionTestingState().alpha,
  );
  const [twoGroupProportionTestingSampleSizeA, setTwoGroupProportionTestingSampleSizeA] = useState(
    getDefaultTwoGroupProportionTestingState().sampleSizeA,
  );
  const [twoGroupProportionTestingSampleSizeB, setTwoGroupProportionTestingSampleSizeB] = useState(
    getDefaultTwoGroupProportionTestingState().sampleSizeB,
  );
  const [twoGroupProportionTestingEqualSampleSizes, setTwoGroupProportionTestingEqualSampleSizes] = useState(true);
  const [twoGroupProportionTestingCurrentSampleA, setTwoGroupProportionTestingCurrentSampleA] = useState<number[]>(
    [],
  );
  const [twoGroupProportionTestingCurrentSampleB, setTwoGroupProportionTestingCurrentSampleB] = useState<number[]>(
    [],
  );
  const [twoGroupProportionTestingCurrentDifference, setTwoGroupProportionTestingCurrentDifference] = useState<
    number | null
  >(null);
  const [twoGroupProportionTestingStatistic, setTwoGroupProportionTestingStatistic] = useState<number | null>(null);
  const [twoGroupProportionTestingPValue, setTwoGroupProportionTestingPValue] = useState<number | null>(null);
  const [twoGroupProportionTestingReject, setTwoGroupProportionTestingReject] = useState<boolean | null>(null);
  const [twoGroupProportionTestingSummaryLoading, setTwoGroupProportionTestingSummaryLoading] = useState(false);
  const [twoGroupProportionTestingSummary, setTwoGroupProportionTestingSummary] =
    useState<TwoGroupProportionTestingRunResult>(() => createEmptyTwoGroupProportionTestingSummary());
  const [twoGroupPopulation, setTwoGroupPopulation] = useState<TwoGroupMeanPopulationConfig>(
    initialTwoGroup.population,
  );
  const [twoGroupSampleSizeA, setTwoGroupSampleSizeA] = useState(initialTwoGroup.sampleSizeA);
  const [twoGroupSampleSizeB, setTwoGroupSampleSizeB] = useState(initialTwoGroup.sampleSizeB);
  const [twoGroupEqualSampleSizes, setTwoGroupEqualSampleSizes] = useState(true);
  const [twoGroupOutcomeLabel, setTwoGroupOutcomeLabel] = useState(initialTwoGroup.outcomeLabel);
  const [twoGroupUnitLabel, setTwoGroupUnitLabel] = useState(initialTwoGroup.unitLabel);
  const [twoGroupDecimalPlaces, setTwoGroupDecimalPlaces] = useState(0);
  const [twoGroupCurrentSampleA, setTwoGroupCurrentSampleA] = useState<number[]>([]);
  const [twoGroupCurrentSampleB, setTwoGroupCurrentSampleB] = useState<number[]>([]);
  const [twoGroupCurrentDifference, setTwoGroupCurrentDifference] = useState<number | null>(null);
  const [twoGroupEstimates, setTwoGroupEstimates] = useState<number[]>([]);
  const [twoGroupSummary, setTwoGroupSummary] = useState<TwoGroupSimulationSummary>(() =>
    createEmptyTwoGroupSummary(),
  );
  const [twoGroupSummaryLoading, setTwoGroupSummaryLoading] = useState(false);
  const [twoGroupTestingPopulation, setTwoGroupTestingPopulation] = useState<TwoGroupMeanPopulationConfig>(
    initialTwoGroupTesting.population,
  );
  const [twoGroupTestingOutcomeLabel, setTwoGroupTestingOutcomeLabel] = useState(
    initialTwoGroupTesting.outcomeLabel,
  );
  const [twoGroupTestingUnitLabel, setTwoGroupTestingUnitLabel] = useState(initialTwoGroupTesting.unitLabel);
  const [twoGroupTestingDecimalPlaces, setTwoGroupTestingDecimalPlaces] = useState(
    initialTwoGroupTesting.decimalPlaces,
  );
  const [twoGroupTestingDirection, setTwoGroupTestingDirection] = useState<TestDirection>(
    initialTwoGroupTesting.direction,
  );
  const [twoGroupTestingAlpha, setTwoGroupTestingAlpha] = useState(initialTwoGroupTesting.alpha);
  const [twoGroupTestingSampleSizeA, setTwoGroupTestingSampleSizeA] = useState(
    initialTwoGroupTesting.sampleSizeA,
  );
  const [twoGroupTestingSampleSizeB, setTwoGroupTestingSampleSizeB] = useState(
    initialTwoGroupTesting.sampleSizeB,
  );
  const [twoGroupTestingEqualSampleSizes, setTwoGroupTestingEqualSampleSizes] = useState(true);
  const [twoGroupTestingCurrentSampleA, setTwoGroupTestingCurrentSampleA] = useState<number[]>([]);
  const [twoGroupTestingCurrentSampleB, setTwoGroupTestingCurrentSampleB] = useState<number[]>([]);
  const [twoGroupTestingCurrentDifference, setTwoGroupTestingCurrentDifference] = useState<number | null>(null);
  const [twoGroupTestingStatistic, setTwoGroupTestingStatistic] = useState<number | null>(null);
  const [twoGroupTestingPValue, setTwoGroupTestingPValue] = useState<number | null>(null);
  const [twoGroupTestingReject, setTwoGroupTestingReject] = useState<boolean | null>(null);
  const [twoGroupTestingSummaryLoading, setTwoGroupTestingSummaryLoading] = useState(false);
  const [twoGroupTestingSummary, setTwoGroupTestingSummary] = useState<TwoGroupTestingSummary>(
    () => createEmptyTwoGroupTestingSummary(),
  );

  const [testingOutcomeLabel, setTestingOutcomeLabel] = useState(testingInitial.outcomeLabel);
  const [testingUnitLabel, setTestingUnitLabel] = useState(testingInitial.unitLabel);
  const [nullMean, setNullMean] = useState(testingInitial.nullMean);
  const [alternativeMean, setAlternativeMean] = useState(testingInitial.alternativeMean);
  const [populationSD, setPopulationSD] = useState(testingInitial.populationSD);
  const [direction, setDirection] = useState<TestDirection>(testingInitial.direction);
  const [alpha, setAlpha] = useState(testingInitial.alpha);
  const [truth, setTruth] = useState<TestTruth>(testingInitial.truth);
  const [testingSampleSize, setTestingSampleSize] = useState(testingInitial.sampleSize);
  const [testingSample, setTestingSample] = useState<number[]>([]);
  const [testingStatistic, setTestingStatistic] = useState<number | null>(null);
  const [testingPValue, setTestingPValue] = useState<number | null>(null);
  const [testingReject, setTestingReject] = useState<boolean | null>(null);
  const [testingSummaryLoading, setTestingSummaryLoading] = useState(false);
  const [testingSummary, setTestingSummary] = useState<TestingRunResult>(() => createEmptyTestingSummary());
  const [testingSummaryH0, setTestingSummaryH0] = useState<TestingRunResult>(() => createEmptyTestingSummary());
  const [testingSummaryH1, setTestingSummaryH1] = useState<TestingRunResult>(() => createEmptyTestingSummary());
  const summaryTimeoutRef = useRef<number | null>(null);
  const twoGroupTimeoutRef = useRef<number | null>(null);
  const twoGroupProportionTimeoutRef = useRef<number | null>(null);
  const twoGroupTestingTimeoutRef = useRef<number | null>(null);
  const twoGroupProportionTestingTimeoutRef = useRef<number | null>(null);
  const testingTimeoutRef = useRef<number | null>(null);
  const summaryWorkIdRef = useRef(0);
  const twoGroupWorkIdRef = useRef(0);
  const twoGroupProportionWorkIdRef = useRef(0);
  const twoGroupTestingWorkIdRef = useRef(0);
  const twoGroupProportionTestingWorkIdRef = useRef(0);
  const testingWorkIdRef = useRef(0);

  const rngRef = useRef(createRng(randomSeed()));

  function reseed() {
    rngRef.current = createRng(randomSeed());
  }

  useEffect(() => {
    setSummary(buildSummary(initial.mode, initial.population, initial.sampleSize));
    setTwoGroupSummary(
      buildTwoGroupSummary(
        initialTwoGroup.population,
        initialTwoGroup.sampleSizeA,
        initialTwoGroup.sampleSizeB,
      ),
    );
    setTwoGroupProportionSummary(
      buildTwoGroupProportionSummary(
        initialTwoGroupProportion.population,
        initialTwoGroupProportion.sampleSizeA,
        initialTwoGroupProportion.sampleSizeB,
      ),
    );
    setTwoGroupTestingSummary(
      buildTwoGroupTestingSummary(
        initialTwoGroupTesting.population,
        initialTwoGroupTesting.sampleSizeA,
        initialTwoGroupTesting.sampleSizeB,
        initialTwoGroupTesting.alpha,
        initialTwoGroupTesting.direction,
      ),
    );
    setTwoGroupProportionTestingSummary(
      buildTwoGroupProportionTestingSummary(
        getDefaultTwoGroupProportionTestingState().population,
        getDefaultTwoGroupProportionTestingState().sampleSizeA,
        getDefaultTwoGroupProportionTestingState().sampleSizeB,
        getDefaultTwoGroupProportionTestingState().alpha,
      ),
    );
  }, []);

  useEffect(() => {
    return () => {
      if (summaryTimeoutRef.current !== null) {
        window.clearTimeout(summaryTimeoutRef.current);
      }
      if (twoGroupTimeoutRef.current !== null) {
        window.clearTimeout(twoGroupTimeoutRef.current);
      }
      if (twoGroupProportionTimeoutRef.current !== null) {
        window.clearTimeout(twoGroupProportionTimeoutRef.current);
      }
      if (twoGroupTestingTimeoutRef.current !== null) {
        window.clearTimeout(twoGroupTestingTimeoutRef.current);
      }
      if (twoGroupProportionTestingTimeoutRef.current !== null) {
        window.clearTimeout(twoGroupProportionTestingTimeoutRef.current);
      }
      if (testingTimeoutRef.current !== null) {
        window.clearTimeout(testingTimeoutRef.current);
      }
    };
  }, []);

  function scheduleSummaryUpdate(work: () => void) {
    summaryWorkIdRef.current += 1;
    const workId = summaryWorkIdRef.current;
    setSummaryLoading(true);

    if (summaryTimeoutRef.current !== null) {
      window.clearTimeout(summaryTimeoutRef.current);
    }

    summaryTimeoutRef.current = window.setTimeout(() => {
      if (summaryWorkIdRef.current !== workId) {
        return;
      }

      work();
      setSummaryLoading(false);
      summaryTimeoutRef.current = null;
    }, 0);
  }

  function scheduleTwoGroupSummaryUpdate(work: () => void) {
    twoGroupWorkIdRef.current += 1;
    const workId = twoGroupWorkIdRef.current;
    setTwoGroupSummaryLoading(true);

    if (twoGroupTimeoutRef.current !== null) {
      window.clearTimeout(twoGroupTimeoutRef.current);
    }

    twoGroupTimeoutRef.current = window.setTimeout(() => {
      if (twoGroupWorkIdRef.current !== workId) {
        return;
      }

      work();
      setTwoGroupSummaryLoading(false);
      twoGroupTimeoutRef.current = null;
    }, 0);
  }

  function scheduleTwoGroupProportionSummaryUpdate(work: () => void) {
    twoGroupProportionWorkIdRef.current += 1;
    const workId = twoGroupProportionWorkIdRef.current;
    setTwoGroupProportionSummaryLoading(true);

    if (twoGroupProportionTimeoutRef.current !== null) {
      window.clearTimeout(twoGroupProportionTimeoutRef.current);
    }

    twoGroupProportionTimeoutRef.current = window.setTimeout(() => {
      if (twoGroupProportionWorkIdRef.current !== workId) {
        return;
      }

      work();
      setTwoGroupProportionSummaryLoading(false);
      twoGroupProportionTimeoutRef.current = null;
    }, 0);
  }

  function scheduleTwoGroupTestingSummaryUpdate(work: () => void) {
    twoGroupTestingWorkIdRef.current += 1;
    const workId = twoGroupTestingWorkIdRef.current;
    setTwoGroupTestingSummaryLoading(true);

    if (twoGroupTestingTimeoutRef.current !== null) {
      window.clearTimeout(twoGroupTestingTimeoutRef.current);
    }

    twoGroupTestingTimeoutRef.current = window.setTimeout(() => {
      if (twoGroupTestingWorkIdRef.current !== workId) {
        return;
      }

      work();
      setTwoGroupTestingSummaryLoading(false);
      twoGroupTestingTimeoutRef.current = null;
    }, 0);
  }

  function scheduleTwoGroupProportionTestingSummaryUpdate(work: () => void) {
    twoGroupProportionTestingWorkIdRef.current += 1;
    const workId = twoGroupProportionTestingWorkIdRef.current;
    setTwoGroupProportionTestingSummaryLoading(true);

    if (twoGroupProportionTestingTimeoutRef.current !== null) {
      window.clearTimeout(twoGroupProportionTestingTimeoutRef.current);
    }

    twoGroupProportionTestingTimeoutRef.current = window.setTimeout(() => {
      if (twoGroupProportionTestingWorkIdRef.current !== workId) {
        return;
      }

      work();
      setTwoGroupProportionTestingSummaryLoading(false);
      twoGroupProportionTestingTimeoutRef.current = null;
    }, 0);
  }

  function scheduleTestingUpdate(work: () => void) {
    testingWorkIdRef.current += 1;
    const workId = testingWorkIdRef.current;
    setTestingSummaryLoading(true);

    if (testingTimeoutRef.current !== null) {
      window.clearTimeout(testingTimeoutRef.current);
    }

    testingTimeoutRef.current = window.setTimeout(() => {
      if (testingWorkIdRef.current !== workId) {
        return;
      }

      work();
      setTestingSummaryLoading(false);
      testingTimeoutRef.current = null;
    }, 0);
  }

  function resetSimulation(nextPopulation = population, nextMode = mode, nextSampleSize = sampleSize) {
    reseed();
    scheduleSummaryUpdate(() => {
      setCurrentSample([]);
      setCurrentEstimate(null);
      setEstimates([]);
      setSummary(buildSummary(nextMode, nextPopulation, nextSampleSize));
    });
  }

  function resetTwoGroupSimulation(
    nextPopulation = twoGroupPopulation,
    nextSampleSizeA = twoGroupSampleSizeA,
    nextSampleSizeB = twoGroupSampleSizeB,
  ) {
    reseed();
    scheduleTwoGroupSummaryUpdate(() => {
      setTwoGroupCurrentSampleA([]);
      setTwoGroupCurrentSampleB([]);
      setTwoGroupCurrentDifference(null);
      setTwoGroupEstimates([]);
      setTwoGroupSummary(buildTwoGroupSummary(nextPopulation, nextSampleSizeA, nextSampleSizeB));
    });
  }

  function resetTwoGroupProportionSimulation(
    nextPopulation = twoGroupProportionPopulation,
    nextSampleSizeA = twoGroupProportionSampleSizeA,
    nextSampleSizeB = twoGroupProportionSampleSizeB,
  ) {
    reseed();
    scheduleTwoGroupProportionSummaryUpdate(() => {
      setTwoGroupProportionCurrentSampleA([]);
      setTwoGroupProportionCurrentSampleB([]);
      setTwoGroupProportionCurrentDifference(null);
      setTwoGroupProportionEstimates([]);
      setTwoGroupProportionSummary(
        buildTwoGroupProportionSummary(nextPopulation, nextSampleSizeA, nextSampleSizeB),
      );
    });
  }

  function resetTwoGroupTestingSimulation(
    nextPopulation = twoGroupTestingPopulation,
    nextSampleSizeA = twoGroupTestingSampleSizeA,
    nextSampleSizeB = twoGroupTestingSampleSizeB,
    nextAlpha = twoGroupTestingAlpha,
    nextDirection = twoGroupTestingDirection,
  ) {
    reseed();
    scheduleTwoGroupTestingSummaryUpdate(() => {
      setTwoGroupTestingCurrentSampleA([]);
      setTwoGroupTestingCurrentSampleB([]);
      setTwoGroupTestingCurrentDifference(null);
      setTwoGroupTestingStatistic(null);
      setTwoGroupTestingPValue(null);
      setTwoGroupTestingReject(null);
      const summary = buildTwoGroupTestingSummary(
        nextPopulation,
        nextSampleSizeA,
        nextSampleSizeB,
        nextAlpha,
        nextDirection,
      );
      setTwoGroupTestingSummary(summary);
    });
  }

  function resetTwoGroupProportionTestingSimulation(
    nextPopulation = twoGroupProportionTestingPopulation,
    nextSampleSizeA = twoGroupProportionTestingSampleSizeA,
    nextSampleSizeB = twoGroupProportionTestingSampleSizeB,
    nextAlpha = twoGroupProportionTestingAlpha,
  ) {
    reseed();
    scheduleTwoGroupProportionTestingSummaryUpdate(() => {
      setTwoGroupProportionTestingCurrentSampleA([]);
      setTwoGroupProportionTestingCurrentSampleB([]);
      setTwoGroupProportionTestingCurrentDifference(null);
      setTwoGroupProportionTestingStatistic(null);
      setTwoGroupProportionTestingPValue(null);
      setTwoGroupProportionTestingReject(null);
      setTwoGroupProportionTestingSummary(
        buildTwoGroupProportionTestingSummary(nextPopulation, nextSampleSizeA, nextSampleSizeB, nextAlpha),
      );
    });
  }

  function resetTestingSimulation(
    nextTestingKind: TestingKind = testingKind,
    nextTruth: TestTruth = truth,
    nextNullMean = nullMean,
    nextAlternativeMean = alternativeMean,
    nextPopulationSD = populationSD,
    nextSampleSize = testingSampleSize,
    nextAlpha = alpha,
    nextDirection = direction,
    resetDistributions = true,
  ) {
    reseed();
    scheduleTestingUpdate(() => {
      setTestingSample([]);
      setTestingStatistic(null);
      setTestingPValue(null);
      setTestingReject(null);
      const truthMean = nextTruth === "h0" ? nextNullMean : nextAlternativeMean;
      setTestingSummary(
        buildTestingSummary(
          nextTestingKind,
          truthMean,
          nextNullMean,
          nextAlternativeMean,
          nextPopulationSD,
          nextSampleSize,
          nextAlpha,
          nextDirection,
        ),
      );
      if (resetDistributions) {
        setTestingSummaryH0(
          buildTestingSummary(
            nextTestingKind,
            nextNullMean,
            nextNullMean,
            nextAlternativeMean,
            nextPopulationSD,
            nextSampleSize,
            nextAlpha,
            nextDirection,
          ),
        );
        setTestingSummaryH1(
          buildTestingSummary(
            nextTestingKind,
            nextAlternativeMean,
            nextNullMean,
            nextAlternativeMean,
            nextPopulationSD,
            nextSampleSize,
            nextAlpha,
            nextDirection,
          ),
        );
      }
    });
  }

  function handleTestingKindChange(nextTestingKind: TestingKind) {
    setTestingKind(nextTestingKind);

    const nextDefaults = getDefaultTestingState(nextTestingKind);
    if (workflowMode === "testing" && studyDesign === "twoGroups") {
      if (nextTestingKind === "mean") {
        setStudyDesign("twoGroups");
        setTwoGroupTestingOutcomeLabel(initialTwoGroupTesting.outcomeLabel);
        setTwoGroupTestingUnitLabel(initialTwoGroupTesting.unitLabel);
        setTwoGroupTestingDecimalPlaces(initialTwoGroupTesting.decimalPlaces);
        setTwoGroupTestingPopulation(initialTwoGroupTesting.population);
        setTwoGroupTestingDirection(initialTwoGroupTesting.direction);
        setTwoGroupTestingAlpha(initialTwoGroupTesting.alpha);
        setTwoGroupTestingSampleSizeA(initialTwoGroupTesting.sampleSizeA);
        setTwoGroupTestingSampleSizeB(initialTwoGroupTesting.sampleSizeB);
        resetTwoGroupTestingSimulation(
          initialTwoGroupTesting.population,
          initialTwoGroupTesting.sampleSizeA,
          initialTwoGroupTesting.sampleSizeB,
          initialTwoGroupTesting.alpha,
          initialTwoGroupTesting.direction,
        );
        return;
      }

      setStudyDesign("twoGroups");
      const nextProportionTestingDefaults = getDefaultTwoGroupProportionTestingState();
      setTwoGroupProportionTestingOutcomeLabel(nextProportionTestingDefaults.outcomeLabel);
      setTwoGroupProportionTestingPopulation(nextProportionTestingDefaults.population);
      setTwoGroupProportionTestingAlpha(nextProportionTestingDefaults.alpha);
      setTwoGroupProportionTestingSampleSizeA(nextProportionTestingDefaults.sampleSizeA);
      setTwoGroupProportionTestingSampleSizeB(nextProportionTestingDefaults.sampleSizeB);
      resetTwoGroupProportionTestingSimulation(
        nextProportionTestingDefaults.population,
        nextProportionTestingDefaults.sampleSizeA,
        nextProportionTestingDefaults.sampleSizeB,
        nextProportionTestingDefaults.alpha,
      );
      return;
    }

    setTestingOutcomeLabel(nextDefaults.outcomeLabel);
    setTestingUnitLabel(nextDefaults.unitLabel);
    setNullMean(nextDefaults.nullMean);
    setAlternativeMean(nextDefaults.alternativeMean);
    setPopulationSD(nextDefaults.populationSD);
    setDirection(nextDefaults.direction);
    setAlpha(nextDefaults.alpha);
    setTruth(nextDefaults.truth);
    setTestingSampleSize(nextDefaults.sampleSize);
    resetTestingSimulation(
      nextTestingKind,
      nextDefaults.truth,
      nextDefaults.nullMean,
      nextDefaults.alternativeMean,
      nextDefaults.populationSD,
      nextDefaults.sampleSize,
      nextDefaults.alpha,
      nextDefaults.direction,
    );
  }

  function handleStudyDesignChange(nextStudyDesign: StudyDesign) {
    setStudyDesign(nextStudyDesign);
    if (nextStudyDesign === "twoGroups") {
      if (workflowMode === "testing" && testingKind === "mean") {
        resetTwoGroupTestingSimulation();
      } else if (workflowMode === "testing" && testingKind === "proportion") {
        resetTwoGroupProportionTestingSimulation();
      } else if (mode === "mean") {
        resetTwoGroupSimulation(twoGroupPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
      } else {
        resetTwoGroupProportionSimulation(
          twoGroupProportionPopulation,
          twoGroupProportionSampleSizeA,
          twoGroupProportionSampleSizeB,
        );
      }
    } else {
      if (workflowMode === "testing") {
        resetTestingSimulation();
      } else {
        resetSimulation(population, mode, sampleSize);
      }
    }
  }

  function handleWorkflowModeChange(nextWorkflowMode: WorkflowMode) {
    setWorkflowMode(nextWorkflowMode);
    if (nextWorkflowMode === "testing") {
      if (studyDesign === "twoGroups" && testingKind === "mean") {
        resetTwoGroupTestingSimulation();
      } else if (studyDesign === "twoGroups" && testingKind === "proportion") {
        resetTwoGroupProportionTestingSimulation();
      } else {
        setStudyDesign("oneGroup");
        resetTestingSimulation();
      }
    } else {
      if (studyDesign === "twoGroups") {
        if (mode === "mean") {
          resetTwoGroupSimulation(twoGroupPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
        } else {
          resetTwoGroupProportionSimulation(
            twoGroupProportionPopulation,
            twoGroupProportionSampleSizeA,
            twoGroupProportionSampleSizeB,
          );
        }
      } else {
        resetSimulation(population, mode, sampleSize);
      }
    }
  }

  function handleModeChange(nextMode: TeachingMode) {
    const nextPopulation = getDefaultPopulation(nextMode);
    const nextSampleSize = getDefaultSampleSize(nextMode);
    setMode(nextMode);
    setPopulation(nextPopulation);
    setSampleSize(nextSampleSize);
    setOutcomeLabel(getDefaultOutcomeLabel(nextMode));
    setUnitLabel(getDefaultUnitLabel(nextMode));
    resetSimulation(nextPopulation, nextMode, nextSampleSize);
    if (studyDesign === "twoGroups") {
      if (nextMode === "mean") {
        resetTwoGroupSimulation(twoGroupPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
      } else {
        resetTwoGroupProportionSimulation(
          twoGroupProportionPopulation,
          twoGroupProportionSampleSizeA,
          twoGroupProportionSampleSizeB,
        );
      }
    }
  }

  function handleMeanChange(value: number) {
    if (population.kind === "bernoulli") {
      return;
    }

    const nextPopulation: MeanPopulationConfig = {
      ...population,
      params: {
        ...population.params,
        mean: Number.isFinite(value) ? value : population.params.mean,
      },
    };

    setPopulation(nextPopulation);
    resetSimulation(nextPopulation, mode, sampleSize);
  }

  function handleSDChange(value: number) {
    if (population.kind === "bernoulli") {
      return;
    }

    const nextPopulation: MeanPopulationConfig = {
      ...population,
      params: {
        ...population.params,
        sd: Math.max(Number.isFinite(value) ? value : population.params.sd, 0.1),
      },
    };

    setPopulation(nextPopulation);
    resetSimulation(nextPopulation, mode, sampleSize);
  }

  function handleTwoGroupMeanAChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupPopulation,
      groupA: {
        mean: Number.isFinite(value) ? value : twoGroupPopulation.groupA.mean,
      },
    };

    setTwoGroupPopulation(nextPopulation);
    resetTwoGroupSimulation(nextPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
  }

  function handleTwoGroupMeanBChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupPopulation,
      groupB: {
        mean: Number.isFinite(value) ? value : twoGroupPopulation.groupB.mean,
      },
    };

    setTwoGroupPopulation(nextPopulation);
    resetTwoGroupSimulation(nextPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
  }

  function handleTwoGroupSDChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupPopulation,
      sd: Math.max(Number.isFinite(value) ? value : twoGroupPopulation.sd, 0.1),
    };

    setTwoGroupPopulation(nextPopulation);
    resetTwoGroupSimulation(nextPopulation, twoGroupSampleSizeA, twoGroupSampleSizeB);
  }

  function handleTwoGroupOutcomeLabelChange(value: string) {
    setTwoGroupOutcomeLabel(value);
  }

  function handleTwoGroupUnitLabelChange(value: string) {
    setTwoGroupUnitLabel(value);
  }

  function handleTwoGroupDecimalPlacesChange(value: number) {
    setTwoGroupDecimalPlaces(value);
  }

  function handleTwoGroupSampleSizeAChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupSampleSizeA(nextSampleSize);
    if (twoGroupEqualSampleSizes) {
      setTwoGroupSampleSizeB(nextSampleSize);
      resetTwoGroupSimulation(twoGroupPopulation, nextSampleSize, nextSampleSize);
      return;
    }
    resetTwoGroupSimulation(twoGroupPopulation, nextSampleSize, twoGroupSampleSizeB);
  }

  function handleTwoGroupSampleSizeBChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupSampleSizeB(nextSampleSize);
    if (twoGroupEqualSampleSizes) {
      setTwoGroupSampleSizeA(nextSampleSize);
      resetTwoGroupSimulation(twoGroupPopulation, nextSampleSize, nextSampleSize);
      return;
    }
    resetTwoGroupSimulation(twoGroupPopulation, twoGroupSampleSizeA, nextSampleSize);
  }

  function handleTwoGroupEqualSampleSizesChange(nextEqual: boolean) {
    setTwoGroupEqualSampleSizes(nextEqual);
    if (nextEqual) {
      setTwoGroupSampleSizeB(twoGroupSampleSizeA);
      resetTwoGroupSimulation(twoGroupPopulation, twoGroupSampleSizeA, twoGroupSampleSizeA);
    }
  }

  function handleTwoGroupProportionGroupAChange(value: number) {
    const nextPopulation: TwoGroupProportionPopulationConfig = {
      ...twoGroupProportionPopulation,
      groupA: {
        p: Math.min(Math.max(Number.isFinite(value) ? value : twoGroupProportionPopulation.groupA.p, 0.05), 0.95),
      },
    };

    setTwoGroupProportionPopulation(nextPopulation);
    resetTwoGroupProportionSimulation(
      nextPopulation,
      twoGroupProportionSampleSizeA,
      twoGroupProportionSampleSizeB,
    );
  }

  function handleTwoGroupProportionGroupBChange(value: number) {
    const nextPopulation: TwoGroupProportionPopulationConfig = {
      ...twoGroupProportionPopulation,
      groupB: {
        p: Math.min(Math.max(Number.isFinite(value) ? value : twoGroupProportionPopulation.groupB.p, 0.05), 0.95),
      },
    };

    setTwoGroupProportionPopulation(nextPopulation);
    resetTwoGroupProportionSimulation(
      nextPopulation,
      twoGroupProportionSampleSizeA,
      twoGroupProportionSampleSizeB,
    );
  }

  function handleTwoGroupProportionSampleSizeAChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupProportionSampleSizeA(nextSampleSize);
    if (twoGroupProportionEqualSampleSizes) {
      setTwoGroupProportionSampleSizeB(nextSampleSize);
      resetTwoGroupProportionSimulation(twoGroupProportionPopulation, nextSampleSize, nextSampleSize);
      return;
    }
    resetTwoGroupProportionSimulation(twoGroupProportionPopulation, nextSampleSize, twoGroupProportionSampleSizeB);
  }

  function handleTwoGroupProportionSampleSizeBChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupProportionSampleSizeB(nextSampleSize);
    if (twoGroupProportionEqualSampleSizes) {
      setTwoGroupProportionSampleSizeA(nextSampleSize);
      resetTwoGroupProportionSimulation(twoGroupProportionPopulation, nextSampleSize, nextSampleSize);
      return;
    }
    resetTwoGroupProportionSimulation(
      twoGroupProportionPopulation,
      twoGroupProportionSampleSizeA,
      nextSampleSize,
    );
  }

  function handleTwoGroupProportionEqualSampleSizesChange(nextEqual: boolean) {
    setTwoGroupProportionEqualSampleSizes(nextEqual);
    if (nextEqual) {
      setTwoGroupProportionSampleSizeB(twoGroupProportionSampleSizeA);
      resetTwoGroupProportionSimulation(
        twoGroupProportionPopulation,
        twoGroupProportionSampleSizeA,
        twoGroupProportionSampleSizeA,
      );
    }
  }

  function handleTwoGroupProportionTestingOutcomeLabelChange(value: string) {
    setTwoGroupProportionTestingOutcomeLabel(value);
  }

  function handleTwoGroupProportionTestingGroupAChange(value: number) {
    const nextPopulation: TwoGroupProportionPopulationConfig = {
      ...twoGroupProportionTestingPopulation,
      groupA: {
        p: Math.min(Math.max(Number.isFinite(value) ? value : twoGroupProportionTestingPopulation.groupA.p, 0.05), 0.95),
      },
    };

    setTwoGroupProportionTestingPopulation(nextPopulation);
    resetTwoGroupProportionTestingSimulation(
      nextPopulation,
      twoGroupProportionTestingSampleSizeA,
      twoGroupProportionTestingSampleSizeB,
      twoGroupProportionTestingAlpha,
    );
  }

  function handleTwoGroupProportionTestingGroupBChange(value: number) {
    const nextPopulation: TwoGroupProportionPopulationConfig = {
      ...twoGroupProportionTestingPopulation,
      groupB: {
        p: Math.min(Math.max(Number.isFinite(value) ? value : twoGroupProportionTestingPopulation.groupB.p, 0.05), 0.95),
      },
    };

    setTwoGroupProportionTestingPopulation(nextPopulation);
    resetTwoGroupProportionTestingSimulation(
      nextPopulation,
      twoGroupProportionTestingSampleSizeA,
      twoGroupProportionTestingSampleSizeB,
      twoGroupProportionTestingAlpha,
    );
  }

  function handleTwoGroupProportionTestingAlphaChange(value: number) {
    const nextAlpha = Number.isFinite(value) ? value : twoGroupProportionTestingAlpha;
    setTwoGroupProportionTestingAlpha(nextAlpha);
    resetTwoGroupProportionTestingSimulation(
      twoGroupProportionTestingPopulation,
      twoGroupProportionTestingSampleSizeA,
      twoGroupProportionTestingSampleSizeB,
      nextAlpha,
    );
  }

  function handleTwoGroupProportionTestingSampleSizeAChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupProportionTestingSampleSizeA(nextSampleSize);
    if (twoGroupProportionTestingEqualSampleSizes) {
      setTwoGroupProportionTestingSampleSizeB(nextSampleSize);
      resetTwoGroupProportionTestingSimulation(
        twoGroupProportionTestingPopulation,
        nextSampleSize,
        nextSampleSize,
        twoGroupProportionTestingAlpha,
      );
      return;
    }
    resetTwoGroupProportionTestingSimulation(
      twoGroupProportionTestingPopulation,
      nextSampleSize,
      twoGroupProportionTestingSampleSizeB,
      twoGroupProportionTestingAlpha,
    );
  }

  function handleTwoGroupProportionTestingSampleSizeBChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupProportionTestingSampleSizeB(nextSampleSize);
    if (twoGroupProportionTestingEqualSampleSizes) {
      setTwoGroupProportionTestingSampleSizeA(nextSampleSize);
      resetTwoGroupProportionTestingSimulation(
        twoGroupProportionTestingPopulation,
        nextSampleSize,
        nextSampleSize,
        twoGroupProportionTestingAlpha,
      );
      return;
    }
    resetTwoGroupProportionTestingSimulation(
      twoGroupProportionTestingPopulation,
      twoGroupProportionTestingSampleSizeA,
      nextSampleSize,
      twoGroupProportionTestingAlpha,
    );
  }

  function handleTwoGroupProportionTestingEqualSampleSizesChange(nextEqual: boolean) {
    setTwoGroupProportionTestingEqualSampleSizes(nextEqual);
    if (nextEqual) {
      setTwoGroupProportionTestingSampleSizeB(twoGroupProportionTestingSampleSizeA);
      resetTwoGroupProportionTestingSimulation(
        twoGroupProportionTestingPopulation,
        twoGroupProportionTestingSampleSizeA,
        twoGroupProportionTestingSampleSizeA,
        twoGroupProportionTestingAlpha,
      );
    }
  }

  function handleTwoGroupProportionTestingAddSamples(count: number) {
    scheduleTwoGroupProportionTestingSummaryUpdate(() => {
      const result = runTwoGroupProportionTestingBatch(
        twoGroupProportionTestingPopulation,
        twoGroupProportionTestingSampleSizeA,
        twoGroupProportionTestingSampleSizeB,
        count,
        twoGroupProportionTestingSummary.statistics,
        twoGroupProportionTestingSummary.rejectionCount,
        twoGroupProportionTestingAlpha,
        rngRef.current,
      );

      setTwoGroupProportionTestingCurrentSampleA(result.latestSampleA ?? []);
      setTwoGroupProportionTestingCurrentSampleB(result.latestSampleB ?? []);
      setTwoGroupProportionTestingCurrentDifference(result.latestDifference);
      setTwoGroupProportionTestingStatistic(result.latestStatistic);
      setTwoGroupProportionTestingPValue(result.latestPValue);
      setTwoGroupProportionTestingReject(result.latestReject);
      setTwoGroupProportionTestingSummary(result);
    });
  }

  function handleTwoGroupProportionAddSamples(count: number) {
    scheduleTwoGroupProportionSummaryUpdate(() => {
      const result = runTwoGroupProportionSamplingBatch(
        twoGroupProportionPopulation,
        twoGroupProportionSampleSizeA,
        twoGroupProportionSampleSizeB,
        count,
        twoGroupProportionEstimates,
        twoGroupProportionSummary.practicalCoverageCount,
        rngRef.current,
      );

      setTwoGroupProportionEstimates(result.estimates);
      setTwoGroupProportionCurrentSampleA(result.latestSampleA ?? []);
      setTwoGroupProportionCurrentSampleB(result.latestSampleB ?? []);
      setTwoGroupProportionCurrentDifference(result.latestDifference);
      setTwoGroupProportionSummary(result);
    });
  }

  function handleTwoGroupAddSamples(count: number) {
    scheduleTwoGroupSummaryUpdate(() => {
      const result = runTwoGroupSamplingBatch(
        twoGroupPopulation,
        twoGroupSampleSizeA,
        twoGroupSampleSizeB,
        count,
        twoGroupEstimates,
        twoGroupSummary.practicalCoverageCount,
        rngRef.current,
      );

      setTwoGroupEstimates(result.estimates);
      setTwoGroupCurrentSampleA(result.latestSampleA ?? []);
      setTwoGroupCurrentSampleB(result.latestSampleB ?? []);
      setTwoGroupCurrentDifference(result.latestDifference);
      setTwoGroupSummary(result);
    });
  }

  function handlePChange(value: number) {
    if (population.kind !== "bernoulli") {
      return;
    }

    const nextPopulation: PopulationConfig = {
      ...population,
      params: {
        p: Math.min(Math.max(Number.isFinite(value) ? value : population.params.p, 0.01), 0.99),
      },
    };

    setPopulation(nextPopulation);
    resetSimulation(nextPopulation, mode, sampleSize);
  }

  function handleSampleSizeChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setSampleSize(nextSampleSize);
    resetSimulation(population, mode, nextSampleSize);
  }

  function handleAddSamples(count: number) {
    scheduleSummaryUpdate(() => {
      const result = runSamplingBatch(
        mode,
        population,
        sampleSize,
        count,
        estimates,
        summary.practicalCoverageCount,
        rngRef.current,
      );
      setEstimates(result.estimates);
      if (result.latestSample !== null) {
        setCurrentSample(result.latestSample);
        setCurrentEstimate(result.latestEstimate);
      }
      setSummary({
        empiricalMean: result.empiricalMean,
        empiricalSE: result.empiricalSE,
        theoreticalMean: result.theoreticalMean,
        theoreticalSE: result.theoreticalSE,
        practicalCoverageCount: result.practicalCoverageCount,
      });
    });
  }

  function handleTestingSampleSizeChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTestingSampleSize(nextSampleSize);
    resetTestingSimulation(testingKind, truth, nullMean, alternativeMean, populationSD, nextSampleSize, alpha, direction);
  }

  function handleTestingNullMeanChange(value: number) {
    const nextValue = Number.isFinite(value)
      ? testingKind === "mean"
        ? value
        : Math.min(Math.max(value, 0.01), 0.99)
      : nullMean;
    setNullMean(nextValue);
    resetTestingSimulation(testingKind, truth, nextValue, alternativeMean, populationSD, testingSampleSize, alpha, direction);
  }

  function handleTestingAlternativeMeanChange(value: number) {
    const nextValue = Number.isFinite(value)
      ? testingKind === "mean"
        ? value
        : Math.min(Math.max(value, 0.01), 0.99)
      : alternativeMean;
    setAlternativeMean(nextValue);
    resetTestingSimulation(testingKind, truth, nullMean, nextValue, populationSD, testingSampleSize, alpha, direction);
  }

  function handleTestingSDChange(value: number) {
    const nextValue = Math.max(Number.isFinite(value) ? value : populationSD, 0.1);
    setPopulationSD(nextValue);
    resetTestingSimulation(testingKind, truth, nullMean, alternativeMean, nextValue, testingSampleSize, alpha, direction);
  }

  function handleTestingDirectionChange(nextDirection: TestDirection) {
    setDirection(nextDirection);
    resetTestingSimulation(testingKind, truth, nullMean, alternativeMean, populationSD, testingSampleSize, alpha, nextDirection);
  }

  function handleTestingAlphaChange(value: number) {
    const nextAlpha = Number.isFinite(value) ? value : alpha;
    setAlpha(nextAlpha);
    resetTestingSimulation(testingKind, truth, nullMean, alternativeMean, populationSD, testingSampleSize, nextAlpha, direction);
  }

  function handleTestingTruthChange(nextTruth: TestTruth) {
    setTruth(nextTruth);
    resetTestingSimulation(
      testingKind,
      nextTruth,
      nullMean,
      alternativeMean,
      populationSD,
      testingSampleSize,
      alpha,
      direction,
      false,
    );
  }

  function handleTwoGroupTestingOutcomeLabelChange(value: string) {
    setTwoGroupTestingOutcomeLabel(value);
  }

  function handleTwoGroupTestingUnitLabelChange(value: string) {
    setTwoGroupTestingUnitLabel(value);
  }

  function handleTwoGroupTestingDecimalPlacesChange(value: number) {
    setTwoGroupTestingDecimalPlaces(value);
  }

  function handleTwoGroupTestingGroupAMeanChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupTestingPopulation,
      groupA: {
        mean: Number.isFinite(value) ? value : twoGroupTestingPopulation.groupA.mean,
      },
    };

    setTwoGroupTestingPopulation(nextPopulation);
    resetTwoGroupTestingSimulation(
      nextPopulation,
      twoGroupTestingSampleSizeA,
      twoGroupTestingSampleSizeB,
      twoGroupTestingAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingGroupBChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupTestingPopulation,
      groupB: {
        mean: Number.isFinite(value) ? value : twoGroupTestingPopulation.groupB.mean,
      },
    };

    setTwoGroupTestingPopulation(nextPopulation);
    resetTwoGroupTestingSimulation(
      nextPopulation,
      twoGroupTestingSampleSizeA,
      twoGroupTestingSampleSizeB,
      twoGroupTestingAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingSDChange(value: number) {
    const nextPopulation: TwoGroupMeanPopulationConfig = {
      ...twoGroupTestingPopulation,
      sd: Math.max(Number.isFinite(value) ? value : twoGroupTestingPopulation.sd, 0.1),
    };

    setTwoGroupTestingPopulation(nextPopulation);
    resetTwoGroupTestingSimulation(
      nextPopulation,
      twoGroupTestingSampleSizeA,
      twoGroupTestingSampleSizeB,
      twoGroupTestingAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingDirectionChange(nextDirection: TestDirection) {
    setTwoGroupTestingDirection(nextDirection);
    resetTwoGroupTestingSimulation(
      twoGroupTestingPopulation,
      twoGroupTestingSampleSizeA,
      twoGroupTestingSampleSizeB,
      twoGroupTestingAlpha,
      nextDirection,
    );
  }

  function handleTwoGroupTestingAlphaChange(value: number) {
    const nextAlpha = Number.isFinite(value) ? value : twoGroupTestingAlpha;
    setTwoGroupTestingAlpha(nextAlpha);
    resetTwoGroupTestingSimulation(
      twoGroupTestingPopulation,
      twoGroupTestingSampleSizeA,
      twoGroupTestingSampleSizeB,
      nextAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingSampleSizeAChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupTestingSampleSizeA(nextSampleSize);
    if (twoGroupTestingEqualSampleSizes) {
      setTwoGroupTestingSampleSizeB(nextSampleSize);
      resetTwoGroupTestingSimulation(
        twoGroupTestingPopulation,
        nextSampleSize,
        nextSampleSize,
        twoGroupTestingAlpha,
        twoGroupTestingDirection,
      );
      return;
    }
    resetTwoGroupTestingSimulation(
      twoGroupTestingPopulation,
      nextSampleSize,
      twoGroupTestingSampleSizeB,
      twoGroupTestingAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingSampleSizeBChange(value: number) {
    const nextSampleSize = Math.max(2, Math.round(value));
    setTwoGroupTestingSampleSizeB(nextSampleSize);
    if (twoGroupTestingEqualSampleSizes) {
      setTwoGroupTestingSampleSizeA(nextSampleSize);
      resetTwoGroupTestingSimulation(
        twoGroupTestingPopulation,
        nextSampleSize,
        nextSampleSize,
        twoGroupTestingAlpha,
        twoGroupTestingDirection,
      );
      return;
    }
    resetTwoGroupTestingSimulation(
      twoGroupTestingPopulation,
      twoGroupTestingSampleSizeA,
      nextSampleSize,
      twoGroupTestingAlpha,
      twoGroupTestingDirection,
    );
  }

  function handleTwoGroupTestingEqualSampleSizesChange(nextEqual: boolean) {
    setTwoGroupTestingEqualSampleSizes(nextEqual);
    if (nextEqual) {
      setTwoGroupTestingSampleSizeB(twoGroupTestingSampleSizeA);
      resetTwoGroupTestingSimulation(
        twoGroupTestingPopulation,
        twoGroupTestingSampleSizeA,
        twoGroupTestingSampleSizeA,
        twoGroupTestingAlpha,
        twoGroupTestingDirection,
      );
    }
  }

  function handleTwoGroupTestingAddSamples(count: number) {
    scheduleTwoGroupTestingSummaryUpdate(() => {
      const result = runTwoGroupTestingBatch(
        twoGroupTestingPopulation,
        0,
        twoGroupTestingSampleSizeA,
        twoGroupTestingSampleSizeB,
        count,
        twoGroupTestingSummary.statistics,
        twoGroupTestingSummary.rejectionCount,
        twoGroupTestingAlpha,
        twoGroupTestingDirection,
        rngRef.current,
      );

      setTwoGroupTestingCurrentSampleA(result.latestSampleA ?? []);
      setTwoGroupTestingCurrentSampleB(result.latestSampleB ?? []);
      setTwoGroupTestingCurrentDifference(result.latestDifference);
      setTwoGroupTestingStatistic(result.latestStatistic);
      setTwoGroupTestingPValue(result.latestPValue);
      setTwoGroupTestingReject(result.latestReject);
      setTwoGroupTestingSummary(result);
    });
  }

  function handleTestingAddSamples(count: number) {
    scheduleTestingUpdate(() => {
      const h0Result = runTestingBatch(
        testingKind,
        nullMean,
        nullMean,
        alternativeMean,
        populationSD,
        testingSampleSize,
        count,
        testingSummaryH0.statistics,
        testingSummaryH0.rejectionCount,
        alpha,
        direction,
        rngRef.current,
      );

      const h1Result = runTestingBatch(
        testingKind,
        alternativeMean,
        nullMean,
        alternativeMean,
        populationSD,
        testingSampleSize,
        count,
        testingSummaryH1.statistics,
        testingSummaryH1.rejectionCount,
        alpha,
        direction,
        rngRef.current,
      );

      const activeResult = truth === "h0" ? h0Result : h1Result;

      setTestingSummaryH0(h0Result);
      setTestingSummaryH1(h1Result);
      setTestingSample(activeResult.latestSample ?? []);
      setTestingStatistic(activeResult.latestStatistic);
      setTestingPValue(activeResult.latestPValue);
      setTestingReject(activeResult.latestReject);
      setTestingSummary(activeResult);
    });
  }

  const teachingTitle =
    studyDesign === "twoGroups" && mode === "mean"
      ? "Sampling distribution of the mean difference"
      : studyDesign === "twoGroups" && mode === "proportion"
      ? "Sampling distribution of the difference in proportions"
      : mode === "mean"
      ? "Sampling distribution of the sample mean"
      : "Sampling distribution of the sample proportion";

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Medical Statistics Teaching Tool</p>
        <h1>Sampling Simulator</h1>
      </header>

      <div className="workspace-shell">
        <ModeSidebar
          workflowMode={workflowMode}
          studyDesign={studyDesign}
          mode={mode}
          testingKind={testingKind}
          onWorkflowModeChange={handleWorkflowModeChange}
          onStudyDesignChange={handleStudyDesignChange}
          onModeChange={handleModeChange}
          onTestingKindChange={handleTestingKindChange}
        />

        <div className="workspace-main">
          <Suspense fallback={<div className="panel-grid">Loading workspace...</div>}>
            {workflowMode === "testing" && studyDesign === "twoGroups" && testingKind === "mean" ? (
              <TwoGroupTestingWorkspace
                population={twoGroupTestingPopulation}
                sampleSizeA={twoGroupTestingSampleSizeA}
                sampleSizeB={twoGroupTestingSampleSizeB}
                equalSampleSizes={twoGroupTestingEqualSampleSizes}
                repetitions={twoGroupTestingSummary.statistics.length}
                currentSampleA={twoGroupTestingCurrentSampleA}
                currentSampleB={twoGroupTestingCurrentSampleB}
                currentDifference={twoGroupTestingCurrentDifference}
                outcomeLabel={twoGroupTestingOutcomeLabel}
                unitLabel={twoGroupTestingUnitLabel}
                decimalPlaces={twoGroupTestingDecimalPlaces}
                direction={twoGroupTestingDirection}
                alpha={twoGroupTestingAlpha}
                summary={twoGroupTestingSummary}
                summaryLoading={twoGroupTestingSummaryLoading}
                onOutcomeLabelChange={handleTwoGroupTestingOutcomeLabelChange}
                onUnitLabelChange={handleTwoGroupTestingUnitLabelChange}
                onDecimalPlacesChange={handleTwoGroupTestingDecimalPlacesChange}
                onGroupAMeanChange={handleTwoGroupTestingGroupAMeanChange}
                onGroupBMeanChange={handleTwoGroupTestingGroupBChange}
                onPopulationSDChange={handleTwoGroupTestingSDChange}
                onDirectionChange={handleTwoGroupTestingDirectionChange}
                onAlphaChange={handleTwoGroupTestingAlphaChange}
                onEqualSampleSizesChange={handleTwoGroupTestingEqualSampleSizesChange}
                onSampleSizeAChange={handleTwoGroupTestingSampleSizeAChange}
                onSampleSizeBChange={handleTwoGroupTestingSampleSizeBChange}
                onAddSamples={handleTwoGroupTestingAddSamples}
                onReset={() => resetTwoGroupTestingSimulation()}
              />
            ) : workflowMode === "testing" && studyDesign === "twoGroups" && testingKind === "proportion" ? (
              <TwoGroupProportionTestingWorkspace
                population={twoGroupProportionTestingPopulation}
                sampleSizeA={twoGroupProportionTestingSampleSizeA}
                sampleSizeB={twoGroupProportionTestingSampleSizeB}
                repetitions={twoGroupProportionTestingSummary.statistics.length}
                currentSampleA={twoGroupProportionTestingCurrentSampleA}
                currentSampleB={twoGroupProportionTestingCurrentSampleB}
                currentStatistic={twoGroupProportionTestingStatistic}
                currentDifference={twoGroupProportionTestingCurrentDifference}
                outcomeLabel={twoGroupProportionTestingOutcomeLabel}
                successLabel={successLabel}
                failureLabel={failureLabel}
                alpha={twoGroupProportionTestingAlpha}
                equalSampleSizes={twoGroupProportionTestingEqualSampleSizes}
                summary={twoGroupProportionTestingSummary}
                summaryLoading={twoGroupProportionTestingSummaryLoading}
                onOutcomeLabelChange={handleTwoGroupProportionTestingOutcomeLabelChange}
                onSuccessLabelChange={setSuccessLabel}
                onFailureLabelChange={setFailureLabel}
                onGroupAChange={handleTwoGroupProportionTestingGroupAChange}
                onGroupBChange={handleTwoGroupProportionTestingGroupBChange}
                onAlphaChange={handleTwoGroupProportionTestingAlphaChange}
                onEqualSampleSizesChange={handleTwoGroupProportionTestingEqualSampleSizesChange}
                onSampleSizeAChange={handleTwoGroupProportionTestingSampleSizeAChange}
                onSampleSizeBChange={handleTwoGroupProportionTestingSampleSizeBChange}
                onAddSamples={handleTwoGroupProportionTestingAddSamples}
                onReset={() => resetTwoGroupProportionTestingSimulation()}
              />
            ) : workflowMode === "testing" ? (
              <TestingWorkspace
                testingKind={testingKind}
                testingOutcomeLabel={testingOutcomeLabel}
                testingUnitLabel={testingUnitLabel}
                decimalPlaces={decimalPlaces}
                nullMean={nullMean}
                alternativeMean={alternativeMean}
                populationSD={populationSD}
                direction={direction}
                alpha={alpha}
                truth={truth}
                testingSampleSize={testingSampleSize}
                testingSample={testingSample}
                testingStatistic={testingStatistic}
                testingPValue={testingPValue}
                testingReject={testingReject}
                testingSummary={testingSummary}
                testingSummaryH0={testingSummaryH0}
                testingSummaryH1={testingSummaryH1}
                testingSummaryLoading={testingSummaryLoading}
                onTestingOutcomeLabelChange={setTestingOutcomeLabel}
                onTestingUnitLabelChange={setTestingUnitLabel}
                successLabel={successLabel}
                failureLabel={failureLabel}
                onSuccessLabelChange={setSuccessLabel}
                onFailureLabelChange={setFailureLabel}
                onDecimalPlacesChange={setDecimalPlaces}
                onTestingNullMeanChange={handleTestingNullMeanChange}
                onTestingAlternativeMeanChange={handleTestingAlternativeMeanChange}
                onTestingSDChange={handleTestingSDChange}
                onTestingDirectionChange={handleTestingDirectionChange}
                onTestingAlphaChange={handleTestingAlphaChange}
                onTestingSampleSizeChange={handleTestingSampleSizeChange}
                onTestingAddSamples={handleTestingAddSamples}
                onReset={() => resetTestingSimulation()}
              />
            ) : studyDesign === "twoGroups" ? (
              mode === "mean" ? (
              <TwoGroupEstimationWorkspace
                population={twoGroupPopulation}
                sampleSizeA={twoGroupSampleSizeA}
                sampleSizeB={twoGroupSampleSizeB}
                equalSampleSizes={twoGroupEqualSampleSizes}
                repetitions={twoGroupEstimates.length}
                  estimates={twoGroupEstimates}
                  currentSampleA={twoGroupCurrentSampleA}
                  currentSampleB={twoGroupCurrentSampleB}
                  currentDifference={twoGroupCurrentDifference}
                  outcomeLabel={twoGroupOutcomeLabel}
                  unitLabel={twoGroupUnitLabel}
                  decimalPlaces={twoGroupDecimalPlaces}
                  summary={twoGroupSummary}
                  summaryLoading={twoGroupSummaryLoading}
                  teachingTitle={teachingTitle}
                  onMeanAChange={handleTwoGroupMeanAChange}
                  onMeanBChange={handleTwoGroupMeanBChange}
                  onSDChange={handleTwoGroupSDChange}
                onOutcomeLabelChange={handleTwoGroupOutcomeLabelChange}
                onUnitLabelChange={handleTwoGroupUnitLabelChange}
                onDecimalPlacesChange={handleTwoGroupDecimalPlacesChange}
                onEqualSampleSizesChange={handleTwoGroupEqualSampleSizesChange}
                onSampleSizeAChange={handleTwoGroupSampleSizeAChange}
                onSampleSizeBChange={handleTwoGroupSampleSizeBChange}
                  onAddSamples={handleTwoGroupAddSamples}
                  onReset={() => resetTwoGroupSimulation()}
                />
              ) : (
              <TwoGroupProportionWorkspace
                population={twoGroupProportionPopulation}
                sampleSizeA={twoGroupProportionSampleSizeA}
                sampleSizeB={twoGroupProportionSampleSizeB}
                equalSampleSizes={twoGroupProportionEqualSampleSizes}
                repetitions={twoGroupProportionEstimates.length}
                  estimates={twoGroupProportionEstimates}
                  currentSampleA={twoGroupProportionCurrentSampleA}
                  currentSampleB={twoGroupProportionCurrentSampleB}
                  currentDifference={twoGroupProportionCurrentDifference}
                  outcomeLabel={twoGroupProportionOutcomeLabel}
                  successLabel={successLabel}
                  failureLabel={failureLabel}
                  summary={twoGroupProportionSummary}
                  summaryLoading={twoGroupProportionSummaryLoading}
                  teachingTitle={teachingTitle}
                  onOutcomeLabelChange={setTwoGroupProportionOutcomeLabel}
                onSuccessLabelChange={setSuccessLabel}
                onFailureLabelChange={setFailureLabel}
                onGroupAChange={handleTwoGroupProportionGroupAChange}
                onGroupBChange={handleTwoGroupProportionGroupBChange}
                onEqualSampleSizesChange={handleTwoGroupProportionEqualSampleSizesChange}
                onSampleSizeAChange={handleTwoGroupProportionSampleSizeAChange}
                onSampleSizeBChange={handleTwoGroupProportionSampleSizeBChange}
                  onAddSamples={handleTwoGroupProportionAddSamples}
                  onReset={() => resetTwoGroupProportionSimulation()}
                />
              )
            ) : (
              <EstimationWorkspace
                mode={mode}
                population={population}
                sampleSize={sampleSize}
                estimates={estimates}
                currentSample={currentSample}
                currentEstimate={currentEstimate}
                outcomeLabel={outcomeLabel}
                unitLabel={unitLabel}
                successLabel={successLabel}
                failureLabel={failureLabel}
                decimalPlaces={decimalPlaces}
                summary={summary}
                summaryLoading={summaryLoading}
                teachingTitle={teachingTitle}
                onMeanChange={handleMeanChange}
                onSDChange={handleSDChange}
                onPChange={handlePChange}
                onOutcomeLabelChange={setOutcomeLabel}
                onUnitLabelChange={setUnitLabel}
                onSuccessLabelChange={setSuccessLabel}
                onFailureLabelChange={setFailureLabel}
                onDecimalPlacesChange={setDecimalPlaces}
                onSampleSizeChange={handleSampleSizeChange}
                onAddSamples={handleAddSamples}
                onReset={() => resetSimulation()}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
