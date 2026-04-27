/**
 * `/api/app/*` 성공 봉투 `{ ok: true, data }` 와 레거시(평면) JSON 겸용.
 */

import type { SupportedLanguage } from "@/lib/api/translation";
import { formatUserFacingApiJson } from "@/lib/api/formatAppApiError";

/** 실패 봉투·레거시 `{ error: { code?, message? } }` → 현재 언어 사용자 메시지. */
export function messageFromAppApiFailureJson(
  json: unknown,
  language: SupportedLanguage = "en",
): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as { ok?: boolean; error?: unknown };
  if (o.ok === false && o.error && typeof o.error === "object") {
    return formatUserFacingApiJson(json, language);
  }
  if ("error" in o && o.error && typeof o.error === "object") {
    return formatUserFacingApiJson(json, language);
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
