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
  await expect(page.getByText("-0.36", { exact: true })).toBeVisible();
  await expect(page.getByText(".034", { exact: true })).toBeVisible();

  for (const line of await page.locator(".ancova-fit-line").all()) {
    await expect(line).toHaveAttribute("y1", await line.getAttribute("y2") ?? "");
  }

  await page.getByRole("button", { name: "Add baseline to model" }).click();
  await expect(page.locator(".ancova-baseline-guide")).toHaveCount(2);
  await expect(page.locator(".ancova-baseline-intersection")).toHaveCount(6);
  await expect(page.getByRole("slider", { name: "Baseline A" })).toHaveValue("4.5");
  await expect(page.getByRole("slider", { name: "Baseline B" })).toHaveValue("7");
  await expect(page.getByText("0.41 + 0.70 × 4.50 - 0.47 = 3.09", { exact: true })).toBeVisible();
  await expect(page.getByText("3.09 - 3.56 = -0.47", { exact: true })).toBeVisible();
  await expect(page.getByText("What did adjustment change?", { exact: true })).toBeVisible();
  await expect(page.getByText("SE reduction: 38%", { exact: true })).toHaveCount(2);
  await expect(page.getByText("-0.47", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("< .001", { exact: true }).first()).toBeVisible();

  const adjustedLine = page.locator(".ancova-fit-line").first();
  expect(await adjustedLine.getAttribute("y1")).not.toBe(await adjustedLine.getAttribute("y2"));

  await page.getByRole("slider", { name: "Baseline A" }).fill("5");
  await expect(page.getByText("0.41 + 0.70 × 5.00 - 0.47 = 3.44", { exact: true })).toBeVisible();
  await expect(page.getByText("3.44 - 3.91 = -0.47", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Collapse comparison/ }).click();
  await expect(page.locator(".ancova-baseline-guide")).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Baseline A" })).toHaveCount(0);
  await page.getByRole("button", { name: /Open comparison/ }).click();
  await expect(page.locator(".ancova-baseline-guide")).toHaveCount(2);

  await page.getByRole("button", { name: "Show treatment-only model" }).click();
  await expect(page.getByText("The three horizontal lines are the fitted group means. Baseline has not entered the model yet.", { exact: true })).toBeVisible();
  await expect(page.getByText("Compare two baseline values", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Show adjusted model" }).click();
  await expect(page.getByText("The shared baseline slope makes the treatment lines parallel; compare any two baseline values below.", { exact: true })).toBeVisible();
  await expect(page.getByText("Compare two baseline values", { exact: true })).toBeVisible();
});
