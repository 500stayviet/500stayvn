/**
 * 정산 API가 DB·원장에 기록하는 기본 `reason` / 감사 문자열.
 * UI 언어와 무관한 짧은 영문 코드(또는 감사용 영문 문장)로 통일합니다.
 */
export const SETTLEMENT_DB_REASON_HOLD_PRE_APPROVAL = "settlement_hold_pre_approval";
export const SETTLEMENT_DB_REASON_HOLD_PENDING_CASE = "settlement_hold_pending_case";
export const SETTLEMENT_DB_REASON_HOLD_POST_APPROVAL = "settlement_hold_post_approval_case";
export const SETTLEMENT_DB_REASON_HOLD_APPROVED_CASE = "settlement_hold_approved_case";
