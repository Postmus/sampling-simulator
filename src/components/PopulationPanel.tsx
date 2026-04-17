import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { formatContinuousValue } from "../core/format";
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

function populationRows(
  mode: TeachingMode,
  population: PopulationConfig,
  decimalPlaces: number,
  unitLabel: string,
) {
  if (mode === "mean" && population.kind !== "bernoulli") {
    return [
      {
        label: "Population mean (μ)",
        value: formatContinuousValue(population.params.mean, unitLabel, decimalPlaces),
      },
      {
        label: "Population SD (σ)",
        value: formatContinuousValue(population.params.sd, unitLabel, decimalPlaces),
      },
    ];
  }

  if (population.kind === "bernoulli") {
    return [{ label: "Population proportion (π)", value: population.params.p.toFixed(2) }];
  }

  return [];
}

export function PopulationPanel({
  mode,
  population,
  outcomeLabel,
  successLabel,
  failureLabel,
  decimalPlaces,
  unitLabel,
}: {
  mode: TeachingMode;
  population: PopulationConfig;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  decimalPlaces: number;
  unitLabel: string;
}) {
  const curve = useMemo(() => populationCurve(population), [population]);
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const rows = useMemo(
    () => populationRows(mode, population, decimalPlaces, unitLabel),
    [decimalPlaces, mode, population, unitLabel],
  );
  const options = useMemo<Plot.PlotOptions>(() => {
    if (population.kind === "bernoulli") {
      const barData = curve.map((point) => ({
        outcome: point.x === 0 ? negativeLabel : positiveLabel,
        probability: point.y,
      }));

      return {
        width: 560,
        height: 220,
        marginTop: 16,
        marginRight: 18,
        marginBottom: 40,
        marginLeft: 76,
        style: {
          background: "transparent",
          fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        },
        x: {
          label: outcomeLabel.trim() || "Outcome",
          type: "band",
          domain: [positiveLabel, negativeLabel],
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
      height: 220,
      marginTop: 16,
      marginRight: 18,
      marginBottom: 40,
      marginLeft: 76,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
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
  }, [curve, negativeLabel, outcomeLabel, positiveLabel, population, unitLabel]);

  return (
    <Panel
      title="Population"
      subtitle="This panel shows the individual-level outcome distribution before any sample is drawn."
    >
      <ObservablePlotFigure options={options} />
      <table className="sample-summary-table population-summary-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
