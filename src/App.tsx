import { useRef, useState } from "react";
import { ControlBand } from "./components/ControlBand";
import { ConfidenceIntervalSection } from "./components/ConfidenceIntervalSection";
import { MetricsPanel } from "./components/MetricsPanel";
import { ModeSidebar } from "./components/ModeSidebar";
import { PopulationPanel } from "./components/PopulationPanel";
import { SamplePanel } from "./components/SamplePanel";
import { SamplingDistributionPanel } from "./components/SamplingDistributionPanel";
import { createRng, randomSeed } from "./core/rng";
import { runSamplingBatch, simulateAdditionalEstimates } from "./core/simulate";
import type {
  MeanPopulationConfig,
  MeanPopulationKind,
  PopulationConfig,
  TeachingMode,
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

export default function App() {
  const initial = getInitialState();
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

  const teachingTitle =
    mode === "mean"
      ? "Sampling distribution of the sample mean"
      : "Sampling distribution of the sample proportion";

  return (
    <div className="app-shell">
      <div className="workspace-shell">
        <ModeSidebar mode={mode} onModeChange={handleModeChange} />

        <div className="workspace-main">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">Current mode</p>
              <h2>{mode === "mean" ? "One-group mean" : "One-group proportion"}</h2>
              <p className="hero-copy">
                Configure the population model, draw one sample, and build the sampling
                distribution from repeated samples of the same size.
              </p>
            </div>
            <div className="hero-note">
              <span>Lecture flow</span>
              <strong>Population → Sample → Repeated sampling</strong>
            </div>
          </header>

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
            theoreticalSE={summary.theoreticalSE}
            unitLabel={unitLabel}
            practicalCoverageCount={summary.practicalCoverageCount}
            repeatedSamples={estimates.length}
          />
        </div>
      </div>
    </div>
  );
}
