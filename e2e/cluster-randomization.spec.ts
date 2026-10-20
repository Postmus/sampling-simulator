import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/cluster-randomization");
});

test("is discoverable through the new clustered-data theme", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("link").filter({ hasText: "Clustered data" }).click();
  await expect(page.getByRole("heading", { name: "Clustered data", exact: true })).toBeVisible();
  await page.getByRole("link").filter({ hasText: "Cluster randomisation: patients within hospitals" }).click();
  await expect(page.getByRole("heading", { name: "Cluster randomisation: 120 patients, 6 hospitals" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Clustered data" })).toHaveAttribute("href", "#/themes/clustered-data");
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await expect(page.getByRole("button", { name: /^(Animate 10|Pause|Resume)$/ })).toHaveCount(0);
  const runButton = await page.getByRole("button", { name: "Run 1 trial", exact: true }).boundingBox();
  expect(runButton!.y + runButton!.height).toBeLessThan(768);
  await page.screenshot({ path: "test-results/cluster-initial-desktop.png", fullPage: true });
});

test("shows 120 patients, balanced hospital allocation, and the same estimate with different uncertainty", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  await expect(page.locator(".cluster-patient")).toHaveCount(120);
  await expect(page.locator('[data-treatment="control"]')).toHaveCount(3);
  await expect(page.locator('[data-treatment="intervention"]')).toHaveCount(3);
  await expect(page.locator(".cluster-hospital-mean")).toHaveCount(6);
  const estimate = await page.locator('[data-role="ordinary-estimate"]').textContent();
  await expect(page.locator('[data-role="mixed-estimate"]')).toHaveText(estimate!);
  await expect(page.locator('[data-analysis="ordinary"]')).toContainText("118");
  await expect(page.locator('[data-analysis="mixed"]')).toContainText("4");
  const ordinary = page.locator('[data-model="ordinary"]');
  const mixed = page.locator('[data-model="mixed"]');
  const width = async (locator: typeof ordinary) => Number(await locator.getAttribute("data-high")) - Number(await locator.getAttribute("data-low"));
  expect(await width(mixed)).toBeGreaterThan(await width(ordinary));
  for (const key of ["ordinary", "mixed"]) {
    const model = page.locator(`[data-model="${key}"]`);
    const low = Number(await model.getAttribute("data-low"));
    const high = Number(await model.getAttribute("data-high"));
    await expect(page.locator(`[data-role="${key}-interval"]`)).toHaveText(`[${low.toFixed(2)}, ${high.toFixed(2)}]`);
  }
  const domain = await page.locator('[data-chart="hospitals"]').evaluate((element) => [Number(element.getAttribute("data-axis-min")), Number(element.getAttribute("data-axis-max"))]);
  const outcomes = await page.locator(".cluster-patient").evaluateAll((points) => points.map((point) => Number(point.getAttribute("data-outcome"))));
  expect(outcomes.every((value) => value > domain[0] && value < domain[1])).toBe(true);
  const boxplots = page.locator('[data-chart="boxplots"]');
  await expect(boxplots).toHaveAttribute("data-axis-min", String(domain[0]));
  await expect(boxplots).toHaveAttribute("data-axis-max", String(domain[1]));
  for (const group of ["control", "intervention"]) await expect(page.locator(`[data-boxplot="${group}"]`)).toHaveAttribute("data-count", "60");
  const controlMean = Number(await page.locator('[data-boxplot="control"]').getAttribute("data-mean"));
  const interventionMean = Number(await page.locator('[data-boxplot="intervention"]').getAttribute("data-mean"));
  expect(interventionMean - controlMean).toBeCloseTo(Number(estimate), 2);
  const hospitalBox = await page.locator('[data-chart="hospitals"]').boundingBox();
  const summaryBox = await boxplots.boundingBox();
  expect(summaryBox!.x).toBeGreaterThan(hospitalBox!.x + hospitalBox!.width);
  expect(summaryBox!.height).toBeLessThan(hospitalBox!.height);
  await page.screenshot({ path: "test-results/cluster-populated-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Reset / replay", exact: true }).click();
  await expect(page.locator(".cluster-patient")).toHaveCount(0);
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="ordinary-estimate"]')).toHaveText(estimate!);
  expect(errors).toEqual([]);
});

