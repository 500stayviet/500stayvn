import { expect, test } from "@playwright/test";

const ownerId = "mock-owner-e2e";
const guestId = "mock-guest-e2e";
const propertyId = "mock-property-1";

async function seedAuthenticatedUser(
  page: import("@playwright/test").Page,
  options?: { kycSteps?: { step1?: boolean; step2?: boolean; step3?: boolean }; phoneNumber?: string },
) {
  const kycSteps = options?.kycSteps ?? { step1: true, step2: true, step3: true };
  const phoneNumber = options?.phoneNumber ?? "+84123456789";
  await page.context().addCookies([
    {
      name: "stayviet_app_uid",
      value: guestId,
      url: "http://127.0.0.1:3010",
    },
  ]);

  await page.addInitScript(
    ({
      uid,
      kyc: ks,
      phone: tel,
    }: {
      uid: string;
      kyc: { step1: boolean; step2: boolean; step3: boolean };
      phone: string;
    }) => {
      const users = [
        {
          uid,
          email: "mock-guest@test.com",
          displayName: "Mock Guest",
          preferredLanguage: "en",
          phoneNumber: tel,
          kyc_steps: ks,
        },
      ];
      window.localStorage.setItem("users", JSON.stringify(users));
      window.localStorage.setItem("currentUser", uid);
      document.cookie = `stayviet_app_uid=${encodeURIComponent(uid)}; path=/`;
    },
    {
      uid: guestId,
      kyc: {
        step1: kycSteps.step1 ?? false,
        step2: kycSteps.step2 ?? false,
        step3: kycSteps.step3 ?? false,
      },
      phone: phoneNumber,
    },
  );
}

async function mockCommonSessionApis(
  page: import("@playwright/test").Page,
  options?: {
    /** KYC test 등: API가 LS를 덮어쓰기 전에 `loadKyc`와 맞출 것 */
    kycStepsInApiResponse?: { step1: boolean; step2: boolean; step3: boolean };
  },
) {
  const kyc_steps = options?.kycStepsInApiResponse ?? {
    step1: true,
    step2: true,
    step3: true,
  };
  await page.route("**/api/auth/session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: guestId, email: "mock-guest@test.com", name: "Mock Guest" },
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
            uid: guestId,
            email: "mock-guest@test.com",
            displayName: "Mock Guest",
            preferredLanguage: "en",
            phoneNumber: "+84123456789",
            kyc_steps,
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
        bookings: [],
        page: { hasMore: false, nextOffset: 0 },
      }),
    });
  });

  await page.route("**/api/app/properties**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        properties: [],
        page: { hasMore: false, nextOffset: 0 },
      }),
    });
  });

  await page.route("**/api/app/chat/unread-counts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ counts: {} }),
    });
  });

  // 결제/환불 PATCH가 환경에 따라 호출될 때 서버 `transition` + appApi 래퍼 형식 유지
  await page.route("**/api/app/payments**", async (route) => {
    const m = route.request().method();
    if (m === "POST" || m === "PATCH") {
      await route.fulfill({
        status: m === "POST" ? 201 : 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            payment: { id: "e2e-mock-payment" },
            transition: { bookingConfirmed: true, bookingCancelled: false },
          },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { payments: [] },
      }),
    });
  });
}

async function mockPropertyApis(page: import("@playwright/test").Page) {
  await page.route(`**/api/app/properties/${propertyId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        property: {
          id: propertyId,
          ownerId,
          title: "Mock Property",
          address: "1 Mock Street",
          status: "active",
          deleted: false,
          hidden: false,
          price: 12000000,
          priceUnit: "vnd",
          checkInTime: "14:00",
          checkOutTime: "12:00",
          petFee: 100000,
          images: ["/icon-512x512.png"],
        },
      }),
    });
  });
}

test("profile edit shows OTP error in mockScenario=fail", async ({ page }) => {
  await seedAuthenticatedUser(page);
  await mockCommonSessionApis(page);

  await page.goto("/profile/edit?mockScenario=fail");
  await page.getByRole("button", { name: /change/i }).nth(1).click();

  await page.getByPlaceholder("Enter phone number").fill("0123456789");
  await page.getByRole("button", { name: "Send OTP" }).click();

  await expect(page.locator("div.bg-red-50").first()).toContainText(
    /mock_otp_send_failed|Failed to send OTP/,
  );
});

test("booking flow shows payment-fail alert in mockScenario=fail", async ({ page }) => {
  await seedAuthenticatedUser(page);
  await mockCommonSessionApis(page);
  await mockPropertyApis(page);

  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });

  await page.goto(
    `/booking?propertyId=${propertyId}&checkIn=2026-05-01&checkOut=2026-05-08&guests=1&mockScenario=success`,
  );

  await page.locator('input[type="text"]').first().fill("Mock Guest");
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /결제 단계로 이동|Continue to Payment/i }).click();
  await expect(page.getByText(/결제 수단 선택|Chọn phương thức thanh toán/)).toBeVisible();

  await page.getByRole("button", { name: "MoMo" }).click();
  await page.locator('input[type="checkbox"]').last().check();

  await page.evaluate(() => {
    const next = new URL(window.location.href);
    next.searchParams.set("mockScenario", "fail");
    window.history.replaceState({}, "", next.toString());
  });

  await page.getByRole("button", { name: /결제하기|Thanh toán/ }).click();
  await expect.poll(() => alerts.some((m) => m.includes("결제 처리에 실패했습니다."))).toBeTruthy();
});

test("booking flow with mockScenario=partial does not reach success page", async ({ page }) => {
  await seedAuthenticatedUser(page);
  await mockCommonSessionApis(page);
  await mockPropertyApis(page);

  await page.goto(
    `/booking?propertyId=${propertyId}&checkIn=2026-05-01&checkOut=2026-05-08&guests=1&mockScenario=partial`,
  );

  await page.locator('input[type="text"]').first().fill("Mock Guest");
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /결제 단계로 이동|Continue to Payment/i }).click();
  await expect(page.getByText(/결제 수단 선택|Chọn phương thức thanh toán/)).toBeVisible();

  await page.getByRole("button", { name: "MoMo" }).click();
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole("button", { name: /결제하기|Thanh toán/ }).click();

  await expect.poll(() => /\/booking-success/.test(page.url())).toBeFalsy();
  await expect(page).toHaveURL(/\/$|\/booking\?/);
});

test("kyc shows step2 failure in mockScenario=partial", async ({ page }) => {
  const kyc = { step1: true, step2: false, step3: false } as const;
  await seedAuthenticatedUser(page, {
    kycSteps: { ...kyc },
    phoneNumber: "+84123456789",
  });
  await mockCommonSessionApis(page, { kycStepsInApiResponse: { ...kyc } });

  await page.goto("/kyc?mockScenario=partial");

  await expect(
    page.getByRole("heading", { name: /ID Capture|신분증 촬영|Chụp ảnh giấy tờ/ }),
  ).toBeVisible({ timeout: 20_000 });

  await page
    .getByRole("button", { name: /Next \(Test Mode\)|다음 \(테스트 모드\)/ })
    .click();
  await expect(page.getByText("mock_kyc_id_failed")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ID Capture|신분증 촬영|Chụp ảnh giấy tờ/ }),
  ).toBeVisible();
});

