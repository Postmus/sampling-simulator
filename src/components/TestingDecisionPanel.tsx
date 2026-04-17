import { Panel, ValueCard } from "./ChartPrimitives";
import type { TestingKind } from "../core/types";

interface TestingDecisionPanelProps {
  testKind: TestingKind;
  statistic: number | null;
  criticalValue: number | null;
  pValue: number | null;
  sampleSize: number;
  reject: boolean | null;
  caption?: string;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(3);
}

export function TestingDecisionPanel({
  testKind,
  statistic,
  criticalValue,
  pValue,
  sampleSize,
  reject,
  caption,
}: TestingDecisionPanelProps) {
  const isMean = testKind === "mean";
  const decisionText =
    reject === null ? "-" : reject ? "Reject H0" : "Keep H0";

  return (
    <Panel
      title="Test Statistic and Decision"
      subtitle="This is the decision for the latest sample from the specified true population."
    >
      <div className="value-grid ci-values">
        {isMean ? (
          <>
            <ValueCard label="Observed t" value={statistic === null ? "-" : statistic.toFixed(3)} />
            <ValueCard label="p-value" value={formatPercent(pValue)} />
            <ValueCard label="Decision" value={decisionText} />
          </>
        ) : (
          <>
            <ValueCard label="Observed successes" value={statistic === null ? "-" : statistic.toString()} />
            <ValueCard label="p-value" value={formatPercent(pValue)} />
            <ValueCard label="Decision" value={decisionText} />
          </>
        )}
      </div>
      <p className="caption">
        {caption ??
          (isMean
            ? "The observed t uses the latest sample's mean, SD, and sample size."
            : "The observed count is compared with the expected count under the null proportion, and the p-value comes from the binomial model under the null population.")}
      </p>
    </Panel>
  );
}
