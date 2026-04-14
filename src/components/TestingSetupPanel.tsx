import { Panel } from "./ChartPrimitives";
import type { TestDirection, TestTruth, TestingKind } from "../core/types";

interface TestingSetupPanelProps {
  testKind: TestingKind;
  outcomeLabel: string;
  unitLabel: string;
  nullMean: number;
  alternativeMean: number;
  populationSD: number;
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
  sampleSize,
  direction,
  alpha,
  truth,
}: TestingSetupPanelProps) {
  const alternativeOperator =
    direction === "two-sided" ? "≠" : direction === "greater" ? ">" : "<";
  const simulatedValue = truth === "h0" ? nullMean : alternativeMean;
  const isMean = testKind === "mean";

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
          <strong>H0:</strong> {isMean ? "μ" : "p"} = {nullMean.toFixed(2)}
        </p>
        <p>
          <strong>H1:</strong> {isMean ? "μ" : "p"} {alternativeOperator} {nullMean.toFixed(2)}
        </p>
        {isMean ? (
          <p>
            <strong>Population SD:</strong> {populationSD.toFixed(2)}
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
          {truth.toUpperCase()} ({isMean ? "μ" : "p"} = {simulatedValue.toFixed(2)})
        </p>
      </div>
    </Panel>
  );
}
