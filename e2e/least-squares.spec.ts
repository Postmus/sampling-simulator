import { expect, test } from "@playwright/test";

test("waits for evaluation before collecting a user-defined line", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/least-squares");

  await expect(page.getByText("What to display", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Reduce motion" })).toBeChecked();
  await expect(page.getByText("ŷ = 437.71 + 0x", { exact: true })).toBeVisible();
  await expect(page.getByText("mean of y = 438", { exact: true })).toBeVisible();
  const panels = page.locator(".regression-panel-background");
  const scatterPanel = await panels.nth(0).boundingBox();
  const errorMapPanel = await panels.nth(1).boundingBox();
  const scatterYAxis = await page.locator(".regression-axis-title").filter({ hasText: "Maximum bite force" }).boundingBox();
  const errorMapYAxis = await page.locator(".regression-axis-title").filter({ hasText: "intercept" }).boundingBox();
  expect(scatterPanel).not.toBeNull();
  expect(errorMapPanel).not.toBeNull();
  expect(scatterYAxis).not.toBeNull();
  expect(errorMapYAxis).not.toBeNull();
  expect(scatterYAxis!.x).toBeGreaterThanOrEqual(scatterPanel!.x);
  expect(scatterYAxis!.x + scatterYAxis!.width).toBeLessThanOrEqual(scatterPanel!.x + scatterPanel!.width);
  expect(errorMapYAxis!.x).toBeGreaterThanOrEqual(errorMapPanel!.x);
  expect(errorMapYAxis!.x + errorMapYAxis!.width).toBeLessThanOrEqual(errorMapPanel!.x + errorMapPanel!.width);
  await expect(page.getByText("Mean-line error", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add squared errors" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Collect .*residuals/ })).toHaveCount(0);
  await expect(page.locator(".residual-square")).toHaveCount(0);
  await expect(page.locator(".moving-residual-token")).toHaveCount(0);

  const slope = page.getByRole("slider", { name: "Slope" });
  await slope.fill("8");
  await page.waitForTimeout(500);
  await expect(page.locator(".residual-square")).toHaveCount(0);
  await expect(page.locator(".moving-squared-error")).toHaveCount(0);
  await expect(page.locator(".moving-residual-token")).toHaveCount(0);

  await page.getByRole("button", { name: "Evaluate this line" }).click();
  await expect(page.getByRole("button", { name: "Line evaluated" })).toBeDisabled();
  await expect(page.locator(".residual-square")).toHaveCount(30);
  await expect(page.locator(".moving-squared-error")).toHaveCount(30);
  await expect(page.locator(".moving-residual-token")).toHaveCount(30);
  await expect(page.getByText("Residuals from the current line")).toHaveAttribute("x", "62");
  await expect(page.getByText("Sum of squared errors", { exact: true })).toHaveAttribute("x", "630");
  await expect(page.getByText("Negative means below the line; positive means above the line.")).toHaveCount(0);
});

test("runs the automatic sequence at normal animation speed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/concepts/least-squares");

  await page.getByRole("button", { name: "Find best-fitting line" }).click();
  await expect(page.getByRole("button", { name: "Evaluating line…" })).toBeDisabled({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: "Best fit found" })).toBeDisabled({ timeout: 5_000 });
  await expect(page.getByText("The current line’s signed residuals are moving onto the residual axis.")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".moving-squared-error")).toHaveCount(0);
  await expect(page.getByText("The residual squares are collecting into the current line’s total SSE.")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".moving-residual-token")).toHaveCount(30);
  await expect(page.getByRole("button", { name: "Line evaluated" })).toBeDisabled({ timeout: 5_000 });
  await expect(page.locator(".moving-squared-error")).toHaveCount(30);
  await expect(page.locator(".moving-residual-token")).toHaveCount(30);
});

test("uses the lecture-aligned masseter and bite-force example by default", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/least-squares");

  await expect(page.getByLabel("Teaching scenario")).toHaveValue("masseter-bite-force");
  await expect(page.getByLabel("Teaching scenario").locator("option")).toHaveCount(3);
  await expect(page.getByText("Average masseter thickness (mm)", { exact: true })).toBeVisible();
  await expect(page.getByText("Maximum bite force (N)", { exact: true })).toBeVisible();
  await expect(page.getByText("mean of y = 438", { exact: true })).toBeVisible();
  await expect(page.locator(".observation-point")).toHaveCount(30);
});
