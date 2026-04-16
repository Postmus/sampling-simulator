import { useEffect, useState } from "react";
import type { TestDirection, TestingKind } from "../core/types";
import { getDecimalStep } from "../core/format";

interface TestingControlBandProps {
  testKind: TestingKind;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  nullMean: number;
  alternativeMean: number;
  populationSD: number;
  direction: TestDirection;
  alpha: number;
  sampleSize: number;
  repetitions: number;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onNullMeanChange: (value: number) => void;
  onAlternativeMeanChange: (value: number) => void;
  onPopulationSDChange: (value: number) => void;
  onDirectionChange: (value: TestDirection) => void;
  onAlphaChange: (value: number) => void;
  onSampleSizeChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

export function TestingControlBand({
  testKind,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  nullMean,
  alternativeMean,
  populationSD,
  direction,
  alpha,
  sampleSize,
  repetitions,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onNullMeanChange,
  onAlternativeMeanChange,
  onPopulationSDChange,
  onDirectionChange,
  onAlphaChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: TestingControlBandProps) {
  const [decimalPlacesInput, setDecimalPlacesInput] = useState(String(decimalPlaces));
  const [nullMeanInput, setNullMeanInput] = useState(String(nullMean));
  const [alternativeMeanInput, setAlternativeMeanInput] = useState(String(alternativeMean));
  const [populationSdInput, setPopulationSdInput] = useState(String(populationSD));
  const [sampleSizeInput, setSampleSizeInput] = useState(String(sampleSize));

  useEffect(() => {
    setDecimalPlacesInput(String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    setNullMeanInput(String(nullMean));
  }, [nullMean]);

  useEffect(() => {
    setAlternativeMeanInput(String(alternativeMean));
  }, [alternativeMean]);

  useEffect(() => {
    setPopulationSdInput(String(populationSD));
  }, [populationSD]);

  useEffect(() => {
    setSampleSizeInput(String(sampleSize));
  }, [sampleSize]);

  const isMean = testKind === "mean";
  const nullLabel = isMean ? "H0 mean" : "H0 proportion (π)";
  const hypothesisStep = isMean ? getDecimalStep(decimalPlaces) : "0.01";
  return (
    <section className="control-band">
      <section className="control-card">
        <div className="control-card-header">
          <h2>Population Model</h2>
          <p>Specify the underlying data-generating process for the population.</p>
        </div>

        <div className="population-rows">
          <div className="population-row">
            <div className="row-label">
              <h3>Outcome</h3>
              <p>Name the variable first, then add an optional unit of measurement and decimal places if you are working with a mean.</p>
            </div>
            <div className="controls-grid population-row-grid">
              <label className="control-field">
                <span>Outcome label</span>
                <input
                  type="text"
                  value={outcomeLabel}
                  placeholder="Blood pressure"
                  onChange={(event) => onOutcomeLabelChange(event.target.value)}
                />
              </label>

              {isMean ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>

          <div className="setup-subcard">
            <div className="row-label">
              <h3>Population parameters</h3>
              <p>Set the population shape and parameters for the testing simulation.</p>
            </div>
            <div className={`controls-grid population-row-grid ${isMean ? "" : "proportion-grid"}`}>
              <div className="fixed-field">
                <span>Population shape</span>
                <strong>{isMean ? "Normal" : "Bernoulli"}</strong>
              </div>

              <label className="control-field">
                <span>{isMean ? "True mean" : "True proportion (π)"}</span>
                {isMean ? (
                  <input
                    type="number"
                    step={hypothesisStep}
                    value={alternativeMeanInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setAlternativeMeanInput(nextValue);

                      if (nextValue === "") {
                        return;
                      }

                      const parsed = Number(nextValue);
                      if (Number.isNaN(parsed)) {
                        return;
                      }

                      onAlternativeMeanChange(parsed);
                    }}
                    onBlur={() => setAlternativeMeanInput(String(alternativeMean))}
                  />
                ) : (
                  <>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={alternativeMean}
                      onChange={(event) => onAlternativeMeanChange(Number(event.target.value))}
                    />
                    <strong className="slider-value">{alternativeMean.toFixed(2)}</strong>
                  </>
                )}
              </label>

              {isMean ? (
                <label className="control-field">
                  <span>Population SD</span>
                  <input
                    type="number"
                    min="0"
                    step={getDecimalStep(decimalPlaces)}
                    value={populationSdInput}
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
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Hypothesis setup</h2>
          <p>Set the null hypothesis, then choose the test direction and significance level.</p>
        </div>

        <div className="setup-stack control-stack">
          <div className="setup-subcard">
            <div className="formula-label">Hypotheses</div>
            <div className="controls-grid testing-grid compact-grid">
              <label className="control-field">
                <span>{nullLabel}</span>
                <input
                  type="number"
                  step={hypothesisStep}
                  value={nullMeanInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setNullMeanInput(nextValue);

                    if (nextValue === "") {
                      return;
                    }

                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    onNullMeanChange(parsed);
                  }}
                  onBlur={() => setNullMeanInput(String(nullMean))}
                />
              </label>

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
          <p>Choose the sample size and run repeated tests.</p>
        </div>

        <div className="controls-grid sampling-grid">
          <div className="control-field sample-size-field">
            <span>Sample size n</span>
            <div className="sample-size-row">
              <input
                type="range"
                min="2"
                max="200"
                step="1"
                value={sampleSize}
                onChange={(event) => onSampleSizeChange(Number(event.target.value))}
              />
              <input
                className="sample-size-input"
                type="number"
                min="2"
                step="1"
                value={sampleSizeInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSampleSizeInput(nextValue);

                  if (nextValue === "") {
                    return;
                  }

                  const parsed = Number(nextValue);
                  if (Number.isNaN(parsed)) {
                    return;
                  }

                  onSampleSizeChange(parsed);
                }}
                onBlur={() => setSampleSizeInput(String(sampleSize))}
              />
            </div>
            <strong className="slider-value">{sampleSize}</strong>
          </div>

          <div className="run-summary">
            <span>Repeated tests</span>
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
