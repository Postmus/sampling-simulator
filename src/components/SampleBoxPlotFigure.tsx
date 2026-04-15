import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { ObservablePlotFigure } from "./ObservablePlotFigure";

interface SampleBoxPlotFigureProps {
  sample: number[];
  outcomeLabel: string;
  unitLabel: string;
}

export function SampleBoxPlotFigure({
  sample,
  outcomeLabel,
  unitLabel,
}: SampleBoxPlotFigureProps) {
  const label = useMemo(
    () =>
      outcomeLabel.trim()
        ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
        : `Observed value${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`,
    [outcomeLabel, unitLabel],
  );

  const options = useMemo<Plot.PlotOptions | null>(() => {
    if (sample.length === 0) {
      return null;
    }

    const data = sample.map((value) => ({
      group: "Sample",
      value,
    }));

    return {
      width: 560,
      height: 300,
      marginTop: 6,
      marginRight: 24,
      marginBottom: 18,
      marginLeft: 84,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        axis: null,
        label: null,
        domain: ["Sample"],
      },
      y: {
        label,
        grid: true,
        nice: true,
        zero: false,
      },
      marks: [
        Plot.boxY(data, {
          x: "group",
          y: "value",
          fill: "#dc8e2c",
          fillOpacity: 0.26,
          stroke: "#9a5a17",
          strokeWidth: 2,
        }),
      ],
    };
  }, [outcomeLabel, sample, unitLabel]);

  if (options === null) {
    return null;
  }

  return (
    <div className="sample-boxplot-shell">
      <ObservablePlotFigure options={options} className="sample-boxplot-host" />
    </div>
  );
}
