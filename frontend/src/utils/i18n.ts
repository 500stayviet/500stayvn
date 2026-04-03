/**
 * i18n (Internationalization) 유틸리티
 * 
 * 언어별 UI 텍스트를 관리하는 유틸리티 함수
 * - 로그인, 검색, 버튼 등의 텍스트를 언어에 따라 반환
 */

import { SupportedLanguage } from '@/lib/api/translation';

/**
 * UI 텍스트 타입 정의
 */
export type UITextKey = 
  | 'login'
  | 'logout'
  | 'search'
  | 'searchPlaceholder'
  | 'propertyList'
  | 'noProperties'
  | 'loading'
  | 'error'
  | 'retry'
  | 'addProperty'
  | 'bedroom'
  | 'bathroom'
  | 'area'
  | 'price'
  | 'address'
  | 'description'
  | 'translationLoading'
  | 'selectLanguage'
  | 'home'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'edit'
  | 'viewDetails'
  | 'email'
  | 'password'
  | 'signup'
  | 'signUp'
  | 'forgotPassword'
  | 'emailPlaceholder'
  | 'passwordPlaceholder'
  | 'myProperties'
  | 'back'
  | 'activeProperties'
  | 'listingLive'
  | 'adPausedByRule'
  | 'adminHiddenProperty'
  | 'tabAdvertLive'
  | 'tabAdvertPending'
  | 'tabAdvertSuspended'
  | 'minRentablePeriodHint'
  | 'tabAdvertDeleted'
  | 'expiredProperties'
  | 'rented'
  | 'notRented'
  | 'perWeek'
  | 'deleteConfirmTitle'
  | 'permanentDeleteConfirmTitle'
  | 'deleteConfirmDesc'
  | 'permanentDeleteConfirmDesc'
  | 'confirm'
  | 'processing'
  | 'notifications'
  | 'newMessagesGuest'
  | 'newMessagesHost'
  | 'unreadMessages'
  | 'myBookingsGuest'
  | 'bookingRequestsHost'
  | 'guest'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'markAllRead'
  | 'turnOffNotifications'
  | 'turnOnNotifications'
  | 'profile'
  | 'popularStaysNearby'
  | 'propertiesCount'
  | 'availableNow'
  | 'immediateEntry'
  | 'fullName'
  | 'phoneNumber'
  | 'gender'
  | 'male'
  | 'female'
  | 'preferredLanguage'
  | 'optional'
  | 'required'
  | 'signupWelcome'
  | 'signupSub'
  | 'signupSuccess'
  | 'signupSuccessSub'
  | 'start'
  | 'loginToSignup'
  | 'popularStaysTitle'
  | 'weeklyRent'
  | 'utilitiesIncluded'
  | 'checkInAfter'
  | 'checkOutBefore'
  | 'maxGuests'
  | 'adults'
  | 'children'
  | 'amenities'
  | 'noAmenities'
  | 'selectBookingDates'
  | 'checkIn'
  | 'checkOut'
  | 'selectDate'
  | 'bookNow'
  | 'selectDatesFirst'
  | 'availableDates'
  | 'whereDoYouWantToLive'
  | 'searching'
  | 'findPropertiesOnMap'
  | 'useCurrentLocation'
  | 'locationPermissionDesc'
  | 'allowLocationAccess'
  | 'skip'
  | 'requesting'
  | 'locationNotSupported'
  | 'tapToViewDetails'
  | 'zoomInToSeeExactLocation'
  | 'distanceFromCenter'
  | 'deny'
  | 'allow'
  | 'locationPermissionTitle'
  | 'welcomeBack'
  | 'noAccount'
  | 'accountDeletedDesc'
  | 'emailNotRegistered'
  | 'loginFailed'
  | 'errorOccurred'
  | 'googleContinue'
  | 'facebookContinue'
  | 'myPage'
  | 'hostMenu'
  | 'verified'
  | 'listYourProperty'
  | 'registerPropertyDesc'
  | 'verificationPending'
  | 'kycRequired'
  | 'manageMyProperties'
  | 'manageMyPropertiesDesc'
  | 'bookingManagement'
  | 'bookingManagementDesc'
  | 'hostFeaturesNotice'
  | 'guestMenu'
  | 'myBookings'
  | 'myBookingsDesc'
  | 'editProfile'
  | 'change'
  | 'confirmDeletion'
  | 'deleteAccountDesc'
  | 'deleteAccountSuccess'
  | 'deleteAccountSuccessDesc'
  | 'congratulations'
  | 'nowOwnerDesc'
  | 'profileImageUpdated'
  | 'profilePhoto'
  | 'uploadFailed'
  | 'notRegistered'
  | 'chat'
  | 'cancellation'
  | 'agreeCancellationPolicy'
  | 'activeBookings'
  | 'closedHistory'
  | 'bookingRequest'
  | 'bookingConfirmed'
  | 'requestCancelled'
  | 'bookingCancelled'
  | 'searchPlaceholderCityDistrict'
  | 'labelCity'
  | 'labelDistrict'
  | 'selectDistrictPlaceholder'
  | 'selectDatesAndGuests'
  | 'guestSelect'
  | 'maxSuffix'
  | 'guestOverMaxNotice'
  // 검색·고급필터 (5개국어)
  | 'advancedFilter'
  | 'rentWeekly'
  | 'minLabel'
  | 'maxLabel'
  | 'fullOption'
  | 'fullFurniture'
  | 'fullElectronics'
  | 'fullKitchen'
  | 'amenitiesPolicy'
  | 'cleaningShort'
  | 'roomsLabel'
  | 'selectLabel'
  | 'allLabel'
  | 'selectDatePlaceholder'
  | 'searchButton'
  | 'noResultsFound'
  | 'propertiesFound'
  | 'minExceedsMaxError'
  | 'maxBelowMinError'
  // 새로운 카테고리 텍스트
  | 'settlementWallet'
  | 'settlementWalletDesc'
  | 'settlementAccount'
  | 'settlementAccountDesc'
  | 'revenueHistory'
  | 'revenueHistoryDesc'
  | 'withdrawalRequest'
  | 'withdrawalRequestDesc'
  | 'bankAccountSetup'
  | 'bankAccountSetupDesc'
  | 'reviewManagement'
  | 'reviewManagementDesc'
  | 'wishlist'
  | 'wishlistDesc'
  | 'paymentMethodManagement'
  | 'paymentMethodManagementDesc'
  | 'coupons'
  | 'couponsDesc'
  | 'paymentMethodRequired'
  | 'paymentMethodRequiredDesc'
  // 정산 페이지 텍스트
  | 'availableBalance'
  | 'totalRevenue'
  | 'pendingWithdrawal'
  | 'recentRevenue'
  | 'viewAll'
  | 'rentalIncome'
  | 'nextPayout'
  | 'estimatedAmount'
  | 'requestWithdrawal'
  | 'withdrawalAmount'
  | 'availableForWithdrawal'
  | 'selectBankAccount'
  | 'selectAccount'
  | 'submitWithdrawalRequest'
  | 'withdrawalHistory'
  | 'registeredAccounts'
  | 'addNewAccount'
  | 'registerNewAccount'
  | 'bankName'
  | 'enterBankName'
  | 'accountNumber'
  | 'enterAccountNumber'
  | 'accountHolder'
  | 'enterAccountHolder'
  | 'setAsPrimaryAccount'
  | 'registerAccount'
  | 'primary'
  | 'completed'
  | 'setAsPrimary'
  // 임대수익 상태
  | 'incomeStatusPending'
  | 'incomeStatusConfirmed'
  | 'incomeStatusPayable'
  | 'incomeStatusSettlementHeld'
  | 'incomeStatusWithdrawable'
  | 'rentalPeriod'
  | 'title'
  | 'rentingInProgress'
  | 'withdrawalCompleted'
  | 'serverTimeSyncError'
  | 'systemMaintenance'
  // 매물명 관련
  | 'propertyName'
  | 'propertyNamePlaceholder'
  | 'titlePlaceholder'
  | 'propertyDescription'
  | 'propertyDescriptionPlaceholder'
  | 'confirmLogout'
  | 'logoutDesc'
  | 'languageChange'
  | 'language'
  | 'close'
  | 'selectLanguageDesc'
  | 'selectPhoto'
  | 'photoSelectConsentTitle'
  | 'photoSelectConsentDesc'
  | 'agree'
  | 'photoSourceMenuTitle'
  | 'selectFromLibrary'
  | 'takePhoto';

/**
 * 언어별 UI 텍스트 사전
 */
