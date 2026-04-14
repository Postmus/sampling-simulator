import type { TestDirection, TestTruth, TestingKind } from "../core/types";

interface TestingControlBandProps {
  testKind: TestingKind;
  outcomeLabel: string;
  unitLabel: string;
  nullMean: number;
  alternativeMean: number;
  populationSD: number;
  direction: TestDirection;
  alpha: number;
  truth: TestTruth;
  sampleSize: number;
  repetitions: number;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
  onNullMeanChange: (value: number) => void;
  onAlternativeMeanChange: (value: number) => void;
  onPopulationSDChange: (value: number) => void;
  onDirectionChange: (value: TestDirection) => void;
  onAlphaChange: (value: number) => void;
  onTruthChange: (value: TestTruth) => void;
  onSampleSizeChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

export function TestingControlBand({
  testKind,
  outcomeLabel,
  unitLabel,
  nullMean,
  alternativeMean,
  populationSD,
  direction,
  alpha,
  truth,
  sampleSize,
  repetitions,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onNullMeanChange,
  onAlternativeMeanChange,
  onPopulationSDChange,
  onDirectionChange,
  onAlphaChange,
  onTruthChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: TestingControlBandProps) {
  const isMean = testKind === "mean";
  const nullLabel = isMean ? "H0 mean" : "H0 proportion";
  const alternativeLabel = isMean ? "H1 mean" : "H1 proportion";
  const hypothesisStep = isMean ? "0.5" : "0.01";
  return (
    <section className="control-band">
      <section className="control-card">
        <div className="control-card-header">
          <h2>Outcome</h2>
          <p>Name the outcome and, for means, add an optional unit of measurement. Use the left sidebar to switch between mean and proportion.</p>
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
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Hypothesis setup</h2>
          <p>
            Set the null and alternative {isMean ? "means" : "proportions"}, then choose the test direction and significance level.
          </p>
        </div>

        <div className="controls-grid testing-grid">
          <label className="control-field">
            <span>{nullLabel}</span>
            <input
              type="number"
              step={hypothesisStep}
              value={nullMean}
              onChange={(event) => onNullMeanChange(Number(event.target.value))}
            />
          </label>

          <label className="control-field">
            <span>{alternativeLabel}</span>
            <input
              type="number"
              step={hypothesisStep}
              value={alternativeMean}
              onChange={(event) => onAlternativeMeanChange(Number(event.target.value))}
            />
          </label>

          {isMean ? (
            <label className="control-field">
              <span>Population SD</span>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={populationSD}
                onChange={(event) => onPopulationSDChange(Number(event.target.value))}
              />
            </label>
          ) : null}

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
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Sampling</h2>
          <p>Choose the sample size and run repeated tests under either H0 or H1.</p>
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
                value={sampleSize}
                onChange={(event) => {
                  const nextValue = event.target.valueAsNumber;
                  if (Number.isNaN(nextValue)) {
                    return;
                  }
                  onSampleSizeChange(nextValue);
                }}
              />
            </div>
            <strong className="slider-value">{sampleSize}</strong>
          </div>

          <div className="run-summary">
            <span>Repeated tests</span>
            <strong>{repetitions}</strong>
          </div>
        </div>

        <div className="truth-toggle">
          <span>Simulate under</span>
          <div className="sidebar-segment">
            <button
              type="button"
              className={`segment-pill ${truth === "h0" ? "active" : ""}`}
              onClick={() => onTruthChange("h0")}
            >
              H0
            </button>
            <button
              type="button"
              className={`segment-pill ${truth === "h1" ? "active" : ""}`}
              onClick={() => onTruthChange("h1")}
            >
              H1
            </button>
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
