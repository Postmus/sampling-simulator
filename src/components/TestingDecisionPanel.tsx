import { Panel, ValueCard } from "./ChartPrimitives";
import type { TestingKind } from "../core/types";

interface TestingDecisionPanelProps {
  testKind: TestingKind;
  statistic: number | null;
  criticalValue: number | null;
  pValue: number | null;
  sampleSize: number;
  reject: boolean | null;
  direction: "two-sided" | "greater" | "less";
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(3)}%`;
}

export function TestingDecisionPanel({
  testKind,
  statistic,
  criticalValue,
  pValue,
  sampleSize,
  reject,
  direction,
}: TestingDecisionPanelProps) {
  const isMean = testKind === "mean";
  const decisionText =
    reject === null ? "-" : reject ? "Reject H0" : "Keep H0";

  return (
    <Panel
      title={isMean ? "Critical value and conclusion" : "Exact binomial conclusion"}
      subtitle="This is the decision for the latest sample."
    >
      <div className="value-grid ci-values">
        {isMean ? (
          <>
            <ValueCard label="Observed t" value={statistic === null ? "-" : statistic.toFixed(3)} />
            <ValueCard label="Critical value" value={criticalValue === null ? "-" : criticalValue.toFixed(3)} />
            <ValueCard label="Decision" value={decisionText} />
          </>
        ) : (
          <>
            <ValueCard label="Observed successes" value={statistic === null ? "-" : statistic.toString()} />
            <ValueCard label="Exact p-value" value={formatPercent(pValue)} />
            <ValueCard label="Decision" value={decisionText} />
          </>
        )}
      </div>
      <p className="caption">
        {isMean
          ? direction === "two-sided"
            ? "The latest sample is compared with a two-sided rejection rule."
            : `The latest sample is compared with a ${direction === "greater" ? "right-tailed" : "left-tailed"} rejection rule.`
          : `The latest sample size is ${sampleSize}. The exact p-value comes from the binomial model under H0.`}
      </p>
    </Panel>
  );
}
