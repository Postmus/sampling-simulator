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
