import { useEffect, useMemo, useState } from "react";
import * as Plot from "@observablehq/plot";
import { Panel, ValueCard } from "./ChartPrimitives";
import { ObservablePlotFigure } from "./ObservablePlotFigure";
import { formatContinuousValue, getDecimalStep } from "../core/format";
import { pooledMeanDifferenceSE, pooledStandardDeviation, practicalMeanDifferenceInterval } from "../core/inference";
import { populationCurve, getMeanPopulationRange } from "../core/populations";
import {
  theoreticalMeanDifference,
} from "../core/theory";
import type {
  TwoGroupMeanPopulationConfig,
  TwoGroupSimulationSummary,
} from "../core/types";
import { SamplingDistributionPanel } from "./SamplingDistributionPanel";
import { TwoGroupSampleSizeControls } from "./TwoGroupSampleSizeControls";

function buildNormalPopulation(mean: number, sd: number) {
  return {
    kind: "normal" as const,
    params: {
      mean,
      sd,
    },
  };
}

interface TwoGroupEstimationWorkspaceProps {
  population: TwoGroupMeanPopulationConfig;
  sampleSizeA: number;
  sampleSizeB: number;
  repetitions: number;
  estimates: number[];
  currentSampleA: number[];
  currentSampleB: number[];
  currentDifference: number | null;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  equalSampleSizes: boolean;
  summary: TwoGroupSimulationSummary;
  summaryLoading: boolean;
  teachingTitle: string;
  onMeanAChange: (value: number) => void;
  onMeanBChange: (value: number) => void;
  onSDChange: (value: number) => void;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

function populationRows(
  population: TwoGroupMeanPopulationConfig,
  decimalPlaces: number,
  unitLabel: string,
) {
  return [
    {
      key: "group-a-mean",
      label: (
        <>
          Group A mean (<span>μ</span>
          <sub>A</sub>)
        </>
      ),
      value: formatContinuousValue(population.groupA.mean, unitLabel, decimalPlaces),
    },
    {
      key: "group-b-mean",
      label: (
        <>
          Group B mean (<span>μ</span>
          <sub>B</sub>)
        </>
      ),
      value: formatContinuousValue(population.groupB.mean, unitLabel, decimalPlaces),
    },
    {
      key: "common-sd",
      label: (
        <>
          Common SD (<span>σ</span>)
        </>
      ),
      value: formatContinuousValue(population.sd, unitLabel, decimalPlaces),
    },
    {
      key: "true-mean-difference",
      label: "True mean difference",
      value: formatContinuousValue(
        theoreticalMeanDifference(population),
        unitLabel,
        decimalPlaces + 2,
      ),
    },
  ];
}

function TwoGroupPopulationPanel({
  population,
  outcomeLabel,
  decimalPlaces,
  unitLabel,
}: {
  population: TwoGroupMeanPopulationConfig;
  outcomeLabel: string;
  decimalPlaces: number;
  unitLabel: string;
}) {
  const rows = useMemo(
    () => populationRows(population, decimalPlaces, unitLabel),
    [decimalPlaces, population, unitLabel],
  );

  const domain = useMemo(() => {
    const rangeA = getMeanPopulationRange("normal", population.groupA.mean, population.sd);
    const rangeB = getMeanPopulationRange("normal", population.groupB.mean, population.sd);

    return {
      min: Math.min(rangeA.min, rangeB.min),
      max: Math.max(rangeA.max, rangeB.max),
    };
  }, [population]);

  const groupAOptions = useMemo<Plot.PlotOptions>(() => {
    const curve = populationCurve(buildNormalPopulation(population.groupA.mean, population.sd));

    return {
      width: 560,
      height: 170,
      marginTop: 16,
      marginRight: 18,
      marginBottom: 36,
      marginLeft: 76,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: outcomeLabel.trim()
          ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
          : "Outcome",
        domain: [domain.min, domain.max],
      },
      y: {
        label: "Density",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.ruleX([population.groupA.mean], {
          stroke: "#0d5c8d",
          strokeWidth: 2,
          strokeOpacity: 0.8,
        }),
        Plot.line(curve, {
          x: "x",
          y: "y",
          stroke: "#0d5c8d",
          strokeWidth: 3,
        }),
      ],
    };
  }, [domain.max, domain.min, outcomeLabel, population.groupA.mean, population.sd, unitLabel]);

