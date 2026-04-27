/**
 * One-off: append user-flow i18n keys (5 langs) to src/utils/i18n.ts
 * Run: node scripts/patch-user-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.join(__dirname, "../src/utils/i18n.ts");

const NEW_KEYS = `
  | 'propertyNotFound'
  | 'bookPropertyTitle'
  | 'nightShort'
  | 'bookingDatesLoadError'
  | 'guestInfoSectionTitle'
  | 'bookingGuestNamePlaceholder'
  | 'agreeTermsPrivacyBooking'
  | 'proceedToPaymentStep'
  | 'selectPaymentMethod'
  | 'priceBreakdown'
  | 'perWeekSlash'
  | 'petsShort'
  | 'petCountClassifier'
  | 'perPetPerWeekSlash'
  | 'bookingServiceFee'
  | 'totalAmountLabel'
  | 'agreePaymentTermsCheckbox'
  | 'payNow'
  | 'processingInProgress'
  | 'bookingDetailTitle'
  | 'paymentCompleteTitle'
  | 'waitingHostApproval'
  | 'notifyWhenApprovedShort'
  | 'bookingSuccessGotIt'
  | 'bookingNumberLabel'
  | 'copyButton'
  | 'copiedButton'
  | 'bookingBadgeConfirmed'
  | 'bookingBadgeCancelled'
  | 'bookingBadgePending'
  | 'propertyInfoHeading'
  | 'bookingDetailSectionTitle'
  | 'bookerFieldLabel'
  | 'phoneFieldLabel'
  | 'stayNightsUnit'
  | 'specialRequestsHeading'
  | 'weeklyPriceShort'
  | 'petFeeShortLabel'
  | 'totalPaymentHeading'
  | 'paymentStatusPaidLabel'
  | 'paymentStatusPendingLabel'
  | 'backToHomeButton'
  | 'viewBookingsHistoryButton'
  | 'reservationServerTimeDetail'
  | 'hostManageBookedPropertiesTitle'
  | 'hostTabBookedProperties'
  | 'hostTabCompletedReservations'
  | 'emptyNoActiveReservations'
  | 'emptyNoCompletedReservations'
  | 'tenantInfoHeading'
  | 'confirmReservationBtn'
  | 'markStayCompletedBtn'
  | 'deleteHistoryRecordTitle'
  | 'hostApproveBooking'
  | 'cancelPolicyAgreeRequired'
  | 'bookingCancelledToast'
  | 'bookingCancelFailed'
  | 'confirmDeleteBookingRecord'
  | 'bookingDeletedToast'
  | 'bookingDeleteFailed'
  | 'checkInOutScheduleTitle'
  | 'importExternalCalendar'
  | 'calendarPlatformLabel'
  | 'calendarOptionNone'
  | 'calendarOptionOther'
  | 'calendarNameLabel'
  | 'calendarNamePlaceholderExample'
  | 'removeAddressAriaLabel'
  | 'backNavLabel'
  | 'kycFirebasePhoneTitle'
  | 'kycFirebasePhoneSubtitle'
  | 'kycPhoneVerificationHeading'
  | 'kycPhoneVerificationForHostDesc'
  | 'kycPhoneVerifiedLong'
  | 'kycNextStep'
  | 'kycTestModeProceed'
  | 'calWarnTitleOwner'
  | 'calWarnTitleGuest'
  | 'calWarnMinSevenBody'
  | 'calSelectRentalStart'
  | 'calSelectRentalEnd'
  | 'calSelectCheckIn'
  | 'calSelectCheckOut'
  | 'calOwnerLegendSelectableStart'
  | 'calOwnerLegendSelectedStart'
  | 'calOwnerLegendEndHint'
  | 'calOwnerLegendWithinPeriod'
  | 'calOwnerLegendOtherDates'
  | 'calOwnerSelectStartFirst'
  | 'calGuestLegendAvailable'
  | 'calGuestLegendMinSeven'
  | 'calGuestLegendBooked'
  | 'calGuestLegendCheckoutOk'
  | 'calGuestLegendShortStay'
  | 'calGuestLegendCheckinToEnd'
  | 'calGuestLegendValidCheckout'
  | 'calGuestSelectCheckInFirst'
  | 'weeklyCostLabel'`;

const PACK = {
  ko: {
    propertyNotFound: "매물을 찾을 수 없습니다.",
    bookPropertyTitle: "예약하기",
    nightShort: "박",
    bookingDatesLoadError: "날짜 정보를 불러올 수 없습니다",
    guestInfoSectionTitle: "예약자 정보",
    bookingGuestNamePlaceholder: "이름",
    agreeTermsPrivacyBooking: "약관 및 개인정보 수집 동의 (필수)",
    proceedToPaymentStep: "결제 단계로 이동",
    selectPaymentMethod: "결제 수단 선택",
    priceBreakdown: "요금 내역",
    perWeekSlash: " (주당)",
    petsShort: "애완동물",
    petCountClassifier: "마리",
    perPetPerWeekSlash: " (마리당/주)",
    bookingServiceFee: "예약 수수료",
    totalAmountLabel: "총액",
    agreePaymentTermsCheckbox: "약관 및 결제 조건에 동의합니다. (필수)",
    payNow: "결제하기",
    processingInProgress: "처리 중...",
    bookingDetailTitle: "예약 상세 내역",
    paymentCompleteTitle: "결제가 완료되었습니다!",
    waitingHostApproval: "임대인의 승인을 기다리고 있습니다.",
    notifyWhenApprovedShort: "승인이 완료되면 알림을 보내드립니다.",
    bookingSuccessGotIt: "확인",
    bookingNumberLabel: "예약 번호",
    copyButton: "복사",
    copiedButton: "복사됨",
    bookingBadgeConfirmed: "확정됨",
    bookingBadgeCancelled: "취소됨",
    bookingBadgePending: "승인 대기 중",
    propertyInfoHeading: "숙소 정보",
    bookingDetailSectionTitle: "상세 예약 정보",
    bookerFieldLabel: "예약자",
    phoneFieldLabel: "연락처",
    stayNightsUnit: "박",
    specialRequestsHeading: "요청사항",
    weeklyPriceShort: "주당 가격",
    petFeeShortLabel: "마리당",
    totalPaymentHeading: "총 결제 금액",
    paymentStatusPaidLabel: "결제 완료",
    paymentStatusPendingLabel: "결제 대기",
    backToHomeButton: "홈으로 돌아가기",
    viewBookingsHistoryButton: "예약 내역 확인",
    reservationServerTimeDetail:
      "서버 시간을 확인할 수 없어 예약 상태를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    hostManageBookedPropertiesTitle: "예약된 매물 관리",
    hostTabBookedProperties: "예약된 매물",
    hostTabCompletedReservations: "예약완료된 매물",
    emptyNoActiveReservations: "예약된 매물이 없습니다.",
    emptyNoCompletedReservations: "예약완료된 매물이 없습니다.",
    tenantInfoHeading: "임차인 정보",
    confirmReservationBtn: "예약 확정",
    markStayCompletedBtn: "예약 완료 처리",
    deleteHistoryRecordTitle: "기록 삭제",
    hostApproveBooking: "승인",
    cancelPolicyAgreeRequired: "취소 정책에 동의해 주세요.",
    bookingCancelledToast: "예약이 취소되었습니다.",
    bookingCancelFailed: "취소 처리에 실패했습니다.",
    confirmDeleteBookingRecord: "이 예약 기록을 삭제할까요?",
    bookingDeletedToast: "삭제되었습니다.",
    bookingDeleteFailed: "삭제에 실패했습니다.",
    checkInOutScheduleTitle: "체크인/체크아웃 시간",
    importExternalCalendar: "외부 캘린더 가져오기",
    calendarPlatformLabel: "플랫폼",
    calendarOptionNone: "선택 안 함",
    calendarOptionOther: "기타",
    calendarNameLabel: "캘린더 이름",
    calendarNamePlaceholderExample: "예: 에어비앤비 예약",
    removeAddressAriaLabel: "주소 삭제",
    backNavLabel: "뒤로가기",
    kycFirebasePhoneTitle: "Firebase 전화번호 인증",
    kycFirebasePhoneSubtitle: "Google Firebase를 통한 안전한 전화번호 인증",
    kycPhoneVerificationHeading: "전화번호 인증",
    kycPhoneVerificationForHostDesc: "임대인 인증을 위해 전화번호를 인증해주세요",
    kycPhoneVerifiedLong: "✅ 전화번호 인증이 완료되었습니다.",
    kycNextStep: "다음 단계로",
    kycTestModeProceed: "테스트 모드로 진행",
    calWarnTitleOwner: "기간 설정 불가",
    calWarnTitleGuest: "예약 불가",
    calWarnMinSevenBody:
      "최소 7일 단위로만 예약이 가능합니다. 선택한 날짜부터 임대 종료일까지 7일 미만이므로 다른 날짜를 선택해주세요.",
    calSelectRentalStart: "임대 시작일 선택",
    calSelectRentalEnd: "임대 종료일 선택",
    calSelectCheckIn: "체크인 날짜 선택",
    calSelectCheckOut: "체크아웃 날짜 선택",
    calOwnerLegendSelectableStart: "임대 시작일로 선택 가능",
    calOwnerLegendSelectedStart: "선택된 시작일",
    calOwnerLegendEndHint: "임대 종료일 (7일 단위, 최대 약 3개월)",
    calOwnerLegendWithinPeriod: "임대 기간 중 (클릭 시 새 시작일로 변경)",
    calOwnerLegendOtherDates: "그 외 날짜 (클릭 시 새 시작일로 변경)",
    calOwnerSelectStartFirst: "임대 시작일을 먼저 선택해주세요",
    calGuestLegendAvailable: "선택 가능한 날짜",
    calGuestLegendMinSeven:
      "최소 7박 이상, 막힌 날 제외(체크아웃 날짜 자유)",
    calGuestLegendBooked: "이미 예약됨 / 예약 불가",
    calGuestLegendCheckoutOk: "기존 예약 체크아웃 (체크인 가능)",
    calGuestLegendShortStay: "가용 기간 7일 미만 (체크인 불가)",
    calGuestLegendCheckinToEnd: "체크인 기준 매물 종료일까지(또는 상한)",
    calGuestLegendValidCheckout: "체크아웃 가능 (7박 이상·예약 안 겹침)",
    calGuestSelectCheckInFirst: "체크인 날짜를 먼저 선택해주세요",
    weeklyCostLabel: "주당 비용",
  },
  vi: {
    propertyNotFound: "Không tìm thấy bất động sản.",
    bookPropertyTitle: "Đặt phòng",
    nightShort: " đêm",
    bookingDatesLoadError: "Không thể tải thông tin ngày",
    guestInfoSectionTitle: "Thông tin người đặt",
    bookingGuestNamePlaceholder: "Họ tên",
    agreeTermsPrivacyBooking:
      "Đồng ý điều khoản và thu thập thông tin cá nhân (bắt buộc)",
    proceedToPaymentStep: "Đi tới bước thanh toán",
    selectPaymentMethod: "Chọn phương thức thanh toán",
    priceBreakdown: "Chi tiết thanh toán",
    perWeekSlash: " /tuần",
    petsShort: "Thú cưng",
    petCountClassifier: " con",
    perPetPerWeekSlash: " /con/tuần",
    bookingServiceFee: "Phí dịch vụ",
    totalAmountLabel: "Tổng cộng",
    agreePaymentTermsCheckbox:
      "Tôi đồng ý với điều khoản và điều kiện thanh toán. (Bắt buộc)",
    payNow: "Thanh toán",
    processingInProgress: "Đang xử lý...",
    bookingDetailTitle: "Chi tiết đặt phòng",
    paymentCompleteTitle: "Thanh toán thành công!",
    waitingHostApproval: "Đang chờ chủ nhà phê duyệt.",
    notifyWhenApprovedShort: "Chúng tôi sẽ thông báo khi được phê duyệt.",
    bookingSuccessGotIt: "Đã hiểu",
    bookingNumberLabel: "Mã đặt phòng",
    copyButton: "Sao chép",
    copiedButton: "Đã sao chép",
    bookingBadgeConfirmed: "Đã xác nhận",
    bookingBadgeCancelled: "Đã hủy",
    bookingBadgePending: "Chờ phê duyệt",
    propertyInfoHeading: "Thông tin chỗ ở",
    bookingDetailSectionTitle: "Chi tiết đặt phòng",
    bookerFieldLabel: "Người đặt",
    phoneFieldLabel: "Số điện thoại",
    stayNightsUnit: " đêm",
    specialRequestsHeading: "Yêu cầu đặc biệt",
    weeklyPriceShort: "giá/tuần",
    petFeeShortLabel: "con",
    totalPaymentHeading: "Tổng số tiền",
    paymentStatusPaidLabel: "Đã thanh toán",
    paymentStatusPendingLabel: "Chờ thanh toán",
    backToHomeButton: "Về trang chủ",
    viewBookingsHistoryButton: "Xem lịch sử đặt phòng",
    reservationServerTimeDetail:
      "Không thể xác minh thời gian máy chủ. Vui lòng thử lại sau.",
    hostManageBookedPropertiesTitle: "Quản lý đặt phòng",
    hostTabBookedProperties: "Đặt phòng",
    hostTabCompletedReservations: "Hoàn thành",
    emptyNoActiveReservations: "Không có đặt phòng nào.",
    emptyNoCompletedReservations: "Không có đặt phòng hoàn thành nào.",
    tenantInfoHeading: "Thông tin người thuê",
    confirmReservationBtn: "Xác nhận đặt phòng",
    markStayCompletedBtn: "Hoàn thành đặt phòng",
    deleteHistoryRecordTitle: "Xóa bản ghi",
    hostApproveBooking: "Chấp nhận",
    cancelPolicyAgreeRequired: "Vui lòng đồng ý chính sách hủy.",
    bookingCancelledToast: "Đã hủy đặt phòng.",
    bookingCancelFailed: "Hủy thất bại.",
    confirmDeleteBookingRecord: "Xóa mục đặt phòng này?",
    bookingDeletedToast: "Đã xóa.",
    bookingDeleteFailed: "Xóa thất bại.",
    checkInOutScheduleTitle: "Giờ check-in/check-out",
    importExternalCalendar: "Đồng bộ lịch ngoài",
    calendarPlatformLabel: "Nền tảng",
    calendarOptionNone: "Không chọn",
    calendarOptionOther: "Khác",
    calendarNameLabel: "Tên lịch",
    calendarNamePlaceholderExample: "VD: Airbnb",
    removeAddressAriaLabel: "Xóa địa chỉ",
    backNavLabel: "Quay lại",
    kycFirebasePhoneTitle: "Xác thực số điện thoại bằng Firebase",
    kycFirebasePhoneSubtitle:
      "Xác thực số điện thoại an toàn qua Google Firebase",
    kycPhoneVerificationHeading: "Xác thực số điện thoại",
    kycPhoneVerificationForHostDesc:
      "Vui lòng xác thực số điện thoại để xác nhận chủ nhà",
    kycPhoneVerifiedLong: "✅ Xác thực số điện thoại đã hoàn tất.",
    kycNextStep: "Tiếp theo",
    kycTestModeProceed: "Tiếp theo (chế độ thử nghiệm)",
    calWarnTitleOwner: "Không thể đặt thời gian",
    calWarnTitleGuest: "Không thể đặt phòng",
    calWarnMinSevenBody:
      "Chỉ có thể đặt phòng tối thiểu 7 ngày. Từ ngày đã chọn đến ngày kết thúc thuê còn dưới 7 ngày, vui lòng chọn ngày khác.",
    calSelectRentalStart: "Chọn ngày bắt đầu thuê",
    calSelectRentalEnd: "Chọn ngày kết thúc thuê",
    calSelectCheckIn: "Chọn ngày nhận phòng",
    calSelectCheckOut: "Chọn ngày trả phòng",
    calOwnerLegendSelectableStart: "Có thể chọn làm ngày bắt đầu",
    calOwnerLegendSelectedStart: "Ngày bắt đầu đã chọn",
    calOwnerLegendEndHint:
      "Ngày kết thúc (bội 7 ngày, tối đa ~3 tháng)",
    calOwnerLegendWithinPeriod:
      "Trong thời gian thuê (nhấp để đổi ngày bắt đầu)",
    calOwnerLegendOtherDates: "Ngày khác (nhấp để đổi ngày bắt đầu)",
    calOwnerSelectStartFirst: "Vui lòng chọn ngày bắt đầu trước",
    calGuestLegendAvailable: "Ngày có thể chọn",
    calGuestLegendMinSeven: "Tối thiểu 7 đêm, trừ ngày đã đặt",
    calGuestLegendBooked: "Đã được đặt / Không thể đặt",
    calGuestLegendCheckoutOk: "Ngày trả phòng (Có thể nhận phòng)",
    calGuestLegendShortStay:
      "Thời gian còn lại dưới 7 ngày (Không thể nhận phòng)",
    calGuestLegendCheckinToEnd: "Đến ngày kết thúc phòng",
    calGuestLegendValidCheckout: "Trả phòng hợp lệ (≥7 đêm)",
    calGuestSelectCheckInFirst: "Vui lòng chọn ngày nhận phòng trước",
    weeklyCostLabel: "/ tuần",
  },
  en: {
    propertyNotFound: "Property not found.",
    bookPropertyTitle: "Book",
    nightShort: " nights",
    bookingDatesLoadError: "Could not load date information",
    guestInfoSectionTitle: "Guest details",
    bookingGuestNamePlaceholder: "Full name",
    agreeTermsPrivacyBooking: "I agree to the terms and privacy policy (required)",
    proceedToPaymentStep: "Continue to payment",
    selectPaymentMethod: "Select payment method",
    priceBreakdown: "Price breakdown",
    perWeekSlash: " /week",
    petsShort: "Pets",
    petCountClassifier: "",
    perPetPerWeekSlash: " /pet/week",
    bookingServiceFee: "Service fee",
    totalAmountLabel: "Total",
    agreePaymentTermsCheckbox:
      "I agree to the payment terms and conditions. (Required)",
    payNow: "Pay now",
    processingInProgress: "Processing...",
    bookingDetailTitle: "Booking details",
    paymentCompleteTitle: "Payment complete!",
    waitingHostApproval: "Waiting for host approval.",
    notifyWhenApprovedShort: "We will notify you when approved.",
    bookingSuccessGotIt: "Got it",
    bookingNumberLabel: "Booking number",
    copyButton: "Copy",
    copiedButton: "Copied",
    bookingBadgeConfirmed: "Confirmed",
    bookingBadgeCancelled: "Cancelled",
    bookingBadgePending: "Pending approval",
    propertyInfoHeading: "Property",
    bookingDetailSectionTitle: "Booking details",
    bookerFieldLabel: "Guest",
    phoneFieldLabel: "Phone",
    stayNightsUnit: " nights",
    specialRequestsHeading: "Special requests",
    weeklyPriceShort: "weekly rate",
    petFeeShortLabel: "per pet",
    totalPaymentHeading: "Total paid",
    paymentStatusPaidLabel: "Paid",
    paymentStatusPendingLabel: "Payment pending",
    backToHomeButton: "Back to home",
    viewBookingsHistoryButton: "View my bookings",
    reservationServerTimeDetail:
      "Cannot verify server time. Please try again later.",
    hostManageBookedPropertiesTitle: "Reservation management",
    hostTabBookedProperties: "Active reservations",
    hostTabCompletedReservations: "Completed",
    emptyNoActiveReservations: "No active reservations.",
    emptyNoCompletedReservations: "No completed reservations.",
    tenantInfoHeading: "Tenant information",
    confirmReservationBtn: "Confirm reservation",
    markStayCompletedBtn: "Mark as completed",
    deleteHistoryRecordTitle: "Delete record",
    hostApproveBooking: "Approve",
    cancelPolicyAgreeRequired: "Please agree to the cancellation policy.",
    bookingCancelledToast: "Booking cancelled.",
    bookingCancelFailed: "Could not cancel the booking.",
    confirmDeleteBookingRecord: "Delete this booking record?",
    bookingDeletedToast: "Removed.",
    bookingDeleteFailed: "Delete failed.",
    checkInOutScheduleTitle: "Check-in / check-out time",
    importExternalCalendar: "Import external calendar",
    calendarPlatformLabel: "Platform",
    calendarOptionNone: "None",
    calendarOptionOther: "Other",
    calendarNameLabel: "Calendar name",
    calendarNamePlaceholderExample: "e.g. Airbnb bookings",
    removeAddressAriaLabel: "Remove address",
    backNavLabel: "Back",
    kycFirebasePhoneTitle: "Firebase phone verification",
    kycFirebasePhoneSubtitle: "Secure phone verification via Google Firebase",
    kycPhoneVerificationHeading: "Phone verification",
    kycPhoneVerificationForHostDesc:
      "Please verify your phone number for host verification",
    kycPhoneVerifiedLong: "✅ Phone number verification completed.",
    kycNextStep: "Next step",
    kycTestModeProceed: "Proceed in test mode",
    calWarnTitleOwner: "Cannot set period",
    calWarnTitleGuest: "Cannot book",
    calWarnMinSevenBody:
      "Bookings are only available in 7-day units. The selected date has less than 7 days until the rental end date. Please select another date.",
    calSelectRentalStart: "Select rental start date",
    calSelectRentalEnd: "Select rental end date",
    calSelectCheckIn: "Select check-in date",
    calSelectCheckOut: "Select check-out date",
    calOwnerLegendSelectableStart: "Can select as start date",
    calOwnerLegendSelectedStart: "Selected start date",
    calOwnerLegendEndHint: "End date (7-day steps, max ~3 months)",
    calOwnerLegendWithinPeriod:
      "Within rental period (click to change start date)",
    calOwnerLegendOtherDates: "Other dates (click to change start date)",
    calOwnerSelectStartFirst: "Please select start date first",
    calGuestLegendAvailable: "Available dates",
    calGuestLegendMinSeven:
      "Min 7 nights; blocked dates excluded (flexible checkout)",
    calGuestLegendBooked: "Booked / unavailable",
    calGuestLegendCheckoutOk: "Existing checkout (check-in available)",
    calGuestLegendShortStay: "Less than 7 days available (cannot check in)",
    calGuestLegendCheckinToEnd: "Until listing end or limit",
    calGuestLegendValidCheckout: "Valid checkout (≥7 nights, no overlap)",
    calGuestSelectCheckInFirst: "Please select check-in date first",
    weeklyCostLabel: "/ week",
  },
  ja: {
    propertyNotFound: "物件が見つかりません。",
    bookPropertyTitle: "予約する",
    nightShort: "泊",
    bookingDatesLoadError: "日付情報を読み込めませんでした",
    guestInfoSectionTitle: "予約者情報",
    bookingGuestNamePlaceholder: "氏名",
    agreeTermsPrivacyBooking: "規約と個人情報の取り扱いに同意します（必須）",
    proceedToPaymentStep: "支払いへ進む",
    selectPaymentMethod: "支払い方法を選択",
    priceBreakdown: "料金内訳",
    perWeekSlash: "（週あたり）",
    petsShort: "ペット",
    petCountClassifier: "匹",
    perPetPerWeekSlash: "（匹・週あたり）",
    bookingServiceFee: "予約手数料",
    totalAmountLabel: "合計",
    agreePaymentTermsCheckbox: "支払い条件に同意します（必須）",
    payNow: "支払う",
    processingInProgress: "処理中...",
    bookingDetailTitle: "予約詳細",
    paymentCompleteTitle: "お支払いが完了しました！",
    waitingHostApproval: "ホストの承認を待っています。",
    notifyWhenApprovedShort: "承認され次第お知らせします。",
    bookingSuccessGotIt: "閉じる",
    bookingNumberLabel: "予約番号",
    copyButton: "コピー",
    copiedButton: "コピー済み",
    bookingBadgeConfirmed: "確定",
    bookingBadgeCancelled: "キャンセル",
    bookingBadgePending: "承認待ち",
    propertyInfoHeading: "宿泊先情報",
    bookingDetailSectionTitle: "予約の詳細",
    bookerFieldLabel: "予約者",
    phoneFieldLabel: "電話番号",
    stayNightsUnit: "泊",
    specialRequestsHeading: "リクエスト",
    weeklyPriceShort: "週料金",
    petFeeShortLabel: "匹あたり",
    totalPaymentHeading: "お支払い合計",
    paymentStatusPaidLabel: "支払い済み",
    paymentStatusPendingLabel: "未払い",
    backToHomeButton: "ホームに戻る",
    viewBookingsHistoryButton: "予約履歴を見る",
    reservationServerTimeDetail:
      "サーバー時刻を確認できません。しばらくしてから再度お試しください。",
    hostManageBookedPropertiesTitle: "予約中の物件管理",
    hostTabBookedProperties: "予約中",
    hostTabCompletedReservations: "完了済み",
    emptyNoActiveReservations: "予約中の物件はありません。",
    emptyNoCompletedReservations: "完了した予約はありません。",
    tenantInfoHeading: "借主情報",
    confirmReservationBtn: "予約を確定",
    markStayCompletedBtn: "滞在完了にする",
    deleteHistoryRecordTitle: "記録を削除",
    hostApproveBooking: "承認",
    cancelPolicyAgreeRequired: "キャンセル規約に同意してください。",
    bookingCancelledToast: "予約をキャンセルしました。",
    bookingCancelFailed: "キャンセルに失敗しました。",
    confirmDeleteBookingRecord: "この予約記録を削除しますか？",
    bookingDeletedToast: "削除しました。",
    bookingDeleteFailed: "削除に失敗しました。",
    checkInOutScheduleTitle: "チェックイン・チェックアウト時間",
    importExternalCalendar: "外部カレンダーを取り込む",
    calendarPlatformLabel: "プラットフォーム",
    calendarOptionNone: "なし",
    calendarOptionOther: "その他",
    calendarNameLabel: "カレンダー名",
    calendarNamePlaceholderExample: "例: Airbnb予約",
    removeAddressAriaLabel: "住所を削除",
    backNavLabel: "戻る",
    kycFirebasePhoneTitle: "Firebase電話番号認証",
    kycFirebasePhoneSubtitle: "Google Firebaseによる安全な電話番号認証",
    kycPhoneVerificationHeading: "電話番号認証",
    kycPhoneVerificationForHostDesc:
      "ホスト認証のため電話番号を認証してください",
    kycPhoneVerifiedLong: "✅ 電話番号認証が完了しました。",
    kycNextStep: "次へ",
    kycTestModeProceed: "テストモードで進む",
    calWarnTitleOwner: "期間を設定できません",
    calWarnTitleGuest: "予約できません",
    calWarnMinSevenBody:
      "7日単位でのみ予約できます。選択日から賃貸終了日まで7日未満です。別の日付を選んでください。",
    calSelectRentalStart: "賃貸開始日を選択",
    calSelectRentalEnd: "賃貸終了日を選択",
    calSelectCheckIn: "チェックイン日を選択",
    calSelectCheckOut: "チェックアウト日を選択",
    calOwnerLegendSelectableStart: "開始日として選択可能",
    calOwnerLegendSelectedStart: "選択した開始日",
    calOwnerLegendEndHint: "終了日（7日刻み、最大約3か月）",
    calOwnerLegendWithinPeriod:
      "賃貸期間中（クリックで開始日を変更）",
    calOwnerLegendOtherDates: "その他の日付（クリックで開始日を変更）",
    calOwnerSelectStartFirst: "先に開始日を選択してください",
    calGuestLegendAvailable: "選択可能な日付",
    calGuestLegendMinSeven:
      "最低7泊、ブロック日を除く（チェックアウトは自由）",
    calGuestLegendBooked: "予約済み / 予約不可",
    calGuestLegendCheckoutOk: "既存予約のチェックアウト（チェックイン可）",
    calGuestLegendShortStay: "利用可能が7日未満（チェックイン不可）",
    calGuestLegendCheckinToEnd: "物件終了日（または上限）まで",
    calGuestLegendValidCheckout: "有効なチェックアウト（7泊以上・重複なし）",
    calGuestSelectCheckInFirst: "先にチェックイン日を選択してください",
    weeklyCostLabel: "/ 週",
  },
  zh: {
    propertyNotFound: "未找到该房源。",
    bookPropertyTitle: "预订",
    nightShort: "晚",
    bookingDatesLoadError: "无法加载日期信息",
    guestInfoSectionTitle: "预订人信息",
    bookingGuestNamePlaceholder: "姓名",
    agreeTermsPrivacyBooking: "同意条款与隐私政策（必填）",
    proceedToPaymentStep: "前往支付",
    selectPaymentMethod: "选择支付方式",
    priceBreakdown: "费用明细",
    perWeekSlash: "（每周）",
    petsShort: "宠物",
    petCountClassifier: "只",
    perPetPerWeekSlash: "（每只/周）",
    bookingServiceFee: "预订服务费",
    totalAmountLabel: "合计",
    agreePaymentTermsCheckbox: "同意支付条款（必填）",
    payNow: "支付",
    processingInProgress: "处理中...",
    bookingDetailTitle: "预订详情",
    paymentCompleteTitle: "支付完成！",
    waitingHostApproval: "等待房东确认。",
    notifyWhenApprovedShort: "确认后我们会通知您。",
    bookingSuccessGotIt: "知道了",
    bookingNumberLabel: "预订编号",
    copyButton: "复制",
    copiedButton: "已复制",
    bookingBadgeConfirmed: "已确认",
    bookingBadgeCancelled: "已取消",
    bookingBadgePending: "待批准",
    propertyInfoHeading: "房源信息",
    bookingDetailSectionTitle: "预订详情",
    bookerFieldLabel: "预订人",
    phoneFieldLabel: "联系电话",
    stayNightsUnit: "晚",
    specialRequestsHeading: "特殊要求",
    weeklyPriceShort: "周价格",
    petFeeShortLabel: "每只",
    totalPaymentHeading: "支付总额",
    paymentStatusPaidLabel: "已支付",
    paymentStatusPendingLabel: "待支付",
    backToHomeButton: "返回首页",
    viewBookingsHistoryButton: "查看预订记录",
    reservationServerTimeDetail:
      "无法校验服务器时间，请稍后重试。",
    hostManageBookedPropertiesTitle: "已预订房源管理",
    hostTabBookedProperties: "进行中的预订",
    hostTabCompletedReservations: "已完成",
    emptyNoActiveReservations: "暂无进行中的预订。",
    emptyNoCompletedReservations: "暂无已完成的预订。",
    tenantInfoHeading: "租客信息",
    confirmReservationBtn: "确认预订",
    markStayCompletedBtn: "标记为已完成",
    deleteHistoryRecordTitle: "删除记录",
    hostApproveBooking: "批准",
    cancelPolicyAgreeRequired: "请同意取消政策。",
    bookingCancelledToast: "预订已取消。",
    bookingCancelFailed: "取消失败。",
    confirmDeleteBookingRecord: "删除此预订记录？",
    bookingDeletedToast: "已删除。",
    bookingDeleteFailed: "删除失败。",
    checkInOutScheduleTitle: "入住/退房时间",
    importExternalCalendar: "导入外部日历",
    calendarPlatformLabel: "平台",
    calendarOptionNone: "不选择",
    calendarOptionOther: "其他",
    calendarNameLabel: "日历名称",
    calendarNamePlaceholderExample: "例如：Airbnb预订",
    removeAddressAriaLabel: "删除地址",
    backNavLabel: "返回",
    kycFirebasePhoneTitle: "Firebase 手机验证",
    kycFirebasePhoneSubtitle: "通过 Google Firebase 进行安全的手机验证",
    kycPhoneVerificationHeading: "手机验证",
    kycPhoneVerificationForHostDesc: "请验证手机号以完成房东认证",
    kycPhoneVerifiedLong: "✅ 手机验证已完成。",
    kycNextStep: "下一步",
    kycTestModeProceed: "以测试模式继续",
    calWarnTitleOwner: "无法设置日期范围",
    calWarnTitleGuest: "无法预订",
    calWarnMinSevenBody:
      "仅支持按7天为单位预订。所选日期距离租期结束不足7天，请选择其他日期。",
    calSelectRentalStart: "选择租期开始日",
    calSelectRentalEnd: "选择租期结束日",
    calSelectCheckIn: "选择入住日期",
    calSelectCheckOut: "选择退房日期",
    calOwnerLegendSelectableStart: "可选为开始日",
    calOwnerLegendSelectedStart: "已选开始日",
    calOwnerLegendEndHint: "结束日（7天步进，最长约3个月）",
    calOwnerLegendWithinPeriod: "租期内（点击更改开始日）",
    calOwnerLegendOtherDates: "其他日期（点击更改开始日）",
    calOwnerSelectStartFirst: "请先选择开始日",
    calGuestLegendAvailable: "可选日期",
    calGuestLegendMinSeven: "至少7晚，排除已占用（退房灵活）",
    calGuestLegendBooked: "已预订 / 不可订",
    calGuestLegendCheckoutOk: "既有预订退房日（可入住）",
    calGuestLegendShortStay: "可用不足7天（不可入住）",
    calGuestLegendCheckinToEnd: "至房源结束日（或上限）",
    calGuestLegendValidCheckout: "有效退房（≥7晚且不重叠）",
    calGuestSelectCheckInFirst: "请先选择入住日期",
    weeklyCostLabel: "/ 周",
  },
};

function fmtLangBlock(lang, indent = "    ") {
  const o = PACK[lang];
  return Object.entries(o)
    .map(([k, v]) => {
      const safe = String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `${indent}${k}: '${safe}',`;
    })
    .join("\n");
}

let s = fs.readFileSync(I18N, "utf8");

if (s.includes("| 'weeklyCostLabel'")) {
  console.log("patch-user-i18n: already applied, skip");
  process.exit(0);
}

s = s.replace(
  / \| 'deleteAccountFooterNote';/,
  ` | 'deleteAccountFooterNote'${NEW_KEYS};`,
);

function injectBefore(hay, needle, insert) {
  const i = hay.indexOf(needle);
  if (i < 0) throw new Error("needle not found: " + needle);
  return hay.slice(0, i) + insert + hay.slice(i);
}

const koNeedle = `\n  },\n  vi: {`;
const viNeedle = `\n  },\n  en: {`;
const enNeedle = `\n  },\n  ja: {`;
const jaNeedle = `\n  },\n  zh: {`;
const zhNeedle = `\n  },\n};\n\n/**`;

s = injectBefore(s, koNeedle, "\n" + fmtLangBlock("ko"));
s = injectBefore(s, viNeedle, "\n" + fmtLangBlock("vi"));
s = injectBefore(s, enNeedle, "\n" + fmtLangBlock("en"));
s = injectBefore(s, jaNeedle, "\n" + fmtLangBlock("ja"));
s = injectBefore(s, zhNeedle, "\n" + fmtLangBlock("zh"));

const helper = `
export const CALENDAR_MONTH_NAMES: Record<SupportedLanguage, readonly string[]> = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

export const CALENDAR_DAY_NAMES: Record<SupportedLanguage, readonly string[]> = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  zh: ['日', '一', '二', '三', '四', '五', '六'],
};

export function formatBookingGuestSummary(
  language: SupportedLanguage,
  adults: number,
  children: number,
): string {
  if (children > 0) {
    switch (language) {
      case 'ko':
        return \`성인 \${adults}명, 어린이 \${children}명\`;
      case 'vi':
        return \`\${adults} người lớn, \${children} trẻ em\`;
      case 'ja':
        return \`大人\${adults}名、子ども\${children}名\`;
      case 'zh':
        return \`成人\${adults}人，儿童\${children}人\`;
      default:
        return \`\${adults} adults, \${children} children\`;
    }
  }
  switch (language) {
    case 'ko':
      return \`성인 \${adults}명\`;
    case 'vi':
      return \`\${adults} người lớn\`;
    case 'ja':
      return \`大人\${adults}名\`;
    case 'zh':
      return \`成人\${adults}人\`;
    default:
      return \`\${adults} adults\`;
  }
}

export function formatCheckInOutLine(
  language: SupportedLanguage,
  checkInTime: string,
  checkOutTime: string,
): string {
  const ci = getUIText('checkIn', language);
  const co = getUIText('checkOut', language);
  const inT = checkInTime || '14:00';
  const outT = checkOutTime || '12:00';
  return \`\${ci} \${inT} · \${co} \${outT}\`;
}
`;

s = s.replace(
  /\n\/\*\*\n \* 언어별 UI 텍스트 가져오기/,
  `${helper}\n/**\n * 언어별 UI 텍스트 가져오기`,
);

fs.writeFileSync(I18N, s);
console.log("patched", I18N);
