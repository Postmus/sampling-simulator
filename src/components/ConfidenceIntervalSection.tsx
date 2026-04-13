import { useMemo } from "react";
import { Panel, ValueCard } from "./ChartPrimitives";
import {
  practicalMeanInterval,
  practicalProportionInterval,
  theoreticalMeanInterval,
} from "../core/inference";

interface ConfidenceIntervalSectionProps {
  mode: "mean" | "proportion";
  sample: number[];
  estimate: number | null;
  theoreticalMean: number | null;
  theoreticalSE: number | null;
  unitLabel: string;
  practicalCoverageCount: number;
  repeatedSamples: number;
}

function formatValue(value: number | null, unitLabel: string, digits = 3) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  const unit = unitLabel.trim();
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

interface IntervalRulerProps {
  estimate: number | null;
  trueValue: number | null;
  theoretical: ReturnType<typeof theoreticalMeanInterval>;
  practical: ReturnType<typeof practicalMeanInterval>;
  unitLabel: string;
}

function IntervalRuler({
  estimate,
  trueValue,
  theoretical,
  practical,
  unitLabel,
}: IntervalRulerProps) {
  const geometry = useMemo(() => {
    const candidates = [
      estimate,
      trueValue,
      theoretical?.lower,
      theoretical?.upper,
      practical?.lower,
      practical?.upper,
    ].filter((value): value is number => value !== null && value !== undefined && !Number.isNaN(value));

    if (candidates.length === 0) {
      return null;
    }

    let min = Math.min(...candidates);
    let max = Math.max(...candidates);

    if (min === max) {
      min -= 1;
      max += 1;
    }

    const padding = (max - min) * 0.1;
    min -= padding;
    max += padding;

    const width = 640;
    const height = 240;
    const marginLeft = 60;
    const marginRight = 24;
    const axisY = 188;
    const innerWidth = width - marginLeft - marginRight;
    const scaleX = (value: number) => marginLeft + ((value - min) / (max - min)) * innerWidth;

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = min + ratio * (max - min);
      return {
        x: scaleX(value),
        value,
      };
    });

    return {
      width,
      height,
      axisY,
      scaleX,
      ticks,
    };
  }, [estimate, practical, theoretical, trueValue]);

  if (geometry === null || estimate === null || trueValue === null || theoretical === null || practical === null) {
    return <p className="placeholder">Add a sample to display the latest confidence intervals.</p>;
  }

  const theoreticalY = 84;
  const practicalY = 132;
  const estimateX = geometry.scaleX(estimate);
  const trueX = geometry.scaleX(trueValue);
  const theoreticalLeft = geometry.scaleX(theoretical.lower);
  const theoreticalRight = geometry.scaleX(theoretical.upper);
  const practicalLeft = geometry.scaleX(practical.lower);
  const practicalRight = geometry.scaleX(practical.upper);

  return (
    <div className="ci-ruler-wrap">
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="ci-ruler" aria-hidden="true">
        <line x1={60} y1={geometry.axisY} x2={geometry.width - 24} y2={geometry.axisY} className="ci-axis" />
        {geometry.ticks.map((tick) => (
          <g key={tick.x}>
            <line x1={tick.x} y1={geometry.axisY - 6} x2={tick.x} y2={geometry.axisY + 6} className="ci-tick" />
            <text x={tick.x} y={geometry.axisY + 24} textAnchor="middle" className="ci-tick-label">
              {formatValue(tick.value, unitLabel, 1)}
            </text>
          </g>
        ))}

        <text x={60} y={40} className="ci-row-label">Theoretical SE CI</text>
        <line x1={theoreticalLeft} y1={theoreticalY} x2={theoreticalRight} y2={theoreticalY} className="ci-band theoretical" />
        <circle cx={estimateX} cy={theoreticalY} r={5} className="ci-center" />
        <line x1={theoreticalLeft} y1={theoreticalY - 10} x2={theoreticalLeft} y2={theoreticalY + 10} className="ci-end theoretical" />
        <line x1={theoreticalRight} y1={theoreticalY - 10} x2={theoreticalRight} y2={theoreticalY + 10} className="ci-end theoretical" />

        <text x={60} y={118} className="ci-row-label">Practical t CI</text>
        <line x1={practicalLeft} y1={practicalY} x2={practicalRight} y2={practicalY} className="ci-band practical" />
        <circle cx={estimateX} cy={practicalY} r={5} className="ci-center" />
        <line x1={practicalLeft} y1={practicalY - 10} x2={practicalLeft} y2={practicalY + 10} className="ci-end practical" />
        <line x1={practicalRight} y1={practicalY - 10} x2={practicalRight} y2={practicalY + 10} className="ci-end practical" />

        <line x1={trueX} y1={44} x2={trueX} y2={geometry.axisY} className="ci-true-line" />
        <text x={trueX} y={28} textAnchor="middle" className="ci-true-label">True value</text>
      </svg>
      <p className="caption">
        The two intervals are centred on the latest sample mean. The practical t interval uses the
        sample SD and a t multiplier so that the CI procedure has the correct repeated-sampling
        coverage. For this one sample, it may be narrower or wider than the theoretical-SE interval.
      </p>
    </div>
  );
}

