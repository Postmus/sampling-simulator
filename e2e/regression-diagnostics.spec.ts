import { expect, test } from "@playwright/test";

test("builds both diagnostic plots and transforms the predictor", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/regression-diagnostics");

  await expect(page.getByRole("heading", { name: "Can we trust the fitted line?" })).toBeVisible();
  await expect(page.getByText("Data and fitted equation", { exact: true })).toBeVisible();
  await expect(page.getByText("Residuals versus fitted values", { exact: true })).toBeVisible();
  await expect(page.getByText("Residual distribution", { exact: true })).toBeVisible();
  await expect(page.getByText("Independence and study design", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Teaching example").locator("option")).toHaveCount(4);
  await expect(page.locator(".diagnostics-residual-token")).toHaveCount(0);

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".diagnostics-residual-token")).toHaveCount(64);
  await expect(page.getByText(/unstructured band with stable spread/)).toBeVisible();

  await page.getByLabel("Teaching example").selectOption("log-relationship");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByText(/curved residual pattern/)).toBeVisible();

  await page.getByRole("radio", { name: "log₂(x)" }).check();
  await expect(page.getByText(/With log₂\(x\) in the model/)).toBeVisible();
  await expect(page.locator(".diagnostics-equation strong")).toContainText("log₂(x)");

  await page.getByLabel("Teaching example").selectOption("increasing-spread");
  await expect(page.getByRole("radio", { name: "log₂(x)" })).toHaveCount(0);
  await expect(page.locator(".diagnostics-residual-token")).toHaveCount(0);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByText(/widening funnel/)).toBeVisible();
});
