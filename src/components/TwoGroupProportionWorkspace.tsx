import { useMemo } from "react";
import * as Plot from "@observablehq/plot";
import { Panel, ValueCard } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { formatContinuousValue } from "../core/format";
import {
  practicalProportionDifferenceInterval,
  proportionDifferenceSE,
} from "../core/inference";
import { populationCurve } from "../core/populations";
import {
  theoreticalProportionDifference,
} from "../core/theory";
import type {
  TwoGroupProportionPopulationConfig,
  TwoGroupSimulationSummary,
} from "../core/types";
import { SamplingDistributionPanel } from "./SamplingDistributionPanel";
import { TwoGroupSampleSizeControls } from "./TwoGroupSampleSizeControls";

function buildBernoulliPopulation(p: number) {
  return {
    kind: "bernoulli" as const,
    params: { p },
  };
}

function countSuccesses(sample: number[]) {
  return sample.reduce((sum, value) => sum + value, 0);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function proportionRows(population: TwoGroupProportionPopulationConfig) {
  return [
    {
      key: "group-a-p",
      label: (
        <>
          Group A proportion (<span>π</span>
          <sub>A</sub>)
        </>
      ),
      value: population.groupA.p.toFixed(2),
    },
    {
      key: "group-b-p",
      label: (
        <>
          Group B proportion (<span>π</span>
          <sub>B</sub>)
        </>
      ),
      value: population.groupB.p.toFixed(2),
    },
    {
      key: "true-difference",
      label: "True proportion difference",
      value: theoreticalProportionDifference(population).toFixed(2),
    },
  ];
}

function binaryPlotOptions(
  sample: number[],
  outcomeLabel: string,
  successLabel: string,
  failureLabel: string,
  accent: string,
): Plot.PlotOptions | null {
  if (sample.length === 0) {
    return null;
  }

  const successes = countSuccesses(sample);
  const failures = sample.length - successes;
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const data = [
    { label: positiveLabel, count: successes, fill: accent },
    { label: negativeLabel, count: failures, fill: "#5f9fc7" },
  ];

  return {
    width: 360,
    height: 220,
    marginTop: 12,
    marginRight: 18,
    marginBottom: 40,
    marginLeft: 64,
    style: {
      background: "transparent",
      fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    },
    x: {
      type: "band",
      label: outcomeLabel.trim() || "Outcome",
      domain: [positiveLabel, negativeLabel],
    },
    y: {
      label: "Count",
      grid: true,
    },
    marks: [
      Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
      Plot.barY(data, {
        x: "label",
        y: "count",
        fill: "fill",
        inset: 0.35,
      }),
    ],
  };
}

function TwoGroupProportionPopulationPanel({
  population,
  outcomeLabel,
  successLabel,
  failureLabel,
}: {
  population: TwoGroupProportionPopulationConfig;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
}) {
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const rows = useMemo(() => proportionRows(population), [population]);

  const groupAOptions = useMemo<Plot.PlotOptions | null>(() => {
    const curve = populationCurve(buildBernoulliPopulation(population.groupA.p));
    const barData = curve.map((point) => ({
      outcome: point.x === 1 ? positiveLabel : negativeLabel,
      probability: point.y,
    }));

    return {
      width: 360,
      height: 170,
      marginTop: 12,
      marginRight: 18,
      marginBottom: 36,
      marginLeft: 64,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: outcomeLabel.trim() || "Outcome",
        type: "band",
        domain: [positiveLabel, negativeLabel],
      },
      y: {
        label: "Probability",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.rectY(barData, {
          x: "outcome",
          y1: 0,
          y2: "probability",
          insetLeft: 48,
          insetRight: 48,
          fill: "#0d5c8d",
        }),
      ],
    };
  }, [negativeLabel, outcomeLabel, positiveLabel, population.groupA.p]);

  const groupBOptions = useMemo<Plot.PlotOptions | null>(() => {
    const curve = populationCurve(buildBernoulliPopulation(population.groupB.p));
    const barData = curve.map((point) => ({
      outcome: point.x === 1 ? positiveLabel : negativeLabel,
      probability: point.y,
    }));

    return {
      width: 360,
      height: 170,
      marginTop: 12,
      marginRight: 18,
      marginBottom: 36,
      marginLeft: 64,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: outcomeLabel.trim() || "Outcome",
        type: "band",
        domain: [positiveLabel, negativeLabel],
      },
      y: {
        label: "Probability",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.rectY(barData, {
          x: "outcome",
          y1: 0,
          y2: "probability",
          insetLeft: 48,
          insetRight: 48,
          fill: "#dc8e2c",
        }),
      ],
    };
  }, [negativeLabel, outcomeLabel, positiveLabel, population.groupB.p]);

  return (
    <Panel
      title="Population"
      subtitle="Both groups are modeled as Bernoulli populations with separate success probabilities."
    >
      <div className="two-group-population-stack">
        <div className="two-group-population-card">
          <div className="two-group-population-label">Group A</div>
          {groupAOptions !== null ? <ObservablePlotFigure options={groupAOptions} /> : null}
        </div>
        <div className="two-group-population-card">
          <div className="two-group-population-label">Group B</div>
          {groupBOptions !== null ? <ObservablePlotFigure options={groupBOptions} /> : null}
        </div>
      </div>

      <table className="sample-summary-table population-summary-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function TwoGroupProportionSamplePanel({
  sampleA,
  sampleB,
  difference,
  outcomeLabel,
  successLabel,
  failureLabel,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
}) {
  const positiveLabel = successLabel.trim() || "Yes";
  const negativeLabel = failureLabel.trim() || "No";
  const successesA = countSuccesses(sampleA);
  const successesB = countSuccesses(sampleB);
  const failuresA = sampleA.length - successesA;
  const failuresB = sampleB.length - successesB;
  const totalSuccesses = successesA + successesB;
  const totalFailures = failuresA + failuresB;
  const totalSampleSize = sampleA.length + sampleB.length;
  const proportionA = sampleA.length > 0 ? successesA / sampleA.length : null;
  const proportionB = sampleB.length > 0 ? successesB / sampleB.length : null;
  const estimatedSE = useMemo(() => proportionDifferenceSE(sampleA, sampleB), [sampleA, sampleB]);

  const groupAOptions = useMemo(
    () => binaryPlotOptions(sampleA, outcomeLabel, positiveLabel, negativeLabel, "#0d5c8d"),
    [negativeLabel, outcomeLabel, positiveLabel, sampleA],
  );
  const groupBOptions = useMemo(
    () => binaryPlotOptions(sampleB, outcomeLabel, positiveLabel, negativeLabel, "#dc8e2c"),
    [negativeLabel, outcomeLabel, positiveLabel, sampleB],
  );

  return (
    <Panel
      title="Latest Sample"
      subtitle="This is the most recently generated pair of samples. The difference in proportions is highlighted below."
      className="sample-panel"
    >
      <div className="two-group-sample-grid">
        <div className="two-group-sample-card">
          <h3>Group A</h3>
          {groupAOptions !== null ? (
            <ObservablePlotFigure options={groupAOptions} />
          ) : (
            <div className="sample-boxplot-empty">Add samples to display Group A.</div>
          )}
        </div>
        <div className="two-group-sample-card">
          <h3>Group B</h3>
          {groupBOptions !== null ? (
            <ObservablePlotFigure options={groupBOptions} />
          ) : (
            <div className="sample-boxplot-empty">Add samples to display Group B.</div>
          )}
        </div>
      </div>

      <table className="sample-summary-table contingency-table">
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">{positiveLabel}</th>
            <th scope="col">{negativeLabel}</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Group A</th>
            <td>{successesA.toString()}</td>
            <td>{failuresA.toString()}</td>
            <td>{sampleA.length.toString()}</td>
          </tr>
          <tr>
            <th scope="row">Group B</th>
            <td>{successesB.toString()}</td>
            <td>{failuresB.toString()}</td>
            <td>{sampleB.length.toString()}</td>
          </tr>
          <tr className="contingency-table-total">
            <th scope="row">Total</th>
            <td>{totalSuccesses.toString()}</td>
            <td>{totalFailures.toString()}</td>
            <td>{totalSampleSize.toString()}</td>
          </tr>
        </tbody>
      </table>

      <table className="sample-summary-table sample-summary-table-compact">
        <thead>
          <tr>
            <th scope="col">Statistic</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Sample proportion Group A (p<sub>A</sub>)</th>
            <td>{formatContinuousValue(proportionA, "", 2)}</td>
          </tr>
          <tr>
            <th scope="row">Sample proportion Group B (p<sub>B</sub>)</th>
            <td>{formatContinuousValue(proportionB, "", 2)}</td>
          </tr>
          <tr>
            <th scope="row">Proportion difference</th>
            <td>{difference === null ? "-" : difference.toFixed(2)}</td>
          </tr>
          <tr>
            <th scope="row">Estimated SE</th>
            <td>{formatContinuousValue(estimatedSE, "", 2)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}

function TwoGroupProportionMetricsPanel({
  sampleA,
  sampleB,
  empiricalSE,
  theoreticalSE,
}: {
  sampleA: number[];
  sampleB: number[];
  empiricalSE: number | null;
  theoreticalSE: number | null;
}) {
  const estimatedSE = useMemo(() => proportionDifferenceSE(sampleA, sampleB), [sampleA, sampleB]);

  return (
    <Panel
      title="Standard Error"
      subtitle="How much the proportion difference varies from sample to sample."
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
              <td>{formatContinuousValue(theoreticalSE, "", 2)}</td>
            </tr>
            <tr>
              <th scope="row">Empirical</th>
              <td>{formatContinuousValue(empiricalSE, "", 2)}</td>
            </tr>
            <tr>
              <th scope="row">Estimated</th>
              <td>{formatContinuousValue(estimatedSE, "", 2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="metrics-formulas">
        <div className="formula-block">
          <div className="formula-label">Theoretical SE</div>
          <div className="formula-value">
            <span>√[π</span>
            <sub>A</sub>
            <span>(1 - π</span>
            <sub>A</sub>
            <span>) / n</span>
            <sub>A</sub>
            <span> + π</span>
            <sub>B</sub>
            <span>(1 - π</span>
            <sub>B</sub>
            <span>) / n</span>
            <sub>B</sub>
            <span>]</span>
          </div>
        </div>
        <div className="formula-block">
          <div className="formula-label">Estimated SE</div>
          <div className="formula-value">
            <span>√[p</span>
            <sub>A</sub>
            <span>(1 - p</span>
            <sub>A</sub>
            <span>) / n</span>
            <sub>A</sub>
            <span> + p</span>
            <sub>B</sub>
            <span>(1 - p</span>
            <sub>B</sub>
            <span>) / n</span>
            <sub>B</sub>
            <span>]</span>
          </div>
        </div>
      </div>
      <p className="metrics-note">
        The theoretical SE uses the true group proportions. The empirical SE comes from the repeated-sampling simulation. The estimated SE uses the latest sample proportions.
      </p>
    </Panel>
  );
}

function DifferenceIntervalRuler({
  estimate,
  trueValue,
  interval,
  digits,
}: {
  estimate: number | null;
  trueValue: number | null;
  interval: NonNullable<ReturnType<typeof practicalProportionDifferenceInterval>>;
  digits: number;
}) {
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

  if (geometry === null || estimate === null || trueValue === null) {
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
        <line x1={60} y1={geometry.axisY} x2={geometry.width - 24} y2={geometry.axisY} className="ci-axis" />
        {geometry.ticks.map((tick) => (
          <g key={tick.x}>
            <line x1={tick.x} y1={geometry.axisY - 6} x2={tick.x} y2={geometry.axisY + 6} className="ci-tick" />
            <text x={tick.x} y={geometry.axisY + 24} textAnchor="middle" className="ci-tick-label">
              {formatContinuousValue(tick.value, "", digits)}
            </text>
          </g>
        ))}

        <line x1={leftX} y1={bandY} x2={rightX} y2={bandY} className="ci-band practical" />
        <line x1={leftX} y1={bandY - 10} x2={leftX} y2={bandY + 10} className="ci-end practical" />
        <line x1={rightX} y1={bandY - 10} x2={rightX} y2={bandY + 10} className="ci-end practical" />
        <circle cx={estimateX} cy={bandY} r={5} className="ci-center" />

        <line x1={trueX} y1={42} x2={trueX} y2={geometry.axisY} className="ci-true-line" />
        <text x={trueX} y={24} textAnchor="middle" className="ci-true-label">
          True difference
        </text>
      </svg>
    </div>
  );
}

function TwoGroupProportionConfidenceIntervalSection({
  sampleA,
  sampleB,
  difference,
  theoreticalDifference,
  practicalCoverageCount,
  repeatedSamples,
  summaryLoading = false,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  theoreticalDifference: number | null;
  practicalCoverageCount: number;
  repeatedSamples: number;
  summaryLoading?: boolean;
}) {
  const practicalInterval = useMemo(
    () => practicalProportionDifferenceInterval(sampleA, sampleB),
    [sampleA, sampleB],
  );
  const practicalCoverage = repeatedSamples > 0 ? practicalCoverageCount / repeatedSamples : null;
  const trueInInterval =
    practicalInterval !== null &&
    theoreticalDifference !== null &&
    practicalInterval.lower <= theoreticalDifference &&
    theoreticalDifference <= practicalInterval.upper;

  return (
    <section className="ci-section">
      <div className="ci-grid">
        <Panel
          title="95% confidence interval coverage"
          subtitle="This tracks repeated-sampling coverage of the 95% confidence interval procedure."
        >
          {summaryLoading ? (
            <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Calculating coverage summary...</p>
            </div>
          ) : (
            <>
              <div className="value-grid ci-values tight">
                <ValueCard label="Repeated samples" value={repeatedSamples.toString()} />
                <ValueCard
                  label="Intervals containing true difference"
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
                The meter shows how often the 95% confidence interval for the difference in proportions has contained the true difference so far.
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Latest 95% confidence interval"
          subtitle="The latest 95% confidence interval, shown against the true proportion difference."
        >
          {summaryLoading ? (
            <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Calculating latest interval...</p>
            </div>
          ) : (
            <>
              {practicalInterval !== null ? (
                <DifferenceIntervalRuler
                  estimate={difference}
                  trueValue={theoreticalDifference}
                  interval={practicalInterval}
                  digits={2}
                />
              ) : (
                <p className="placeholder">Add a sample to display the latest confidence interval.</p>
              )}

              {practicalInterval !== null ? (
                <p className="caption ci-summary">
                  Latest estimate: {formatContinuousValue(difference, "", 2)} with 95% CI{" "}
                  {formatContinuousValue(practicalInterval.lower, "", 2)} to{" "}
                  {formatContinuousValue(practicalInterval.upper, "", 2)}.
                  {trueInInterval ? " The interval contains the true difference." : " The interval misses the true difference."}
                </p>
              ) : null}
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}

export function TwoGroupProportionWorkspace({
  population,
  sampleSizeA,
  sampleSizeB,
  equalSampleSizes,
  repetitions,
  estimates,
  currentSampleA,
  currentSampleB,
  currentDifference,
  outcomeLabel,
  successLabel,
  failureLabel,
  summary,
  summaryLoading,
  teachingTitle,
  onOutcomeLabelChange,
  onSuccessLabelChange,
  onFailureLabelChange,
  onGroupAChange,
  onGroupBChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: {
  population: TwoGroupProportionPopulationConfig;
  sampleSizeA: number;
  sampleSizeB: number;
  equalSampleSizes: boolean;
  repetitions: number;
  estimates: number[];
  currentSampleA: number[];
  currentSampleB: number[];
  currentDifference: number | null;
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  summary: TwoGroupSimulationSummary;
  summaryLoading: boolean;
  teachingTitle: string;
  onOutcomeLabelChange: (value: string) => void;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onGroupAChange: (value: number) => void;
  onGroupBChange: (value: number) => void;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      <section className="control-band">
        <section className="control-card">
          <div className="control-card-header">
            <h2>Population Model</h2>
            <p>Specify the parametric model behind the sampled data.</p>
          </div>

          <div className="population-rows">
            <div className="population-row">
              <div className="row-label">
                <h3>Outcome</h3>
                <p>Specify the name of the outcome variable first.</p>
              </div>
              <div className="controls-grid population-row-grid">
                <label className="control-field">
                  <span>Outcome name</span>
                  <input
                    type="text"
                    value={outcomeLabel}
                    placeholder="Outcome"
                    onChange={(event) => onOutcomeLabelChange(event.target.value)}
                  />
                </label>
                <label className="control-field">
                  <span>Success label</span>
                  <input
                    type="text"
                    value={successLabel}
                    placeholder="Yes"
                    onChange={(event) => onSuccessLabelChange(event.target.value)}
                  />
                </label>
                <label className="control-field">
                  <span>Failure label</span>
                  <input
                    type="text"
                    value={failureLabel}
                    placeholder="No"
                    onChange={(event) => onFailureLabelChange(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="setup-subcard">
              <div className="row-label">
                <h3>Population parameters</h3>
                <p>Specify a Bernoulli model with separate group success probabilities.</p>
              </div>
              <div className="controls-grid population-row-grid">
                <label className="control-field">
                  <span>Group A proportion (π<sub>A</sub>)</span>
                  <div className="sample-size-row">
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.groupA.p}
                      onChange={(event) => onGroupAChange(Number(event.target.value))}
                    />
                    <input
                      className="sample-size-input"
                      type="number"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.groupA.p}
                      onChange={(event) => onGroupAChange(Number(event.target.value))}
                    />
                  </div>
                </label>

                <label className="control-field">
                  <span>Group B proportion (π<sub>B</sub>)</span>
                  <div className="sample-size-row">
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.groupB.p}
                      onChange={(event) => onGroupBChange(Number(event.target.value))}
                    />
                    <input
                      className="sample-size-input"
                      type="number"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.groupB.p}
                      onChange={(event) => onGroupBChange(Number(event.target.value))}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="control-card">
          <div className="control-card-header">
            <h2>Sampling</h2>
            <p>Set the sample size for each group and generate repeated sample pairs.</p>
          </div>

        <div className="controls-grid sampling-grid">
          <div className="control-field sample-size-field">
            <span>Sample sizes</span>
            <TwoGroupSampleSizeControls
              equalSampleSizes={equalSampleSizes}
              sampleSizeA={sampleSizeA}
              sampleSizeB={sampleSizeB}
              onEqualSampleSizesChange={onEqualSampleSizesChange}
              onSampleSizeAChange={onSampleSizeAChange}
              onSampleSizeBChange={onSampleSizeBChange}
            />
          </div>

            <div className="run-summary">
              <span>Repeated samples</span>
              <strong>{repetitions}</strong>
            </div>
          </div>

          <div className="button-row">
            <button type="button" onClick={() => onAddSamples(1)}>
              Add 1
            </button>
            <button type="button" onClick={() => onAddSamples(10)}>
              Add 10
            </button>
            <button type="button" onClick={() => onAddSamples(100)}>
              Add 100
            </button>
            <button type="button" onClick={() => onAddSamples(1000)}>
              Add 1000
            </button>
            <button type="button" className="secondary" onClick={onReset}>
              Reset
            </button>
          </div>
        </section>
      </section>

      <main className="panel-grid">
        <TwoGroupProportionPopulationPanel
          population={population}
          outcomeLabel={outcomeLabel}
          successLabel={successLabel}
          failureLabel={failureLabel}
        />
        <TwoGroupProportionSamplePanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          difference={currentDifference}
          outcomeLabel={outcomeLabel}
          successLabel={successLabel}
          failureLabel={failureLabel}
        />
        <SamplingDistributionPanel
          estimates={estimates}
          theoreticalValue={summary.theoreticalMean}
          theoreticalSE={summary.theoreticalSE}
          currentEstimate={currentDifference}
          title={teachingTitle}
          outcomeLabel={outcomeLabel}
          unitLabel=""
        />
        <TwoGroupProportionMetricsPanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          empiricalSE={summary.empiricalSE}
          theoreticalSE={summary.theoreticalSE}
        />
      </main>

      <TwoGroupProportionConfidenceIntervalSection
        sampleA={currentSampleA}
        sampleB={currentSampleB}
        difference={currentDifference}
        theoreticalDifference={summary.theoreticalMean}
        practicalCoverageCount={summary.practicalCoverageCount}
        repeatedSamples={estimates.length}
        summaryLoading={summaryLoading}
      />
    </>
  );
}

export default TwoGroupProportionWorkspace;
