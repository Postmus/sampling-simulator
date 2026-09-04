import { expect, test } from "@playwright/test";

test("fits horizontal group means and then the additive ANCOVA model", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/ancova-additive");

  await expect(page.getByRole("heading", { name: "ANCOVA: comparing at the same baseline" })).toBeVisible();
  await expect(page.locator(".ancova-observation-point")).toHaveCount(90);
  await expect(page.locator(".ancova-fit-line")).toHaveCount(0);
  await expect(page.getByText(/Current model: No model fitted/)).toBeVisible();

  await page.getByRole("button", { name: "Fit treatment-only model" }).click();
  await expect(page.locator(".ancova-fit-line")).toHaveCount(3);
  await expect(page.getByText("Treatment only", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("-0.36 mm", { exact: true })).toBeVisible();

  for (const line of await page.locator(".ancova-fit-line").all()) {
    await expect(line).toHaveAttribute("y1", await line.getAttribute("y2") ?? "");
  }

  await page.getByRole("button", { name: "Add baseline to model" }).click();
  await expect(page.locator(".ancova-baseline-guide")).toHaveCount(0);
  await expect(page.locator(".ancova-baseline-intersection")).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByText("-0.47 mm", { exact: true })).toBeVisible();
  await expect(page.locator(".ancova-model-result-block")).toHaveCount(2);
  await expect(page.getByText("What did adjustment change?", { exact: true })).toHaveCount(0);
  await expect(page.locator(".ancova-coefficient-table")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Collapse comparison/ })).toHaveCount(0);

  const adjustedLine = page.locator(".ancova-fit-line").first();
  expect(await adjustedLine.getAttribute("y1")).not.toBe(await adjustedLine.getAttribute("y2"));

  await page.getByRole("button", { name: "Show treatment-only model" }).click();
  await expect(page.getByText("The three horizontal lines are the fitted group means. Baseline has not entered the model yet.", { exact: true })).toBeVisible();
  await expect(page.locator(".ancova-model-result-block")).toHaveCount(2);

  await page.getByRole("button", { name: "Show adjusted model" }).click();
  await expect(page.getByText("The shared baseline slope turns the group means into parallel lines; Model 2 shows the adjusted treatment differences.", { exact: true })).toBeVisible();
});

test("keeps equal-size estimate and SE values inside the wide-layout result cards", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/ancova-additive");

  await page.getByRole("button", { name: "Fit treatment-only model" }).click();
  await page.getByRole("button", { name: "Add baseline to model" }).click();

  const rows = page.locator(".ancova-estimate-se");
  await expect(rows).toHaveCount(4);
  for (const row of await rows.all()) {
    const metrics = await row.locator("strong").evaluateAll((values) => values.map((value) => {
      const range = document.createRange();
      range.selectNodeContents(value);
      const textBounds = range.getBoundingClientRect();
      const cardBounds = value.closest(".ancova-key-result")!.getBoundingClientRect();
      return {
        fontSize: getComputedStyle(value).fontSize,
        contained: textBounds.left >= cardBounds.left && textBounds.right <= cardBounds.right,
      };
    }));
    expect([...new Set(metrics.map(({ fontSize }) => fontSize))]).toHaveLength(1);
    expect(metrics.every(({ contained }) => contained)).toBe(true);
  }
});
