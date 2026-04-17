import { lazy, Suspense, useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { formatContinuousValue } from "../core/format";
import { standardDeviation } from "../core/statistics";
import type { TeachingMode } from "../core/types";

const SampleBoxPlotFigure = lazy(() => import("./SampleBoxPlotFigure"));

interface SamplePanelProps {
  mode: TeachingMode;
  sample: number[];
  estimate: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  unitLabel: string;
  decimalPlaces: number;
}

function formatXBarLabel() {
  return "Sample mean (x̄)";
}

export function SamplePanel({
  mode,
  sample,
  estimate,
  outcomeLabel,
  successLabel,
  failureLabel,
  unitLabel,
  decimalPlaces,
}: SamplePanelProps) {
  const statDigits = decimalPlaces + 2;
  const sampleSD = useMemo(
    () => (mode === "mean" && sample.length > 1 ? standardDeviation(sample) : null),
    [mode, sample],
  );
  const estimatedSE = useMemo(
    () => (mode === "mean" && sample.length > 0 && sampleSD !== null ? sampleSD / Math.sqrt(sample.length) : null),
    [mode, sample.length, sampleSD],
  );
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";

  const binaryCounts = useMemo(() => {
    if (mode !== "proportion") {
      return [];
    }

    const successCount = sample.reduce((sum, value) => sum + value, 0);
    return [
      { outcome: positiveLabel, count: successCount },
      { outcome: negativeLabel, count: sample.length - successCount },
    ];
  }, [mode, negativeLabel, positiveLabel, sample]);

  const binaryOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (mode !== "proportion" || sample.length === 0) {
      return null;
    }

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
        type: "band",
        label: outcomeLabel.trim() || "Observed outcome",
        domain: [positiveLabel, negativeLabel],
      },
      y: {
        label: "Count",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.rectY(binaryCounts, {
          x: "outcome",
          y1: 0,
          y2: "count",
          fill: "#5f9fc7",
          insetLeft: 24,
          insetRight: 24,
        }),
      ],
    };
  }, [binaryCounts, mode, outcomeLabel, sample.length]);

  return (
    <Panel
      title="Latest Sample"
      subtitle={
        mode === "mean"
          ? "This is the most recently generated sample. Its estimate is highlighted below and included in the sampling distribution."
          : "This is the most recently generated sample. Its statistic is highlighted below and included in the sampling distribution."
      }
      className="sample-panel"
    >
      {mode === "mean" || mode === "proportion" ? (
        <div className="sample-mean-layout">
          <table className="sample-summary-table">
            <thead>
              <tr>
                <th scope="col">Statistic</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Sample size (n)</th>
                <td>{sample.length.toString()}</td>
              </tr>
              {mode === "mean" ? (
                <>
                  <tr>
                    <th scope="row">{formatXBarLabel()}</th>
                    <td>{formatContinuousValue(estimate, unitLabel, statDigits)}</td>
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
                    <td>{sample.reduce((sum, value) => sum + value, 0).toString()}</td>
                  </tr>
                  <tr>
                    <th scope="row">Sample proportion (p)</th>
                    <td>{estimate === null ? "-" : estimate.toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div className="sample-mean-plot">
            {mode === "mean" ? (
              sample.length > 0 ? (
                <Suspense
                  fallback={
                    <div className="sample-boxplot-empty">
                      Add samples to display the latest sample boxplot.
                    </div>
                  }
                >
                  <SampleBoxPlotFigure
                    sample={sample}
                    outcomeLabel={outcomeLabel}
                    unitLabel={unitLabel}
                  />
                </Suspense>
              ) : (
                <div className="sample-boxplot-empty">
                  Add samples to display the latest sample boxplot.
                </div>
              )
            ) : sample.length > 0 && binaryOptions ? (
              <ObservablePlotFigure options={binaryOptions} />
            ) : (
              <div className="sample-boxplot-empty">
                Add samples to display the latest sample bar chart.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {mode === "proportion" && sample.length > 0 && binaryOptions ? (
        <p className="caption">
          The bar chart shows the {negativeLabel} and {positiveLabel} outcomes in the latest Bernoulli sample
          {outcomeLabel.trim() ? ` for ${outcomeLabel}` : ""}. The sample proportion p is the
          proportion of {positiveLabel} values.
        </p>
      ) : null}
    </Panel>
  );
}
