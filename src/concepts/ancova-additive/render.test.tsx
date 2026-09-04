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
          status="Treatment-only model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup.match(/class="ancova-observation-point"/g)).toHaveLength(90);
    expect(markup.match(/class="ancova-fit-line/g)).toHaveLength(3);
    expect(markup).toContain("β<sub>1</sub> × d<sub>mond,i</sub>");
    expect(markup).toContain("β<sub>2</sub> × d<sub>aanv,i</sub>");
    expect(markup).not.toContain("β<sub>3</sub>");
    expect(markup).toContain("-0.36 mm");
    expect(markup).not.toContain("ancova-coefficient-table");
  });

  it("renders adjusted key results and the two-baseline comparison", () => {
    const markup = renderToStaticMarkup(
      <LocaleProvider>
        <AncovaStage
          unadjusted={unadjusted}
          adjusted={adjusted}
          activeModel="adjusted"
          adjustedRevealed
          lineRevealProgress={1}
          modelMix={1}
          status="Adjusted model fitted"
        />
      </LocaleProvider>,
    );
    expect(markup).not.toContain("ancova-baseline-guide");
    expect(markup).not.toContain("ancova-baseline-intersection");
    expect(markup.match(/class="ancova-key-result"/g)).toHaveLength(4);
    expect(markup.match(/class="ancova-model-result-block/g)).toHaveLength(2);
    expect(markup).toContain("β<sub>1</sub><span class=\"formula-variable\">PDstart</span><sub>i</sub>");
    expect(markup).toContain("β<sub>2</sub> × d<sub>mond,i</sub>");
    expect(markup).toContain("β<sub>3</sub> × d<sub>aanv,i</sub>");
    expect(markup).toContain("-0.47");
    expect(markup).toContain("-0.47 mm");
    expect(markup).not.toContain("What did adjustment change?");
    expect(markup).not.toContain("type=\"range\"");
    expect(markup).not.toContain("Collapse comparison");
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
    expect(markup).not.toContain("Let hierop");
  });
});
