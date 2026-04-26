export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  retryOnStatuses?: number[];
};

export type UserFacingSyncError = {
  area: "users" | "properties" | "bookings" | "generic";
  action: string;
  message: string;
};

const DEFAULT_RETRY_ON = [408, 425, 429, 500, 502, 503, 504];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 350;
  const retryOn = new Set(options.retryOnStatuses ?? DEFAULT_RETRY_ON);

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!retryOn.has(response.status) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }
    const delay = baseDelayMs * Math.pow(2, attempt);
    await sleep(delay);
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("network request failed");
}

export function emitUserFacingSyncError(error: UserFacingSyncError): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("stayviet-api-sync-error", {
        detail: error,
      }),
    );
  } catch {
    /* ignore event errors */
  }
}

/** 결제/동기화 성공 알림(상단 토스트) — `AppToastBanner`가 구독 */
export type UserFacingAppToast = {
  tone: "success" | "info";
  message: string;
  area?: "bookings" | "generic";
  action?: string;
};

export function emitUserFacingAppToast(toast: UserFacingAppToast): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("stayviet-app-toast", { detail: toast }),
    );
  } catch {
    /* ignore */
  }
}

/** 로그인 만료·권한·액터 헤더 문제(401/403) */
export function isClientAuthErrorStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/** 동기화 배너용 — 인증·권한 관련 실패 */
export const USER_FACING_CLIENT_AUTH_ERROR_MESSAGE =
  "오류가 발생했습니다. 잠시 후 다시 시도하거나 로그인을 확인해 주세요.";
