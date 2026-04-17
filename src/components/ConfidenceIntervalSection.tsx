import { useMemo } from "react";
import { Panel, ValueCard } from "./ChartPrimitives";
import { formatContinuousValue } from "../core/format";
import { practicalMeanInterval, practicalProportionInterval } from "../core/inference";

interface ConfidenceIntervalSectionProps {
  mode: "mean" | "proportion";
  sample: number[];
  estimate: number | null;
  theoreticalMean: number | null;
  unitLabel: string;
  practicalCoverageCount: number;
  repeatedSamples: number;
  decimalPlaces: number;
  isLoading?: boolean;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

type MeanInterval = NonNullable<ReturnType<typeof practicalMeanInterval>>;
type ProportionInterval = NonNullable<ReturnType<typeof practicalProportionInterval>>;
type IntervalLike = MeanInterval | ProportionInterval;

interface IntervalRulerProps {
  estimate: number | null;
  trueValue: number | null;
  interval: IntervalLike | null;
  unitLabel: string;
  digits: number;
}

function IntervalRuler({
  estimate,
  trueValue,
  interval,
  unitLabel,
  digits,
}: IntervalRulerProps) {
  const geometry = useMemo(() => {
    const candidates = [estimate, trueValue, interval?.lower, interval?.upper].filter(
      (value): value is number => value !== null && value !== undefined && !Number.isNaN(value),
    );

    if (candidates.length === 0) {
      return null;
    }

    let min = Math.min(...candidates);
    let max = Math.max(...candidates);

    if (min === max) {
      min -= 1;
      max += 1;
    }

    const padding = Math.max((max - min) * 0.1, 0.02);
    min -= padding;
    max += padding;

    const width = 640;
    const height = 220;
    const marginLeft = 60;
    const marginRight = 24;
    const axisY = 168;
    const innerWidth = width - marginLeft - marginRight;
    const scaleX = (value: number) => marginLeft + ((value - min) / (max - min)) * innerWidth;

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = min + ratio * (max - min);
      return { x: scaleX(value), value };
    });

    return { width, height, axisY, scaleX, ticks };
  }, [estimate, interval, trueValue]);

  if (geometry === null || estimate === null || trueValue === null || interval === null) {
    return <p className="placeholder">Add a sample to display the latest confidence interval.</p>;
  }

  const bandY = 96;
  const estimateX = geometry.scaleX(estimate);
  const trueX = geometry.scaleX(trueValue);
  const leftX = geometry.scaleX(interval.lower);
  const rightX = geometry.scaleX(interval.upper);

  return (
    <div className="ci-ruler-wrap">
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="ci-ruler" aria-hidden="true">
        <line
          x1={60}
          y1={geometry.axisY}
          x2={geometry.width - 24}
          y2={geometry.axisY}
          className="ci-axis"
        />
        {geometry.ticks.map((tick) => (
          <g key={tick.x}>
            <line
              x1={tick.x}
              y1={geometry.axisY - 6}
              x2={tick.x}
              y2={geometry.axisY + 6}
              className="ci-tick"
            />
            <text x={tick.x} y={geometry.axisY + 24} textAnchor="middle" className="ci-tick-label">
              {formatContinuousValue(tick.value, unitLabel, digits)}
            </text>
          </g>
        ))}

        <line x1={leftX} y1={bandY} x2={rightX} y2={bandY} className="ci-band practical" />
        <line x1={leftX} y1={bandY - 10} x2={leftX} y2={bandY + 10} className="ci-end practical" />
        <line x1={rightX} y1={bandY - 10} x2={rightX} y2={bandY + 10} className="ci-end practical" />
        <circle cx={estimateX} cy={bandY} r={5} className="ci-center" />

        <line x1={trueX} y1={42} x2={trueX} y2={geometry.axisY} className="ci-true-line" />
        <text x={trueX} y={24} textAnchor="middle" className="ci-true-label">
          True value
        </text>
      </svg>
    </div>
  );
}

export function ConfidenceIntervalSection({
  mode,
  sample,
  estimate,
  theoreticalMean,
  unitLabel,
  practicalCoverageCount,
  repeatedSamples,
  decimalPlaces,
  isLoading = false,
}: ConfidenceIntervalSectionProps) {
  const displayDigits = decimalPlaces + 2;
  const practicalInterval = useMemo(
    () => (mode === "mean" ? practicalMeanInterval(sample) : null),
    [mode, sample],
  );
  const practicalProportion = useMemo(
    () => (mode === "proportion" ? practicalProportionInterval(sample) : null),
    [mode, sample],
  );
  const interval = mode === "mean" ? practicalInterval : practicalProportion;
  const practicalCoverage = repeatedSamples > 0 ? practicalCoverageCount / repeatedSamples : null;
  const trueInInterval =
    interval !== null &&
    theoreticalMean !== null &&
    interval.lower <= theoreticalMean &&
    theoreticalMean <= interval.upper;

  return (
    <section className="ci-section">
      <div className="ci-grid">
        <Panel
          title="95% confidence interval coverage"
          subtitle="This tracks repeated-sampling coverage of the 95% confidence interval procedure."
        >
          {isLoading ? (
            <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Calculating coverage summary...</p>
            </div>
          ) : (
            <>
              <div className="value-grid ci-values tight">
                <ValueCard label="Repeated samples" value={repeatedSamples.toString()} />
                <ValueCard
                  label="Intervals containing true value"
                  value={practicalCoverageCount.toString()}
                />
                <ValueCard label="Empirical coverage" value={formatPercent(practicalCoverage)} />
              </div>

              <div className="coverage-meter">
                <div className="coverage-track">
                  <div
                    className="coverage-fill"
                    style={{ width: `${Math.max(0, Math.min(100, (practicalCoverage ?? 0) * 100))}%` }}
                  />
                  <div className="coverage-target" style={{ left: "95%" }} />
                </div>
                <div className="coverage-scale">
                  <span>0%</span>
                  <span>95%</span>
                  <span>100%</span>
                </div>
              </div>

              <p className="caption">
                The meter shows how often the 95% confidence interval has contained the true value so far.
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Latest 95% confidence interval"
          subtitle="The latest 95% confidence interval, shown against the true value."
        >
          {isLoading ? (
            <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Calculating latest interval...</p>
            </div>
          ) : (
            <>
              <IntervalRuler
                estimate={estimate}
                trueValue={theoreticalMean}
                interval={interval}
                unitLabel={unitLabel}
                digits={displayDigits}
              />

              {interval !== null ? (
                <p className="caption ci-summary">
                  Latest estimate: {formatContinuousValue(estimate, unitLabel, displayDigits)} with 95% CI{" "}
                  {formatContinuousValue(interval.lower, unitLabel, displayDigits)} to{" "}
                  {formatContinuousValue(interval.upper, unitLabel, displayDigits)}.
                  {trueInInterval ? " The interval contains the true value." : " The interval misses the true value."}
                </p>
              ) : null}
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}
