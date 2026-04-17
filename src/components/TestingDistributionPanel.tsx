import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import binomial from "@stdlib/stats-base-dists-binomial";
import chisquare from "@stdlib/stats-base-dists-chisquare";
import tDist from "@stdlib/stats-base-dists-t";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import type { TestDirection, TestingKind } from "../core/types";

interface TestingDistributionPanelProps {
  title: string;
  subtitle: string;
  subtitleSpacer?: boolean;
  caption?: string;
  distributionType: "theoretical" | "empirical";
  statisticFamily?: "t" | "chi-square";
  testKind: TestingKind;
  degreesOfFreedom?: number;
  nullValue: number;
  statistics: number[];
  sampleSize: number;
  criticalValue: number | null;
  criticalLower: number | null;
  criticalUpper: number | null;
  rejectionMask: boolean[] | null;
  currentStatistic: number | null;
  direction: TestDirection;
}

type PlotBand = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  fill: string;
};

function isRejectedMean(value: number, criticalValue: number | null, direction: TestDirection) {
  if (criticalValue === null) {
    return false;
  }

  if (direction === "two-sided") {
    return Math.abs(value) >= criticalValue;
  }

  if (direction === "greater") {
    return value >= criticalValue;
  }

  return value <= -criticalValue;
}

function estimateHistogramMax(values: number[], domain: [number, number], bins = 24) {
  if (values.length === 0) {
    return 1;
  }

  const counts = Array.from({ length: bins }, () => 0);
  const [min, max] = domain;
  const binWidth = (max - min) / bins;

  if (!Number.isFinite(binWidth) || binWidth <= 0) {
    return Math.max(1, values.length);
  }

  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue;
    }

    const clamped = Math.min(max, Math.max(min, value));
    const index = Math.min(bins - 1, Math.max(0, Math.floor((clamped - min) / binWidth)));
    counts[index] += 1;
  }

  return Math.max(1, ...counts);
}

function buildMeanH1Bands(
  domain: [number, number],
  criticalValue: number | null,
  direction: TestDirection,
  yMax: number,
) {
  if (criticalValue === null) {
    return [] as PlotBand[];
  }

  const leftRed = "#d97878";
  const green = "#8abf97";
  const xMin = domain[0];
  const xMax = domain[1];
  const clamp = (value: number) => Math.min(xMax, Math.max(xMin, value));

  if (direction === "two-sided") {
    return [
      { x1: xMin, x2: clamp(-criticalValue), y1: 0, y2: yMax, fill: leftRed },
      { x1: clamp(-criticalValue), x2: clamp(criticalValue), y1: 0, y2: yMax, fill: green },
      { x1: clamp(criticalValue), x2: xMax, y1: 0, y2: yMax, fill: leftRed },
    ];
  }

  if (direction === "greater") {
    return [
      { x1: xMin, x2: clamp(criticalValue), y1: 0, y2: yMax, fill: green },
      { x1: clamp(criticalValue), x2: xMax, y1: 0, y2: yMax, fill: leftRed },
    ];
  }

  return [
    { x1: xMin, x2: clamp(-criticalValue), y1: 0, y2: yMax, fill: leftRed },
    { x1: clamp(-criticalValue), x2: xMax, y1: 0, y2: yMax, fill: green },
  ];
}

function buildProportionH1Bands(
  domain: [number, number],
  criticalLower: number | null,
  criticalUpper: number | null,
  direction: TestDirection,
  yMax: number,
) {
  const leftRed = "#d97878";
  const green = "#8abf97";
  const xMin = domain[0];
  const xMax = domain[1];
  const clamp = (value: number) => Math.min(xMax, Math.max(xMin, value));

  if (criticalLower === null && criticalUpper === null) {
    return [] as PlotBand[];
  }

  const leftBoundary = criticalLower !== null ? criticalLower + 0.5 : xMin;
  const rightBoundary = criticalUpper !== null ? criticalUpper - 0.5 : xMax;
  const clampedLeftBoundary = clamp(leftBoundary);
  const clampedRightBoundary = clamp(rightBoundary);

  if (direction === "two-sided") {
    return [
      { x1: xMin, x2: clampedLeftBoundary, y1: 0, y2: yMax, fill: leftRed },
      { x1: clampedLeftBoundary, x2: clampedRightBoundary, y1: 0, y2: yMax, fill: green },
      { x1: clampedRightBoundary, x2: xMax, y1: 0, y2: yMax, fill: leftRed },
    ];
  }

  if (direction === "greater") {
    return [
      { x1: xMin, x2: clampedRightBoundary, y1: 0, y2: yMax, fill: green },
      { x1: clampedRightBoundary, x2: xMax, y1: 0, y2: yMax, fill: leftRed },
    ];
  }

  return [
    { x1: xMin, x2: clampedLeftBoundary, y1: 0, y2: yMax, fill: leftRed },
    { x1: clampedLeftBoundary, x2: xMax, y1: 0, y2: yMax, fill: green },
  ];
}

