import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
  },
}));

describe("applyVerifiedMomoIpn — prelude 조회만", () => {
  it("외부 주문번호에 매칭되는 Payment 가 없으면 not_found 이며 트랜잭션을 시작하지 않는다", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { applyVerifiedMomoIpn } = await import("./momoIpnApply");
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([]);
    const r = await applyVerifiedMomoIpn({
      orderId: "ghost-order",
      transId: "ghost-trans",
      resultCode: 0,
    });
    expect(r).toEqual({ outcome: "not_found" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
