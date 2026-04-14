import { useRef, useState } from "react";
import { ControlBand } from "./components/ControlBand";
import { ConfidenceIntervalSection } from "./components/ConfidenceIntervalSection";
import { MetricsPanel } from "./components/MetricsPanel";
import { ModeSidebar } from "./components/ModeSidebar";
import { PopulationPanel } from "./components/PopulationPanel";
import { SamplePanel } from "./components/SamplePanel";
import { TestingControlBand } from "./components/TestingControlBand";
import { TestingDecisionPanel } from "./components/TestingDecisionPanel";
import { TestingDistributionPanel } from "./components/TestingDistributionPanel";
import { TestingRatePanel } from "./components/TestingRatePanel";
import { TestingSamplePanel } from "./components/TestingSamplePanel";
import { TestingSetupPanel } from "./components/TestingSetupPanel";
import { SamplingDistributionPanel } from "./components/SamplingDistributionPanel";
import { createRng, randomSeed } from "./core/rng";
import { runSamplingBatch, simulateAdditionalEstimates } from "./core/simulate";
import { runTestingBatch } from "./core/testing";
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
  return mode === "mean" ? 12 : 20;
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
      sampleSize: 12,
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
    sampleSize: 20,
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
  const [currentSample, setCurrentSample] = useState<number[]>([]);
  const [currentEstimate, setCurrentEstimate] = useState<number | null>(null);
  const [estimates, setEstimates] = useState<number[]>([]);
  const [summary, setSummary] = useState(() =>
    buildSummary(initial.mode, initial.population, initial.sampleSize),
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
  const [testingStatistics, setTestingStatistics] = useState<number[]>([]);
  const [testingRejectionCount, setTestingRejectionCount] = useState(0);
  const [testingSummary, setTestingSummary] = useState(() =>
    buildTestingSummary(
      testingKind,
      testingInitial.alternativeMean,
      testingInitial.nullMean,
      testingInitial.alternativeMean,
      testingInitial.populationSD,
      testingInitial.sampleSize,
      testingInitial.alpha,
      testingInitial.direction,
    ),
  );

  const rngRef = useRef(createRng(randomSeed()));

  function reseed() {
    rngRef.current = createRng(randomSeed());
  }

  function resetSimulation(nextPopulation = population, nextMode = mode, nextSampleSize = sampleSize) {
    reseed();
    setCurrentSample([]);
    setCurrentEstimate(null);
    setEstimates([]);
    setSummary(buildSummary(nextMode, nextPopulation, nextSampleSize));
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
  ) {
    reseed();
    setTestingSample([]);
    setTestingStatistic(null);
    setTestingPValue(null);
    setTestingReject(null);
    setTestingStatistics([]);
    setTestingRejectionCount(0);
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
    resetTestingSimulation(testingKind, nextTruth, nullMean, alternativeMean, populationSD, testingSampleSize, alpha, direction);
  }

  function handleTestingAddSamples(count: number) {
    const truthValue = truth === "h0" ? nullMean : alternativeMean;
    const result = runTestingBatch(
      testingKind,
      truthValue,
      nullMean,
      alternativeMean,
      populationSD,
      testingSampleSize,
      count,
      testingStatistics,
      testingRejectionCount,
      alpha,
      direction,
      rngRef.current,
    );

    setTestingStatistics(result.statistics);
    setTestingSample(result.latestSample ?? []);
    setTestingStatistic(result.latestStatistic);
    setTestingPValue(result.latestPValue);
    setTestingReject(result.latestReject);
    setTestingRejectionCount(result.rejectionCount);
    setTestingSummary(result);
  }

  const teachingTitle =
    mode === "mean"
      ? "Sampling distribution of the sample mean"
      : "Sampling distribution of the sample proportion";

  return (
    <div className="app-shell">
      <div className="workspace-shell">
        <ModeSidebar
          workflowMode={workflowMode}
          mode={mode}
          onWorkflowModeChange={handleWorkflowModeChange}
          onModeChange={handleModeChange}
        />

        <div className="workspace-main">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">Current mode</p>
              <h2>
                {workflowMode === "testing"
                  ? "One-group testing and power"
                  : mode === "mean"
                    ? "One-group mean"
                    : "One-group proportion"}
              </h2>
              <p className="hero-copy">
                {workflowMode === "testing"
                  ? testingKind === "mean"
                    ? "Set up the null and alternative means, simulate the one-sample t statistic, and track how often the test rejects."
                    : "Set up the null and alternative proportions, simulate the exact binomial test, and track how often the test rejects."
                  : "Configure the population model, draw one sample, and build the sampling distribution from repeated samples of the same size."}
              </p>
            </div>
          </header>

          {workflowMode === "testing" ? (
            <>
              <TestingControlBand
                testKind={testingKind}
                outcomeLabel={testingOutcomeLabel}
                unitLabel={testingUnitLabel}
                nullMean={nullMean}
                alternativeMean={alternativeMean}
                populationSD={populationSD}
                direction={direction}
                alpha={alpha}
                truth={truth}
                sampleSize={testingSampleSize}
                repetitions={testingStatistics.length}
                onTestKindChange={handleTestingKindChange}
                onOutcomeLabelChange={setTestingOutcomeLabel}
                onUnitLabelChange={setTestingUnitLabel}
                onNullMeanChange={handleTestingNullMeanChange}
                onAlternativeMeanChange={handleTestingAlternativeMeanChange}
                onPopulationSDChange={handleTestingSDChange}
                onDirectionChange={handleTestingDirectionChange}
                onAlphaChange={handleTestingAlphaChange}
                onTruthChange={handleTestingTruthChange}
                onSampleSizeChange={handleTestingSampleSizeChange}
                onAddSamples={handleTestingAddSamples}
                onReset={() => resetTestingSimulation()}
              />

              <main className="panel-grid">
                <TestingSetupPanel
                  testKind={testingKind}
                  outcomeLabel={testingOutcomeLabel}
                  unitLabel={testingUnitLabel}
                  nullMean={nullMean}
                  alternativeMean={alternativeMean}
                  populationSD={populationSD}
                  sampleSize={testingSampleSize}
                  direction={direction}
                  alpha={alpha}
                  truth={truth}
                />
                <TestingSamplePanel
                  testKind={testingKind}
                  sample={testingSample}
                  nullMean={nullMean}
                  unitLabel={testingUnitLabel}
                  outcomeLabel={testingOutcomeLabel}
                  truth={truth}
                />
                <TestingDistributionPanel
                  testKind={testingKind}
                  statistics={testingStatistics}
                  sampleSize={testingSampleSize}
                  criticalValue={testingSummary.criticalValue}
                  criticalLower={testingSummary.criticalLower}
                  criticalUpper={testingSummary.criticalUpper}
                  rejectionMask={testingSummary.rejectionMask}
                  currentStatistic={testingStatistic}
                  direction={direction}
                />
                <TestingDecisionPanel
                  testKind={testingKind}
                  statistic={testingStatistic}
                  criticalValue={testingSummary.criticalValue}
                  pValue={testingPValue}
                  sampleSize={testingSampleSize}
                  reject={testingReject}
                  direction={direction}
                />
                <div className="panel-span-2">
                  <TestingRatePanel
                    truth={truth}
                    repetitions={testingStatistics.length}
                    rejectionCount={testingRejectionCount}
                    empiricalRejectionRate={testingSummary.empiricalRejectionRate}
                    theoreticalRejectionRate={testingSummary.theoreticalRejectionRate}
                  />
                </div>
              </main>
            </>
          ) : (
            <>
              <ControlBand
                mode={mode}
                population={population}
                sampleSize={sampleSize}
                repetitions={estimates.length}
                outcomeLabel={outcomeLabel}
                unitLabel={unitLabel}
                onPopulationKindChange={handlePopulationKindChange}
                onMeanChange={handleMeanChange}
                onSDChange={handleSDChange}
                onPChange={handlePChange}
                onOutcomeLabelChange={setOutcomeLabel}
                onUnitLabelChange={setUnitLabel}
                onSampleSizeChange={handleSampleSizeChange}
                onAddSamples={handleAddSamples}
                onReset={() => resetSimulation()}
              />

              <main className="panel-grid">
                <PopulationPanel
                  mode={mode}
                  population={population}
                  outcomeLabel={outcomeLabel}
                  unitLabel={unitLabel}
                />
                <SamplePanel
                  mode={mode}
                  sample={currentSample}
                  estimate={currentEstimate}
                  outcomeLabel={outcomeLabel}
                  unitLabel={unitLabel}
                />
                <SamplingDistributionPanel
                  estimates={estimates}
                  theoreticalValue={summary.theoreticalMean}
                  theoreticalSE={summary.theoreticalSE}
                  currentEstimate={currentEstimate}
                  sampleSize={sampleSize}
                  title={teachingTitle}
                  outcomeLabel={outcomeLabel}
                  unitLabel={unitLabel}
                />
                <MetricsPanel
                  mode={mode}
                  empiricalMean={summary.empiricalMean}
                  empiricalSE={summary.empiricalSE}
                  theoreticalMean={summary.theoreticalMean}
                  theoreticalSE={summary.theoreticalSE}
                  outcomeLabel={outcomeLabel}
                  unitLabel={unitLabel}
                />
              </main>

              <ConfidenceIntervalSection
                mode={mode}
                sample={currentSample}
                estimate={currentEstimate}
                theoreticalMean={summary.theoreticalMean}
                unitLabel={unitLabel}
                practicalCoverageCount={summary.practicalCoverageCount}
                repeatedSamples={estimates.length}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
