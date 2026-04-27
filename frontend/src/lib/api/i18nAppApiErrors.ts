/**
 * `/api/app/*` 의 `appApiError` 코드 → 사용자 표시 문구 (5개국어).
 * 서버는 `error.code`만 안정적으로 내리고, 클라이언트에서 여기로 번역합니다.
 */
import type { SupportedLanguage } from "@/lib/api/translation";

/** `appApiError` 첫 인자와 동일한 문자열 키 */
export type AppApiErrorCode = string;

const EN: Record<string, string> = {
  actor_required: "Sign in again and retry.",
  forbidden_actor: "You cannot access this resource.",
  sync_secret_required: "Sync is not authorized.",
  invalid_body: "The request could not be read.",
  missing_scope: "Required scope is missing.",
  missing_booking_id: "Booking ID is required.",
  invalid_user_id: "Invalid user ID.",
  invalid_booking_id: "Invalid booking ID.",
  invalid_room_id: "Invalid chat room ID.",
  database_unavailable: "Service is temporarily unavailable. Please try again.",
  invalid_fields: "Some fields are missing or invalid.",
  forbidden_sender: "You cannot send messages in this chat.",
  room_not_found: "Chat room was not found.",
  booking_not_found: "Booking was not found.",
  not_found: "The resource was not found.",
  delete_failed: "Could not delete due to a conflict.",
  invalid_payment_actor: "Only the guest or host can complete this payment.",
  invalid_id: "Invalid ID.",
  admin_patch_empty: "No fields can be updated.",
  missing_email_or_password: "Email and password are required.",
  "auth/email-already-in-use": "This email is already registered.",
  invalid_input: "Invalid input.",
  forbidden_or_missing: "Not allowed or not found.",
  missing_fields: "Required fields are missing.",
  unsupported_action: "This action is not supported.",
  bank_account_not_found: "Bank account was not found.",
  already_booked: "These dates were just booked. Payment cannot complete.",
  idempotency_conflict: "This payment was already processed with a different result.",
  empty: "The request list is empty.",
  too_many: "Too many items in one request.",
  duplicate_booking_overlap: "This property already has a booking in that period.",
  "auth/user-not-found": "No account matches this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/social_login_required": "This account uses social login.",
  "auth/user-blocked": "This account has been suspended.",
};

const KO: Record<string, string> = {
  actor_required: "다시 로그인한 뒤 시도해 주세요.",
  forbidden_actor: "이 리소스에 접근할 수 없습니다.",
  sync_secret_required: "동기화가 허용되지 않았습니다.",
  invalid_body: "요청을 읽을 수 없습니다.",
  missing_scope: "필요한 범위 정보가 없습니다.",
  missing_booking_id: "예약 ID가 필요합니다.",
  invalid_user_id: "사용자 ID가 올바르지 않습니다.",
  invalid_booking_id: "예약 ID가 올바르지 않습니다.",
  invalid_room_id: "채팅방 ID가 올바르지 않습니다.",
  database_unavailable: "일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  invalid_fields: "일부 항목이 없거나 올바르지 않습니다.",
  forbidden_sender: "이 채팅에서 메시지를 보낼 수 없습니다.",
  room_not_found: "채팅방을 찾을 수 없습니다.",
  booking_not_found: "예약을 찾을 수 없습니다.",
  not_found: "요청한 정보를 찾을 수 없습니다.",
  delete_failed: "충돌로 삭제할 수 없습니다.",
  invalid_payment_actor: "게스트 또는 호스트만 결제를 진행할 수 있습니다.",
  invalid_id: "ID가 올바르지 않습니다.",
  admin_patch_empty: "변경할 수 있는 항목이 없습니다.",
  missing_email_or_password: "이메일과 비밀번호를 입력해 주세요.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다.",
  invalid_input: "입력값이 올바르지 않습니다.",
  forbidden_or_missing: "권한이 없거나 찾을 수 없습니다.",
  missing_fields: "필수 항목이 누락되었습니다.",
  unsupported_action: "지원하지 않는 작업입니다.",
  bank_account_not_found: "등록된 계좌를 찾을 수 없습니다.",
  already_booked: "해당 날짜에 방금 예약이 확정되었습니다. 결제를 완료할 수 없습니다.",
  idempotency_conflict: "이 결제는 다른 결과로 이미 처리되었습니다.",
  empty: "요청 목록이 비어 있습니다.",
  too_many: "한 번에 요청할 수 있는 개수를 초과했습니다.",
  duplicate_booking_overlap: "해당 매물에 겹치는 예약이 이미 있습니다.",
  "auth/user-not-found": "이 이메일과 일치하는 계정이 없습니다.",
  "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
  "auth/social_login_required": "이 계정은 소셜 로그인을 사용합니다.",
  "auth/user-blocked": "이 계정은 이용이 제한되었습니다.",
};

