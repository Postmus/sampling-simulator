import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fitLeastSquares } from "./model";
import { RegressionControls } from "./RegressionControls";
import { RegressionStage } from "./RegressionStage";
import { regressionScenarios } from "./scenarios";

describe("least-squares visualization", () => {
  it("renders every teaching scenario with an error landscape", () => {
    regressionScenarios.forEach((scenario) => {
      const fit = fitLeastSquares(scenario.points);
      const markup = renderToStaticMarkup(
        <RegressionStage
          scenario={scenario}
          line={{ slope: scenario.initialSlope, intercept: scenario.initialIntercept }}
          fit={fit}
          hasRevealedFit={false}
          squareRevealProgress={0}
          sseCollectionProgress={0}
          residualCollectionProgress={0}
          sseCollected={false}
          status="Ready"
        />,
      );

      expect(markup).toContain("Interactive least-squares regression");
      expect(markup).toContain("Squared-error landscape");
      expect(markup).toContain(scenario.xLabel);
      expect(markup).toContain(scenario.yLabel);
      expect(markup).toContain("outcome-mean-line");
      expect(markup.match(/class="observation-point"/g)).toHaveLength(scenario.points.length);
      expect(markup).not.toContain('class="residual-square"');
    });
  });

  it("renders the fitted solution and complete control set", () => {
    const scenario = regressionScenarios[0];
    const fit = fitLeastSquares(scenario.points);
    const stage = renderToStaticMarkup(
      <RegressionStage
        scenario={scenario}
        line={fit}
        fit={fit}
        hasRevealedFit
        squareRevealProgress={1}
        sseCollectionProgress={1}
        residualCollectionProgress={1}
        sseCollected
        status="Minimum found"
      />,
    );
    const controls = renderToStaticMarkup(
      <RegressionControls
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
      />,
    );

    expect(stage).toContain("candidate-line-at-fit");
    expect(stage).toContain("minimum");
    expect(stage.match(/class="moving-squared-error"/g)).toHaveLength(scenario.points.length);
    expect(stage.match(/class="moving-residual-token"/g)).toHaveLength(scenario.points.length);
    expect(stage).toContain("SSE = Σeᵢ²");
    expect(stage).toContain("Negative means below the line; positive means above the line.");
    expect(stage).not.toContain("mean residual");
    expect(stage).not.toContain("line passes through");
    expect(controls).toContain("Best fit found");
    expect(controls).not.toContain("Add squared errors");
    expect(controls).not.toContain("Collect current residuals");
    expect(controls).toContain("Line evaluated");
    expect(controls).toContain("Minimum SSE");
  });
});
