import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { SampleBoxPlotFigure } from "./SampleBoxPlotFigure";
import { formatContinuousValue } from "../core/format";
import {
  pooledMeanDifferenceSE,
  pooledStandardDeviation,
} from "../core/inference";
import { TestingDecisionPanel } from "./TestingDecisionPanel";
import { TestingDistributionPanel } from "./TestingDistributionPanel";
import { TestingRatePanel } from "./TestingRatePanel";
import { TwoGroupTestingControlBand } from "./TwoGroupTestingControlBand";
import type { TestDirection } from "../core/types";
import type { TwoGroupTestingSummary, TwoGroupMeanPopulationConfig } from "../core/types";

interface TwoGroupTestingWorkspaceProps {
  population: TwoGroupMeanPopulationConfig;
  sampleSizeA: number;
  sampleSizeB: number;
  equalSampleSizes: boolean;
  repetitions: number;
  currentSampleA: number[];
  currentSampleB: number[];
  currentDifference: number | null;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  direction: TestDirection;
  alpha: number;
  summary: TwoGroupTestingSummary;
  summaryLoading: boolean;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onGroupAMeanChange: (value: number) => void;
  onGroupBMeanChange: (value: number) => void;
  onPopulationSDChange: (value: number) => void;
  onDirectionChange: (value: TestDirection) => void;
  onAlphaChange: (value: number) => void;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

function TwoGroupTestingSetupPanel({
  direction,
  decimalPlaces,
}: {
  direction: TestDirection;
  decimalPlaces: number;
}) {
  const alternativeOperator =
    direction === "two-sided" ? "≠" : direction === "greater" ? ">" : "<";

  return (
    <Panel title="Independent Samples t-test" subtitle="">
      <div className="setup-stack">
        <div className="setup-subcard">
          <div className="formula-label">Hypotheses</div>
          <div className="hypothesis-spec compact">
            <p>
              <strong>H0:</strong> μ<sub>A</sub> - μ<sub>B</sub> = 0
            </p>
            <p>
              <strong>H1:</strong> μ<sub>A</sub> - μ<sub>B</sub> {alternativeOperator} 0
            </p>
          </div>
        </div>

        <div className="setup-subcard">
          <div className="formula-label">Test statistic</div>
          <div className="formula-block compact">
            <div className="formula-value">
              <span>t = ((x̄</span>
              <sub>A</sub>
              <span> - x̄</span>
              <sub>B</sub>
              <span>) / (s</span>
              <sub>p</sub>
              <span> × √(1 / n</span>
              <sub>A</sub>
              <span> + 1 / n</span>
              <sub>B</sub>
              <span>)</span>
            </div>
          </div>
          <p className="setup-subcard-text">
            This measures how far the observed mean difference is from zero in estimated standard error units. The
            standard error uses the pooled standard deviation and both sample sizes.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function TwoGroupTestingSamplePanel({
  sampleA,
  sampleB,
  difference,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
}) {
  const displayDigits = decimalPlaces + 2;
  const sampleAmean = sampleA.length > 0 ? sampleA.reduce((sum, value) => sum + value, 0) / sampleA.length : null;
  const sampleBmean = sampleB.length > 0 ? sampleB.reduce((sum, value) => sum + value, 0) / sampleB.length : null;
  const pooledSD = useMemo(() => pooledStandardDeviation(sampleA, sampleB), [sampleA, sampleB]);
  const estimatedSE = useMemo(() => pooledMeanDifferenceSE(sampleA, sampleB), [sampleA, sampleB]);
  const boxplotOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (sampleA.length === 0 && sampleB.length === 0) {
      return null;
    }

    const data = [
      ...sampleA.map((value) => ({ group: "Group A", value })),
      ...sampleB.map((value) => ({ group: "Group B", value })),
    ];

    return {
      width: 560,
      height: 280,
      marginTop: 8,
      marginRight: 24,
      marginBottom: 28,
      marginLeft: 84,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: "Group",
        domain: ["Group A", "Group B"],
      },
      y: {
        label: outcomeLabel.trim()
          ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
          : "Outcome",
        grid: true,
        nice: true,
        zero: false,
      },
      marks: [
        Plot.boxY(data, {
          x: "group",
          y: "value",
          fill: "#dc8e2c",
          fillOpacity: 0.26,
          stroke: "#9a5a17",
          strokeWidth: 2,
        }),
      ],
    };
  }, [outcomeLabel, sampleA, sampleB, unitLabel]);

  return (
    <Panel
      title="Latest Sample"
      subtitle="This is the most recently generated pair of samples. The difference in means is highlighted below."
      className="sample-panel"
    >
      <div className="two-group-sample-stack">
        {boxplotOptions !== null ? (
          <ObservablePlotFigure options={boxplotOptions} />
        ) : (
          <div className="sample-boxplot-empty">Add samples to display the latest boxplots.</div>
        )}

        <table className="sample-summary-table">
          <thead>
            <tr>
              <th scope="col">Statistic</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                Sample size Group A (<span>n</span>
                <sub>A</sub>)
              </th>
              <td>{sampleA.length.toString()}</td>
            </tr>
            <tr>
              <th scope="row">
                Sample size Group B (<span>n</span>
                <sub>B</sub>)
              </th>
              <td>{sampleB.length.toString()}</td>
            </tr>
            <tr>
              <th scope="row">
                Group A mean (<span>x̄</span>
                <sub>A</sub>)
              </th>
              <td>{formatContinuousValue(sampleAmean, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">
                Group B mean (<span>x̄</span>
                <sub>B</sub>)
              </th>
              <td>{formatContinuousValue(sampleBmean, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Mean difference</th>
              <td>{formatContinuousValue(difference, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">
                Pooled SD (<span>s</span>
                <sub>p</sub>)
              </th>
              <td>{formatContinuousValue(pooledSD, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Estimated SE</th>
              <td>{formatContinuousValue(estimatedSE, unitLabel, displayDigits)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function TwoGroupTestingWorkspace({
  population,
  sampleSizeA,
  sampleSizeB,
  equalSampleSizes,
  repetitions,
  currentSampleA,
  currentSampleB,
  currentDifference,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  direction,
  alpha,
  summary,
  summaryLoading,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onGroupAMeanChange,
  onGroupBMeanChange,
  onPopulationSDChange,
  onDirectionChange,
  onAlphaChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: TwoGroupTestingWorkspaceProps) {
  const degreesOfFreedom = sampleSizeA + sampleSizeB - 2;

  return (
    <>
      <TwoGroupTestingControlBand
        outcomeLabel={outcomeLabel}
        unitLabel={unitLabel}
        decimalPlaces={decimalPlaces}
        groupAMean={population.groupA.mean}
        groupBMean={population.groupB.mean}
        populationSD={population.sd}
        direction={direction}
        alpha={alpha}
        sampleSizeA={sampleSizeA}
        sampleSizeB={sampleSizeB}
        equalSampleSizes={equalSampleSizes}
        repetitions={repetitions}
        onOutcomeLabelChange={onOutcomeLabelChange}
        onUnitLabelChange={onUnitLabelChange}
        onDecimalPlacesChange={onDecimalPlacesChange}
        onGroupAMeanChange={onGroupAMeanChange}
        onGroupBMeanChange={onGroupBMeanChange}
        onPopulationSDChange={onPopulationSDChange}
        onDirectionChange={onDirectionChange}
        onAlphaChange={onAlphaChange}
        onEqualSampleSizesChange={onEqualSampleSizesChange}
        onSampleSizeAChange={onSampleSizeAChange}
        onSampleSizeBChange={onSampleSizeBChange}
        onAddSamples={onAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <TwoGroupTestingSetupPanel
          direction={direction}
          decimalPlaces={decimalPlaces}
        />
        <TwoGroupTestingSamplePanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          difference={currentDifference}
          outcomeLabel={outcomeLabel}
          unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
        />
        <TestingDistributionPanel
          title="Theoretical sampling distribution under H0"
          subtitle="Repeated samples from the null population."
          subtitleSpacer
          caption={`Null t distribution with df = ${degreesOfFreedom}. Repeated samples from the null population. Green shows the acceptance region and red shows the rejection region under H0.`}
          distributionType="theoretical"
          testKind="mean"
          degreesOfFreedom={degreesOfFreedom}
          nullValue={0}
          statistics={[]}
          sampleSize={sampleSizeA + sampleSizeB}
          criticalValue={summary.criticalValue}
          criticalLower={summary.criticalLower}
          criticalUpper={summary.criticalUpper}
          rejectionMask={summary.rejectionMask}
          currentStatistic={null}
          direction={direction}
        />
        <TestingDistributionPanel
          title="Empirical sampling distribution under H1"
          subtitle="Repeated samples from the specified true populations under the alternative scenario."
          distributionType="empirical"
          testKind="mean"
          degreesOfFreedom={degreesOfFreedom}
          nullValue={0}
          statistics={summary.statistics}
          sampleSize={sampleSizeA + sampleSizeB}
          criticalValue={summary.criticalValue}
          criticalLower={summary.criticalLower}
          criticalUpper={summary.criticalUpper}
          rejectionMask={summary.rejectionMask}
          currentStatistic={summary.latestStatistic}
          direction={direction}
        />
        <TestingRatePanel
          testKind="mean"
          h1Repetitions={summary.statistics.length}
          h1RejectionCount={summary.rejectionCount}
          h1EmpiricalRejectionRate={summary.empiricalRejectionRate}
          h1TheoreticalRejectionRate={summary.theoreticalRejectionRate}
          isLoading={summaryLoading}
          subtitle="This shows the power for the independent samples t-test under the specified true populations."
        />
        <TestingDecisionPanel
          testKind="mean"
          statistic={summary.latestStatistic}
          criticalValue={summary.criticalValue}
          pValue={summary.latestPValue}
          sampleSize={sampleSizeA + sampleSizeB}
          reject={summary.latestReject}
          caption="The observed t uses the latest sample means, pooled SD, and both sample sizes."
        />
      </main>
    </>
  );
}
