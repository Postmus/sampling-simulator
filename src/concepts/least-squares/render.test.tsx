import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fitLeastSquares } from "./model";
import { RegressionControls } from "./RegressionControls";
import { RegressionStage } from "./RegressionStage";
import { regressionScenarios } from "./scenarios";
import { LocaleProvider } from "../../i18n/LocaleContext";

describe("least-squares visualization", () => {
  it("renders every teaching scenario with an error landscape", () => {
    regressionScenarios.forEach((scenario) => {
      const fit = fitLeastSquares(scenario.points);
      const markup = renderToStaticMarkup(
        <LocaleProvider><RegressionStage
          scenario={scenario}
          line={{ slope: scenario.initialSlope, intercept: scenario.initialIntercept }}
          fit={fit}
          hasRevealedFit={false}
          squareRevealProgress={0}
          sseCollectionProgress={0}
          residualCollectionProgress={0}
          sseCollected={false}
          status="Ready"
        /></LocaleProvider>,
      );

      expect(markup).toContain("Interactive least-squares regression");
      expect(markup).toContain("Squared-error landscape");
      expect(markup).toContain(scenario.copy.en.xLabel);
      expect(markup).toContain(scenario.copy.en.yLabel);
      expect(markup).toContain("outcome-mean-line");
      expect(markup.match(/class="observation-point"/g)).toHaveLength(scenario.points.length);
      expect(markup).not.toContain('class="residual-square"');
    });
  });

  it("renders the fitted solution and complete control set", () => {
    const scenario = regressionScenarios[0];
    const fit = fitLeastSquares(scenario.points);
    const stage = renderToStaticMarkup(
      <LocaleProvider><RegressionStage
        scenario={scenario}
        line={fit}
        fit={fit}
        hasRevealedFit
        squareRevealProgress={1}
        sseCollectionProgress={1}
        residualCollectionProgress={1}
        sseCollected
        status="Minimum found"
      /></LocaleProvider>,
    );
    const controls = renderToStaticMarkup(
      <LocaleProvider><RegressionControls
        scenario={scenario}
        line={fit}
        fit={fit}
        candidateSse={fit.sse}
        fitting={false}
        collectingSse={false}
        collectingResiduals={false}
        sseCollected
        residualsCollected
        hasRevealedFit
        onScenarioChange={() => undefined}
        onSlopeChange={() => undefined}
        onInterceptChange={() => undefined}
        onEvaluate={() => undefined}
        onFit={() => undefined}
        onReset={() => undefined}
      /></LocaleProvider>,
    );

    expect(stage).toContain("candidate-line-at-fit");
    expect(stage).toContain("minimum");
    expect(stage.match(/class="moving-squared-error"/g)).toHaveLength(scenario.points.length);
    expect(stage.match(/class="moving-residual-token"/g)).toHaveLength(scenario.points.length);
    expect(stage).toContain("SSE = Σeᵢ²");
    expect(stage).not.toContain("Negative means below the line; positive means above the line.");
    expect(stage).not.toContain("mean residual");
    expect(stage).not.toContain("line passes through");
    expect(controls).toContain("Best fit found");
    expect(controls).not.toContain("Add squared errors");
    expect(controls).not.toContain("Collect current residuals");
    expect(controls).toContain("Line evaluated");
    expect(controls).toContain("Minimum SSE");
  });

  it("renders Dutch teaching copy and decimal commas", () => {
    const scenario = regressionScenarios[1];
    const fit = fitLeastSquares(scenario.points);
    const markup = renderToStaticMarkup(
      <LocaleProvider initial="nl"><RegressionStage
        scenario={scenario}
        line={fit}
        fit={fit}
        hasRevealedFit
        squareRevealProgress={1}
        sseCollectionProgress={1}
        residualCollectionProgress={1}
        sseCollected
        status="Minimum gevonden"
      /></LocaleProvider>,
    );

    expect(markup).toContain("Interactieve kleinste-kwadratenregressie");
    expect(markup).toContain("Residuen van de huidige lijn");
    expect(markup).toContain(scenario.copy.nl.xLabel);
    expect(markup).toMatch(/\d,\d/);
  });
});
