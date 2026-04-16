import { useMemo } from "react";
import { Panel } from "./ChartPrimitives";
import { formatContinuousValue } from "../core/format";
import { standardDeviation } from "../core/statistics";

interface MetricsPanelProps {
  mode: "mean" | "proportion";
  sample: number[];
  empiricalSE: number | null;
  theoreticalSE: number | null;
  unitLabel: string;
  decimalPlaces: number;
}

export function MetricsPanel({
  mode,
  sample,
  empiricalSE,
  theoreticalSE,
  unitLabel,
  decimalPlaces,
}: MetricsPanelProps) {
  const displayDigits = decimalPlaces + 2;
  const estimatedSE = useMemo(() => {
    if (sample.length === 0) {
      return null;
    }

    if (mode === "mean") {
      const s = standardDeviation(sample);
      return sample.length > 0 ? s / Math.sqrt(sample.length) : null;
    }

    const pHat = sample.reduce((sum, value) => sum + value, 0) / sample.length;
    return Math.sqrt((pHat * (1 - pHat)) / sample.length);
  }, [mode, sample]);

  const unit = mode === "mean" ? unitLabel.trim() : "";
  const note =
    mode === "mean"
      ? "The theoretical SE uses the true population SD. The empirical SE comes from the repeated-sampling simulation. The estimated SE uses the sample SD from the latest sample."
      : "The theoretical SE uses the true population proportion π. The empirical SE comes from the repeated-sampling simulation. The estimated SE uses the sample proportion p from the latest sample.";
  const theoreticalFormula =
    mode === "mean" ? "σ / √n" : "√[π(1 - π) / n]";
  const estimatedFormula =
    mode === "mean" ? "s / √n" : "√[p(1 - p) / n]";

  return (
    <Panel
      title="Standard Error"
      subtitle="How much the estimate varies from sample to sample."
    >
      <div className="metrics-table-wrap">
        <table className="metrics-table">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">SE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Theoretical</th>
              <td>{formatContinuousValue(theoreticalSE, unit, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Empirical</th>
              <td>{formatContinuousValue(empiricalSE, unit, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Estimated</th>
              <td>{formatContinuousValue(estimatedSE, unit, displayDigits)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="metrics-formulas">
        <div className="formula-block">
          <div className="formula-label">Theoretical SE</div>
          <div className="formula-value">{theoreticalFormula}</div>
        </div>
        <div className="formula-block">
          <div className="formula-label">Estimated SE</div>
          <div className="formula-value">{estimatedFormula}</div>
        </div>
      </div>
      <p className="metrics-note">
        {note}
      </p>
    </Panel>
  );
}
