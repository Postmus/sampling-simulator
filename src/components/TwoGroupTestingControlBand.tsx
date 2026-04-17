import { useEffect, useState } from "react";
import type { TestDirection } from "../core/types";
import { getDecimalStep } from "../core/format";
import { TwoGroupSampleSizeControls } from "./TwoGroupSampleSizeControls";

interface TwoGroupTestingControlBandProps {
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  groupAMean: number;
  groupBMean: number;
  populationSD: number;
  direction: TestDirection;
  alpha: number;
  sampleSizeA: number;
  sampleSizeB: number;
  repetitions: number;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onGroupAMeanChange: (value: number) => void;
  onGroupBMeanChange: (value: number) => void;
  onPopulationSDChange: (value: number) => void;
  onDirectionChange: (value: TestDirection) => void;
  onAlphaChange: (value: number) => void;
  equalSampleSizes: boolean;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

export function TwoGroupTestingControlBand({
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  groupAMean,
  groupBMean,
  populationSD,
  direction,
  alpha,
  sampleSizeA,
  sampleSizeB,
  repetitions,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onGroupAMeanChange,
  onGroupBMeanChange,
  onPopulationSDChange,
  onDirectionChange,
  onAlphaChange,
  equalSampleSizes,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: TwoGroupTestingControlBandProps) {
  const [decimalPlacesInput, setDecimalPlacesInput] = useState(String(decimalPlaces));
  const [groupAMeanInput, setGroupAMeanInput] = useState(String(groupAMean));
  const [groupBMeanInput, setGroupBMeanInput] = useState(String(groupBMean));
  const [populationSdInput, setPopulationSdInput] = useState(String(populationSD));

  useEffect(() => {
    setDecimalPlacesInput(String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    setGroupAMeanInput(String(groupAMean));
    setGroupBMeanInput(String(groupBMean));
    setPopulationSdInput(String(populationSD));
  }, [groupAMean, groupBMean, populationSD]);

  const hypothesisStep = getDecimalStep(decimalPlaces);

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
                  step={hypothesisStep}
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

                    onGroupAMeanChange(parsed);
                  }}
                  onBlur={() => setGroupAMeanInput(String(groupAMean))}
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
                  step={hypothesisStep}
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

                    onGroupBMeanChange(parsed);
                  }}
                  onBlur={() => setGroupBMeanInput(String(groupBMean))}
                />
              </label>

              <label className="control-field">
                <span>Common SD (σ)</span>
                <input
                  type="number"
                  min="0"
                  value={populationSdInput}
                  step={hypothesisStep}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPopulationSdInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    onPopulationSDChange(parsed);
                  }}
                  onBlur={() => setPopulationSdInput(String(populationSD))}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Hypothesis setup</h2>
          <p>Choose the direction and significance level for the independent samples t-test.</p>
        </div>

        <div className="setup-stack control-stack">
          <div className="setup-subcard">
            <div className="formula-label">Hypotheses</div>
            <div className="controls-grid testing-grid compact-grid">
              <label className="control-field">
                <span>Direction</span>
                <select value={direction} onChange={(event) => onDirectionChange(event.target.value as TestDirection)}>
                  <option value="two-sided">Two-sided</option>
                  <option value="greater">Greater than</option>
                  <option value="less">Less than</option>
                </select>
              </label>

              <label className="control-field">
                <span>Significance level α</span>
                <select value={alpha.toFixed(2)} onChange={(event) => onAlphaChange(Number(event.target.value))}>
                  <option value="0.10">0.10</option>
                  <option value="0.05">0.05</option>
                  <option value="0.01">0.01</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Sampling</h2>
          <p>Choose the sample sizes and run repeated samples.</p>
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
  );
}
