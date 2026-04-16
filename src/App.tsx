import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ModeSidebar } from "./components/ModeSidebar";
import { createRng, randomSeed } from "./core/rng";
import { runSamplingBatch, simulateAdditionalEstimates } from "./core/simulate";
import { runTestingBatch, type TestingRunResult } from "./core/testing";
import type {
  MeanPopulationConfig,
  MeanPopulationKind,
  PopulationConfig,
  TeachingMode,
  TestingKind,
  TestDirection,
  TestTruth,
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

function getDefaultSampleSize(mode: TeachingMode) {
  return 60;
}

function getDefaultOutcomeLabel(mode: TeachingMode) {
  return mode === "mean" ? "Outcome" : "Success";
}

function getDefaultUnitLabel(mode: TeachingMode) {
  return mode === "mean" ? "" : "";
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
    outcomeLabel: "Success",
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

export default function App() {
  const initial = getInitialState();
  const [testingKind, setTestingKind] = useState<TestingKind>("mean");
  const testingInitial = getDefaultTestingState(testingKind);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("estimation");
  const [mode, setMode] = useState<TeachingMode>(initial.mode);
  const [population, setPopulation] = useState<PopulationConfig>(initial.population);
  const [sampleSize, setSampleSize] = useState(initial.sampleSize);
  const [outcomeLabel, setOutcomeLabel] = useState(initial.outcomeLabel);
  const [unitLabel, setUnitLabel] = useState(initial.unitLabel);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [currentSample, setCurrentSample] = useState<number[]>([]);
  const [currentEstimate, setCurrentEstimate] = useState<number | null>(null);
  const [estimates, setEstimates] = useState<number[]>([]);
  const [summary, setSummary] = useState(() =>
    buildSummary(initial.mode, initial.population, initial.sampleSize),
  );
  const [summaryLoading, setSummaryLoading] = useState(false);

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
  const testingTimeoutRef = useRef<number | null>(null);
  const summaryWorkIdRef = useRef(0);
  const testingWorkIdRef = useRef(0);

  const rngRef = useRef(createRng(randomSeed()));

  function reseed() {
    rngRef.current = createRng(randomSeed());
  }

  useEffect(() => {
    setSummary(buildSummary(initial.mode, initial.population, initial.sampleSize));
  }, []);

  useEffect(() => {
    return () => {
      if (summaryTimeoutRef.current !== null) {
        window.clearTimeout(summaryTimeoutRef.current);
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

  function handleWorkflowModeChange(nextWorkflowMode: WorkflowMode) {
    setWorkflowMode(nextWorkflowMode);
    if (nextWorkflowMode === "testing") {
      resetTestingSimulation();
    } else {
      resetSimulation(population, mode, sampleSize);
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
  }

  function handlePopulationKindChange(kind: MeanPopulationKind) {
    if (population.kind === "bernoulli") {
      return;
    }

    const nextPopulation: MeanPopulationConfig = {
      kind,
      params: { ...population.params },
    };

    setPopulation(nextPopulation);
    resetSimulation(nextPopulation, mode, sampleSize);
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
    mode === "mean"
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
          mode={mode}
          testingKind={testingKind}
          onWorkflowModeChange={handleWorkflowModeChange}
          onModeChange={handleModeChange}
          onTestingKindChange={handleTestingKindChange}
        />

        <div className="workspace-main">
          <Suspense fallback={<div className="panel-grid">Loading workspace...</div>}>
            {workflowMode === "testing" ? (
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
                decimalPlaces={decimalPlaces}
                summary={summary}
                summaryLoading={summaryLoading}
                teachingTitle={teachingTitle}
                onPopulationKindChange={handlePopulationKindChange}
                onMeanChange={handleMeanChange}
                onSDChange={handleSDChange}
                onPChange={handlePChange}
                onOutcomeLabelChange={setOutcomeLabel}
                onUnitLabelChange={setUnitLabel}
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
