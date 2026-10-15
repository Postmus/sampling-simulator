import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/plaque-index-inference");
});

test("links fresh samples to labelled plot results and replays deterministically", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "From plaque scores to power" })).toBeVisible();
  await expect(page.getByLabel("Population SD (both groups)")).toHaveValue("0.60");
  await expect(page.getByLabel("Patients per group")).toHaveValue("24");
  await expect(page.locator('[data-role="plaque-theoretical-se"]')).toHaveText("0.173");
  await page.getByRole("button", { name: "Run 1 experiment", exact: true }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1");
  await expect(page.locator('.plaque-patient[data-group="control"]')).toHaveCount(24);
  await expect(page.locator('.plaque-patient[data-group="treatment"]')).toHaveCount(24);
  for (const kind of ["difference", "t"]) await expect(page.locator(`[data-chart="${kind}"]`)).toHaveAttribute("data-count", "1");
  const difference = await page.locator('[data-role="plaque-latest-difference"]').textContent() ?? "";
  for (const kind of ["difference", "t"]) {
    const chart = page.locator(`[data-chart="${kind}"]`);
    const label = Number(await chart.locator(`[data-role="plaque-latest-${kind}"]`).textContent());
    const marker = Number(await chart.locator(".plaque-latest-marker").getAttribute("data-value"));
    expect(label).toBeCloseTo(marker, 3);
  }
  await page.getByRole("button", { name: "Reset / replay" }).click();
  await expect(page.locator(".plaque-latest-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Run 1 experiment", exact: true }).click();
  await expect(page.locator('[data-role="plaque-latest-difference"]')).toHaveText(difference);
});

