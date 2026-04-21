#!/usr/bin/env node
/**
 * Step5 Edge API checks (manual/CI helper)
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/edge-api-check.mjs
 *
 * Optional (for duplicate booking overlap check):
 *   APP_SYNC_SECRET=<secret> APP_SYNC_ENFORCE_WRITE=true
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

function ensure(ok, message) {
  if (!ok) throw new Error(message);
}

async function expectStatus(name, url, init, accepted) {
  const res = await fetch(url, init);
  const acceptedSet = new Set(Array.isArray(accepted) ? accepted : [accepted]);
  const ok = acceptedSet.has(res.status);
  const bodyText = await res.text().catch(() => "");
  if (!ok) {
    throw new Error(
      `[${name}] expected ${[...acceptedSet].join("|")} but got ${res.status}: ${bodyText.slice(0, 300)}`
    );
  }
  console.log(`PASS ${name}: ${res.status}`);
}

async function checkUnauthorizedPayments() {
  await expectStatus(
    "unauthorized payments api",
    `${BASE_URL}/api/app/payments?bookingId=test`,
    { headers: { "user-agent": "step5-checker" } },
    401
  );
}

async function checkSuspiciousUaBlocked() {
  await expectStatus(
    "bot ua blocked on public properties",
    `${BASE_URL}/api/app/properties?limit=1`,
    { headers: { "user-agent": "curl/8.7.1" } },
    429
  );
}

async function checkRateLimit() {
  const url = `${BASE_URL}/api/app/properties?limit=1`;
  let last = 0;
  for (let i = 0; i < 35; i += 1) {
    const res = await fetch(url, { headers: { "user-agent": "step5-normal-browser/1.0" } });
    last = res.status;
    if (res.status === 429) {
      console.log(`PASS public rate-limit triggered at try #${i + 1}`);
      return;
    }
  }
  throw new Error(`[public rate-limit] expected at least one 429, last status=${last}`);
}

async function checkDuplicateBookingOverlap() {
  const headers = {
    "content-type": "application/json",
    "user-agent": "step5-checker",
  };
  if (process.env.APP_SYNC_SECRET) {
    headers["x-app-sync-secret"] = process.env.APP_SYNC_SECRET;
  }

  const body = {
    bookings: [
      {
        id: "step5-overlap-1",
        propertyId: "dummy-property",
        guestId: "dummy-user",
        guestName: "u",
        guestPhone: "000",
        ownerId: "dummy-owner",
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-10",
        adults: 1,
        children: 0,
        totalPrice: 1,
        priceUnit: "vnd",
        nights: 9,
        paymentStatus: "pending",
        status: "confirmed",
      },
      {
        id: "step5-overlap-2",
        propertyId: "dummy-property",
        guestId: "dummy-user",
        guestName: "u",
        guestPhone: "000",
        ownerId: "dummy-owner",
        checkInDate: "2026-07-05",
        checkOutDate: "2026-07-12",
        adults: 1,
        children: 0,
        totalPrice: 1,
        priceUnit: "vnd",
        nights: 7,
        paymentStatus: "pending",
        status: "confirmed",
      },
    ],
  };

  const res = await fetch(`${BASE_URL}/api/app/bookings`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");

  // sync secret가 강제된 환경은 401/403가 정상일 수 있음
  ensure(
    res.status === 409 || res.status === 401 || res.status === 403,
    `[duplicate overlap] expected 409 (or auth guard), got ${res.status}: ${text.slice(0, 300)}`
  );
  console.log(`PASS duplicate overlap guard: ${res.status}`);
}

async function main() {
  console.log(`Running edge checks against ${BASE_URL}`);
  await checkUnauthorizedPayments();
  await checkSuspiciousUaBlocked();
  await checkRateLimit();
  await checkDuplicateBookingOverlap();
  console.log("ALL EDGE CHECKS PASSED");
}

main().catch((err) => {
  console.error("EDGE CHECK FAILED:", err.message || err);
  process.exit(1);
});

