import { Panel, ValueCard } from "./ChartPrimitives";
import type { TestingKind } from "../core/types";

interface TestingRatePanelProps {
  testKind: TestingKind;
  h1Repetitions: number;
  h1RejectionCount: number;
  h1EmpiricalRejectionRate: number | null;
  h1TheoreticalRejectionRate: number | null;
  isLoading?: boolean;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function TestingRatePanel({
  testKind,
  h1Repetitions,
  h1RejectionCount,
  h1EmpiricalRejectionRate,
  h1TheoreticalRejectionRate,
  isLoading = false,
}: TestingRatePanelProps) {
  const isMean = testKind === "mean";
  const panelTitle = "Power";
  const panelSubtitle = isMean
    ? "This shows the power under the specified true population."
    : "This shows the power under the specified true population for the exact binomial test.";

  return (
    <Panel title={panelTitle} subtitle={panelSubtitle}>
      {isLoading ? (
        <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Calculating power summary...</p>
        </div>
      ) : (
        <>
          <div className="value-grid ci-values tight">
            <ValueCard label="H1 tests" value={h1Repetitions.toString()} />
            <ValueCard label="H1 rejections" value={h1RejectionCount.toString()} />
            <ValueCard label="Empirical power" value={formatPercent(h1EmpiricalRejectionRate)} />
          </div>

          <div className="value-grid ci-values">
            <ValueCard label="Exact power" value={formatPercent(h1TheoreticalRejectionRate)} />
          </div>

          <p className="caption">
            Power is the rejection rate when the specified true population is the alternative scenario.
          </p>
        </>
      )}
    </Panel>
  );
}