interface SingleIntervalRulerProps {
  estimate: number | null;
  trueValue: number | null;
  interval: ReturnType<typeof practicalProportionInterval>;
  unitLabel: string;
  intervalLabel: string;
}

function SingleIntervalRuler({
  estimate,
  trueValue,
  interval,
  unitLabel,
  intervalLabel,
}: SingleIntervalRulerProps) {
  const geometry = useMemo(() => {
    const candidates = [
      estimate,
      trueValue,
      interval?.lower,
      interval?.upper,
    ].filter((value): value is number => value !== null && value !== undefined && !Number.isNaN(value));

    if (candidates.length === 0) {
      return null;
    }

    let min = Math.min(...candidates);
    let max = Math.max(...candidates);

    if (min === max) {
      min -= 0.05;
      max += 0.05;
    }

    const padding = Math.max((max - min) * 0.12, 0.03);
    min -= padding;
    max += padding;

    const width = 640;
    const height = 220;
    const marginLeft = 60;
    const marginRight = 24;
    const axisY = 176;
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

  const bandY = 102;
  const estimateX = geometry.scaleX(estimate);
  const trueX = geometry.scaleX(trueValue);
  const leftX = geometry.scaleX(interval.lower);
  const rightX = geometry.scaleX(interval.upper);

  return (
    <div className="ci-ruler-wrap">
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="ci-ruler" aria-hidden="true">
        <line x1={60} y1={geometry.axisY} x2={geometry.width - 24} y2={geometry.axisY} className="ci-axis" />
        {geometry.ticks.map((tick) => (
          <g key={tick.x}>
            <line x1={tick.x} y1={geometry.axisY - 6} x2={tick.x} y2={geometry.axisY + 6} className="ci-tick" />
            <text x={tick.x} y={geometry.axisY + 24} textAnchor="middle" className="ci-tick-label">
              {formatValue(tick.value, unitLabel, 2)}
            </text>
          </g>
        ))}

        <text x={60} y={58} className="ci-row-label">{intervalLabel}</text>
        <line x1={leftX} y1={bandY} x2={rightX} y2={bandY} className="ci-band practical" />
        <line x1={leftX} y1={bandY - 10} x2={leftX} y2={bandY + 10} className="ci-end practical" />
        <line x1={rightX} y1={bandY - 10} x2={rightX} y2={bandY + 10} className="ci-end practical" />
        <circle cx={estimateX} cy={bandY} r={5} className="ci-center" />

        <line x1={trueX} y1={44} x2={trueX} y2={geometry.axisY} className="ci-true-line" />
        <text x={trueX} y={28} textAnchor="middle" className="ci-true-label">True value</text>
      </svg>
    </div>
  );
}

export function ConfidenceIntervalSection({
  mode,
  sample,
  estimate,
  theoreticalMean,
  theoreticalSE,
  unitLabel,
  practicalCoverageCount,
  repeatedSamples,
}: ConfidenceIntervalSectionProps) {
  const theoreticalInterval = useMemo(
    () => theoreticalMeanInterval(estimate, theoreticalSE),
    [estimate, theoreticalSE],
  );
  const practicalInterval = useMemo(
    () => (mode === "mean" ? practicalMeanInterval(sample) : null),
    [mode, sample],
  );
  const practicalProportion = useMemo(
    () => (mode === "proportion" ? practicalProportionInterval(sample) : null),
    [mode, sample],
  );
  const practicalCoverage =
    repeatedSamples > 0 ? practicalCoverageCount / repeatedSamples : null;

  if (mode === "proportion") {
    return (
      <section className="ci-section">
        <Panel
          title="Approximate 95% CI"
          subtitle="This card uses the usual normal-approximation confidence interval based on the latest sample proportion."
        >
          <div className="theory-block compact">
            <p>
              <strong>Normal approximation:</strong> For a proportion, the confidence interval is based on
              the sample proportion and an estimated standard error.
            </p>
            <p>
              <strong>Estimated SE:</strong> Here the estimated SE is sqrt(sample proportion × (1 - sample proportion) / n),
              so the interval gets narrower as the sample size increases.
            </p>
          </div>
          <div className="formula-block">sample proportion ± 1.96 × estimated SE</div>
          <div className="value-grid ci-values">
            <ValueCard label="Sample proportion" value={formatValue(estimate, unitLabel)} />
            <ValueCard
              label="Estimated SE"
              value={practicalProportion === null ? "-" : formatValue(practicalProportion.standardError, unitLabel)}
            />
            <ValueCard
              label="95% CI"
              value={
                practicalProportion === null
                  ? "-"
                  : `${formatValue(practicalProportion.lower, unitLabel)} to ${formatValue(practicalProportion.upper, unitLabel)}`
              }
            />
          </div>
          <SingleIntervalRuler
            estimate={estimate}
            trueValue={theoreticalMean}
            interval={practicalProportion}
            unitLabel={unitLabel}
            intervalLabel="Normal-approximation CI"
          />
          <div className="value-grid ci-values tight">
            <ValueCard label="Repeated samples" value={repeatedSamples.toString()} />
            <ValueCard label="Intervals containing true proportion" value={practicalCoverageCount.toString()} />
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
            This shows the long-run coverage of the practical normal-approximation interval across the simulated samples.
          </p>
        </Panel>
      </section>
    );
  }

  return (
    <section className="ci-section">
      <div className="ci-grid">
        <Panel
          title="95% CI From 95% Boundaries"
          subtitle="Start from the sampling-distribution rule already shown above."
        >
          <div className="theory-block compact">
            <p>
              <strong>95% boundaries:</strong> When the sampling distribution is normal or approximately
              normal, about 95% of sample means fall within true mean ± 1.96 × SE.
            </p>
            <p>
              <strong>Confidence interval:</strong> Equivalently, in about 95% of repeated samples, the
              interval sample mean ± 1.96 × SE contains the true mean.
            </p>
          </div>
          <div className="formula-block">sample mean ± 1.96 × SE</div>
        </Panel>

        <Panel
          title="95% CI Used In Practice"
          subtitle="This is the interval usually reported when the population SD is unknown."
        >
          <div className="theory-block compact">
            <p>
              <strong>Estimated SE:</strong> In practice, the standard error is estimated by s / sqrt(n).
            </p>
            <p>
              <strong>t multiplier:</strong> The value 1.96 is replaced by a t multiplier, while the SE
              is estimated from the sample. This gives the interval the correct repeated-sampling
              coverage when sigma is unknown. For a given sample, it can be narrower or wider than
              the theoretical-SE interval.
            </p>
          </div>
          <div className="formula-block">sample mean ± t × estimated SE</div>
          <div className="value-grid ci-values tight">
            <ValueCard
              label="Estimated SE"
              value={practicalInterval === null ? "-" : formatValue(practicalInterval.standardError, unitLabel)}
            />
            <ValueCard
              label="Sample SD (s)"
              value={practicalInterval === null ? "-" : formatValue(practicalInterval.sampleSD, unitLabel)}
            />
            <ValueCard
              label="t multiplier"
              value={practicalInterval === null ? "-" : practicalInterval.tCritical.toFixed(3)}
              hint={sample.length > 1 ? `df = ${sample.length - 1}` : undefined}
            />
          </div>
        </Panel>

        <Panel
          title="Latest Sample Intervals"
          subtitle="The latest sample is shown twice: once with the theoretical SE and once with the practical t interval."
        >
          <div className="value-grid ci-values">
            <ValueCard label="Point estimate" value={formatValue(estimate, unitLabel)} />
            <ValueCard
              label="Theoretical 95% CI"
              value={
                theoreticalInterval === null
                  ? "-"
                  : `${formatValue(theoreticalInterval.lower, unitLabel)} to ${formatValue(theoreticalInterval.upper, unitLabel)}`
              }
            />
            <ValueCard
              label="Practical t CI"
              value={
                practicalInterval === null
                  ? "-"
                  : `${formatValue(practicalInterval.lower, unitLabel)} to ${formatValue(practicalInterval.upper, unitLabel)}`
              }
            />
          </div>
          <IntervalRuler
            estimate={estimate}
            trueValue={theoreticalMean}
            theoretical={theoreticalInterval}
            practical={practicalInterval}
            unitLabel={unitLabel}
          />
        </Panel>

        <Panel
          title="Coverage Of The Practical CI"
          subtitle="This checks how often the practical t interval contains the true mean across repeated samples."
        >
          <div className="value-grid ci-values tight">
            <ValueCard label="Repeated samples" value={repeatedSamples.toString()} />
            <ValueCard label="Intervals containing true mean" value={practicalCoverageCount.toString()} />
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
            With enough repeated samples, this simulated coverage should usually settle near 95%.
          </p>
        </Panel>
      </div>
    </section>
  );
}
