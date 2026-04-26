import {
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";
import { unwrapAppApiData } from "@/lib/api/appApiEnvelope";

export type ParsedAppPaymentSuccess = { ok: true; data: unknown };

export type ParsedAppPaymentFailure = {
  ok: false;
  errorMessage: string;
  code?: string;
  status: number;
};

export type ParsedAppPaymentResponse = ParsedAppPaymentSuccess | ParsedAppPaymentFailure;

/** PATCH `/api/app/payments/[bookingId]` 의 `data.transition` (서버 `transitionBookingOnPaymentUpdate`) */
export type PaymentServerTransition = {
  bookingConfirmed: boolean;
  bookingCancelled: boolean;
};

export function parsePaymentPatchData(data: unknown): {
  transition: PaymentServerTransition;
} {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const t = d.transition;
  if (t && typeof t === "object") {
    const tr = t as Record<string, unknown>;
    return {
      transition: {
        bookingConfirmed: tr.bookingConfirmed === true,
        bookingCancelled: tr.bookingCancelled === true,
      },
    };
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[payments] PATCH data missing transition; assuming no booking state change",
      data,
    );
  }
  return { transition: { bookingConfirmed: false, bookingCancelled: false } };
}

/**
 * `/api/app/payments` 및 미들웨어 응답을 통일 파싱.
 * - 라우트 성공: `{ ok: true, data }`
 * - 라우트 실패: `{ ok: false, error: { code, message } }`
 * - 미들웨어 401: `{ "error": "unauthorized" }` (ok 필드 없음)
 */
export async function parseAppPaymentResponse(
  res: Response,
): Promise<ParsedAppPaymentResponse> {
  const text = await res.text();
  let obj: Record<string, unknown> = {};
  try {
    if (text) obj = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      errorMessage: "서버 응답을 해석할 수 없습니다.",
      status: res.status,
    };
  }

  if (res.ok) {
    return { ok: true, data: unwrapAppApiData<unknown>(obj) };
  }

  if (res.status === 401 && (obj as { error?: string }).error === "unauthorized") {
    return {
      ok: false,
      errorMessage: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      code: "unauthorized",
      status: 401,
    };
  }

  if (obj.ok === false && obj.error && typeof obj.error === "object") {
    const e = obj.error as { code?: string; message?: string };
    return {
      ok: false,
      errorMessage: e.message || e.code || "요청이 거절되었습니다.",
      code: e.code,
      status: res.status,
    };
  }

  return {
    ok: false,
    errorMessage: `요청 실패 (HTTP ${res.status})`,
    status: res.status,
  };
}
