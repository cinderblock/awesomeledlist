import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("Search filters results and updates URL", async ({ page }) => {
    await page.goto("/pixels");

    const searchInput = page.getByPlaceholder("Search...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("ws281");

    await expect(searchInput).toHaveValue("ws281");
    await expect(page).toHaveURL(/q=ws281/);
  });

  test("Search input updates character by character", async ({ page }) => {
    await page.goto("/pixels");

    const searchInput = page.getByPlaceholder("Search...");
    await searchInput.click();

    await page.keyboard.type("ws281", { delay: 50 });

    await expect(searchInput).toHaveValue("ws281");
  });

  test("Clearing search removes URL param", async ({ page }) => {
    await page.goto("/pixels?q=test");

    const searchInput = page.getByPlaceholder("Search...");
    await searchInput.clear();

    await expect(page).not.toHaveURL(/q=/);
  });
});
