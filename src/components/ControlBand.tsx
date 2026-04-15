import { useEffect, useState } from "react";
import type { MeanPopulationKind, PopulationConfig, TeachingMode } from "../core/types";
import { getDecimalStep } from "../core/format";

interface ControlBandProps {
  mode: TeachingMode;
  population: PopulationConfig;
  sampleSize: number;
  repetitions: number;
  outcomeLabel: string;
  unitLabel: string;
  decimalPlaces: number;
  onPopulationKindChange: (kind: MeanPopulationKind) => void;
  onMeanChange: (value: number) => void;
  onSDChange: (value: number) => void;
  onPChange: (value: number) => void;
  onOutcomeLabelChange: (value: string) => void;
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
  onPopulationKindChange,
  onMeanChange,
  onSDChange,
  onPChange,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onDecimalPlacesChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: ControlBandProps) {
  const [decimalPlacesInput, setDecimalPlacesInput] = useState(String(decimalPlaces));
  const [meanInput, setMeanInput] = useState(
    population.kind !== "bernoulli" ? String(population.params.mean) : "",
  );
  const [sdInput, setSdInput] = useState(
    population.kind !== "bernoulli" ? String(population.params.sd) : "",
  );
  const [sampleSizeInput, setSampleSizeInput] = useState(String(sampleSize));

  useEffect(() => {
    setDecimalPlacesInput(String(decimalPlaces));
  }, [decimalPlaces]);

  useEffect(() => {
    if (population.kind !== "bernoulli") {
      setMeanInput(String(population.params.mean));
      setSdInput(String(population.params.sd));
    }
  }, [population]);

  useEffect(() => {
    setSampleSizeInput(String(sampleSize));
  }, [sampleSize]);

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
                  placeholder={mode === "mean" ? "Blood pressure" : "Responder"}
                  onChange={(event) => onOutcomeLabelChange(event.target.value)}
                />
              </label>

              {mode === "mean" ? (
                <label className="control-field">
                  <span>Unit of measurement</span>
                  <input
                    type="text"
                    value={unitLabel}
                    placeholder="mmHg"
                    onChange={(event) => onUnitLabelChange(event.target.value)}
                  />
                </label>
              ) : null}

              {mode === "mean" ? (
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
              ) : null}
            </div>
          </div>

          <div className="population-row">
            <div className="row-label">
              <h3>Model parameters</h3>
              <p>Set the population shape and parameters for the chosen mode.</p>
            </div>
            {mode === "mean" && population.kind !== "bernoulli" ? (
              <div className="controls-grid population-row-grid">
                <label className="control-field">
                  <span>Population shape</span>
                  <select
                    value={population.kind}
                    onChange={(event) =>
                      onPopulationKindChange(event.target.value as MeanPopulationKind)
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="uniform">Uniform</option>
                    <option value="rightSkewed">Right-skewed</option>
                  </select>
                </label>

                <label className="control-field">
                  <span>True mean</span>
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
                    onBlur={() => setMeanInput(String(population.params.mean))}
                  />
                </label>

                <label className="control-field">
                  <span>Population SD</span>
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
                    onBlur={() => setSdInput(String(population.params.sd))}
                  />
                </label>
              </div>
            ) : null}

            {mode === "proportion" && population.kind === "bernoulli" ? (
              <div className="controls-grid population-row-grid proportion-grid">
                <div className="fixed-field">
                  <span>Population shape</span>
                  <strong>Bernoulli</strong>
                </div>

                <label className="control-field">
                  <span>True proportion</span>
                  <input
                    type="range"
                    min="0.05"
                    max="0.95"
                    step="0.01"
                    value={population.params.p}
                    onChange={(event) => onPChange(Number(event.target.value))}
                  />
                  <strong className="slider-value">{population.params.p.toFixed(2)}</strong>
                </label>
              </div>
            ) : null}
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
            <strong className="slider-value">{sampleSize}</strong>
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
