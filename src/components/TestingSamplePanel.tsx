import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { SampleBoxPlotFigure } from "./SampleBoxPlotFigure";
import { computeBinomialStatistic } from "../core/testing";
import { formatContinuousValue } from "../core/format";
import { standardDeviation } from "../core/statistics";
import type { TestTruth, TestingKind } from "../core/types";

interface TestingSamplePanelProps {
  testKind: TestingKind;
  sample: number[];
  unitLabel: string;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  decimalPlaces: number;
  truth: TestTruth;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function TestingSamplePanel({
  testKind,
  sample,
  unitLabel,
  outcomeLabel,
  successLabel,
  failureLabel,
  decimalPlaces,
  truth,
}: TestingSamplePanelProps) {
  const isMean = testKind === "mean";
  const statDigits = decimalPlaces + 2;

  const sampleSD = useMemo(() => (isMean && sample.length > 1 ? standardDeviation(sample) : null), [isMean, sample]);
  const sampleMean = useMemo(
    () => (sample.length > 0 ? sample.reduce((sum, value) => sum + value, 0) / sample.length : null),
    [sample],
  );
  const estimatedSE = useMemo(
    () => (sampleSD === null || sample.length === 0 ? null : sampleSD / Math.sqrt(sample.length)),
    [sample.length, sampleSD],
  );
  const successes = useMemo(() => (isMean ? null : computeBinomialStatistic(sample)), [isMean, sample]);
  const sampleProportion = useMemo(
    () => (successes === null || sample.length === 0 ? null : successes / sample.length),
    [sample.length, successes],
  );
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const hasSample = sample.length > 0;

  const plotOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (sample.length === 0) {
      return null;
    }

    if (isMean) {
      return null;
    }

    const failureCount = sample.length - (successes ?? 0);
    const data = [
      { label: positiveLabel, count: successes ?? 0, fill: "#dc8e2c" },
      { label: negativeLabel, count: failureCount, fill: "#5f9fc7" },
    ];

    return {
      width: 560,
      height: 260,
      marginTop: 16,
      marginRight: 18,
      marginBottom: 48,
      marginLeft: 76,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: outcomeLabel.trim() ? outcomeLabel : "Outcome",
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
  }, [isMean, negativeLabel, outcomeLabel, positiveLabel, sample, sample.length, successes, unitLabel]);

  return (
    <Panel
      title="Latest Sample"
      subtitle={
        isMean
          ? "The latest sample is drawn from the specified true population and shown as raw values."
          : "The latest sample is drawn from the specified true population and shown as counts."
      }
    >
      <div className="sample-mean-layout">
        <table className="sample-summary-table">
          <tbody>
            <tr>
              <th scope="row">Sample size (n)</th>
              <td>{sample.length.toString()}</td>
            </tr>
            {isMean ? (
              <>
                <tr>
                  <th scope="row">Sample mean (x̄)</th>
                  <td>{formatContinuousValue(sampleMean, unitLabel, statDigits)}</td>
                </tr>
                <tr>
                  <th scope="row">Sample SD (s)</th>
                  <td>{formatContinuousValue(sampleSD, unitLabel, statDigits)}</td>
                </tr>
                <tr>
                  <th scope="row">Estimated SE</th>
                  <td>{formatContinuousValue(estimatedSE, unitLabel, statDigits)}</td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <th scope="row">{positiveLabel} count</th>
                  <td>{successes?.toString() ?? "-"}</td>
                </tr>
                <tr>
                  <th scope="row">Sample proportion (p)</th>
                  <td>{formatPercent(sampleProportion)}</td>
                </tr>
              </>
              )}
          </tbody>
        </table>

      <div className="sample-mean-plot">
          {isMean ? (
            sample.length > 0 ? (
              <SampleBoxPlotFigure
                sample={sample}
                outcomeLabel={outcomeLabel}
                unitLabel={unitLabel}
              />
            ) : (
              <div className="sample-boxplot-empty">
                Add tests to see the latest sample here.
              </div>
            )
        ) : plotOptions !== null ? (
          <ObservablePlotFigure options={plotOptions} />
        ) : (
          <div className="sample-boxplot-empty">
            Add tests to see the latest sample here.
          </div>
        )}
      </div>
    </div>
  </Panel>
  );
}