test("resets when SD, n or H0/H1 changes and counts each paired histogram result", async ({ page }) => {
  await page.getByRole("button", { name: "Generate 1,000" }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1,000");
  for (const kind of ["difference", "t"]) {
    const total = await page.locator(`[data-chart="${kind}"] [data-bin-count]`).evaluateAll((bins) => bins.reduce((sum, bin) => sum + Number(bin.getAttribute("data-bin-count")), 0));
    expect(total).toBe(1000);
  }
  await page.getByLabel("Population SD (both groups)").fill("1.2");
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("0");
  await expect(page.locator('[data-role="plaque-theoretical-se"]')).toHaveText("0.346");
  await page.getByLabel("Patients per group").fill("96");
  await expect(page.getByLabel("Population SD (both groups)")).toHaveValue("1.2");
  await expect(page.locator('[data-role="plaque-theoretical-se"]')).toHaveText("0.173");
  await page.getByLabel("Generate experiments under").selectOption("h1");
  await expect(page.getByText("Estimated power", { exact: true })).toBeVisible();
  await expect(page.getByLabel("H₁ difference (experimental − control)")).toBeEnabled();
  await page.getByRole("button", { name: "Generate 1,000" }).click();
  await page.getByLabel("H₁ difference (experimental − control)").fill("0.5");
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("0");
  await page.getByLabel("Patients per group").fill("2.5");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run 1 experiment", exact: true })).toBeDisabled();
});

test("preserves results across language changes and stays readable without horizontal overflow", async ({ page }) => {
  await page.getByRole("button", { name: "Generate 1,000" }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1,000");
  await page.getByLabel("Language").selectOption("nl");
  await expect(page.getByRole("heading", { name: "Van plaquescores naar power" })).toBeVisible();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1.000");
  await expect(page.locator('[data-role="plaque-theoretical-se"]')).toHaveText("0,173");
  const axisText = page.locator(".plaque-axis-title").first();
  expect((await axisText.boundingBox())!.height).toBeGreaterThanOrEqual(15);
  await page.screenshot({ path: "test-results/plaque-populated-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await axisText.boundingBox())!.height).toBeGreaterThanOrEqual(15);
  const clippedText = await page.locator(".plaque-chart-wrap svg").evaluateAll((charts) => charts.flatMap((chart) => {
    const svg = chart as SVGSVGElement;
    return [...svg.querySelectorAll("text")].filter((text) => {
      const box = text.getBBox();
      return box.x < -1 || box.x + box.width > svg.viewBox.baseVal.width + 1
        || box.y < -1 || box.y + box.height > svg.viewBox.baseVal.height + 1;
    }).map((text) => text.textContent);
  }));
  expect(clippedText).toEqual([]);
  await page.screenshot({ path: "test-results/plaque-populated-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const clippedAt320 = await page.locator(".plaque-chart-wrap svg").evaluateAll((charts) => charts.flatMap((chart) => {
    const svg = chart as SVGSVGElement;
    return [...svg.querySelectorAll("text")].filter((text) => {
      const box = text.getBBox();
      return box.x < -1 || box.x + box.width > svg.viewBox.baseVal.width + 1;
    }).map((text) => text.textContent);
  }));
  expect(clippedAt320).toEqual([]);
});

test("is discoverable in the library and keeps the null reference when H1 is selected", async ({ page }) => {
  await page.goto("/#/themes/sampling-estimation");
  await page.getByRole("link").filter({ hasText: "From plaque scores to power" }).click();
  await page.getByLabel("Generate experiments under").selectOption("h1");
  await page.getByLabel("Patients per group").fill("64");
  await page.getByRole("button", { name: "Generate 1,000" }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1,000");
  const power = Number((await page.locator('[data-role="plaque-rejection-rate"]').innerText()).replace("%", ""));
  expect(power).toBeGreaterThan(75);
  expect(power).toBeLessThan(85);
  await expect(page.getByText("Testing always uses H₀: difference = 0.", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/plaque-h1-desktop.png", fullPage: true });
});

test("cancels an in-flight animation on model changes", async ({ page }) => {
  await page.getByText("Display and replay options").click();
  await page.getByLabel("Reduce motion", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Animate 10", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".plaque-status")).toHaveText("Animation paused.");
  await page.getByLabel("Population SD (both groups)").fill("0.8");
  await expect(page.getByRole("button", { name: "Run 1 experiment", exact: true })).toBeEnabled();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("0");
  await page.getByLabel("Reduce motion", { exact: true }).check();
  await page.getByRole("button", { name: "Run 1 experiment", exact: true }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1");
});

test("separates both populations above their samples and keeps repeated statistics out of panel one", async ({ page }) => {
  const panel = page.locator('section[aria-labelledby="plaque-populations-heading"]');
  const control = await panel.locator('.plaque-population-cell[data-group="control"]').boundingBox();
  const treatment = await panel.locator('.plaque-population-cell[data-group="treatment"]').boundingBox();
  const controlSample = await panel.locator('.plaque-sample-cell[data-group="control"]').boundingBox();
  const treatmentSample = await panel.locator('.plaque-sample-cell[data-group="treatment"]').boundingBox();
  expect(Math.abs(control!.y - treatment!.y)).toBeLessThan(2);
  expect(treatment!.x).toBeGreaterThan(control!.x + control!.width);
  expect(controlSample!.y).toBeGreaterThan(control!.y + control!.height);
  expect(treatmentSample!.y).toBeGreaterThan(treatment!.y + treatment!.height);
  await expect(panel.locator('.plaque-se-comparison')).toHaveCount(0);
  await expect(page.locator('.plaque-panel')).toHaveCount(2);
  await expect(page.locator('.plaque-calculation')).toHaveCount(0);
  await expect(page.getByText(/Pooled sample SD|Two-sided p-value|Show.*calculation/i)).toHaveCount(0);
  await expect(page.locator('[aria-labelledby="plaque-difference-heading"] [data-role="plaque-theoretical-se"]')).toBeVisible();
  await expect(page.locator('[aria-labelledby="plaque-t-heading"] .plaque-test-rule')).toBeVisible();
  await expect(page.locator('.plaque-teaching-note')).toHaveCount(0);
  await expect(page.getByText(/Teaching model:|Onderwijsmodel:/)).toHaveCount(0);
});

test("moves each observation from its population curve into its own sample row, with pause and resume", async ({ page }) => {
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);
  await page.getByText("Display and replay options").click();
  await page.getByLabel("Reduce motion", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Run 1 experiment", exact: true }).click();
  const patient = page.locator('.plaque-patient[data-group="control"]').first();
  await expect(patient).toBeVisible();
  const origin = Number(await patient.getAttribute("data-origin-y"));
  const target = Number(await patient.getAttribute("data-target-y"));
  expect(Number(await patient.getAttribute("cy"))).toBeLessThan(target - 60);
  await page.clock.runFor(650);
  expect(Number(await patient.getAttribute("cy"))).toBeGreaterThan(origin + 25);
  expect(Number(await patient.getAttribute("cy"))).toBeLessThan(target - 40);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator('.plaque-status')).toHaveText("Animation paused.");
  const pausedY = Number(await patient.getAttribute("cy"));
  await page.clock.runFor(300);
  await page.screenshot({ path: "test-results/plaque-sampling-in-motion.png", fullPage: true });
  expect(Number(await patient.getAttribute("cy"))).toBeCloseTo(pausedY, 4);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(3500);
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1");
  for (const group of ["control", "treatment"]) {
    const arrived = await page.locator(`.plaque-patient[data-group="${group}"]`).evaluateAll((points) => points.every((point) =>
      Math.abs(Number(point.getAttribute("cy")) - Number(point.getAttribute("data-target-y"))) < 0.001));
    expect(arrived).toBe(true);
  }
});


test("labels both population means, shifts them together and shows empirical histograms only", async ({ page }) => {
  await expect(page.getByLabel("Control population mean", { exact: true })).toHaveValue("1.50");
  await expect(page.locator('[data-role="plaque-population-mean-control"]')).toHaveText("μ = 1.50");
  await expect(page.locator('[data-role="plaque-population-mean-treatment"]')).toHaveText("μ = 1.50");
  await expect(page.locator('.plaque-population-curve')).toHaveCount(2);
  await expect(page.locator('.plaque-distribution-chart path.plaque-reference-curve')).toHaveCount(0);
  await page.getByLabel("Generate experiments under").selectOption("h1");
  await expect(page.getByLabel("H₁ difference (experimental − control)")).toHaveValue("-0.30");
  await expect(page.locator('[data-role="plaque-population-mean-treatment"]')).toHaveText("μ = 1.20");
  await page.getByRole("button", { name: "Generate 1,000" }).click();
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("1,000");
  for (const kind of ["difference", "t"]) {
    const chart = page.locator(`[data-chart="${kind}"]`);
    const results = await chart.locator('[data-bin-count]').evaluateAll((bins) => bins.reduce((sum, bin) => sum + Number(bin.getAttribute("data-bin-count")), 0));
    expect(results).toBe(1000);
    expect(Number(await chart.locator('.plaque-latest-marker').getAttribute('data-value'))).toBeLessThan(0);
  }
  const differenceChart = page.locator('[data-chart="difference"]');
  expect(Number(await differenceChart.getAttribute("data-axis-max")) - Number(await differenceChart.getAttribute("data-axis-min"))).toBeLessThan(1.5);
  await page.getByLabel("Control population mean", { exact: true }).fill("2");
  await expect(page.locator('[data-role="plaque-count"]')).toHaveText("0");
  await expect(page.locator('[data-role="plaque-population-mean-control"]')).toHaveText("μ = 2.00");
  await expect(page.locator('[data-role="plaque-population-mean-treatment"]')).toHaveText("μ = 1.70");
  await page.getByLabel("Language").selectOption("nl");
  await expect(page.locator('[data-role="plaque-population-mean-control"]')).toHaveText("μ = 2,00");
  await expect(page.locator('[data-role="plaque-population-mean-treatment"]')).toHaveText("μ = 1,70");
});
