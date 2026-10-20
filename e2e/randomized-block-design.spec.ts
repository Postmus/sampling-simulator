import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/randomized-block-design");
});

test("is the second exploration in the clustered-data theme", async ({ page }) => {
  await page.goto("/#/themes/clustered-data");
  const cards = page.locator(".concept-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Cluster randomisation");
  await expect(cards.nth(1)).toContainText("Randomised blocks");
  await cards.nth(1).click();
  await expect(page.getByRole("heading", { name: "Randomised blocks: treatment within hospitals", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Centre within hospitals", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: /^(Animate 10|Pause|Resume)$/ })).toHaveCount(0);
  const runButton = await page.getByRole("button", { name: "Run 1 trial", exact: true }).boundingBox();
  expect(runButton!.y + runButton!.height).toBeLessThan(768);
  await page.screenshot({ path: "test-results/block-initial-desktop.png", fullPage: true });
});

test("shows balanced randomisation within hospitals and the gain in precision", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  await expect(page.locator(".cluster-patient")).toHaveCount(120);
  for (let hospital = 1; hospital <= 6; hospital += 1) {
    const row = page.locator(`[data-hospital="${hospital}"]`);
    await expect(row.locator('.cluster-patient[data-treatment="control"]')).toHaveCount(10);
    await expect(row.locator('.cluster-patient[data-treatment="intervention"]')).toHaveCount(10);
  }
  await expect(page.locator(".block-within-mean")).toHaveCount(12);
  await expect(page.locator(".block-mean-connector")).toHaveCount(6);
  const ordinary = Number(await page.locator('[data-role="ordinary-estimate"]').innerText());
  await expect(page.locator('[data-role="mixed-estimate"]')).toHaveText(ordinary.toFixed(2));
  const ordinarySE = Number(await page.locator('[data-role="ordinary-se"]').innerText());
  const mixedSE = Number(await page.locator('[data-role="mixed-se"]').innerText());
  expect(mixedSE).toBeLessThan(ordinarySE);
  await expect(page.locator('[data-analysis="ordinary"]')).toContainText("118");
  await expect(page.locator('[data-analysis="mixed"]')).toContainText("113");
  for (const group of ["control", "intervention"]) await expect(page.locator(`[data-boxplot="${group}"]`)).toHaveAttribute("data-count", "60");
  const scatter = page.locator('[data-chart="hospitals"]');
  const boxplots = page.locator('[data-chart="boxplots"]');
  for (const attribute of ["data-axis-min", "data-axis-max"]) await expect(boxplots).toHaveAttribute(attribute, (await scatter.getAttribute(attribute))!);
  expect((await boxplots.boundingBox())!.x).toBeGreaterThan((await scatter.boundingBox())!.x + (await scatter.boundingBox())!.width);
  await page.screenshot({ path: "test-results/block-raw-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("centres both plots while preserving the trial, treatment contrasts and fitted analyses", async ({ page }) => {
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  const analyses = await page.locator("[data-analysis]").evaluateAll((cards) => cards.map((card) => card.outerHTML));
  const connectors = await page.locator(".block-mean-connector").evaluateAll((lines) => lines.map((line) => Number(line.getAttribute("data-difference"))));
  const raw = await page.locator(".cluster-patient").evaluateAll((points) => points.map((point) => Number(point.getAttribute("data-outcome"))));
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).check();
  await expect(page.locator('[data-chart="hospitals"]')).toHaveAttribute("data-centered", "true");
  await expect(page.locator('[data-chart="hospitals"]')).toContainText("Deviation from hospital mean (mmHg)");
  await expect(page.locator('[data-chart="boxplots"]')).toContainText("Deviation (mmHg)");
  for (let hospital = 1; hospital <= 6; hospital += 1) {
    const points = page.locator(`[data-hospital="${hospital}"] .cluster-patient`);
    const values = await points.evaluateAll((nodes) => nodes.map((node) => ({ raw: Number(node.getAttribute("data-outcome")), displayed: Number(node.getAttribute("data-display-value")) })));
    const hospitalMean = values.reduce((sum, value) => sum + value.raw, 0) / 20;
    for (const value of values) expect(value.displayed).toBeCloseTo(value.raw - hospitalMean, 10);
    expect(values.reduce((sum, value) => sum + value.displayed, 0) / 20).toBeCloseTo(0, 10);
  }
  const centeredConnectors = await page.locator(".block-mean-connector").evaluateAll((lines) => lines.map((line) => Number(line.getAttribute("data-difference"))));
  centeredConnectors.forEach((difference, index) => expect(difference).toBeCloseTo(connectors[index], 10));
  expect(await page.locator("[data-analysis]").evaluateAll((cards) => cards.map((card) => card.outerHTML))).toEqual(analyses);
  const control = Number(await page.locator('[data-boxplot="control"]').getAttribute("data-mean"));
  const intervention = Number(await page.locator('[data-boxplot="intervention"]').getAttribute("data-mean"));
  expect(control + intervention).toBeCloseTo(0, 10);
  expect(intervention - control).toBeCloseTo(Number(await page.locator('[data-role="mixed-estimate"]').innerText()), 2);
  const scatter = page.locator('[data-chart="hospitals"]');
  const boxplots = page.locator('[data-chart="boxplots"]');
  for (const attribute of ["data-axis-min", "data-axis-max"]) await expect(boxplots).toHaveAttribute(attribute, (await scatter.getAttribute(attribute))!);
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  await page.screenshot({ path: "test-results/block-centered-desktop.png", fullPage: true });
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).uncheck();
  expect(await page.locator(".cluster-patient").evaluateAll((points) => points.map((point) => Number(point.getAttribute("data-display-value"))))).toEqual(raw);
  await page.getByRole("button", { name: "Reset / replay", exact: true }).click();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  expect(await page.locator(".cluster-patient").evaluateAll((points) => points.map((point) => Number(point.getAttribute("data-outcome"))))).toEqual(raw);
});

test("shows conservative ordinary-regression null error and keeps accumulated results when centring", async ({ page }) => {
  await page.getByRole("button", { name: "Generate 1,000", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1,000");
  const rate = async (key: string) => Number((await page.locator(`[data-role="${key}-rate"]`).innerText()).replace("%", ""));
  const mixedRate = await rate("mixed");
  expect(mixedRate).toBeGreaterThan(2);
  expect(mixedRate).toBeLessThan(8);
  expect(await rate("ordinary")).toBeLessThan(mixedRate);
  expect(Number((await page.locator('[data-role="mixed-coverage"]').innerText()).replace("%", "")) + mixedRate).toBeCloseTo(100, 1);
  const histogram = await page.locator('[data-chart="sampling"]').innerHTML();
  const bins = await page.locator("[data-bin-count]").evaluateAll((nodes) => nodes.reduce((sum, node) => sum + Number(node.getAttribute("data-bin-count")), 0));
  expect(bins).toBe(1000);
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).check();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1,000");
  expect(await rate("mixed")).toBe(mixedRate);
  expect(await page.locator('[data-chart="sampling"]').innerHTML()).toBe(histogram);
});

test("shows power and preserves centring and results in Dutch", async ({ page }) => {
  await page.getByRole("combobox", { name: "Generate trials under", exact: true }).selectOption("h1");
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).check();
  await page.getByRole("button", { name: "Generate 1,000", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1,000");
  const mixedRate = await page.locator('[data-role="mixed-rate"]').innerText();
  const ordinaryRate = Number((await page.locator('[data-role="ordinary-rate"]').innerText()).replace("%", ""));
  expect(Number(mixedRate.replace("%", ""))).toBeGreaterThan(ordinaryRate);
  expect(Number(mixedRate.replace("%", ""))).toBeGreaterThan(65);
  expect(Number(mixedRate.replace("%", ""))).toBeLessThan(90);
  const estimate = await page.locator('[data-role="mixed-estimate"]').innerText();
  await page.getByLabel("Language", { exact: true }).selectOption("nl");
  await expect(page.getByRole("heading", { name: "Gerandomiseerde blokken: behandeling binnen ziekenhuizen", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Centreer binnen ziekenhuizen", exact: true })).toBeChecked();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1.000");
  await expect(page.locator('[data-role="mixed-rate"]')).toHaveText(mixedRate.replace(".", ","));
  await expect(page.locator('[data-role="mixed-estimate"]')).toHaveText(estimate.replace(".", ","));
  await expect(page.locator('[data-chart="hospitals"]')).toContainText("Afwijking van ziekenhuisgemiddelde (mmHg)");
  expect(await page.locator('[data-chart="boxplots"] .cluster-axis > g').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('[data-role="mixed-interval"]')).toHaveText(/^\[.*; .*\]$/);
  const overlaps = await page.locator(".cluster-analysis-card dl > div").evaluateAll((rows) => rows.filter((row) => row.querySelector("dt")!.getBoundingClientRect().right > row.querySelector("dd")!.getBoundingClientRect().left).length);
  expect(overlaps).toBe(0);
  await page.screenshot({ path: "test-results/block-centered-dutch.png", fullPage: true });
});

test("resets population edits, keeps total SD fixed as ICC changes, and retains the display choice", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).check();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  const slider = page.getByRole("slider", { name: /Within-hospital correlation/ });
  await slider.focus(); await slider.press("End");
  await expect(slider).toHaveValue("0.9");
  await expect(page.getByLabel("Total outcome SD (mmHg)", { exact: true })).toHaveValue("12");
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await expect(page.locator(".cluster-patient")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Centre within hospitals", exact: true })).toBeChecked();
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("");
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  const ticks = await page.locator('[data-chart="intervals"] .cluster-axis > g text').allTextContents();
  expect(ticks.length).toBeGreaterThanOrEqual(3);
  expect(new Set(ticks).size).toBe(ticks.length);
  await page.getByText("Display and replay options", { exact: true }).click();
  await page.getByRole("button", { name: "Reset to defaults", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Centre within hospitals", exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Total outcome SD (mmHg)", { exact: true })).toHaveValue("12");
});

test("cancels a trial reveal when the model changes", async ({ page }) => {
  const now = Date.now();
  await page.clock.install({ time: now }); await page.clock.pauseAt(now + 1000);
  await page.getByText("Display and replay options", { exact: true }).click();
  await page.getByLabel("Reduce motion", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await page.clock.runFor(400);
  await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).check();
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeDisabled();
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("15");
  await page.clock.runFor(4000);
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await expect(page.locator(".cluster-patient")).toHaveCount(0);
  await page.getByLabel("Reduce motion", { exact: true }).check();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await page.clock.runFor(100);
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
});

test("keeps both views readable on narrow screens", async ({ page }) => {
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  await page.setViewportSize({ width: 320, height: 740 });
  for (const centered of [false, true]) {
    await page.getByRole("checkbox", { name: "Centre within hospitals", exact: true }).setChecked(centered);
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
    expect((await page.locator(".cluster-hospital-label").first().boundingBox())!.height).toBeGreaterThanOrEqual(16);
    const scatter = await page.locator('[data-chart="hospitals"]').boundingBox();
    const boxes = await page.locator('[data-chart="boxplots"]').boundingBox();
    expect(boxes!.y).toBeGreaterThan(scatter!.y + scatter!.height);
  }
  await page.screenshot({ path: "test-results/block-centered-mobile.png", fullPage: true });
});
