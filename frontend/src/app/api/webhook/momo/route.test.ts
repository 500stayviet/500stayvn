import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMomoIpnSignatureRawData,
  computeMomoIpnSignatureHmacHex,
} from "@/lib/payments/momoIpnSignature";
import {
  applyVerifiedMomoIpn,
  MomoIpnAmountMismatchError,
} from "@/lib/server/momoIpnApply";
import { POST } from "./route";

vi.mock("@/lib/server/momoIpnApply", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/server/momoIpnApply")>();
  return {
    ...mod,
    applyVerifiedMomoIpn: vi.fn(),
  };
});

const SECRET = "unit-test-webhook-secret";
let prevSecret: string | undefined;

function signedMomoIpnWire(secret: string, fields: Record<string, unknown>): string {
  const rawData = buildMomoIpnSignatureRawData(fields);
  const sig = computeMomoIpnSignatureHmacHex(secret, rawData);
  return JSON.stringify({ ...fields, signature: sig });
}

function req(body: string) {
  return new Request("https://example.com/api/webhook/momo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/webhook/momo", () => {
  beforeEach(() => {
    prevSecret = process.env.MOMO_PARTNER_SECRET_KEY;
    process.env.MOMO_PARTNER_SECRET_KEY = SECRET;
    vi.mocked(applyVerifiedMomoIpn).mockReset();
    vi.mocked(applyVerifiedMomoIpn).mockResolvedValue({
      outcome: "applied",
      transitionPaid: false,
    });
  });

  afterEach(() => {
    if (prevSecret === undefined) {
      delete process.env.MOMO_PARTNER_SECRET_KEY;
    } else {
      process.env.MOMO_PARTNER_SECRET_KEY = prevSecret;
    }
  });

  it("비밀이 없으면 501 + JSON 본문", async () => {
    delete process.env.MOMO_PARTNER_SECRET_KEY;
    const raw = JSON.stringify({ orderId: "a", signature: "x" });
    const res = await POST(req(raw));
    expect(res.status).toBe(501);
    process.env.MOMO_PARTNER_SECRET_KEY = SECRET;
  });

  it("잘못된 JSON 이면 400", async () => {
    const res = await POST(req("not-json-at-all"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe("invalid_json");
  });

  it("signature 필드가 없으면 400", async () => {
    const wire = JSON.stringify({ orderId: "o", transId: "t" });
    const res = await POST(req(wire));
    expect(res.status).toBe(400);
    expect((await res.json()).error?.code).toBe("missing_signature");
  });

  it("서명이 틀리면 401", async () => {
    const fields = {
      orderId: "ord_wrong_sig",
      transId: "trans_1",
      resultCode: 0,
      amount: 99,
    };
    let wire = signedMomoIpnWire(SECRET, fields);
    const body = JSON.parse(wire) as Record<string, unknown>;
    body.signature = "deadbeef".repeat(8);
    wire = JSON.stringify(body);
    const res = await POST(req(wire));
    expect(res.status).toBe(401);
    expect((await res.json()).error?.code).toBe("invalid_signature");
  });

  it("정상 서명 + apply 적용 시 204 (본문 비어 있음)", async () => {
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "ord_ok",
      transId: "trans_ok",
      resultCode: 0,
      amount: 10000,
    });
    const res = await POST(req(wire));
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(vi.mocked(applyVerifiedMomoIpn)).toHaveBeenCalledTimes(1);
  });

  it("정상 서명 + apply 중복 결과여도 204", async () => {
    vi.mocked(applyVerifiedMomoIpn).mockResolvedValue({ outcome: "duplicate" });
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "idem",
      transId: "idem-t",
      resultCode: 0,
      amount: 1,
    });
    const res = await POST(req(wire));
    expect(res.status).toBe(204);
  });

  it("주문 매칭 결제 없으면 404", async () => {
    vi.mocked(applyVerifiedMomoIpn).mockResolvedValue({ outcome: "not_found" });
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "missing-pay",
      transId: "t2",
      resultCode: 0,
      amount: 1,
    });
    const res = await POST(req(wire));
    expect(res.status).toBe(404);
    expect((await res.json()).error?.code).toBe("payment_order_not_found");
  });

  it("금액 불일치면 409", async () => {
    vi.mocked(applyVerifiedMomoIpn).mockRejectedValue(new MomoIpnAmountMismatchError());
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "amt",
      transId: "t3",
      resultCode: 0,
      amount: 50,
    });
    const res = await POST(req(wire));
    expect(res.status).toBe(409);
    expect((await res.json()).error?.code).toBe("amount_mismatch");
  });

  it("서명 검증 후 orderId·transId 가 비면 400", async () => {
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "",
      transId: "",
      resultCode: 0,
      amount: 1,
    });
    const res = await POST(req(wire));
    expect(res.status).toBe(400);
    expect((await res.json()).error?.code).toBe("missing_order_or_trans_id");
  });

  it("동일 알림 재전송처럼 apply 가 duplicate 면 두 번째도 204", async () => {
    let call = 0;
    vi.mocked(applyVerifiedMomoIpn).mockImplementation(async () => {
      call += 1;
      return call === 1
        ? { outcome: "applied", transitionPaid: false }
        : { outcome: "duplicate" };
    });
    const wire = signedMomoIpnWire(SECRET, {
      orderId: "idem_twice",
      transId: "txn_twice",
      resultCode: 0,
      amount: 200,
    });
    expect((await POST(req(wire))).status).toBe(204);
    expect((await POST(req(wire))).status).toBe(204);
    expect(vi.mocked(applyVerifiedMomoIpn)).toHaveBeenCalledTimes(2);
  });
});
