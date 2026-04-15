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
      if (criticalLower !== null) {
        values.push(criticalLower + 0.5);
      }
      if (criticalLower !== null) {
        values.push(criticalLower);
      }
      if (criticalUpper !== null) {
        values.push(criticalUpper - 0.5);
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
  }, [criticalLower, criticalUpper, criticalValue, currentStatistic, isMean, statistics]);

  const options = useMemo<Plot.PlotOptions>(() => {
    if (isMean) {
      return {
        width: 560,
        height: 280,
        marginTop: 16,
        marginRight: 18,
        marginBottom: 52,
        marginLeft: 76,
        style: {
          background: "transparent",
          fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
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
    }));
    const binRects = counts.map((entry) => ({
      x1: entry.count - 0.4,
      x2: entry.count + 0.4,
      y1: 0,
      y2: entry.frequency,
    }));
    const lineValues =
      rejectionMask === null
        ? [
            ...(criticalLower !== null ? [criticalLower + 0.5] : []),
            ...(criticalUpper !== null && criticalUpper !== criticalLower ? [criticalUpper - 0.5] : []),
          ]
        : rejectionMask
            .map((isRejected, index) =>
              index < rejectionMask.length - 1 && isRejected !== rejectionMask[index + 1]
                ? index + 0.5
                : null,
            )
            .filter((value): value is number => value !== null);

    return {
      width: 560,
      height: 280,
      marginTop: 16,
      marginRight: 18,
      marginBottom: 52,
      marginLeft: 76,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: "Number of successes",
        domain: xDomain,
      },
      y: {
        label: "Count",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.rectY(binRects, {
          x1: "x1",
          x2: "x2",
          y1: "y1",
          y2: "y2",
          fill: "#dc8e2c",
          fillOpacity: 0.9,
          inset: 0,
        }),
        Plot.ruleX(lineValues, {
          stroke: "#9a5a17",
          strokeWidth: 1.5,
          strokeOpacity: 0.75,
          strokeDasharray: "5,4",
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
  }, [criticalValue, currentStatistic, direction, isMean, rejectionMask, sampleSize, statistics, xDomain]);

  const caption =
    isMean
      ? direction === "two-sided"
        ? "The dashed lines mark the rejection region for a two-sided test."
        : `The dashed line marks the rejection region for a ${direction === "greater" ? "right-tailed" : "left-tailed"} test.`
      : "The dashed lines mark the rejection boundaries for the exact binomial test.";

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
