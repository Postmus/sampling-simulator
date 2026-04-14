import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import type { TestDirection, TestingKind } from "../core/types";

interface TestingDistributionPanelProps {
  testKind: TestingKind;
  statistics: number[];
  sampleSize: number;
  criticalValue: number | null;
  criticalLower: number | null;
  criticalUpper: number | null;
  rejectionMask: boolean[] | null;
  currentStatistic: number | null;
  direction: TestDirection;
}

export function TestingDistributionPanel({
  testKind,
  statistics,
  sampleSize,
  criticalValue,
  criticalLower,
  criticalUpper,
  rejectionMask,
  currentStatistic,
  direction,
}: TestingDistributionPanelProps) {
  const isMean = testKind === "mean";

  const xDomain = useMemo<[number, number] | undefined>(() => {
    const values = [...statistics];

    if (currentStatistic !== null) {
      values.push(currentStatistic);
    }

    if (isMean) {
      if (criticalValue !== null) {
        values.push(criticalValue, -criticalValue);
      }
    } else {
      values.push(0, sampleSize);
      if (criticalLower !== null) {
        values.push(criticalLower);
      }
      if (criticalUpper !== null) {
        values.push(criticalUpper);
      }
    }

    if (values.length === 0) {
      return undefined;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return isMean ? [min - 1, max + 1] : [Math.max(0, min - 1), max + 1];
    }

    const padding = (max - min) * 0.1;
    return isMean ? [min - padding, max + padding] : [Math.max(0, min - padding), max + padding];
  }, [criticalLower, criticalUpper, criticalValue, currentStatistic, isMean, sampleSize, statistics]);

  const options = useMemo<Plot.PlotOptions>(() => {
    if (isMean) {
      return {
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
          label: "t statistic",
          domain: xDomain,
        },
        y: {
          label: "Count",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          ...(criticalValue !== null
            ? direction === "two-sided"
              ? [
                  Plot.ruleX([criticalValue, -criticalValue], {
                    stroke: "#9a5a17",
                    strokeWidth: 1.5,
                    strokeOpacity: 0.75,
                    strokeDasharray: "5,4",
                  }),
                ]
              : [
                  Plot.ruleX([direction === "greater" ? criticalValue : -criticalValue], {
                    stroke: "#9a5a17",
                    strokeWidth: 1.5,
                    strokeOpacity: 0.75,
                    strokeDasharray: "5,4",
                  }),
                ]
            : []),
          Plot.rectY(statistics, {
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
          ...(currentStatistic !== null
            ? [
                Plot.ruleX([currentStatistic], {
                  stroke: "#0b7a6c",
                  strokeWidth: 2,
                }),
              ]
            : []),
        ],
      };
    }

    const counts = Array.from({ length: sampleSize + 1 }, (_, count) => ({
      count,
      frequency: statistics.filter((value) => value === count).length,
      rejected: rejectionMask?.[count] ?? false,
    }));

    return {
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
        label: "Number of successes",
        domain: [-0.5, sampleSize + 0.5],
      },
      y: {
        label: "Count",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.barY(
          counts.filter((entry) => !entry.rejected),
          {
            x: "count",
            y: "frequency",
            fill: "#dc8e2c",
            fillOpacity: 0.9,
            inset: 0.3,
          },
        ),
        Plot.barY(
          counts.filter((entry) => entry.rejected),
          {
            x: "count",
            y: "frequency",
            fill: "#9a5a17",
            fillOpacity: 0.9,
            inset: 0.3,
          },
        ),
        ...(currentStatistic !== null
          ? [
              Plot.ruleX([currentStatistic], {
                stroke: "#0b7a6c",
                strokeWidth: 2,
              }),
            ]
          : []),
      ],
    };
  }, [criticalValue, currentStatistic, direction, isMean, rejectionMask, sampleSize, statistics, xDomain]);

  const caption =
    isMean
      ? direction === "two-sided"
        ? "The dashed lines mark the rejection region for a two-sided test."
        : `The dashed line marks the rejection region for a ${direction === "greater" ? "right-tailed" : "left-tailed"} test.`
      : "The shaded bars show the exact rejection region for the binomial test.";

  return (
    <Panel
      title={isMean ? "Sampling distribution of t" : "Sampling distribution of X"}
      subtitle={
        isMean
          ? "This is the simulated distribution of the one-sample t statistic."
          : "This is the simulated distribution of the number of successes in the exact binomial test."
      }
    >
      {statistics.length === 0 ? (
        <p className="placeholder">
          Add repeated {isMean ? "tests" : "samples"} to build the {isMean ? "t" : "count"} distribution.
        </p>
      ) : (
        <>
          <ObservablePlotFigure options={options} />
          <p className="caption">{caption}</p>
        </>
      )}
    </Panel>
  );
}
