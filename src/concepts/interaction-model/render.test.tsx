import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { InteractionControls } from "./InteractionControls";
import { InteractionStage } from "./InteractionStage";
import { implantData } from "./data";
import { fitInteractionModel } from "./model";

const additive = fitInteractionModel(implantData, "additive");
const interaction = fitInteractionModel(implantData, "interaction");

describe("interaction-model visualization", () => {
  it("renders all observations, parallel lines, and two torque comparisons", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <InteractionStage
          additive={additive}
          interaction={interaction}
          activeModel="additive"
          interactionRevealed={false}
          lineRevealProgress={1}
          modelMix={0}
          comparisonOpen
          torqueA={25}
          torqueB={45}
          onComparisonToggle={() => undefined}
          onTorqueAChange={() => undefined}
          onTorqueBChange={() => undefined}
          status="Additive model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup.match(/class="interaction-observation-point"/g)).toHaveLength(96);
    expect(markup.match(/class="interaction-fit-line/g)).toHaveLength(2);
    expect(markup.match(/class="interaction-torque-guide/g)).toHaveLength(2);
    expect(markup.match(/class="interaction-guide-marker/g)).toHaveLength(4);
    expect(markup).toContain("β<sub>1</sub><var>T</var><sub>i</sub>");
    expect(markup).toContain("β<sub>2</sub> × d<sub>lower,i</sub>");
    expect(markup).not.toContain("β<sub>3</sub>");
    expect(markup).toContain("65.41 - 63.32 = 2.08");
    expect(markup).toContain("73.48 - 71.39 = 2.08");
    expect(markup).not.toContain("Does the product term improve the model?");
  });

  it("renders different slopes, changing jaw differences, and the nested-model test", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <InteractionStage
          additive={additive}
          interaction={interaction}
          activeModel="interaction"
          interactionRevealed
          lineRevealProgress={1}
          modelMix={1}
          comparisonOpen
          torqueA={25}
          torqueB={45}
          onComparisonToggle={() => undefined}
          onTorqueAChange={() => undefined}
          onTorqueBChange={() => undefined}
          status="Interaction model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup).toContain("β<sub>3</sub> × (<var>T</var><sub>i</sub> × d<sub>lower,i</sub>)");
    expect(markup).toContain("Torque × d_lower");
    expect(markup).toContain("64.01 - 64.68 = -0.67");
    expect(markup).toContain("74.95 - 70.40 = 4.55");
    expect(markup).toContain("Does the product term improve the model?");
    expect(markup).toContain("F(1, 92) = 7.60");
    expect(markup).toContain("p = .007");
  });

  it("renders the complete Dutch model path", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider initial="nl">
        <InteractionControls
          activeModel="additive"
          interactionRevealed={false}
          busy={false}
          onAdditive={() => undefined}
          onInteraction={() => undefined}
          onReset={() => undefined}
        />
      </LocaleProvider>,
    );
    expect(markup).toContain("Bouw het model");
    expect(markup).toContain("Voeg interactie toe");
    expect(markup).not.toContain("Let hierop");
  });
});
