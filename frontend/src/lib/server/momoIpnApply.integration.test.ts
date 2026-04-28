import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyVerifiedMomoIpn } from "./momoIpnApply";

/**
 * 실 DB 멱등 검증 — 로컬/CI에서만 실행.
 *
 * 환경 변수 `INTEGRATION_DATABASE_URL`
 * - **대시보드에서 복사한 전체 URI** (예: `postgresql://postgres.xxx:PASSWORD@...host...:5432/postgres` 같은 **완성 문자열**).
 * - 문서 예시의 `postgresql://...` 는 플레이스홀더이며, 그대로 넣으면 연결되지 않습니다.
 * - Supabase에서 `db.xxx.supabase.co` 직결이 PC에서 안 될 때는, `prisma migrate deploy`에 썼던 것과 동일한 **Session pooler `:5432`** URI를 쓰면 됩니다 (`frontend/.env` 의 `DIRECT_URL` 과 동일 값 복사).
 * - 아래 코드가 `sslmode`가 없으면 `?sslmode=require` 또는 `&sslmode=require`를 붙입니다.
 *
 * PowerShell (한 줄, `frontend` 폴더에서 — 이미 `...\frontend` 안이면 `cd frontend` 하지 말 것):
 *   $env:INTEGRATION_DATABASE_URL="<여기에 붙여넣기>"
 *   npm run test:integration
 *
 * 기본 `npm test`에는 포함되지 않음(vitest 설정에서 제외).
 */
function ensureSslModeForPostgresUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return u;
  if (/\bsslmode\s*=/i.test(u)) return u;
  return u.includes("?") ? `${u}&sslmode=require` : `${u}?sslmode=require`;
}

/** 안내 문장을 통째로 넣는 실수를 빨리 걸러낸다. */
function assertValidPostgresIntegrationUrl(raw: string): string {
  const u = raw.trim();
  if (!/^postgres(ql)?:\/\//i.test(u)) {
    throw new Error(
      [
        "INTEGRATION_DATABASE_URL 은 postgresql:// 또는 postgres:// 로 시작하는 실제 연결 문자열이어야 합니다.",
        "",
        "- `frontend/.env` 파일에서 DIRECT_URL 의 값만 통째로 복사해 넣으세요 (변수 이름 DIRECT_URL= 은 제외).",
        "- 아래 한글/밑줄 예시 전체(`여기에_방금_복사한_값_통째로_붙여넣기`)는 설명용이지, 그대로 입력하면 안 됩니다. `.env` 에서 `postgresql://` 로 시작하는 한 줄을 복사하세요.",
        "- PowerShell 현재 폴더가 `...\\frontend` 인지 확인하세요 (`...\\frontend\\frontend` 에서 실행하면 패키지/경로가 꼬일 수 있음).",
        "",
        `받은 값 앞 80자: ${u.slice(0, 80)}${u.length > 80 ? "…" : ""}`,
      ].join("\n"),
    );
  }
  return u;
}
const url = process.env.INTEGRATION_DATABASE_URL?.trim();

describe.skipIf(!url)("applyVerifiedMomoIpn — DB 멱등 (INTEGRATION_DATABASE_URL)", () => {
  let testDb: PrismaClient | undefined;
  const suffix = randomUUID().slice(0, 8);
  const ownerId = `itest_owner_${suffix}`;
  const guestId = `itest_guest_${suffix}`;
  const propertyId = randomUUID();
  const bookingId = randomUUID();
  const paymentId = `itest_pay_${suffix}`;
  const orderId = `momo_order_${suffix}`;
  const transId = `momo_trans_${suffix}`;

  beforeAll(() => {
    const validated = assertValidPostgresIntegrationUrl(url!);
    testDb = new PrismaClient({
      datasources: { db: { url: ensureSslModeForPostgresUrl(validated) } },
    });
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("동일 transId 두 번 적용 시 MomoIpnReceipt 는 1건만 있고 두 번째는 duplicate", async () => {
    if (!testDb) {
      throw new Error("Prisma client not initialized (beforeAll failed)");
    }
    const db = testDb;
    await db.user.createMany({
      data: [
        { id: ownerId, role: "guest" },
        { id: guestId, role: "guest" },
      ],
    });

    await db.property.create({
      data: {
        id: propertyId,
        title: "integration test",
        price: 1,
        area: 1,
        address: "test",
        ownerId,
        images: [],
        amenities: [],
      },
    });

    await db.booking.create({
      data: {
        id: bookingId,
        propertyId,
        guestId,
        checkInDate: new Date("2026-06-01T00:00:00.000Z"),
        checkOutDate: new Date("2026-06-03T00:00:00.000Z"),
        totalPrice: 100000,
        status: "pending",
      },
    });

    await db.paymentRecord.create({
      data: {
        id: paymentId,
        bookingId,
        userId: guestId,
        amount: 100000,
        currency: "vnd",
        status: "pending",
        externalPaymentId: orderId,
      },
    });

    try {
      const first = await applyVerifiedMomoIpn(
        {
          orderId,
          transId,
          resultCode: 0,
          amount: 100000,
        },
        { prisma: db },
      );
      expect(first.outcome).toBe("applied");

      const second = await applyVerifiedMomoIpn(
        {
          orderId,
          transId,
          resultCode: 0,
          amount: 100000,
        },
        { prisma: db },
      );
      expect(second.outcome).toBe("duplicate");

      const rows = await db.$queryRawUnsafe<Array<{ c: bigint }>>(
        `SELECT COUNT(*)::bigint AS c FROM "MomoIpnReceipt" WHERE "transId" = $1`,
        transId,
      );
      expect(Number(rows[0]?.c ?? 0)).toBe(1);
    } finally {
      await db.paymentRecord.deleteMany({ where: { id: paymentId } });
      await db.booking.deleteMany({ where: { id: bookingId } });
      await db.property.deleteMany({ where: { id: propertyId } });
      await db.user.deleteMany({ where: { id: { in: [ownerId, guestId] } } });
    }
  });
});