test("counts paired trial decisions and all histogram observations", async ({ page }) => {
  await page.getByRole("button", { name: "Generate 1,000", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1,000");
  const rate = async (key: string) => Number((await page.locator(`[data-role="${key}-rate"]`).innerText()).replace("%", ""));
  expect(await rate("ordinary")).toBeGreaterThan(20);
  expect(await rate("mixed")).toBeGreaterThan(2);
  expect(await rate("mixed")).toBeLessThan(8);
  const covered = Number((await page.locator('[data-role="mixed-coverage"]').innerText()).replace("%", ""));
  expect(covered + await rate("mixed")).toBeCloseTo(100, 1);
  const total = await page.locator("[data-bin-count]").evaluateAll((bins) => bins.reduce((sum, bin) => sum + Number(bin.getAttribute("data-bin-count")), 0));
  expect(total).toBe(1000);
  await page.screenshot({ path: "test-results/cluster-repeated-desktop.png", fullPage: true });
});

test("keeps total SD fixed as ICC changes and resets results on population edits", async ({ page }) => {
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  const slider = page.getByRole("slider", { name: /Within-hospital correlation/ });
  await slider.focus(); await slider.press("End");
  await expect(slider).toHaveValue("0.9");
  await expect(page.getByLabel("Total outcome SD (mmHg)", { exact: true })).toHaveValue("12");
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await expect(page.locator(".cluster-patient")).toHaveCount(0);
  await expect(page.locator('[data-role="cluster-between-sd"]')).toHaveText("11.38");
  await expect(page.locator('[data-role="cluster-within-sd"]')).toHaveText("3.79");
  await slider.press("Home");
  await expect(slider).toHaveValue("0.1");
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeDisabled();
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("20");
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeEnabled();
});

test("shows power under H1 and preserves the simulation when switching language", async ({ page }) => {
  await page.getByRole("combobox", { name: "Generate trials under", exact: true }).selectOption("h1");
  await page.getByLabel("H₁ effect (intervention − control, mmHg)", { exact: true }).fill("-15");
  await page.getByRole("button", { name: "Generate 1,000", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1,000");
  await expect(page.getByText("Estimated power", { exact: true })).toHaveCount(2);
  const rate = await page.locator('[data-role="mixed-rate"]').innerText();
  expect(Number(rate.replace("%", ""))).toBeGreaterThan(40);
  const estimate = await page.locator('[data-role="ordinary-estimate"]').innerText();
  await page.getByLabel("Language", { exact: true }).selectOption("nl");
  await expect(page.getByRole("heading", { name: "Clusterrandomisatie: 120 patiënten, 6 ziekenhuizen" })).toBeVisible();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1.000");
  await expect(page.locator('[data-role="ordinary-estimate"]')).toHaveText(estimate.replace(".", ","));
  await expect(page.locator('[data-role="mixed-rate"]')).toHaveText(rate.replace(".", ","));
  await expect(page.getByText("Geschatte power", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /^(Animeer 10|Pauzeer|Hervat)$/ })).toHaveCount(0);
  for (const key of ["ordinary", "mixed"]) {
    const model = page.locator(`[data-model="${key}"]`);
    const low = Number(await model.getAttribute("data-low")).toFixed(2).replace(".", ",");
    const high = Number(await model.getAttribute("data-high")).toFixed(2).replace(".", ",");
    await expect(page.locator(`[data-role="${key}-interval"]`)).toHaveText(`[${low}; ${high}]`);
  }
  const overlaps = await page.locator(".cluster-analysis-card dl > div").evaluateAll((rows) => rows.filter((row) => {
    const label = row.querySelector("dt")!.getBoundingClientRect();
    const value = row.querySelector("dd")!.getBoundingClientRect();
    return label.right > value.left;
  }).length);
  expect(overlaps).toBe(0);
  await page.screenshot({ path: "test-results/cluster-dutch-desktop.png", fullPage: true });
});

test("cancels a trial reveal on model changes without adding stale trials", async ({ page }) => {
  const now = Date.now();
  await page.clock.install({ time: now }); await page.clock.pauseAt(now + 1000);
  await page.getByText("Display and replay options", { exact: true }).click();
  await page.getByLabel("Reduce motion", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await page.clock.runFor(400);
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeDisabled();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await page.getByLabel("Total outcome SD (mmHg)", { exact: true }).fill("15");
  await page.clock.runFor(4000);
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("0");
  await expect(page.locator(".cluster-patient")).toHaveCount(0);
  await page.getByLabel("Reduce motion", { exact: true }).check();
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await page.clock.runFor(100);
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
});

test("keeps charts readable and contains scrolling on narrow screens", async ({ page }) => {
  await page.getByRole("button", { name: "Run 1 trial", exact: true }).click();
  await expect(page.locator('[data-role="cluster-count"]')).toHaveText("1");
  expect((await page.locator(".cluster-hospital-label").first().boundingBox())!.height).toBeGreaterThanOrEqual(16);
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(page.getByRole("button", { name: "Run 1 trial", exact: true })).toBeVisible();
  const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
  expect((await page.locator(".cluster-hospital-label").first().boundingBox())!.height).toBeGreaterThanOrEqual(16);
  const hospitalBox = await page.locator('[data-chart="hospitals"]').boundingBox();
  const summaryBox = await page.locator('[data-chart="boxplots"]').boundingBox();
  expect(summaryBox!.y).toBeGreaterThan(hospitalBox!.y + hospitalBox!.height);
  await page.screenshot({ path: "test-results/cluster-mobile.png", fullPage: true });
});
