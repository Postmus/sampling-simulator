import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";

interface SamplingDistributionPanelProps {
  estimates: number[];
  theoreticalValue: number | null;
  theoreticalSE: number | null;
  currentEstimate: number | null;
  title: string;
  outcomeLabel: string;
  unitLabel: string;
}

export function SamplingDistributionPanel({
  estimates,
  theoreticalValue,
  theoreticalSE,
  currentEstimate,
  title,
  outcomeLabel,
  unitLabel,
}: SamplingDistributionPanelProps) {
  const estimateLabel =
    title.toLowerCase().includes("proportion") ? "sample proportions" : "sample means";
  const parameterLabel =
    title.toLowerCase().includes("proportion") ? "true proportion" : "true mean";
  const xDomain = useMemo<[number, number] | undefined>(() => {
    const values = [...estimates];

    if (currentEstimate !== null) {
      values.push(currentEstimate);
    }

    if (theoreticalValue !== null && theoreticalSE !== null) {
      values.push(theoreticalValue - 2 * theoreticalSE);
      values.push(theoreticalValue + 2 * theoreticalSE);
    } else if (theoreticalValue !== null) {
      values.push(theoreticalValue);
    }

    if (values.length === 0) {
      return undefined;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.05, 0.5);
      return [min - padding, max + padding];
    }

    const padding = (max - min) * 0.08;
    return [min - padding, max + padding];
  }, [currentEstimate, estimates, theoreticalSE, theoreticalValue]);

  const referenceBand =
    theoreticalValue !== null && theoreticalSE !== null
      ? {
          lower: theoreticalValue - 1.96 * theoreticalSE,
          offset: 1.96 * theoreticalSE,
          upper: theoreticalValue + 1.96 * theoreticalSE,
        }
      : null;

  const annotation = useMemo(() => {
    if (referenceBand === null || xDomain === undefined || theoreticalValue === null) {
      return null;
    }

    const width = 560;
    const height = 280;
    const marginLeft = 56;
    const marginRight = 18;
    const innerWidth = width - marginLeft - marginRight;
    const scaleX = (value: number) =>
      marginLeft + ((value - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;

    const x1 = scaleX(theoreticalValue);
    const x2 = scaleX(referenceBand.upper);
    const y = 24;

    return {
      width,
      height,
      x1,
      x2,
      y,
      tickTop: y - 5,
      tickBottom: y + 5,
      labelX: (x1 + x2) / 2,
      label: "1.96 × SE",
    };
  }, [referenceBand, theoreticalValue, xDomain]);

  const options = useMemo<Plot.PlotOptions>(() => ({
    width: 560,
    height: 280,
    marginTop: 16,
    marginRight: 18,
    marginBottom: 52,
    marginLeft: 56,
    style: {
      background: "transparent",
      fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      fontSize: "12px",
    },
    x: {
      label:
        outcomeLabel.trim() && title.toLowerCase().includes("mean")
          ? `${title}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
          : title,
      domain: xDomain,
    },
    y: {
      label: "Count",
      grid: true,
    },
    marks: [
      Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
      ...(referenceBand !== null
        ? [
            Plot.rect([
              {
                x1: referenceBand.lower,
                x2: referenceBand.upper,
                y1: 0,
                y2: 1,
              },
            ], {
              x1: "x1",
              x2: "x2",
              y1: "y1",
              y2: "y2",
              fill: "#9a5a17",
              fillOpacity: 0.08,
              inset: 0,
            }),
            Plot.ruleX([referenceBand.lower, referenceBand.upper], {
              stroke: "#9a5a17",
              strokeWidth: 1.5,
              strokeOpacity: 0.75,
              strokeDasharray: "5,4",
            }),
          ]
        : []),
      Plot.rectY(estimates, {
        ...Plot.binX(
          { y: "count" },
          {
            x: (value) => value,
            thresholds: 24,
            domain: xDomain,
          },
        ),
        fill: "#dc8e2c",
        fillOpacity: 0.9,
        inset: 0.5,
      }),
      ...(theoreticalValue !== null
        ? [
            Plot.ruleX([theoreticalValue], {
              stroke: "#9a5a17",
              strokeWidth: 2,
            }),
          ]
        : []),
      ...(currentEstimate !== null
        ? [
            Plot.ruleX([currentEstimate], {
              stroke: "#0b7a6c",
              strokeWidth: 2,
            }),
          ]
        : []),
    ],
  }), [currentEstimate, estimates, outcomeLabel, theoreticalSE, theoreticalValue, title, unitLabel, xDomain]);

  return (
    <Panel
      title="Sampling Distribution"
      subtitle="Each bar summarises the statistic across many repeated samples of the same size."
    >
      {estimates.length === 0 ? (
        <p className="placeholder">Add repeated samples to build the sampling distribution.</p>
      ) : (
        <>
          <div className="plot-stack">
            <ObservablePlotFigure options={options} />
            {annotation !== null ? (
              <svg
                viewBox={`0 0 ${annotation.width} ${annotation.height}`}
                className="plot-annotation"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="arrow-end"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="#9a5a17" />
                  </marker>
                </defs>
                <line
                  x1={annotation.x1}
                  y1={annotation.tickTop}
                  x2={annotation.x1}
                  y2={annotation.tickBottom}
                  className="annotation-line"
                />
                <line
                  x1={annotation.x2}
                  y1={annotation.tickTop}
                  x2={annotation.x2}
                  y2={annotation.tickBottom}
                  className="annotation-line"
                />
                <line
                  x1={annotation.x1}
                  y1={annotation.y}
                  x2={annotation.x2}
                  y2={annotation.y}
                  className="annotation-line"
                  markerEnd="url(#arrow-end)"
                />
                <text
                  x={annotation.labelX}
                  y={annotation.y - 8}
                  textAnchor="middle"
                  className="annotation-text"
                >
                  {annotation.label}
                </text>
              </svg>
            ) : null}
          </div>
          <div className="inline-legend">
            <span className="legend-item emphasis">
              Repeated samples: {estimates.length}
            </span>
            {referenceBand !== null ? (
              <span className="legend-item">
                <span className="legend-swatch band" />
                About 95% of {estimateLabel}
              </span>
            ) : null}
            {theoreticalValue !== null ? (
              <span className="legend-item">
                <span className="legend-swatch theory" />
                True value
              </span>
            ) : null}
            {currentEstimate !== null ? (
              <span className="legend-item">
                <span className="legend-swatch current" />
                Current sample
              </span>
            ) : null}
          </div>
        </>
      )}
      <p className="caption">
        {referenceBand !== null
          ? `${title}. The dashed boundaries show ${parameterLabel} ± 1.96 × SE, where about 95% of ${estimateLabel} fall when the sampling distribution is normal or approximately normal.`
          : title}
      </p>
    </Panel>
  );
}
