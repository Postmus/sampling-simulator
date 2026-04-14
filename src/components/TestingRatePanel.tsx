import { Panel, ValueCard } from "./ChartPrimitives";
import type { TestTruth } from "../core/types";

interface TestingRatePanelProps {
  truth: TestTruth;
  repetitions: number;
  rejectionCount: number;
  empiricalRejectionRate: number | null;
  theoreticalRejectionRate: number | null;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function TestingRatePanel({
  truth,
  repetitions,
  rejectionCount,
  empiricalRejectionRate,
  theoreticalRejectionRate,
}: TestingRatePanelProps) {
  const rateLabel = truth === "h1" ? "Empirical power" : "Type I error rate";
  const rateCaption =
    truth === "h1"
      ? "Under H1, this is the estimated power of the test."
      : "Under H0, this is the estimated false positive rate.";

  return (
    <Panel title="Rejection rate" subtitle="This is the repeated-sampling result for the current setup.">
      <div className="value-grid ci-values tight">
        <ValueCard label="Repeated tests" value={repetitions.toString()} />
        <ValueCard label="Rejections" value={rejectionCount.toString()} />
        <ValueCard label={rateLabel} value={formatPercent(empiricalRejectionRate)} />
      </div>

      <div className="value-grid ci-values">
        <ValueCard
          label="Exact expected rejection rate"
          value={formatPercent(theoreticalRejectionRate)}
        />
      </div>

      <p className="caption">{rateCaption}</p>
    </Panel>
  );
}
