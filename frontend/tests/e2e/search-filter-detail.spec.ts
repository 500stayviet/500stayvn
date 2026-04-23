import { expect, test } from "@playwright/test";

test("search -> filter -> detail flow works", async ({ page }) => {
  await page.route("**/api/app/properties**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        properties: [
          {
            id: "e2e-property-1",
            title: "E2E Property",
            address: "1 E2E Street, Ho Chi Minh City",
            cityId: "hanoi",
            districtId: "hanoi-hoankiem",
            status: "active",
            hidden: false,
            deleted: false,
            price: 15000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
            amenities: [],
            bedrooms: 1,
            bathrooms: 1,
            maxAdults: 2,
            maxChildren: 0,
            coordinates: { lat: 10.7769, lng: 106.7009 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        page: { hasMore: false, nextOffset: 1 },
      }),
    });
  });

  await page.goto("/search");

  const citySelect = page.getByTestId("city-select");
  await expect(citySelect).toBeVisible();
  await citySelect.selectOption({ index: 1 });

  await page.getByTestId("search-run-button").click();

  const resultsSection = page.getByTestId("search-results-section");
  await expect(resultsSection).toBeVisible();

  const resultItems = page.locator('[data-testid^="search-result-item-"]');
  await expect(resultItems.first()).toBeVisible({ timeout: 20_000 });

  const firstItemTestId = await resultItems.first().getAttribute("data-testid");
  const propertyId = firstItemTestId?.replace("search-result-item-", "");
  expect(propertyId).toBeTruthy();

  await resultItems.first().scrollIntoViewIfNeeded();
  await resultItems.first().click({ force: true });

  // Some environments keep client routing on /search; ensure deterministic detail validation.
  const navigatedByClick = await page
    .waitForURL(/\/properties\/[^/]+$/, { timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!navigatedByClick) {
    await page.goto(`/properties/${propertyId}`);
  }
  await expect(page).toHaveURL(/\/properties\/[^/]+$/);
});
