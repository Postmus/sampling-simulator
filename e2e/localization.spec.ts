import { expect, test } from "@playwright/test";

test("switches the complete lab to Dutch and persists the choice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/");

  await expect(page.getByRole("heading", { name: "Statistical Concepts Lab" })).toBeVisible();
  await page.getByLabel("Language").selectOption("nl");
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("heading", { name: "Statistieklab" })).toBeVisible();
  await expect(page.getByText("Beschikbare verkenningen")).toBeVisible();

  await page.getByRole("link").filter({ hasText: "Hoe kleinste kwadraten een lijn kiest" }).click();
  await expect(page.getByRole("heading", { name: "Hoe kiest de kleinste-kwadratenmethode een lijn?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Evalueer deze lijn" })).toBeEnabled();
  await expect(page.getByText("gemiddelde van y = 438", { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Helling" })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Taal")).toHaveValue("nl");
  await expect(page.getByRole("heading", { name: "Hoe kiest de kleinste-kwadratenmethode een lijn?" })).toBeVisible();

  await page.goto("/#/concepts/sampling-distribution");
  await expect(page.getByRole("heading", { name: "Steekproevenverdeling van het steekproefgemiddelde" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trek 1 steekproef" })).toBeVisible();
  await expect(page.getByText("1 Populatiemodel", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Genereer 100" }).click();
  await expect(page.getByText("100 steekproeven zijn snel gegenereerd. Iedere steekproef droeg precies één gemiddelde bij.")).toBeVisible();
  await expect(page.locator('[data-role="latest-mean"]')).toHaveText(/\d+,\d{2}/);

  await page.getByLabel("Taal").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Sampling distribution of the sample mean" })).toBeVisible();
  await expect(page.getByText("1 Population model", { exact: false })).toBeVisible();
});
