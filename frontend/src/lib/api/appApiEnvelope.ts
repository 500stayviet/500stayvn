/**
 * `/api/app/*` 성공 봉투 `{ ok: true, data }` 와 레거시(평면) JSON 겸용.
 */

/** 실패 봉투·레거시 `{ error: { code?, message? } }` 에서 사용자 메시지 후보 추출. */
export function messageFromAppApiFailureJson(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as {
    ok?: boolean;
    error?: { code?: string; message?: string };
  };
  if (o.ok === false && o.error) {
    return o.error.message || o.error.code;
  }
  if ("error" in o && o.error && typeof o.error === "object") {
    const e = o.error as { code?: string; message?: string };
    return e.message || e.code;
  }
  return undefined;
}

export function unwrapAppApiData<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === 'object' &&
    'ok' in json &&
    (json as { ok: unknown }).ok === true &&
    'data' in json &&
    (json as { data: unknown }).data !== undefined
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}