  const groupBOptions = useMemo<Plot.PlotOptions>(() => {
    const curve = populationCurve(buildNormalPopulation(population.groupB.mean, population.sd));

    return {
      width: 560,
      height: 170,
      marginTop: 16,
      marginRight: 18,
      marginBottom: 36,
      marginLeft: 76,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: outcomeLabel.trim()
          ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
          : "Outcome",
        domain: [domain.min, domain.max],
      },
      y: {
        label: "Density",
        grid: true,
      },
      marks: [
        Plot.ruleY([0], { stroke: "rgba(19, 33, 45, 0.35)" }),
        Plot.ruleX([population.groupB.mean], {
          stroke: "#dc8e2c",
          strokeWidth: 2,
          strokeOpacity: 0.8,
        }),
        Plot.line(curve, {
          x: "x",
          y: "y",
          stroke: "#dc8e2c",
          strokeWidth: 3,
        }),
      ],
    };
  }, [domain.max, domain.min, outcomeLabel, population.groupB.mean, population.sd, unitLabel]);

  return (
    <Panel
      title="Population"
      subtitle="Both groups are modeled as normal populations with the same SD, shown separately for easier comparison."
    >
      <div className="two-group-population-stack">
        <div className="two-group-population-card">
          <div className="two-group-population-label">Group A</div>
          <ObservablePlotFigure options={groupAOptions} />
        </div>
        <div className="two-group-population-card">
          <div className="two-group-population-label">Group B</div>
          <ObservablePlotFigure options={groupBOptions} />
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

function TwoGroupSamplePanel({
  sampleA,
  sampleB,
  difference,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
}) {
  const displayDigits = decimalPlaces + 2;
  const sampleAmean = sampleA.length > 0 ? sampleA.reduce((sum, value) => sum + value, 0) / sampleA.length : null;
  const sampleBmean = sampleB.length > 0 ? sampleB.reduce((sum, value) => sum + value, 0) / sampleB.length : null;
  const pooledSD = useMemo(() => pooledStandardDeviation(sampleA, sampleB), [sampleA, sampleB]);
  const estimatedSE = useMemo(() => pooledMeanDifferenceSE(sampleA, sampleB), [sampleA, sampleB]);
  const boxplotOptions = useMemo<Plot.PlotOptions | null>(() => {
    if (sampleA.length === 0 && sampleB.length === 0) {
      return null;
    }

    const data = [
      ...sampleA.map((value) => ({ group: "Group A", value })),
      ...sampleB.map((value) => ({ group: "Group B", value })),
    ];

    return {
      width: 560,
      height: 280,
      marginTop: 8,
      marginRight: 24,
      marginBottom: 28,
      marginLeft: 84,
      style: {
        background: "transparent",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      },
      x: {
        label: "Group",
        domain: ["Group A", "Group B"],
      },
      y: {
        label: outcomeLabel.trim()
          ? `${outcomeLabel}${unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}`
          : "Outcome",
        grid: true,
        nice: true,
        zero: false,
      },
      marks: [
        Plot.boxY(data, {
          x: "group",
          y: "value",
          fill: "#dc8e2c",
          fillOpacity: 0.26,
          stroke: "#9a5a17",
          strokeWidth: 2,
        }),
      ],
    };
  }, [outcomeLabel, sampleA, sampleB, unitLabel]);

  return (
    <Panel
      title="Latest Sample"
      subtitle="This is the most recently generated pair of samples. The difference in means is highlighted below."
      className="sample-panel"
    >
      <div className="two-group-sample-stack">
        {boxplotOptions !== null ? (
          <ObservablePlotFigure options={boxplotOptions} />
        ) : (
          <div className="sample-boxplot-empty">Add samples to display the latest boxplots.</div>
        )}

        <table className="sample-summary-table">
          <thead>
            <tr>
              <th scope="col">Statistic</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                Sample size Group A (<span>n</span>
                <sub>A</sub>)
              </th>
              <td>{sampleA.length.toString()}</td>
            </tr>
            <tr>
              <th scope="row">
                Sample size Group B (<span>n</span>
                <sub>B</sub>)
              </th>
              <td>{sampleB.length.toString()}</td>
            </tr>
            <tr>
              <th scope="row">
                Group A mean (<span>x̄</span>
                <sub>A</sub>)
              </th>
              <td>{formatContinuousValue(sampleAmean, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">
                Group B mean (<span>x̄</span>
                <sub>B</sub>)
              </th>
              <td>{formatContinuousValue(sampleBmean, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Mean difference</th>
              <td>{formatContinuousValue(difference, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">
                Pooled SD (<span>s</span>
                <sub>p</sub>)
              </th>
              <td>{formatContinuousValue(pooledSD, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Estimated SE</th>
              <td>{formatContinuousValue(estimatedSE, unitLabel, displayDigits)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function TwoGroupMetricsPanel({
  sampleA,
  sampleB,
  empiricalSE,
  theoreticalSE,
  unitLabel,
  decimalPlaces,
}: {
  sampleA: number[];
  sampleB: number[];
  empiricalSE: number | null;
  theoreticalSE: number | null;
  unitLabel: string;
  decimalPlaces: number;
}) {
  const displayDigits = decimalPlaces + 2;
  const estimatedSE = useMemo(() => pooledMeanDifferenceSE(sampleA, sampleB), [sampleA, sampleB]);

  return (
    <Panel
      title="Standard Error"
      subtitle="How much the mean difference varies from sample to sample."
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
              <td>{formatContinuousValue(theoreticalSE, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Empirical</th>
              <td>{formatContinuousValue(empiricalSE, unitLabel, displayDigits)}</td>
            </tr>
            <tr>
              <th scope="row">Estimated</th>
              <td>{formatContinuousValue(estimatedSE, unitLabel, displayDigits)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="metrics-formulas">
        <div className="formula-block">
          <div className="formula-label">Theoretical SE</div>
          <div className="formula-value">
            <span>σ × √(1 / n</span>
            <sub>A</sub>
            <span> + 1 / n</span>
            <sub>B</sub>
            <span>)</span>
          </div>
        </div>
        <div className="formula-block">
          <div className="formula-label">Estimated SE</div>
          <div className="formula-value">
            <span>s</span>
            <sub>p</sub>
            <span> × √(1 / n</span>
            <sub>A</sub>
            <span> + 1 / n</span>
            <sub>B</sub>
            <span>)</span>
          </div>
        </div>
      </div>
      <p className="metrics-note">
        The theoretical SE uses the shared population SD. The empirical SE comes from the repeated-sampling simulation. The estimated SE uses the pooled sample SD from the latest sample pair.
      </p>
    </Panel>
  );
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function DifferenceIntervalRuler({
  estimate,
  trueValue,
  interval,
  unitLabel,
  digits,
}: {
  estimate: number | null;
  trueValue: number | null;
  interval: NonNullable<ReturnType<typeof practicalMeanDifferenceInterval>>;
  unitLabel: string;
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
          True difference
        </text>
      </svg>
    </div>
  );
}

function TwoGroupConfidenceIntervalSection({
  sampleA,
  sampleB,
  difference,
  theoreticalMean,
  unitLabel,
  practicalCoverageCount,
  repeatedSamples,
  decimalPlaces,
  isLoading = false,
}: {
  sampleA: number[];
  sampleB: number[];
  difference: number | null;
  theoreticalMean: number | null;
  unitLabel: string;
  practicalCoverageCount: number;
  repeatedSamples: number;
  decimalPlaces: number;
  isLoading?: boolean;
}) {
  const displayDigits = decimalPlaces + 2;
  const practicalInterval = useMemo(
    () => practicalMeanDifferenceInterval(sampleA, sampleB),
    [sampleA, sampleB],
  );
  const practicalCoverage = repeatedSamples > 0 ? practicalCoverageCount / repeatedSamples : null;
  const trueInInterval =
    practicalInterval !== null &&
    theoreticalMean !== null &&
    practicalInterval.lower <= theoreticalMean &&
    theoreticalMean <= practicalInterval.upper;

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
                The meter shows how often the pooled 95% confidence interval has contained the true mean difference so far.
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Latest 95% confidence interval"
          subtitle="The latest pooled 95% confidence interval, shown against the true mean difference."
        >
          {isLoading ? (
            <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Calculating latest interval...</p>
            </div>
          ) : (
            <>
              {practicalInterval !== null ? (
                <DifferenceIntervalRuler
                  estimate={difference}
                  trueValue={theoreticalMean}
                  interval={practicalInterval}
                  unitLabel={unitLabel}
                  digits={displayDigits}
                />
              ) : (
                <p className="placeholder">Add a sample to display the latest confidence interval.</p>
              )}

              {practicalInterval !== null ? (
                <p className="caption ci-summary">
                  Latest estimate: {formatContinuousValue(difference, unitLabel, displayDigits)} with 95% CI{" "}
                  {formatContinuousValue(practicalInterval.lower, unitLabel, displayDigits)} to{" "}
                  {formatContinuousValue(practicalInterval.upper, unitLabel, displayDigits)}.
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

function TwoGroupControlBand({
  population,
  sampleSizeA,
  sampleSizeB,
  equalSampleSizes,
  repetitions,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  onMeanAChange,
  onMeanBChange,
  onSDChange,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: Omit<
  TwoGroupEstimationWorkspaceProps,
  | "estimates"
  | "currentSampleA"
  | "currentSampleB"
  | "currentDifference"
  | "summary"
  | "summaryLoading"
  | "teachingTitle"
>) {
  const [decimalPlacesInput, setDecimalPlacesInput] = useState(String(decimalPlaces));
  const [groupAMeanInput, setGroupAMeanInput] = useState(String(population.groupA.mean));
  const [groupBMeanInput, setGroupBMeanInput] = useState(String(population.groupB.mean));
  const [sharedSDInput, setSharedSDInput] = useState(String(population.sd));

  useEffect(() => {
    setDecimalPlacesInput(String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    setGroupAMeanInput(String(population.groupA.mean));
    setGroupBMeanInput(String(population.groupB.mean));
    setSharedSDInput(String(population.sd));
  }, [population]);

  return (
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
              <p>Specify the name of the outcome variable first, then add an optional unit and decimal places.</p>
            </div>
            <div className="controls-grid population-row-grid">
              <label className="control-field">
                <span>Outcome name</span>
                <input
                  type="text"
                  value={outcomeLabel}
                  placeholder="Blood pressure"
                  onChange={(event) => onOutcomeLabelChange(event.target.value)}
                />
              </label>

              <label className="control-field">
                <span>Unit of measurement</span>
                <input
                  type="text"
                  value={unitLabel}
                  placeholder="mmHg"
                  onChange={(event) => onUnitLabelChange(event.target.value)}
                />
              </label>

              <label className="control-field">
                <span>Decimal places</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={decimalPlacesInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDecimalPlacesInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }
                    onDecimalPlacesChange(Math.max(0, Math.round(parsed)));
                  }}
                  onBlur={() => setDecimalPlacesInput(String(decimalPlaces))}
                />
              </label>
            </div>
          </div>

          <div className="population-row">
            <div className="row-label">
              <h3>Population parameters</h3>
              <p>Specify a normal parametric model with separate group means and a shared SD.</p>
            </div>
            <div className="controls-grid population-row-grid">
              <label className="control-field">
                <span>
                  Group A mean (<span>μ</span>
                  <sub>A</sub>)
                </span>
                <input
                  type="number"
                  value={groupAMeanInput}
                  step={getDecimalStep(decimalPlaces)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setGroupAMeanInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    onMeanAChange(parsed);
                  }}
                  onBlur={() => setGroupAMeanInput(String(population.groupA.mean))}
                />
              </label>

              <label className="control-field">
                <span>
                  Group B mean (<span>μ</span>
                  <sub>B</sub>)
                </span>
                <input
                  type="number"
                  value={groupBMeanInput}
                  step={getDecimalStep(decimalPlaces)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setGroupBMeanInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    onMeanBChange(parsed);
                  }}
                  onBlur={() => setGroupBMeanInput(String(population.groupB.mean))}
                />
              </label>

              <label className="control-field">
                <span>Common SD (σ)</span>
                <input
                  type="number"
                  min="0"
                  value={sharedSDInput}
                  step={getDecimalStep(decimalPlaces)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSharedSDInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    onSDChange(parsed);
                  }}
                  onBlur={() => setSharedSDInput(String(population.sd))}
                />
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

        <div className="action-row">
          <button type="button" onClick={() => onAddSamples(1)}>Add 1</button>
          <button type="button" onClick={() => onAddSamples(10)}>Add 10</button>
          <button type="button" onClick={() => onAddSamples(100)}>Add 100</button>
          <button type="button" onClick={() => onAddSamples(1000)}>Add 1000</button>
          <button type="button" className="secondary" onClick={onReset}>
            Reset
          </button>
        </div>
      </section>
    </section>
  );
}

export function TwoGroupEstimationWorkspace({
  population,
  sampleSizeA,
  sampleSizeB,
  repetitions,
  estimates,
  currentSampleA,
  currentSampleB,
  currentDifference,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  equalSampleSizes,
  summary,
  summaryLoading,
  teachingTitle,
  onMeanAChange,
  onMeanBChange,
  onSDChange,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: TwoGroupEstimationWorkspaceProps) {
  return (
    <>
      <TwoGroupControlBand
        population={population}
        sampleSizeA={sampleSizeA}
        sampleSizeB={sampleSizeB}
        equalSampleSizes={equalSampleSizes}
        repetitions={repetitions}
        outcomeLabel={outcomeLabel}
        unitLabel={unitLabel}
        decimalPlaces={decimalPlaces}
        onMeanAChange={onMeanAChange}
        onMeanBChange={onMeanBChange}
        onSDChange={onSDChange}
        onOutcomeLabelChange={onOutcomeLabelChange}
        onUnitLabelChange={onUnitLabelChange}
        onDecimalPlacesChange={onDecimalPlacesChange}
        onEqualSampleSizesChange={onEqualSampleSizesChange}
        onSampleSizeAChange={onSampleSizeAChange}
        onSampleSizeBChange={onSampleSizeBChange}
        onAddSamples={onAddSamples}
        onReset={onReset}
      />

      <main className="panel-grid">
        <TwoGroupPopulationPanel
          population={population}
          outcomeLabel={outcomeLabel}
          decimalPlaces={decimalPlaces}
          unitLabel={unitLabel}
        />
        <TwoGroupSamplePanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          difference={currentDifference}
          outcomeLabel={outcomeLabel}
          unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
        />
        <SamplingDistributionPanel
          estimates={estimates}
          theoreticalValue={summary.theoreticalMean}
          theoreticalSE={summary.theoreticalSE}
          currentEstimate={currentDifference}
          title={teachingTitle}
          outcomeLabel={outcomeLabel}
          unitLabel={unitLabel}
        />
        <TwoGroupMetricsPanel
          sampleA={currentSampleA}
          sampleB={currentSampleB}
          empiricalSE={summary.empiricalSE}
          theoreticalSE={summary.theoreticalSE}
          unitLabel={unitLabel}
          decimalPlaces={decimalPlaces}
        />
      </main>

      <TwoGroupConfidenceIntervalSection
        sampleA={currentSampleA}
        sampleB={currentSampleB}
        difference={currentDifference}
        theoreticalMean={summary.theoreticalMean}
        unitLabel={unitLabel}
        practicalCoverageCount={summary.practicalCoverageCount}
        repeatedSamples={estimates.length}
        decimalPlaces={decimalPlaces}
        isLoading={summaryLoading}
      />
    </>
  );
}

export default TwoGroupEstimationWorkspace;
