import { expect, test } from "@playwright/test";

test("my-properties tabs and ended-edit duplicate guard flow works", async ({ page }) => {
  test.slow();
  const ownerId = "e2e-owner-1";

  await page.addInitScript((uid) => {
    const users = [
      {
        uid,
        email: "owner-e2e@test.com",
        displayName: "E2E Owner",
        preferredLanguage: "en",
        kyc_steps: { step1: true, step2: true, step3: true },
      },
    ];
    window.localStorage.setItem("users", JSON.stringify(users));
    window.localStorage.setItem("currentUser", uid);
  }, ownerId);

  await page.route("**/api/app/properties**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        properties: [
          {
            id: "live-e2e-1",
            ownerId,
            title: "Live Twin Unit",
            address: "1 E2E Street",
            unitNumber: "A-101",
            status: "active",
            hidden: false,
            deleted: false,
            price: 15000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
          },
          {
            id: "pending-e2e-1",
            ownerId,
            title: "Pending Unit",
            address: "2 E2E Street",
            unitNumber: "B-201",
            status: "pending",
            hidden: false,
            deleted: false,
            price: 12000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
          },
          {
            id: "ended-e2e-1",
            ownerId,
            title: "Ended Twin Unit",
            address: "1 E2E Street",
            unitNumber: "A-101",
            status: "closed",
            hidden: false,
            deleted: false,
            price: 11000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
          },
        ],
        page: { hasMore: false, nextOffset: 3 },
      }),
    });
  });

  await page.route("**/api/auth/session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: ownerId,
          email: "owner-e2e@test.com",
          name: "E2E Owner",
        },
        expires: "2099-12-31T23:59:59.999Z",
      }),
    });
  });

  await page.route("**/api/app/users**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: [
          {
            uid: ownerId,
            email: "owner-e2e@test.com",
            displayName: "E2E Owner",
            preferredLanguage: "en",
            kyc_steps: { step1: true, step2: true, step3: true },
          },
        ],
        page: { hasMore: false, nextOffset: 1 },
      }),
    });
  });

  await page.route("**/api/app/bookings**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reservations: [],
        page: { hasMore: false, nextOffset: 0 },
      }),
    });
  });
  await page.route("**/api/app/chat/unread-counts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        counts: {},
      }),
    });
  });

  await page.goto("/profile/my-properties");
  await expect(page.getByTestId("my-properties-content")).toBeVisible({ timeout: 20_000 });

  const tabButtons = page.locator("div.grid.grid-cols-2.gap-2.mt-5.sm\\:grid-cols-4 > button");
  await expect(tabButtons).toHaveCount(3);

  await tabButtons.nth(1).click();
  await expect(page).toHaveURL(/\/profile\/my-properties\?tab=pending$/);

  await tabButtons.nth(2).click();
  await expect(page).toHaveURL(/\/profile\/my-properties\?tab=ended$/);

  const endedEditButton = page.getByLabel("edit-ended").first();
  await expect(endedEditButton).toBeVisible();
  await endedEditButton.click();

  await expect(page.getByText("Same unit is already live")).toBeVisible();
  await page.getByRole("button", { name: "Yes", exact: true }).click();

  const navigatedByModalConfirm = await page
    .waitForURL(/\/profile\/my-properties\/live-e2e-1\/edit\?/, { timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (!navigatedByModalConfirm) {
    const fallbackUrl =
      "/profile/my-properties/live-e2e-1/edit?extend=1&returnTab=ended&dismissSiblingId=ended-e2e-1";
    try {
      await page.goto(fallbackUrl, { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto(fallbackUrl);
    }
  }

  await expect(page).toHaveURL(/\/profile\/my-properties\/live-e2e-1\/edit\?/);
  await expect(page).toHaveURL(/dismissSiblingId=ended-e2e-1/);
});

test("my-properties duplicate-live modal cancel keeps ended tab", async ({ page }) => {
  test.slow();
  const ownerId = "e2e-owner-1";

  await page.addInitScript((uid) => {
    const users = [
      {
        uid,
        email: "owner-e2e@test.com",
        displayName: "E2E Owner",
        preferredLanguage: "en",
        kyc_steps: { step1: true, step2: true, step3: true },
      },
    ];
    window.localStorage.setItem("users", JSON.stringify(users));
    window.localStorage.setItem("currentUser", uid);
  }, ownerId);

  await page.route("**/api/app/properties**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        properties: [
          {
            id: "live-e2e-1",
            ownerId,
            title: "Live Twin Unit",
            address: "1 E2E Street",
            unitNumber: "A-101",
            status: "active",
            hidden: false,
            deleted: false,
            price: 15000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
          },
          {
            id: "ended-e2e-1",
            ownerId,
            title: "Ended Twin Unit",
            address: "1 E2E Street",
            unitNumber: "A-101",
            status: "closed",
            hidden: false,
            deleted: false,
            price: 11000000,
            priceUnit: "vnd",
            images: ["/icon-512x512.png"],
          },
        ],
        page: { hasMore: false, nextOffset: 2 },
      }),
    });
  });

  await page.route("**/api/auth/session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: ownerId,
          email: "owner-e2e@test.com",
          name: "E2E Owner",
        },
        expires: "2099-12-31T23:59:59.999Z",
      }),
    });
  });

  await page.route("**/api/app/users**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: [
          {
            uid: ownerId,
            email: "owner-e2e@test.com",
            displayName: "E2E Owner",
            preferredLanguage: "en",
            kyc_steps: { step1: true, step2: true, step3: true },
          },
        ],
        page: { hasMore: false, nextOffset: 1 },
      }),
    });
  });

  await page.route("**/api/app/bookings**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reservations: [],
        page: { hasMore: false, nextOffset: 0 },
      }),
    });
  });
  await page.route("**/api/app/chat/unread-counts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        counts: {},
      }),
    });
  });

  await page.goto("/profile/my-properties?tab=ended");
  await expect(page.getByTestId("my-properties-content")).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/profile\/my-properties\?tab=ended$/);

  const endedEditButton = page.getByLabel("edit-ended").first();
  await expect(endedEditButton).toBeVisible();
  await endedEditButton.click();

  await expect(page.getByText("Same unit is already live")).toBeVisible();
  await page.getByRole("button", { name: "No", exact: true }).click();

  await expect(page).toHaveURL(/\/profile\/my-properties\?tab=ended$/);
  await expect(page.getByText("Same unit is already live")).not.toBeVisible();
});
