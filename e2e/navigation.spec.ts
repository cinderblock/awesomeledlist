import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("Home page loads with category cards", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/LED|Awesome/);

    // Check category cards are visible
    await expect(page.locator('[data-category-card="controllers"]')).toBeVisible();
    await expect(page.locator('[data-category-card="pixels"]')).toBeVisible();
  });

  test("Navigate from Home to Controllers", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-category-card="controllers"]').click();

    await expect(page).toHaveURL(/\/controllers/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/controller/i);
  });

  test("Navigate from category to detail page", async ({ page }) => {
    await page.goto("/controllers");

    // Click first entry link
    const entryLink = page.locator('a[href^="/controllers/"]').first();
    await expect(entryLink).toBeVisible();
    await entryLink.click();

    // Should be on detail page
    await expect(page).toHaveURL(/\/controllers\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Navigate between categories via tabs", async ({ page }) => {
    await page.goto("/controllers");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/controller/i);

    // Click the pixels tab
    await page.locator('[data-category="pixels"]').click();

    // Wait for URL to update
    await expect(page).toHaveURL(/\/pixels/);

    // Wait for React to re-render the new category page
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/pixel/i);
  });

  test("Navigate back to home via logo", async ({ page }) => {
    await page.goto("/controllers");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/controller/i);

    // Click the logo
    await page.locator('header a[href="/"]').click();

    // Wait for URL to update and home page to render
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-category-card="controllers"]')).toBeVisible();
  });

  test("Navigate to About page", async ({ page }) => {
    await page.goto("/");

    await page.locator('a[href="/about"]').click();

    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Browser back button works", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-category-card="controllers"]').click();
    await expect(page).toHaveURL(/\/controllers/);

    await page.goBack();

    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-category-card="controllers"]')).toBeVisible();
  });
});
