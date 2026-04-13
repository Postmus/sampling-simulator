import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { getMeanPopulationRange, populationCurve } from "../core/populations";
import type { PopulationConfig, TeachingMode } from "../core/types";

function quantityLabel(outcomeLabel: string, unitLabel: string) {
  const trimmedOutcome = outcomeLabel.trim();
  const trimmedUnit = unitLabel.trim();

  if (trimmedOutcome && trimmedUnit) {
    return `${trimmedOutcome} (${trimmedUnit})`;
  }

  if (trimmedOutcome) {
    return trimmedOutcome;
  }

  if (trimmedUnit) {
    return `Outcome (${trimmedUnit})`;
  }

  return "Outcome";
}

function parameterSummary(
  mode: TeachingMode,
  population: PopulationConfig,
  outcomeLabel: string,
  unitLabel: string,
) {
  const trimmedOutcome = outcomeLabel.trim();
  const trimmedUnit = unitLabel.trim();

  if (mode === "mean" && population.kind !== "bernoulli") {
    const label = trimmedOutcome ? `${trimmedOutcome} mean` : "population mean";
    const unit = trimmedUnit ? ` ${trimmedUnit}` : "";
    return `Parameter of interest: ${label} = ${population.params.mean.toFixed(2)}${unit}`;
  }

  if (mode === "proportion" && population.kind === "bernoulli") {
    const label = trimmedOutcome ? `proportion of ${trimmedOutcome}` : "population proportion";
    return `Parameter of interest: ${label} = ${population.params.p.toFixed(2)}`;
  }

  return "";
}

export function PopulationPanel({
  mode,
  population,
  outcomeLabel,
  unitLabel,
}: {
  mode: TeachingMode;
  population: PopulationConfig;
  outcomeLabel: string;
  unitLabel: string;
}) {
  const curve = useMemo(() => populationCurve(population), [population]);
  const summary = useMemo(
    () => parameterSummary(mode, population, outcomeLabel, unitLabel),
    [mode, outcomeLabel, population, unitLabel],
  );
  const options = useMemo<Plot.PlotOptions>(() => {
    if (population.kind === "bernoulli") {
      const barData = curve.map((point) => ({
        outcome: String(point.x),
        probability: point.y,
      }));

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
          label: outcomeLabel.trim() || "Outcome",
          type: "band",
        },
        y: {
          label: "Probability",
          grid: true,
        },
        marks: [
          Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
          Plot.rectY(barData, {
            x: "outcome",
            y1: 0,
            y2: "probability",
            insetLeft: 56,
            insetRight: 56,
            fill: "#dc8e2c",
          }),
        ],
      };
    }

    const range = getMeanPopulationRange(
      population.kind,
      population.params.mean,
      population.params.sd,
    );

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
        label: quantityLabel(outcomeLabel, unitLabel),
        domain: [range.min, range.max],
      },
      y: {
        label: "Density",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.ruleX([population.params.mean], {
          stroke: "#9a5a17",
          strokeWidth: 2,
          strokeOpacity: 0.8,
        }),
        Plot.line(curve, {
          x: "x",
          y: "y",
          stroke: "#0d5c8d",
          strokeWidth: 3,
        }),
      ],
    };
  }, [curve, outcomeLabel, population, unitLabel]);

  return (
    <Panel
      title="Population"
      subtitle="This panel shows the individual-level outcome distribution before any sample is drawn."
    >
      <ObservablePlotFigure options={options} />
      <p className="population-summary">{summary}</p>
    </Panel>
  );
}
