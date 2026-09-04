import { expect, test } from "@playwright/test";

test("compares an additive model with an interaction model at two torque values", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/interaction-model");

  await expect(page.getByRole("heading", { name: "Interaction: when groups have different slopes" })).toBeVisible();
  await expect(page.locator(".interaction-observation-point")).toHaveCount(96);
  await expect(page.locator(".interaction-fit-line")).toHaveCount(0);
  await expect(page.getByText(/Current model: No model fitted/)).toBeVisible();

  await page.getByRole("button", { name: "Fit additive model" }).click();
  await expect(page.locator(".interaction-fit-line")).toHaveCount(2);
  await expect(page.locator(".interaction-torque-guide")).toHaveCount(2);
  await expect(page.locator(".interaction-guide-marker")).toHaveCount(4);
  await expect(page.getByRole("slider", { name: "Torque A" })).toHaveValue("25");
  await expect(page.getByRole("slider", { name: "Torque B" })).toHaveValue("45");
  await expect(page.getByText("2.08 ISQ", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Estimated difference", { exact: true })).toHaveCount(2);
  await expect(page.getByText(/95% CI/)).toHaveCount(0);
  await expect(page.getByText("Same at A and B: parallel lines imply a constant jaw difference", { exact: true })).toBeVisible();
  await expect(page.locator(".ancova-model-result-block")).toHaveCount(1);

  const additiveLines = page.locator(".interaction-fit-line");
  const firstSlope = Number(await additiveLines.nth(0).getAttribute("y2")) - Number(await additiveLines.nth(0).getAttribute("y1"));
  const secondSlope = Number(await additiveLines.nth(1).getAttribute("y2")) - Number(await additiveLines.nth(1).getAttribute("y1"));
  expect(firstSlope).toBeCloseTo(secondSlope, 6);

  await page.getByRole("button", { name: "Add interaction term" }).click();
  await expect(page.getByText("-0.67 ISQ", { exact: true })).toBeVisible();
  await expect(page.getByText("4.55 ISQ", { exact: true })).toBeVisible();
  await expect(page.locator(".ancova-model-result-block")).toHaveCount(2);
  await expect(page.getByText("Estimated difference", { exact: true })).toHaveCount(4);
  await expect(page.getByText("0.26 ISQ / Ncm", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Does the product term improve the model?", { exact: true })).toHaveCount(0);
  await expect(page.locator(".interaction-coefficient-table")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Collapse comparison|Open comparison/ })).toHaveCount(0);

  const interactionLines = page.locator(".interaction-fit-line");
  const upperSlope = Number(await interactionLines.nth(0).getAttribute("y2")) - Number(await interactionLines.nth(0).getAttribute("y1"));
  const lowerSlope = Number(await interactionLines.nth(1).getAttribute("y2")) - Number(await interactionLines.nth(1).getAttribute("y1"));
  expect(upperSlope).not.toBeCloseTo(lowerSlope, 3);

  await page.getByRole("slider", { name: "Torque A" }).fill("30");
  await expect(page.getByText("0.64 ISQ", { exact: true })).toBeVisible();
  await expect(page.locator(".interaction-torque-guide")).toHaveCount(2);

  await page.getByRole("button", { name: "Show additive model" }).click();
  await expect(page.getByText("The fitted lines are parallel; compare their vertical gap at torque A and B.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show interaction model" }).click();
  await expect(page.getByText("The slopes now differ; compare how the jaw difference changes between torque A and B.", { exact: true })).toBeVisible();
  await expect(page.getByText("What to notice", { exact: true })).toHaveCount(0);
});
