import { computeProportionZApproximation } from "../core/testing";
import type { TestDirection } from "../core/types";
import { Panel, ValueCard } from "./ChartPrimitives";

interface NormalApproximationComparisonProps {
  count: number | null;
  sampleSize: number;
  nullProbability: number;
  alpha: number;
  direction: TestDirection;
  exactPValue: number | null;
}

function formatNumber(value: number | null, digits = 3) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(digits);
}

function formatDecision(value: boolean | null) {
  if (value === null) {
    return "-";
  }

  return value ? "Reject H₀" : "Keep H₀";
}

function approximationStatus(expectedSuccesses: number, expectedFailures: number) {
  const minimumExpected = Math.min(expectedSuccesses, expectedFailures);

  if (minimumExpected >= 5) {
    return {
      label: "Rule met",
      hint: "Both expected counts are at least 5.",
    };
  }

  return {
    label: "Use caution",
    hint: "At least one expected count is below 5.",
  };
}

export function NormalApproximationComparison({
  count,
  sampleSize,
  nullProbability,
  alpha,
  direction,
  exactPValue,
}: NormalApproximationComparisonProps) {
  const approximation = computeProportionZApproximation(
    count,
    sampleSize,
    nullProbability,
    alpha,
    direction,
  );
  const status = approximationStatus(
    approximation.expectedSuccesses,
    approximation.expectedFailures,
  );
  const pValueGap =
    approximation.pValue === null || exactPValue === null
      ? null
      : Math.abs(approximation.pValue - exactPValue);

  return (
    <>
      <Panel
        title="What the Z-test Would Say"
        subtitle="Large-sample normal approximation using the null proportion."
      >
        <div className="value-grid ci-values">
          <ValueCard label="Sample proportion" value={formatNumber(approximation.sampleProportion)} />
          <ValueCard label="Observed z" value={formatNumber(approximation.zStatistic)} />
          <ValueCard label="Z p-value" value={formatNumber(approximation.pValue)} />
          <ValueCard label="Z decision" value={formatDecision(approximation.reject)} />
        </div>
        <p className="caption">
          The standard error is calculated from π<sub>0</sub>, so this card shows the usual one-sample
          proportion Z-test approximation.
        </p>
      </Panel>

      <Panel
        title="When the Approximation Works"
        subtitle="Expected counts under H₀ indicate how reliable the normal approximation is."
      >
        <div className="value-grid ci-values">
          <ValueCard label="Expected successes" value={formatNumber(approximation.expectedSuccesses, 1)} />
          <ValueCard label="Expected failures" value={formatNumber(approximation.expectedFailures, 1)} />
          <ValueCard label="Approximation" value={status.label} hint={status.hint} />
          <ValueCard label="P-value gap" value={formatNumber(pValueGap)} hint="Absolute difference from exact p-value." />
        </div>
        <p className="caption">
          The exact binomial test remains the primary decision; this comparison is a quick check on the normal
          approximation.
        </p>
      </Panel>
    </>
  );
}
