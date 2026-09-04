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
          torqueA={25}
          torqueB={45}
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
    expect(markup.match(/2.08 ISQ/g)).toHaveLength(2);
    expect(markup.match(/class="ancova-model-result-block/g)).toHaveLength(1);
    expect(markup.match(/type="range"/g)).toHaveLength(2);
    expect(markup.match(/Estimated difference/g)).toHaveLength(2);
    expect(markup).not.toContain("95% CI");
    expect(markup).not.toContain(">SE<");
    expect(markup).not.toContain("Collapse comparison");
    expect(markup).not.toContain("Does the product term improve the model?");
  });

  it("renders different slopes, a key interaction result, and changing jaw differences", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <InteractionStage
          additive={additive}
          interaction={interaction}
          activeModel="interaction"
          interactionRevealed
          lineRevealProgress={1}
          modelMix={1}
          torqueA={25}
          torqueB={45}
          onTorqueAChange={() => undefined}
          onTorqueBChange={() => undefined}
          status="Interaction model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup).toContain("β<sub>3</sub> × (<var>T</var><sub>i</sub> × d<sub>lower,i</sub>)");
    expect(markup).toContain("-0.67 ISQ");
    expect(markup).toContain("4.55 ISQ");
    expect(markup.match(/class="ancova-model-result-block/g)).toHaveLength(2);
    expect(markup.match(/class="ancova-key-result"/g)).toHaveLength(4);
    expect(markup.match(/type="range"/g)).toHaveLength(2);
    expect(markup.match(/Estimated difference/g)).toHaveLength(4);
    expect(markup).not.toContain("95% CI");
    expect(markup).not.toContain("0.26 ISQ / Ncm");
    expect(markup).not.toContain("Does the product term improve the model?");
    expect(markup).not.toContain("interaction-coefficient-table");
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
