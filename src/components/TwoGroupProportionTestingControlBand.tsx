import { useEffect, useState } from "react";
import { TwoGroupSampleSizeControls } from "./TwoGroupSampleSizeControls";

interface TwoGroupProportionTestingControlBandProps {
  outcomeLabel: string;
  successLabel: string;
  failureLabel: string;
  groupAPercentage: number;
  groupBPercentage: number;
  alpha: number;
  sampleSizeA: number;
  sampleSizeB: number;
  equalSampleSizes: boolean;
  repetitions: number;
  onOutcomeLabelChange: (value: string) => void;
  onSuccessLabelChange: (value: string) => void;
  onFailureLabelChange: (value: string) => void;
  onGroupAChange: (value: number) => void;
  onGroupBChange: (value: number) => void;
  onAlphaChange: (value: number) => void;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  onAddSamples: (count: number) => void;
  onReset: () => void;
}

function GroupProportionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  return (
    <label className="control-field">
      <span>{label}</span>
      <div className="sample-size-row">
        <input
          type="range"
          min="0.05"
          max="0.95"
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          className="sample-size-input"
          type="number"
          min="0.05"
          max="0.95"
          step="0.01"
          value={inputValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);

            if (nextValue === "") {
              return;
            }

            const parsed = Number(nextValue);
            if (Number.isNaN(parsed)) {
              return;
            }

            onChange(parsed);
          }}
          onBlur={() => setInputValue(String(value))}
        />
      </div>
    </label>
  );
}

export function TwoGroupProportionTestingControlBand({
  outcomeLabel,
  successLabel,
  failureLabel,
  groupAPercentage,
  groupBPercentage,
  alpha,
  sampleSizeA,
  sampleSizeB,
  equalSampleSizes,
  repetitions,
  onOutcomeLabelChange,
  onSuccessLabelChange,
  onFailureLabelChange,
  onGroupAChange,
  onGroupBChange,
  onAlphaChange,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  onAddSamples,
  onReset,
}: TwoGroupProportionTestingControlBandProps) {
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
              <p>Specify a Bernoulli parametric model with separate group proportions.</p>
            </div>
            <div className="controls-grid population-row-grid proportion-grid">
              <GroupProportionInput label="Group A proportion (πA)" value={groupAPercentage} onChange={onGroupAChange} />
              <GroupProportionInput label="Group B proportion (πB)" value={groupBPercentage} onChange={onGroupBChange} />
            </div>
          </div>
        </div>
      </section>

      <section className="control-card">
        <div className="control-card-header">
          <h2>Hypothesis setup</h2>
          <p>Choose the significance level for the chi-square test of homogeneity.</p>
        </div>

        <div className="setup-stack control-stack">
          <div className="setup-subcard">
            <div className="formula-label">Hypotheses</div>
            <div className="controls-grid testing-grid compact-grid">
              <label className="control-field">
                <span>Direction</span>
                <input type="text" value="Two-sided" readOnly />
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

export default TwoGroupProportionTestingControlBand;
