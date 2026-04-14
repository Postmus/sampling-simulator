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
  const isPowerView = truth === "h1";
  const panelTitle = isPowerView ? "Power" : "Rejection rate";
  const panelSubtitle = isPowerView
    ? "This shows how often the test rejects when H1 is true."
    : "This shows how often the test rejects when H0 is true.";
  const rateLabel = isPowerView ? "Empirical power" : "Empirical Type I error rate";
  const exactLabel = isPowerView ? "Exact expected power" : "Exact expected Type I error rate";
  const rateCaption =
    truth === "h1"
      ? "Power is the probability of rejecting H0 when H1 is true."
      : "Type I error is the probability of rejecting H0 when H0 is true.";

  return (
    <Panel title={panelTitle} subtitle={panelSubtitle}>
      <div className="value-grid ci-values tight">
        <ValueCard label="Repeated tests" value={repetitions.toString()} />
        <ValueCard label="Rejections" value={rejectionCount.toString()} />
        <ValueCard label={rateLabel} value={formatPercent(empiricalRejectionRate)} />
      </div>

      <div className="value-grid ci-values">
        <ValueCard label={exactLabel} value={formatPercent(theoreticalRejectionRate)} />
      </div>

      <p className="caption">{rateCaption}</p>
    </Panel>
  );
}
