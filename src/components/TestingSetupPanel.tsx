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
  const nullParameterSymbol = isMean ? (
    <>
      μ<sub>0</sub>
    </>
  ) : (
    <>
      π<sub>0</sub>
    </>
  );
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
              <strong>
                H<sub>0</sub>:
              </strong>{" "}
              {parameterSymbol} = {nullParameterSymbol} = {hypothesisValueText}
            </p>
            <p>
              <strong>
                H<sub>1</sub>:
              </strong>{" "}
              {parameterSymbol} {alternativeOperator} {nullParameterSymbol}
            </p>
          </div>
        </div>

        <div className="setup-subcard">
          <div className="formula-label">Test statistic</div>
          <div className="formula-block compact">
            <div className="formula-value">
              {isMean ? (
                <>
                  t = (x&#772; - μ<sub>0</sub>) / (s / √n)
                </>
              ) : (
                "X = number of successes"
              )}
            </div>
          </div>
          <p className="setup-subcard-text">
            {isMean
              ? "This measures how far the sample mean is from the assumed null mean, in estimated SE units."
              : "This compares the observed success count with the expected count under the null proportion for a binary outcome."}
          </p>
        </div>
      </div>
    </Panel>
  );
}
