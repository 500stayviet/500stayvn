import { unwrapAppApiData } from "@/lib/api/appApiEnvelope";
import { readStoredUiLanguage } from "@/lib/uiLanguageStorage";
import { getUIText } from "@/utils/i18n";

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
    const lang = readStoredUiLanguage();
    return {
      ok: false,
      errorMessage: getUIText("appPaymentErrUnparseableResponse", lang),
      status: res.status,
    };
  }

  if (res.ok) {
    return { ok: true, data: unwrapAppApiData<unknown>(obj) };
  }

  if (res.status === 401 && (obj as { error?: string }).error === "unauthorized") {
    const lang = readStoredUiLanguage();
    return {
      ok: false,
      errorMessage: getUIText("userFacingAuthOrSessionError", lang),
      code: "unauthorized",
      status: 401,
    };
  }

  if (obj.ok === false && obj.error && typeof obj.error === "object") {
    const e = obj.error as { code?: string; message?: string };
    const lang = readStoredUiLanguage();
    const fallback = getUIText("appPaymentErrRejected", lang);
    return {
      ok: false,
      errorMessage: e.message?.trim() || e.code || fallback,
      code: e.code,
      status: res.status,
    };
  }

  const lang = readStoredUiLanguage();
  return {
    ok: false,
    errorMessage: getUIText("appPaymentErrHttpStatus", lang).replace(
      /\{\{status\}\}/g,
      String(res.status),
    ),
    status: res.status,
  };
}
