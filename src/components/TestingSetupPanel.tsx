import { Panel } from "./ChartPrimitives";
import { formatContinuousValue } from "../core/format";
import type { TestDirection, TestTruth, TestingKind } from "../core/types";

interface TestingSetupPanelProps {
  testKind: TestingKind;
  outcomeLabel: string;
  unitLabel: string;
  nullMean: number;
  alternativeMean: number;
  populationSD: number;
  decimalPlaces: number;
  sampleSize: number;
  direction: TestDirection;
  alpha: number;
  truth: TestTruth;
}

export function TestingSetupPanel({
  testKind,
  outcomeLabel,
  unitLabel,
  nullMean,
  alternativeMean,
  populationSD,
  decimalPlaces,
  sampleSize,
  direction,
  alpha,
  truth,
}: TestingSetupPanelProps) {
  const alternativeOperator =
    direction === "two-sided" ? "≠" : direction === "greater" ? ">" : "<";
  const simulatedValue = truth === "h0" ? nullMean : alternativeMean;
  const isMean = testKind === "mean";
  const displayDigits = decimalPlaces;
  const parameterSymbol = isMean ? "μ" : "π";

  return (
    <Panel
      title="Population and hypotheses"
      subtitle={`These are the model and hypothesis values used to simulate the ${isMean ? "t test" : "exact binomial test"}.`}
    >
      <div className="hypothesis-spec">
        <p>
          <strong>Outcome:</strong> {outcomeLabel.trim() || "Outcome"}
          {unitLabel.trim() ? ` (${unitLabel.trim()})` : ""}
        </p>
        <p>
          <strong>H0:</strong> {parameterSymbol} = {isMean ? formatContinuousValue(nullMean, "", displayDigits) : nullMean.toFixed(2)}
        </p>
        <p>
          <strong>H1:</strong> {parameterSymbol} {alternativeOperator} {isMean ? formatContinuousValue(alternativeMean, "", displayDigits) : alternativeMean.toFixed(2)}
        </p>
        {isMean ? (
          <p>
            <strong>Population SD:</strong> {formatContinuousValue(populationSD, "", displayDigits)}
          </p>
        ) : null}
        <p>
          <strong>Sample size:</strong> {sampleSize.toString()}
        </p>
        <p>
          <strong>Direction:</strong> {direction}
        </p>
        <p>
          <strong>Alpha:</strong> {alpha.toFixed(2)}
        </p>
        <p>
          <strong>Simulate under:</strong>{" "}
          {truth.toUpperCase()} (
          {parameterSymbol} ={" "}
          {isMean ? formatContinuousValue(simulatedValue, "", displayDigits) : simulatedValue.toFixed(2)}
          )
        </p>
      </div>
    </Panel>
  );
}
