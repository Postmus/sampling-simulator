import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { DiagnosticsControls } from "./DiagnosticsControls";
import { DiagnosticsStage } from "./DiagnosticsStage";
import { fitDiagnosticModel } from "./model";
import { diagnosticScenarios } from "./scenarios";

const completeVisuals = {
  fitProgress: 1,
  residualProgress: 1,
  fittedPlotProgress: 1,
  distributionProgress: 1,
  referenceProgress: 1,
};

describe("regression diagnostics visualization", () => {
  it("renders the scatterplot and both diagnostic plots together", () => {
    const scenario = diagnosticScenarios[0];
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <DiagnosticsStage
          scenario={scenario}
          modelMix={0}
          {...completeVisuals}
          equation="ŷ = 1 + 2x"
          status="Ready"
        />
      </LocaleProvider>,
    );

    expect(markup).toContain("Data and fitted equation");
    expect(markup).toContain("Residuals versus fitted values");
    expect(markup).toContain("Residual distribution");
    expect(markup).toContain('x="54" y="482">Residual distribution');
    expect(markup).toContain('x="639" y="482">Residuals versus fitted values');
    expect(markup).toContain("Count");
    expect(markup).toContain("normal reference");
    expect(markup.match(/class="diagnostics-observation-point"/g)).toHaveLength(scenario.points.length);
    expect(markup.match(/class="diagnostics-residual-token"/g)).toHaveLength(scenario.points.length * 2);
  });

  it("collects the residual distribution and adds its normal curve before populating residuals versus fitted values", () => {
    const scenario = diagnosticScenarios[0];
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <DiagnosticsStage
          scenario={scenario}
          modelMix={0}
          fitProgress={1}
          residualProgress={1}
          distributionProgress={1}
          fittedPlotProgress={0}
          referenceProgress={1}
          equation="ŷ = 1 + 2x"
          status="Distribution collected"
        />
      </LocaleProvider>,
    );

    expect(markup.match(/class="diagnostics-residual-token"/g)).toHaveLength(scenario.points.length);
    expect(markup).toContain('class="diagnostics-normal-reference"');
    expect(markup).toContain('opacity="1"');
  });

  it("renders the logarithmic predictor and independence note in the controls", () => {
    const scenario = diagnosticScenarios.find((entry) => entry.id === "log-relationship")!;
    const fit = fitDiagnosticModel(scenario.points, "log").fit;
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <DiagnosticsControls
          scenario={scenario}
          predictor="log"
          fit={fit}
          phase={5}
          maximumPhase={5}
          playing={false}
          paused={false}
          transforming={false}
          onScenarioChange={() => undefined}
          onPredictorChange={() => undefined}
          onPrevious={() => undefined}
          onNext={() => undefined}
          onPlayPause={() => undefined}
          onReplay={() => undefined}
          onReset={() => undefined}
        />
      </LocaleProvider>,
    );

    expect(markup).toContain("log₂(x)");
    expect(markup).toContain("Independence and study design");
    expect(markup).toContain("A residual plot cannot establish that observations are independent.");
    expect(markup).toContain(">Reset</button>");
    expect(markup).not.toContain("assumption satisfied");
  });

  it("renders complete Dutch diagnostic copy", () => {
    const scenario = diagnosticScenarios[3];
    const markup = renderToStaticMarkup(
      <LocaleProvider initial="nl">
        <DiagnosticsStage
          scenario={scenario}
          modelMix={0}
          {...completeVisuals}
          equation="ŷ = 1 + 2x"
          status="Klaar"
        />
      </LocaleProvider>,
    );

    expect(markup).toContain("Residuen tegen voorspelde waarden");
    expect(markup).toContain("Residuverdeling");
    expect(markup).toContain(scenario.copy.nl.xLabel);
  });
});
