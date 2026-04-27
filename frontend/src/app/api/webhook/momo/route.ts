import { NextResponse } from "next/server";
import {
  buildMomoIpnSignatureRawData,
  computeMomoIpnSignatureHmacHex,
  verifyMomoIpnSignatureHex,
} from "@/lib/payments/momoIpnSignature";

/**
 * MoMo(또는 동일 엔드포인트를 쓰는 PG) **인바운드 웹훅** — Phase 4 연동 전 골격.
 *
 * ## 멱등성 (Idempotency) — 중복 결제·중복 전이 방지
 *
 * 1. **Raw body 유지:** 서명은 `JSON.parse` 전에 **요청 바이트 그대로**로 검증한다.
 *    `request.json()`을 먼저 호출하면 HMAC이 깨진다. → `request.text()` 한 번만 읽고 검증·파싱에 공유.
 * 2. **이벤트 앵커:** PG가 주는 `orderId` / `transId` / `eventId` 등을 DB에 **유니크**로 저장하고,
 *    동일 키 재전송 시에는 **이미 적용한 결과와 동일한 응답**만 반환 (noop 멱등).
 * 3. **내부 원장:** 비즈니스 반영은 `paymentPatchIdempotency`·`bookingPaymentTransition` 등
 *    기존 PATCH 결제 멱등 계약과 **같은 idempotencyKey·전이 규칙**으로 합류할 것.
 *    설계: `frontend/SECURITY_APP_API_CHECKLIST.md` §멱등성, §결제 웹훅 연동 시.
 * 4. **로그:** 키·서명 전문은 로그에 남기지 말 것(마스킹·해시).
 *
 * ## MoMo IPN 서명 (골격)
 *
 * - 비밀키: `MOMO_PARTNER_SECRET_KEY` (또는 콘솔에서 발급한 partner **secretKey**; 실값은 배포 환경에만).
 * - 페이로드는 JSON이며 `signature` 필드가 포함된다. raw 문자열은 `momoIpnSignature.ts`의 필드 순서로 구성한다.
 * - Phase 4에서 샘플 트랜잭션으로 서명 일치를 반드시 확인한다.
 *
 * ## 다음 단계 (Phase 4)
 *
 * - 검증 성공 후에만 Prisma 트랜잭션으로 Payment/Booking 상태 갱신.
 * - MoMo는 처리 후 **HTTP 204**를 기대한다(15초 이내). 적용 구현 후 응답 코드 정합.
 */
export const runtime = "nodejs";

const WEBHOOK_SECRET_ENV = "MOMO_PARTNER_SECRET_KEY";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  const secret = process.env[WEBHOOK_SECRET_ENV]?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "webhook_secret_not_configured",
          message: "MoMo webhook secret is not configured. Set MOMO_PARTNER_SECRET_KEY in the deployment environment.",
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
      { ok: false, error: { code: "invalid_json", message: "Request body is not valid JSON." } },
      { status: 400 },
    );
  }

  const providedSig = body.signature;
  if (typeof providedSig !== "string" || !providedSig.trim()) {
    return NextResponse.json(
      { ok: false, error: { code: "missing_signature", message: "MoMo IPN payload must include a signature field." } },
      { status: 400 },
    );
  }

  const rawData = buildMomoIpnSignatureRawData(body);
  const expectedHex = computeMomoIpnSignatureHmacHex(secret, rawData);
  if (!verifyMomoIpnSignatureHex(providedSig, expectedHex)) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid_signature", message: "MoMo IPN signature verification failed." } },
      { status: 401 },
    );
  }

  // TODO(Phase 4): idempotent apply (orderId/transId anchor) → then respond 204 No Content per MoMo.
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "webhook_apply_not_enabled",
        message: "Signature verified, but payment webhook apply is not enabled until Phase 4.",
      },
    },
    { status: 501 },
  );
}
