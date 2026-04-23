import { expect, test } from "@playwright/test";

test("add property page is blocked for guest user", async ({ page }) => {
  await page.goto("/add-property");

  await page.waitForTimeout(1500);
  if (/\/login$/.test(page.url())) {
    await expect(page).toHaveURL(/\/login$/);
    return;
  }
  await expect(page.getByTestId("add-property-content")).toHaveCount(0);
});

test("my properties entry (edit path) is blocked for guest user", async ({
  page,
}) => {
  await page.goto("/profile/my-properties");

  await page.waitForTimeout(1500);
  if (/\/login$/.test(page.url())) {
    await expect(page).toHaveURL(/\/login$/);
    return;
  }
  await expect(page.getByTestId("my-properties-content")).toHaveCount(0);
});