const uiTexts: Record<SupportedLanguage, Record<UITextKey, string>> = {
  ko: {
    login: '로그인',
    logout: '로그아웃',
    search: '검색',
    searchPlaceholder: '여행 예정 중인 도시를 검색하세요',
    propertyList: '매물 목록',
    noProperties: '등록된 매물이 없습니다.',
    loading: '로딩 중...',
    error: '오류가 발생했습니다.',
    retry: '다시 시도',
    addProperty: '새 매물 등록',
    bedroom: '베드',
    bathroom: '욕실',
    area: '㎡',
    price: '가격',
    address: '주소',
    description: '설명',
    translationLoading: '번역 중...',
    selectLanguage: '언어 선택',
    home: '홈',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    viewDetails: '상세보기',
    email: '이메일',
    password: '비밀번호',
    signup: '회원가입',
    signUp: '회원가입',
    forgotPassword: '비밀번호를 잊으셨나요?',
    emailPlaceholder: '이메일을 입력하세요',
    passwordPlaceholder: '비밀번호를 입력하세요',
    myProperties: '내 매물 관리',
    back: '뒤로',
    activeProperties: '등록 매물',
    listingLive: '노출 중',
    adPausedByRule: '최소 임대가능기간 부족',
    adminHiddenProperty: '정책위반',
    tabAdvertLive: '광고중',
    tabAdvertPending: '광고대기',
    tabAdvertSuspended: '광고종료',
    minRentablePeriodHint:
      '예약 취소 등으로 광고가 잠시 멈춘 매물입니다. 펜(수정)으로 기간을 맞춘 뒤 다시 광고중으로 올리세요.',
    tabAdvertDeleted: '삭제됨',
    expiredProperties: '광고 종료',
    rented: '계약 완료',
    notRented: '계약 전',
    perWeek: '주당 비용',
    deleteConfirmTitle: '매물 삭제',
    permanentDeleteConfirmTitle: '영구 삭제',
    deleteConfirmDesc: '삭제된 매물은 호스트 목록에서 사라지며, 관리자 감사 로그에서 확인할 수 있습니다.',
    permanentDeleteConfirmDesc: '이 작업은 절대 되돌릴 수 없습니다. 정말로 영구 삭제하시겠습니까?',
    confirm: '확인',
    processing: '처리중',
    notifications: '알림',
    newMessagesGuest: '새로운 메시지 (임차인)',
    newMessagesHost: '새로운 메시지 (임대인)',
    unreadMessages: '개의 읽지 않은 메시지가 있습니다',
    myBookingsGuest: '🏠 내 예약 (임차인)',
    bookingRequestsHost: '🔑 받은 예약 (임대인)',
    guest: '게스트',
    pending: '승인대기',
    confirmed: '예약확정',
    cancelled: '취소됨',
    markAllRead: '모두 읽음',
    turnOffNotifications: '알림 끄기',
    turnOnNotifications: '알림 켜기',
    profile: '개인정보',
    popularStaysNearby: '주변 인기 숙소',
    propertiesCount: '개의 매물',
    availableNow: '즉시 입주 가능',
    immediateEntry: '즉시 입주 가능',
    fullName: '이름',
    phoneNumber: '전화번호',
    gender: '성별',
    male: '남성',
    female: '여성',
    preferredLanguage: '주 사용 언어',
    optional: '선택',
    required: '필수',
    signupWelcome: '회원가입',
    signupSub: '새 계정을 만들어 시작하세요',
    signupSuccess: '회원가입 완료!',
    signupSuccessSub: '환영합니다! 이제 서비스를 이용하실 수 있습니다.',
    start: '시작하기',
    loginToSignup: '로그인으로',
    popularStaysTitle: '지금 가장 인기 있는 숙소',
    weeklyRent: '1주일 임대료',
    utilitiesIncluded: '공과금/관리비 포함',
    checkInAfter: '이후',
    checkOutBefore: '이전',
    maxGuests: '최대 인원 수',
    adults: '성인',
    children: '어린이',
    amenities: '편의시설',
    noAmenities: '편의시설 정보가 없습니다',
    selectBookingDates: '예약 날짜 선택',
    checkIn: '체크인',
    checkOut: '체크아웃',
    selectDate: '날짜 선택',
    bookNow: '예약하기',
    selectDatesFirst: '날짜를 선택하세요',
    availableDates: '임대 가능 날짜',
    whereDoYouWantToLive: '어디에서 살고 싶으신가요?',
    searching: '검색 중...',
    findPropertiesOnMap: '지도로 매물 찾기',
    useCurrentLocation: '현재 위치 사용',
    locationPermissionDesc: '지도에서 현재 위치를 표시하고 주변 매물을 찾기 위해 위치 정보가 필요합니다. 위치 정보는 지도에 내 위치 마커를 표시하는 데만 사용됩니다.',
    allowLocationAccess: '위치 권한 허용',
    skip: '건너뛰기',
    requesting: '요청 중...',
    locationNotSupported: '이 브라우저는 위치 서비스를 지원하지 않습니다.',
    tapToViewDetails: '탭하여 상세보기',
    zoomInToSeeExactLocation: '확대하면 각 매물의 정확한 위치를 확인할 수 있습니다',
    distanceFromCenter: '중심에서',
    deny: '거부',
    allow: '동의',
    locationPermissionTitle: '위치 권한 요청',
    welcomeBack: '환영합니다!',
    noAccount: '계정이 없으신가요?',
    accountDeletedDesc: '탈퇴한 계정입니다. 재가입이 필요합니다.',
    emailNotRegistered: '등록되지 않은 이메일입니다',
    loginFailed: '로그인 실패',
    errorOccurred: '오류 발생',
    googleContinue: 'Google로 계속하기',
    facebookContinue: 'Facebook으로 계속하기',
    myPage: '마이페이지',
    hostMenu: '임대인 메뉴',
    verified: '인증됨',
    listYourProperty: '우리집 내놓기',
    registerPropertyDesc: '매물 등록하기',
    verificationPending: '인증 심사 중',
    kycRequired: 'KYC 인증이 필요합니다',
    manageMyProperties: '내 매물 관리',
    manageMyPropertiesDesc: '등록한 매물을 관리합니다',
    bookingManagement: '예약 관리',
    bookingManagementDesc: '받은 예약을 확인/승인합니다',
    hostFeaturesNotice: 'KYC 인증 완료 후 모든 임대인 기능을 사용할 수 있습니다',
    guestMenu: '임차인 메뉴',
    myBookings: '예약한 매물',
    myBookingsDesc: '내가 예약한 숙소를 확인합니다',
    editProfile: '개인정보 수정',
    change: '변경',
    confirmDeletion: '회원탈퇴 확인',
    deleteAccountDesc: '정말 회원탈퇴를 하시겠습니까? 탈퇴 후 30일 이내에 재가입이 가능하며, 동일한 이메일로 가입할 수 있습니다.',
    deleteAccountSuccess: '회원탈퇴 완료',
    deleteAccountSuccessDesc: '회원탈퇴가 완료되었습니다. 30일 이내에 재가입이 가능하며, 동일한 이메일로 가입할 수 있습니다.',
    congratulations: '축하합니다!',
    nowOwnerDesc: '이제 임대인이 되었습니다. 정상적으로 매물 등록이 가능합니다.',
    profileImageUpdated: '프로필 사진이 변경되었습니다.',
    profilePhoto: '프로필 사진',
    uploadFailed: '업로드 실패',
    notRegistered: '등록되지 않음',
    chat: '채팅',
    cancellation: '취소',
    agreeCancellationPolicy: '취소 정책에 동의합니다',
    activeBookings: '활성 예약',
    closedHistory: '종료 내역',
    bookingRequest: '예약 요청',
    bookingConfirmed: '예약 확정',
    requestCancelled: '요청 취소',
    bookingCancelled: '예약 취소',
    searchPlaceholderCityDistrict: '여행할 도시와 구를 검색하세요',
    labelCity: '도시',
    labelDistrict: '구',
    selectDistrictPlaceholder: '구 선택',
    selectDatesAndGuests: '예약날짜 및 인원 선택',
    guestSelect: '인원 선택',
    maxSuffix: '(최대)',
    guestOverMaxNotice: '최대인원을 초과할시 인원추가료가 발생할 수 있습니다.',
    advancedFilter: '고급필터',
    rentWeekly: '임대료(주당)',
    minLabel: '최저',
    maxLabel: '최대',
    fullOption: '풀 옵션',
    fullFurniture: '풀 가구',
    fullElectronics: '풀 가전',
    fullKitchen: '풀옵션 주방',
    amenitiesPolicy: '시설·정책',
    cleaningShort: '집청소',
    roomsLabel: '방 개수',
    selectLabel: '선택',
    allLabel: '전체',
    selectDatePlaceholder: '날짜 선택',
    searchButton: '검색하기',
    noResultsFound: '검색 결과가 없습니다.',
    propertiesFound: '개의 매물을 찾았습니다.',
    minExceedsMaxError: '최저값은 최대값을 초과할 수 없습니다. 수정해 주세요.',
    maxBelowMinError: '최대값은 최저값보다 낮을 수 없습니다. 수정해 주세요.',
    // 새로운 카테고리 텍스트
    settlementWallet: '정산 및 지갑',
    settlementWalletDesc: '수익 관리 및 출금',
    settlementAccount: '정산 및 계좌',
    settlementAccountDesc: '수익 관리 및 계좌 설정',
    revenueHistory: '수익 내역',
    revenueHistoryDesc: '매출 및 수익 확인',
    withdrawalRequest: '출금 신청',
    withdrawalRequestDesc: '수익금 출금 요청',
    bankAccountSetup: '은행 계좌 설정',
    bankAccountSetupDesc: '출금 계좌 등록',
    reviewManagement: '리뷰 관리',
    reviewManagementDesc: '받은 리뷰 확인 및 관리',
    wishlist: '위시리스트',
    wishlistDesc: '저장한 매물 목록',
    paymentMethodManagement: '결제 수단 관리',
    paymentMethodManagementDesc: '카드 및 결제 방법 등록',
    coupons: '쿠폰',
    couponsDesc: '할인 쿠폰 관리',
    paymentMethodRequired: '결제 수단 등록 필요',
    paymentMethodRequiredDesc: '결제 수단 등록 시 활성화됩니다',
    // 정산 페이지 텍스트
    availableBalance: '출금 가능 금액',
    totalRevenue: '총 수익',
    pendingWithdrawal: '출금 대기',
    recentRevenue: '최근 수익',
    viewAll: '전체보기',
    rentalIncome: '임대 수익',
    nextPayout: '다음 지급일',
    estimatedAmount: '예상 금액',
    requestWithdrawal: '출금 신청',
    withdrawalAmount: '출금 금액',
    availableForWithdrawal: '출금 가능 금액',
    selectBankAccount: '은행 계좌 선택',
    selectAccount: '계좌 선택',
    submitWithdrawalRequest: '출금 신청하기',
    withdrawalHistory: '출금 내역',
    registeredAccounts: '등록된 계좌',
    addNewAccount: '새 계좌 추가',
    registerNewAccount: '새 계좌 등록',
    bankName: '은행명',
    enterBankName: '은행명 입력',
    accountNumber: '계좌번호',
    enterAccountNumber: '계좌번호 입력',
    accountHolder: '예금주',
    enterAccountHolder: '예금주 입력',
    setAsPrimaryAccount: '주 계좌로 설정',
    registerAccount: '계좌 등록',
    primary: '주 계좌',
    completed: '완료됨',
    setAsPrimary: '주 계좌로 설정',
    incomeStatusPending: '대기금액',
    incomeStatusConfirmed: '확정금액',
    incomeStatusPayable: '지급됨',
    incomeStatusSettlementHeld: '정산 보류',
    incomeStatusWithdrawable: '출금가능',
    rentalPeriod: '임대 기간',
    title: '매물명',
    rentingInProgress: '임대중',
    withdrawalCompleted: '출금완료',
    serverTimeSyncError: '서버 시간 동기화 실패',
    systemMaintenance: '시스템 점검 중',
    // 매물명 관련
    propertyName: '매물명',
    propertyNamePlaceholder: '예: 내 첫 번째 스튜디오',
    titlePlaceholder: '예: 내 첫 번째 스튜디오',
    propertyDescription: '매물 설명',
    propertyDescriptionPlaceholder: '매물에 대한 상세 설명을 입력해주세요.',
    confirmLogout: '로그아웃 확인',
    logoutDesc: '정말 로그아웃 하시겠습니까?',
    languageChange: '언어 변경',
    language: '언어',
    close: '닫기',
    selectLanguageDesc: '5개 국어 중에서 선택하세요',
    selectPhoto: '사진을 선택하세요',
    photoSelectConsentTitle: '사진첩 접근 허용',
    photoSelectConsentDesc: '프로필 사진을 등록하기 위해 사진첩(갤러리)으로 이동하는 것을 허용하시겠습니까?',
    agree: '동의',
    photoSourceMenuTitle: '사진 추가 방법 선택',
    selectFromLibrary: '사진첩에서 선택',
    takePhoto: '카메라로 촬영',
  },
  vi: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm kiếm thành phố bạn sẽ đến',
    propertyList: 'Danh sách bất động sản',
    noProperties: 'Không có bất động sản nào được đăng ký.',
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi.',
    retry: 'Thử lại',
    addProperty: 'Đăng ký bất động sản mới',
    bedroom: 'Phòng ngủ',
    bathroom: 'Phòng tắm',
    area: 'm²',
    price: 'Giá',
    address: 'Địa chỉ',
    description: 'Mô tả',
    translationLoading: 'Đang dịch...',
    selectLanguage: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    viewDetails: 'Xem chi tiết',
    email: 'Email',
    password: 'Mật khẩu',
    signup: 'Đăng ký',
    signUp: 'Đăng ký',
    forgotPassword: 'Quên mật khẩu?',
    emailPlaceholder: 'Nhập email của bạn',
    passwordPlaceholder: 'Nhập mật khẩu của bạn',
    myProperties: 'Quản lý bất động sản',
    back: 'Quay lại',
    activeProperties: 'Đang hoạt động',
    listingLive: 'Đang hiển thị',
    adPausedByRule: 'Tạm dừng QC (lưu dữ liệu)',
    adminHiddenProperty: 'Vi phạm chính sách',
    tabAdvertLive: 'Đang quảng cáo',
    tabAdvertPending: 'Chờ đăng lại',
    tabAdvertSuspended: 'Tạm dừng QC',
    minRentablePeriodHint:
      'Tin tạm dừng sau khi hủy đặt v.v. Sửa ngày bằng biểu tượng bút, rồi đăng lại.',
    tabAdvertDeleted: 'Đã xóa',
    expiredProperties: 'Đã hết hạn',
    rented: 'Đã cho thuê',
    notRented: 'Chưa thuê',
    perWeek: '/ tuần',
    deleteConfirmTitle: 'Xóa bất động sản',
    permanentDeleteConfirmTitle: 'Xóa vĩnh viễn',
    deleteConfirmDesc: 'Bất động sản đã xóa sẽ không còn hiển thị trong danh sách của chủ nhà; có thể xem trong nhật ký quản trị.',
    permanentDeleteConfirmDesc: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn không?',
    confirm: 'Xác nhận',
    processing: 'Đang xử lý',
    notifications: 'Thông báo',
    newMessagesGuest: 'Tin nhắn mới (Khách)',
    newMessagesHost: 'Tin nhắn mới (Chủ nhà)',
    unreadMessages: 'tin nhắn chưa đọc',
    myBookingsGuest: '🏠 Đặt phòng của tôi',
    bookingRequestsHost: '🔑 Yêu cầu đặt phòng',
    guest: 'Khách',
    pending: 'Chờ duyệt',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    markAllRead: 'Đánh dấu đã đọc',
    turnOffNotifications: 'Tắt thông báo',
    turnOnNotifications: 'Bật thông báo',
    profile: 'Thông tin cá nhân',
    popularStaysNearby: 'Chỗ ở phổ biến gần đây',
    propertiesCount: 'bất động sản',
    availableNow: 'Có thể vào ngay',
    immediateEntry: 'Có thể vào ngay',
    fullName: 'Họ tên',
    phoneNumber: 'Số điện thoại',
    gender: 'Giới tính',
    male: 'Nam',
    female: 'Nữ',
    preferredLanguage: 'Ngôn ngữ ưa thích',
    optional: 'Tùy chọn',
    required: 'Bắt buộc',
    signupWelcome: 'Đăng ký',
    signupSub: 'Tạo tài khoản mới để bắt đầu',
    signupSuccess: 'Đăng ký thành công!',
    signupSuccessSub: 'Chào mừng bạn! Bây giờ bạn có thể sử dụng dịch vụ.',
    start: 'Bắt đầu',
    loginToSignup: 'Về đăng nhập',
    popularStaysTitle: 'Chỗ ở phổ biến nhất hiện tại',
    weeklyRent: 'Giá thuê 1 tuần',
    utilitiesIncluded: 'Bao gồm tiện ích/phí quản lý',
    checkInAfter: 'sau',
    checkOutBefore: 'trước',
    maxGuests: 'Số người tối đa',
    adults: 'người lớn',
    children: 'trẻ em',
    amenities: 'Tiện ích',
    noAmenities: 'Không có thông tin tiện ích',
    selectBookingDates: 'Chọn ngày đặt phòng',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    selectDate: 'Chọn ngày',
    bookNow: 'Đặt phòng',
    selectDatesFirst: 'Vui lòng chọn ngày',
    availableDates: 'Ngày cho thuê',
    whereDoYouWantToLive: 'Bạn muốn sống ở đâu?',
    searching: 'Đang tìm kiếm...',
    findPropertiesOnMap: 'Tìm bất động sản trên bản đồ',
    useCurrentLocation: 'Sử dụng vị trí hiện tại',
    locationPermissionDesc: 'Chúng tôi cần thông tin vị trí để hiển thị vị trí của bạn trên bản đồ. Thông tin vị trí chỉ được sử dụng để hiển thị điểm đánh dấu vị trí của bạn trên bản đồ.',
    allowLocationAccess: 'Cho phép quyền vị trí',
    skip: 'Bỏ qua',
    requesting: 'Đang yêu cầu...',
    locationNotSupported: 'Trình duyệt này không hỗ trợ dịch vụ vị trí.',
    tapToViewDetails: 'Nhấn để xem chi tiết',
    zoomInToSeeExactLocation: 'Phóng to để xem vị trí chính xác của từng bất động sản',
    distanceFromCenter: 'từ trung tâm',
    deny: 'Từ chối',
    allow: 'Đồng ý',
    locationPermissionTitle: 'Yêu cầu quyền truy cập vị trí',
    welcomeBack: 'Chào mừng trở lại!',
    noAccount: 'Chưa có tài khoản?',
    accountDeletedDesc: 'Tài khoản đã bị xóa.',
    emailNotRegistered: 'Email chưa được đăng ký',
    loginFailed: 'Đăng nhập thất bại',
    errorOccurred: 'Lỗi',
    googleContinue: 'Tiếp tục với Google',
    facebookContinue: 'Tiếp tục với Facebook',
    myPage: 'Trang cá nhân',
    hostMenu: 'Menu chủ nhà',
    verified: 'Đã xác thực',
    listYourProperty: 'Cho thuê nhà',
    registerPropertyDesc: 'Đăng ký bất động sản',
    verificationPending: 'Đang xét duyệt',
    kycRequired: 'Cần xác thực KYC',
    manageMyProperties: 'Quản lý bất động sản',
    manageMyPropertiesDesc: 'Quản lý bất động sản đã đăng',
    bookingManagement: 'Quản lý đặt phòng',
    bookingManagementDesc: 'Xác nhận/duyệt đặt phòng',
    hostFeaturesNotice: 'Hoàn thành xác thực KYC để sử dụng tất cả tính năng chủ nhà',
    guestMenu: 'Menu người thuê',
    myBookings: 'Đặt phòng của tôi',
    myBookingsDesc: 'Xem phòng đã đặt',
    editProfile: 'Chỉnh sửa thông tin',
    change: 'Đổi',
    confirmDeletion: 'Xác nhận xóa tài khoản',
    deleteAccountDesc: 'Bạn có chắc chắn muốn xóa tài khoản? Bạn có thể đăng ký lại trong vòng 30 ngày với cùng email.',
    deleteAccountSuccess: 'Xóa tài khoản thành công',
    deleteAccountSuccessDesc: 'Tài khoản đã được xóa thành công. Bạn có thể đăng ký lại trong vòng 30 ngày với cùng email.',
    congratulations: 'Chúc mừng!',
    nowOwnerDesc: 'Bây giờ bạn đã trở thành chủ nhà. Bạn có thể đăng ký bất động sản bình thường.',
    profileImageUpdated: 'Ảnh đại diện đã được thay đổi.',
    profilePhoto: 'Ảnh đại diện',
    uploadFailed: 'Tải lên thất bại',
    notRegistered: 'Chưa đăng ký',
    chat: 'Trò chuyện',
    cancellation: 'Hủy bỏ',
    agreeCancellationPolicy: 'Tôi đồng ý với chính sách hủy',
    activeBookings: 'Đặt phòng đang hoạt động',
    closedHistory: 'Lịch sử đã đóng',
    bookingRequest: 'Yêu cầu đặt phòng',
    bookingConfirmed: 'Đặt phòng đã xác nhận',
    requestCancelled: 'Yêu cầu đã hủy',
    bookingCancelled: 'Đặt phòng đã hủy',
    searchPlaceholderCityDistrict: 'Tìm kiếm thành phố và quận bạn muốn đến',
    labelCity: 'Thành phố',
    labelDistrict: 'Quận',
    selectDistrictPlaceholder: 'Chọn quận',
    selectDatesAndGuests: 'Chọn ngày đặt phòng và số người',
    guestSelect: 'Số người',
    maxSuffix: '(tối đa)',
    guestOverMaxNotice: 'Vượt quá số người tối đa có thể phát sinh phí bổ sung.',
    advancedFilter: 'Bộ lọc nâng cao',
    rentWeekly: 'Giá thuê (tuần)',
    minLabel: 'Tối thiểu',
    maxLabel: 'Tối đa',
    fullOption: 'Đầy đủ',
    fullFurniture: 'Đủ nội thất',
    fullElectronics: 'Đủ điện tử',
    fullKitchen: 'Bếp đầy đủ',
    amenitiesPolicy: 'Tiện ích & Chính sách',
    cleaningShort: 'Dọn nhà',
    roomsLabel: 'Số phòng',
    selectLabel: 'Chọn',
    allLabel: 'Tất cả',
    selectDatePlaceholder: 'Chọn ngày',
    searchButton: 'Tìm kiếm',
    noResultsFound: 'Không tìm thấy kết quả.',
    propertiesFound: ' bất động sản.',
    minExceedsMaxError: 'Giá tối thiểu không được vượt quá giá tối đa. Vui lòng sửa.',
    maxBelowMinError: 'Giá tối đa không được thấp hơn giá tối thiểu. Vui lòng sửa.',
    // 새로운 카테고리 텍스트
    settlementWallet: 'Thanh toán & Ví',
    settlementWalletDesc: 'Quản lý doanh thu & rút tiền',
    settlementAccount: 'Thanh toán & Tài khoản',
    settlementAccountDesc: 'Quản lý doanh thu & thiết lập tài khoản',
    revenueHistory: 'Lịch sử doanh thu',
    revenueHistoryDesc: 'Kiểm tra doanh số & doanh thu',
    withdrawalRequest: 'Yêu cầu rút tiền',
    withdrawalRequestDesc: 'Yêu cầu rút doanh thu',
    bankAccountSetup: 'Thiết lập tài khoản ngân hàng',
    bankAccountSetupDesc: 'Đăng ký tài khoản rút tiền',
    reviewManagement: 'Quản lý đánh giá',
    reviewManagementDesc: 'Kiểm tra & quản lý đánh giá nhận được',
    wishlist: 'Danh sách yêu thích',
    wishlistDesc: 'Danh sách bất động sản đã lưu',
    paymentMethodManagement: 'Quản lý phương thức thanh toán',
    paymentMethodManagementDesc: 'Đăng ký thẻ & phương thức thanh toán',
    coupons: 'Phiếu giảm giá',
    couponsDesc: 'Quản lý phiếu giảm giá',
    paymentMethodRequired: 'Cần đăng ký phương thức thanh toán',
    paymentMethodRequiredDesc: 'Kích hoạt khi đăng ký phương thức thanh toán',
    // 정산 페이지 텍스트
    availableBalance: 'Có thể rút',
    totalRevenue: 'Tổng doanh thu',
    pendingWithdrawal: 'Rút tiền đang chờ',
    recentRevenue: 'Doanh thu gần đây',
    viewAll: 'Xem tất cả',
    rentalIncome: 'Thu nhập cho thuê',
    nextPayout: 'Ngày thanh toán tiếp theo',
    estimatedAmount: 'Số tiền ước tính',
    requestWithdrawal: 'Yêu cầu rút tiền',
    withdrawalAmount: 'Số tiền rút',
    availableForWithdrawal: 'Có thể rút',
    selectBankAccount: 'Chọn tài khoản ngân hàng',
    selectAccount: 'Chọn tài khoản',
    submitWithdrawalRequest: 'Gửi yêu cầu rút tiền',
    withdrawalHistory: 'Lịch sử rút tiền',
    registeredAccounts: 'Tài khoản đã đăng ký',
    addNewAccount: 'Thêm tài khoản mới',
    registerNewAccount: 'Đăng ký tài khoản mới',
    bankName: 'Tên ngân hàng',
    enterBankName: 'Nhập tên ngân hàng',
    accountNumber: 'Số tài khoản',
    enterAccountNumber: 'Nhập số tài khoản',
    accountHolder: 'Chủ tài khoản',
    enterAccountHolder: 'Nhập chủ tài khoản',
    setAsPrimaryAccount: 'Đặt làm tài khoản chính',
    registerAccount: 'Đăng ký tài khoản',
    primary: 'Tài khoản chính',
    completed: 'Hoàn thành',
    setAsPrimary: 'Đặt làm tài khoản chính',
    incomeStatusPending: 'Số tiền chờ',
    incomeStatusConfirmed: 'Số tiền xác nhận',
    incomeStatusPayable: 'Đã thanh toán',
    incomeStatusSettlementHeld: 'Tạm giữ quyết toán',
    incomeStatusWithdrawable: 'Có thể rút',
    rentalPeriod: 'Thời gian thuê',
    title: 'Tên bất động sản',
    rentingInProgress: 'Đang cho thuê',
    withdrawalCompleted: 'Rút tiền hoàn tất',
    serverTimeSyncError: 'Đồng bộ thời gian máy chủ thất bại',
    systemMaintenance: 'Hệ thống đang bảo trì',
    // 매물명 관련
    propertyName: 'Tên bất động sản',
    propertyNamePlaceholder: 'VD: Studio đầu tiên của tôi',
    titlePlaceholder: 'VD: Studio đầu tiên của tôi',
    propertyDescription: 'Mô tả bất động sản',
    propertyDescriptionPlaceholder: 'Nhập mô tả chi tiết về bất động sản.',
    confirmLogout: 'Xác nhận đăng xuất',
    logoutDesc: 'Bạn có chắc chắn muốn đăng xuất không?',
    languageChange: 'Thay đổi ngôn ngữ',
    language: 'Ngôn ngữ',
    close: 'Đóng',
    selectLanguageDesc: 'Chọn từ 5 ngôn ngữ',
    selectPhoto: 'Chọn ảnh',
    photoSelectConsentTitle: 'Cho phép truy cập thư viện ảnh',
    photoSelectConsentDesc: 'Bạn có cho phép chuyển đến thư viện ảnh để đăng ảnh đại diện không?',
    agree: 'Đồng ý',
    photoSourceMenuTitle: 'Chọn cách thêm ảnh',
    selectFromLibrary: 'Chọn từ thư viện ảnh',
    takePhoto: 'Chụp ảnh',
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    search: 'Search',
    searchPlaceholder: 'Search the city you are visiting',
    propertyList: 'Property List',
    noProperties: 'No properties registered.',
    loading: 'Loading...',
    error: 'An error occurred.',
    retry: 'Retry',
    addProperty: 'Add New Property',
    bedroom: 'Bed',
    bathroom: 'Bath',
    area: 'm²',
    price: 'Price',
    address: 'Address',
    description: 'Description',
    translationLoading: 'Translating...',
    selectLanguage: 'Select Language',
    home: 'Home',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    viewDetails: 'View Details',
    email: 'Email',
    password: 'Password',
    signup: 'Sign Up',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    myProperties: 'My Properties',
    back: 'Back',
    activeProperties: 'Active',
    listingLive: 'Live listing',
    adPausedByRule: 'Paused (rules, data kept)',
    adminHiddenProperty: 'Policy violation',
    tabAdvertLive: 'Live',
    tabAdvertPending: 'Waiting to relist',
    tabAdvertSuspended: 'Suspended',
    minRentablePeriodHint:
      'Paused after cancellation, etc. Fix dates with the pencil icon, then relist.',
    tabAdvertDeleted: 'Deleted',
    expiredProperties: 'Expired',
    rented: 'Rented',
    notRented: 'Active',
    perWeek: '/ week',
    deleteConfirmTitle: 'Delete Property',
    permanentDeleteConfirmTitle: 'Permanent Delete',
    deleteConfirmDesc: 'Deleted properties disappear from the host list; you can verify them in the admin audit logs.',
    permanentDeleteConfirmDesc: 'This action cannot be undone. Are you sure you want to permanently delete?',
    confirm: 'Confirm',
    processing: 'Processing',
    notifications: 'Notifications',
    newMessagesGuest: 'New Message (Guest)',
    newMessagesHost: 'New Message (Host)',
    unreadMessages: 'unread message(s)',
    myBookingsGuest: '🏠 My Bookings (Guest)',
    bookingRequestsHost: '🔑 Booking Requests (Host)',
    guest: 'Guest',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    markAllRead: 'Mark all read',
    turnOffNotifications: 'Turn off',
    turnOnNotifications: 'Turn on',
    profile: 'Profile',
    popularStaysNearby: 'Popular stays nearby',
    propertiesCount: 'properties',
    availableNow: 'Available Now',
    immediateEntry: 'Available Now',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    preferredLanguage: 'Preferred Language',
    optional: 'Optional',
    required: 'Required',
    signupWelcome: 'Sign Up',
    signupSub: 'Create a new account to get started',
    signupSuccess: 'Sign Up Success!',
    signupSuccessSub: 'Welcome! You can now use the service.',
    start: 'Start',
    loginToSignup: 'Back to Login',
    popularStaysTitle: 'Popular Stays Now',
    weeklyRent: 'Weekly Rent',
    utilitiesIncluded: 'Utilities/Management fees included',
    checkInAfter: 'after',
    checkOutBefore: 'before',
    maxGuests: 'Maximum Guests',
    adults: 'adults',
    children: 'children',
    amenities: 'Amenities',
    noAmenities: 'No amenities information',
    selectBookingDates: 'Select Booking Dates',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    selectDate: 'Select',
    bookNow: 'Book Now',
    selectDatesFirst: 'Select dates',
    availableDates: 'Available Dates',
    whereDoYouWantToLive: 'Where do you want to live?',
    searching: 'Searching...',
    findPropertiesOnMap: 'Find Properties on Map',
    useCurrentLocation: 'Use Current Location',
    locationPermissionDesc: 'We need location permission to show your location on the map. Location information is only used to display your location marker on the map.',
    allowLocationAccess: 'Allow Location Access',
    skip: 'Skip',
    requesting: 'Requesting...',
    locationNotSupported: 'This browser does not support location services.',
    tapToViewDetails: 'Tap to view details',
    zoomInToSeeExactLocation: 'Zoom in to see exact location of each property',
    distanceFromCenter: 'from center',
    deny: 'Deny',
    allow: 'Allow',
    locationPermissionTitle: 'Location Permission Request',
    welcomeBack: 'Welcome Back!',
    noAccount: "Don't have an account?",
    accountDeletedDesc: 'Account deleted.',
    emailNotRegistered: 'Email not registered',
    loginFailed: 'Login failed',
    errorOccurred: 'Error',
    googleContinue: 'Continue with Google',
    facebookContinue: 'Continue with Facebook',
    myPage: 'My Page',
    hostMenu: 'Host Menu',
    verified: 'Verified',
    listYourProperty: 'List Your Property',
    registerPropertyDesc: 'Register Property',
    verificationPending: 'Verification Pending',
    kycRequired: 'KYC Required',
    manageMyProperties: 'Manage My Properties',
    manageMyPropertiesDesc: 'Manage registered properties',
    bookingManagement: 'Booking Management',
    bookingManagementDesc: 'Confirm/approve bookings',
    hostFeaturesNotice: 'Complete KYC verification to access all host features',
    guestMenu: 'Guest Menu',
    myBookings: 'My Bookings',
    myBookingsDesc: 'View your bookings',
    editProfile: 'Edit Profile',
    change: 'Change',
    confirmDeletion: 'Confirm Account Deletion',
    deleteAccountDesc: 'Are you sure you want to delete your account? You can re-register within 30 days with the same email.',
    deleteAccountSuccess: 'Account Deleted',
    deleteAccountSuccessDesc: 'Your account has been deleted. You can re-register within 30 days with the same email.',
    congratulations: 'Congratulations!',
    nowOwnerDesc: 'You are now an owner. You can register properties normally.',
    profileImageUpdated: 'Profile picture updated.',
    profilePhoto: 'Profile Photo',
    uploadFailed: 'Upload failed',
    notRegistered: 'Not registered',
    chat: 'Chat',
    cancellation: 'Cancellation',
    agreeCancellationPolicy: 'I agree to the cancellation policy',
    activeBookings: 'Active Bookings',
    closedHistory: 'Closed History',
    bookingRequest: 'Booking Request',
    bookingConfirmed: 'Booking Confirmed',
    requestCancelled: 'Request Cancelled',
    bookingCancelled: 'Booking Cancelled',
    searchPlaceholderCityDistrict: 'Search for the city and district you want to visit',
    labelCity: 'City',
    labelDistrict: 'District',
    selectDistrictPlaceholder: 'Select district',
    selectDatesAndGuests: 'Select dates & guests',
    guestSelect: 'Guests',
    maxSuffix: '(max)',
    guestOverMaxNotice: 'Additional charges may apply if you exceed the maximum number of guests.',
    advancedFilter: 'Advanced Filter',
    rentWeekly: 'Rent (weekly)',
    minLabel: 'Min',
    maxLabel: 'Max',
    fullOption: 'Full option',
    fullFurniture: 'Full Furniture',
    fullElectronics: 'Full Electronics',
    fullKitchen: 'Full Kitchen',
    amenitiesPolicy: 'Amenities & Policy',
    cleaningShort: 'Cleaning',
    roomsLabel: 'Rooms',
    selectLabel: 'Select',
    allLabel: 'All',
    selectDatePlaceholder: 'Select date',
    searchButton: 'Search',
    noResultsFound: 'No results found.',
    propertiesFound: ' properties found.',
    minExceedsMaxError: 'Min cannot exceed max. Please correct.',
    maxBelowMinError: 'Max cannot be lower than min. Please correct.',
    // 새로운 카테고리 텍스트
    settlementWallet: 'Settlement & Wallet',
    settlementWalletDesc: 'Revenue management & withdrawals',
    settlementAccount: 'Settlement & Account',
    settlementAccountDesc: 'Revenue management & account setup',
    revenueHistory: 'Revenue History',
    revenueHistoryDesc: 'Check sales & revenue',
    withdrawalRequest: 'Withdrawal Request',
    withdrawalRequestDesc: 'Request revenue withdrawal',
    bankAccountSetup: 'Bank Account Setup',
    bankAccountSetupDesc: 'Register withdrawal account',
    reviewManagement: 'Review Management',
    reviewManagementDesc: 'Check & manage received reviews',
    wishlist: 'Wishlist',
    wishlistDesc: 'Saved properties list',
    paymentMethodManagement: 'Payment Method Management',
    paymentMethodManagementDesc: 'Register cards & payment methods',
    coupons: 'Coupons',
    couponsDesc: 'Discount coupons management',
    paymentMethodRequired: 'Payment Method Required',
    paymentMethodRequiredDesc: 'Activated when payment method is registered',
    // 정산 페이지 텍스트
    availableBalance: 'Available for Withdrawal',
    totalRevenue: 'Total Revenue',
    pendingWithdrawal: 'Pending Withdrawal',
    recentRevenue: 'Recent Revenue',
    viewAll: 'View All',
    rentalIncome: 'Rental Income',
    nextPayout: 'Next Payout',
    estimatedAmount: 'Estimated Amount',
    requestWithdrawal: 'Request Withdrawal',
    withdrawalAmount: 'Withdrawal Amount',
    availableForWithdrawal: 'Available for Withdrawal',
    selectBankAccount: 'Select Bank Account',
    selectAccount: 'Select Account',
    submitWithdrawalRequest: 'Submit Withdrawal Request',
    withdrawalHistory: 'Withdrawal History',
    registeredAccounts: 'Registered Accounts',
    addNewAccount: 'Add New Account',
    registerNewAccount: 'Register New Account',
    bankName: 'Bank Name',
    enterBankName: 'Enter bank name',
    accountNumber: 'Account Number',
    enterAccountNumber: 'Enter account number',
    accountHolder: 'Account Holder',
    enterAccountHolder: 'Enter account holder',
    setAsPrimaryAccount: 'Set as primary account',
    registerAccount: 'Register Account',
    primary: 'Primary',
    completed: 'Completed',
    setAsPrimary: 'Set as primary',
    incomeStatusPending: 'Pending',
    incomeStatusConfirmed: 'Confirmed',
    incomeStatusPayable: 'Payable',
    incomeStatusSettlementHeld: 'Settlement on hold',
    incomeStatusWithdrawable: 'Withdrawable',
    rentalPeriod: 'Rental period',
    title: 'Property name',
    rentingInProgress: 'In stay',
    withdrawalCompleted: 'Withdrawal completed',
    serverTimeSyncError: 'Server time sync failed',
    systemMaintenance: 'System under maintenance',
    // 매물명 관련
    propertyName: 'Property Name',
    propertyNamePlaceholder: 'e.g., My first studio',
    titlePlaceholder: 'e.g., My first studio',
    propertyDescription: 'Property Description',
    propertyDescriptionPlaceholder: 'Enter detailed description of the property.',
    confirmLogout: 'Confirm Logout',
    logoutDesc: 'Are you sure you want to logout?',
    languageChange: 'Language Change',
    language: 'Language',
    close: 'Close',
    selectLanguageDesc: 'Choose from 5 languages',
    selectPhoto: 'Select photo',
    photoSelectConsentTitle: 'Allow access to photo gallery',
    photoSelectConsentDesc: 'Do you allow access to your photo gallery to register a profile photo?',
    agree: 'Agree',
    photoSourceMenuTitle: 'Select Photo Source',
    selectFromLibrary: 'Select from Photo Library',
    takePhoto: 'Take Photo',
  },
  ja: {
    login: 'ログイン',
    logout: 'ログアウト',
    search: '検索',
    searchPlaceholder: '訪問予定の都市を検索',
    propertyList: '物件一覧',
    noProperties: '登録された物件がありません。',
    loading: '読み込み中...',
    error: 'エラーが発生しました。',
    retry: '再試行',
    addProperty: '新規物件登録',
    bedroom: 'ベッド',
    bathroom: 'バス',
    area: '㎡',
    price: '価格',
    address: '住所',
    description: '説明',
    translationLoading: '翻訳中...',
    selectLanguage: '言語選択',
    home: 'ホーム',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    viewDetails: '詳細を見る',
    email: 'メール',
    password: 'パスワード',
    signup: '新規登録',
    signUp: '新規登録',
    forgotPassword: 'パスワードを忘れた方はこちら',
    emailPlaceholder: 'メールアドレスを入力',
    passwordPlaceholder: 'パスワードを入力',
    myProperties: '物件管理',
    back: '戻る',
    activeProperties: '掲載中',
    listingLive: '公開中',
    adPausedByRule: 'ルール上停止（データ保持）',
    adminHiddenProperty: 'ポリシー違反',
    tabAdvertLive: '掲載中',
    tabAdvertPending: '掲載待ち',
    tabAdvertSuspended: '掲載停止',
    minRentablePeriodHint:
      '予約がキャンセルされたため、現在はお客様に表示されません。日付を確認して再登録してください。',
    tabAdvertDeleted: '削除済み',
    expiredProperties: '掲載終了',
    rented: '成約済み',
    notRented: '掲載中',
    perWeek: '/ 週',
    deleteConfirmTitle: '物件の削除',
    permanentDeleteConfirmTitle: '永久削除',
    deleteConfirmDesc: '削除された物件はホストの一覧から消えます。管理者の監査ログで確認できます。',
    permanentDeleteConfirmDesc: 'この操作は取り消せません。本当に永久削除しますか？',
    confirm: '確認',
    processing: '処理中',
    notifications: '通知',
    newMessagesGuest: '新着メッセージ (借主)',
    newMessagesHost: '新着メッセージ (貸主)',
    unreadMessages: '件の未読メッセージがあります',
    myBookingsGuest: '🏠 予約状況 (借主)',
    bookingRequestsHost: '🔑 予約リクエスト (貸主)',
    guest: 'ゲスト',
    pending: '承認待ち',
    confirmed: '予約確定',
    cancelled: 'キャンセル済み',
    markAllRead: 'すべて既読にする',
    turnOffNotifications: '通知をオフにする',
    turnOnNotifications: '通知をオンにする',
    profile: 'プロフィール',
    popularStaysNearby: '周辺の人気物件',
    propertiesCount: '件の物件',
    availableNow: '即入居可能',
    immediateEntry: '即入居可能',
    fullName: '氏名',
    phoneNumber: '電話番号',
    gender: '性別',
    male: '男性',
    female: '女性',
    preferredLanguage: '希望言語',
    optional: '任意',
    required: '必須',
    signupWelcome: '新規登録',
    signupSub: '新しいアカウントを作成して始めましょう',
    signupSuccess: '登録完了！',
    signupSuccessSub: 'ようこそ！サービスをご利用いただけます。',
    start: '始める',
    loginToSignup: 'ログインに戻る',
    popularStaysTitle: '今最も人気のある宿泊施設',
    weeklyRent: '1週間あたりの賃料',
    utilitiesIncluded: '光熱費・管理費込み',
    checkInAfter: '以降',
    checkOutBefore: '以前',
    maxGuests: '最大定員',
    adults: '大人',
    children: '子供',
    amenities: '設備・アメニティ',
    noAmenities: '設備情報がありません',
    selectBookingDates: '予約日の選択',
    checkIn: 'チェックイン',
    checkOut: 'チェックアウト',
    selectDate: '日付を選択',
    bookNow: '予約する',
    selectDatesFirst: '日付を選択してください',
    availableDates: '入居可能期間',
    whereDoYouWantToLive: 'どこに住みたいですか？',
    searching: '検索中...',
    findPropertiesOnMap: '地図で物件を探す',
    useCurrentLocation: '現在地を使用',
    locationPermissionDesc: '地図上に現在地を表示し、周辺の物件を探すために位置情報が必要です。位置情報は地図上に現在地マーカーを表示するためだけに使用されます。',
    allowLocationAccess: '位置情報の使用を許可',
    skip: 'スキップ',
    requesting: 'リクエスト中...',
    locationNotSupported: 'このブラウザは位置情報サービスをサポートしていません。',
    tapToViewDetails: 'タップして詳細を表示',
    zoomInToSeeExactLocation: '拡大すると各物件の正確な位置を確認できます',
    distanceFromCenter: '中心から',
    deny: '拒否',
    allow: '許可',
    locationPermissionTitle: '位置情報の使用許可リクエスト',
    welcomeBack: 'おかえりなさい！',
    noAccount: 'アカウントをお持ちでないですか？',
    accountDeletedDesc: 'アカウントが削除されました。',
    emailNotRegistered: '登録されていないメールアドレスです',
    loginFailed: 'ログインに失敗しました',
    errorOccurred: 'エラーが発生しました',
    googleContinue: 'Googleで続行',
    facebookContinue: 'Facebookで続行',
    myPage: 'マイページ',
    hostMenu: '貸主メニュー',
    verified: '認証済み',
    listYourProperty: '物件を掲載する',
    registerPropertyDesc: '物件登録',
    verificationPending: '審査中',
    kycRequired: 'KYC認証が必要です',
    manageMyProperties: '物件管理',
    manageMyPropertiesDesc: '登録物件の管理',
    bookingManagement: '予約管理',
    bookingManagementDesc: '予約の確認・承認',
    hostFeaturesNotice: 'KYC認証完了後にすべての貸主機能が利用可能になります',
    guestMenu: '借主メニュー',
    myBookings: '予約状況',
    myBookingsDesc: '予約した物件の確認',
    editProfile: 'プロフィール編集',
    change: '変更',
    confirmDeletion: '退会確認',
    deleteAccountDesc: '本当に退会しますか？退会後30日以内であれば、同じメールアドレスで再登録が可能です。',
    deleteAccountSuccess: '退会完了',
    deleteAccountSuccessDesc: '退会手続きが完了しました。30日以内であれば、同じメールアドレスで再登録が可能です。',
    congratulations: 'おめでとうございます！',
    nowOwnerDesc: '貸主として認証されました。物件の登録が可能です。',
    profileImageUpdated: 'プロフィール写真が更新されました。',
    profilePhoto: 'プロフィール写真',
    uploadFailed: 'アップロードに失敗しました',
    notRegistered: '未登録',
    chat: 'チャット',
    cancellation: 'キャンセル',
    agreeCancellationPolicy: 'キャンセルポリシーに同意します',
    activeBookings: 'アクティブな予約',
    closedHistory: '終了済み履歴',
    bookingRequest: '予約リクエスト',
    bookingConfirmed: '予約確定',
    requestCancelled: 'リクエストキャンセル',
    bookingCancelled: '予約キャンセル',
    searchPlaceholderCityDistrict: '旅行したい都市と区を検索',
    labelCity: '都市',
    labelDistrict: '区',
    selectDistrictPlaceholder: '区を選択',
    selectDatesAndGuests: '予約日・人数選択',
    guestSelect: '人数選択',
    maxSuffix: '(最大)',
    guestOverMaxNotice: '最大人数を超えると追加料金が発生する場合があります。',
    advancedFilter: '詳細フィルター',
    rentWeekly: '賃料(週)',
    minLabel: '最低',
    maxLabel: '最高',
    fullOption: 'フルオプション',
    fullFurniture: '家具完備',
    fullElectronics: '家電完備',
    fullKitchen: 'キッチン完備',
    amenitiesPolicy: '設備・ポリシー',
    cleaningShort: '清掃',
    roomsLabel: '部屋数',
    selectLabel: '選択',
    allLabel: 'すべて',
    selectDatePlaceholder: '日付を選択',
    searchButton: '検索',
    noResultsFound: '検索結果がありません。',
    propertiesFound: '件の物件が見つかりました。',
    minExceedsMaxError: '最低値は最高値を超えられません。修正してください。',
    maxBelowMinError: '最高値は最低値より低くできません。修正してください。',
    // 새로운 카테고리 텍스트
    settlementWallet: '決済 & ウォレット',
    settlementWalletDesc: '収益管理 & 出金',
    settlementAccount: '決済 & 口座',
    settlementAccountDesc: '収益管理 & 口座設定',
    revenueHistory: '収益履歴',
    revenueHistoryDesc: '売上 & 収益の確認',
    withdrawalRequest: '出金リクエスト',
    withdrawalRequestDesc: '収益の出金リクエスト',
    bankAccountSetup: '銀行口座設定',
    bankAccountSetupDesc: '出金口座の登録',
    reviewManagement: 'レビュー管理',
    reviewManagementDesc: '受け取ったレビューの確認・管理',
    wishlist: 'ウィッシュリスト',
    wishlistDesc: '保存した物件リスト',
    paymentMethodManagement: '決済方法管理',
    paymentMethodManagementDesc: 'カード & 決済方法の登録',
    coupons: 'クーポン',
    couponsDesc: '割引クーポンの管理',
    paymentMethodRequired: '決済方法登録が必要',
    paymentMethodRequiredDesc: '決済方法登録時に有効化されます',
    // 정산 페이지 텍스트
    availableBalance: '出金可能金額',
    totalRevenue: '総収益',
    pendingWithdrawal: '出金待ち',
    recentRevenue: '最近の収益',
    viewAll: 'すべて表示',
    rentalIncome: '賃貸収入',
    nextPayout: '次回支払日',
    estimatedAmount: '見積金額',
    requestWithdrawal: '出金リクエスト',
    withdrawalAmount: '出金額',
    availableForWithdrawal: '出金可能金額',
    selectBankAccount: '銀行口座を選択',
    selectAccount: '口座を選択',
    submitWithdrawalRequest: '出金リクエストを送信',
    withdrawalHistory: '出金履歴',
    registeredAccounts: '登録済み口座',
    addNewAccount: '新規口座を追加',
    registerNewAccount: '新規口座を登録',
    bankName: '銀行名',
    enterBankName: '銀行名を入力',
    accountNumber: '口座番号',
    enterAccountNumber: '口座番号を入力',
    accountHolder: '口座名義人',
    enterAccountHolder: '口座名義人を入力',
    setAsPrimaryAccount: '主口座として設定',
    registerAccount: '口座を登録',
    primary: '主口座',
    completed: '完了',
    setAsPrimary: '主口座として設定',
    incomeStatusPending: '保留金額',
    incomeStatusConfirmed: '確定金額',
    incomeStatusPayable: '支払済',
    incomeStatusSettlementHeld: '精算保留',
    incomeStatusWithdrawable: '出金可能',
    rentalPeriod: '賃貸期間',
    title: '物件名',
    rentingInProgress: '滞在中',
    withdrawalCompleted: '出金完了',
    serverTimeSyncError: 'サーバー時刻同期に失敗しました',
    systemMaintenance: 'システムメンテナンス中',
    // 매물명 관련
    propertyName: '物件名',
    propertyNamePlaceholder: '例: 私の最初のスタジオ',
    titlePlaceholder: '例: 私の最初のスタジオ',
    propertyDescription: '物件説明',
    propertyDescriptionPlaceholder: '物件の詳細な説明を入力してください。',
    confirmLogout: 'ログアウト確認',
    logoutDesc: '本当にログアウトしますか？',
    languageChange: '言語変更',
    language: '言語',
    close: '閉じる',
    selectLanguageDesc: '5つの言語から選択してください',
    selectPhoto: '写真を選択',
    photoSelectConsentTitle: '写真ライブラリへのアクセスを許可',
    photoSelectConsentDesc: 'プロフィール写真を登録するため、写真ライブラリへ移動することを許可しますか？',
    agree: '同意',
    photoSourceMenuTitle: '写真追加方法の選択',
    selectFromLibrary: '写真ライブラリから選択',
    takePhoto: 'カメラで撮影',
  },
  zh: {
    login: '登录',
    logout: '登出',
    search: '搜索',
    searchPlaceholder: '搜索您将访问的城市',
    propertyList: '房产列表',
    noProperties: '没有已注册的房产。',
    loading: '加载中...',
    error: '发生错误。',
    retry: '重试',
    addProperty: '添加新房产',
    bedroom: '卧室',
    bathroom: '浴室',
    area: '㎡',
    price: '价格',
    address: '地址',
    description: '描述',
    translationLoading: '翻译中...',
    selectLanguage: '选择语言',
    home: '首页',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    viewDetails: '查看详情',
    email: '邮箱',
    password: '密码',
    signup: '注册',
    signUp: '注册',
    forgotPassword: '忘记密码?',
    emailPlaceholder: '请输入邮箱',
    passwordPlaceholder: '请输入密码',
    myProperties: '我的房产',
    back: '返回',
    activeProperties: '发布中',
    listingLive: '展示中',
    adPausedByRule: '规则暂停（保留数据）',
    adminHiddenProperty: '政策违规',
    tabAdvertLive: '展示中',
    tabAdvertPending: '待重新上架',
    tabAdvertSuspended: '已停展',
    minRentablePeriodHint:
      '暂停（如取消预约等）。用笔形图标调整日期后重新上架。',
    tabAdvertDeleted: '已删除',
    expiredProperties: '已下架',
    rented: '已租出',
    notRented: '发布中',
    perWeek: '/ 周',
    deleteConfirmTitle: '删除房产',
    permanentDeleteConfirmTitle: '永久删除',
    deleteConfirmDesc: '删除的房产将从房东列表中消失，可在管理员审计日志中查看。',
    permanentDeleteConfirmDesc: '此操作无法撤销。您确定要永久删除吗？',
    confirm: '确认',
    processing: '处理中',
    notifications: '通知',
    newMessagesGuest: '新消息 (租客)',
    newMessagesHost: '新消息 (房东)',
    unreadMessages: '条未读消息',
    myBookingsGuest: '🏠 我的预订 (租客)',
    bookingRequestsHost: '🔑 预订请求 (房东)',
    guest: '访客',
    pending: '待批准',
    confirmed: '已确认',
    cancelled: '已取消',
    markAllRead: '全部标记为已读',
    turnOffNotifications: '关闭通知',
    turnOnNotifications: '开启通知',
    profile: '个人资料',
    popularStaysNearby: '周边热门房源',
    propertiesCount: '个房源',
    availableNow: '可立即入住',
    immediateEntry: '可立即入住',
    fullName: '姓名',
    phoneNumber: '电话号码',
    gender: '性别',
    male: '男',
    female: '女',
    preferredLanguage: '首选语言',
    optional: '可选',
    required: '必填',
    signupWelcome: '注册',
    signupSub: '创建一个新账户开始吧',
    signupSuccess: '注册成功！',
    signupSuccessSub: '欢迎！您现在可以使用该服务了。',
    start: '开始',
    loginToSignup: '返回登录',
    popularStaysTitle: '目前最受欢迎的住宿',
    weeklyRent: '每周租金',
    utilitiesIncluded: '包含水电费/管理费',
    checkInAfter: '以后',
    checkOutBefore: '以前',
    maxGuests: '最大入住人数',
    adults: '成人',
    children: '儿童',
    amenities: '便利设施',
    noAmenities: '暂无便利设施信息',
    selectBookingDates: '选择预订日期',
    checkIn: '入住',
    checkOut: '退房',
    selectDate: '选择日期',
    bookNow: '立即预订',
    selectDatesFirst: '请选择日期',
    availableDates: '可租日期',
    whereDoYouWantToLive: '你想住在哪里？',
    searching: '搜索中...',
    findPropertiesOnMap: '在地图上查找房产',
    useCurrentLocation: '使用当前位置',
    locationPermissionDesc: '我们需要位置信息以便在地图上显示您的当前位置并查找周边的房产。位置信息仅用于在地图上显示您的位置标记。',
    allowLocationAccess: '允许访问位置',
    skip: '跳过',
    requesting: '请求中...',
    locationNotSupported: '此浏览器不支持位置服务。',
    tapToViewDetails: '点击查看详情',
    zoomInToSeeExactLocation: '放大以查看每个房源的准确位置',
    distanceFromCenter: '距离中心',
    deny: '拒绝',
    allow: '允许',
    locationPermissionTitle: '位置权限请求',
    welcomeBack: '欢迎回来！',
    noAccount: '还没有账号？',
    accountDeletedDesc: '账号已注销。',
    emailNotRegistered: '邮箱未注册',
    loginFailed: '登录失败',
    errorOccurred: '发生错误',
    googleContinue: '使用 Google 继续',
    facebookContinue: '使用 Facebook 继续',
    myPage: '个人主页',
    hostMenu: '房东菜单',
    verified: '已认证',
    listYourProperty: '发布房源',
    registerPropertyDesc: '注册房源',
    verificationPending: '审核中',
    kycRequired: '需要KYC认证',
    manageMyProperties: '管理我的房产',
    manageMyPropertiesDesc: '管理已发布的房源',
    bookingManagement: '预订管理',
    bookingManagementDesc: '确认/批准预订',
    hostFeaturesNotice: '完成KYC认证后即可使用所有房东功能',
    guestMenu: '租客菜单',
    myBookings: '我的预订',
    myBookingsDesc: '查看您的预订',
    editProfile: '编辑个人资料',
    change: '修改',
    confirmDeletion: '确认注销账号',
    deleteAccountDesc: '您确定要注销账号吗？注销后30天内可以重新注册，并可以使用相同的邮箱。',
    deleteAccountSuccess: '账号已注销',
    deleteAccountSuccessDesc: '您的账号已成功注销。您可以在30天内使用相同的邮箱重新注册。',
    congratulations: '恭喜！',
    nowOwnerDesc: '您现在已成为房东。可以正常注册房源了。',
    profileImageUpdated: '个人资料照片已更新。',
    profilePhoto: '个人资料照片',
    uploadFailed: '上传失败',
    notRegistered: '未注册',
    chat: '聊天',
    cancellation: '取消',
    agreeCancellationPolicy: '我同意取消政策',
    activeBookings: '活跃预订',
    closedHistory: '已结束记录',
    bookingRequest: '预订请求',
    bookingConfirmed: '预订确认',
    requestCancelled: '请求取消',
    bookingCancelled: '预订取消',
    searchPlaceholderCityDistrict: '搜索您要去的城市和区',
    labelCity: '城市',
    labelDistrict: '区',
    selectDistrictPlaceholder: '选择区',
    selectDatesAndGuests: '选择预订日期及人数',
    guestSelect: '人数选择',
    maxSuffix: '(最多)',
    guestOverMaxNotice: '超过最大人数时可能产生额外费用。',
    advancedFilter: '高级筛选',
    rentWeekly: '租金(周)',
    minLabel: '最低',
    maxLabel: '最高',
    fullOption: '全配',
    fullFurniture: '全家具',
    fullElectronics: '全家电',
    fullKitchen: '全厨房',
    amenitiesPolicy: '设施与政策',
    cleaningShort: '清洁',
    roomsLabel: '房间数',
    selectLabel: '选择',
    allLabel: '全部',
    selectDatePlaceholder: '选择日期',
    searchButton: '搜索',
    noResultsFound: '未找到结果。',
    propertiesFound: ' 个房源。',
    minExceedsMaxError: '最低值不能高于最高值。请修改。',
    maxBelowMinError: '最高值不能低于最低值。请修改。',
    // 새로운 카테고리 텍스트
    settlementWallet: '结算与钱包',
    settlementWalletDesc: '收益管理与提现',
    settlementAccount: '结算与账户',
    settlementAccountDesc: '收益管理与账户设置',
    revenueHistory: '收益历史',
    revenueHistoryDesc: '查看销售额与收益',
    withdrawalRequest: '提现申请',
    withdrawalRequestDesc: '收益提现申请',
    bankAccountSetup: '银行账户设置',
    bankAccountSetupDesc: '注册提现账户',
    reviewManagement: '评价管理',
    reviewManagementDesc: '查看与管理收到的评价',
    wishlist: '收藏列表',
    wishlistDesc: '已保存的房源列表',
    paymentMethodManagement: '支付方式管理',
    paymentMethodManagementDesc: '注册卡片与支付方式',
    coupons: '优惠券',
    couponsDesc: '折扣优惠券管理',
    paymentMethodRequired: '需要注册支付方式',
    paymentMethodRequiredDesc: '注册支付方式后激活',
    // 정산 페이지 텍스트
    availableBalance: '可提现金额',
    totalRevenue: '总收益',
    pendingWithdrawal: '待提现',
    recentRevenue: '近期收益',
    viewAll: '查看全部',
    rentalIncome: '租赁收入',
    nextPayout: '下次支付日',
    estimatedAmount: '预计金额',
    requestWithdrawal: '申请提现',
    withdrawalAmount: '提现金额',
    availableForWithdrawal: '可提现金额',
    selectBankAccount: '选择银行账户',
    selectAccount: '选择账户',
    submitWithdrawalRequest: '提交提现申请',
    withdrawalHistory: '提现历史',
    registeredAccounts: '已注册账户',
    addNewAccount: '添加新账户',
    registerNewAccount: '注册新账户',
    bankName: '银行名称',
    enterBankName: '输入银行名称',
    accountNumber: '账户号码',
    enterAccountNumber: '输入账户号码',
    accountHolder: '账户持有人',
    enterAccountHolder: '输入账户持有人',
    setAsPrimaryAccount: '设为主账户',
    registerAccount: '注册账户',
    primary: '主账户',
    completed: '已完成',
    setAsPrimary: '设为主账户',
    incomeStatusPending: '待定金额',
    incomeStatusConfirmed: '确认金额',
    incomeStatusPayable: '已支付',
    incomeStatusSettlementHeld: '结算暂缓',
    incomeStatusWithdrawable: '可提现',
    rentalPeriod: '租期',
    title: '房源名称',
    rentingInProgress: '租住中',
    withdrawalCompleted: '提现完成',
    serverTimeSyncError: '服务器时间同步失败',
    systemMaintenance: '系统维护中',
    // 매물명 관련
    propertyName: '房源名称',
    propertyNamePlaceholder: '例如: 我的第一个工作室',
    titlePlaceholder: '例如: 我的第一个工作室',
    propertyDescription: '房源描述',
    propertyDescriptionPlaceholder: '请输入房源的详细描述。',
    confirmLogout: '确认登出',
    logoutDesc: '您确定要登出吗？',
    languageChange: '语言更改',
    language: '语言',
    close: '关闭',
    selectLanguageDesc: '从5种语言中选择',
    selectPhoto: '选择照片',
    photoSelectConsentTitle: '允许访问相册',
    photoSelectConsentDesc: '为注册个人资料照片，是否允许前往相册选择照片？',
    agree: '同意',
    photoSourceMenuTitle: '选择照片添加方式',
    selectFromLibrary: '从照片库选择',
    takePhoto: '用相机拍摄',
  },
};

/**
 * 언어별 UI 텍스트 가져오기
 * 
 * @param key - 텍스트 키
 * @param language - 현재 언어
 * @returns 언어에 맞는 텍스트
 */
export function getUIText(key: UITextKey, language: SupportedLanguage): string {
  return uiTexts[language]?.[key] || uiTexts.ko[key] || key;
}

/**
 * 여러 텍스트를 한 번에 가져오기
 * 
 * @param keys - 텍스트 키 배열
 * @param language - 현재 언어
 * @returns 텍스트 객체
 */
export function getUITexts(
  keys: UITextKey[],
  language: SupportedLanguage
): Record<UITextKey, string> {
  const result: Partial<Record<UITextKey, string>> = {};
  keys.forEach((key) => {
    result[key] = getUIText(key, language);
  });
  return result as Record<UITextKey, string>;
}