const VI: Record<string, string> = {
  actor_required: "Vui lòng đăng nhập lại và thử lại.",
  forbidden_actor: "Bạn không thể truy cập tài nguyên này.",
  sync_secret_required: "Đồng bộ không được phép.",
  invalid_body: "Không đọc được yêu cầu.",
  missing_scope: "Thiếu phạm vi bắt buộc.",
  missing_booking_id: "Cần mã đặt phòng.",
  invalid_user_id: "ID người dùng không hợp lệ.",
  invalid_booking_id: "ID đặt phòng không hợp lệ.",
  invalid_room_id: "ID phòng chat không hợp lệ.",
  database_unavailable: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại.",
  invalid_fields: "Một số trường thiếu hoặc không hợp lệ.",
  forbidden_sender: "Bạn không thể gửi tin trong phòng chat này.",
  room_not_found: "Không tìm thấy phòng chat.",
  booking_not_found: "Không tìm thấy đặt phòng.",
  not_found: "Không tìm thấy tài nguyên.",
  delete_failed: "Không thể xóa do xung đột.",
  invalid_payment_actor: "Chỉ khách hoặc chủ nhà mới hoàn tất thanh toán này.",
  invalid_id: "ID không hợp lệ.",
  admin_patch_empty: "Không có trường nào có thể cập nhật.",
  missing_email_or_password: "Vui lòng nhập email và mật khẩu.",
  "auth/email-already-in-use": "Email này đã được đăng ký.",
  invalid_input: "Dữ liệu không hợp lệ.",
  forbidden_or_missing: "Không được phép hoặc không tìm thấy.",
  missing_fields: "Thiếu trường bắt buộc.",
  unsupported_action: "Hành động không được hỗ trợ.",
  bank_account_not_found: "Không tìm thấy tài khoản ngân hàng.",
  already_booked: "Khoảng ngày này vừa được đặt. Không thể hoàn tất thanh toán.",
  idempotency_conflict: "Thanh toán này đã được xử lý với kết quả khác.",
  empty: "Danh sách yêu cầu trống.",
  too_many: "Quá nhiều mục trong một yêu cầu.",
  duplicate_booking_overlap: "Tin đăng này đã có đặt phòng trùng thời gian.",
  "auth/user-not-found": "Không có tài khoản khớp email này.",
  "auth/wrong-password": "Mật khẩu không đúng.",
  "auth/social_login_required": "Tài khoản này dùng đăng nhập mạng xã hội.",
  "auth/user-blocked": "Tài khoản này đã bị tạm khóa.",
};

