import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel, ValueCard } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { standardDeviation } from "../core/statistics";
import type { TeachingMode } from "../core/types";

interface SamplePanelProps {
  mode: TeachingMode;
  sample: number[];
  estimate: number | null;
  outcomeLabel: string;
  unitLabel: string;
}

function appendUnit(value: number | null, unitLabel: string, digits = 3) {
  if (value === null) {
    return "-";
  }

  const unit = unitLabel.trim();
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function SamplePanel({
  mode,
  sample,
  estimate,
  outcomeLabel,
  unitLabel,
}: SamplePanelProps) {
  const sampleSD = useMemo(
    () => (mode === "mean" && sample.length > 1 ? standardDeviation(sample) : null),
    [mode, sample],
  );

  const continuousOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (mode !== "mean" || sample.length === 0) {
      return null;
    }

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
      y: {
        axis: null,
      },
      marks: [
        Plot.ruleX(estimate !== null ? [estimate] : [], {
          stroke: "#0b7a6c",
          strokeWidth: 2,
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
  }, [estimate, mode, outcomeLabel, sample, unitLabel]);

  const binaryCounts = useMemo(() => {
    if (mode !== "proportion") {
      return [];
    }

    const successCount = sample.reduce((sum, value) => sum + value, 0);
    return [
      { outcome: "0", count: sample.length - successCount },
      { outcome: "1", count: successCount },
    ];
  }, [mode, sample]);

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
      marginLeft: 56,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        fontSize: "12px",
      },
      x: {
        type: "band",
        label: outcomeLabel.trim() || "Observed outcome",
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
          insetLeft: 40,
          insetRight: 40,
        }),
      ],
    };
  }, [binaryCounts, mode, outcomeLabel, sample.length]);

  return (
    <Panel
      title="Latest Sample"
      subtitle="This is the most recently generated sample. Its statistic is highlighted below and included in the sampling distribution."
    >
      <div className="value-grid">
        <ValueCard label="Sample size" value={sample.length.toString()} />
        <ValueCard
          label={
            mode === "mean"
              ? `${outcomeLabel.trim() || "Sample"} mean`
              : `Sample proportion${outcomeLabel.trim() ? ` of ${outcomeLabel}` : ""}`
          }
          value={mode === "mean" ? appendUnit(estimate, unitLabel) : estimate === null ? "-" : estimate.toFixed(3)}
        />
        {mode === "mean" ? (
          <ValueCard
            label="Sample SD (s)"
            value={appendUnit(sampleSD, unitLabel)}
          />
        ) : null}
        {mode === "proportion" ? (
          <ValueCard
            label={outcomeLabel.trim() ? `${outcomeLabel} count` : "Successes"}
            value={sample.reduce((sum, value) => sum + value, 0).toString()}
          />
        ) : null}
      </div>

      {sample.length > 0 ? (
        <>
          {mode === "mean" && continuousOptions ? (
            <>
              <ObservablePlotFigure options={continuousOptions} />
              <div className="inline-legend">
                <span className="legend-item">
                  <span className="legend-swatch current" />
                  {outcomeLabel.trim() ? `${outcomeLabel} mean` : "Sample mean"}
                </span>
                <span className="legend-item">
                  <span className="legend-swatch points" />
                  Individual observations
                </span>
              </div>
              <p className="caption">
                The points show the realised observations; the boxplot summarises the median and
                interquartile range for this one sample{unitLabel.trim() ? ` in ${unitLabel.trim()}` : ""}.
              </p>
            </>
          ) : null}

          {mode === "proportion" && binaryOptions ? (
            <>
              <ObservablePlotFigure options={binaryOptions} />
              <p className="caption">
                The bar chart counts the 0 and 1 outcomes in this one realised Bernoulli sample
                {outcomeLabel.trim() ? ` for ${outcomeLabel}` : ""}.
              </p>
            </>
          ) : null}
        </>
      ) : (
        <p className="placeholder">Add samples to see the most recently generated sample here.</p>
      )}
    </Panel>
  );
}
