import { Panel } from "./ChartPrimitives";

interface MetricsPanelProps {
  mode: "mean" | "proportion";
  empiricalMean: number | null;
  empiricalSE: number | null;
  theoreticalMean: number | null;
  theoreticalSE: number | null;
  outcomeLabel: string;
  unitLabel: string;
}

function formatNumber(value: number | null, unitLabel = "", digits = 3) {
  if (value === null) {
    return "-";
  }

  const unit = unitLabel.trim();
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function MetricsPanel({
  mode,
  empiricalMean,
  empiricalSE,
  theoreticalMean,
  theoreticalSE,
  outcomeLabel,
  unitLabel,
}: MetricsPanelProps) {
  const labelStem =
    mode === "mean"
      ? `${outcomeLabel.trim() || "Mean"}`
      : `${outcomeLabel.trim() ? `Proportion of ${outcomeLabel}` : "Proportion"}`;
  const unit = mode === "mean" ? unitLabel.trim() : "";
  const estimatorLabel =
    mode === "mean"
      ? "sample mean"
      : outcomeLabel.trim()
        ? `sample proportion of ${outcomeLabel}`
        : "sample proportion";
  const parameterLabel =
    mode === "mean"
      ? "true mean"
      : outcomeLabel.trim()
        ? `true proportion of ${outcomeLabel}`
        : "true proportion";
  const rangeLabel =
    mode === "mean"
      ? "sample means"
      : outcomeLabel.trim()
        ? `sample proportions of ${outcomeLabel}`
        : "sample proportions";
  const repeatedSamplingText =
    mode === "mean"
      ? `The histogram to the left is the sampling distribution of the ${estimatorLabel}. It is normal when the population is normal, and is often approximately normal for large enough samples.`
      : `The histogram to the left is the sampling distribution of the ${estimatorLabel}. The individual outcomes are binary, so this distribution can only be approximately normal when the sample size is large enough and both outcomes occur often enough.`;
  const boundariesText =
    mode === "mean"
      ? `About 95% of ${rangeLabel} fall within ${parameterLabel} ± 1.96 × SE when this sampling distribution is normal or approximately normal.`
      : `Because this sampling distribution is only approximately normal, about 95% of ${rangeLabel} fall within ${parameterLabel} ± 1.96 × SE when the sample size is large enough and both outcomes occur often enough.`;

  return (
    <Panel
      title="Metrics"
      subtitle="These summaries help connect the simulated sampling distribution to the underlying theory."
    >
      <div className="metrics-grid">
        <div className="metrics-cell metrics-head" />
        <div className="metrics-cell metrics-head">Empirical</div>
        <div className="metrics-cell metrics-head">Theoretical</div>

        <div className="metrics-cell metrics-row-label">{labelStem}</div>
        <div className="metrics-cell">{formatNumber(empiricalMean, unit)}</div>
        <div className="metrics-cell">{formatNumber(theoreticalMean, unit)}</div>

        <div className="metrics-cell metrics-row-label">SE</div>
        <div className="metrics-cell">{formatNumber(empiricalSE, unit)}</div>
        <div className="metrics-cell">{formatNumber(theoreticalSE, unit)}</div>
      </div>
      <div className="theory-block">
        <h3>Theory</h3>
        <p>
          <strong>SE:</strong> The standard error is the standard deviation of the sampling
          distribution of the {estimatorLabel}. It describes how much the estimate changes from
          sample to sample.
        </p>
        <p>
          <strong>Repeated sampling:</strong> {repeatedSamplingText}
        </p>
        <p>
          <strong>95% boundaries:</strong> {boundariesText}
        </p>
      </div>
    </Panel>
  );
}
