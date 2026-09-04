import { expect, test } from "@playwright/test";

test("keeps the reference exploration readable at the laptop baseline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/mean-difference-sampling");

  const panelTitle = page.locator(".mean-difference-zone-title").first();
  const explanatoryText = page.locator(".mean-difference-zone-subtitle").first();
  const controlLabel = page.getByText("Vehicle mean (%)", { exact: true });

  const panelTitleBox = await panelTitle.boundingBox();
  const explanatoryTextBox = await explanatoryText.boundingBox();
  const controlLabelBox = await controlLabel.boundingBox();

  expect(panelTitleBox?.height ?? 0).toBeGreaterThanOrEqual(18);
  expect(explanatoryTextBox?.height ?? 0).toBeGreaterThanOrEqual(15);
  expect(controlLabelBox?.height ?? 0).toBeGreaterThanOrEqual(13);

  const layout = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    pageHeight: document.documentElement.scrollHeight,
  }));
  expect(layout.viewportHeight).toBe(768);
  expect(layout.pageHeight).toBeGreaterThan(layout.viewportHeight);
});

const existingExplorations = [
  {
    slug: "sampling-distribution",
    title: ".sampling-journey .zone-title",
    explanatory: ".sampling-journey .zone-subtitle",
    control: "Population mean",
  },
  {
    slug: "least-squares",
    title: ".regression-zone-title",
    explanatory: ".regression-zone-subtitle",
    control: "Teaching scenario",
  },
  {
    slug: "regression-diagnostics",
    title: ".diagnostics-zone-title",
    explanatory: ".diagnostics-zone-subtitle",
    control: "Teaching example",
  },
] as const;

for (const exploration of existingExplorations) {
  test(`${exploration.slug} follows the readable exploration sizing`, async ({ page }) => {
    await page.goto(`/#/concepts/${exploration.slug}`);

    const titleBox = await page.locator(exploration.title).first().boundingBox();
    const explanatoryBox = await page.locator(exploration.explanatory).first().boundingBox();
    const controlBox = await page.getByText(exploration.control, { exact: true }).boundingBox();

    expect(titleBox?.height ?? 0).toBeGreaterThanOrEqual(18);
    expect(explanatoryBox?.height ?? 0).toBeGreaterThanOrEqual(15);
    expect(controlBox?.height ?? 0).toBeGreaterThanOrEqual(13);
  });
}

for (const slug of ["ancova-additive", "interaction-model"] as const) {
  test(`${slug} keeps its analytical panels readable at the laptop baseline`, async ({ page }) => {
    await page.goto(`/#/concepts/${slug}`);

    const titleBox = await page.locator(".ancova-panel-title h2").boundingBox();
    const explanatoryBox = await page.locator(".ancova-panel-title p").boundingBox();
    const mainGridColumns = await page.locator(".ancova-main-grid").evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns,
    );

    expect(titleBox?.height ?? 0).toBeGreaterThanOrEqual(18);
    expect(explanatoryBox?.height ?? 0).toBeGreaterThanOrEqual(15);
    expect(mainGridColumns.trim().split(/\s+/)).toHaveLength(1);
  });
}
