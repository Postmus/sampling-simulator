export function formatContinuousValue(
  value: number | null,
  unitLabel: string,
  digits: number,
) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  const unit = unitLabel.trim();
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function getDecimalStep(decimalPlaces: number) {
  if (decimalPlaces <= 0) {
    return "1";
  }

  return `0.${"0".repeat(decimalPlaces - 1)}1`;
}
