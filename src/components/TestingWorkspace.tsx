import { TestingControlBand } from "./TestingControlBand";
import { TestingDecisionPanel } from "./TestingDecisionPanel";
import { TestingDistributionPanel } from "./TestingDistributionPanel";
import { TestingRatePanel } from "./TestingRatePanel";
import { TestingSamplePanel } from "./TestingSamplePanel";
import { TestingSetupPanel } from "./TestingSetupPanel";
import type { TestDirection, TestTruth, TestingKind, TestingSummary } from "../core/types";

interface TestingWorkspaceProps {
  testingKind: TestingKind;
  testingOutcomeLabel: string;
  testingUnitLabel: string;
  decimalPlaces: number;
  nullMean: number;
  alternativeMean: number;
  populationSD: number;
  direction: TestDirection;
  alpha: number;
  truth: TestTruth;
  testingSampleSize: number;
  testingSample: number[];
  testingStatistic: number | null;
  testingPValue: number | null;
  testingReject: boolean | null;
  testingStatistics: number[];
  testingRejectionCount: number;
  testingSummary: TestingSummary;
  onTestingOutcomeLabelChange: (value: string) => void;
  onTestingUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onTestingNullMeanChange: (value: number) => void;
  onTestingAlternativeMeanChange: (value: number) => void;
  onTestingSDChange: (value: number) => void;
  onTestingDirectionChange: (value: TestDirection) => void;
  onTestingAlphaChange: (value: number) => void;
  onTestingTruthChange: (value: TestTruth) => void;
  onTestingSampleSizeChange: (value: number) => void;
  onTestingAddSamples: (count: number) => void;
  onReset: () => void;
}

export function TestingWorkspace({
  testingKind,
  testingOutcomeLabel,
  testingUnitLabel,
  decimalPlaces,
  nullMean,
  alternativeMean,
  populationSD,
  direction,
  alpha,
  truth,
  testingSampleSize,
  testingSample,
  testingStatistic,
  testingPValue,
  testingReject,
  testingStatistics,
  testingRejectionCount,
  testingSummary,
  onTestingOutcomeLabelChange,
  onTestingUnitLabelChange,
  onDecimalPlacesChange,
  onTestingNullMeanChange,
  onTestingAlternativeMeanChange,
  onTestingSDChange,
  onTestingDirectionChange,
  onTestingAlphaChange,
  onTestingTruthChange,
  onTestingSampleSizeChange,
  onTestingAddSamples,
  onReset,
}: TestingWorkspaceProps) {
  return (
    <>
      <TestingControlBand
        testKind={testingKind}
        outcomeLabel={testingOutcomeLabel}
        unitLabel={testingUnitLabel}
        decimalPlaces={decimalPlaces}
        nullMean={nullMean}
        alternativeMean={alternativeMean}
        populationSD={populationSD}
        direction={direction}
        alpha={alpha}
        truth={truth}
        sampleSize={testingSampleSize}
        repetitions={testingStatistics.length}
        onOutcomeLabelChange={onTestingOutcomeLabelChange}
        onUnitLabelChange={onTestingUnitLabelChange}
        onDecimalPlacesChange={onDecimalPlacesChange}
        onNullMeanChange={onTestingNullMeanChange}
        onAlternativeMeanChange={onTestingAlternativeMeanChange}
        onPopulationSDChange={onTestingSDChange}
        onDirectionChange={onTestingDirectionChange}
        onAlphaChange={onTestingAlphaChange}
        onTruthChange={onTestingTruthChange}
        onSampleSizeChange={onTestingSampleSizeChange}
        onAddSamples={onTestingAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <TestingSetupPanel
          testKind={testingKind}
          outcomeLabel={testingOutcomeLabel}
          unitLabel={testingUnitLabel}
          decimalPlaces={decimalPlaces}
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
          decimalPlaces={decimalPlaces}
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
  );
}

export default TestingWorkspace;
