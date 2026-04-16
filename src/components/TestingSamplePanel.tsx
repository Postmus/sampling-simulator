import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { SampleBoxPlotFigure } from "./SampleBoxPlotFigure";
import { computeBinomialStatistic, computeTStatistic } from "../core/testing";
import { formatContinuousValue } from "../core/format";
import { standardDeviation } from "../core/statistics";
import type { TestTruth, TestingKind } from "../core/types";

interface TestingSamplePanelProps {
  testKind: TestingKind;
  sample: number[];
  nullMean: number;
  unitLabel: string;
  outcomeLabel: string;
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
  nullMean,
  unitLabel,
  outcomeLabel,
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
  const tStatistic = useMemo(() => (isMean ? computeTStatistic(sample, nullMean) : null), [isMean, nullMean, sample]);
  const successes = useMemo(() => (isMean ? null : computeBinomialStatistic(sample)), [isMean, sample]);
  const sampleProportion = useMemo(
    () => (successes === null || sample.length === 0 ? null : successes / sample.length),
    [sample.length, successes],
  );
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
      { label: "Failures", count: failureCount, fill: "#5f9fc7" },
      { label: "Successes", count: successes ?? 0, fill: "#dc8e2c" },
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
  }, [isMean, nullMean, outcomeLabel, sample, sample.length, successes, unitLabel]);

  return (
    <Panel
      title="Latest Sample"
      subtitle={
        isMean
          ? `The latest sample is drawn under ${truth === "h0" ? "H0" : "H1"} and converted into a one-sample t statistic.`
          : `The latest sample is drawn under ${truth === "h0" ? "H0" : "H1"} and summarized as an exact binomial count.`
      }
    >
      <div className="sample-mean-layout">
        <table className="sample-summary-table">
          <tbody>
            <tr>
              <th>Sample size</th>
              <td>{sample.length.toString()}</td>
            </tr>
            {isMean ? (
              <>
                <tr>
                  <th>Sample mean</th>
                  <td>{formatContinuousValue(sampleMean, unitLabel, statDigits)}</td>
                </tr>
                <tr>
                  <th>Sample SD (s)</th>
                  <td>{formatContinuousValue(sampleSD, unitLabel, statDigits)}</td>
                </tr>
                <tr>
                  <th>Estimated SE</th>
                  <td>{formatContinuousValue(estimatedSE, unitLabel, statDigits)}</td>
                </tr>
                <tr>
                  <th>t statistic</th>
                  <td>{tStatistic === null ? "-" : tStatistic.toFixed(3)}</td>
                </tr>
              </>
            ) : (
                <>
                  <tr>
                    <th>Observed successes</th>
                    <td>{successes?.toString() ?? "-"}</td>
                  </tr>
                  <tr>
                    <th>Sample proportion (p)</th>
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

      {hasSample ? (
        <p className="caption">
          {isMean
            ? "The dashed line marks the null mean. The t statistic compares the sample mean to that null value in estimated SE units."
            : "The bars show the number of failures and successes in one sample. The exact binomial test uses the count of successes and the sample proportion p."}
        </p>
      ) : null}
    </Panel>
  );
}
