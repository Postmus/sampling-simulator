import { useEffect, useState } from "react";

function SampleSizeInput({
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
    <label className="control-field compact-control">
      <span>{label}</span>
      <input
        type="range"
        min="2"
        max="200"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        className="sample-size-input"
        type="number"
        min="2"
        step="1"
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
    </label>
  );
}

interface TwoGroupSampleSizeControlsProps {
  equalSampleSizes: boolean;
  sampleSizeA: number;
  sampleSizeB: number;
  onEqualSampleSizesChange: (value: boolean) => void;
  onSampleSizeAChange: (value: number) => void;
  onSampleSizeBChange: (value: number) => void;
  sharedLabel?: string;
  groupALabel?: string;
  groupBLabel?: string;
}

export function TwoGroupSampleSizeControls({
  equalSampleSizes,
  sampleSizeA,
  sampleSizeB,
  onEqualSampleSizesChange,
  onSampleSizeAChange,
  onSampleSizeBChange,
  sharedLabel = "Shared sample size",
  groupALabel = "Group A",
  groupBLabel = "Group B",
}: TwoGroupSampleSizeControlsProps) {
  return (
    <>
      <div className="toggle-row">
        <span>Equal sample sizes</span>
        <label className="switch" aria-label="Equal sample sizes">
          <input
            type="checkbox"
            checked={equalSampleSizes}
            onChange={(event) => onEqualSampleSizesChange(event.target.checked)}
          />
          <span className="switch-track" />
        </label>
      </div>

      {equalSampleSizes ? (
        <SampleSizeInput
          label={sharedLabel}
          value={sampleSizeA}
          onChange={(nextValue) => {
            onSampleSizeAChange(nextValue);
            onSampleSizeBChange(nextValue);
          }}
        />
      ) : (
        <div className="sample-size-row">
          <SampleSizeInput label={groupALabel} value={sampleSizeA} onChange={onSampleSizeAChange} />
          <SampleSizeInput label={groupBLabel} value={sampleSizeB} onChange={onSampleSizeBChange} />
        </div>
      )}
    </>
  );
}

export default TwoGroupSampleSizeControls;
