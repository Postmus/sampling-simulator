import type { MeanPopulationKind, PopulationConfig, TeachingMode } from "../core/types";

interface ControlBandProps {
  mode: TeachingMode;
  population: PopulationConfig;
  sampleSize: number;
  repetitions: number;
  outcomeLabel: string;
  unitLabel: string;
  onPopulationKindChange: (kind: MeanPopulationKind) => void;
  onMeanChange: (value: number) => void;
  onSDChange: (value: number) => void;
  onPChange: (value: number) => void;
  onOutcomeLabelChange: (value: string) => void;
  onUnitLabelChange: (value: string) => void;
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
  onPopulationKindChange,
  onMeanChange,
  onSDChange,
  onPChange,
  onOutcomeLabelChange,
  onUnitLabelChange,
  onSampleSizeChange,
  onAddSamples,
  onReset,
}: ControlBandProps) {
  return (
    <section className="control-band">
      <section className="control-card">
        <div className="control-card-header">
          <h2>Population Model</h2>
          <p>Specify the underlying data-generating process for the population.</p>
        </div>

        <div className="controls-grid">
          <label className="control-field">
            <span>Outcome label</span>
            <input
              type="text"
              value={outcomeLabel}
              placeholder={mode === "mean" ? "Blood pressure" : "Responder"}
              onChange={(event) => onOutcomeLabelChange(event.target.value)}
            />
          </label>

          {mode === "mean" && population.kind !== "bernoulli" ? (
            <>
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
                  value={population.params.mean}
                  step="0.5"
                  onChange={(event) => onMeanChange(Number(event.target.value))}
                />
              </label>

              <label className="control-field">
                <span>Population SD</span>
                <input
                  type="number"
                  min="0.1"
                  value={population.params.sd}
                  step="0.5"
                  onChange={(event) => onSDChange(Number(event.target.value))}
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
            </>
          ) : null}

          {mode === "proportion" && population.kind === "bernoulli" ? (
            <label className="control-field">
              <span>True proportion p</span>
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
          ) : null}
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Sampling</h2>
          <p>Set the sample size and generate repeated samples from the current population.</p>
        </div>

        <div className="controls-grid sampling-grid">
          <label className="control-field">
            <span>Sample size n</span>
            <input
              type="range"
              min="2"
              max="200"
              step="1"
              value={sampleSize}
              onChange={(event) => onSampleSizeChange(Number(event.target.value))}
            />
            <strong className="slider-value">{sampleSize}</strong>
          </label>

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
