import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel, ValueCard } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { formatContinuousValue } from "../core/format";
import { TestingDistributionPanel } from "./TestingDistributionPanel";
import { TestingRatePanel } from "./TestingRatePanel";
import { TwoGroupProportionTestingControlBand } from "./TwoGroupProportionTestingControlBand";
import type { TwoGroupProportionPopulationConfig, TwoGroupProportionTestingRunResult } from "../core/types";

interface TwoGroupProportionTestingWorkspaceProps {
  population: TwoGroupProportionPopulationConfig;
  sampleSizeA: number;
  sampleSizeB: number;
  repetitions: number;
  currentSampleA: number[];
  currentSampleB: number[];
  currentStatistic: number | null;
  currentDifference: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  alpha: number;
  equalSampleSizes: boolean;
  summary: TwoGroupProportionTestingRunResult;
  summaryLoading: boolean;
  onOutcomeLabelChange: (value: string) => void;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onGroupAChange: (value: number) => void;
  onGroupBChange: (value: number) => void;
  onAlphaChange: (value: number) => void;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

type ContingencySummary = {
  successesA: number;
  successesB: number;
  failuresA: number;
  failuresB: number;
  totalSuccesses: number;
  totalFailures: number;
  totalSampleSize: number;
  expectedASuccess: number;
  expectedAFailure: number;
  expectedBSuccess: number;
  expectedBFailure: number;
};

function countSuccesses(sample: number[]) {
  return sample.reduce((sum, value) => sum + value, 0);
}

function buildContingencySummary(sampleA: number[], sampleB: number[]): ContingencySummary | null {
  if (sampleA.length === 0 || sampleB.length === 0) {
    return null;
  }

  const successesA = countSuccesses(sampleA);
  const successesB = countSuccesses(sampleB);
  const failuresA = sampleA.length - successesA;
  const failuresB = sampleB.length - successesB;
  const totalSuccesses = successesA + successesB;
  const totalFailures = failuresA + failuresB;
  const totalSampleSize = sampleA.length + sampleB.length;

  return {
    successesA,
    successesB,
    failuresA,
    failuresB,
    totalSuccesses,
    totalFailures,
    totalSampleSize,
    expectedASuccess: (sampleA.length * totalSuccesses) / totalSampleSize,
    expectedAFailure: (sampleA.length * totalFailures) / totalSampleSize,
    expectedBSuccess: (sampleB.length * totalSuccesses) / totalSampleSize,
    expectedBFailure: (sampleB.length * totalFailures) / totalSampleSize,
  };
}

function formatChiSquare(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return value.toFixed(3);
}

function formatPValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return value.toFixed(3);
}

function binaryPlotOptions(
  sample: number[],
  outcomeLabel: string,
  successLabel: string,
  failureLabel: string,
  accent: string,
): Plot.PlotOptions | null {
  if (sample.length === 0) {
    return null;
  }

  const successes = countSuccesses(sample);
  const failures = sample.length - successes;
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const data = [
    { label: positiveLabel, count: successes, fill: accent },
    { label: negativeLabel, count: failures, fill: "#5f9fc7" },
  ];

  return {
    width: 360,
    height: 220,
    marginTop: 12,
    marginRight: 18,
    marginBottom: 40,
    marginLeft: 64,
    style: {
      background: "transparent",
      fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    },
    x: {
      type: "band",
      label: outcomeLabel.trim() || "Outcome",
      domain: [positiveLabel, negativeLabel],
    },
    y: {
      label: "Count",
      grid: true,
    },
    marks: [
      Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
      Plot.barY(data, {
        x: "label",
        y: "count",
        fill: "fill",
        inset: 0.35,
      }),
    ],
  };
}