function buildProportionH1MaskBands(
  domain: [number, number],
  rejectionMask: boolean[] | null,
  yMax: number,
) {
  if (rejectionMask === null) {
    return [] as PlotBand[];
  }

  const xMin = domain[0];
  const xMax = domain[1];
  const firstCount = Math.max(0, Math.ceil(xMin));
  const lastCount = Math.min(rejectionMask.length - 1, Math.floor(xMax));

  return Array.from({ length: Math.max(0, lastCount - firstCount + 1) }, (_, index) => {
    const count = firstCount + index;
    return {
      x1: count - 0.5,
      x2: count + 0.5,
      y1: 0,
      y2: yMax,
      fill: rejectionMask[count] ? "#d97878" : "#8abf97",
    };
  });
}

export function TestingDistributionPanel({
  title,
  subtitle,
  subtitleSpacer = false,
  caption,
  distributionType,
  statisticFamily = "t",
  testKind,
  degreesOfFreedom,
  nullValue,
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
  const isTheoretical = distributionType === "theoretical";
  const isChiSquare = statisticFamily === "chi-square";
  const minimumEmpiricalSamples = 3;
  const resolvedDegreesOfFreedom = Math.max(degreesOfFreedom ?? sampleSize - 1, 1);
  const theoreticalDiscreteTail = 0.005;

  const xDomain = useMemo<[number, number] | undefined>(() => {
    if (isTheoretical) {
      if (isChiSquare) {
        const upper = chisquare.quantile(0.995, resolvedDegreesOfFreedom);
        return [0, Number.isFinite(upper) ? upper : 10];
      }

      if (isMean) {
        return [-3, 3];
      }

      const lower = binomial.quantile(theoreticalDiscreteTail, sampleSize, nullValue);
      const upper = binomial.quantile(1 - theoreticalDiscreteTail, sampleSize, nullValue);

      const minCount = Number.isFinite(lower) ? Math.max(0, Math.floor(lower)) : 0;
      const maxCount = Number.isFinite(upper) ? Math.min(sampleSize, Math.ceil(upper)) : sampleSize;

      return [minCount - 0.5, maxCount + 0.5];
    }

    if (!isMean && !isChiSquare) {
      const values = [...statistics];

      if (currentStatistic !== null) {
        values.push(currentStatistic);
      }

      if (rejectionMask !== null) {
        rejectionMask.forEach((isRejected, index) => {
          if (index < rejectionMask.length - 1 && isRejected !== rejectionMask[index + 1]) {
            values.push(index + 0.5);
          }
        });
      } else {
        if (criticalLower !== null) {
          values.push(criticalLower + 0.5);
        }
        if (criticalUpper !== null) {
          values.push(criticalUpper - 0.5);
        }
      }

      if (values.length === 0) {
        return undefined;
      }

      const min = Math.min(...values);
      const max = Math.max(...values);

      if (min === max) {
        return [Math.max(0, min - 1), max + 1];
      }

      return [Math.max(0, min - 0.5), max + 0.5];
    }

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
  }, [criticalLower, criticalUpper, criticalValue, currentStatistic, isMean, isTheoretical, nullValue, rejectionMask, sampleSize, statistics]);

  const options = useMemo<Plot.PlotOptions>(() => {
    if (isChiSquare && isTheoretical) {
      const domain = xDomain ?? [0, 10];
      const segmentCount = 180;
      const step = (domain[1] - domain[0]) / segmentCount;
      const segments = Array.from({ length: segmentCount }, (_, index) => {
        const x1 = domain[0] + index * step;
        const x2 = x1 + step;
        const midpoint = (x1 + x2) / 2;
        const density = chisquare.pdf(midpoint, resolvedDegreesOfFreedom);
        const rejected = criticalValue !== null ? midpoint >= criticalValue : false;

        return {
          x1,
          x2,
          y1: 0,
          y2: density,
          fill: rejected ? "#d97878" : "#8abf97",
        };
      });

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
          label: "χ² statistic",
          labelArrow: "none",
          labelAnchor: "center",
          domain,
        },
        y: {
          label: "Density",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          Plot.rectY(segments, {
            x1: "x1",
            x2: "x2",
            y1: "y1",
            y2: "y2",
            fill: "fill",
            fillOpacity: 0.74,
            inset: 0,
          }),
          Plot.line(
            segments.map((segment) => ({ x: (segment.x1 + segment.x2) / 2, y: segment.y2 })),
            {
              x: "x",
              y: "y",
              stroke: "#173142",
              strokeWidth: 2,
            },
          ),
          ...(criticalValue !== null
            ? [
                Plot.ruleX([criticalValue], {
                  stroke: "#6b7280",
                  strokeWidth: 1.5,
                  strokeOpacity: 0.75,
                  strokeDasharray: "5,4",
                }),
              ]
            : []),
        ],
      };
    }

    if (isMean && isTheoretical) {
      const domain = xDomain ?? [-5, 5];
      const segmentCount = 180;
      const step = (domain[1] - domain[0]) / segmentCount;
      const segments = Array.from({ length: segmentCount }, (_, index) => {
        const x1 = domain[0] + index * step;
        const x2 = x1 + step;
        const midpoint = (x1 + x2) / 2;
        const density = tDist.pdf(midpoint, resolvedDegreesOfFreedom);
        const rejected = isRejectedMean(midpoint, criticalValue, direction);

        return {
          x1,
          x2,
          y1: 0,
          y2: density,
          fill: rejected ? "#d97878" : "#8abf97",
        };
      });

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
          labelArrow: "none",
          labelAnchor: "center",
          domain,
        },
        y: {
          label: "Density",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          Plot.rectY(segments, {
            x1: "x1",
            x2: "x2",
            y1: "y1",
            y2: "y2",
            fill: "fill",
            fillOpacity: 0.74,
            inset: 0,
          }),
          Plot.line(
            segments.map((segment) => ({ x: (segment.x1 + segment.x2) / 2, y: segment.y2 })),
            {
              x: "x",
              y: "y",
              stroke: "#173142",
              strokeWidth: 2,
            },
          ),
          ...(criticalValue !== null
            ? direction === "two-sided"
              ? [
                  Plot.ruleX([criticalValue, -criticalValue], {
                    stroke: "#6b7280",
                    strokeWidth: 1.5,
                    strokeOpacity: 0.75,
                    strokeDasharray: "5,4",
                  }),
                ]
              : [
                  Plot.ruleX([direction === "greater" ? criticalValue : -criticalValue], {
                    stroke: "#6b7280",
                    strokeWidth: 1.5,
                    strokeOpacity: 0.75,
                    strokeDasharray: "5,4",
                  }),
                ]
            : []),
        ],
      };
    }

    if (isMean || isChiSquare) {
      const empiricalHistogramMax = estimateHistogramMax(statistics, xDomain ?? [-5, 5]);
      const yDomainMax = Math.max(1, Math.ceil(empiricalHistogramMax * 1.15));
      const backgroundBands = isChiSquare
        ? (criticalValue !== null
            ? [
                {
                  x1: xDomain?.[0] ?? 0,
                  x2: criticalValue,
                  y1: 0,
                  y2: yDomainMax,
                  fill: "#8abf97",
                },
                {
                  x1: criticalValue,
                  x2: xDomain?.[1] ?? Math.max(criticalValue + 1, 10),
                  y1: 0,
                  y2: yDomainMax,
                  fill: "#d97878",
                },
              ]
            : [])
        : buildMeanH1Bands(
            xDomain ?? [-5, 5],
            criticalValue,
            direction,
            yDomainMax,
          );

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
          label: isChiSquare ? "χ² statistic" : "t statistic",
          labelArrow: "none",
          labelAnchor: "center",
          domain: xDomain,
        },
        y: {
          label: "Count",
          grid: true,
          domain: [0, yDomainMax],
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          ...backgroundBands.map((band) =>
            Plot.rectY([band], {
              x1: "x1",
              x2: "x2",
              y1: "y1",
              y2: "y2",
              fill: "fill",
              fillOpacity: 0.18,
              inset: 0,
            }),
          ),
          ...(criticalValue !== null
            ? direction === "two-sided"
              ? [
                  Plot.ruleX([criticalValue, -criticalValue], {
                    stroke: "#6b7280",
                    strokeWidth: 1.5,
                    strokeOpacity: 0.75,
                    strokeDasharray: "5,4",
                  }),
                ]
              : [
                  Plot.ruleX([direction === "greater" ? criticalValue : -criticalValue], {
                    stroke: "#6b7280",
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

    if (isTheoretical) {
      const domain = xDomain ?? [-0.5, sampleSize + 0.5];
      const visibleCounts = Array.from({ length: sampleSize + 1 }, (_, count) => ({
        count,
        probability: binomial.pmf(count, sampleSize, nullValue),
        fill: rejectionMask?.[count] ?? false ? "#d97878" : "#8abf97",
      })).filter((entry) => {
        return entry.count - 0.4 >= domain[0] && entry.count + 0.4 <= domain[1];
      });
      const binRects = visibleCounts.map((entry) => ({
        x1: entry.count - 0.4,
        x2: entry.count + 0.4,
        y1: 0,
        y2: entry.probability,
        fill: entry.fill,
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
              .filter((value): value is number => value !== null)
              .filter((value) => value >= domain[0] && value <= domain[1]);

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
          labelArrow: "none",
          labelAnchor: "center",
          domain,
        },
        y: {
          label: "Probability",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          Plot.rectY(binRects, {
            x1: "x1",
            x2: "x2",
            y1: "y1",
            y2: "y2",
            fill: "fill",
            fillOpacity: 0.72,
            inset: 0,
          }),
          Plot.ruleX(lineValues, {
            stroke: "#6b7280",
            strokeWidth: 1.5,
            strokeOpacity: 0.75,
            strokeDasharray: "5,4",
          }),
        ],
      };
    }

    const counts = Array.from({ length: sampleSize + 1 }, (_, count) => ({
      count,
      frequency: statistics.filter((value) => value === count).length,
    }));
    const domain = xDomain ?? [-0.5, sampleSize + 0.5];
    const visibleCounts = counts.filter((entry) => entry.count - 0.4 >= domain[0] && entry.count + 0.4 <= domain[1]);
    const backgroundBands = buildProportionH1MaskBands(
      domain,
      rejectionMask,
      Math.max(1, ...visibleCounts.map((entry) => entry.frequency)),
    );
    const binRects = visibleCounts.map((entry) => ({
      x1: entry.count - 0.4,
      x2: entry.count + 0.4,
      y1: 0,
      y2: entry.frequency,
    }));

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
          labelArrow: "none",
          labelAnchor: "center",
          domain,
        },
      y: {
        label: "Count",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        ...backgroundBands.map((band) =>
          Plot.rectY([band], {
            x1: "x1",
            x2: "x2",
            y1: "y1",
            y2: "y2",
            fill: "fill",
            fillOpacity: 0.14,
            inset: 0,
          }),
        ),
        Plot.rectY(binRects, {
          x1: "x1",
          x2: "x2",
          y1: "y1",
          y2: "y2",
          fill: "#dc8e2c",
          fillOpacity: 0.9,
          inset: 0,
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
  }, [
    criticalLower,
    criticalUpper,
    criticalValue,
    currentStatistic,
    resolvedDegreesOfFreedom,
    direction,
    isMean,
    isTheoretical,
    nullValue,
    rejectionMask,
    sampleSize,
    statistics,
    xDomain,
  ]);

  const defaultCaption = isTheoretical
    ? "Green shows the acceptance region and red shows the rejection region under H0."
    : isMean
      ? "The orange bars show the empirical distribution under H1, and the colored bands show the H0 decision regions."
      : "The orange bars show the empirical distribution under H1, and the colored bands show the H0 decision regions.";

  return (
    <Panel title={title} subtitle={subtitle}>
      {subtitleSpacer ? <div className="distribution-subtitle-spacer" aria-hidden="true" /> : null}
      {isTheoretical || statistics.length >= minimumEmpiricalSamples ? (
        <>
          <ObservablePlotFigure options={options} />
          <p className="caption">{caption ?? defaultCaption}</p>
        </>
      ) : (
        <p className="placeholder">
          Add at least {minimumEmpiricalSamples} repeated {isMean ? "tests" : "samples"} to build the empirical
          {isMean ? " t" : " count"} distribution.
        </p>
      )}
    </Panel>
  );
}
