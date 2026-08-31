import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { AncovaControls } from "./AncovaControls";
import { AncovaStage } from "./AncovaStage";
import { periodontalData } from "./data";
import { fitAncova } from "./model";

const unadjusted = fitAncova(periodontalData, "unadjusted");
const adjusted = fitAncova(periodontalData, "adjusted");

describe("additive ANCOVA visualization", () => {
  it("renders all observations and three horizontal treatment-only fits", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <AncovaStage
          unadjusted={unadjusted}
          adjusted={adjusted}
          activeModel="unadjusted"
          adjustedRevealed={false}
          lineRevealProgress={1}
          modelMix={0}
          baselineComparisonOpen={false}
          baselineA={4.5}
          baselineB={7}
          onBaselineComparisonToggle={() => undefined}
          onBaselineAChange={() => undefined}
          onBaselineBChange={() => undefined}
          status="Treatment-only model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup.match(/class="ancova-observation-point"/g)).toHaveLength(90);
    expect(markup.match(/class="ancova-fit-line/g)).toHaveLength(3);
    expect(markup).toContain(">d_mond</th>");
    expect(markup).toContain("β<sub>1</sub> × d<sub>mond,i</sub>");
    expect(markup).toContain("β<sub>2</sub> × d<sub>aanv,i</sub>");
    expect(markup).not.toContain("β<sub>3</sub>");
    expect(markup).toContain("-0.36");
    expect(markup).toContain(".034");
  });

  it("renders adjusted inference and the before-after comparison", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <AncovaStage
          unadjusted={unadjusted}
          adjusted={adjusted}
          activeModel="adjusted"
          adjustedRevealed
          lineRevealProgress={1}
          modelMix={1}
          baselineComparisonOpen
          baselineA={4.5}
          baselineB={7}
          onBaselineComparisonToggle={() => undefined}
          onBaselineAChange={() => undefined}
          onBaselineBChange={() => undefined}
          status="Adjusted model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup.match(/class="ancova-baseline-guide/g)).toHaveLength(2);
    expect(markup.match(/class="ancova-baseline-intersection/g)).toHaveLength(6);
    expect(markup.match(/class="ancova-contrast-card"/g)).toHaveLength(2);
    expect(markup).toContain("Baseline pocket depth");
    expect(markup).toContain("(Constant)");
    expect(markup).toContain(">d_mond</th>");
    expect(markup).toContain(">d_aanv</th>");
    expect(markup).toContain("β<sub>1</sub><span class=\"formula-variable\">PDstart</span><sub>i</sub>");
    expect(markup).toContain("β<sub>2</sub> × d<sub>mond,i</sub>");
    expect(markup).toContain("β<sub>3</sub> × d<sub>aanv,i</sub>");
    expect(markup).toContain("-0.47");
    expect(markup).toContain("SE reduction: 38%");
    expect(markup).toContain("What did adjustment change?");
    expect(markup).toContain("Compare two baseline values");
    expect(markup).toContain("0.41 + 0.70 × 4.50 - 0.47 = 3.09");
    expect(markup).toContain("3.09 - 3.56 = -0.47");
    expect(markup).not.toContain("overall baseline mean");
  });

  it("renders the complete Dutch model path", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider initial="nl">
        <AncovaControls
          activeModel="unadjusted"
          adjustedRevealed={false}
          busy={false}
          onUnadjusted={() => undefined}
          onAdjusted={() => undefined}
          onReset={() => undefined}
        />
      </LocaleProvider>,
    );
    expect(markup).toContain("Bouw het model");
    expect(markup).toContain("Voeg beginwaarde toe");
    expect(markup).toContain("Let hierop");
  });
});
