import { ControlBand } from "./ControlBand";
import { ConfidenceIntervalSection } from "./ConfidenceIntervalSection";
import { MetricsPanel } from "./MetricsPanel";
import { PopulationPanel } from "./PopulationPanel";
import { SamplePanel } from "./SamplePanel";
import { SamplingDistributionPanel } from "./SamplingDistributionPanel";
import type {
  PopulationConfig,
  SimulationSummary,
  TeachingMode,
} from "../core/types";

type EstimationSummary = Pick<
  SimulationSummary,
  "empiricalMean" | "empiricalSE" | "theoreticalMean" | "theoreticalSE" | "practicalCoverageCount"
>;

interface EstimationWorkspaceProps {
  mode: TeachingMode;
  population: PopulationConfig;
  sampleSize: number;
  estimates: number[];
  currentSample: number[];
  currentEstimate: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  summary: EstimationSummary;
  summaryLoading: boolean;
  teachingTitle: string;
  onMeanChange: (value: number) => void;
  onSDChange: (value: number) => void;
  onPChange: (value: number) => void;
  onOutcomeLabelChange: (value: string) => void;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onSampleSizeChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

export function EstimationWorkspace({
  mode,
  population,
  sampleSize,
  estimates,
  currentSample,
  currentEstimate,
  outcomeLabel,
  successLabel,
  failureLabel,
  unitLabel,
  decimalPlaces,
  summary,
  summaryLoading,
  teachingTitle,
  onMeanChange,
  onSDChange,
  onPChange,
  onOutcomeLabelChange,
  onSuccessLabelChange,
  onFailureLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: EstimationWorkspaceProps) {
  return (
    <>
      <ControlBand
        mode={mode}
        population={population}
        sampleSize={sampleSize}
        repetitions={estimates.length}
        outcomeLabel={outcomeLabel}
        successLabel={successLabel}
        failureLabel={failureLabel}
        unitLabel={unitLabel}
        decimalPlaces={decimalPlaces}
        onMeanChange={onMeanChange}
        onSDChange={onSDChange}
        onPChange={onPChange}
        onOutcomeLabelChange={onOutcomeLabelChange}
        onSuccessLabelChange={onSuccessLabelChange}
        onFailureLabelChange={onFailureLabelChange}
        onUnitLabelChange={onUnitLabelChange}
        onDecimalPlacesChange={onDecimalPlacesChange}
        onSampleSizeChange={onSampleSizeChange}
        onAddSamples={onAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <PopulationPanel
          mode={mode}
          population={population}
          outcomeLabel={outcomeLabel}
          successLabel={successLabel}
          failureLabel={failureLabel}
          unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
        />
        <SamplePanel
          mode={mode}
        sample={currentSample}
        estimate={currentEstimate}
        outcomeLabel={outcomeLabel}
        successLabel={successLabel}
        failureLabel={failureLabel}
        unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
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
          sample={currentSample}
          empiricalSE={summary.empiricalSE}
          theoreticalSE={summary.theoreticalSE}
          unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
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
        decimalPlaces={decimalPlaces}
        isLoading={summaryLoading}
      />
    </>
  );
}

export default EstimationWorkspace;
