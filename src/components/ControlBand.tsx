import { useEffect, useState } from "react";
import type { PopulationConfig, TeachingMode } from "../core/types";
import { getDecimalStep } from "../core/format";

interface ControlBandProps {
  mode: TeachingMode;
  population: PopulationConfig;
  sampleSize: number;
  repetitions: number;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  onMeanChange: (value: number) => void;
  onSDChange: (value: number) => void;
  onPChange: (value: number) => void;
  onOutcomeLabelChange: (value: string) => void;
  successLabel: string;
  failureLabel: string;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onDecimalPlacesChange: (value: number) => void;
  onSampleSizeChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

export function ControlBand({
  mode,
  population,
  sampleSize,
  repetitions,
  outcomeLabel,
  unitLabel,
  decimalPlaces,
  onMeanChange,
  onSDChange,
  onPChange,
  onOutcomeLabelChange,
  successLabel,
  failureLabel,
  onSuccessLabelChange,
  onFailureLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: ControlBandProps) {
  const [decimalPlacesInput, setDecimalPlacesInput] = useState(String(decimalPlaces));
  const meanPopulation = population.kind !== "bernoulli" ? population : null;
  const [meanInput, setMeanInput] = useState(
    meanPopulation !== null ? String(meanPopulation.params.mean) : "",
  );
  const [sdInput, setSdInput] = useState(
    meanPopulation !== null ? String(meanPopulation.params.sd) : "",
  );
  const [sampleSizeInput, setSampleSizeInput] = useState(String(sampleSize));

  useEffect(() => {
    setDecimalPlacesInput(String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    if (meanPopulation !== null) {
      setMeanInput(String(meanPopulation.params.mean));
      setSdInput(String(meanPopulation.params.sd));
    }
  }, [meanPopulation]);

  useEffect(() => {
    setSampleSizeInput(String(sampleSize));
  }, [sampleSize]);

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
              {mode === "mean" ? (
                <p>Specify the name of the outcome variable first, then add an optional unit and decimal places.</p>
              ) : (
                <p>Specify the name of the outcome variable first.</p>
              )}
            </div>
            <div className="controls-grid population-row-grid">
              <label className="control-field">
                <span>Outcome name</span>
                <input
                  type="text"
                  value={outcomeLabel}
                  placeholder={mode === "mean" ? "Blood pressure" : "Outcome"}
                  onChange={(event) => onOutcomeLabelChange(event.target.value)}
                />
              </label>

              {mode === "mean" ? (
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
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          <div className="setup-subcard">
            <div className="row-label">
              <h3>Population parameters</h3>
              {mode === "mean" ? (
                <p>Specify a normal parametric model with a single mean and SD.</p>
              ) : (
                <p>Specify a Bernoulli model with a success probability.</p>
              )}
            </div>
            {mode === "mean" && meanPopulation !== null ? (
              <div className="controls-grid population-row-grid">
                <label className="control-field">
                  <span>True mean (μ)</span>
                  <input
                    type="number"
                    value={meanInput}
                    step={getDecimalStep(decimalPlaces)}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setMeanInput(nextValue);

                      if (nextValue === "") {
                        return;
                      }

                      const parsed = Number(nextValue);
                      if (Number.isNaN(parsed)) {
                        return;
                      }

                      onMeanChange(parsed);
                    }}
                    onBlur={() => setMeanInput(String(meanPopulation.params.mean))}
                  />
                </label>

                <label className="control-field">
                  <span>Population SD (σ)</span>
                  <input
                    type="number"
                    min="0"
                    value={sdInput}
                    step={getDecimalStep(decimalPlaces)}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSdInput(nextValue);

                      if (nextValue === "") {
                        return;
                      }

                      const parsed = Number(nextValue);
                      if (Number.isNaN(parsed)) {
                        return;
                      }

                      onSDChange(parsed);
                    }}
                    onBlur={() => setSdInput(String(meanPopulation.params.sd))}
                  />
                </label>
              </div>
            ) : (
              <div className="controls-grid population-row-grid">
                <label className="control-field">
                  <span>True proportion (π)</span>
                  <div className="sample-size-row">
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.kind === "bernoulli" ? population.params.p : 0.5}
                      onChange={(event) => onPChange(Number(event.target.value))}
                    />
                    <input
                      className="sample-size-input"
                      type="number"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={population.kind === "bernoulli" ? population.params.p : 0.5}
                      onChange={(event) => onPChange(Number(event.target.value))}
                    />
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Sampling</h2>
          <p>Set the sample size and generate repeated samples from the current population.</p>
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
