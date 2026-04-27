import { NextResponse } from 'next/server';

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
 * ## 다음 단계 (Phase 4)
 *
 * - 환경 변수로 웹훅 시크릿·허용 IP(해당 시) 로드.
 * - 검증 성공 후에만 Prisma 트랜잭션으로 Payment/Booking 상태 갱신.
 */
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  void rawBody;

  // TODO(Phase 4): signature verify(rawBody, headers) → parse → idempotent apply → PG가 기대하는 2xx
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'webhook_not_enabled',
        message: 'MoMo webhook is not enabled until Phase 4 provider configuration.',
      },
    },
    { status: 501 },
  );
}
