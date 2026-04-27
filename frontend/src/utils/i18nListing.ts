/**
 * 매물 등록·수정·상세 전용 i18n 키 (5개국어).
 * 메인 i18n.ts 사전과 분리해 유지보수·추가를 단순화한다.
 */
import type { SupportedLanguage } from "@/lib/api/translation";

export type ListingTextKey =
  | "valAddrRequired"
  | "valAddrGeoRequired"
  | "valPickCity"
  | "valPickDistrict"
  | "valMinOnePhoto"
  | "valWeeklyRentEmpty"
  | "valWeeklyRentBad"
  | "valPickPropType"
  | "valPropTitleEmpty"
  | "valNeedLogin"
  | "valPickBothRentalDates"
  | "valRentalDates91"
  | "valRental7dSteps"
  | "valKyc123Required"
  | "valUploadFailPrefix"
  | "valDupListingAddr"
  | "valRegisterUnexpected"
  | "valEditPickAddress"
  | "valOpenCalendarCheckDates"
  | "alertEditSaved"
  | "alertErrPrefix"
  | "listingWantRentDates"
  | "listingLabelStart"
  | "listingLabelEnd"
  | "listingFindAddrBtn"
  | "listingAddrPinnedHint"
  | "listingAddrRemoveAria"
  | "listingCityAutoHint"
  | "listingCityDistHeader"
  | "listingUnitBlockTitle"
  | "listingWing"
  | "listingRoomNo"
  | "listingWingPh"
  | "listingRoomPh"
  | "listingUnitPrivacyGuest"
  | "listingPhotoHeading"
  | "listingAddShort"
  | "listingDescViNotice"
  | "listingKindTitle"
  | "listingPolicyFacilitiesTitle"
  | "listingMaxPets"
  | "listingPetFeePerHead"
  | "listingCleansPerWeek"
  | "listingCleanSuffixTimes"
  | "listingBadgeAllFacilities"
  | "listingIcalBlurb"
  | "propTypeStudio"
  | "propTypeOneRoom"
  | "propTypeTwoRoom"
  | "propTypeThreePlus"
  | "propTypeDetached"
  | "addFormSubtitle"
  | "addSubmitCta"
  | "addSubmitting"
  | "addDoneTitle"
  | "addDoneLine"
  | "addGoMyprops"
  | "editFormTitle"
  | "editFormSubtitle"
  | "editSaving"
  | "editSubmitCta"
  | "editRelistCta"
  | "editRentalRangeWarn"
  | "detPolicyTitle"
  | "detBathCount"
  | "detAreaLabel"
  | "detGuestSuffix"
  | "detCityDistLine"
  | "detAvailRange"
  | "petsTravelQuestion"
  | "detUnitBlock"
  | "detUnitTenantOnly"
  | "detExtCalTitle"
  | "detCalNameField"
  | "detIcalUrlField"
  | "priceHeroPerWeek"
  | "cardBadgeWifi"
  | "a11yImgPrev"
  | "a11yImgNext"
  | "a11yImgFs"
  | "a11yImgDot"
  | "facBadgeGot"
  | "facMaxShort"
  | "facEachPet"
  | "facTimesPerWeek"
  | "curVnd"
  | "curUsd"
  | "curKrw"
  | "areaUnitSqm"
  | "listingPhotoGuideTitle"
  | "listingPhotoGuideTap"
  | "listingLibraryBackLabel"
  | "listingAddrSearchPlaceholder"
  | "listingAddrMapDragHint"
  | "listingAddrVerifying"
  | "listingAddrEmptyMapHint"
  | "listingAddrConfirmPin"
  | "listingAddrErrNoPlaceId"
  | "listingAddrErrDetailNotFound"
  | "listingAddrErrVietnamOnly"
  | "listingAddrErrCoordsMissing"
  | "listingAddrErrCoordsInvalid"
  | "listingAddrErrFetchError"
  | "listingAddrErrSelectAddress"
  | "listingAddrErrVerifyMap";

/** 사진첩에서 N장 추가 (언어별 어순) */
export function formatListingAddPhotosCount(count: number, lang: SupportedLanguage): string {
  const m: Record<SupportedLanguage, string> = {
    ko: `선택한 ${count}장 추가`,
    vi: `Thêm ${count} ảnh đã chọn`,
    en: `Add ${count} selected`,
    ja: `選択した ${count}枚を追加`,
    zh: `添加选中的 ${count} 张`,
  };
  return m[lang] ?? m.en;
}

