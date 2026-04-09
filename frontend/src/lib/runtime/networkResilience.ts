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
