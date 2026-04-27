import type { SupportedLanguage } from "@/lib/api/translation";
import { getAppApiErrorMessageForCode } from "@/lib/api/i18nAppApiErrors";
import type { BaseUITextKey } from "@/utils/i18n";
import { getUIText } from "@/utils/i18n";

/**
 * 관리자 등 평면 JSON `{ error: "<code>" }` — 영문 스네이크 코드 → UI 번역 키.
 */
const ADMIN_FLAT_ERROR_TO_UI: Partial<Record<string, BaseUITextKey>> = {
  admin_account_invalid_input: "apiErrAdminAccountInvalidInput",
  admin_username_taken: "apiErrAdminUsernameTaken",
  admin_username_invalid: "apiErrAdminUsernameInvalid",
  admin_username_conflict: "apiErrAdminUsernameConflict",
  admin_new_password_too_short: "apiErrAdminNewPasswordTooShort",
  admin_current_password_invalid: "apiErrAdminCurrentPasswordInvalid",
  admin_cannot_demote_own_super: "apiErrAdminCannotDemoteOwnSuper",
  admin_cannot_demote_last_super: "apiErrAdminCannotDemoteLastSuper",
  admin_no_valid_updates: "apiErrAdminNoValidUpdates",
};

function extractAppApiFailureCode(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as { ok?: boolean; error?: { code?: string } };
  if (o.ok === false && typeof o.error?.code === "string" && o.error.code.length > 0) {
    return o.error.code;
  }
  if (
    "error" in o &&
    o.error &&
    typeof o.error === "object" &&
    !Array.isArray(o.error)
  ) {
    const c = (o.error as { code?: string }).code;
    if (typeof c === "string" && c.length > 0) return c;
  }
  return undefined;
}

/** `{ ok:false, error:{...} }` 또는 레거시 `{ error:{ message?, code? } }`에서 code/message 후보. */
function extractAppApiNestedErrorString(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as { ok?: boolean; error?: { code?: string; message?: string } };
  const hasFail =
    (o.ok === false && o.error && typeof o.error === "object") ||
    ("error" in o && o.error && typeof o.error === "object");
  if (!hasFail || !o.error || Array.isArray(o.error)) return undefined;
  const e = o.error as { code?: string; message?: string };
  const msg = typeof e.message === "string" ? e.message.trim() : "";
  if (msg) return msg;
  const code = typeof e.code === "string" ? e.code.trim() : "";
  if (code) return code;
  return undefined;
}

function extractFlatErrorString(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as { error?: unknown };
  if (typeof o.error === "string" && o.error.length > 0) return o.error;
  return undefined;
}

/**
 * API JSON 응답에서 사용자에게 보여 줄 메시지를 현재 언어로 반환합니다.
 * - `/api/app/*` 실패 봉투: `error.code` → `i18nAppApiErrors`
 * - 평면 `{ error: "admin_..." }` → `i18n` `apiErr*`
 */
export function formatUserFacingApiJson(json: unknown, language: SupportedLanguage): string {
  const appCode = extractAppApiFailureCode(json);
  if (appCode) {
    return getAppApiErrorMessageForCode(appCode, language);
  }
  const flat = extractFlatErrorString(json);
  if (flat) {
    return formatAppApiErrorMessage(flat, language);
  }
  const nested = extractAppApiNestedErrorString(json);
  if (nested) {
    return formatAppApiErrorMessage(nested, language);
  }
  return getUIText("error", language);
}

export function formatAppApiErrorMessage(
  raw: string | undefined,
  language: SupportedLanguage,
): string {
  if (!raw || !raw.trim()) {
    return getUIText("error", language);
  }
  const key = ADMIN_FLAT_ERROR_TO_UI[raw.trim()];
  if (key) {
    return getUIText(key, language);
  }
  return raw;
}
