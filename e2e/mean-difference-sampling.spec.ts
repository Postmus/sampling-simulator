import { expect, test } from "@playwright/test";

test("builds a Gel X sampling distribution from one mean difference per experiment", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/mean-difference-sampling");

  await expect(page.getByRole("heading", { name: "Sampling distribution of a mean difference" })).toBeVisible();
  await expect(page.getByLabel("Vehicle mean (%)")).toHaveValue("56");
  await expect(page.getByLabel("True Gel X effect (pp)")).toHaveValue("10");
  await expect(page.getByLabel("Within-group SD (pp)")).toHaveValue("13.2");
  await expect(page.getByLabel("Animals per group")).toHaveValue("12");
  await expect(page.locator('[data-role="theoretical-se"]')).toHaveText("5.4");

  await page.getByRole("button", { name: "Run 1 experiment" }).click();
  await expect(page.locator('[data-role="experiment-count"]')).toHaveText("1");
  await expect(page.locator(".mean-difference-sample-point.vehicle")).toHaveCount(12);
  await expect(page.locator(".mean-difference-sample-point.gelX")).toHaveCount(12);
  await expect(page.locator(".mean-difference-histogram-bar")).toHaveCount(1);
  await expect(page.locator('[data-role="latest-difference"]')).not.toHaveText("—");
});

test("supports fast repeated experiments and Dutch teaching copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/concepts/mean-difference-sampling");

  await page.getByRole("button", { name: "Generate 100" }).click();
  await expect(page.locator('[data-role="experiment-count"]')).toHaveText("100");
  await expect(page.getByText("100 experiments were generated quickly. Every experiment contributed exactly one mean difference.")).toBeVisible();

  await page.getByLabel("Language").selectOption("nl");
  await expect(page.getByRole("heading", { name: "Steekproevenverdeling van een verschil tussen gemiddelden" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voer 1 experiment uit" })).toBeVisible();
  await expect(page.getByText("1  Twee vaste behandelingspopulaties", { exact: true })).toBeVisible();
});
