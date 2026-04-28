import { NextResponse } from "next/server";
import {
  buildMomoIpnSignatureRawData,
  computeMomoIpnSignatureHmacHex,
  verifyMomoIpnSignatureHex,
} from "@/lib/payments/momoIpnSignature";
import {
  applyVerifiedMomoIpn,
  hashForWebhookLog,
  MomoIpnAmountMismatchError,
} from "@/lib/server/momoIpnApply";
import { AlreadyBookedConflictError } from "@/lib/server/paymentConfirmAvailability";
import { PaymentPatchIdempotencyConflictError } from "@/lib/server/paymentPatchIdempotency";

/**
 * MoMo(또는 동일 엔드포인트를 쓰는 PG) **인바운드 웹훅**.
 *
 * ## 멱등성 · 원장 (`momoIpnApply.ts`)
 *
 * Raw body로 서명 검증 → `MomoIpnReceipt.transId` 유니크로 중복 IPN 방지 →
 * `resolvePaymentPatchIdempotency`·`transitionBookingOnPaymentUpdate` 는 PATCH 결제와 동일 규약.
 * `PaymentRecord.externalPaymentId` 가 MoMo `orderId` 와 같아야 조회된다(결제 생성 시 설정).
 *
 * ## 성공 시 **204 No Content** (MoMo IPN 처리 후 기대 응답)
 *
 * ## 로그: 시크릿·서명 원문 노출 금지 — 해시 힌트만 사용.
 */
export const runtime = "nodejs";

const WEBHOOK_SECRET_ENV = "MOMO_PARTNER_SECRET_KEY";

function formatTransId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === "string") return value.trim();
  return "";
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  const secret = process.env[WEBHOOK_SECRET_ENV]?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "webhook_secret_not_configured",
          message:
            "MoMo webhook secret is not configured. Set MOMO_PARTNER_SECRET_KEY in the deployment environment.",
        },
      },
      { status: 501 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "invalid_json", message: "Request body is not valid JSON." },
      },
      { status: 400 },
    );
  }

  const providedSig = body.signature;
  if (typeof providedSig !== "string" || !providedSig.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "missing_signature",
          message: "MoMo IPN payload must include a signature field.",
        },
      },
      { status: 400 },
    );
  }

  const rawData = buildMomoIpnSignatureRawData(body);
  const expectedHex = computeMomoIpnSignatureHmacHex(secret, rawData);
  if (!verifyMomoIpnSignatureHex(providedSig, expectedHex)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_signature",
          message: "MoMo IPN signature verification failed.",
        },
      },
      { status: 401 },
    );
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const transId = formatTransId(body.transId);
  if (!orderId || !transId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "missing_order_or_trans_id",
          message: "MoMo IPN requires orderId and transId.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await applyVerifiedMomoIpn({
      orderId,
      transId,
      resultCode: body.resultCode,
      amount: body.amount,
    });

    if (result.outcome === "not_found") {
      console.warn("[momo_ipn] payment_row_missing", {
        orderHint: hashForWebhookLog(orderId),
        transHint: hashForWebhookLog(transId),
      });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "payment_order_not_found",
            message: "No PaymentRecord matches externalPaymentId for this IPN.",
          },
        },
        { status: 404 },
      );
    }

    console.info("[momo_ipn] ok", {
      outcome: result.outcome,
      transitionPaid: result.outcome === "applied" ? result.transitionPaid : undefined,
      orderHint: hashForWebhookLog(orderId),
      transHint: hashForWebhookLog(transId),
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof MomoIpnAmountMismatchError) {
      console.warn("[momo_ipn] amount_mismatch", {
        orderHint: hashForWebhookLog(orderId),
        transHint: hashForWebhookLog(transId),
      });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "amount_mismatch",
            message: "MoMo IPN amount does not match stored payment.",
          },
        },
        { status: 409 },
      );
    }
    if (e instanceof AlreadyBookedConflictError) {
      console.error("[momo_ipn] overlapping_confirmed_booking", {
        bookingId: e.bookingId,
        propertyId: e.propertyId,
        orderHint: hashForWebhookLog(orderId),
      });
      return NextResponse.json(
        { ok: false, error: { code: "already_booked", message: "Listing overlap on confirm." } },
        { status: 409 },
      );
    }
    if (e instanceof PaymentPatchIdempotencyConflictError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "idempotency_conflict",
            message: "Idempotency key reused with incompatible payment state.",
          },
        },
        { status: 409 },
      );
    }
    console.error("[momo_ipn] apply_failed", e);
    return NextResponse.json(
      { ok: false, error: { code: "webhook_apply_failed", message: "Could not apply MoMo IPN." } },
      { status: 503 },
    );
  }
}
