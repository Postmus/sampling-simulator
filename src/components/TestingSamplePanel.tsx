import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { computeBinomialStatistic, computeTStatistic } from "../core/testing";
import { standardDeviation } from "../core/statistics";
import type { TestTruth, TestingKind } from "../core/types";

interface TestingSamplePanelProps {
  testKind: TestingKind;
  sample: number[];
  nullMean: number;
  unitLabel: string;
  outcomeLabel: string;
  truth: TestTruth;
}

function appendUnit(value: number | null, unitLabel: string, digits = 3) {
  if (value === null) {
    return "-";
  }

  const unit = unitLabel.trim();
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
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
  truth,
}: TestingSamplePanelProps) {
  const isMean = testKind === "mean";

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

  const plotOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (sample.length === 0) {
      return null;
    }

    if (isMean) {
      return {
        width: 560,
        height: 260,
        marginTop: 16,
        marginRight: 18,
        marginBottom: 48,
        marginLeft: 48,
        style: {
          background: "transparent",
          fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
          fontSize: "12px",
        },
        x: {
          label: outcomeLabel.trim()
            ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
            : `Observed value${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`,
        },
        y: { axis: null },
        marks: [
          Plot.ruleX([nullMean], {
            stroke: "#9a5a17",
            strokeWidth: 2,
            strokeDasharray: "5,4",
          }),
          Plot.boxX(sample, {
            fill: "#dc8e2c",
            fillOpacity: 0.24,
            stroke: "#9a5a17",
            strokeWidth: 2,
          }),
          Plot.dot(
            sample,
            Plot.dodgeY("middle", {
              x: (value) => value,
              r: 4.8,
              fill: "#5f9fc7",
              fillOpacity: 0.86,
              stroke: "#0d5c8d",
              strokeWidth: 1,
            }),
          ),
        ],
      };
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
      marginLeft: 48,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        fontSize: "12px",
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
                <td>{appendUnit(sampleMean, unitLabel)}</td>
              </tr>
              <tr>
                <th>Sample SD (s)</th>
                <td>{appendUnit(sampleSD, unitLabel)}</td>
              </tr>
              <tr>
                <th>Estimated SE</th>
                <td>{appendUnit(estimatedSE, unitLabel)}</td>
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
                <th>Sample proportion</th>
                <td>{formatPercent(sampleProportion)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {plotOptions !== null ? (
        <>
          <ObservablePlotFigure options={plotOptions} />
          <p className="caption">
            {isMean
              ? "The dashed line marks the null mean. The t statistic compares the sample mean to that null value in estimated SE units."
              : "The bars show the number of failures and successes in one sample. The exact binomial test uses the count of successes."}
          </p>
        </>
      ) : (
        <p className="placeholder">Add tests to see the latest sample here.</p>
      )}
    </Panel>
  );
}
