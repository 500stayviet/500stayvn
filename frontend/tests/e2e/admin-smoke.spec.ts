import { expect, test } from "@playwright/test";

test("admin login page loads", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home loads with mock", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\//);
});