export const listingTexts: Record<SupportedLanguage, Record<ListingTextKey, string>> = {
  ko: {
    valAddrRequired: "주소를 입력해주세요.",
    valAddrGeoRequired:
      "주소를 선택하여 좌표를 설정해주세요. 주소 입력 버튼을 클릭하여 주소를 확인해주세요.",
    valPickCity: "도시를 선택해주세요.",
    valPickDistrict: "구를 선택해주세요.",
    valMinOnePhoto: "최소 1장의 사진을 등록해주세요.",
    valWeeklyRentEmpty: "1주일 임대료를 입력해주세요.",
    valWeeklyRentBad: "유효한 임대료를 입력해주세요.",
    valPickPropType: "매물 종류를 선택해주세요.",
    valPropTitleEmpty: "매물명을 입력해주세요.",
    valNeedLogin: "로그인이 필요합니다.",
    valPickBothRentalDates: "임대 시작일과 종료일을 선택해주세요.",
    valRentalDates91: "임대 시작일과 종료일은 오늘 기준 최대 91일 이내에서 선택해주세요.",
    valRental7dSteps: "임대 기간은 7일 단위이며, 최대 약 3개월(91일)까지 선택할 수 있습니다.",
    valKyc123Required: "매물을 등록하려면 KYC 인증 1~3단계를 모두 완료해야 합니다.",
    valUploadFailPrefix: "사진 업로드 실패: ",
    valDupListingAddr: "이미 동일한 주소와 날짜에 등록된 매물이 있습니다.",
    valRegisterUnexpected: "매물 등록 중 오류가 발생했습니다.",
    valEditPickAddress: "주소를 선택해주세요.",
    valOpenCalendarCheckDates: "임대날짜를 다시 확인하세요.",
    alertEditSaved: "수정 완료!",
    alertErrPrefix: "오류가 발생했습니다: ",
    listingWantRentDates: "임대 희망 날짜",
    listingLabelStart: "시작일",
    listingLabelEnd: "종료일",
    listingFindAddrBtn: "주소 찾기",
    listingAddrPinnedHint: "확정된 주소 (클릭하여 수정)",
    listingAddrRemoveAria: "주소 삭제",
    listingCityAutoHint: "주소 입력 후 자동",
    listingCityDistHeader: "도시·구",
    listingUnitBlockTitle: "동호수",
    listingWing: "동",
    listingRoomNo: "호실",
    listingWingPh: "예: A",
    listingRoomPh: "예: 101",
    listingUnitPrivacyGuest: "동호수는 예약 완료 후 임차인에게만 표시됩니다.",
    listingPhotoHeading: "사진 등록",
    listingAddShort: "추가",
    listingDescViNotice: "베트남어로 입력해주세요. 자동 번역 기능이 제공됩니다.",
    listingKindTitle: "매물 종류",
    listingPolicyFacilitiesTitle: "숙소시설 및 정책",
    listingMaxPets: "최대 마리수",
    listingPetFeePerHead: "펫 수수료 (마리당)",
    listingCleansPerWeek: "주당 청소 횟수",
    listingCleanSuffixTimes: "회",
    listingBadgeAllFacilities: "모든 아이콘 선택시 뱃지 획득",
    listingIcalBlurb: "에어비앤비, 아고다 등 예약을 500stay와 동기화합니다.",
    propTypeStudio: "스튜디오",
    propTypeOneRoom: "원룸(방·거실 분리)",
    propTypeTwoRoom: "2룸",
    propTypeThreePlus: "3+룸",
    propTypeDetached: "독채",
    addFormSubtitle: "매물 정보를 입력해주세요",
    addSubmitCta: "매물 등록하기",
    addSubmitting: "등록 중...",
    addDoneTitle: "매물 등록 완료!",
    addDoneLine: "내 매물 목록에서 바로 확인할 수 있어요.",
    addGoMyprops: "내 매물 보러가기",
    editFormTitle: "매물 수정",
    editFormSubtitle: "매물 정보를 수정해주세요",
    editSaving: "수정 중...",
    editSubmitCta: "매물 수정",
    editRelistCta: "재등록",
    editRentalRangeWarn: "임대날짜를 다시 확인하세요.",
    detPolicyTitle: "숙소시설 및 정책",
    detBathCount: "화장실 수",
    detAreaLabel: "면적",
    detGuestSuffix: "명",
    detCityDistLine: "도시·구",
    detAvailRange: "이용 가능 기간",
    petsTravelQuestion: "애완동물과 함께 여행하시나요?",
    detUnitBlock: "동호수",
    detUnitTenantOnly: "예약 완료 후 임차인에게만 표시",
    detExtCalTitle: "외부 캘린더",
    detCalNameField: "캘린더",
    detIcalUrlField: "iCal URL",
    priceHeroPerWeek: "/주",
    cardBadgeWifi: "와이파이",
    a11yImgPrev: "이전 사진",
    a11yImgNext: "다음 사진",
    a11yImgFs: "전체화면",
    a11yImgDot: "사진",
    facBadgeGot: "뱃지 획득",
    facMaxShort: "최대 ",
    facEachPet: "마리당",
    facTimesPerWeek: "회/주",
    curVnd: "VND",
    curUsd: "USD",
    curKrw: "KRW",
    areaUnitSqm: "㎡",
    listingPhotoGuideTitle: "📸 추천 사진 가이드라인",
    listingPhotoGuideTap: "아무 곳이나 터치하여 카메라를 시작하세요",
    listingLibraryBackLabel: "사진첩",
    listingAddrSearchPlaceholder: "주소를 입력하세요 (예: 41 Hoang Sa)",
    listingAddrMapDragHint:
      "지도를 드래그해 마커 위치를 맞춘 뒤 아래 「위치 확정」을 눌러 주세요.",
    listingAddrVerifying: "위치 확인 중...",
    listingAddrEmptyMapHint: "주소를 검색하여 선택해 주세요",
    listingAddrConfirmPin: "위치 확정",
    listingAddrErrNoPlaceId: "주소 정보를 가져올 수 없습니다.",
    listingAddrErrDetailNotFound: "주소 상세 정보를 찾을 수 없습니다.",
    listingAddrErrVietnamOnly: "베트남 내 지역만 선택할 수 있습니다.",
    listingAddrErrCoordsMissing: "좌표 정보를 찾을 수 없습니다.",
    listingAddrErrCoordsInvalid: "유효하지 않은 좌표입니다.",
    listingAddrErrFetchError: "주소 정보를 가져오는 중 오류가 발생했습니다.",
    listingAddrErrSelectAddress: "주소를 선택해 주세요.",
    listingAddrErrVerifyMap: "지도에서 위치를 확인해 주세요.",
  },
  vi: {
    valAddrRequired: "Vui lòng nhập địa chỉ.",
    valAddrGeoRequired:
      "Vui lòng chọn địa chỉ để thiết lập tọa độ. Nhấp nút nhập địa chỉ để xác nhận.",
    valPickCity: "Vui lòng chọn thành phố.",
    valPickDistrict: "Vui lòng chọn quận.",
    valMinOnePhoto: "Vui lòng đăng ít nhất 1 ảnh.",
    valWeeklyRentEmpty: "Vui lòng nhập giá thuê 1 tuần.",
    valWeeklyRentBad: "Vui lòng nhập giá thuê hợp lệ.",
    valPickPropType: "Vui lòng chọn loại bất động sản.",
    valPropTitleEmpty: "Vui lòng nhập tên bất động sản.",
    valNeedLogin: "Cần đăng nhập.",
    valPickBothRentalDates: "Vui lòng chọn ngày bắt đầu và kết thúc thuê.",
    valRentalDates91: "Chọn ngày trong vòng 91 ngày kể từ hôm nay.",
    valRental7dSteps: "Thời hạn thuê theo bội 7 ngày, tối đa ~3 tháng (91 ngày).",
    valKyc123Required: "Hoàn thành tất cả bước KYC (1-3) để đăng bất động sản.",
    valUploadFailPrefix: "Tải ảnh lên thất bại: ",
    valDupListingAddr: "Đã có bất động sản với cùng địa chỉ và ngày.",
    valRegisterUnexpected: "Lỗi khi đăng ký bất động sản.",
    valEditPickAddress: "Vui lòng chọn địa chỉ.",
    valOpenCalendarCheckDates: "Vui lòng kiểm tra lại ngày thuê.",
    alertEditSaved: "Chỉnh sửa hoàn tất!",
    alertErrPrefix: "Đã xảy ra lỗi: ",
    listingWantRentDates: "Ngày cho thuê mong muốn",
    listingLabelStart: "Ngày bắt đầu",
    listingLabelEnd: "Ngày kết thúc",
    listingFindAddrBtn: "Tìm địa chỉ",
    listingAddrPinnedHint: "Địa chỉ đã xác nhận (nhấn để sửa)",
    listingAddrRemoveAria: "Xóa địa chỉ",
    listingCityAutoHint: "Tự động sau khi nhập địa chỉ",
    listingCityDistHeader: "Thành phố·Quận",
    listingUnitBlockTitle: "Tòa·Căn",
    listingWing: "Tòa",
    listingRoomNo: "Căn",
    listingWingPh: "VD: A",
    listingRoomPh: "VD: 101",
    listingUnitPrivacyGuest: "Chỉ hiển thị cho người thuê sau khi đặt chỗ.",
    listingPhotoHeading: "Ảnh",
    listingAddShort: "Thêm",
    listingDescViNotice: "Vui lòng nhập tiếng Việt. Có hỗ trợ dịch tự động.",
    listingKindTitle: "Loại bất động sản",
    listingPolicyFacilitiesTitle: "Tiện ích và chính sách",
    listingMaxPets: "Số thú tối đa",
    listingPetFeePerHead: "Phí thú cưng (mỗi con)",
    listingCleansPerWeek: "Số lần dọn/tuần",
    listingCleanSuffixTimes: "lần",
    listingBadgeAllFacilities: "Chọn đủ biểu tượng để nhận huy hiệu",
    listingIcalBlurb: "Đồng bộ đặt phòng Airbnb, Agoda… với 500stay.",
    propTypeStudio: "Studio",
    propTypeOneRoom: "Phòng đơn (ngủ & khách riêng)",
    propTypeTwoRoom: "2 phòng",
    propTypeThreePlus: "3+ phòng",
    propTypeDetached: "Nhà riêng",
    addFormSubtitle: "Nhập thông tin bất động sản",
    addSubmitCta: "Đăng bất động sản",
    addSubmitting: "Đang đăng...",
    addDoneTitle: "Đăng thành công!",
    addDoneLine: "Xem ngay trong danh sách của bạn.",
    addGoMyprops: "Xem bất động sản của tôi",
    editFormTitle: "Chỉnh sửa",
    editFormSubtitle: "Cập nhật thông tin",
    editSaving: "Đang lưu...",
    editSubmitCta: "Lưu thay đổi",
    editRelistCta: "Đăng lại",
    editRentalRangeWarn: "Vui lòng kiểm tra lại ngày thuê.",
    detPolicyTitle: "Tiện ích và chính sách",
    detBathCount: "Số phòng tắm",
    detAreaLabel: "Diện tích",
    detGuestSuffix: " người",
    detCityDistLine: "Thành phố·Quận",
    detAvailRange: "Khoảng thời gian có sẵn",
    petsTravelQuestion: "Bạn có đi cùng thú cưng?",
    detUnitBlock: "Số phòng",
    detUnitTenantOnly: "Chỉ hiển thị sau khi đặt chỗ",
    detExtCalTitle: "Lịch ngoài",
    detCalNameField: "Lịch",
    detIcalUrlField: "iCal URL",
    priceHeroPerWeek: "/tuần",
    cardBadgeWifi: "Wi-Fi",
    a11yImgPrev: "Ảnh trước",
    a11yImgNext: "Ảnh sau",
    a11yImgFs: "Toàn màn hình",
    a11yImgDot: "ảnh",
    facBadgeGot: "Huy hiệu",
    facMaxShort: "Tối đa ",
    facEachPet: "/con",
    facTimesPerWeek: "lần/tuần",
    curVnd: "VND",
    curUsd: "USD",
    curKrw: "KRW",
    areaUnitSqm: "m²",
    listingPhotoGuideTitle: "📸 Hướng dẫn ảnh đề xuất",
    listingPhotoGuideTap: "Chạm vào bất kỳ đâu để bắt đầu camera",
    listingLibraryBackLabel: "Thư viện ảnh",
    listingAddrSearchPlaceholder: "Nhập địa chỉ (VD: 41 Hoang Sa)",
    listingAddrMapDragHint:
      "Kéo bản đồ để căn vị trí marker, sau đó nhấn 「Xác nhận vị trí」 bên dưới.",
    listingAddrVerifying: "Đang xác nhận vị trí...",
    listingAddrEmptyMapHint: "Vui lòng tìm kiếm và chọn địa chỉ",
    listingAddrConfirmPin: "Xác nhận vị trí",
    listingAddrErrNoPlaceId: "Không thể lấy thông tin địa chỉ.",
    listingAddrErrDetailNotFound: "Không tìm thấy thông tin chi tiết địa chỉ.",
    listingAddrErrVietnamOnly: "Chỉ có thể chọn khu vực trong Việt Nam.",
    listingAddrErrCoordsMissing: "Không tìm thấy thông tin tọa độ.",
    listingAddrErrCoordsInvalid: "Tọa độ không hợp lệ.",
    listingAddrErrFetchError: "Đã xảy ra lỗi khi lấy thông tin địa chỉ.",
    listingAddrErrSelectAddress: "Vui lòng chọn địa chỉ.",
    listingAddrErrVerifyMap: "Vui lòng xác nhận vị trí trên bản đồ.",
  },
  en: {
    valAddrRequired: "Please enter an address.",
    valAddrGeoRequired:
      "Select an address to set coordinates. Use the address button to verify.",
    valPickCity: "Please select a city.",
    valPickDistrict: "Please select a district.",
    valMinOnePhoto: "Please upload at least 1 photo.",
    valWeeklyRentEmpty: "Please enter weekly rent.",
    valWeeklyRentBad: "Please enter a valid rent amount.",
    valPickPropType: "Please select property type.",
    valPropTitleEmpty: "Please enter property name.",
    valNeedLogin: "Please log in.",
    valPickBothRentalDates: "Please select rental start and end dates.",
    valRentalDates91: "Select dates within 91 days from today.",
    valRental7dSteps: "Rental length must be in 7-day steps, up to ~3 months (91 days).",
    valKyc123Required: "Complete all KYC steps (1-3) to list a property.",
    valUploadFailPrefix: "Photo upload failed: ",
    valDupListingAddr: "A listing already exists for this address and dates.",
    valRegisterUnexpected: "An error occurred while registering the property.",
    valEditPickAddress: "Please select an address.",
    valOpenCalendarCheckDates: "Please verify rental dates.",
    alertEditSaved: "Updated!",
    alertErrPrefix: "Error: ",
    listingWantRentDates: "Desired rental dates",
    listingLabelStart: "Start date",
    listingLabelEnd: "End date",
    listingFindAddrBtn: "Find address",
    listingAddrPinnedHint: "Confirmed address (tap to edit)",
    listingAddrRemoveAria: "Remove address",
    listingCityAutoHint: "Filled in after you set the address",
    listingCityDistHeader: "City·District",
    listingUnitBlockTitle: "Building & unit",
    listingWing: "Building",
    listingRoomNo: "Unit",
    listingWingPh: "e.g. A",
    listingRoomPh: "e.g. 101",
    listingUnitPrivacyGuest: "Building/unit is shown to guests only after booking.",
    listingPhotoHeading: "Photos",
    listingAddShort: "Add",
    listingDescViNotice: "Enter in Vietnamese. Auto-translation is available.",
    listingKindTitle: "Property type",
    listingPolicyFacilitiesTitle: "Facilities & policy",
    listingMaxPets: "Max pets",
    listingPetFeePerHead: "Pet fee (each)",
    listingCleansPerWeek: "Cleanings per week",
    listingCleanSuffixTimes: "×",
    listingBadgeAllFacilities: "Select all icons to earn a badge",
    listingIcalBlurb: "Sync Airbnb, Agoda, etc. bookings with 500stay.",
    propTypeStudio: "Studio",
    propTypeOneRoom: "One room (bedroom & living room separate)",
    propTypeTwoRoom: "2 rooms",
    propTypeThreePlus: "3+ rooms",
    propTypeDetached: "Detached house",
    addFormSubtitle: "Enter listing details",
    addSubmitCta: "Submit listing",
    addSubmitting: "Submitting...",
    addDoneTitle: "Listing created!",
    addDoneLine: "You can view it in My properties.",
    addGoMyprops: "Go to my properties",
    editFormTitle: "Edit listing",
    editFormSubtitle: "Update your listing",
    editSaving: "Saving...",
    editSubmitCta: "Save changes",
    editRelistCta: "Re-list",
    editRentalRangeWarn: "Please verify rental dates.",
    detPolicyTitle: "Facilities & policy",
    detBathCount: "Bathrooms",
    detAreaLabel: "Area",
    detGuestSuffix: " guests",
    detCityDistLine: "City·District",
    detAvailRange: "Available period",
    petsTravelQuestion: "Traveling with pets?",
    detUnitBlock: "Unit",
    detUnitTenantOnly: "Visible to guests after booking",
    detExtCalTitle: "External calendar",
    detCalNameField: "Calendar",
    detIcalUrlField: "iCal URL",
    priceHeroPerWeek: "/week",
    cardBadgeWifi: "Wi-Fi",
    a11yImgPrev: "Previous photo",
    a11yImgNext: "Next photo",
    a11yImgFs: "Full screen",
    a11yImgDot: "photo",
    facBadgeGot: "Badge",
    facMaxShort: "Max ",
    facEachPet: "/pet",
    facTimesPerWeek: "/wk",
    curVnd: "VND",
    curUsd: "USD",
    curKrw: "KRW",
    areaUnitSqm: "m²",
    listingPhotoGuideTitle: "📸 Recommended photo guidelines",
    listingPhotoGuideTap: "Tap anywhere to start the camera",
    listingLibraryBackLabel: "Library",
    listingAddrSearchPlaceholder: "Enter address (e.g., 41 Hoang Sa)",
    listingAddrMapDragHint:
      "Drag the map to align the marker, then tap 「Confirm location」 below.",
    listingAddrVerifying: "Verifying location...",
    listingAddrEmptyMapHint: "Search and select an address",
    listingAddrConfirmPin: "Confirm location",
    listingAddrErrNoPlaceId: "Could not load address information.",
    listingAddrErrDetailNotFound: "Address details not found.",
    listingAddrErrVietnamOnly: "Only locations within Vietnam can be selected.",
    listingAddrErrCoordsMissing: "Coordinates not found.",
    listingAddrErrCoordsInvalid: "Invalid coordinates.",
    listingAddrErrFetchError: "An error occurred while loading address information.",
    listingAddrErrSelectAddress: "Please select an address.",
    listingAddrErrVerifyMap: "Please confirm the location on the map.",
  },
  ja: {
    valAddrRequired: "住所を入力してください。",
    valAddrGeoRequired:
      "住所を選択して座標を設定してください。住所入力ボタンで確認してください。",
    valPickCity: "都市を選択してください。",
    valPickDistrict: "区を選択してください。",
    valMinOnePhoto: "写真を1枚以上登録してください。",
    valWeeklyRentEmpty: "1週間の賃料を入力してください。",
    valWeeklyRentBad: "有効な賃料を入力してください。",
    valPickPropType: "物件の種類を選択してください。",
    valPropTitleEmpty: "物件名を入力してください。",
    valNeedLogin: "ログインが必要です。",
    valPickBothRentalDates: "賃貸開始日と終了日を選択してください。",
    valRentalDates91: "今日から91日以内で日付を選んでください。",
    valRental7dSteps: "賃貸期間は7日単位、最長約3か月（91日）です。",
    valKyc123Required: "物件登録にはKYC認証1〜3をすべて完了してください。",
    valUploadFailPrefix: "写真アップロード失敗: ",
    valDupListingAddr: "同じ住所・日付の物件が既に登録されています。",
    valRegisterUnexpected: "登録中にエラーが発生しました。",
    valEditPickAddress: "住所を選択してください。",
    valOpenCalendarCheckDates: "賃貸日程を確認してください。",
    alertEditSaved: "編集完了！",
    alertErrPrefix: "エラー: ",
    listingWantRentDates: "賃貸希望日",
    listingLabelStart: "開始日",
    listingLabelEnd: "終了日",
    listingFindAddrBtn: "住所を検索",
    listingAddrPinnedHint: "確定した住所（タップで修正）",
    listingAddrRemoveAria: "住所を削除",
    listingCityAutoHint: "住所入力後に自動",
    listingCityDistHeader: "都市・区",
    listingUnitBlockTitle: "棟・号室",
    listingWing: "棟",
    listingRoomNo: "号室",
    listingWingPh: "例: A",
    listingRoomPh: "例: 101",
    listingUnitPrivacyGuest: "棟・号室は予約完了後にゲストに表示されます。",
    listingPhotoHeading: "写真",
    listingAddShort: "追加",
    listingDescViNotice: "ベトナム語で入力してください。自動翻訳があります。",
    listingKindTitle: "物件の種類",
    listingPolicyFacilitiesTitle: "施設とポリシー",
    listingMaxPets: "最大匹数",
    listingPetFeePerHead: "ペット料金（1匹あたり）",
    listingCleansPerWeek: "週あたり清掃回数",
    listingCleanSuffixTimes: "回",
    listingBadgeAllFacilities: "すべて選ぶとバッジ獲得",
    listingIcalBlurb: "Airbnb・Agoda等の予約を500stayと同期します。",
    propTypeStudio: "スタジオ",
    propTypeOneRoom: "ワンルーム（寝室・リビング別）",
    propTypeTwoRoom: "2ルーム",
    propTypeThreePlus: "3+ルーム",
    propTypeDetached: "一戸建て",
    addFormSubtitle: "物件情報を入力",
    addSubmitCta: "物件を登録",
    addSubmitting: "登録中...",
    addDoneTitle: "登録完了！",
    addDoneLine: "マイ物件から確認できます。",
    addGoMyprops: "マイ物件へ",
    editFormTitle: "物件を編集",
    editFormSubtitle: "情報を更新",
    editSaving: "保存中...",
    editSubmitCta: "保存",
    editRelistCta: "再登録",
    editRentalRangeWarn: "賃貸日程を確認してください。",
    detPolicyTitle: "施設とポリシー",
    detBathCount: "浴室数",
    detAreaLabel: "面積",
    detGuestSuffix: "名",
    detCityDistLine: "都市・区",
    detAvailRange: "利用可能期間",
    petsTravelQuestion: "ペットと一緒に旅行しますか？",
    detUnitBlock: "号室",
    detUnitTenantOnly: "予約後にゲストに表示",
    detExtCalTitle: "外部カレンダー",
    detCalNameField: "カレンダー",
    detIcalUrlField: "iCal URL",
    priceHeroPerWeek: "/週",
    cardBadgeWifi: "Wi-Fi",
    a11yImgPrev: "前の写真",
    a11yImgNext: "次の写真",
    a11yImgFs: "全画面",
    a11yImgDot: "写真",
    facBadgeGot: "バッジ",
    facMaxShort: "最大 ",
    facEachPet: "匹あたり",
    facTimesPerWeek: "回/週",
    curVnd: "VND",
    curUsd: "USD",
    curKrw: "KRW",
    areaUnitSqm: "㎡",
    listingPhotoGuideTitle: "📸 おすすめ写真ガイドライン",
    listingPhotoGuideTap: "どこかをタップしてカメラを開始",
    listingLibraryBackLabel: "写真ライブラリ",
    listingAddrSearchPlaceholder: "住所を入力（例: 41 Hoang Sa）",
    listingAddrMapDragHint:
      "地図をドラッグしてマーカー位置を合わせ、下の「位置を確定」を押してください。",
    listingAddrVerifying: "位置を確認しています...",
    listingAddrEmptyMapHint: "住所を検索して選択してください",
    listingAddrConfirmPin: "位置を確定",
    listingAddrErrNoPlaceId: "住所情報を取得できませんでした。",
    listingAddrErrDetailNotFound: "住所の詳細が見つかりません。",
    listingAddrErrVietnamOnly: "ベトナム国内の場所のみ選択できます。",
    listingAddrErrCoordsMissing: "座標情報が見つかりません。",
    listingAddrErrCoordsInvalid: "無効な座標です。",
    listingAddrErrFetchError: "住所情報の取得中にエラーが発生しました。",
    listingAddrErrSelectAddress: "住所を選択してください。",
    listingAddrErrVerifyMap: "地図上で位置を確認してください。",
  },
  zh: {
    valAddrRequired: "请输入地址。",
    valAddrGeoRequired: "请选择地址以设置坐标。请点击地址按钮确认。",
    valPickCity: "请选择城市。",
    valPickDistrict: "请选择区。",
    valMinOnePhoto: "请至少上传1张照片。",
    valWeeklyRentEmpty: "请输入1周租金。",
    valWeeklyRentBad: "请输入有效的租金。",
    valPickPropType: "请选择物业类型。",
    valPropTitleEmpty: "请输入房源名称。",
    valNeedLogin: "需要登录。",
    valPickBothRentalDates: "请选择租赁开始和结束日期。",
    valRentalDates91: "请在从今天起91天内选择日期。",
    valRental7dSteps: "租期为7天倍数，最长约3个月（91天）。",
    valKyc123Required: "完成KYC步骤1-3后方可发布房源。",
    valUploadFailPrefix: "照片上传失败：",
    valDupListingAddr: "该地址和日期已有房源。",
    valRegisterUnexpected: "注册房源时出错。",
    valEditPickAddress: "请选择地址。",
    valOpenCalendarCheckDates: "请再次确认租赁日期。",
    alertEditSaved: "修改完成！",
    alertErrPrefix: "发生错误：",
    listingWantRentDates: "租赁希望日期",
    listingLabelStart: "开始日期",
    listingLabelEnd: "结束日期",
    listingFindAddrBtn: "查找地址",
    listingAddrPinnedHint: "已确认地址（点击修改）",
    listingAddrRemoveAria: "清除地址",
    listingCityAutoHint: "填写地址后自动填写",
    listingCityDistHeader: "城市·区",
    listingUnitBlockTitle: "栋号·房号",
    listingWing: "栋",
    listingRoomNo: "房号",
    listingWingPh: "例：A",
    listingRoomPh: "例：101",
    listingUnitPrivacyGuest: "栋号·房号仅在预订完成后向租客显示。",
    listingPhotoHeading: "照片",
    listingAddShort: "添加",
    listingDescViNotice: "请用越南语输入。支持自动翻译。",
    listingKindTitle: "房源类型",
    listingPolicyFacilitiesTitle: "设施与政策",
    listingMaxPets: "最多宠物数",
    listingPetFeePerHead: "宠物费（每只）",
    listingCleansPerWeek: "每周清洁次数",
    listingCleanSuffixTimes: "次",
    listingBadgeAllFacilities: "选择全部图标可获得徽章",
    listingIcalBlurb: "将 Airbnb、Agoda 等预订与 500stay 同步。",
    propTypeStudio: "工作室",
    propTypeOneRoom: "一室（卧室与客厅分开）",
    propTypeTwoRoom: "2室",
    propTypeThreePlus: "3+室",
    propTypeDetached: "独栋",
    addFormSubtitle: "填写房源信息",
    addSubmitCta: "发布房源",
    addSubmitting: "提交中...",
    addDoneTitle: "发布成功！",
    addDoneLine: "可在我的房源中查看。",
    addGoMyprops: "查看我的房源",
    editFormTitle: "编辑房源",
    editFormSubtitle: "更新信息",
    editSaving: "保存中...",
    editSubmitCta: "保存",
    editRelistCta: "重新发布",
    editRentalRangeWarn: "请再次确认租赁日期。",
    detPolicyTitle: "设施与政策",
    detBathCount: "浴室数",
    detAreaLabel: "面积",
    detGuestSuffix: "人",
    detCityDistLine: "城市·区",
    detAvailRange: "可用期间",
    petsTravelQuestion: "与宠物一起出行吗？",
    detUnitBlock: "房号",
    detUnitTenantOnly: "预订后向租客显示",
    detExtCalTitle: "外部日历",
    detCalNameField: "日历",
    detIcalUrlField: "iCal URL",
    priceHeroPerWeek: "/周",
    cardBadgeWifi: "无线网络",
    a11yImgPrev: "上一张",
    a11yImgNext: "下一张",
    a11yImgFs: "全屏",
    a11yImgDot: "照片",
    facBadgeGot: "徽章",
    facMaxShort: "最多 ",
    facEachPet: "每只",
    facTimesPerWeek: "次/周",
    curVnd: "VND",
    curUsd: "USD",
    curKrw: "KRW",
    areaUnitSqm: "㎡",
    listingPhotoGuideTitle: "📸 推荐照片指南",
    listingPhotoGuideTap: "点击任意位置开始相机",
    listingLibraryBackLabel: "照片库",
    listingAddrSearchPlaceholder: "输入地址（例如：41 Hoang Sa）",
    listingAddrMapDragHint:
      "拖动地图对准标记位置，然后点击下方「确认位置」。",
    listingAddrVerifying: "正在确认位置...",
    listingAddrEmptyMapHint: "请搜索并选择地址",
    listingAddrConfirmPin: "确认位置",
    listingAddrErrNoPlaceId: "无法获取地址信息。",
    listingAddrErrDetailNotFound: "未找到地址详细信息。",
    listingAddrErrVietnamOnly: "仅可选择越南境内的地点。",
    listingAddrErrCoordsMissing: "未找到坐标信息。",
    listingAddrErrCoordsInvalid: "坐标无效。",
    listingAddrErrFetchError: "获取地址信息时出错。",
    listingAddrErrSelectAddress: "请选择地址。",
    listingAddrErrVerifyMap: "请在地图上确认位置。",
  },
};

const LISTING_KEY_SET = new Set<string>(Object.keys(listingTexts.ko));

export function isListingTextKey(key: string): key is ListingTextKey {
  return LISTING_KEY_SET.has(key);
}

/** 매물 유형 → i18n 키 */
export function getPropertyTypeListingKey(
  propertyType: string | undefined,
): ListingTextKey | null {
  const m: Record<string, ListingTextKey> = {
    studio: "propTypeStudio",
    one_room: "propTypeOneRoom",
    two_room: "propTypeTwoRoom",
    three_plus: "propTypeThreePlus",
    detached: "propTypeDetached",
  };
  return propertyType ? m[propertyType] ?? null : null;
}
