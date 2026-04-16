import { Panel } from "./ChartPrimitives";
import { formatContinuousValue } from "../core/format";
import type { TestDirection, TestingKind } from "../core/types";

interface TestingSetupPanelProps {
  testKind: TestingKind;
  nullMean: number;
  decimalPlaces: number;
  direction: TestDirection;
}

export function TestingSetupPanel({
  testKind,
  nullMean,
  decimalPlaces,
  direction,
}: TestingSetupPanelProps) {
  const isMean = testKind === "mean";
  const displayDigits = decimalPlaces;
  const parameterSymbol = isMean ? "μ" : "π";
  const hypothesisValueText = isMean
    ? formatContinuousValue(nullMean, "", displayDigits)
    : nullMean.toFixed(2);
  const alternativeOperator =
    direction === "two-sided" ? "≠" : direction === "greater" ? ">" : "<";

  return (
    <Panel title="Hypotheses and test statistic" subtitle="">
      <div className="setup-stack">
        <div className="setup-subcard">
          <div className="formula-label">Hypotheses</div>
          <div className="hypothesis-spec compact">
            <p>
              <strong>H0:</strong> {parameterSymbol} = {hypothesisValueText}
            </p>
            <p>
              <strong>H1:</strong> {parameterSymbol} {alternativeOperator} {hypothesisValueText}
            </p>
          </div>
        </div>

        <div className="setup-subcard">
          <div className="formula-label">Test statistic</div>
          <div className="formula-block compact">
            <div className="formula-value">
              {isMean ? "t = (x̄ - μ0) / (s / √n)" : "X = number of successes"}
            </div>
          </div>
          <p className="setup-subcard-text">
            {isMean
              ? "This measures how far the sample mean is from the assumed null mean, in estimated SE units."
              : "This compares the observed success count with the expected count under the null proportion."}
          </p>
        </div>
      </div>
    </Panel>
  );
}
