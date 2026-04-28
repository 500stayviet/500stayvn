/**
 * 은행/직불 게이트웨이(향후 계약 후 REST·웹훅 연동) — **환경 변수만 채우면 활성**.
 *
 * - 벤더(VietQR·NAPAS 고정 거래처 등)명은 코드에 박지 않음: `BANK_TRANSFER_API_*` 이름만 표준화.
 * - 실 로직은 미구현: 출금 검토·원장은 기존 `AdminWithdrawalRequest` 플로우 유지.
 * - 연동 시 새 API 라우트 또는 관리자 액션에서 `getBankTransferApiConfig()` · `getBankTransferWebhookSecret()` 호출.
 *
 * 로그 규칙: `secret` 값은 절대 출력 금지(마스킹 또는 해시 힌트만).
 */

function trimEnv(key: string): string {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

/** 출금 자동 전송 등 **발신 API** 호출 시 사용. 세 필드 모두 nonempty 일 때만 반환. */
export type BankTransferApiSecrets = {
  /** 베이스 URL (예: https://partner.example.vn/api/v1) 트레일링 슬래시 없이 권장 */
  baseUrl: string;
  /** 파트너 코드 / 클라이언트 ID 등 공급자 명칭에 따름 */
  clientId: string;
  /** API 시크릿(OAuth client secret 또는 대칭 키) — 서버 전용 */
  secret: string;
};

export function getBankTransferApiConfig(): BankTransferApiSecrets | null {
  const baseUrl = trimEnv("BANK_TRANSFER_API_BASE_URL");
  const clientId = trimEnv("BANK_TRANSFER_API_CLIENT_ID");
  const secret = trimEnv("BANK_TRANSFER_API_SECRET");
  if (!baseUrl || !clientId || !secret) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), clientId, secret };
}

/** 발신 연동 가능 여부(키 세트 완비). */
export function isBankTransferApiConfigured(): boolean {
  return getBankTransferApiConfig() !== null;
}

/** 입금·출금 상태 **수신 웹훅** 서명 검증용 시크릿 (별도 또는 공통 — 공급자 명세 따름). */
export function getBankTransferWebhookSecret(): string | null {
  const s = trimEnv("BANK_TRANSFER_WEBHOOK_SECRET");
  return s || null;
}