function ChiSquareHomogeneitySetupPanel({
  sampleA,
  sampleB,
  statistic,
  successLabel,
  failureLabel,
}: {
  sampleA: number[];
  sampleB: number[];
  statistic: number | null;
  successLabel: string;
  failureLabel: string;
}) {
  const contingency = useMemo(() => buildContingencySummary(sampleA, sampleB), [sampleA, sampleB]);

  return (
    <Panel title="Hypotheses and test statistic" subtitle="">
      <div className="setup-stack">
        <div className="setup-subcard">
          <div className="formula-label">Hypotheses</div>
          <div className="hypothesis-spec compact">
            <p>
              <strong>H0:</strong> π<sub>A</sub> = π<sub>B</sub>
            </p>
            <p>
              <strong>H1:</strong> π<sub>A</sub> ≠ π<sub>B</sub>
            </p>
          </div>
        </div>

        <div className="setup-subcard">
          <div className="formula-label">Expected counts under H0</div>
          {contingency !== null ? (
            <>
              <table className="sample-summary-table contingency-table">
                <colgroup>
                  <col style={{ width: "28%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Group</th>
                <th scope="col">{successLabel}</th>
                <th scope="col">{failureLabel}</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
                <tbody>
                  <tr>
                    <th scope="row">Group A</th>
                    <td>{formatContinuousValue(contingency.expectedASuccess, "", 2)}</td>
                    <td>{formatContinuousValue(contingency.expectedAFailure, "", 2)}</td>
                    <td>{sampleA.length}</td>
                  </tr>
                  <tr>
                    <th scope="row">Group B</th>
                    <td>{formatContinuousValue(contingency.expectedBSuccess, "", 2)}</td>
                    <td>{formatContinuousValue(contingency.expectedBFailure, "", 2)}</td>
                    <td>{sampleB.length}</td>
                  </tr>
                  <tr className="contingency-table-total">
                    <th scope="row">Total</th>
                    <td>{contingency.totalSuccesses}</td>
                    <td>{contingency.totalFailures}</td>
                    <td>{contingency.totalSampleSize}</td>
                  </tr>
                </tbody>
              </table>
              <p className="setup-subcard-text">
                Expected counts are computed from the row totals and column totals in the observed table.
              </p>
            </>
          ) : (
            <p className="placeholder">Add samples to display the expected counts under H0.</p>
          )}
        </div>

        <div className="setup-subcard">
          <div className="formula-label">Test statistic</div>
          <div className="formula-block compact">
            <div className="formula-value">
              <span>χ² = Σ (O - E)</span>
              <sup>2</sup>
              <span> / E</span>
            </div>
          </div>
          <p className="setup-subcard-text">
            This compares the observed table with the expected table under H0. The 2 × 2 table uses 1 degree of
            freedom.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ChiSquareHomogeneitySamplePanel({
  sampleA,
  sampleB,
  difference,
  outcomeLabel,
  successLabel,
  failureLabel,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
}) {
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const contingency = useMemo(() => buildContingencySummary(sampleA, sampleB), [sampleA, sampleB]);
  const proportionA = sampleA.length > 0 ? countSuccesses(sampleA) / sampleA.length : null;
  const proportionB = sampleB.length > 0 ? countSuccesses(sampleB) / sampleB.length : null;

  const groupAOptions = useMemo(
    () => binaryPlotOptions(sampleA, outcomeLabel, positiveLabel, negativeLabel, "#0d5c8d"),
    [negativeLabel, outcomeLabel, positiveLabel, sampleA],
  );
  const groupBOptions = useMemo(
    () => binaryPlotOptions(sampleB, outcomeLabel, positiveLabel, negativeLabel, "#dc8e2c"),
    [negativeLabel, outcomeLabel, positiveLabel, sampleB],
  );

  return (
    <Panel
      title="Latest Sample"
      subtitle="This is the most recently generated pair of samples. The difference in proportions is highlighted below."
      className="sample-panel"
    >
      <div className="two-group-sample-grid">
        <div className="two-group-sample-card">
          <h3>Group A</h3>
          {groupAOptions !== null ? (
            <ObservablePlotFigure options={groupAOptions} />
          ) : (
            <div className="sample-boxplot-empty">Add samples to display Group A.</div>
          )}
        </div>
        <div className="two-group-sample-card">
          <h3>Group B</h3>
          {groupBOptions !== null ? (
            <ObservablePlotFigure options={groupBOptions} />
          ) : (
            <div className="sample-boxplot-empty">Add samples to display Group B.</div>
          )}
        </div>
      </div>

      <div className="formula-label" style={{ marginTop: "1rem" }}>
        Observed counts
      </div>
      <table className="sample-summary-table contingency-table">
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">{successLabel}</th>
            <th scope="col">{failureLabel}</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Group A</th>
            <td>{contingency?.successesA ?? "-"}</td>
            <td>{contingency?.failuresA ?? "-"}</td>
            <td>{sampleA.length.toString()}</td>
          </tr>
          <tr>
            <th scope="row">Group B</th>
            <td>{contingency?.successesB ?? "-"}</td>
            <td>{contingency?.failuresB ?? "-"}</td>
            <td>{sampleB.length.toString()}</td>
          </tr>
          <tr className="contingency-table-total">
            <th scope="row">Total</th>
            <td>{contingency?.totalSuccesses ?? "-"}</td>
            <td>{contingency?.totalFailures ?? "-"}</td>
            <td>{contingency?.totalSampleSize ?? "-"}</td>
          </tr>
        </tbody>
      </table>

      <table className="sample-summary-table sample-summary-table-compact">
        <thead>
          <tr>
            <th scope="col">Statistic</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Sample proportion Group A (p<sub>A</sub>)</th>
            <td>{formatContinuousValue(proportionA, "", 2)}</td>
          </tr>
          <tr>
            <th scope="row">Sample proportion Group B (p<sub>B</sub>)</th>
            <td>{formatContinuousValue(proportionB, "", 2)}</td>
          </tr>
          <tr>
            <th scope="row">Proportion difference</th>
            <td>{difference === null ? "-" : difference.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}

function ChiSquareDecisionPanel({
  statistic,
  pValue,
  reject,
}: {
  statistic: number | null;
  pValue: number | null;
  reject: boolean | null;
}) {
  const decisionText = reject === null ? "-" : reject ? "Reject H0" : "Keep H0";

  return (
    <Panel
      title="Test Statistic and Decision"
      subtitle="This is the decision for the latest sample from the specified true population."
    >
      <div className="value-grid ci-values">
        <ValueCard label="Observed χ²" value={formatChiSquare(statistic)} />
        <ValueCard label="p-value" value={formatPValue(pValue)} />
        <ValueCard label="Decision" value={decisionText} />
      </div>
      <p className="caption">
        The observed chi-square statistic compares the latest contingency table with the expected counts under H0,
        and the p-value comes from the chi-square distribution with 1 degree of freedom.
      </p>
    </Panel>
  );
}

export function TwoGroupProportionTestingWorkspace({
  population,
  sampleSizeA,
  sampleSizeB,
  repetitions,
  currentSampleA,
  currentSampleB,
  currentStatistic,
  currentDifference,
  outcomeLabel,
  successLabel,
  failureLabel,
  alpha,
  equalSampleSizes,
  summary,
  summaryLoading,
  onOutcomeLabelChange,
  onSuccessLabelChange,
  onFailureLabelChange,
  onGroupAChange,
  onGroupBChange,
  onAlphaChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: TwoGroupProportionTestingWorkspaceProps) {
  const degreesOfFreedom = 1;

  return (
    <>
      <TwoGroupProportionTestingControlBand
        outcomeLabel={outcomeLabel}
        successLabel={successLabel}
        failureLabel={failureLabel}
        groupAPercentage={population.groupA.p}
        groupBPercentage={population.groupB.p}
        alpha={alpha}
        sampleSizeA={sampleSizeA}
        sampleSizeB={sampleSizeB}
        equalSampleSizes={equalSampleSizes}
        repetitions={repetitions}
        onOutcomeLabelChange={onOutcomeLabelChange}
        onSuccessLabelChange={onSuccessLabelChange}
        onFailureLabelChange={onFailureLabelChange}
        onGroupAChange={onGroupAChange}
        onGroupBChange={onGroupBChange}
        onAlphaChange={onAlphaChange}
        onEqualSampleSizesChange={onEqualSampleSizesChange}
        onSampleSizeAChange={onSampleSizeAChange}
        onSampleSizeBChange={onSampleSizeBChange}
        onAddSamples={onAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <ChiSquareHomogeneitySetupPanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          statistic={currentStatistic}
          successLabel={successLabel}
          failureLabel={failureLabel}
        />
        <ChiSquareHomogeneitySamplePanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          difference={currentDifference}
          outcomeLabel={outcomeLabel}
          successLabel={successLabel}
          failureLabel={failureLabel}
        />
        <TestingDistributionPanel
          title="Theoretical sampling distribution under H0"
          subtitle="Analytical H0 reference for the chi-square test of homogeneity."
          subtitleSpacer
          caption={`Null χ² distribution with df = ${degreesOfFreedom}. The curve is the analytical H0 reference for the chi-square test of homogeneity.`}
          distributionType="theoretical"
          statisticFamily="chi-square"
          testKind="proportion"
          degreesOfFreedom={degreesOfFreedom}
          nullValue={0}
          statistics={[]}
          sampleSize={sampleSizeA + sampleSizeB}
          criticalValue={summary.criticalValue}
          criticalLower={null}
          criticalUpper={null}
          rejectionMask={null}
          currentStatistic={null}
          direction="greater"
        />
        <TestingDistributionPanel
          title="Empirical sampling distribution under H1"
          subtitle="Repeated samples from the specified true populations under the alternative scenario."
          distributionType="empirical"
          statisticFamily="chi-square"
          testKind="proportion"
          degreesOfFreedom={degreesOfFreedom}
          nullValue={0}
          statistics={summary.statistics}
          sampleSize={sampleSizeA + sampleSizeB}
          criticalValue={summary.criticalValue}
          criticalLower={null}
          criticalUpper={null}
          rejectionMask={null}
          currentStatistic={summary.latestStatistic}
          direction="greater"
        />
        <TestingRatePanel
          testKind="proportion"
          h1Repetitions={summary.statistics.length}
          h1RejectionCount={summary.rejectionCount}
          h1EmpiricalRejectionRate={summary.empiricalRejectionRate}
          h1TheoreticalRejectionRate={summary.theoreticalRejectionRate}
          isLoading={summaryLoading}
          subtitle="This shows the power for the chi-square test of homogeneity under the specified true populations."
        />
        <ChiSquareDecisionPanel
          statistic={currentStatistic}
          pValue={summary.latestPValue}
          reject={summary.latestReject}
        />
      </main>
    </>
  );
}

export default TwoGroupProportionTestingWorkspace;
