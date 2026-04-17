import { TestingControlBand } from "./TestingControlBand";
import { TestingDecisionPanel } from "./TestingDecisionPanel";
import { TestingDistributionPanel } from "./TestingDistributionPanel";
import { TestingRatePanel } from "./TestingRatePanel";
import { TestingSamplePanel } from "./TestingSamplePanel";
import { TestingSetupPanel } from "./TestingSetupPanel";
import type { TestDirection, TestTruth, TestingKind } from "../core/types";
import type { TestingRunResult } from "../core/testing";

interface TestingWorkspaceProps {
  testingKind: TestingKind;
  testingOutcomeLabel: string;
  successLabel: string;
  failureLabel: string;
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
  testingSummary: TestingRunResult;
  testingSummaryH0: TestingRunResult;
  testingSummaryH1: TestingRunResult;
  testingSummaryLoading: boolean;
  onTestingOutcomeLabelChange: (value: string) => void;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onTestingUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onTestingNullMeanChange: (value: number) => void;
  onTestingAlternativeMeanChange: (value: number) => void;
  onTestingSDChange: (value: number) => void;
  onTestingDirectionChange: (value: TestDirection) => void;
  onTestingAlphaChange: (value: number) => void;
  onTestingSampleSizeChange: (value: number) => void;
  onTestingAddSamples: (count: number) => void;
  onReset: () => void;
}

export function TestingWorkspace({
  testingKind,
  testingOutcomeLabel,
  successLabel,
  failureLabel,
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
  testingSummary,
  testingSummaryH0,
  testingSummaryH1,
  testingSummaryLoading,
  onTestingOutcomeLabelChange,
  onSuccessLabelChange,
  onFailureLabelChange,
  onTestingUnitLabelChange,
  onDecimalPlacesChange,
  onTestingNullMeanChange,
  onTestingAlternativeMeanChange,
  onTestingSDChange,
  onTestingDirectionChange,
  onTestingAlphaChange,
  onTestingSampleSizeChange,
  onTestingAddSamples,
  onReset,
}: TestingWorkspaceProps) {
  return (
    <>
      <TestingControlBand
        testKind={testingKind}
        outcomeLabel={testingOutcomeLabel}
        successLabel={successLabel}
        failureLabel={failureLabel}
        unitLabel={testingUnitLabel}
        decimalPlaces={decimalPlaces}
        nullMean={nullMean}
        alternativeMean={alternativeMean}
        populationSD={populationSD}
        direction={direction}
        alpha={alpha}
        sampleSize={testingSampleSize}
        repetitions={testingSummary.statistics.length}
        onOutcomeLabelChange={onTestingOutcomeLabelChange}
        onSuccessLabelChange={onSuccessLabelChange}
        onFailureLabelChange={onFailureLabelChange}
        onUnitLabelChange={onTestingUnitLabelChange}
        onDecimalPlacesChange={onDecimalPlacesChange}
        onNullMeanChange={onTestingNullMeanChange}
        onAlternativeMeanChange={onTestingAlternativeMeanChange}
        onPopulationSDChange={onTestingSDChange}
        onDirectionChange={onTestingDirectionChange}
        onAlphaChange={onTestingAlphaChange}
        onSampleSizeChange={onTestingSampleSizeChange}
        onAddSamples={onTestingAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <TestingSetupPanel
          testKind={testingKind}
          decimalPlaces={decimalPlaces}
          nullMean={nullMean}
          direction={direction}
        />
        <TestingSamplePanel
          testKind={testingKind}
          sample={testingSample}
          unitLabel={testingUnitLabel}
          outcomeLabel={testingOutcomeLabel}
          successLabel={successLabel}
          failureLabel={failureLabel}
          decimalPlaces={decimalPlaces}
          truth={truth}
        />
        <TestingDistributionPanel
          title={testingKind === "mean" ? "Theoretical sampling distribution under H0" : "Theoretical sampling distribution under H0"}
          subtitle={
            testingKind === "mean"
              ? "Repeated tests from the null population."
              : "Repeated tests from the null population."
          }
          subtitleSpacer
          distributionType="theoretical"
          testKind={testingKind}
          nullValue={nullMean}
          statistics={testingSummaryH0.statistics}
          sampleSize={testingSampleSize}
          criticalValue={testingSummaryH0.criticalValue}
          criticalLower={testingSummaryH0.criticalLower}
          criticalUpper={testingSummaryH0.criticalUpper}
          rejectionMask={testingSummaryH0.rejectionMask}
          currentStatistic={testingSummaryH0.latestStatistic}
          direction={direction}
        />
        <TestingDistributionPanel
          title={testingKind === "mean" ? "Empirical sampling distribution under H1" : "Empirical sampling distribution under H1"}
          subtitle={
            testingKind === "mean"
              ? "Repeated tests from the specified true population under the alternative scenario."
              : "Repeated tests from the specified true population under the alternative scenario."
          }
          distributionType="empirical"
          testKind={testingKind}
          nullValue={nullMean}
          statistics={testingSummaryH1.statistics}
          sampleSize={testingSampleSize}
          criticalValue={testingSummaryH1.criticalValue}
          criticalLower={testingSummaryH1.criticalLower}
          criticalUpper={testingSummaryH1.criticalUpper}
          rejectionMask={testingSummaryH1.rejectionMask}
          currentStatistic={testingSummaryH1.latestStatistic}
          direction={direction}
        />
        <TestingRatePanel
          testKind={testingKind}
          h1Repetitions={testingSummaryH1.statistics.length}
          h1RejectionCount={testingSummaryH1.rejectionCount}
          h1EmpiricalRejectionRate={testingSummaryH1.empiricalRejectionRate}
          h1TheoreticalRejectionRate={testingSummaryH1.theoreticalRejectionRate}
          isLoading={testingSummaryLoading}
        />
        <TestingDecisionPanel
          testKind={testingKind}
          statistic={testingStatistic}
          criticalValue={testingSummary.criticalValue}
          pValue={testingPValue}
          sampleSize={testingSampleSize}
          reject={testingReject}
        />
      </main>
    </>
  );
}

export default TestingWorkspace;