const JA: Record<string, string> = {
  actor_required: "再度ログインしてからお試しください。",
  forbidden_actor: "このリソースにアクセスできません。",
  sync_secret_required: "同期は許可されていません。",
  invalid_body: "リクエストを読み取れませんでした。",
  missing_scope: "必要な範囲情報がありません。",
  missing_booking_id: "予約IDが必要です。",
  invalid_user_id: "ユーザーIDが無効です。",
  invalid_booking_id: "予約IDが無効です。",
  invalid_room_id: "チャットルームIDが無効です。",
  database_unavailable: "一時的に利用できません。しばらくしてからお試しください。",
  invalid_fields: "一部の項目が無効または不足しています。",
  forbidden_sender: "このチャットでは送信できません。",
  room_not_found: "チャットルームが見つかりません。",
  booking_not_found: "予約が見つかりません。",
  not_found: "リソースが見つかりません。",
  delete_failed: "競合のため削除できませんでした。",
  invalid_payment_actor: "ゲストまたはホストのみが支払いを完了できます。",
  invalid_id: "IDが無効です。",
  admin_patch_empty: "更新できる項目がありません。",
  missing_email_or_password: "メールとパスワードを入力してください。",
  "auth/email-already-in-use": "このメールは既に登録されています。",
  invalid_input: "入力が無効です。",
  forbidden_or_missing: "許可されていないか、見つかりません。",
  missing_fields: "必須項目がありません。",
  unsupported_action: "この操作はサポートされていません。",
  bank_account_not_found: "銀行口座が見つかりません。",
  already_booked: "この日程は先ほど予約が確定しました。支払いを完了できません。",
  idempotency_conflict: "この支払いは別の結果で既に処理されています。",
  empty: "リクエストのリストが空です。",
  too_many: "1回のリクエストで送れる件数を超えています。",
  duplicate_booking_overlap: "この物件には期間が重なる予約があります。",
  "auth/user-not-found": "このメールに一致するアカウントがありません。",
  "auth/wrong-password": "パスワードが正しくありません。",
  "auth/social_login_required": "このアカウントはソーシャルログインを使用します。",
  "auth/user-blocked": "このアカウントは利用停止されています。",
};

const ZH: Record<string, string> = {
  actor_required: "请重新登录后重试。",
  forbidden_actor: "您无法访问此资源。",
  sync_secret_required: "未授权同步。",
  invalid_body: "无法解析请求。",
  missing_scope: "缺少必要的范围信息。",
  missing_booking_id: "需要预订 ID。",
  invalid_user_id: "用户 ID 无效。",
  invalid_booking_id: "预订 ID 无效。",
  invalid_room_id: "聊天室 ID 无效。",
  database_unavailable: "服务暂时不可用，请稍后重试。",
  invalid_fields: "部分字段缺失或无效。",
  forbidden_sender: "您不能在此聊天中发送消息。",
  room_not_found: "未找到聊天室。",
  booking_not_found: "未找到预订。",
  not_found: "未找到资源。",
  delete_failed: "因冲突无法删除。",
  invalid_payment_actor: "仅房客或房东可完成此付款。",
  invalid_id: "ID 无效。",
  admin_patch_empty: "没有可更新的字段。",
  missing_email_or_password: "请输入邮箱和密码。",
  "auth/email-already-in-use": "该邮箱已注册。",
  invalid_input: "输入无效。",
  forbidden_or_missing: "无权限或未找到。",
  missing_fields: "缺少必填字段。",
  unsupported_action: "不支持此操作。",
  bank_account_not_found: "未找到银行账户。",
  already_booked: "该日期刚刚被预订，无法完成付款。",
  idempotency_conflict: "该付款已以不同结果处理。",
  empty: "请求列表为空。",
  too_many: "单次请求数量过多。",
  duplicate_booking_overlap: "该房源在该时段已有重叠预订。",
  "auth/user-not-found": "没有与该邮箱匹配的账户。",
  "auth/wrong-password": "密码不正确。",
  "auth/social_login_required": "此账户使用社交登录。",
  "auth/user-blocked": "此账户已被限制使用。",
};

const BY_LANG: Record<SupportedLanguage, Record<string, string>> = {
  ko: KO,
  vi: VI,
  en: EN,
  ja: JA,
  zh: ZH,
};

export function isKnownAppApiErrorCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(EN, code);
}

export function getAppApiErrorMessageForCode(
  code: string,
  language: SupportedLanguage,
): string {
  const table = BY_LANG[language] ?? BY_LANG.en;
  return table[code] ?? BY_LANG.en[code] ?? EN[code] ?? code;
}

/** Vitest: 5개 locale 테이블이 동일한 키 집합을 갖는지 */
export function getAppApiErrorI18nParityMismatches(): string[] {
  const ref = new Set(Object.keys(EN));
  const langs: SupportedLanguage[] = ["ko", "vi", "en", "ja", "zh"];
  const out: string[] = [];
  for (const lang of langs) {
    const s = new Set(Object.keys(BY_LANG[lang]));
    for (const k of ref) {
      if (!s.has(k)) out.push(`${lang} missing appApi err key: ${k}`);
    }
    for (const k of s) {
      if (!ref.has(k)) out.push(`${lang} extra appApi err key: ${k}`);
    }
  }
  return out;
}
