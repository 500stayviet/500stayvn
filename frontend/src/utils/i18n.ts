/**
 * i18n (Internationalization) 유틸리티
 * 
 * 언어별 UI 텍스트를 관리하는 유틸리티 함수
 * - 로그인, 검색, 버튼 등의 텍스트를 언어에 따라 반환
 */

import { SupportedLanguage } from '@/lib/api/translation';
import { USER_FACING_CLIENT_AUTH_ERROR_MESSAGE } from '@/lib/runtime/networkResilience';

import {
  type ListingTextKey,
  getPropertyTypeListingKey,
  listingTexts,
} from '@/utils/i18nListing';

/**
 * UI 텍스트 타입 정의 (매물 listing 전용 키 제외 — `listingTexts`에만 존재)
 */
export type BaseUITextKey =
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
  | 'loginWrongPassword'
  | 'loginSocialLoginRequired'
  | 'loginAccountBlocked'
  | 'loginNetworkError'
  | 'loginServerUnavailable'
  | 'adminUserBlockPrompt'
  | 'adminUserBlockDefaultReason'
  | 'phoneSendOtpButton'
  | 'phoneEnterNumberPlaceholder'
  | 'phoneSelectCountry'
  | 'phoneOtpSentBadge'
  | 'mapErrAwsApiKeyMissing'
  | 'mapErrAwsMapNameMissing'
  | 'mapErrLoadGeneric'
  | 'mapErrNetworkAws'
  | 'mapErrAwsKeyInvalid'
  | 'mapErrMapNotFound'
  | 'mapErrStyleLoad'
  | 'mapErrorHeading'
  | 'mapErrCheckEnvHint'
  | 'legacyNewPropertyPageTitle'
  | 'legacyNewPropertyFieldTitle'
  | 'legacyNewPropertyTitlePh'
  | 'legacyNewPropertyDescVi'
  | 'legacyNewPropertyAddrVi'
  | 'legacyNewPropertyGeocoding'
  | 'legacyNewPropertyCoordsOk'
  | 'legacyNewPropertyAddrPh'
  | 'legacyNewPropertyCoordsLine'
  | 'legacyNewPropertyPrice'
  | 'legacyNewPropertyCurrency'
  | 'legacyNewPropertyArea'
  | 'legacyNewPropertyBedrooms'
  | 'legacyNewPropertyBathrooms'
  | 'legacyNewPropertyCheckIn'
  | 'legacyNewPropertyCheckOut'
  | 'legacyNewPropertyTimeAfter'
  | 'legacyNewPropertyTimeBefore'
  | 'legacyNewPropertyCheckInHelp'
  | 'legacyNewPropertyCheckOutHelp'
  | 'legacyNewPropertyCancel'
  | 'legacyNewPropertySubmit'
  | 'legacyNewPropertySubmitting'
  | 'legacyNewPropertySuccess'
  | 'legacyNewPropertyError'
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
  | 'searchClearInputAria'
  | 'locationBadgeCity'
  | 'locationBadgeDistrict'
  | 'locationBadgeLandmark'
  | 'labelCity'
  | 'labelDistrict'
  | 'selectDistrictPlaceholder'
  | 'selectCityPlaceholder'
  | 'searchFiltersResetButton'
  | 'explorePopularCities'
  | 'popularStaysViewMore'
  | 'addressPatternTower'
  | 'addressPatternZone'
  | 'addressPatternLobby'
  | 'addressPatternUnit'
  | 'adminKycPageTitle'
  | 'adminKycTotalRecordsTemplate'
  | 'adminKycRefreshButton'
  | 'adminKycLoadingLabel'
  | 'adminKycEmptyMessage'
  | 'adminKycNoNameFallback'
  | 'bookingGuestSummaryWithChildren'
  | 'bookingGuestSummaryAdultsOnly'
  | 'searchRoomTypeStudio'
  | 'searchRoomTypeOneRoom'
  | 'searchRoomTypeTwoRoom'
  | 'searchRoomTypeThreePlus'
  | 'searchRoomTypeDetached'
  | 'adminKycStatusVerified'
  | 'adminKycStatusPending'
  | 'adminKycStatusRejected'
  | 'adminKycStatusUnverified'
  | 'adminKycSubtitleNew'
  | 'adminKycSubtitleVerified'
  | 'adminKycSubtitleUnverified'
  | 'adminKycTabNew'
  | 'adminKycTabAll'
  | 'adminKycTabVerified'
  | 'adminKycTabUnverified'
  | 'adminKycColVerificationStatus'
  | 'adminKycColIdDocument'
  | 'adminKycColDateOfBirth'
  | 'adminKycIdTypePassportLabel'
  | 'adminKycIdTypeIdCardLabel'
  | 'adminKycMobileIdPrefix'
  | 'adminKycMobileDobPrefix'
  | 'adminSettlementsEmptyRequest'
  | 'adminSettlementsEmptyPending'
  | 'adminSettlementsEmptyApproved'
  | 'adminSettlementsEmptyHeld'
  | 'adminSettlementsListFilteredEmpty'
  | 'adminContractsEmptyNew'
  | 'adminContractsEmptySealed'
  | 'adminContractsEmptyInProgress'
  | 'adminContractsEmptyCompleted'
  | 'adminRefundsEmptyAll'
  | 'adminRefundsEmptyNew'
  | 'adminRefundsEmptyPre'
  | 'adminRefundsEmptyDuring'
  | 'adminWithdrawalsEmptyPending'
  | 'adminWithdrawalsEmptyProcessing'
  | 'adminWithdrawalsEmptyCompleted'
  | 'adminWithdrawalsEmptyRejected'
  | 'adminWithdrawalsEmptyHeld'
  | 'adminCommonRefresh'
  | 'adminCommonLoading'
  | 'adminSettlementsTabRequest'
  | 'adminSettlementsTabPending'
  | 'adminSettlementsTabApproved'
  | 'adminSettlementsTabHeld'
  | 'adminSettlementsPageTitle'
  | 'adminSettlementsIntroLine'
  | 'adminSettlementsBadgeContractEnded'
  | 'adminContractsPageTitle'
  | 'adminContractsIntroLine'
  | 'adminContractsTabNew'
  | 'adminContractsTabSealed'
  | 'adminContractsTabInProgress'
  | 'adminContractsTabCompleted'
  | 'adminContractsSearchPlaceholder'
  | 'adminContractsSearchHint'
  | 'adminRefundsPageTitle'
  | 'adminRefundsIntroLine'
  | 'adminRefundsTabNew'
  | 'adminRefundsTabAll'
  | 'adminRefundsTabPre'
  | 'adminRefundsTabDuring'
  | 'adminRefundsSearchPlaceholder'
  | 'adminRefundsSearchHint'
  | 'adminRefundsApproveButton'
  | 'adminWithdrawalsPageTitle'
  | 'adminWithdrawalsIntroLine'
  | 'adminWithdrawalsTabPending'
  | 'adminWithdrawalsTabProcessing'
  | 'adminWithdrawalsTabRejected'
  | 'adminWithdrawalsTabCompleted'
  | 'adminWithdrawalsTabHeld'
  | 'adminWithdrawalsSearchPlaceholder'
  | 'adminWithdrawalsSearchHint'
  | 'adminWithdrawalApprove'
  | 'adminWithdrawalReject'
  | 'adminWithdrawalHold'
  | 'adminWithdrawalComplete'
  | 'adminWithdrawalResume'
  | 'adminWithdrawalBadgeCompleted'
  | 'adminWithdrawalBadgeRejected'
  | 'adminWithdrawalRejectReason'
  | 'adminWithdrawalHoldReason'
  | 'csvKycColFullName'
  | 'csvKycColPhone'
  | 'csvKycColIdType'
  | 'csvKycColIdNumber'
  | 'csvKycColDateOfBirth'
  | 'csvKycColIdFrontUrl'
  | 'csvKycColIdBackUrl'
  | 'csvKycColFaceUrl'
  | 'csvKycColSubmittedAt'
  | 'csvKycColVerificationStatus'
  | 'adminKycCsvDownloadError'
  | 'adminSettlementsSearchHint'
  | 'adminSettlementsFilterLabel'
  | 'adminSettlementsFilterTitle24hBaseline'
  | 'adminSettlementsSortRemainingAscTitle'
  | 'adminSettlementsSortRemainingDescTitle'
  | 'adminSettlementsFilterElapsed24hTitle'
  | 'adminSettlementsSortRemainingAsc'
  | 'adminSettlementsSortRemainingDesc'
  | 'adminSettlementsFilterElapsed24h'
  | 'adminSettlementActionMoveToPending'
  | 'adminSettlementResumeToRequest'
  | 'adminSettlementResumeToPending'
  | 'adminAuditPageTitle'
  | 'adminAuditPageIntro'
  | 'adminAuditSearchPlaceholder'
  | 'adminAuditSearchHint'
  | 'adminAuditEmpty'
  | 'adminAuditColAction'
  | 'adminAuditColAmount'
  | 'adminAuditColOwnerTarget'
  | 'adminAuditColRef'
  | 'adminAuditColActor'
  | 'adminAuditColNote'
  | 'adminAuditColTime'
  | 'adminAuditAmountDash'
  | 'adminAuditMobileTarget'
  | 'adminAuditMobileActor'
  | 'adminAuditTabNew'
  | 'adminAuditTabAll'
  | 'adminAuditTabSettlement'
  | 'adminAuditTabWithdrawal'
  | 'adminAuditTabRefund'
  | 'adminAuditTabAccount'
  | 'adminAuditTabProperty'
  | 'adminAuditLedgerSettlementApproved'
  | 'adminAuditLedgerSettlementHeld'
  | 'adminAuditLedgerSettlementResumed'
  | 'adminAuditLedgerSettlementRevertedPending'
  | 'adminAuditLedgerSettlementRevertedRequest'
  | 'adminAuditLedgerWithdrawalRequested'
  | 'adminAuditLedgerWithdrawalProcessing'
  | 'adminAuditLedgerWithdrawalHeld'
  | 'adminAuditLedgerWithdrawalResumed'
  | 'adminAuditLedgerWithdrawalCompleted'
  | 'adminAuditLedgerWithdrawalRejectedRefund'
  | 'adminAuditLedgerRefundApproved'
  | 'adminAuditModUserBlocked'
  | 'adminAuditModUserRestored'
  | 'adminAuditModPropertyHidden'
  | 'adminAuditModPropertyRestored'
  | 'adminAuditModPropertyAdEndedByHost'
  | 'adminAuditModPropertyDeletedByHost'
  | 'adminUiBadPath'
  | 'adminUiLoadingEllipsis'
  | 'adminUiNoQueryResults'
  | 'adminPaginationPrev'
  | 'adminPaginationNext'
  | 'adminPaginationLine'
  | 'adminFilterNew'
  | 'adminFilterAll'
  | 'adminUserFilterActive'
  | 'adminUserFilterBlocked'
  | 'adminUsersTitle'
  | 'adminUsersIntroLine'
  | 'adminUsersSearchPlaceholder'
  | 'adminUsersSearchHint'
  | 'adminColAlert'
  | 'adminColName'
  | 'adminColEmail'
  | 'adminColPhone'
  | 'adminColUid'
  | 'adminColStatus'
  | 'adminColActions'
  | 'adminPingTitleUnseen'
  | 'adminPingTitleAck'
  | 'adminAriaUnseenNewUser'
  | 'adminAriaAckNewUser'
  | 'adminDotUnseen'
  | 'adminDotAcked'
  | 'adminStatusNormal'
  | 'adminStatusBlocked'
  | 'adminActionRestore'
  | 'adminActionBlock'
  | 'adminPropertiesTitle'
  | 'adminPropertiesIntroLine'
  | 'adminPropFilterListed'
  | 'adminPropFilterPaused'
  | 'adminPropFilterHidden'
  | 'adminPropertiesSearchPlaceholder'
  | 'adminPropertiesSearchHint'
  | 'adminPropColTitle'
  | 'adminPropColAddress'
  | 'adminPropColOwner'
  | 'adminPropColId'
  | 'adminListingHidden'
  | 'adminListingAdPaused'
  | 'adminListingLive'
  | 'adminPropUnhide'
  | 'adminPropHide'
  | 'adminAriaUnseenNewProperty'
  | 'adminAriaAckNewProperty'
  | 'adminPropertiesHiddenReasonLabel'
  | 'adminNotFoundUser'
  | 'adminBackToUsersList'
  | 'adminNotFoundProperty'
  | 'adminBackToPropertiesList'
  | 'adminUserDetailBack'
  | 'adminNoDisplayName'
  | 'adminUserBadgeSuspended'
  | 'adminUserBadgeActive'
  | 'adminLabelHostMemo'
  | 'adminLabelGuestMemo'
  | 'adminMemoEmpty'
  | 'adminMemoPlaceholderHost'
  | 'adminMemoPlaceholderGuest'
  | 'adminMemoNewestFirst'
  | 'adminUserUnblock'
  | 'adminUserBlockAccount'
  | 'adminSectionProfileStatus'
  | 'adminSectionHost'
  | 'adminSectionGuest'
  | 'adminLabelKyc'
  | 'adminUserJoinedAt'
  | 'adminUserStatHostBookingsTotal'
  | 'adminUserStatInProgress'
  | 'adminUserStatCompleted'
  | 'adminUserStatCancelled'
  | 'adminUserBalanceTitle'
  | 'adminUserBalanceAvailable'
  | 'adminUserBalanceApprovedRevenue'
  | 'adminUserBalancePendingWithdraw'
  | 'adminUserGuestCurrentRes'
  | 'adminUserGuestDepositPending'
  | 'adminUserGuestContractDone'
  | 'adminUserRefundsHeading'
  | 'adminUserRefundsEmpty'
  | 'adminUserRefundsColBookingId'
  | 'adminUserRefundsColProperty'
  | 'adminUserRefundsColAmount'
  | 'adminUserRefundsColPayment'
  | 'adminUserRefundsColRefund'
  | 'adminRefundStatusDone'
  | 'adminRefundStatusAdminOk'
  | 'adminRefundStatusPending'
  | 'adminPropertyDetailBackList'
  | 'adminPropertyNoTitle'
  | 'adminPropertyAdminMemo'
  | 'adminPropertyMemoPlaceholder'
  | 'adminPropertyViewHost'
  | 'adminPropertyUnhide'
  | 'adminPropertyHide'
  | 'adminSectionHostId'
  | 'adminLabelOwnerId'
  | 'adminLabelDisplayName'
  | 'adminSectionPriceAreaGuests'
  | 'adminLabelWeeklyRent'
  | 'adminLabelAreaSqm'
  | 'adminLabelBedBath'
  | 'adminLabelBedroomsBathrooms'
  | 'adminLabelMaxGuests'
  | 'adminLabelAdultsChildren'
  | 'adminSectionLocation'
  | 'adminLabelAddress'
  | 'adminLabelUnitNumber'
  | 'adminLabelCityDistrictIds'
  | 'adminLabelCoordinates'
  | 'adminSectionDescription'
  | 'adminPropertyDescOriginalVi'
  | 'adminPropertyDescTranslatedKo'
  | 'adminSectionPhotos'
  | 'adminPropertyNoImages'
  | 'adminSectionAmenitiesType'
  | 'adminLabelPropertyType'
  | 'adminLabelCleaningPerWeek'
  | 'adminSectionPets'
  | 'adminLabelPetAllowed'
  | 'adminLabelYes'
  | 'adminLabelNo'
  | 'adminLabelPetFeePerPet'
  | 'adminLabelMaxPets'
  | 'adminSectionSchedule'
  | 'adminLabelRentStart'
  | 'adminLabelRentEnd'
  | 'adminLabelCheckInTime'
  | 'adminLabelCheckOutTime'
  | 'adminSectionIcal'
  | 'adminLabelIcalPlatform'
  | 'adminLabelIcalCalendarName'
  | 'adminLabelUrl'
  | 'adminSectionChangeHistory'
  | 'adminPropertyMetaCreated'
  | 'adminPropertyMetaUpdated'
  | 'adminPropertyDeletedFlag'
  | 'adminSystemLogTitle'
  | 'adminSystemLogChecklist'
  | 'adminSystemLogFilterNew'
  | 'adminSystemLogFilterAll'
  | 'adminSystemLogFilterError'
  | 'adminSystemLogFilterWarning'
  | 'adminSystemLogFilterInfo'
  | 'adminSystemLogExportCsv'
  | 'adminSystemLogClearEphemeral'
  | 'adminSystemLogClearPersistent'
  | 'adminSystemLogCountLine'
  | 'adminSystemLogColTime'
  | 'adminSystemLogColSeverity'
  | 'adminSystemLogColCategory'
  | 'adminSystemLogColMessage'
  | 'adminSystemLogColBookingId'
  | 'adminSystemLogColOwnerId'
  | 'adminSystemLogColSnapshot'
  | 'adminSystemLogColCopy'
  | 'adminSystemLogEmpty'
  | 'adminSystemLogLinkSettlements'
  | 'adminSystemLogSettlementsSearchHint'
  | 'adminSystemLogCopyRowTitle'
  | 'adminSystemLogFooterNote'
  | 'adminPropertyLogsTitle'
  | 'adminPropertyLogsIntro'
  | 'adminPropertyLogsTabAll'
  | 'adminPropertyLogsTabDeleted'
  | 'adminPropertyLogsTabCancelled'
  | 'adminPropertyLogsColTime'
  | 'adminPropertyLogsColType'
  | 'adminPropertyLogsColPropertyId'
  | 'adminPropertyLogsColOwnerId'
  | 'adminPropertyLogsColRecorder'
  | 'adminPropertyLogsColReservation'
  | 'adminPropertyLogsColNote'
  | 'adminPropertyLogsEmpty'
  | 'adminAccountsTitle'
  | 'adminAccountsIntro'
  | 'adminAccountsNewButton'
  | 'adminAccountsFormNewTitle'
  | 'adminAccountsLabelUsername'
  | 'adminAccountsLabelNickname'
  | 'adminAccountsNicknamePlaceholder'
  | 'adminAccountsPasswordMin'
  | 'adminAccountsCreateSuper'
  | 'adminAccountsCreateSubmit'
  | 'adminAccountsListTitle'
  | 'adminAccountsRoleSuper'
  | 'adminAccountsRoleNormal'
  | 'adminAccountsSelectPrompt'
  | 'adminAccountsProfileToggle'
  | 'adminAccountsProfileExpand'
  | 'adminAccountsProfileCollapse'
  | 'adminAccountsProfileNote'
  | 'adminAccountsEditNickname'
  | 'adminAccountsEditUsername'
  | 'adminAccountsEditNewPassword'
  | 'adminAccountsEditCurrentPassword'
  | 'adminAccountsSaveProfile'
  | 'adminAccountsSaving'
  | 'adminAccountsRolesHeading'
  | 'adminAccountsSuperAllMenus'
  | 'adminAccountsDemoteSuper'
  | 'adminAccountsSuperCheckbox'
  | 'adminAccountsPermHint'
  | 'adminAccountsSavePerms'
  | 'adminAccountsSelfPermNote'
  | 'adminNavDashboard'
  | 'adminNavUsers'
  | 'adminNavProperties'
  | 'adminNavPropertyLogs'
  | 'adminNavContracts'
  | 'adminNavSettlements'
  | 'adminNavRefunds'
  | 'adminNavWithdrawals'
  | 'adminNavAudit'
  | 'adminNavKyc'
  | 'adminNavSystemLog'
  | 'adminHomeTitle'
  | 'adminHomeSubtitle'
  | 'adminNavMenuAriaLabel'
  | 'adminNavBadgeAria'
  | 'adminNavDescUsers'
  | 'adminNavDescProperties'
  | 'adminNavDescPropertyLogs'
  | 'adminNavDescContracts'
  | 'adminNavDescSettlements'
  | 'adminNavDescRefunds'
  | 'adminNavDescWithdrawals'
  | 'adminNavDescAudit'
  | 'adminNavDescKyc'
  | 'adminNavDescSystemLog'
  | 'adminLoginTitle'
  | 'adminLoginSubtitle'
  | 'adminLoginUsernameLabel'
  | 'adminLoginPasswordLabel'
  | 'adminLoginSubmit'
  | 'adminLoginError'
  | 'adminLoginBootstrapNote'
  | 'adminLoginHomeLink'
  | 'adminNoAccessTitle'
  | 'adminNoAccessBodyWithUser'
  | 'adminNoAccessBodyGeneric'
  | 'adminNoAccessLogout'
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
  | 'dateBadgeRangeTemplate'
  | 'dateBadgeFromTemplate'
  | 'searchButton'
  | 'noResultsFound'
  | 'propertiesFound'
  | 'minExceedsMaxError'
  | 'maxBelowMinError'
  | 'searchFilterPriceRangeLabel'
  | 'searchFilterFacilityPickHeading'
  | 'searchPriceRangeDragHint'
  | 'searchRentPerWeekFragment'
  | 'chatSendingMessage'
  | 'chatInputInProgressStatus'
  | 'signupErrorRequiredFields'
  | 'signupErrorInvalidEmailFormat'
  | 'signupErrorPasswordMismatch'
  | 'signupErrorPasswordMinLength'
  | 'signupErrorPhoneVerificationRequired'
  | 'signupErrorOtpSendFailed'
  | 'signupErrorOtpSendSystem'
  | 'signupErrorOtpInvalidCode'
  | 'signupErrorOtpVerifyFailed'
  | 'signupErrorFailedGeneric'
  | 'signupErrorUnexpected'
  | 'signupErrorSocialLoginFailed'
  | 'uiTranslateButtonLoading'
  | 'uiTranslateViewOriginal'
  | 'uiTranslateShowTranslation'
  | 'emailWelcomeTitle'
  | 'emailWelcomeBody'
  | 'emailBookingConfirmedGuestTitle'
  | 'emailBookingConfirmedGuestBody'
  | 'emailBookingConfirmedHostTitle'
  | 'emailBookingConfirmedHostBody'
  | 'emailBookingCancelledGuestTitle'
  | 'emailBookingCancelledGuestBody'
  | 'emailOtpCodeTitle'
  | 'emailOtpCodeBody'
  | 'emailPasswordResetTitle'
  | 'emailPasswordResetBody'
  | 'emailVerifyEmailTitle'
  | 'emailVerifyEmailBody'
  | 'emailHostNewBookingRequestTitle'
  | 'emailHostNewBookingRequestBody'
  | 'emailPayoutProcessedTitle'
  | 'emailPayoutProcessedBody'
  | 'emailGenericFooterNotice'
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
  | 'incomeStatusRevenueConfirmed'
  | 'incomeStatusSettlementRequest'
  | 'incomeStatusSettlementPending'
  | 'incomeStatusSettlementApproved'
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
  | 'takePhoto'
  | 'fullNamePlaceholder'
  | 'signupOtpVerify'
  | 'phoneVerificationComplete'
  | 'confirmPasswordLabel'
  | 'confirmPasswordPlaceholder'
  | 'otpCodePlaceholder'
  | 'deleteAccountTitle'
  | 'deleteAccountIntro'
  | 'deleteAccountFooterNote'
  | 'legalFooterTerms'
  | 'legalFooterPrivacy'
  | 'legalFooterDeleteAccount'
  | 'legalFooterNavAriaLabel'
  | 'toastHeadingSuccess'
  | 'toastHeadingInfo'
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
  | 'bookingSuccessLoadFailed'
  | 'bookingSuccessBookingIdMissing'
  | 'bookingSuccessCopyOk'
  | 'bookingSuccessCopyFail'
  | 'priceUnitVndSuffix'
  | 'reservationCancelRelistMerged'
  | 'reservationCancelRelistRelisted'
  | 'reservationCancelRelistLimitExceeded'
  | 'reservationCancelRelistShortTerm'
  | 'reservationStatusUpdateError'
  | 'hostReservationRecordDeleteConfirm'
  | 'hostReservationRecordDeleteError'
  | 'hostReservationLabelCompleted'
  | 'paymentMethodLabelMomo'
  | 'paymentMethodLabelZalopay'
  | 'paymentMethodLabelBankTransfer'
  | 'paymentMethodLabelPayAtProperty'
  | 'bookingDetailsPaymentHeading'
  | 'bookingDetailsPayMethodRowLabel'
  | 'bookingDetailsAccommodationLine'
  | 'bookingDetailsFeesVatLine'
  | 'bookingDetailsTotalRow'
  | 'bookingWeeksUnit'
  | 'hostBookingCardStatusPending'
  | 'hostBookingCardStatusConfirmed'
  | 'hostBookingCardStatusRequestCancelled'
  | 'hostBookingCardStatusBookingCancelled'
  | 'myPropertiesPendingEndAdTitle'
  | 'myPropertiesPendingEndAdDesc'
  | 'myPropertiesDuplicateLiveTitle'
  | 'myPropertiesDuplicateLiveHint'
  | 'dialogNo'
  | 'dialogYes'
  | 'hostCancelModalTitle'
  | 'hostCancelModalAckLabel'
  | 'hostBookingConfirmToastOk'
  | 'hostBookingConfirmToastErr'
  | 'hostBookingChatOpenErr'
  | 'hostBookingRejectToastListingOk'
  | 'hostBookingRejectToastErr'
  | 'hostBookingDeleteConfirm'
  | 'hostBookingDeleteOk'
  | 'hostBookingDeleteErr'
  | 'hostBookingCancelReasonByOwner'
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
  | 'calGuestLegendCheckoutDayAbbr'
  | 'calGuestLegendShortStayDemoDay'
  | 'calGuestLegendShortStay'
  | 'calGuestLegendCheckinToEnd'
  | 'calGuestLegendValidCheckout'
  | 'calGuestSelectCheckInFirst'
  | 'weeklyCostLabel'
  | 'bookingOccupancyLabel'
  | 'importExternalCalendarHelp'
  | 'carouselPrevious'
  | 'carouselNext'
  | 'translationConsentTitle'
  | 'translationConsentDescription'
  | 'translationConsentAgree'
  | 'translationConsentDecline'
  | 'translationLangPackTitle'
  | 'translationLangPackDescription'
  | 'translationLangPackAgree'
  | 'translationLangPackDecline'
  | 'translationModalEngineLine'
  | 'translationModalWebRequiresNetwork'
  | 'translationModalOfflineCapable'
  | 'translationLangPackStorageTitle'
  | 'translationLangPackStorageHint'
  | 'translationFooterConsentPrivacy'
  | 'translationFooterLangPackDevice'
  | 'chatTranslatedByGemini'
  | 'chatTranslatedByDevice'
  | 'chatTranslationErrorLabel'
  | 'chatTranslateShowOriginalTitle'
  | 'chatTranslateShowTranslatedTitle'
  | 'chatTranslating'
  | 'chatExampleTitle'
  | 'chatExampleHowToTitle'
  | 'chatExampleBullet1'
  | 'chatExampleBullet2'
  | 'chatExampleBullet3'
  | 'chatExampleBullet4'
  | 'chatExampleBullet5'
  | 'chatExampleDemoGuestName'
  | 'chatExampleDemoHostName'
  | 'chatExampleDemoTime1'
  | 'chatExampleDemoTime2'
  | 'chatExampleDemoTime3'
  | 'chatExampleDemoMsgHostReply'
  | 'propertyImageAltFallback'
  | 'propertyFavoriteButtonAria'
  | 'carouselSlideSelectAria'
  | 'trustSignalKycTitle'
  | 'trustSignalKycDesc'
  | 'trustSignalLanguagesTitle'
  | 'trustSignalLanguagesDesc'
  | 'trustSignalChatTitle'
  | 'trustSignalChatDesc'
  | 'trustSignalBookingTitle'
  | 'trustSignalBookingDesc'
  | 'propertyDescriptionTranslateError'
  | 'propertyDescExampleTitle'
  | 'propertyDescHowToTitle'
  | 'propertyDescBullet1'
  | 'propertyDescBullet2'
  | 'propertyDescBullet3'
  | 'propertyDescBullet4'
  | 'propertyDescBullet5'
  | 'uiTranslateGenericFail'
  | 'uiTranslatedBadge'
  | 'uiTranslateReset'
  | 'uiTranslateCostSavingHint'
  | 'chatSendFailed'
  | 'chatRoleTenant'
  | 'chatRoleLandlord'
  | 'chatViewListing'
  | 'chatViewListingDetail'
  | 'chatResidencyNoticeTitle'
  | 'chatResidencyNoticeBody'
  | 'chatScrollOlderMessages'
  | 'chatBookingNoticeTitle'
  | 'chatBookingNoticeBody'
  | 'chatEmptyState'
  | 'chatReadReceipt'
  | 'chatSystemPeerJoined'
  | 'chatSystemImageSent'
  | 'chatInputPlaceholder'
  | 'chatInputPlaceholderFull'
  | 'settlementProcessHaltedDetail'
  | 'settlementEmptyRevenueList'
  | 'settlementNoWithdrawalHistory'
  | 'settlementNoBankAccounts'
  | 'withdrawalValidateAmount'
  | 'withdrawalSelectBankRequired'
  | 'withdrawalRequestFailedMessage'
  | 'withdrawalSubmittedSuccess'
  | 'bankAccountFormIncomplete'
  | 'bankAccountAddFailed'
  | 'bankAccountAddedSuccess'
  | 'withdrawalStatusHeld'
  | 'withdrawalStatusRejected'
  | 'profileKycCoinsProgress'
  | 'profileKycEncourageWithCount'
  | 'deleteAccountButton'
  | 'deleteAccountExecuting'
  | 'phoneVerificationRequired'
  | 'langEndonymKo'
  | 'langEndonymVi'
  | 'langEndonymEn'
  | 'langEndonymJa'
  | 'langEndonymZh'
  | 'chatDateToday'
  | 'chatDateYesterday'
  // KYC 단계·신분증·얼굴 촬영·예약 실패 메시지 (5개국어)
  | 'kycHostVerificationTitle'
  | 'kycCompleteThreeStepSubtitle'
  | 'kycProgressLoadError'
  | 'kycStepFailedGeneric'
  | 'kycIdDocumentStepTitle'
  | 'kycFaceVerificationStepTitle'
  | 'kycStep2CompleteTitle'
  | 'kycStep2CompleteBody'
  | 'kycTestModeBannerTitle'
  | 'kycTestModeFaceSubtitle'
  | 'kycTestModeIdSubtitle'
  | 'kycFaceFiveDirectionInstruction'
  | 'kycStartCapture'
  | 'kycFaceCaptureSessionTitle'
  | 'kycMultistepProgress'
  | 'kycCameraErrorTitle'
  | 'kycStopCapture'
  | 'kycCaptureCompleteTitle'
  | 'kycReviewCapturedImagesFace'
  | 'kycRetakePhotos'
  | 'kycCompleteVerification'
  | 'kycAiAnalyzingTitle'
  | 'kycAiAnalyzingDesc'
  | 'kycIdSelectTypeAndCapture'
  | 'kycCameraOpenIdCard'
  | 'kycCameraOpenPassport'
  | 'kycIdCaptureTitleFrontIdCard'
  | 'kycIdCaptureTitleFrontPassport'
  | 'kycIdCaptureTitleBack'
  | 'kycIdAlignInGuide'
  | 'kycIdPlaceInFrame'
  | 'kycIdFullDocumentVisible'
  | 'kycImageConfirmTitle'
  | 'kycImageConfirmDesc'
  | 'kycIdSideFront'
  | 'kycIdSideBack'
  | 'kycShootBackSide'
  | 'kycRetakeCapture'
  | 'kycFormTitleEnterIdInfo'
  | 'kycFormDescEnterIdInfo'
  | 'kycFormIdNumberLabel'
  | 'kycFormDateOfBirthLabel'
  | 'kycFormIssueDateLabel'
  | 'kycFormExpiryDateLabel'
  | 'kycFormNextStep'
  | 'kycFormRequiredFieldsMissing'
  | 'kycFormImageRequired'
  | 'kycCaptureCanvasError'
  | 'kycCaptureFailedGeneric'
  | 'cameraErrPermissionDenied'
  | 'cameraErrNotFound'
  | 'cameraErrGeneric'
  | 'apiSyncErrorTransient'
  | 'userFacingAuthOrSessionError'
  | 'bookingCreateFailedMessage'
  | 'bookingPaymentCompleteFailedMessage'
  | 'bookingPaymentMetaDefaultError'
  | 'bookingPaymentMetaCreateError'
  | 'bookingPaymentToastRefundCancelledBody'
  | 'bookingPaymentToastConfirmedBody'
  | 'bookingPaymentToastSyncedBody'
  | 'bookingRefundToastCancelledBody'
  | 'bookingRefundToastSyncedBody'
  | 'bookingSyncImmediateFailed'
  | 'bookingErrorPaymentNotCompleted'
  | 'appPaymentErrUnparseableResponse'
  | 'appPaymentErrRejected'
  | 'appPaymentErrHttpStatus'
  | 'topBarUnreadChatSubtitle'
  | 'topBarNoNotifications'
  | 'topBarAriaNotifications'
  | 'topBarAriaProfile'
  | 'topBarAriaLogin'
  /** 관리자 계정 API (`/api/admin/accounts`) — 서버는 영문 코드, 클라이언트에서 번역 */
  | 'adminAccountsListLoadFailed'
  | 'adminAccountsSaveFailed'
  | 'adminAccountsCreateFailed'
  | 'adminAccountsToggleFailed'
  | 'apiErrAdminAccountInvalidInput'
  | 'apiErrAdminUsernameTaken'
  | 'apiErrAdminUsernameInvalid'
  | 'apiErrAdminUsernameConflict'
  | 'apiErrAdminNewPasswordTooShort'
  | 'apiErrAdminCurrentPasswordInvalid'
  | 'apiErrAdminCannotDemoteOwnSuper'
  | 'apiErrAdminCannotDemoteLastSuper'
  | 'apiErrAdminNoValidUpdates';

/** 앱 전체 UI 키 = 기본 사전 + 매물 등록·수정·상세 listing 사전 */
export type UITextKey = BaseUITextKey | ListingTextKey;

/**
 * 언어별 UI 텍스트 사전 (listing 키는 `listingTexts`에만 있음)
 */
const uiTexts: Record<SupportedLanguage, Record<BaseUITextKey, string>> = {
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
    myProperties: '내 숙소 관리',
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
    popularStaysTitle: '인기 숙소',
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
    whereDoYouWantToLive:
      '숙박·단기 임대 정보를 지역으로 찾아보세요',
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
    loginWrongPassword: '비밀번호가 올바르지 않습니다.',
    loginSocialLoginRequired: '이 계정은 소셜 로그인으로 가입되었습니다.',
    loginAccountBlocked: '관리자에 의해 이용이 제한된 계정입니다.',
    loginNetworkError: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    loginServerUnavailable: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    adminUserBlockPrompt: '차단 사유를 입력하세요.',
    adminUserBlockDefaultReason: '관리자 차단',
    phoneSendOtpButton: '인증번호 발송',
    phoneEnterNumberPlaceholder: '전화번호 입력',
    phoneSelectCountry: '국가 선택',
    phoneOtpSentBadge: '발송됨',
    mapErrAwsApiKeyMissing:
      'AWS API 키가 설정되지 않았습니다. .env.local의 NEXT_PUBLIC_AWS_API_KEY를 확인해 주세요.',
    mapErrAwsMapNameMissing:
      'AWS Map 이름이 설정되지 않았습니다. .env.local의 NEXT_PUBLIC_AWS_MAP_NAME을 확인해 주세요.',
    mapErrLoadGeneric: '지도를 불러오는 중 오류가 발생했습니다.',
    mapErrNetworkAws: '네트워크 오류로 AWS 지도 서비스에 연결할 수 없습니다.',
    mapErrAwsKeyInvalid: 'AWS API 키가 유효하지 않습니다. 환경 변수를 확인해 주세요.',
    mapErrMapNotFound: '지도 리소스를 찾을 수 없습니다. Map 이름을 확인해 주세요.',
    mapErrStyleLoad: '지도 스타일을 불러오지 못했습니다. API 키와 Map 이름을 확인해 주세요.',
    mapErrorHeading: '오류',
    mapErrCheckEnvHint:
      '환경 변수 NEXT_PUBLIC_AWS_API_KEY, NEXT_PUBLIC_AWS_MAP_NAME을 확인해 주세요.',
    legacyNewPropertyPageTitle: '새 매물 등록',
    legacyNewPropertyFieldTitle: '매물명',
    legacyNewPropertyTitlePh: '예: 홍대점 301호, 판매용 A동',
    legacyNewPropertyDescVi: '설명 (베트남어)',
    legacyNewPropertyAddrVi: '주소 (베트남어)',
    legacyNewPropertyGeocoding: '좌표 변환 중…',
    legacyNewPropertyCoordsOk: '좌표 생성됨',
    legacyNewPropertyAddrPh: '예: Quận 7, Thành phố Hồ Chí Minh',
    legacyNewPropertyCoordsLine: '좌표: {{lat}}, {{lng}}',
    legacyNewPropertyPrice: '가격',
    legacyNewPropertyCurrency: '통화',
    legacyNewPropertyArea: '면적 (m²)',
    legacyNewPropertyBedrooms: '침실',
    legacyNewPropertyBathrooms: '욕실',
    legacyNewPropertyCheckIn: '체크인 시간',
    legacyNewPropertyCheckOut: '체크아웃 시간',
    legacyNewPropertyTimeAfter: '{{time}} 이후',
    legacyNewPropertyTimeBefore: '{{time}} 이전',
    legacyNewPropertyCheckInHelp: '입주자가 체크인할 수 있는 시간',
    legacyNewPropertyCheckOutHelp: '입주자가 체크아웃해야 하는 시간',
    legacyNewPropertyCancel: '취소',
    legacyNewPropertySubmit: '등록하기',
    legacyNewPropertySubmitting: '등록 중…',
    legacyNewPropertySuccess: '매물이 등록되었습니다.',
    legacyNewPropertyError: '매물 등록 중 오류가 발생했습니다.',
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
    searchClearInputAria: '검색어 지우기',
    locationBadgeCity: '도시',
    locationBadgeDistrict: '구/군',
    locationBadgeLandmark: '명소',
    labelCity: '도시',
    labelDistrict: '구',
    selectDistrictPlaceholder: '구 선택',
    selectCityPlaceholder: '도시 선택',
    searchFiltersResetButton: '필터 초기화',
    explorePopularCities: '베트남 인기 지역',
    popularStaysViewMore: '더 보기',
    addressPatternTower: '{{name}}동',
    addressPatternZone: '{{name}}단지',
    addressPatternLobby: '{{name}} 로비',
    addressPatternUnit: '{{name}}호',
    adminKycPageTitle: 'KYC 데이터',
    adminKycTotalRecordsTemplate: '총 {{count}}명',
    adminKycRefreshButton: '새로고침',
    adminKycLoadingLabel: '로딩 중...',
    adminKycEmptyMessage: '데이터 없음',
    adminKycNoNameFallback: '이름 없음',
    bookingGuestSummaryWithChildren: '성인 {{adults}}명, 어린이 {{children}}명',
    bookingGuestSummaryAdultsOnly: '성인 {{adults}}명',
    searchRoomTypeStudio: '스튜디오',
    searchRoomTypeOneRoom: '1룸(방·거실 분리)',
    searchRoomTypeTwoRoom: '2룸',
    searchRoomTypeThreePlus: '3룸+',
    searchRoomTypeDetached: '독채',
    adminKycStatusVerified: '인증완료',
    adminKycStatusPending: '심사중',
    adminKycStatusRejected: '거부',
    adminKycStatusUnverified: '미인증',
    adminKycSubtitleNew: '신규 {{count}}명',
    adminKycSubtitleVerified: '인증 {{count}}명',
    adminKycSubtitleUnverified: '미인증 {{count}}명',
    adminKycTabNew: '신규',
    adminKycTabAll: '전체',
    adminKycTabVerified: '인증',
    adminKycTabUnverified: '미인증',
    adminKycColVerificationStatus: '인증상태',
    adminKycColIdDocument: '신분증',
    adminKycColDateOfBirth: '생년월일',
    adminKycIdTypePassportLabel: '여권',
    adminKycIdTypeIdCardLabel: '신분증',
    adminKycMobileIdPrefix: '신분증',
    adminKycMobileDobPrefix: '생년월일',
    adminSettlementsEmptyRequest:
      '승인 요청 정산 건이 없습니다. (체크아웃 이후·계약종료와 동일 시점에 표시됩니다.)',
    adminSettlementsEmptyPending: '승인 대기 정산 건이 없습니다.',
    adminSettlementsEmptyApproved: '승인 완료(활성) 건이 없습니다.',
    adminSettlementsEmptyHeld: '보류 중인 정산 건이 없습니다.',
    adminSettlementsListFilteredEmpty: '검색·정렬·필터 조건에 맞는 건이 없습니다.',
    adminContractsEmptyNew: '신규 계약 건이 없습니다.',
    adminContractsEmptySealed: '계약체결(결제·확정, 숙박 전) 예약이 없습니다.',
    adminContractsEmptyInProgress: '계약시작(체크인~체크아웃 진행 중) 예약이 없습니다.',
    adminContractsEmptyCompleted: '계약종료(체크아웃 이후·이용완료) 예약이 없습니다.',
    adminRefundsEmptyAll: '환불 대기 건이 없습니다.',
    adminRefundsEmptyNew: '신규 환불 대기 건이 없습니다.',
    adminRefundsEmptyPre: '계약전 환불 대기 건이 없습니다.',
    adminRefundsEmptyDuring: '계약진행중 환불 대기 건이 없습니다.',
    adminWithdrawalsEmptyPending: '승인 대기 건이 없습니다.',
    adminWithdrawalsEmptyProcessing: '처리 중인 출금이 없습니다.',
    adminWithdrawalsEmptyCompleted: '완료된 출금 내역이 없습니다.',
    adminWithdrawalsEmptyRejected: '반려된 출금 내역이 없습니다.',
    adminWithdrawalsEmptyHeld: '보류된 출금이 없습니다.',
    adminCommonRefresh: '새로고침',
    adminCommonLoading: '불러오는 중...',
    adminSettlementsTabRequest: '승인 요청',
    adminSettlementsTabPending: '승인 대기',
    adminSettlementsTabApproved: '승인 완료',
    adminSettlementsTabHeld: '보류',
    adminSettlementsPageTitle: '정산 승인',
    adminSettlementsIntroLine:
      '승인 요청은 체크아웃 이후(계약종료)에만 생성됩니다. 확인 후 승인 대기로 넘긴 뒤 정산 승인·보류를 처리하세요. 체크아웃+24시간 후 승인 시 출금 가능 금액에 반영됩니다. · 요청 {{req}} · 대기 {{pend}} · 완료 {{appr}} · 보류 {{held}}',
    adminSettlementsBadgeContractEnded: '계약종료 후 유입',
    adminContractsPageTitle: '계약',
    adminContractsIntroLine:
      '체결 → 시작(숙박 중) → 종료(체크아웃 이후) · 체결 {{sealed}} · 시작 {{inProgress}} · 종료 {{completed}}',
    adminContractsTabNew: '신규',
    adminContractsTabSealed: '계약체결',
    adminContractsTabInProgress: '계약시작',
    adminContractsTabCompleted: '계약종료',
    adminContractsSearchPlaceholder: '이메일, UID, 예약·매물명, 금액…',
    adminContractsSearchHint:
      '선택한 탭(신규·계약체결·계약시작·계약종료) 안에서만 검색됩니다.',
    adminRefundsPageTitle: '환불',
    adminRefundsIntroLine:
      '취소되었고 결제완료 상태인 건의 환불을 승인합니다. · 계약전 {{pre}} · 진행중 {{during}}',
    adminRefundsTabNew: '신규',
    adminRefundsTabAll: '전체',
    adminRefundsTabPre: '계약전 환불',
    adminRefundsTabDuring: '계약진행중 환불',
    adminRefundsSearchPlaceholder: '이메일, UID, 예약·매물명, 금액…',
    adminRefundsSearchHint: '선택한 탭 안에서만 검색됩니다.',
    adminRefundsApproveButton: '환불 승인',
    adminWithdrawalsPageTitle: '출금 요청 승인',
    adminWithdrawalsIntroLine:
      '카테고리별로 확인하세요. · 대기 {{pending}} · 처리 {{processing}} · 반려 {{rejected}} · 완료 {{completed}} · 보류 {{held}}',
    adminWithdrawalsTabPending: '승인 대기',
    adminWithdrawalsTabProcessing: '처리 중',
    adminWithdrawalsTabRejected: '반려',
    adminWithdrawalsTabCompleted: '완료',
    adminWithdrawalsTabHeld: '보류',
    adminWithdrawalsSearchPlaceholder: '이메일, UID, 계좌 라벨, 금액…',
    adminWithdrawalsSearchHint:
      '선택한 탭(승인 대기·처리 중·반려·완료·보류) 안에서만 검색됩니다.',
    adminWithdrawalApprove: '승인',
    adminWithdrawalReject: '반려',
    adminWithdrawalHold: '보류',
    adminWithdrawalComplete: '완료',
    adminWithdrawalResume: '재개',
    adminWithdrawalBadgeCompleted: '완료',
    adminWithdrawalBadgeRejected: '반려',
    adminWithdrawalRejectReason: '관리자 반려',
    adminWithdrawalHoldReason: '관리자 보류',
    csvKycColFullName: '성함',
    csvKycColPhone: '연락처',
    csvKycColIdType: '신분증종류',
    csvKycColIdNumber: '번호',
    csvKycColDateOfBirth: '생년월일',
    csvKycColIdFrontUrl: '신분증사진URL(앞면)',
    csvKycColIdBackUrl: '신분증사진URL(뒷면)',
    csvKycColFaceUrl: '얼굴사진URL',
    csvKycColSubmittedAt: '신청일시',
    csvKycColVerificationStatus: '인증상태',
    adminKycCsvDownloadError: 'CSV 다운로드 중 오류가 발생했습니다.',
    adminSettlementsSearchHint:
      '선택한 탭(승인 요청·승인 대기·승인 완료·보류) 안에서만 검색됩니다.',
    adminSettlementsFilterLabel: '필터',
    adminSettlementsFilterTitle24hBaseline:
      '기준 시점: 체크아웃 종료 후 24시간. 세 옵션 중 하나만 선택됩니다.',
    adminSettlementsSortRemainingAscTitle: '마감이 빠른 순(남은 시간 오름차순·초과 건 우선)',
    adminSettlementsSortRemainingDescTitle: '마감이 늦은 순(남은 시간 내림차순)',
    adminSettlementsFilterElapsed24hTitle:
      '체크아웃 종료+24시간이 지난 건만 보기(남은 시간 ↑·↓와 동시 선택 불가)',
    adminSettlementsSortRemainingAsc: '남은 시간 ↑',
    adminSettlementsSortRemainingDesc: '남은 시간 ↓',
    adminSettlementsFilterElapsed24h: '24시 경과',
    adminSettlementActionMoveToPending: '승인 대기로',
    adminSettlementResumeToRequest: '복구(승인요청)',
    adminSettlementResumeToPending: '복구(승인대기)',
    adminAuditPageTitle: '감사 로그',
    adminAuditPageIntro: '금전 · 운영 조치 · 처리자·시각별 탭 구분',
    adminAuditSearchPlaceholder: '조치, owner/ref, 비고, 처리자…',
    adminAuditSearchHint: '선택한 탭 범위 안에서만 검색됩니다.',
    adminAuditEmpty: '이 탭·검색에 맞는 로그가 없습니다.',
    adminAuditColAction: '조치',
    adminAuditColAmount: '금액',
    adminAuditColOwnerTarget: 'owner / 대상',
    adminAuditColRef: 'ref',
    adminAuditColActor: '처리자',
    adminAuditColNote: '비고',
    adminAuditColTime: '시각',
    adminAuditAmountDash: '금액 —',
    adminAuditMobileTarget: '대상:',
    adminAuditMobileActor: '처리:',
    adminAuditTabNew: '신규',
    adminAuditTabAll: '전체',
    adminAuditTabSettlement: '정산',
    adminAuditTabWithdrawal: '출금',
    adminAuditTabRefund: '환불',
    adminAuditTabAccount: '계정',
    adminAuditTabProperty: '매물',
    adminAuditLedgerSettlementApproved: '정산 승인',
    adminAuditLedgerSettlementHeld: '정산 보류',
    adminAuditLedgerSettlementResumed: '정산 재개(승인 유지)',
    adminAuditLedgerSettlementRevertedPending: '정산 복구 → 승인 대기',
    adminAuditLedgerSettlementRevertedRequest: '정산 복구 → 승인 요청',
    adminAuditLedgerWithdrawalRequested: '출금 요청',
    adminAuditLedgerWithdrawalProcessing: '출금 승인(처리 중)',
    adminAuditLedgerWithdrawalHeld: '출금 보류',
    adminAuditLedgerWithdrawalResumed: '출금 재개',
    adminAuditLedgerWithdrawalCompleted: '출금 완료',
    adminAuditLedgerWithdrawalRejectedRefund: '출금 반려·환원',
    adminAuditLedgerRefundApproved: '환불 승인',
    adminAuditModUserBlocked: '계정 차단',
    adminAuditModUserRestored: '계정 복구',
    adminAuditModPropertyHidden: '매물 숨김',
    adminAuditModPropertyRestored: '매물 복구',
    adminAuditModPropertyAdEndedByHost: '매물 광고종료(호스트)',
    adminAuditModPropertyDeletedByHost: '매물 삭제(호스트)',
    adminUiBadPath: '잘못된 경로입니다.',
    adminUiLoadingEllipsis: '불러오는 중…',
    adminUiNoQueryResults: '조회 결과가 없습니다.',
    adminPaginationPrev: '이전',
    adminPaginationNext: '다음',
    adminPaginationLine: '{{page}} / {{total}} · {{count}}건',
    adminFilterNew: '신규',
    adminFilterAll: '전체',
    adminUserFilterActive: '정상',
    adminUserFilterBlocked: '차단',
    adminUsersTitle: '계정 관리',
    adminUsersIntroLine:
      '신규 = 가입 24h 이내(행 클릭 시 확인 · 확인 당일만 목록 유지, 자정 이후 제외) · 신규 {{nNew}} · 전체 {{nAll}} · 정상 {{nActive}} · 차단 {{nBlocked}}',
    adminUsersSearchPlaceholder: 'uid / email / 이름 검색',
    adminUsersSearchHint: '선택한 탭(신규·전체·정상·차단) 안에서만 검색됩니다.',
    adminColAlert: '알림',
    adminColName: '이름',
    adminColEmail: '이메일',
    adminColPhone: '전화번호',
    adminColUid: 'UID',
    adminColStatus: '상태',
    adminColActions: '작업',
    adminPingTitleUnseen: '미확인 알림',
    adminPingTitleAck: '미확인',
    adminAriaUnseenNewUser: '미확인 신규 계정',
    adminAriaAckNewUser: '확인한 신규 계정',
    adminDotUnseen: '미확인',
    adminDotAcked: '확인함',
    adminStatusNormal: '정상',
    adminStatusBlocked: '차단',
    adminActionRestore: '복구',
    adminActionBlock: '차단',
    adminPropertiesTitle: '매물 관리',
    adminPropertiesIntroLine:
      '부모 매물만 표시 · 신규 = 미확인은 확인 전까지 유지(수정 후에도 동일) · 확인한 뒤엔 그날만 목록(자정 이후 제외) · 최신순 · 전체 {{nAll}} · 신규 {{nNew}} · 노출(고객) {{nListed}} · 광고종료 {{nPaused}} · 숨김 {{nHidden}}',
    adminPropFilterListed: '노출',
    adminPropFilterPaused: '광고종료',
    adminPropFilterHidden: '숨김',
    adminPropertiesSearchPlaceholder: 'id / 제목 / owner(UID·이메일) / 주소 검색',
    adminPropertiesSearchHint: '선택한 탭 안에서 검색됩니다. 노출 = 7일 예약 가능·고객 화면과 동일.',
    adminPropColTitle: '제목',
    adminPropColAddress: '주소',
    adminPropColOwner: 'Owner',
    adminPropColId: 'ID',
    adminListingHidden: '숨김',
    adminListingAdPaused: '광고종료',
    adminListingLive: '고객 노출',
    adminPropUnhide: '복구',
    adminPropHide: '숨김',
    adminAriaUnseenNewProperty: '미확인 신규 매물',
    adminAriaAckNewProperty: '확인한 신규 매물',
    adminPropertiesHiddenReasonLabel: '숨김 사유(고정):',
    adminNotFoundUser: '계정을 찾을 수 없습니다.',
    adminBackToUsersList: '계정 목록으로',
    adminNotFoundProperty: '매물을 찾을 수 없습니다.',
    adminBackToPropertiesList: '매물 목록으로',
    adminUserDetailBack: '뒤로가기',
    adminNoDisplayName: '이름 없음',
    adminUserBadgeSuspended: '일시 정지(차단)',
    adminUserBadgeActive: '활성',
    adminLabelHostMemo: '호스트용 메모',
    adminLabelGuestMemo: '게스트용 메모',
    adminMemoEmpty: '메모 없음',
    adminMemoPlaceholderHost: '호스트 상담·처리 메모',
    adminMemoPlaceholderGuest: '게스트 상담·처리 메모',
    adminMemoNewestFirst: '최신 메모가 맨 앞에 표시됩니다.',
    adminUserUnblock: '차단 해제',
    adminUserBlockAccount: '계정 차단',
    adminSectionProfileStatus: '가입 정보 · 상태',
    adminSectionHost: '호스트 (임대인)',
    adminSectionGuest: '게스트 (임차인)',
    adminLabelKyc: '본인 인증(KYC)',
    adminUserJoinedAt: '가입일',
    adminUserStatHostBookingsTotal: '예약 건수(전체)',
    adminUserStatInProgress: '진행 중',
    adminUserStatCompleted: '완료',
    adminUserStatCancelled: '취소',
    adminUserBalanceTitle: '현재 잔고 현황',
    adminUserBalanceAvailable: '출금 가능',
    adminUserBalanceApprovedRevenue: '승인 매출 합계',
    adminUserBalancePendingWithdraw: '출금 처리 중·보류',
    adminUserGuestCurrentRes: '현재 예약',
    adminUserGuestDepositPending: '입금 대기',
    adminUserGuestContractDone: '계약 완료',
    adminUserRefundsHeading: '환불 관련 예약',
    adminUserRefundsEmpty: '해당 내역이 없습니다.',
    adminUserRefundsColBookingId: '예약 ID',
    adminUserRefundsColProperty: '매물',
    adminUserRefundsColAmount: '금액',
    adminUserRefundsColPayment: '결제',
    adminUserRefundsColRefund: '환불 처리',
    adminRefundStatusDone: '환불 완료',
    adminRefundStatusAdminOk: '관리자 승인됨',
    adminRefundStatusPending: '승인 대기',
    adminPropertyDetailBackList: '매물 목록',
    adminPropertyNoTitle: '제목 없음',
    adminPropertyAdminMemo: '관리자 메모',
    adminPropertyMemoPlaceholder: '매물 관련 관리자 메모',
    adminPropertyViewHost: '호스트 계정 보기',
    adminPropertyUnhide: '숨김 해제',
    adminPropertyHide: '숨김',
    adminSectionHostId: '호스트 · 식별',
    adminLabelOwnerId: 'Owner ID',
    adminLabelDisplayName: '표시명',
    adminSectionPriceAreaGuests: '가격 · 면적 · 인원',
    adminLabelWeeklyRent: '주간 요금',
    adminLabelAreaSqm: '면적',
    adminLabelBedBath: '방·욕실',
    adminLabelBedroomsBathrooms: '침실 {{bed}} · 욕실 {{bath}}',
    adminLabelMaxGuests: '최대 인원',
    adminLabelAdultsChildren: '성인 {{adults}} · 어린이 {{children}}',
    adminSectionLocation: '위치',
    adminLabelAddress: '주소',
    adminLabelUnitNumber: '동·호수',
    adminLabelCityDistrictIds: 'city / district',
    adminLabelCoordinates: '좌표',
    adminSectionDescription: '설명',
    adminPropertyDescOriginalVi: '베트남어 원문',
    adminPropertyDescTranslatedKo: '번역(한국어)',
    adminSectionPhotos: '사진',
    adminPropertyNoImages: '등록된 이미지 없음',
    adminSectionAmenitiesType: '편의시설 · 유형',
    adminLabelPropertyType: '유형',
    adminLabelCleaningPerWeek: '주간 청소',
    adminSectionPets: '반려동물',
    adminLabelPetAllowed: '허용',
    adminLabelYes: '예',
    adminLabelNo: '아니오',
    adminLabelPetFeePerPet: '추가 요금(VND/마리)',
    adminLabelMaxPets: '최대 마리',
    adminSectionSchedule: '일정 · 체크인',
    adminLabelRentStart: '임대 희망 시작',
    adminLabelRentEnd: '임대 희망 종료',
    adminLabelCheckInTime: '체크인 시간',
    adminLabelCheckOutTime: '체크아웃 시간',
    adminSectionIcal: '외부 캘린더(iCal)',
    adminLabelIcalPlatform: '플랫폼',
    adminLabelIcalCalendarName: '캘린더 이름',
    adminLabelUrl: 'URL',
    adminSectionChangeHistory: '변경 이력',
    adminPropertyMetaCreated: '생성',
    adminPropertyMetaUpdated: '수정',
    adminPropertyDeletedFlag: '호스트 삭제 플래그: deleted',
    adminSystemLogTitle: '시스템 로그',
    adminSystemLogChecklist:
      '5분 점검 체크리스트: ① 최근 5xx/권한 오류(401/403) 급증 확인 ② 결제·예약 쓰기 실패 여부 확인 ③ KYC 실패 로그(전화/신분증/얼굴/역할 갱신) 확인 ④ 같은 메시지 반복 발생 여부 확인 ⑤ 필요 시 bookingId/ownerId로 상세 화면 추적.',
    adminSystemLogFilterNew: '신규',
    adminSystemLogFilterAll: '전체',
    adminSystemLogFilterError: '오류',
    adminSystemLogFilterWarning: '경고',
    adminSystemLogFilterInfo: '정보',
    adminSystemLogExportCsv: 'CSV 내보내기',
    adminSystemLogClearEphemeral: '휘발 로그 비우기',
    adminSystemLogClearPersistent: '영구 로그 초기화',
    adminSystemLogCountLine: '표시 {{shown}}건 · 페이지 {{page}}/{{pages}}',
    adminSystemLogColTime: '시간',
    adminSystemLogColSeverity: '심각도',
    adminSystemLogColCategory: '분류',
    adminSystemLogColMessage: '메시지',
    adminSystemLogColBookingId: 'bookingId',
    adminSystemLogColOwnerId: 'ownerId',
    adminSystemLogColSnapshot: '스냅샷',
    adminSystemLogColCopy: '복사',
    adminSystemLogEmpty: '표시할 로그가 없습니다.',
    adminSystemLogLinkSettlements: '정산',
    adminSystemLogSettlementsSearchHint: '정산 화면에서 검색창에 ID를 붙여 넣어 검색하세요',
    adminSystemLogCopyRowTitle: '행 복사',
    adminSystemLogFooterNote:
      '예약 ID는 정산·계약 등 화면 상단 검색에 붙여 넣어 찾을 수 있습니다. 분석이 필요하면 CSV를 복사해 AI에 질문하세요(민감 정보는 넣지 마세요).',
    adminPropertyLogsTitle: '매물 삭제·취소 이력',
    adminPropertyLogsIntro: '서버 DB 원장 — 영구 삭제(DELETED) 및 예약 취소 시 매물 기록(CANCELLED)',
    adminPropertyLogsTabAll: '전체',
    adminPropertyLogsTabDeleted: '영구 삭제',
    adminPropertyLogsTabCancelled: '예약 취소',
    adminPropertyLogsColTime: '시각',
    adminPropertyLogsColType: '유형',
    adminPropertyLogsColPropertyId: 'propertyId',
    adminPropertyLogsColOwnerId: 'ownerId',
    adminPropertyLogsColRecorder: '기록자',
    adminPropertyLogsColReservation: 'reservation',
    adminPropertyLogsColNote: '비고',
    adminPropertyLogsEmpty: '기록이 없습니다.',
    adminAccountsTitle: '관리자 계정',
    adminAccountsIntro: '슈퍼만 접근 · 계정 클릭 후 아이디·닉네임·비밀번호·권한 수정',
    adminAccountsNewButton: '새 관리자',
    adminAccountsFormNewTitle: '새 계정',
    adminAccountsLabelUsername: '아이디',
    adminAccountsLabelNickname: '닉네임',
    adminAccountsNicknamePlaceholder: '표시 이름',
    adminAccountsPasswordMin: '비밀번호 (8자 이상)',
    adminAccountsCreateSuper: '슈퍼 관리자로 생성',
    adminAccountsCreateSubmit: '생성',
    adminAccountsListTitle: '계정 목록',
    adminAccountsRoleSuper: '슈퍼',
    adminAccountsRoleNormal: '일반',
    adminAccountsSelectPrompt: '왼쪽에서 계정을 클릭하세요.',
    adminAccountsProfileToggle: '계정 정보',
    adminAccountsProfileExpand: '펼치기',
    adminAccountsProfileCollapse: '접기',
    adminAccountsProfileNote: '아이디·닉네임·비밀번호는 슈퍼만 이 화면에서 수정합니다.',
    adminAccountsEditNickname: '닉네임',
    adminAccountsEditUsername: '아이디',
    adminAccountsEditNewPassword: '새 비밀번호 (비우면 유지)',
    adminAccountsEditCurrentPassword: '현재 비밀번호',
    adminAccountsSaveProfile: '계정 정보 저장',
    adminAccountsSaving: '저장 중…',
    adminAccountsRolesHeading: '역할·권한',
    adminAccountsSuperAllMenus: '슈퍼는 모든 메뉴에 접근합니다.',
    adminAccountsDemoteSuper: '일반 관리자로 변경',
    adminAccountsSuperCheckbox: '슈퍼 관리자',
    adminAccountsPermHint: '체크된 메뉴만 상단 내비에 표시됩니다.',
    adminAccountsSavePerms: '권한만 저장',
    adminAccountsSelfPermNote: '본인 계정의 메뉴 권한은 여기서 수정하지 않습니다.',
    adminNavDashboard: '대시보드',
    adminNavUsers: '계정',
    adminNavProperties: '매물',
    adminNavPropertyLogs: '매물 이력',
    adminNavContracts: '계약',
    adminNavSettlements: '정산',
    adminNavRefunds: '환불',
    adminNavWithdrawals: '출금',
    adminNavAudit: '감사',
    adminNavKyc: 'KYC',
    adminNavSystemLog: '시스템 로그',
    adminHomeTitle: '관리자 대시보드',
    adminHomeSubtitle:
      '아래 메뉴 또는 상단 바에서 업무 화면으로 이동할 수 있습니다.',
    adminNavMenuAriaLabel: '관리자 메뉴',
    adminNavBadgeAria: '알림 {{count}}건',
    adminNavDescUsers: '차단·복구 및 검색',
    adminNavDescProperties: '숨김·복구',
    adminNavDescPropertyLogs: '삭제·취소 서버 로그',
    adminNavDescContracts: '체결·임대 시작 예약',
    adminNavDescSettlements: '출금 가능 반영 승인',
    adminNavDescRefunds: '취소 환불 승인',
    adminNavDescWithdrawals: '출금 요청 처리',
    adminNavDescAudit: '금전·조치 로그',
    adminNavDescKyc: '본인확인·검수',
    adminNavDescSystemLog: '클라이언트 오류·경고·휘발 정보',
    adminLoginTitle: '관리자 로그인',
    adminLoginSubtitle: '500 STAY Admin · PC 전용',
    adminLoginUsernameLabel: '아이디',
    adminLoginPasswordLabel: '비밀번호',
    adminLoginSubmit: '로그인',
    adminLoginError:
      '관리자 아이디 또는 비밀번호가 올바르지 않습니다. (DB 미연결 시 서버 로그 확인)',
    adminLoginBootstrapNote:
      '최초 1회: ADMIN_BOOTSTRAP_* 또는 NEXT_PUBLIC_ADMIN_* 와 동일 계정으로 로그인 시 슈퍼 관리자가 DB에 생성됩니다.',
    adminLoginHomeLink: '서비스 홈으로',
    adminNoAccessTitle: '접근 가능한 메뉴가 없습니다',
    adminNoAccessBodyWithUser:
      '계정 {{username}} 에 부여된 권한이 없습니다. 슈퍼 관리자에게 메뉴 권한을 요청하세요.',
    adminNoAccessBodyGeneric: '슈퍼 관리자에게 메뉴 권한을 요청하세요.',
    adminNoAccessLogout: '로그아웃 후 다른 계정으로 로그인',
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
    dateBadgeRangeTemplate: '{{start}} ~ {{end}}',
    dateBadgeFromTemplate: '{{date}}부터',
    searchButton: '검색하기',
    noResultsFound: '검색 결과가 없습니다.',
    propertiesFound: '개의 매물을 찾았습니다.',
    minExceedsMaxError: '최저값은 최대값을 초과할 수 없습니다. 수정해 주세요.',
    maxBelowMinError: '최대값은 최저값보다 낮을 수 없습니다. 수정해 주세요.',
    searchFilterPriceRangeLabel: '가격 범위',
    searchFilterFacilityPickHeading: '시설 선택',
    searchPriceRangeDragHint: '드래그하여 가격 범위를 조정하세요',
    searchRentPerWeekFragment: '주당',
    chatSendingMessage: '메시지 전송 중...',
    chatInputInProgressStatus: '입력 중...',
    signupErrorRequiredFields: '모든 필수 항목을 입력해 주세요.',
    signupErrorInvalidEmailFormat: '올바른 이메일 형식을 입력해 주세요.',
    signupErrorPasswordMismatch: '비밀번호가 일치하지 않습니다.',
    signupErrorPasswordMinLength: '비밀번호는 최소 6자 이상이어야 합니다.',
    signupErrorPhoneVerificationRequired: '전화번호 인증을 완료해 주세요.',
    signupErrorOtpSendFailed: '인증번호를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
    signupErrorOtpSendSystem: '인증번호 발송 중 오류가 발생했습니다.',
    signupErrorOtpInvalidCode: '인증번호가 올바르지 않습니다.',
    signupErrorOtpVerifyFailed: '인증 처리 중 오류가 발생했습니다.',
    signupErrorFailedGeneric: '회원가입에 실패했습니다.',
    signupErrorUnexpected: '예기치 않은 오류가 발생했습니다.',
    signupErrorSocialLoginFailed: '소셜 로그인에 실패했습니다.',
    uiTranslateButtonLoading: '번역 중...',
    uiTranslateViewOriginal: '원문 보기',
    uiTranslateShowTranslation: '번역하기',
    // 이메일(Resend/Nodemailer 등): 제목·본문의 {{placeholder}} 는 발송 전 서버에서 치환.
    emailWelcomeTitle: '[500 STAY VN] 가입을 환영합니다',
    emailWelcomeBody:
      '안녕하세요, {{name}}님.\n\n500 STAY VN(숙박·단기 임대 정보 제공 플랫폼)에 가입해 주셔서 감사합니다.\n숙소 검색·예약과 호스트 연락은 앱에서 이용해 주세요.\n\n본 메일은 발신 전용입니다.',
    emailBookingConfirmedGuestTitle: '[500 STAY VN] 예약이 확정되었습니다',
    emailBookingConfirmedGuestBody:
      '안녕하세요, {{guestName}}님.\n\n예약이 확정되었습니다.\n예약 번호: {{bookingId}}\n숙소: {{propertyTitle}}\n체크인: {{checkIn}} / 체크아웃: {{checkOut}}\n\n상세 내역은 앱의 예약 메뉴에서 확인할 수 있습니다.',
    emailBookingConfirmedHostTitle: '[500 STAY VN] 새 예약이 확정되었습니다',
    emailBookingConfirmedHostBody:
      '안녕하세요, {{hostName}}님.\n\n게스트 {{guestName}}님의 예약이 확정되었습니다.\n예약 번호: {{bookingId}}\n숙소: {{propertyTitle}}\n체크인: {{checkIn}} / 체크아웃: {{checkOut}}\n\n앱에서 일정과 메시지를 확인해 주세요.',
    emailBookingCancelledGuestTitle: '[500 STAY VN] 예약이 취소되었습니다',
    emailBookingCancelledGuestBody:
      '안녕하세요, {{guestName}}님.\n\n다음 예약이 취소 처리되었습니다.\n예약 번호: {{bookingId}}\n숙소: {{propertyTitle}}\n\n문의 사항은 앱 내 고객 지원을 이용해 주세요.',
    emailOtpCodeTitle: '[500 STAY VN] 인증번호 안내',
    emailOtpCodeBody:
      '인증번호: {{code}}\n\n위 코드는 {{minutes}}분간 유효합니다.\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.',
    emailPasswordResetTitle: '[500 STAY VN] 비밀번호 재설정',
    emailPasswordResetBody:
      '비밀번호를 재설정하려면 아래 링크를 클릭하세요.\n{{resetLink}}\n\n링크는 {{hours}}시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.',
    emailVerifyEmailTitle: '[500 STAY VN] 이메일 주소 확인',
    emailVerifyEmailBody:
      '이메일 인증을 완료하려면 아래 링크를 클릭하세요.\n{{verifyLink}}\n\n본인이 가입하지 않았다면 이 메일을 무시해 주세요.',
    emailHostNewBookingRequestTitle: '[500 STAY VN] 새 예약 요청이 있습니다',
    emailHostNewBookingRequestBody:
      '안녕하세요, {{hostName}}님.\n\n{{guestName}}님이 예약을 요청했습니다.\n숙소: {{propertyTitle}}\n희망 체크인: {{checkIn}} / 체크아웃: {{checkOut}}\n\n앱에서 수락 또는 거절을 진행해 주세요.',
    emailPayoutProcessedTitle: '[500 STAY VN] 정산 지급 안내',
    emailPayoutProcessedBody:
      '안녕하세요, {{name}}님.\n\n요청하신 정산이 처리되었습니다.\n금액: {{amount}} {{currency}}\n\n자세한 내용은 앱의 정산 메뉴에서 확인할 수 있습니다.',
    emailGenericFooterNotice:
      '500 STAY VN은 숙박·단기 임대 관련 정보와 연락 도구를 제공하는 플랫폼입니다. 이용자 간 계약의 당사자는 아닙니다.',
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
    incomeStatusRevenueConfirmed: '수익확정됨',
    incomeStatusSettlementRequest: '승인 요청 중',
    incomeStatusSettlementPending: '승인 대기 중',
    incomeStatusSettlementApproved: '정산됨',
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
    fullNamePlaceholder: '실명을 입력하세요',
    signupOtpVerify: '인증',
    phoneVerificationComplete: '전화번호 인증 완료',
    confirmPasswordLabel: '비밀번호 확인',
    confirmPasswordPlaceholder: '비밀번호를 다시 입력하세요',
    otpCodePlaceholder: '6자리 인증번호',
    deleteAccountTitle: '계정 삭제 안내',
    deleteAccountIntro: '계정 삭제를 원하시면 아래 이메일로 문의해주세요.',
    deleteAccountFooterNote:
      '문의 시 계정 정보와 삭제 사유를 함께 알려주시면 빠른 처리에 도움이 됩니다.',
    legalFooterTerms: '이용약관',
    legalFooterPrivacy: '개인정보처리방침',
    legalFooterDeleteAccount: '계정 삭제',
    legalFooterNavAriaLabel: '약관 및 정책',
    toastHeadingSuccess: '완료',
    toastHeadingInfo: '안내',
    propertyNotFound: '매물을 찾을 수 없습니다.',
    bookPropertyTitle: '예약하기',
    nightShort: '박',
    bookingDatesLoadError: '날짜 정보를 불러올 수 없습니다',
    guestInfoSectionTitle: '예약자 정보',
    bookingGuestNamePlaceholder: '이름',
    agreeTermsPrivacyBooking: '약관 및 개인정보 수집 동의 (필수)',
    proceedToPaymentStep: '결제 단계로 이동',
    selectPaymentMethod: '결제 수단 선택',
    priceBreakdown: '요금 내역',
    perWeekSlash: ' (주당)',
    petsShort: '애완동물',
    petCountClassifier: '마리',
    perPetPerWeekSlash: ' (마리당/주)',
    bookingServiceFee: '예약 수수료',
    totalAmountLabel: '총액',
    agreePaymentTermsCheckbox: '약관 및 결제 조건에 동의합니다. (필수)',
    payNow: '결제하기',
    processingInProgress: '처리 중...',
    bookingDetailTitle: '예약 상세 내역',
    paymentCompleteTitle: '결제가 완료되었습니다!',
    waitingHostApproval: '임대인의 승인을 기다리고 있습니다.',
    notifyWhenApprovedShort: '승인이 완료되면 알림을 보내드립니다.',
    bookingSuccessGotIt: '확인',
    bookingNumberLabel: '예약 번호',
    copyButton: '복사',
    copiedButton: '복사됨',
    bookingBadgeConfirmed: '확정됨',
    bookingBadgeCancelled: '취소됨',
    bookingBadgePending: '승인 대기 중',
    propertyInfoHeading: '숙소 정보',
    bookingDetailSectionTitle: '상세 예약 정보',
    bookerFieldLabel: '예약자',
    phoneFieldLabel: '연락처',
    stayNightsUnit: '박',
    specialRequestsHeading: '요청사항',
    weeklyPriceShort: '주당 가격',
    petFeeShortLabel: '마리당',
    totalPaymentHeading: '총 결제 금액',
    paymentStatusPaidLabel: '결제 완료',
    paymentStatusPendingLabel: '결제 대기',
    backToHomeButton: '홈으로 돌아가기',
    viewBookingsHistoryButton: '예약 내역 확인',
    bookingSuccessLoadFailed:
      '예약 정보를 불러오지 못했습니다. 목록에서 다시 확인해 주세요.',
    bookingSuccessBookingIdMissing: '예약 번호가 없습니다.',
    bookingSuccessCopyOk: '예약 번호가 클립보드에 복사되었습니다.',
    bookingSuccessCopyFail:
      '복사에 실패했습니다. 번호를 직접 선택해 복사해 주세요.',
    priceUnitVndSuffix: 'VND',
    reservationCancelRelistMerged:
      '취소된 기간이 기존 광고 중인 매물과 병합되었습니다. 매물 개수가 유지됩니다.',
    reservationCancelRelistRelisted: '예약이 취소되어 매물이 다시 광고 중입니다.',
    reservationCancelRelistLimitExceeded:
      '예약이 취소되어 광고대기 탭에서 다시 등록해 주세요.',
    reservationCancelRelistShortTerm:
      '예약이 취소되어 광고대기 탭으로 이동되었습니다. 펜(수정)으로 기간을 맞춘 뒤 다시 올리세요.',
    reservationStatusUpdateError: '예약 상태 업데이트 중 오류가 발생했습니다.',
    hostReservationRecordDeleteConfirm: '기록을 영구적으로 삭제하시겠습니까?',
    hostReservationRecordDeleteError: '기록 삭제 중 오류가 발생했습니다.',
    hostReservationLabelCompleted: '예약 완료',
    paymentMethodLabelMomo: 'MoMo',
    paymentMethodLabelZalopay: 'ZaloPay',
    paymentMethodLabelBankTransfer: '계좌이체',
    paymentMethodLabelPayAtProperty: '현장 결제',
    bookingDetailsPaymentHeading: '결제 정보',
    bookingDetailsPayMethodRowLabel: '결제 수단',
    bookingDetailsAccommodationLine: '숙박 요금',
    bookingDetailsFeesVatLine: '수수료 및 부가세',
    bookingDetailsTotalRow: '합계',
    bookingWeeksUnit: '주',
    hostBookingCardStatusPending: '예약 요청',
    hostBookingCardStatusConfirmed: '예약 확정',
    hostBookingCardStatusRequestCancelled: '요청 취소',
    hostBookingCardStatusBookingCancelled: '예약 취소',
    myPropertiesPendingEndAdTitle: '광고종료로 이동',
    myPropertiesPendingEndAdDesc:
      '이 매물을 광고종료 탭으로 옮깁니다. 데이터는 유지됩니다.',
    myPropertiesDuplicateLiveTitle: '동일 매물이 광고중입니다',
    myPropertiesDuplicateLiveHint:
      '예: 위 광고중 매물의 수정 화면으로 이동합니다. 임대 날짜는 달력에서 직접 확인·수정해야 합니다. 아니오: 이 목록에 그대로 있습니다(중복 편집 방지).',
    dialogNo: '아니오',
    dialogYes: '예',
    hostCancelModalTitle: '취소 확인',
    hostCancelModalAckLabel: '내용을 확인했습니다.',
    hostBookingConfirmToastOk: '예약이 확정되었습니다.',
    hostBookingConfirmToastErr: '예약 확정에 실패했습니다.',
    hostBookingChatOpenErr: '채팅방을 열 수 없습니다.',
    hostBookingRejectToastListingOk: '매물 상태가 업데이트되었습니다.',
    hostBookingRejectToastErr: '거절 처리에 실패했습니다.',
    hostBookingDeleteConfirm: '이 예약을 삭제할까요?',
    hostBookingDeleteOk: '예약이 삭제되었습니다.',
    hostBookingDeleteErr: '삭제에 실패했습니다.',
    hostBookingCancelReasonByOwner: '임대인이 거절/취소함',
    reservationServerTimeDetail: '서버 시간을 확인할 수 없어 예약 상태를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    hostManageBookedPropertiesTitle: '예약된 매물 관리',
    hostTabBookedProperties: '예약된 매물',
    hostTabCompletedReservations: '예약완료된 매물',
    emptyNoActiveReservations: '예약된 매물이 없습니다.',
    emptyNoCompletedReservations: '예약완료된 매물이 없습니다.',
    tenantInfoHeading: '임차인 정보',
    confirmReservationBtn: '예약 확정',
    markStayCompletedBtn: '예약 완료 처리',
    deleteHistoryRecordTitle: '기록 삭제',
    hostApproveBooking: '승인',
    cancelPolicyAgreeRequired: '취소 정책에 동의해 주세요.',
    bookingCancelledToast: '예약이 취소되었습니다.',
    bookingCancelFailed: '취소 처리에 실패했습니다.',
    confirmDeleteBookingRecord: '이 예약 기록을 삭제할까요?',
    bookingDeletedToast: '삭제되었습니다.',
    bookingDeleteFailed: '삭제에 실패했습니다.',
    checkInOutScheduleTitle: '체크인/체크아웃 시간',
    importExternalCalendar: '외부 캘린더 가져오기',
    calendarPlatformLabel: '플랫폼',
    calendarOptionNone: '선택 안 함',
    calendarOptionOther: '기타',
    calendarNameLabel: '캘린더 이름',
    calendarNamePlaceholderExample: '예: 에어비앤비 예약',
    removeAddressAriaLabel: '주소 삭제',
    backNavLabel: '뒤로가기',
    kycFirebasePhoneTitle: 'Firebase 전화번호 인증',
    kycFirebasePhoneSubtitle: 'Google Firebase를 통한 안전한 전화번호 인증',
    kycPhoneVerificationHeading: '전화번호 인증',
    kycPhoneVerificationForHostDesc: '임대인 인증을 위해 전화번호를 인증해주세요',
    kycPhoneVerifiedLong: '✅ 전화번호 인증이 완료되었습니다.',
    kycNextStep: '다음 단계로',
    kycTestModeProceed: '테스트 모드로 진행',
    calWarnTitleOwner: '기간 설정 불가',
    calWarnTitleGuest: '예약 불가',
    calWarnMinSevenBody: '최소 7일 단위로만 예약이 가능합니다. 선택한 날짜부터 임대 종료일까지 7일 미만이므로 다른 날짜를 선택해주세요.',
    calSelectRentalStart: '임대 시작일 선택',
    calSelectRentalEnd: '임대 종료일 선택',
    calSelectCheckIn: '체크인 날짜 선택',
    calSelectCheckOut: '체크아웃 날짜 선택',
    calOwnerLegendSelectableStart: '임대 시작일로 선택 가능',
    calOwnerLegendSelectedStart: '선택된 시작일',
    calOwnerLegendEndHint: '임대 종료일 (7일 단위, 최대 약 3개월)',
    calOwnerLegendWithinPeriod: '임대 기간 중 (클릭 시 새 시작일로 변경)',
    calOwnerLegendOtherDates: '그 외 날짜 (클릭 시 새 시작일로 변경)',
    calOwnerSelectStartFirst: '임대 시작일을 먼저 선택해주세요',
    calGuestLegendAvailable: '선택 가능한 날짜',
    calGuestLegendMinSeven: '최소 7박 이상, 막힌 날 제외(체크아웃 날짜 자유)',
    calGuestLegendBooked: '이미 예약됨 / 예약 불가',
    calGuestLegendCheckoutOk: '기존 예약 체크아웃 (체크인 가능)',
    calGuestLegendCheckoutDayAbbr: '퇴',
    calGuestLegendShortStayDemoDay: '31',
    calGuestLegendShortStay: '가용 기간 7일 미만 (체크인 불가)',
    calGuestLegendCheckinToEnd: '체크인 기준 매물 종료일까지(또는 상한)',
    calGuestLegendValidCheckout: '체크아웃 가능 (7박 이상·예약 안 겹침)',
    calGuestSelectCheckInFirst: '체크인 날짜를 먼저 선택해주세요',
    weeklyCostLabel: '주당 비용',
    bookingOccupancyLabel: '이용 인원',
    importExternalCalendarHelp:
      '에어비앤비·아고다 등 예약을 500stay와 동기화합니다. iCal URL(.ics)을 입력하세요.',
    carouselPrevious: '이전',
    carouselNext: '다음',
    translationConsentTitle: '번역을 사용하시겠습니까?',
    translationConsentDescription:
      '번역 기능을 쓰려면 동의가 필요합니다. 기기 내장 엔진을 사용하면 오프라인에서도 동작할 수 있습니다.',
    translationConsentAgree: '동의하고 계속하기',
    translationConsentDecline: '거절',
    translationLangPackTitle: '번역기 다운로드',
    translationLangPackDescription:
      '번역 기능을 사용하려면 기기 내장 번역기(언어 팩) 다운로드가 필요합니다. 거절하시면 다음에 "번역하기" 버튼을 누를 때 다시 다운로드 안내가 표시됩니다. 약 50MB 저장 공간이 필요하며 Wi-Fi 연결을 권장합니다.',
    translationLangPackAgree: '다운로드하고 계속하기',
    translationLangPackDecline: '나중에',
    translationModalEngineLine: '사용 엔진: {{engine}}',
    translationModalWebRequiresNetwork: '인터넷 연결이 필요합니다.',
    translationModalOfflineCapable: '오프라인에서도 사용 가능합니다.',
    translationLangPackStorageTitle: '저장 공간 필요: 약 50MB',
    translationLangPackStorageHint:
      'Wi-Fi 연결을 권장합니다. 다운로드 후 오프라인에서 사용 가능합니다.',
    translationFooterConsentPrivacy:
      '동의함으로써 개인정보 처리방침에 동의하는 것으로 간주됩니다.',
    translationFooterLangPackDevice: '언어 팩은 기기 저장공간에 다운로드됩니다.',
    chatTranslatedByGemini: 'Gemini AI를 사용한 자동 번역 결과입니다.',
    chatTranslatedByDevice: '기기 엔진을 사용한 자동 번역 결과입니다.',
    chatTranslationErrorLabel: '번역 오류',
    chatTranslateShowOriginalTitle: '원문 보기',
    chatTranslateShowTranslatedTitle: '번역 보기',
    chatTranslating: '번역 중',
    chatExampleTitle: '채팅 메시지 예시',
    chatExampleHowToTitle: '사용 방법',
    chatExampleBullet1: '각 메시지 우측 하단에 번역 버튼이 있습니다.',
    chatExampleBullet2: '베트남어 메시지는 한국어로 번역됩니다.',
    chatExampleBullet3: '한국어 메시지는 베트남어로 번역됩니다.',
    chatExampleBullet4: '번역 후 "원문 보기" 버튼으로 토글 가능합니다.',
    chatExampleBullet5: '번역된 내용은 캐시되어 재사용됩니다.',
    chatExampleDemoGuestName: '민안',
    chatExampleDemoHostName: '호스트',
    chatExampleDemoTime1: '오후 2:30',
    chatExampleDemoTime2: '오후 2:32',
    chatExampleDemoTime3: '오후 2:35',
    chatExampleDemoMsgHostReply:
      '안녕하세요, 2월 15일부터 22일까지 예약 가능합니다. 자세한 정보를 알려드릴게요.',
    propertyImageAltFallback: '매물 사진',
    propertyFavoriteButtonAria: '찜하기',
    carouselSlideSelectAria: '슬라이드 {{n}}으로 이동',
    trustSignalKycTitle: 'KYC 인증 호스트',
    trustSignalKycDesc: '신원 확인된 호스트',
    trustSignalLanguagesTitle: '5개국어 지원',
    trustSignalLanguagesDesc: 'KO/VI/EN/JA/ZH',
    trustSignalChatTitle: '실시간 채팅',
    trustSignalChatDesc: '호스트와 바로 대화',
    trustSignalBookingTitle: '즉시 예약 확인',
    trustSignalBookingDesc: '빠른 예약 승인',
    propertyDescriptionTranslateError: '번역 중 오류가 발생했습니다.',
    propertyDescExampleTitle: '매물 설명 예시',
    propertyDescHowToTitle: '사용 방법',
    propertyDescBullet1: '기본적으로 베트남어 원문이 표시됩니다.',
    propertyDescBullet2: '"번역 보기" 버튼을 클릭하면 번역됩니다.',
    propertyDescBullet3: '최초 실행 시 동의 모달이 표시됩니다.',
    propertyDescBullet4: '네이티브 앱 환경에서는 언어 팩 다운로드 동의가 필요합니다.',
    propertyDescBullet5: '번역 후 "원문 보기" 버튼으로 토글 가능합니다.',
    uiTranslateGenericFail: '번역에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    uiTranslatedBadge: '번역됨',
    uiTranslateReset: '초기화',
    uiTranslateCostSavingHint:
      '비용 절감을 위해 필요할 때만 번역됩니다. 같은 텍스트는 캐시되어 재사용됩니다.',
    chatSendFailed: '메시지 전송에 실패했습니다.',
    chatRoleTenant: '임차인',
    chatRoleLandlord: '임대인',
    chatViewListing: '매물 보기',
    chatViewListingDetail: '매물 상세보기 →',
    chatResidencyNoticeTitle: '입주 전 꼭 확인해 주세요!',
    chatResidencyNoticeBody:
      '베트남 법에 따라 거주신고(Khai báo tạm trú)가 필수예요! 쾌적하고 안전한 숙박을 위해 꼭 진행해 주세요 ✈️',
    chatScrollOlderMessages: '위로 스크롤하면 이전 메시지',
    chatBookingNoticeTitle: '예약 확정 안내',
    chatBookingNoticeBody:
      '안전하고 즐거운 숙박을 위해 입주 직후 거주신고(Khai báo tạm trú)를 진행해 주세요.',
    chatEmptyState: '메시지를 보내 대화를 시작하세요',
    chatReadReceipt: '읽음',
    chatSystemPeerJoined: '상대방이 입장했습니다',
    chatSystemImageSent: '이미지를 보냈습니다',
    chatInputPlaceholder: '메시지 입력...',
    chatInputPlaceholderFull: '메시지를 입력하세요...',
    settlementProcessHaltedDetail:
      '정산 프로세스를 중단했습니다. 잠시 후 다시 시도해 주세요.',
    settlementEmptyRevenueList:
      '체크인 시각이 지난 결제 완료 예약이 없습니다.',
    settlementNoWithdrawalHistory: '출금 내역이 없습니다.',
    settlementNoBankAccounts: '등록된 계좌가 없습니다.',
    withdrawalValidateAmount: '출금 금액을 입력해주세요.',
    withdrawalSelectBankRequired: '계좌를 선택해주세요.',
    withdrawalRequestFailedMessage: '출금 신청에 실패했습니다.',
    withdrawalSubmittedSuccess: '출금 신청이 접수되었습니다.',
    bankAccountFormIncomplete: '계좌 정보를 모두 입력해주세요.',
    bankAccountAddFailed: '계좌 등록에 실패했습니다.',
    bankAccountAddedSuccess: '계좌가 등록되었습니다.',
    withdrawalStatusHeld: '보류',
    withdrawalStatusRejected: '반려',
    profileKycCoinsProgress: '코인 {n}/3',
    profileKycEncourageWithCount:
      'KYC 인증을 완료하여 코인 3개를 모으세요! (현재 {n}/3)',
    deleteAccountButton: '회원탈퇴',
    deleteAccountExecuting: '처리 중...',
    phoneVerificationRequired: '전화번호 인증이 필요합니다.',
    langEndonymKo: '한국어',
    langEndonymVi: 'Tiếng Việt',
    langEndonymEn: 'English',
    langEndonymJa: '日本語',
    langEndonymZh: '中文',
    kycHostVerificationTitle: '임대인 인증',
    kycCompleteThreeStepSubtitle: '3단계 인증을 완료해주세요',
    kycProgressLoadError:
      '인증 진행 상황을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.',
    kycStepFailedGeneric: 'KYC 단계 처리에 실패했습니다.',
    kycIdDocumentStepTitle: '신분증 촬영',
    kycFaceVerificationStepTitle: '얼굴 인증',
    kycStep2CompleteTitle: '2단계 인증 완료',
    kycStep2CompleteBody:
      '신분증 정보가 안전하게 접수되었습니다. 이제 3단계 얼굴 인증을 진행해주세요.',
    kycTestModeBannerTitle: '현재 테스트 모드입니다',
    kycTestModeFaceSubtitle: '촬영 없이도 인증 완료 가능',
    kycTestModeIdSubtitle: '촬영 없이도 다음 단계 이동 가능',
    kycFaceFiveDirectionInstruction: '5방향 얼굴 촬영을 진행해주세요',
    kycStartCapture: '촬영 시작',
    kycFaceCaptureSessionTitle: '얼굴 촬영',
    kycMultistepProgress: '{current}/{total} 단계',
    kycCameraErrorTitle: '카메라 오류',
    kycStopCapture: '촬영 중단',
    kycCaptureCompleteTitle: '촬영 완료',
    kycReviewCapturedImagesFace: '촬영된 이미지를 확인해주세요',
    kycRetakePhotos: '다시 촬영',
    kycCompleteVerification: '인증 완료',
    kycAiAnalyzingTitle: 'AI 분석 중',
    kycAiAnalyzingDesc: '얼굴 인증 데이터를 분석하고 있습니다...',
    kycIdSelectTypeAndCapture:
      '신분증 유형을 선택하고 카메라로 촬영해주세요',
    kycCameraOpenIdCard: '카메라 켜기 (신분증)',
    kycCameraOpenPassport: '카메라 켜기 (여권)',
    kycIdCaptureTitleFrontIdCard: '신분증 앞면 촬영',
    kycIdCaptureTitleFrontPassport: '여권 정보면 촬영',
    kycIdCaptureTitleBack: '신분증 뒷면 촬영',
    kycIdAlignInGuide: '신분증을 가이드 라인에 맞춰 촬영해주세요',
    kycIdPlaceInFrame: '신분증을 가이드 라인에 맞춰주세요',
    kycIdFullDocumentVisible: '전체가 보이도록 촬영해주세요',
    kycImageConfirmTitle: '이미지 확인',
    kycImageConfirmDesc: '촬영된 이미지를 확인해주세요',
    kycIdSideFront: '앞면',
    kycIdSideBack: '뒷면',
    kycShootBackSide: '뒷면 촬영',
    kycRetakeCapture: '다시 촬영',
    kycFormTitleEnterIdInfo: '신분증 정보 입력',
    kycFormDescEnterIdInfo: '신분증에 기재된 정보를 입력해주세요',
    kycFormIdNumberLabel: '신분증 번호',
    kycFormDateOfBirthLabel: '생년월일',
    kycFormIssueDateLabel: '발급일',
    kycFormExpiryDateLabel: '만료일',
    kycFormNextStep: '다음 단계',
    kycFormRequiredFieldsMissing: '필수 항목을 모두 입력해주세요',
    kycFormImageRequired: '이미지를 선택해주세요',
    kycCaptureCanvasError: '캔버스를 생성할 수 없습니다',
    kycCaptureFailedGeneric: '촬영에 실패했습니다',
    cameraErrPermissionDenied:
      '카메라 권한이 거부되었습니다. 기기 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.',
    cameraErrNotFound: '사용 가능한 카메라를 찾을 수 없습니다.',
    cameraErrGeneric: '카메라 오류: {{detail}}',
    apiSyncErrorTransient:
      '일시적인 오류입니다. 인터넷 연결을 확인한 뒤 잠시 후 다시 시도해 주세요.',
    userFacingAuthOrSessionError:
      '오류가 발생했습니다. 잠시 후 다시 시도하거나 로그인 상태를 확인해 주세요.',
    bookingCreateFailedMessage:
      '예약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
    bookingPaymentCompleteFailedMessage:
      '결제를 완료하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.',
    bookingPaymentMetaDefaultError:
      '결제 정보를 서버에 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    bookingPaymentMetaCreateError:
      '결제(메타)를 등록하지 못했습니다. 예약은 생성되었으나 결제 직전에 새로고침하거나 고객센터에 문의해 주세요.',
    bookingPaymentToastRefundCancelledBody:
      '결제(환불) 반영에 따라 예약이 취소 처리되었습니다. 내 예약에서 상태를 확인해 주세요.',
    bookingPaymentToastConfirmedBody: '결제가 완료되어 예약이 확정되었습니다.',
    bookingPaymentToastSyncedBody:
      '결제 정보가 서버에 반영되었습니다. 최신 예약 상태는 내 예약에서 확인해 주세요.',
    bookingRefundToastCancelledBody:
      '환불이 반영되어 예약이 취소(환불) 처리되었습니다.',
    bookingRefundToastSyncedBody: '환불 결제 정보가 서버에 반영되었습니다.',
    bookingSyncImmediateFailed:
      '예약 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
    bookingErrorPaymentNotCompleted: '결제가 완료되지 않았습니다.',
    appPaymentErrUnparseableResponse: '서버 응답을 해석할 수 없습니다.',
    appPaymentErrRejected: '요청이 거절되었습니다.',
    appPaymentErrHttpStatus: '요청 실패 (HTTP {{status}})',
    topBarUnreadChatSubtitle: '{n}개의 읽지 않은 메시지가 있습니다',
    topBarNoNotifications: '새 알림이 없습니다',
    topBarAriaNotifications: '알림',
    topBarAriaProfile: '프로필 메뉴',
    topBarAriaLogin: '로그인',
    adminAccountsListLoadFailed: '목록을 불러오지 못했습니다.',
    adminAccountsSaveFailed: '저장에 실패했습니다.',
    adminAccountsCreateFailed: '계정 생성에 실패했습니다.',
    adminAccountsToggleFailed: '권한 변경에 실패했습니다.',
    apiErrAdminAccountInvalidInput:
      '아이디(3–64자, 영문·숫자·._-)와 비밀번호(8자 이상)를 확인하세요.',
    apiErrAdminUsernameTaken: '이미 사용 중인 아이디일 수 있습니다.',
    apiErrAdminUsernameInvalid: '아이디 형식이 올바르지 않습니다.',
    apiErrAdminUsernameConflict: '이미 사용 중인 아이디입니다.',
    apiErrAdminNewPasswordTooShort: '새 비밀번호는 8자 이상이어야 합니다.',
    apiErrAdminCurrentPasswordInvalid: '현재 비밀번호가 올바르지 않습니다.',
    apiErrAdminCannotDemoteOwnSuper: '본인의 슈퍼 관리자 권한은 여기서 해제할 수 없습니다.',
    apiErrAdminCannotDemoteLastSuper: '마지막 슈퍼 관리자는 승격 해제할 수 없습니다.',
    apiErrAdminNoValidUpdates: '변경할 항목이 없습니다.',
    chatDateToday: '오늘',
    chatDateYesterday: '어제',
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
    popularStaysTitle: 'Chỗ ở nổi bật',
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
    whereDoYouWantToLive:
      'Tìm thông tin lưu trú và cho thuê ngắn hạn theo khu vực',
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
    loginWrongPassword: 'Mật khẩu không đúng.',
    loginSocialLoginRequired: 'Tài khoản này đăng ký bằng đăng nhập xã hội.',
    loginAccountBlocked: 'Tài khoản này đã bị quản trị viên hạn chế.',
    loginNetworkError: 'Lỗi mạng. Vui lòng thử lại sau.',
    loginServerUnavailable: 'Không kết nối được máy chủ. Vui lòng thử lại sau.',
    adminUserBlockPrompt: 'Nhập lý do chặn.',
    adminUserBlockDefaultReason: 'Chặn bởi quản trị viên',
    phoneSendOtpButton: 'Gửi mã OTP',
    phoneEnterNumberPlaceholder: 'Nhập số điện thoại',
    phoneSelectCountry: 'Chọn quốc gia',
    phoneOtpSentBadge: 'Đã gửi',
    mapErrAwsApiKeyMissing:
      'Thiếu AWS API key. Kiểm tra NEXT_PUBLIC_AWS_API_KEY trong .env.local.',
    mapErrAwsMapNameMissing:
      'Thiếu tên bản đồ AWS. Kiểm tra NEXT_PUBLIC_AWS_MAP_NAME trong .env.local.',
    mapErrLoadGeneric: 'Lỗi khi tải bản đồ.',
    mapErrNetworkAws: 'Lỗi mạng — không kết nối được dịch vụ bản đồ AWS.',
    mapErrAwsKeyInvalid: 'AWS API key không hợp lệ. Kiểm tra biến môi trường.',
    mapErrMapNotFound: 'Không tìm thấy tài nguyên bản đồ. Kiểm tra tên Map.',
    mapErrStyleLoad: 'Không tải được style bản đồ. Kiểm tra API key và tên Map.',
    mapErrorHeading: 'Lỗi',
    mapErrCheckEnvHint: 'Kiểm tra NEXT_PUBLIC_AWS_API_KEY và NEXT_PUBLIC_AWS_MAP_NAME.',
    legacyNewPropertyPageTitle: 'Đăng tin mới',
    legacyNewPropertyFieldTitle: 'Tên tin',
    legacyNewPropertyTitlePh: 'VD: Căn 301 Hongdae, Tòa A',
    legacyNewPropertyDescVi: 'Mô tả (tiếng Việt)',
    legacyNewPropertyAddrVi: 'Địa chỉ (tiếng Việt)',
    legacyNewPropertyGeocoding: 'Đang chuyển đổi tọa độ…',
    legacyNewPropertyCoordsOk: 'Đã có tọa độ',
    legacyNewPropertyAddrPh: 'VD: Quận 7, Thành phố Hồ Chí Minh',
    legacyNewPropertyCoordsLine: 'Tọa độ: {{lat}}, {{lng}}',
    legacyNewPropertyPrice: 'Giá',
    legacyNewPropertyCurrency: 'Tiền tệ',
    legacyNewPropertyArea: 'Diện tích (m²)',
    legacyNewPropertyBedrooms: 'Phòng ngủ',
    legacyNewPropertyBathrooms: 'Phòng tắm',
    legacyNewPropertyCheckIn: 'Giờ nhận phòng',
    legacyNewPropertyCheckOut: 'Giờ trả phòng',
    legacyNewPropertyTimeAfter: 'Sau {{time}}',
    legacyNewPropertyTimeBefore: 'Trước {{time}}',
    legacyNewPropertyCheckInHelp: 'Thời điểm khách có thể nhận phòng',
    legacyNewPropertyCheckOutHelp: 'Thời điểm khách phải trả phòng',
    legacyNewPropertyCancel: 'Hủy',
    legacyNewPropertySubmit: 'Đăng tin',
    legacyNewPropertySubmitting: 'Đang đăng…',
    legacyNewPropertySuccess: 'Đã đăng tin thành công.',
    legacyNewPropertyError: 'Đăng tin thất bại.',
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
    searchClearInputAria: 'Xóa ô tìm kiếm',
    locationBadgeCity: 'Thành phố',
    locationBadgeDistrict: 'Quận',
    locationBadgeLandmark: 'Địa danh',
    labelCity: 'Thành phố',
    labelDistrict: 'Quận',
    selectDistrictPlaceholder: 'Chọn quận',
    selectCityPlaceholder: 'Chọn thành phố',
    searchFiltersResetButton: 'Đặt lại bộ lọc',
    explorePopularCities: 'Khu vực nổi bật tại Việt Nam',
    popularStaysViewMore: 'Xem thêm',
    addressPatternTower: 'Tòa {{name}}',
    addressPatternZone: 'Khu {{name}}',
    addressPatternLobby: 'Sảnh {{name}}',
    addressPatternUnit: 'Căn hộ {{name}}',
    adminKycPageTitle: 'Dữ liệu KYC',
    adminKycTotalRecordsTemplate: '{{count}} người',
    adminKycRefreshButton: 'Làm mới',
    adminKycLoadingLabel: 'Đang tải...',
    adminKycEmptyMessage: 'Không có dữ liệu',
    adminKycNoNameFallback: 'Không tên',
    bookingGuestSummaryWithChildren: '{{adults}} người lớn, {{children}} trẻ em',
    bookingGuestSummaryAdultsOnly: '{{adults}} người lớn',
    searchRoomTypeStudio: 'Studio',
    searchRoomTypeOneRoom: '1 phòng (phòng + phòng khách)',
    searchRoomTypeTwoRoom: '2 phòng',
    searchRoomTypeThreePlus: '3+ phòng',
    searchRoomTypeDetached: 'Nhà riêng',
    adminKycStatusVerified: 'Đã xác minh',
    adminKycStatusPending: 'Đang duyệt',
    adminKycStatusRejected: 'Từ chối',
    adminKycStatusUnverified: 'Chưa xác minh',
    adminKycSubtitleNew: '{{count}} người mới',
    adminKycSubtitleVerified: '{{count}} đã xác minh',
    adminKycSubtitleUnverified: '{{count}} chưa xác minh',
    adminKycTabNew: 'Mới',
    adminKycTabAll: 'Tất cả',
    adminKycTabVerified: 'Đã xác minh',
    adminKycTabUnverified: 'Chưa xác minh',
    adminKycColVerificationStatus: 'Trạng thái KYC',
    adminKycColIdDocument: 'Giấy tờ',
    adminKycColDateOfBirth: 'Ngày sinh',
    adminKycIdTypePassportLabel: 'Hộ chiếu',
    adminKycIdTypeIdCardLabel: 'CMND/CCCD',
    adminKycMobileIdPrefix: 'ID',
    adminKycMobileDobPrefix: 'Sinh',
    adminSettlementsEmptyRequest:
      'Không có yêu cầu thanh toán chờ duyệt. (Chỉ hiển thị sau khi trả phòng / kết thúc hợp đồng.)',
    adminSettlementsEmptyPending: 'Không có khoản chờ phê duyệt.',
    adminSettlementsEmptyApproved: 'Không có khoản đã phê duyệt (đang hoạt động).',
    adminSettlementsEmptyHeld: 'Không có khoản đang tạm giữ.',
    adminSettlementsListFilteredEmpty: 'Không có mục nào khớp tìm kiếm / sắp xếp / bộ lọc.',
    adminContractsEmptyNew: 'Không có hợp đồng mới.',
    adminContractsEmptySealed:
      'Không có đặt phòng đã ký hợp đồng (đã thanh toán / xác nhận, trước khi nhận phòng).',
    adminContractsEmptyInProgress:
      'Không có đặt phòng đang trong hợp đồng (đang nhận phòng ~ trả phòng).',
    adminContractsEmptyCompleted:
      'Không có đặt phòng đã kết thúc hợp đồng (sau trả phòng / hoàn tất).',
    adminRefundsEmptyAll: 'Không có khoản hoàn tiền đang chờ.',
    adminRefundsEmptyNew: 'Không có khoản hoàn tiền mới đang chờ.',
    adminRefundsEmptyPre: 'Không có khoản hoàn tiền trước hợp đồng đang chờ.',
    adminRefundsEmptyDuring: 'Không có khoản hoàn tiền trong kỳ thuê đang chờ.',
    adminWithdrawalsEmptyPending: 'Không có yêu cầu rút tiền chờ duyệt.',
    adminWithdrawalsEmptyProcessing: 'Không có lệnh rút tiền đang xử lý.',
    adminWithdrawalsEmptyCompleted: 'Không có lịch sử rút tiền đã hoàn tất.',
    adminWithdrawalsEmptyRejected: 'Không có lệnh rút tiền bị từ chối.',
    adminWithdrawalsEmptyHeld: 'Không có lệnh rút tiền đang tạm giữ.',
    adminCommonRefresh: 'Làm mới',
    adminCommonLoading: 'Đang tải...',
    adminSettlementsTabRequest: 'Yêu cầu duyệt',
    adminSettlementsTabPending: 'Chờ duyệt',
    adminSettlementsTabApproved: 'Đã duyệt',
    adminSettlementsTabHeld: 'Tạm giữ',
    adminSettlementsPageTitle: 'Duyệt thanh toán',
    adminSettlementsIntroLine:
      'Yêu cầu chỉ được tạo sau khi trả phòng (kết thúc hợp đồng). Xem xét rồi chuyển sang chờ duyệt, sau đó phê duyệt hoặc tạm giữ. Sau trả phòng +24h, phê duyệt sẽ phản ánh vào số tiền có thể rút. · Yêu cầu {{req}} · Chờ {{pend}} · Hoàn tất {{appr}} · Tạm giữ {{held}}',
    adminSettlementsBadgeContractEnded: 'Sau kết thúc hợp đồng',
    adminContractsPageTitle: 'Hợp đồng',
    adminContractsIntroLine:
      'Ký → đang ở → kết thúc (sau trả phòng) · Đã ký {{sealed}} · Đang ở {{inProgress}} · Đã kết thúc {{completed}}',
    adminContractsTabNew: 'Mới',
    adminContractsTabSealed: 'Đã ký HĐ',
    adminContractsTabInProgress: 'Đang thực hiện',
    adminContractsTabCompleted: 'Đã kết thúc',
    adminContractsSearchPlaceholder: 'Email, UID, đặt phòng, BĐS, số tiền…',
    adminContractsSearchHint: 'Chỉ tìm trong tab đang chọn.',
    adminRefundsPageTitle: 'Hoàn tiền',
    adminRefundsIntroLine:
      'Phê duyệt hoàn tiền cho đặt phòng đã hủy và đã thanh toán. · Trước HĐ {{pre}} · Trong kỳ {{during}}',
    adminRefundsTabNew: 'Mới',
    adminRefundsTabAll: 'Tất cả',
    adminRefundsTabPre: 'Hoàn trước HĐ',
    adminRefundsTabDuring: 'Hoàn trong kỳ thuê',
    adminRefundsSearchPlaceholder: 'Email, UID, đặt phòng, BĐS, số tiền…',
    adminRefundsSearchHint: 'Chỉ tìm trong tab đang chọn.',
    adminRefundsApproveButton: 'Phê duyệt hoàn tiền',
    adminWithdrawalsPageTitle: 'Duyệt yêu cầu rút tiền',
    adminWithdrawalsIntroLine:
      'Xem theo từng mục. · Chờ {{pending}} · Xử lý {{processing}} · Từ chối {{rejected}} · Hoàn tất {{completed}} · Tạm giữ {{held}}',
    adminWithdrawalsTabPending: 'Chờ duyệt',
    adminWithdrawalsTabProcessing: 'Đang xử lý',
    adminWithdrawalsTabRejected: 'Từ chối',
    adminWithdrawalsTabCompleted: 'Hoàn tất',
    adminWithdrawalsTabHeld: 'Tạm giữ',
    adminWithdrawalsSearchPlaceholder: 'Email, UID, nhãn TK, số tiền…',
    adminWithdrawalsSearchHint: 'Chỉ tìm trong tab đang chọn.',
    adminWithdrawalApprove: 'Phê duyệt',
    adminWithdrawalReject: 'Từ chối',
    adminWithdrawalHold: 'Tạm giữ',
    adminWithdrawalComplete: 'Hoàn tất',
    adminWithdrawalResume: 'Tiếp tục',
    adminWithdrawalBadgeCompleted: 'Hoàn tất',
    adminWithdrawalBadgeRejected: 'Từ chối',
    adminWithdrawalRejectReason: 'Từ chối bởi quản trị',
    adminWithdrawalHoldReason: 'Tạm giữ bởi quản trị',
    csvKycColFullName: 'Họ tên',
    csvKycColPhone: 'Số điện thoại',
    csvKycColIdType: 'Loại giấy tờ',
    csvKycColIdNumber: 'Số giấy tờ',
    csvKycColDateOfBirth: 'Ngày sinh',
    csvKycColIdFrontUrl: 'URL ảnh giấy tờ (mặt trước)',
    csvKycColIdBackUrl: 'URL ảnh giấy tờ (mặt sau)',
    csvKycColFaceUrl: 'URL ảnh khuôn mặt',
    csvKycColSubmittedAt: 'Thời gian gửi',
    csvKycColVerificationStatus: 'Trạng thái xác minh',
    adminKycCsvDownloadError: 'Đã xảy ra lỗi khi tải CSV.',
    adminSettlementsSearchHint: 'Chỉ tìm trong tab đang chọn.',
    adminSettlementsFilterLabel: 'Lọc',
    adminSettlementsFilterTitle24hBaseline:
      'Mốc: 24h sau khi trả phòng. Chỉ chọn một trong ba tùy chọn.',
    adminSettlementsSortRemainingAscTitle: 'Hạn sớm trước (tăng dần thời gian còn lại)',
    adminSettlementsSortRemainingDescTitle: 'Hạn muộn trước (giảm dần thời gian còn lại)',
    adminSettlementsFilterElapsed24hTitle: 'Chỉ hiển thị đã quá 24h sau trả phòng (không kết hợp ↑·↓)',
    adminSettlementsSortRemainingAsc: 'Còn lại ↑',
    adminSettlementsSortRemainingDesc: 'Còn lại ↓',
    adminSettlementsFilterElapsed24h: 'Đã 24h',
    adminSettlementActionMoveToPending: 'Chuyển chờ duyệt',
    adminSettlementResumeToRequest: 'Khôi phục (yêu cầu)',
    adminSettlementResumeToPending: 'Khôi phục (chờ duyệt)',
    adminAuditPageTitle: 'Nhật ký kiểm toán',
    adminAuditPageIntro: 'Tiền · thao tác vận hành · theo người xử lý và thời gian',
    adminAuditSearchPlaceholder: 'Hành động, owner/ref, ghi chú, người xử lý…',
    adminAuditSearchHint: 'Chỉ tìm trong tab đã chọn.',
    adminAuditEmpty: 'Không có bản ghi phù hợp.',
    adminAuditColAction: 'Hành động',
    adminAuditColAmount: 'Số tiền',
    adminAuditColOwnerTarget: 'owner / đối tượng',
    adminAuditColRef: 'ref',
    adminAuditColActor: 'Người xử lý',
    adminAuditColNote: 'Ghi chú',
    adminAuditColTime: 'Thời gian',
    adminAuditAmountDash: 'Số tiền —',
    adminAuditMobileTarget: 'Đối tượng:',
    adminAuditMobileActor: 'Xử lý:',
    adminAuditTabNew: 'Mới',
    adminAuditTabAll: 'Tất cả',
    adminAuditTabSettlement: 'Quyết toán',
    adminAuditTabWithdrawal: 'Rút tiền',
    adminAuditTabRefund: 'Hoàn tiền',
    adminAuditTabAccount: 'Tài khoản',
    adminAuditTabProperty: 'Tin đăng',
    adminAuditLedgerSettlementApproved: 'Đã duyệt quyết toán',
    adminAuditLedgerSettlementHeld: 'Tạm giữ quyết toán',
    adminAuditLedgerSettlementResumed: 'Tiếp tục quyết toán (đã duyệt)',
    adminAuditLedgerSettlementRevertedPending: 'Khôi phục QT → chờ duyệt',
    adminAuditLedgerSettlementRevertedRequest: 'Khôi phục QT → yêu cầu',
    adminAuditLedgerWithdrawalRequested: 'Yêu cầu rút tiền',
    adminAuditLedgerWithdrawalProcessing: 'Đã duyệt rút (đang xử lý)',
    adminAuditLedgerWithdrawalHeld: 'Tạm giữ rút tiền',
    adminAuditLedgerWithdrawalResumed: 'Tiếp tục rút tiền',
    adminAuditLedgerWithdrawalCompleted: 'Hoàn tất rút tiền',
    adminAuditLedgerWithdrawalRejectedRefund: 'Từ chối rút · hoàn',
    adminAuditLedgerRefundApproved: 'Duyệt hoàn tiền',
    adminAuditModUserBlocked: 'Chặn tài khoản',
    adminAuditModUserRestored: 'Khôi phục tài khoản',
    adminAuditModPropertyHidden: 'Ẩn tin',
    adminAuditModPropertyRestored: 'Khôi phục tin',
    adminAuditModPropertyAdEndedByHost: 'Kết thúc quảng cáo (host)',
    adminAuditModPropertyDeletedByHost: 'Xóa tin (host)',
    adminUiBadPath: 'Đường dẫn không hợp lệ.',
    adminUiLoadingEllipsis: 'Đang tải…',
    adminUiNoQueryResults: 'Không có kết quả.',
    adminPaginationPrev: 'Trước',
    adminPaginationNext: 'Sau',
    adminPaginationLine: '{{page}} / {{total}} · {{count}} mục',
    adminFilterNew: 'Mới',
    adminFilterAll: 'Tất cả',
    adminUserFilterActive: 'Bình thường',
    adminUserFilterBlocked: 'Chặn',
    adminUsersTitle: 'Quản lý tài khoản',
    adminUsersIntroLine:
      'Mới = trong 24h đăng ký (click dòng để xác nhận; chỉ trong ngày) · Mới {{nNew}} · Tất cả {{nAll}} · BT {{nActive}} · Chặn {{nBlocked}}',
    adminUsersSearchPlaceholder: 'Tìm uid / email / tên',
    adminUsersSearchHint: 'Chỉ tìm trong tab đã chọn.',
    adminColAlert: 'Cảnh báo',
    adminColName: 'Tên',
    adminColEmail: 'Email',
    adminColPhone: 'Điện thoại',
    adminColUid: 'UID',
    adminColStatus: 'Trạng thái',
    adminColActions: 'Thao tác',
    adminPingTitleUnseen: 'Chưa xem',
    adminPingTitleAck: 'Chưa xem',
    adminAriaUnseenNewUser: 'Tài khoản mới chưa xem',
    adminAriaAckNewUser: 'Đã xác nhận tài khoản mới',
    adminDotUnseen: 'Chưa xem',
    adminDotAcked: 'Đã xem',
    adminStatusNormal: 'Bình thường',
    adminStatusBlocked: 'Chặn',
    adminActionRestore: 'Khôi phục',
    adminActionBlock: 'Chặn',
    adminPropertiesTitle: 'Quản lý tin',
    adminPropertiesIntroLine:
      'Chỉ tin cha · Mới giữ đến khi xác nhận · Sau xác nhận chỉ trong ngày · Mới nhất trước · Tất cả {{nAll}} · Mới {{nNew}} · Hiển thị {{nListed}} · Tạm dừng QC {{nPaused}} · Ẩn {{nHidden}}',
    adminPropFilterListed: 'Hiển thị',
    adminPropFilterPaused: 'Tạm dừng QC',
    adminPropFilterHidden: 'Ẩn',
    adminPropertiesSearchPlaceholder: 'Tìm id / tiêu đề / owner / địa chỉ',
    adminPropertiesSearchHint: 'Tìm trong tab. Hiển thị = có thể đặt như khách.',
    adminPropColTitle: 'Tiêu đề',
    adminPropColAddress: 'Địa chỉ',
    adminPropColOwner: 'Owner',
    adminPropColId: 'ID',
    adminListingHidden: 'Ẩn',
    adminListingAdPaused: 'Tạm dừng QC',
    adminListingLive: 'Hiển thị',
    adminPropUnhide: 'Khôi phục',
    adminPropHide: 'Ẩn',
    adminAriaUnseenNewProperty: 'Tin mới chưa xem',
    adminAriaAckNewProperty: 'Đã xác nhận tin mới',
    adminPropertiesHiddenReasonLabel: 'Lý do ẩn (cố định):',
    adminNotFoundUser: 'Không tìm thấy tài khoản.',
    adminBackToUsersList: 'Về danh sách tài khoản',
    adminNotFoundProperty: 'Không tìm thấy tin.',
    adminBackToPropertiesList: 'Về danh sách tin',
    adminUserDetailBack: 'Quay lại',
    adminNoDisplayName: 'Chưa có tên',
    adminUserBadgeSuspended: 'Tạm khóa',
    adminUserBadgeActive: 'Hoạt động',
    adminLabelHostMemo: 'Ghi chú host',
    adminLabelGuestMemo: 'Ghi chú khách',
    adminMemoEmpty: 'Không có ghi chú',
    adminMemoPlaceholderHost: 'Ghi chú hỗ trợ host',
    adminMemoPlaceholderGuest: 'Ghi chú hỗ trợ khách',
    adminMemoNewestFirst: 'Ghi chú mới nhất ở trên.',
    adminUserUnblock: 'Bỏ chặn',
    adminUserBlockAccount: 'Chặn tài khoản',
    adminSectionProfileStatus: 'Hồ sơ · trạng thái',
    adminSectionHost: 'Host',
    adminSectionGuest: 'Khách',
    adminLabelKyc: 'KYC',
    adminUserJoinedAt: 'Ngày tham gia',
    adminUserStatHostBookingsTotal: 'Đặt phòng (tổng)',
    adminUserStatInProgress: 'Đang diễn ra',
    adminUserStatCompleted: 'Hoàn tất',
    adminUserStatCancelled: 'Đã hủy',
    adminUserBalanceTitle: 'Số dư',
    adminUserBalanceAvailable: 'Có thể rút',
    adminUserBalanceApprovedRevenue: 'Doanh thu đã duyệt',
    adminUserBalancePendingWithdraw: 'Rút đang xử lý / tạm giữ',
    adminUserGuestCurrentRes: 'Đặt hiện tại',
    adminUserGuestDepositPending: 'Chờ cọc',
    adminUserGuestContractDone: 'Hợp đồng xong',
    adminUserRefundsHeading: 'Hoàn tiền liên quan',
    adminUserRefundsEmpty: 'Không có dữ liệu.',
    adminUserRefundsColBookingId: 'ID đặt phòng',
    adminUserRefundsColProperty: 'Tin',
    adminUserRefundsColAmount: 'Số tiền',
    adminUserRefundsColPayment: 'Thanh toán',
    adminUserRefundsColRefund: 'Hoàn tiền',
    adminRefundStatusDone: 'Đã hoàn',
    adminRefundStatusAdminOk: 'Admin đã duyệt',
    adminRefundStatusPending: 'Chờ duyệt',
    adminPropertyDetailBackList: 'Danh sách tin',
    adminPropertyNoTitle: 'Không tiêu đề',
    adminPropertyAdminMemo: 'Ghi chú admin',
    adminPropertyMemoPlaceholder: 'Ghi chú quản trị tin',
    adminPropertyViewHost: 'Xem tài khoản host',
    adminPropertyUnhide: 'Bỏ ẩn',
    adminPropertyHide: 'Ẩn',
    adminSectionHostId: 'Host · định danh',
    adminLabelOwnerId: 'Owner ID',
    adminLabelDisplayName: 'Tên hiển thị',
    adminSectionPriceAreaGuests: 'Giá · diện tích · khách',
    adminLabelWeeklyRent: 'Giá/tuần',
    adminLabelAreaSqm: 'Diện tích',
    adminLabelBedBath: 'Phòng ngủ · WC',
    adminLabelBedroomsBathrooms: 'PN {{bed}} · WC {{bath}}',
    adminLabelMaxGuests: 'Tối đa khách',
    adminLabelAdultsChildren: 'Người lớn {{adults}} · trẻ em {{children}}',
    adminSectionLocation: 'Vị trí',
    adminLabelAddress: 'Địa chỉ',
    adminLabelUnitNumber: 'Căn hộ',
    adminLabelCityDistrictIds: 'city / district',
    adminLabelCoordinates: 'Tọa độ',
    adminSectionDescription: 'Mô tả',
    adminPropertyDescOriginalVi: 'Tiếng Việt (gốc)',
    adminPropertyDescTranslatedKo: 'Bản dịch (KO)',
    adminSectionPhotos: 'Ảnh',
    adminPropertyNoImages: 'Chưa có ảnh',
    adminSectionAmenitiesType: 'Tiện ích · loại',
    adminLabelPropertyType: 'Loại',
    adminLabelCleaningPerWeek: 'Dọn/tuần',
    adminSectionPets: 'Thú cưng',
    adminLabelPetAllowed: 'Cho phép',
    adminLabelYes: 'Có',
    adminLabelNo: 'Không',
    adminLabelPetFeePerPet: 'Phí thú (VND/con)',
    adminLabelMaxPets: 'Tối đa số con',
    adminSectionSchedule: 'Lịch · nhận phòng',
    adminLabelRentStart: 'Bắt đầu thuê',
    adminLabelRentEnd: 'Kết thúc thuê',
    adminLabelCheckInTime: 'Giờ nhận',
    adminLabelCheckOutTime: 'Giờ trả',
    adminSectionIcal: 'Lịch ngoài (iCal)',
    adminLabelIcalPlatform: 'Nền tảng',
    adminLabelIcalCalendarName: 'Tên lịch',
    adminLabelUrl: 'URL',
    adminSectionChangeHistory: 'Lịch sử thay đổi',
    adminPropertyMetaCreated: 'Tạo',
    adminPropertyMetaUpdated: 'Cập nhật',
    adminPropertyDeletedFlag: 'Cờ xóa host: deleted',
    adminSystemLogTitle: 'Nhật ký hệ thống',
    adminSystemLogChecklist:
      'Checklist 5 phút: ① lỗi 5xx/401/403 ② ghi đặt phòng/thanh toán ③ lỗi KYC ④ lặp log ⑤ truy vết bookingId/ownerId.',
    adminSystemLogFilterNew: 'Mới',
    adminSystemLogFilterAll: 'Tất cả',
    adminSystemLogFilterError: 'Lỗi',
    adminSystemLogFilterWarning: 'Cảnh báo',
    adminSystemLogFilterInfo: 'Thông tin',
    adminSystemLogExportCsv: 'Xuất CSV',
    adminSystemLogClearEphemeral: 'Xóa log tạm',
    adminSystemLogClearPersistent: 'Reset log lưu',
    adminSystemLogCountLine: 'Hiển thị {{shown}} · trang {{page}}/{{pages}}',
    adminSystemLogColTime: 'Giờ',
    adminSystemLogColSeverity: 'Mức độ',
    adminSystemLogColCategory: 'Phân loại',
    adminSystemLogColMessage: 'Thông điệp',
    adminSystemLogColBookingId: 'bookingId',
    adminSystemLogColOwnerId: 'ownerId',
    adminSystemLogColSnapshot: 'Snapshot',
    adminSystemLogColCopy: 'Sao chép',
    adminSystemLogEmpty: 'Không có log.',
    adminSystemLogLinkSettlements: 'Quyết toán',
    adminSystemLogSettlementsSearchHint: 'Dán ID vào ô tìm quyết toán',
    adminSystemLogCopyRowTitle: 'Sao chép dòng',
    adminSystemLogFooterNote:
      'Dán bookingId vào tìm kiếm quyết toán/hợp đồng. Phân tích: xuất CSV (không chia sẻ dữ liệu nhạy cảm).',
    adminPropertyLogsTitle: 'Lịch sử xóa/hủy tin',
    adminPropertyLogsIntro: 'Sổ cái server — DELETED và CANCELLED',
    adminPropertyLogsTabAll: 'Tất cả',
    adminPropertyLogsTabDeleted: 'Xóa vĩnh viễn',
    adminPropertyLogsTabCancelled: 'Hủy đặt',
    adminPropertyLogsColTime: 'Thời gian',
    adminPropertyLogsColType: 'Loại',
    adminPropertyLogsColPropertyId: 'propertyId',
    adminPropertyLogsColOwnerId: 'ownerId',
    adminPropertyLogsColRecorder: 'Người ghi',
    adminPropertyLogsColReservation: 'reservation',
    adminPropertyLogsColNote: 'Ghi chú',
    adminPropertyLogsEmpty: 'Không có bản ghi.',
    adminAccountsTitle: 'Tài khoản admin',
    adminAccountsIntro: 'Chỉ super · click tài khoản để sửa id, nickname, mật khẩu, quyền',
    adminAccountsNewButton: 'Admin mới',
    adminAccountsFormNewTitle: 'Tài khoản mới',
    adminAccountsLabelUsername: 'Tên đăng nhập',
    adminAccountsLabelNickname: 'Biệt danh',
    adminAccountsNicknamePlaceholder: 'Tên hiển thị',
    adminAccountsPasswordMin: 'Mật khẩu (≥8 ký tự)',
    adminAccountsCreateSuper: 'Tạo super admin',
    adminAccountsCreateSubmit: 'Tạo',
    adminAccountsListTitle: 'Danh sách',
    adminAccountsRoleSuper: 'Super',
    adminAccountsRoleNormal: 'Thường',
    adminAccountsSelectPrompt: 'Chọn tài khoản bên trái.',
    adminAccountsProfileToggle: 'Thông tin tài khoản',
    adminAccountsProfileExpand: 'Mở rộng',
    adminAccountsProfileCollapse: 'Thu gọn',
    adminAccountsProfileNote: 'Chỉ super sửa id, nickname, mật khẩu tại đây.',
    adminAccountsEditNickname: 'Biệt danh',
    adminAccountsEditUsername: 'Tên đăng nhập',
    adminAccountsEditNewPassword: 'Mật khẩu mới (để trống giữ nguyên)',
    adminAccountsEditCurrentPassword: 'Mật khẩu hiện tại',
    adminAccountsSaveProfile: 'Lưu hồ sơ',
    adminAccountsSaving: 'Đang lưu…',
    adminAccountsRolesHeading: 'Vai trò · quyền',
    adminAccountsSuperAllMenus: 'Super truy cập mọi menu.',
    adminAccountsDemoteSuper: 'Hạ xuống admin thường',
    adminAccountsSuperCheckbox: 'Super admin',
    adminAccountsPermHint: 'Mục được chọn hiện trên nav.',
    adminAccountsSavePerms: 'Chỉ lưu quyền',
    adminAccountsSelfPermNote: 'Không sửa quyền menu của chính mình tại đây.',
    adminNavDashboard: 'Dashboard',
    adminNavUsers: 'Tài khoản',
    adminNavProperties: 'Tin',
    adminNavPropertyLogs: 'Lịch sử tin',
    adminNavContracts: 'Hợp đồng',
    adminNavSettlements: 'Quyết toán',
    adminNavRefunds: 'Hoàn tiền',
    adminNavWithdrawals: 'Rút tiền',
    adminNavAudit: 'Kiểm toán',
    adminNavKyc: 'KYC',
    adminNavSystemLog: 'Nhật ký HT',
    adminHomeTitle: 'Bảng điều khiển quản trị',
    adminHomeSubtitle:
      'Dùng menu bên dưới hoặc thanh trên để mở màn hình công việc.',
    adminNavMenuAriaLabel: 'Menu quản trị',
    adminNavBadgeAria: '{{count}} thông báo',
    adminNavDescUsers: 'Chặn, khôi phục và tìm kiếm',
    adminNavDescProperties: 'Ẩn và khôi phục',
    adminNavDescPropertyLogs: 'Nhật ký xóa/hủy máy chủ',
    adminNavDescContracts: 'Ký kết & đặt lịch bắt đầu thuê',
    adminNavDescSettlements: 'Phê duyệt phản ánh sẵn sàng rút tiền',
    adminNavDescRefunds: 'Hoàn tiền khi hủy',
    adminNavDescWithdrawals: 'Xử lý yêu cầu rút tiền',
    adminNavDescAudit: 'Nhật ký tiền & thao tác',
    adminNavDescKyc: 'Xác minh danh tính & kiểm duyệt',
    adminNavDescSystemLog: 'Lỗi client, cảnh báo & thông tin không lưu',
    adminLoginTitle: 'Đăng nhập admin',
    adminLoginSubtitle: '500 STAY Admin · PC',
    adminLoginUsernameLabel: 'Tên đăng nhập',
    adminLoginPasswordLabel: 'Mật khẩu',
    adminLoginSubmit: 'Đăng nhập',
    adminLoginError: 'Sai tài khoản hoặc mật khẩu. (Kiểm tra log server nếu DB lỗi)',
    adminLoginBootstrapNote:
      'Lần đầu: đăng nhập bằng ADMIN_BOOTSTRAP_* hoặc NEXT_PUBLIC_ADMIN_* để tạo super trong DB.',
    adminLoginHomeLink: 'Về trang chủ',
    adminNoAccessTitle: 'Không có menu',
    adminNoAccessBodyWithUser:
      'Tài khoản {{username}} chưa có quyền. Liên hệ super admin.',
    adminNoAccessBodyGeneric: 'Liên hệ super admin để được cấp quyền.',
    adminNoAccessLogout: 'Đăng xuất và đăng nhập tài khoản khác',
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
    dateBadgeRangeTemplate: '{{start}} ~ {{end}}',
    dateBadgeFromTemplate: 'Từ {{date}}',
    searchButton: 'Tìm kiếm',
    noResultsFound: 'Không tìm thấy kết quả.',
    propertiesFound: ' bất động sản.',
    minExceedsMaxError: 'Giá tối thiểu không được vượt quá giá tối đa. Vui lòng sửa.',
    maxBelowMinError: 'Giá tối đa không được thấp hơn giá tối thiểu. Vui lòng sửa.',
    searchFilterPriceRangeLabel: 'Khoảng giá',
    searchFilterFacilityPickHeading: 'Chọn tiện ích',
    searchPriceRangeDragHint: 'Kéo để điều chỉnh khoảng giá',
    searchRentPerWeekFragment: 'mỗi tuần',
    chatSendingMessage: 'Đang gửi tin nhắn...',
    chatInputInProgressStatus: 'Đang nhập...',
    signupErrorRequiredFields: 'Vui lòng điền đầy đủ các trường bắt buộc.',
    signupErrorInvalidEmailFormat: 'Vui lòng nhập địa chỉ email hợp lệ.',
    signupErrorPasswordMismatch: 'Mật khẩu không khớp.',
    signupErrorPasswordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự.',
    signupErrorPhoneVerificationRequired: 'Vui lòng hoàn tất xác minh số điện thoại.',
    signupErrorOtpSendFailed: 'Không gửi được mã xác minh. Vui lòng thử lại sau.',
    signupErrorOtpSendSystem: 'Đã xảy ra lỗi khi gửi mã xác minh.',
    signupErrorOtpInvalidCode: 'Mã xác minh không đúng.',
    signupErrorOtpVerifyFailed: 'Đã xảy ra lỗi khi xác minh.',
    signupErrorFailedGeneric: 'Đăng ký thất bại.',
    signupErrorUnexpected: 'Đã xảy ra lỗi không mong muốn.',
    signupErrorSocialLoginFailed: 'Đăng nhập mạng xã hội thất bại.',
    uiTranslateButtonLoading: 'Đang dịch...',
    uiTranslateViewOriginal: 'Xem bản gốc',
    uiTranslateShowTranslation: 'Dịch',
    emailWelcomeTitle: '[500 STAY VN] Chào mừng bạn',
    emailWelcomeBody:
      'Xin chào {{name}},\n\nCảm ơn bạn đã tham gia 500 STAY VN — nền tảng cung cấp thông tin cho thuê lưu trú.\nHãy tìm chỗ ở, đặt phòng và trò chuyện với chủ nhà trong ứng dụng.\n\nĐây là email tự động, vui lòng không trả lời.',
    emailBookingConfirmedGuestTitle: '[500 STAY VN] Đặt phòng đã được xác nhận',
    emailBookingConfirmedGuestBody:
      'Xin chào {{guestName}},\n\nĐặt phòng của bạn đã được xác nhận.\nMã đặt phòng: {{bookingId}}\nChỗ ở: {{propertyTitle}}\nNhận phòng: {{checkIn}} / Trả phòng: {{checkOut}}\n\nXem chi tiết trong mục Đặt phòng trên ứng dụng.',
    emailBookingConfirmedHostTitle: '[500 STAY VN] Đặt phòng mới đã được xác nhận',
    emailBookingConfirmedHostBody:
      'Xin chào {{hostName}},\n\nĐặt phòng của khách {{guestName}} đã được xác nhận.\nMã đặt phòng: {{bookingId}}\nChỗ ở: {{propertyTitle}}\nNhận phòng: {{checkIn}} / Trả phòng: {{checkOut}}\n\nVui lòng kiểm tra lịch và tin nhắn trong ứng dụng.',
    emailBookingCancelledGuestTitle: '[500 STAY VN] Đặt phòng đã bị hủy',
    emailBookingCancelledGuestBody:
      'Xin chào {{guestName}},\n\nĐặt phòng sau đây đã được hủy.\nMã đặt phòng: {{bookingId}}\nChỗ ở: {{propertyTitle}}\n\nNếu cần hỗ trợ, vui lòng liên hệ qua kênh hỗ trợ trong ứng dụng.',
    emailOtpCodeTitle: '[500 STAY VN] Mã xác minh',
    emailOtpCodeBody:
      'Mã xác minh của bạn: {{code}}\n\nMã có hiệu lực trong {{minutes}} phút.\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.',
    emailPasswordResetTitle: '[500 STAY VN] Đặt lại mật khẩu',
    emailPasswordResetBody:
      'Để đặt lại mật khẩu, nhấp vào liên kết sau:\n{{resetLink}}\n\nLiên kết có hiệu lực trong {{hours}} giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.',
    emailVerifyEmailTitle: '[500 STAY VN] Xác minh email',
    emailVerifyEmailBody:
      'Để xác minh địa chỉ email, nhấp vào liên kết sau:\n{{verifyLink}}\n\nNếu bạn không tạo tài khoản, vui lòng bỏ qua email này.',
    emailHostNewBookingRequestTitle: '[500 STAY VN] Yêu cầu đặt phòng mới',
    emailHostNewBookingRequestBody:
      'Xin chào {{hostName}},\n\n{{guestName}} đã gửi yêu cầu đặt phòng.\nChỗ ở: {{propertyTitle}}\nMong muốn nhận phòng: {{checkIn}} / Trả phòng: {{checkOut}}\n\nVui lòng chấp nhận hoặc từ chối trong ứng dụng.',
    emailPayoutProcessedTitle: '[500 STAY VN] Thông báo thanh toán',
    emailPayoutProcessedBody:
      'Xin chào {{name}},\n\nYêu cầu thanh toán của bạn đã được xử lý.\nSố tiền: {{amount}} {{currency}}\n\nChi tiết có trong mục Thanh toán trên ứng dụng.',
    emailGenericFooterNotice:
      '500 STAY VN cung cấp thông tin và công cụ liên lạc cho thuê lưu trú ngắn hạn; chúng tôi không phải bên trong hợp đồng giữa người dùng.',
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
    incomeStatusRevenueConfirmed: 'Đã xác nhận doanh thu',
    incomeStatusSettlementRequest: 'Chờ duyệt yêu cầu',
    incomeStatusSettlementPending: 'Chờ duyệt xếp hàng',
    incomeStatusSettlementApproved: 'Đã quyết toán',
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
    fullNamePlaceholder: 'Nhập họ tên thật',
    signupOtpVerify: 'Xác minh',
    phoneVerificationComplete: 'Đã xác minh số điện thoại',
    confirmPasswordLabel: 'Xác nhận mật khẩu',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu',
    otpCodePlaceholder: 'Mã 6 chữ số',
    deleteAccountTitle: 'Hướng dẫn xóa tài khoản',
    deleteAccountIntro:
      'Nếu bạn muốn xóa tài khoản, vui lòng liên hệ qua email bên dưới.',
    deleteAccountFooterNote:
      'Khi liên hệ, vui lòng cung cấp thông tin tài khoản và lý do xóa để chúng tôi xử lý nhanh hơn.',
    legalFooterTerms: 'Điều khoản dịch vụ',
    legalFooterPrivacy: 'Chính sách bảo mật',
    legalFooterDeleteAccount: 'Xóa tài khoản',
    legalFooterNavAriaLabel: 'Pháp lý',
    toastHeadingSuccess: 'Hoàn tất',
    toastHeadingInfo: 'Thông báo',
    propertyNotFound: 'Không tìm thấy bất động sản.',
    bookPropertyTitle: 'Đặt phòng',
    nightShort: ' đêm',
    bookingDatesLoadError: 'Không thể tải thông tin ngày',
    guestInfoSectionTitle: 'Thông tin người đặt',
    bookingGuestNamePlaceholder: 'Họ tên',
    agreeTermsPrivacyBooking: 'Đồng ý điều khoản và thu thập thông tin cá nhân (bắt buộc)',
    proceedToPaymentStep: 'Đi tới bước thanh toán',
    selectPaymentMethod: 'Chọn phương thức thanh toán',
    priceBreakdown: 'Chi tiết thanh toán',
    perWeekSlash: ' /tuần',
    petsShort: 'Thú cưng',
    petCountClassifier: ' con',
    perPetPerWeekSlash: ' /con/tuần',
    bookingServiceFee: 'Phí dịch vụ',
    totalAmountLabel: 'Tổng cộng',
    agreePaymentTermsCheckbox: 'Tôi đồng ý với điều khoản và điều kiện thanh toán. (Bắt buộc)',
    payNow: 'Thanh toán',
    processingInProgress: 'Đang xử lý...',
    bookingDetailTitle: 'Chi tiết đặt phòng',
    paymentCompleteTitle: 'Thanh toán thành công!',
    waitingHostApproval: 'Đang chờ chủ nhà phê duyệt.',
    notifyWhenApprovedShort: 'Chúng tôi sẽ thông báo khi được phê duyệt.',
    bookingSuccessGotIt: 'Đã hiểu',
    bookingNumberLabel: 'Mã đặt phòng',
    copyButton: 'Sao chép',
    copiedButton: 'Đã sao chép',
    bookingBadgeConfirmed: 'Đã xác nhận',
    bookingBadgeCancelled: 'Đã hủy',
    bookingBadgePending: 'Chờ phê duyệt',
    propertyInfoHeading: 'Thông tin chỗ ở',
    bookingDetailSectionTitle: 'Chi tiết đặt phòng',
    bookerFieldLabel: 'Người đặt',
    phoneFieldLabel: 'Số điện thoại',
    stayNightsUnit: ' đêm',
    specialRequestsHeading: 'Yêu cầu đặc biệt',
    weeklyPriceShort: 'giá/tuần',
    petFeeShortLabel: 'con',
    totalPaymentHeading: 'Tổng số tiền',
    paymentStatusPaidLabel: 'Đã thanh toán',
    paymentStatusPendingLabel: 'Chờ thanh toán',
    backToHomeButton: 'Về trang chủ',
    viewBookingsHistoryButton: 'Xem lịch sử đặt phòng',
    bookingSuccessLoadFailed:
      'Không tải được thông tin đặt phòng. Vui lòng kiểm tra lại trong mục đặt chỗ.',
    bookingSuccessBookingIdMissing: 'Thiếu mã đặt phòng.',
    bookingSuccessCopyOk: 'Đã sao chép mã đặt phòng.',
    bookingSuccessCopyFail:
      'Sao chép thất bại. Vui lòng chọn và sao chép thủ công.',
    priceUnitVndSuffix: 'VND',
    reservationCancelRelistMerged:
      'Khoảng thời gian đã hủy đã được gộp với bài đăng đang hoạt động. Số lượng bài đăng không thay đổi.',
    reservationCancelRelistRelisted:
      'Đặt chỗ đã hủy. Bất động sản đã được đăng quảng cáo lại.',
    reservationCancelRelistLimitExceeded:
      'Đặt chỗ đã hủy. Vui lòng đăng ký lại trong tab Chờ quảng cáo.',
    reservationCancelRelistShortTerm:
      'Đặt chỗ đã hủy và chuyển sang tab Chờ quảng cáo. Chỉnh sửa ngày rồi đăng lại.',
    reservationStatusUpdateError:
      'Đã xảy ra lỗi khi cập nhật trạng thái đặt phòng.',
    hostReservationRecordDeleteConfirm:
      'Bạn có muốn xóa vĩnh viễn bản ghi này không?',
    hostReservationRecordDeleteError: 'Đã xảy ra lỗi khi xóa bản ghi.',
    hostReservationLabelCompleted: 'Hoàn tất đặt chỗ',
    paymentMethodLabelMomo: 'MoMo',
    paymentMethodLabelZalopay: 'ZaloPay',
    paymentMethodLabelBankTransfer: 'Chuyển khoản',
    paymentMethodLabelPayAtProperty: 'Thanh toán tại chỗ',
    bookingDetailsPaymentHeading: 'Thanh toán',
    bookingDetailsPayMethodRowLabel: 'Phương thức',
    bookingDetailsAccommodationLine: 'Giá phòng',
    bookingDetailsFeesVatLine: 'Phí & VAT',
    bookingDetailsTotalRow: 'Tổng cộng',
    bookingWeeksUnit: ' tuần',
    hostBookingCardStatusPending: 'Yêu cầu đặt phòng',
    hostBookingCardStatusConfirmed: 'Đặt phòng đã xác nhận',
    hostBookingCardStatusRequestCancelled: 'Yêu cầu đã hủy',
    hostBookingCardStatusBookingCancelled: 'Đặt phòng đã hủy',
    myPropertiesPendingEndAdTitle: 'Chuyển sang đã tạm dừng',
    myPropertiesPendingEndAdDesc:
      'Tin sẽ chuyển sang mục đã tạm dừng. Dữ liệu được giữ.',
    myPropertiesDuplicateLiveTitle: 'Cùng một BĐS đang được hiển thị',
    myPropertiesDuplicateLiveHint:
      'Có: mở chỉnh sửa tin đang hiển thị, chọn lại ngày trên lịch. Không: ở lại danh sách.',
    dialogNo: 'Không',
    dialogYes: 'Có',
    hostCancelModalTitle: 'Xác nhận hủy',
    hostCancelModalAckLabel: 'Tôi đã xác nhận nội dung.',
    hostBookingConfirmToastOk: 'Đã xác nhận đặt phòng.',
    hostBookingConfirmToastErr: 'Xác nhận thất bại.',
    hostBookingChatOpenErr: 'Không thể mở phòng chat.',
    hostBookingRejectToastListingOk: 'Đã cập nhật trạng thái tin đăng.',
    hostBookingRejectToastErr: 'Từ chối thất bại.',
    hostBookingDeleteConfirm: 'Xóa đặt phòng này?',
    hostBookingDeleteOk: 'Đã xóa đặt phòng.',
    hostBookingDeleteErr: 'Xóa thất bại.',
    hostBookingCancelReasonByOwner: 'Chủ nhà từ chối/hủy',
    reservationServerTimeDetail: 'Không thể xác minh thời gian máy chủ. Vui lòng thử lại sau.',
    hostManageBookedPropertiesTitle: 'Quản lý đặt phòng',
    hostTabBookedProperties: 'Đặt phòng',
    hostTabCompletedReservations: 'Hoàn thành',
    emptyNoActiveReservations: 'Không có đặt phòng nào.',
    emptyNoCompletedReservations: 'Không có đặt phòng hoàn thành nào.',
    tenantInfoHeading: 'Thông tin người thuê',
    confirmReservationBtn: 'Xác nhận đặt phòng',
    markStayCompletedBtn: 'Hoàn thành đặt phòng',
    deleteHistoryRecordTitle: 'Xóa bản ghi',
    hostApproveBooking: 'Chấp nhận',
    cancelPolicyAgreeRequired: 'Vui lòng đồng ý chính sách hủy.',
    bookingCancelledToast: 'Đã hủy đặt phòng.',
    bookingCancelFailed: 'Hủy thất bại.',
    confirmDeleteBookingRecord: 'Xóa mục đặt phòng này?',
    bookingDeletedToast: 'Đã xóa.',
    bookingDeleteFailed: 'Xóa thất bại.',
    checkInOutScheduleTitle: 'Giờ check-in/check-out',
    importExternalCalendar: 'Đồng bộ lịch ngoài',
    calendarPlatformLabel: 'Nền tảng',
    calendarOptionNone: 'Không chọn',
    calendarOptionOther: 'Khác',
    calendarNameLabel: 'Tên lịch',
    calendarNamePlaceholderExample: 'VD: Airbnb',
    removeAddressAriaLabel: 'Xóa địa chỉ',
    backNavLabel: 'Quay lại',
    kycFirebasePhoneTitle: 'Xác thực số điện thoại bằng Firebase',
    kycFirebasePhoneSubtitle: 'Xác thực số điện thoại an toàn qua Google Firebase',
    kycPhoneVerificationHeading: 'Xác thực số điện thoại',
    kycPhoneVerificationForHostDesc: 'Vui lòng xác thực số điện thoại để xác nhận chủ nhà',
    kycPhoneVerifiedLong: '✅ Xác thực số điện thoại đã hoàn tất.',
    kycNextStep: 'Tiếp theo',
    kycTestModeProceed: 'Tiếp theo (chế độ thử nghiệm)',
    calWarnTitleOwner: 'Không thể đặt thời gian',
    calWarnTitleGuest: 'Không thể đặt phòng',
    calWarnMinSevenBody: 'Chỉ có thể đặt phòng tối thiểu 7 ngày. Từ ngày đã chọn đến ngày kết thúc thuê còn dưới 7 ngày, vui lòng chọn ngày khác.',
    calSelectRentalStart: 'Chọn ngày bắt đầu thuê',
    calSelectRentalEnd: 'Chọn ngày kết thúc thuê',
    calSelectCheckIn: 'Chọn ngày nhận phòng',
    calSelectCheckOut: 'Chọn ngày trả phòng',
    calOwnerLegendSelectableStart: 'Có thể chọn làm ngày bắt đầu',
    calOwnerLegendSelectedStart: 'Ngày bắt đầu đã chọn',
    calOwnerLegendEndHint: 'Ngày kết thúc (bội 7 ngày, tối đa ~3 tháng)',
    calOwnerLegendWithinPeriod: 'Trong thời gian thuê (nhấp để đổi ngày bắt đầu)',
    calOwnerLegendOtherDates: 'Ngày khác (nhấp để đổi ngày bắt đầu)',
    calOwnerSelectStartFirst: 'Vui lòng chọn ngày bắt đầu trước',
    calGuestLegendAvailable: 'Ngày có thể chọn',
    calGuestLegendMinSeven: 'Tối thiểu 7 đêm, trừ ngày đã đặt',
    calGuestLegendBooked: 'Đã được đặt / Không thể đặt',
    calGuestLegendCheckoutOk: 'Ngày trả phòng (Có thể nhận phòng)',
    calGuestLegendCheckoutDayAbbr: 'TRẢ',
    calGuestLegendShortStayDemoDay: '31',
    calGuestLegendShortStay: 'Thời gian còn lại dưới 7 ngày (Không thể nhận phòng)',
    calGuestLegendCheckinToEnd: 'Đến ngày kết thúc phòng',
    calGuestLegendValidCheckout: 'Trả phòng hợp lệ (≥7 đêm)',
    calGuestSelectCheckInFirst: 'Vui lòng chọn ngày nhận phòng trước',
    weeklyCostLabel: '/ tuần',
    bookingOccupancyLabel: 'Số khách',
    importExternalCalendarHelp:
      'Đồng bộ đặt phòng từ Airbnb, Agoda,... với 500stay. Nhập URL iCal (.ics).',
    carouselPrevious: 'Trước',
    carouselNext: 'Sau',
    translationConsentTitle: 'Bạn có muốn dùng tính năng dịch không?',
    translationConsentDescription:
      'Để dùng tính năng dịch, bạn cần đồng ý. Công cụ trên thiết bị có thể hoạt động cả khi ngoại tuyến.',
    translationConsentAgree: 'Đồng ý và tiếp tục',
    translationConsentDecline: 'Từ chối',
    translationLangPackTitle: 'Tải công cụ dịch',
    translationLangPackDescription:
      'Để sử dụng dịch, cần tải công cụ dịch tích hợp (gói ngôn ngữ). Nếu từ chối, lần sau khi nhấn "Dịch" bạn sẽ được nhắc tải lại. Cần khoảng 50MB dung lượng và nên dùng Wi-Fi.',
    translationLangPackAgree: 'Tải xuống và tiếp tục',
    translationLangPackDecline: 'Để sau',
    translationModalEngineLine: 'Công cụ sử dụng: {{engine}}',
    translationModalWebRequiresNetwork: 'Cần kết nối internet.',
    translationModalOfflineCapable: 'Có thể dùng ngoại tuyến.',
    translationLangPackStorageTitle: 'Dung lượng cần: khoảng 50MB',
    translationLangPackStorageHint:
      'Nên dùng Wi-Fi. Sau khi tải có thể dùng ngoại tuyến.',
    translationFooterConsentPrivacy:
      'Bằng việc đồng ý, bạn được coi là chấp nhận chính sách quyền riêng tư.',
    translationFooterLangPackDevice: 'Gói ngôn ngữ được tải vào bộ nhớ thiết bị.',
    chatTranslatedByGemini: 'Bản dịch tự động bằng Gemini AI.',
    chatTranslatedByDevice: 'Bản dịch tự động bằng công cụ trên thiết bị.',
    chatTranslationErrorLabel: 'Lỗi dịch',
    chatTranslateShowOriginalTitle: 'Xem bản gốc',
    chatTranslateShowTranslatedTitle: 'Xem bản dịch',
    chatTranslating: 'Đang dịch',
    chatExampleTitle: 'Ví dụ tin nhắn chat',
    chatExampleHowToTitle: 'Cách dùng',
    chatExampleBullet1: 'Mỗi tin có nút dịch ở góc dưới bên phải.',
    chatExampleBullet2: 'Tin tiếng Việt có thể dịch sang ngôn ngữ giao diện của bạn.',
    chatExampleBullet3: 'Tin ngôn ngữ khác có thể dịch sang tiếng Việt hoặc ngược lại tùy cài đặt.',
    chatExampleBullet4: 'Sau khi dịch, dùng "Xem bản gốc" để chuyển qua lại.',
    chatExampleBullet5: 'Nội dung dịch được lưu cache để dùng lại.',
    chatExampleDemoGuestName: 'Minh Anh',
    chatExampleDemoHostName: 'Chủ nhà',
    chatExampleDemoTime1: '14:30',
    chatExampleDemoTime2: '14:32',
    chatExampleDemoTime3: '14:35',
    chatExampleDemoMsgHostReply:
      'Xin chào, có thể đặt phòng từ 15 đến 22/2. Tôi có thể gửi thêm chi tiết.',
    propertyImageAltFallback: 'Ảnh phòng',
    propertyFavoriteButtonAria: 'Yêu thích',
    carouselSlideSelectAria: 'Chuyển đến slide {{n}}',
    trustSignalKycTitle: 'Chủ nhà xác thực',
    trustSignalKycDesc: 'Đã xác minh danh tính',
    trustSignalLanguagesTitle: '5 ngôn ngữ',
    trustSignalLanguagesDesc: 'KO/VI/EN/JA/ZH',
    trustSignalChatTitle: 'Chat trực tiếp',
    trustSignalChatDesc: 'Chat ngay với chủ nhà',
    trustSignalBookingTitle: 'Xác nhận ngay',
    trustSignalBookingDesc: 'Phê duyệt nhanh chóng',
    propertyDescriptionTranslateError: 'Đã xảy ra lỗi khi dịch.',
    propertyDescExampleTitle: 'Ví dụ mô tả phòng',
    propertyDescHowToTitle: 'Cách dùng',
    propertyDescBullet1: 'Mặc định hiển thị bản gốc tiếng Việt.',
    propertyDescBullet2: 'Nhấn "Dịch" để xem bản dịch.',
    propertyDescBullet3: 'Lần đầu có thể hiện hộp thoại đồng ý.',
    propertyDescBullet4: 'Trên app native có thể cần tải gói ngôn ngữ.',
    propertyDescBullet5: 'Sau khi dịch, dùng "Xem bản gốc" để chuyển.',
    uiTranslateGenericFail: 'Dịch thất bại. Vui lòng thử lại sau.',
    uiTranslatedBadge: 'Đã dịch',
    uiTranslateReset: 'Đặt lại',
    uiTranslateCostSavingHint:
      'Chỉ dịch khi cần để tiết kiệm. Nội dung giống nhau được lưu cache.',
    chatSendFailed: 'Gửi tin nhắn thất bại.',
    chatRoleTenant: 'Người thuê',
    chatRoleLandlord: 'Chủ nhà',
    chatViewListing: 'Xem phòng',
    chatViewListingDetail: 'Xem chi tiết →',
    chatResidencyNoticeTitle: 'Lưu ý quan trọng!',
    chatResidencyNoticeBody:
      'Đừng quên đăng ký tạm trú nhé! Đây là quy định bắt buộc để đảm bảo quyền lợi và an toàn cho bạn ✈️',
    chatScrollOlderMessages: 'Cuộn lên để xem tin cũ hơn',
    chatBookingNoticeTitle: 'Thông báo xác nhận',
    chatBookingNoticeBody:
      'Để có một kỳ nghỉ an toàn, vui lòng thực hiện đăng ký tạm trú ngay sau khi nhận phòng.',
    chatEmptyState: 'Gửi tin nhắn để bắt đầu trò chuyện',
    chatReadReceipt: 'Đã xem',
    chatSystemPeerJoined: 'Đối phương đã vào phòng chat',
    chatSystemImageSent: 'Đã gửi hình ảnh',
    chatInputPlaceholder: 'Nhập tin nhắn...',
    chatInputPlaceholderFull: 'Nhập tin nhắn...',
    settlementProcessHaltedDetail:
      'Đã tạm dừng quy trình thanh toán. Vui lòng thử lại sau.',
    settlementEmptyRevenueList:
      'Chưa có đặt phòng đã thanh toán sau thời gian nhận phòng.',
    settlementNoWithdrawalHistory: 'Chưa có lịch sử rút tiền.',
    settlementNoBankAccounts: 'Chưa có tài khoản đăng ký.',
    withdrawalValidateAmount: 'Vui lòng nhập số tiền rút.',
    withdrawalSelectBankRequired: 'Vui lòng chọn tài khoản.',
    withdrawalRequestFailedMessage: 'Yêu cầu rút tiền thất bại.',
    withdrawalSubmittedSuccess: 'Yêu cầu rút tiền đã được gửi.',
    bankAccountFormIncomplete: 'Vui lòng nhập đầy đủ thông tin tài khoản.',
    bankAccountAddFailed: 'Đăng ký tài khoản thất bại.',
    bankAccountAddedSuccess: 'Tài khoản đã được thêm.',
    withdrawalStatusHeld: 'Tạm giữ',
    withdrawalStatusRejected: 'Từ chối',
    profileKycCoinsProgress: 'Coin {n}/3',
    profileKycEncourageWithCount:
      'Hoàn thành xác thực KYC để thu thập 3 coin! (Hiện tại {n}/3)',
    deleteAccountButton: 'Rút tài khoản',
    deleteAccountExecuting: 'Đang xử lý...',
    phoneVerificationRequired: 'Vui lòng xác thực số điện thoại.',
    langEndonymKo: '한국어',
    langEndonymVi: 'Tiếng Việt',
    langEndonymEn: 'English',
    langEndonymJa: '日本語',
    langEndonymZh: '中文',
    kycHostVerificationTitle: 'Xác thực chủ nhà',
    kycCompleteThreeStepSubtitle: 'Vui lòng hoàn tất 3 bước xác thực',
    kycProgressLoadError:
      'Không tải được tiến trình xác thực. Vui lòng làm mới và thử lại.',
    kycStepFailedGeneric: 'Không hoàn tất bước KYC.',
    kycIdDocumentStepTitle: 'Chụp ảnh giấy tờ',
    kycFaceVerificationStepTitle: 'Xác thực khuôn mặt',
    kycStep2CompleteTitle: 'Hoàn thành bước 2',
    kycStep2CompleteBody:
      'Thông tin giấy tờ đã được tiếp nhận an toàn. Vui lòng tiếp tục bước 3 xác thực khuôn mặt.',
    kycTestModeBannerTitle: 'Đang ở chế độ thử nghiệm',
    kycTestModeFaceSubtitle: 'Có thể hoàn thành xác thực mà không cần chụp ảnh',
    kycTestModeIdSubtitle:
      'Có thể chuyển bước tiếp theo mà không cần chụp ảnh',
    kycFaceFiveDirectionInstruction:
      'Vui lòng thực hiện chụp ảnh khuôn mặt 5 hướng',
    kycStartCapture: 'Bắt đầu chụp ảnh',
    kycFaceCaptureSessionTitle: 'Chụp ảnh khuôn mặt',
    kycMultistepProgress: 'Bước {current}/{total}',
    kycCameraErrorTitle: 'Lỗi camera',
    kycStopCapture: 'Dừng chụp ảnh',
    kycCaptureCompleteTitle: 'Hoàn thành chụp ảnh',
    kycReviewCapturedImagesFace: 'Vui lòng xác nhận hình ảnh đã chụp',
    kycRetakePhotos: 'Chụp lại',
    kycCompleteVerification: 'Hoàn thành xác thực',
    kycAiAnalyzingTitle: 'Đang phân tích AI',
    kycAiAnalyzingDesc: 'Đang phân tích dữ liệu xác thực khuôn mặt...',
    kycIdSelectTypeAndCapture:
      'Chọn loại giấy tờ và chụp ảnh bằng camera',
    kycCameraOpenIdCard: 'Bật camera (CMND/CCCD)',
    kycCameraOpenPassport: 'Bật camera (Hộ chiếu)',
    kycIdCaptureTitleFrontIdCard: 'Chụp mặt trước CMND/CCCD',
    kycIdCaptureTitleFrontPassport: 'Chụp trang thông tin hộ chiếu',
    kycIdCaptureTitleBack: 'Chụp mặt sau CMND/CCCD',
    kycIdAlignInGuide: 'Vui lòng chụp ảnh giấy tờ theo đường viền hướng dẫn',
    kycIdPlaceInFrame: 'Đặt giấy tờ vào đường viền hướng dẫn',
    kycIdFullDocumentVisible: 'Đảm bảo toàn bộ giấy tờ được hiển thị',
    kycImageConfirmTitle: 'Xác nhận hình ảnh',
    kycImageConfirmDesc: 'Vui lòng xác nhận hình ảnh đã chụp',
    kycIdSideFront: 'Mặt trước',
    kycIdSideBack: 'Mặt sau',
    kycShootBackSide: 'Chụp mặt sau',
    kycRetakeCapture: 'Chụp lại',
    kycFormTitleEnterIdInfo: 'Nhập thông tin giấy tờ',
    kycFormDescEnterIdInfo: 'Vui lòng nhập thông tin trên giấy tờ',
    kycFormIdNumberLabel: 'Số giấy tờ',
    kycFormDateOfBirthLabel: 'Ngày sinh',
    kycFormIssueDateLabel: 'Ngày cấp',
    kycFormExpiryDateLabel: 'Ngày hết hạn',
    kycFormNextStep: 'Bước tiếp theo',
    kycFormRequiredFieldsMissing: 'Vui lòng điền đầy đủ các trường bắt buộc',
    kycFormImageRequired: 'Vui lòng chọn hình ảnh',
    kycCaptureCanvasError: 'Không thể tạo canvas',
    kycCaptureFailedGeneric: 'Chụp ảnh thất bại',
    cameraErrPermissionDenied:
      'Quyền camera bị từ chối. Hãy bật camera trong cài đặt thiết bị rồi thử lại.',
    cameraErrNotFound: 'Không tìm thấy camera khả dụng.',
    cameraErrGeneric: 'Lỗi camera: {{detail}}',
    apiSyncErrorTransient:
      'Lỗi tạm thời. Kiểm tra kết nối Internet và thử lại sau.',
    userFacingAuthOrSessionError:
      'Đã xảy ra lỗi. Thử lại sau hoặc kiểm tra trạng thái đăng nhập.',
    bookingCreateFailedMessage:
      'Không tạo được đặt phòng. Vui lòng thử lại sau.',
    bookingPaymentCompleteFailedMessage:
      'Không hoàn tất thanh toán. Vui lòng kiểm tra mạng và thử lại.',
    bookingPaymentMetaDefaultError:
      'Không thể đồng bộ thông tin thanh toán lên máy chủ. Vui lòng thử lại sau.',
    bookingPaymentMetaCreateError:
      'Không đăng ký được meta thanh toán. Đặt phòng đã tạo nhưng hãy tải lại trước khi thanh toán hoặc liên hệ hỗ trợ.',
    bookingPaymentToastRefundCancelledBody:
      'Theo cập nhật thanh toán (hoàn tiền), đặt phòng đã bị hủy. Kiểm tra trạng thái trong mục Đặt phòng của tôi.',
    bookingPaymentToastConfirmedBody:
      'Thanh toán hoàn tất và đặt phòng đã được xác nhận.',
    bookingPaymentToastSyncedBody:
      'Thông tin thanh toán đã được đồng bộ. Xem trạng thái mới nhất trong Đặt phòng của tôi.',
    bookingRefundToastCancelledBody:
      'Hoàn tiền đã được áp dụng và đặt phòng đã hủy (hoàn tiền).',
    bookingRefundToastSyncedBody:
      'Thông tin hoàn tiền đã được đồng bộ lên máy chủ.',
    bookingSyncImmediateFailed:
      'Lưu đặt phòng thất bại. Vui lòng thử lại sau.',
    bookingErrorPaymentNotCompleted: 'Thanh toán chưa hoàn tất.',
    appPaymentErrUnparseableResponse: 'Không thể phân tích phản hồi từ máy chủ.',
    appPaymentErrRejected: 'Yêu cầu đã bị từ chối.',
    appPaymentErrHttpStatus: 'Yêu cầu thất bại (HTTP {{status}})',
    topBarUnreadChatSubtitle: '{n} tin nhắn chưa đọc',
    topBarNoNotifications: 'Không có thông báo mới',
    topBarAriaNotifications: 'Thông báo',
    topBarAriaProfile: 'Menu hồ sơ',
    topBarAriaLogin: 'Đăng nhập',
    adminAccountsListLoadFailed: 'Không tải được danh sách.',
    adminAccountsSaveFailed: 'Lưu thất bại.',
    adminAccountsCreateFailed: 'Tạo tài khoản thất bại.',
    adminAccountsToggleFailed: 'Thay đổi quyền thất bại.',
    apiErrAdminAccountInvalidInput:
      'Kiểm tra tên đăng nhập (3–64 ký tự, chữ/số/._-) và mật khẩu (tối thiểu 8 ký tự).',
    apiErrAdminUsernameTaken: 'Tên đăng nhập có thể đã tồn tại.',
    apiErrAdminUsernameInvalid: 'Định dạng tên đăng nhập không hợp lệ.',
    apiErrAdminUsernameConflict: 'Tên đăng nhập đã được sử dụng.',
    apiErrAdminNewPasswordTooShort: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    apiErrAdminCurrentPasswordInvalid: 'Mật khẩu hiện tại không đúng.',
    apiErrAdminCannotDemoteOwnSuper: 'Bạn không thể gỡ quyền super của chính mình tại đây.',
    apiErrAdminCannotDemoteLastSuper: 'Không thể gỡ quyền super của quản trị viên super cuối cùng.',
    apiErrAdminNoValidUpdates: 'Không có thay đổi hợp lệ.',
    chatDateToday: 'Hôm nay',
    chatDateYesterday: 'Hôm qua',
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
    popularStaysTitle: 'Popular stays',
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
    whereDoYouWantToLive: 'Find short-stay rental listings by area',
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
    loginWrongPassword: 'Incorrect password.',
    loginSocialLoginRequired: 'This account uses social sign-in.',
    loginAccountBlocked: 'This account has been restricted by an administrator.',
    loginNetworkError: 'Network error. Please try again shortly.',
    loginServerUnavailable: 'Cannot reach the server. Please try again shortly.',
    adminUserBlockPrompt: 'Enter a block reason.',
    adminUserBlockDefaultReason: 'Blocked by administrator',
    phoneSendOtpButton: 'Send OTP',
    phoneEnterNumberPlaceholder: 'Enter phone number',
    phoneSelectCountry: 'Select country',
    phoneOtpSentBadge: 'Sent',
    mapErrAwsApiKeyMissing:
      'AWS API key is not set. Check NEXT_PUBLIC_AWS_API_KEY in .env.local.',
    mapErrAwsMapNameMissing:
      'AWS map name is not set. Check NEXT_PUBLIC_AWS_MAP_NAME in .env.local.',
    mapErrLoadGeneric: 'Something went wrong while loading the map.',
    mapErrNetworkAws: 'Network error — could not reach AWS map services.',
    mapErrAwsKeyInvalid: 'AWS API key is invalid. Check your environment variables.',
    mapErrMapNotFound: 'Map resource not found. Check the map name.',
    mapErrStyleLoad: 'Could not load map style. Check API key and map resource name.',
    mapErrorHeading: 'Error',
    mapErrCheckEnvHint: 'Check NEXT_PUBLIC_AWS_API_KEY and NEXT_PUBLIC_AWS_MAP_NAME.',
    legacyNewPropertyPageTitle: 'List a new property',
    legacyNewPropertyFieldTitle: 'Listing title',
    legacyNewPropertyTitlePh: 'e.g. Apt 301, Building A',
    legacyNewPropertyDescVi: 'Description (Vietnamese)',
    legacyNewPropertyAddrVi: 'Address (Vietnamese)',
    legacyNewPropertyGeocoding: 'Resolving coordinates…',
    legacyNewPropertyCoordsOk: 'Coordinates ready',
    legacyNewPropertyAddrPh: 'e.g. District 7, Ho Chi Minh City',
    legacyNewPropertyCoordsLine: 'Coordinates: {{lat}}, {{lng}}',
    legacyNewPropertyPrice: 'Price',
    legacyNewPropertyCurrency: 'Currency',
    legacyNewPropertyArea: 'Area (m²)',
    legacyNewPropertyBedrooms: 'Bedrooms',
    legacyNewPropertyBathrooms: 'Bathrooms',
    legacyNewPropertyCheckIn: 'Check-in time',
    legacyNewPropertyCheckOut: 'Check-out time',
    legacyNewPropertyTimeAfter: 'After {{time}}',
    legacyNewPropertyTimeBefore: 'Before {{time}}',
    legacyNewPropertyCheckInHelp: 'When guests may check in',
    legacyNewPropertyCheckOutHelp: 'When guests must check out',
    legacyNewPropertyCancel: 'Cancel',
    legacyNewPropertySubmit: 'Submit listing',
    legacyNewPropertySubmitting: 'Submitting…',
    legacyNewPropertySuccess: 'Property listed successfully.',
    legacyNewPropertyError: 'Could not list the property.',
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
    searchClearInputAria: 'Clear search',
    locationBadgeCity: 'City',
    locationBadgeDistrict: 'District',
    locationBadgeLandmark: 'Landmark',
    labelCity: 'City',
    labelDistrict: 'District',
    selectDistrictPlaceholder: 'Select district',
    selectCityPlaceholder: 'Select city',
    searchFiltersResetButton: 'Reset filters',
    explorePopularCities: 'Popular areas in Vietnam',
    popularStaysViewMore: 'See more',
    addressPatternTower: '{{name}} Building',
    addressPatternZone: '{{name}} area',
    addressPatternLobby: '{{name}} lobby',
    addressPatternUnit: 'Unit {{name}}',
    adminKycPageTitle: 'KYC data',
    adminKycTotalRecordsTemplate: '{{count}} records',
    adminKycRefreshButton: 'Refresh',
    adminKycLoadingLabel: 'Loading...',
    adminKycEmptyMessage: 'No data',
    adminKycNoNameFallback: 'No name',
    bookingGuestSummaryWithChildren: '{{adults}} adults, {{children}} children',
    bookingGuestSummaryAdultsOnly: '{{adults}} adults',
    searchRoomTypeStudio: 'Studio',
    searchRoomTypeOneRoom: '1 room (bed + living)',
    searchRoomTypeTwoRoom: '2 rooms',
    searchRoomTypeThreePlus: '3+ rooms',
    searchRoomTypeDetached: 'Detached house',
    adminKycStatusVerified: 'Verified',
    adminKycStatusPending: 'Pending review',
    adminKycStatusRejected: 'Rejected',
    adminKycStatusUnverified: 'Unverified',
    adminKycSubtitleNew: '{{count}} new',
    adminKycSubtitleVerified: '{{count}} verified',
    adminKycSubtitleUnverified: '{{count}} unverified',
    adminKycTabNew: 'New',
    adminKycTabAll: 'All',
    adminKycTabVerified: 'Verified',
    adminKycTabUnverified: 'Unverified',
    adminKycColVerificationStatus: 'Verification',
    adminKycColIdDocument: 'ID document',
    adminKycColDateOfBirth: 'Date of birth',
    adminKycIdTypePassportLabel: 'Passport',
    adminKycIdTypeIdCardLabel: 'ID card',
    adminKycMobileIdPrefix: 'ID',
    adminKycMobileDobPrefix: 'DOB',
    adminSettlementsEmptyRequest:
      'No approval requests. (Shown after checkout / contract end.)',
    adminSettlementsEmptyPending: 'No items pending approval.',
    adminSettlementsEmptyApproved: 'No approved (active) items.',
    adminSettlementsEmptyHeld: 'No items on hold.',
    adminSettlementsListFilteredEmpty: 'No items match search / sort / filters.',
    adminContractsEmptyNew: 'No new contract items.',
    adminContractsEmptySealed: 'No sealed contracts (paid & confirmed, before stay).',
    adminContractsEmptyInProgress: 'No in-stay contracts (check-in through check-out).',
    adminContractsEmptyCompleted: 'No completed contracts (after checkout).',
    adminRefundsEmptyAll: 'No refunds pending.',
    adminRefundsEmptyNew: 'No new refunds pending.',
    adminRefundsEmptyPre: 'No pre-contract refunds pending.',
    adminRefundsEmptyDuring: 'No in-contract refunds pending.',
    adminWithdrawalsEmptyPending: 'No withdrawals awaiting approval.',
    adminWithdrawalsEmptyProcessing: 'No withdrawals in processing.',
    adminWithdrawalsEmptyCompleted: 'No completed withdrawals.',
    adminWithdrawalsEmptyRejected: 'No rejected withdrawals.',
    adminWithdrawalsEmptyHeld: 'No withdrawals on hold.',
    adminCommonRefresh: 'Refresh',
    adminCommonLoading: 'Loading...',
    adminSettlementsTabRequest: 'Approval request',
    adminSettlementsTabPending: 'Pending approval',
    adminSettlementsTabApproved: 'Approved',
    adminSettlementsTabHeld: 'On hold',
    adminSettlementsPageTitle: 'Settlement approvals',
    adminSettlementsIntroLine:
      'Requests are created after checkout (contract end). Move to pending, then approve or hold. Approving after checkout +24h updates withdrawable balance. · Req {{req}} · Pend {{pend}} · Done {{appr}} · Hold {{held}}',
    adminSettlementsBadgeContractEnded: 'After contract end',
    adminContractsPageTitle: 'Contracts',
    adminContractsIntroLine:
      'Sealed → in stay → completed (after checkout) · Sealed {{sealed}} · In stay {{inProgress}} · Completed {{completed}}',
    adminContractsTabNew: 'New',
    adminContractsTabSealed: 'Sealed',
    adminContractsTabInProgress: 'In progress',
    adminContractsTabCompleted: 'Completed',
    adminContractsSearchPlaceholder: 'Email, UID, booking, property, amount…',
    adminContractsSearchHint: 'Search runs within the selected tab only.',
    adminRefundsPageTitle: 'Refunds',
    adminRefundsIntroLine:
      'Approve refunds for cancelled, paid bookings. · Pre-contract {{pre}} · In stay {{during}}',
    adminRefundsTabNew: 'New',
    adminRefundsTabAll: 'All',
    adminRefundsTabPre: 'Pre-contract refund',
    adminRefundsTabDuring: 'In-contract refund',
    adminRefundsSearchPlaceholder: 'Email, UID, booking, property, amount…',
    adminRefundsSearchHint: 'Search runs within the selected tab only.',
    adminRefundsApproveButton: 'Approve refund',
    adminWithdrawalsPageTitle: 'Withdrawal approvals',
    adminWithdrawalsIntroLine:
      'Review by category. · Pending {{pending}} · Processing {{processing}} · Rejected {{rejected}} · Completed {{completed}} · Held {{held}}',
    adminWithdrawalsTabPending: 'Pending',
    adminWithdrawalsTabProcessing: 'Processing',
    adminWithdrawalsTabRejected: 'Rejected',
    adminWithdrawalsTabCompleted: 'Completed',
    adminWithdrawalsTabHeld: 'On hold',
    adminWithdrawalsSearchPlaceholder: 'Email, UID, bank label, amount…',
    adminWithdrawalsSearchHint: 'Search runs within the selected tab only.',
    adminWithdrawalApprove: 'Approve',
    adminWithdrawalReject: 'Reject',
    adminWithdrawalHold: 'Hold',
    adminWithdrawalComplete: 'Complete',
    adminWithdrawalResume: 'Resume',
    adminWithdrawalBadgeCompleted: 'Completed',
    adminWithdrawalBadgeRejected: 'Rejected',
    adminWithdrawalRejectReason: 'Rejected by admin',
    adminWithdrawalHoldReason: 'On hold by admin',
    csvKycColFullName: 'Full name',
    csvKycColPhone: 'Phone',
    csvKycColIdType: 'ID type',
    csvKycColIdNumber: 'ID number',
    csvKycColDateOfBirth: 'Date of birth',
    csvKycColIdFrontUrl: 'ID photo URL (front)',
    csvKycColIdBackUrl: 'ID photo URL (back)',
    csvKycColFaceUrl: 'Face photo URL',
    csvKycColSubmittedAt: 'Submitted at',
    csvKycColVerificationStatus: 'Verification status',
    adminKycCsvDownloadError: 'Something went wrong while downloading the CSV.',
    adminSettlementsSearchHint: 'Search runs within the selected tab only.',
    adminSettlementsFilterLabel: 'Filter',
    adminSettlementsFilterTitle24hBaseline:
      'Baseline: 24h after checkout. Pick one of the three options.',
    adminSettlementsSortRemainingAscTitle: 'Soonest deadline first (asc. time left)',
    adminSettlementsSortRemainingDescTitle: 'Latest deadline first (desc. time left)',
    adminSettlementsFilterElapsed24hTitle: 'Only show items past checkout +24h (not combinable with ↑·↓)',
    adminSettlementsSortRemainingAsc: 'Time left ↑',
    adminSettlementsSortRemainingDesc: 'Time left ↓',
    adminSettlementsFilterElapsed24h: '24h+ elapsed',
    adminSettlementActionMoveToPending: 'Move to pending',
    adminSettlementResumeToRequest: 'Restore (request)',
    adminSettlementResumeToPending: 'Restore (pending)',
    adminAuditPageTitle: 'Audit log',
    adminAuditPageIntro: 'Money · ops actions · by actor and time (tabs)',
    adminAuditSearchPlaceholder: 'Action, owner/ref, note, actor…',
    adminAuditSearchHint: 'Search only within the selected tab.',
    adminAuditEmpty: 'No rows match this tab or search.',
    adminAuditColAction: 'Action',
    adminAuditColAmount: 'Amount',
    adminAuditColOwnerTarget: 'owner / target',
    adminAuditColRef: 'ref',
    adminAuditColActor: 'Actor',
    adminAuditColNote: 'Note',
    adminAuditColTime: 'Time',
    adminAuditAmountDash: 'Amount —',
    adminAuditMobileTarget: 'Target:',
    adminAuditMobileActor: 'Actor:',
    adminAuditTabNew: 'New',
    adminAuditTabAll: 'All',
    adminAuditTabSettlement: 'Settlement',
    adminAuditTabWithdrawal: 'Withdrawal',
    adminAuditTabRefund: 'Refund',
    adminAuditTabAccount: 'Account',
    adminAuditTabProperty: 'Property',
    adminAuditLedgerSettlementApproved: 'Settlement approved',
    adminAuditLedgerSettlementHeld: 'Settlement on hold',
    adminAuditLedgerSettlementResumed: 'Settlement resumed (approved)',
    adminAuditLedgerSettlementRevertedPending: 'Settlement restored → pending',
    adminAuditLedgerSettlementRevertedRequest: 'Settlement restored → request',
    adminAuditLedgerWithdrawalRequested: 'Withdrawal requested',
    adminAuditLedgerWithdrawalProcessing: 'Withdrawal approved (processing)',
    adminAuditLedgerWithdrawalHeld: 'Withdrawal on hold',
    adminAuditLedgerWithdrawalResumed: 'Withdrawal resumed',
    adminAuditLedgerWithdrawalCompleted: 'Withdrawal completed',
    adminAuditLedgerWithdrawalRejectedRefund: 'Withdrawal rejected · refunded',
    adminAuditLedgerRefundApproved: 'Refund approved',
    adminAuditModUserBlocked: 'User blocked',
    adminAuditModUserRestored: 'User restored',
    adminAuditModPropertyHidden: 'Property hidden',
    adminAuditModPropertyRestored: 'Property restored',
    adminAuditModPropertyAdEndedByHost: 'Property ad ended (host)',
    adminAuditModPropertyDeletedByHost: 'Property deleted (host)',
    adminUiBadPath: 'Invalid path.',
    adminUiLoadingEllipsis: 'Loading…',
    adminUiNoQueryResults: 'No results.',
    adminPaginationPrev: 'Previous',
    adminPaginationNext: 'Next',
    adminPaginationLine: '{{page}} / {{total}} · {{count}} items',
    adminFilterNew: 'New',
    adminFilterAll: 'All',
    adminUserFilterActive: 'Active',
    adminUserFilterBlocked: 'Blocked',
    adminUsersTitle: 'Accounts',
    adminUsersIntroLine:
      'New = signed up within 24h (click row to ack; stays today only until midnight) · New {{nNew}} · All {{nAll}} · Active {{nActive}} · Blocked {{nBlocked}}',
    adminUsersSearchPlaceholder: 'Search uid / email / name',
    adminUsersSearchHint: 'Search only within the selected tab.',
    adminColAlert: 'Alert',
    adminColName: 'Name',
    adminColEmail: 'Email',
    adminColPhone: 'Phone',
    adminColUid: 'UID',
    adminColStatus: 'Status',
    adminColActions: 'Actions',
    adminPingTitleUnseen: 'Unseen ping',
    adminPingTitleAck: 'Unseen',
    adminAriaUnseenNewUser: 'Unseen new account',
    adminAriaAckNewUser: 'Acknowledged new account',
    adminDotUnseen: 'Unseen',
    adminDotAcked: 'Acknowledged',
    adminStatusNormal: 'Active',
    adminStatusBlocked: 'Blocked',
    adminActionRestore: 'Restore',
    adminActionBlock: 'Block',
    adminPropertiesTitle: 'Properties',
    adminPropertiesIntroLine:
      'Parent listings only · New stays until ack · After ack, listed that day only (until midnight) · Newest first · All {{nAll}} · New {{nNew}} · Live {{nListed}} · Paused {{nPaused}} · Hidden {{nHidden}}',
    adminPropFilterListed: 'Live',
    adminPropFilterPaused: 'Paused',
    adminPropFilterHidden: 'Hidden',
    adminPropertiesSearchPlaceholder: 'Search id / title / owner / address',
    adminPropertiesSearchHint: 'Search within tab. Live = bookable like guest view.',
    adminPropColTitle: 'Title',
    adminPropColAddress: 'Address',
    adminPropColOwner: 'Owner',
    adminPropColId: 'ID',
    adminListingHidden: 'Hidden',
    adminListingAdPaused: 'Paused',
    adminListingLive: 'Live',
    adminPropUnhide: 'Restore',
    adminPropHide: 'Hide',
    adminAriaUnseenNewProperty: 'Unseen new property',
    adminAriaAckNewProperty: 'Acknowledged new property',
    adminPropertiesHiddenReasonLabel: 'Hidden reason (fixed):',
    adminNotFoundUser: 'User not found.',
    adminBackToUsersList: 'Back to accounts',
    adminNotFoundProperty: 'Property not found.',
    adminBackToPropertiesList: 'Back to properties',
    adminUserDetailBack: 'Back',
    adminNoDisplayName: 'No name',
    adminUserBadgeSuspended: 'Suspended',
    adminUserBadgeActive: 'Active',
    adminLabelHostMemo: 'Host memo',
    adminLabelGuestMemo: 'Guest memo',
    adminMemoEmpty: 'No memos',
    adminMemoPlaceholderHost: 'Host support memo',
    adminMemoPlaceholderGuest: 'Guest support memo',
    adminMemoNewestFirst: 'Newest memo appears first.',
    adminUserUnblock: 'Unblock',
    adminUserBlockAccount: 'Block account',
    adminSectionProfileStatus: 'Profile · status',
    adminSectionHost: 'Host',
    adminSectionGuest: 'Guest',
    adminLabelKyc: 'KYC',
    adminUserJoinedAt: 'Joined',
    adminUserStatHostBookingsTotal: 'Bookings (total)',
    adminUserStatInProgress: 'In progress',
    adminUserStatCompleted: 'Completed',
    adminUserStatCancelled: 'Cancelled',
    adminUserBalanceTitle: 'Balance',
    adminUserBalanceAvailable: 'Available',
    adminUserBalanceApprovedRevenue: 'Approved revenue',
    adminUserBalancePendingWithdraw: 'Pending / held withdrawal',
    adminUserGuestCurrentRes: 'Current bookings',
    adminUserGuestDepositPending: 'Deposit pending',
    adminUserGuestContractDone: 'Contract done',
    adminUserRefundsHeading: 'Refunds',
    adminUserRefundsEmpty: 'No records.',
    adminUserRefundsColBookingId: 'Booking ID',
    adminUserRefundsColProperty: 'Property',
    adminUserRefundsColAmount: 'Amount',
    adminUserRefundsColPayment: 'Payment',
    adminUserRefundsColRefund: 'Refund',
    adminRefundStatusDone: 'Refunded',
    adminRefundStatusAdminOk: 'Approved by admin',
    adminRefundStatusPending: 'Pending approval',
    adminPropertyDetailBackList: 'Properties',
    adminPropertyNoTitle: 'No title',
    adminPropertyAdminMemo: 'Admin memo',
    adminPropertyMemoPlaceholder: 'Property admin memo',
    adminPropertyViewHost: 'View host',
    adminPropertyUnhide: 'Unhide',
    adminPropertyHide: 'Hide',
    adminSectionHostId: 'Host · IDs',
    adminLabelOwnerId: 'Owner ID',
    adminLabelDisplayName: 'Display name',
    adminSectionPriceAreaGuests: 'Price · area · guests',
    adminLabelWeeklyRent: 'Weekly rent',
    adminLabelAreaSqm: 'Area',
    adminLabelBedBath: 'Beds · baths',
    adminLabelBedroomsBathrooms: 'Bed {{bed}} · bath {{bath}}',
    adminLabelMaxGuests: 'Max guests',
    adminLabelAdultsChildren: 'Adults {{adults}} · children {{children}}',
    adminSectionLocation: 'Location',
    adminLabelAddress: 'Address',
    adminLabelUnitNumber: 'Unit',
    adminLabelCityDistrictIds: 'city / district',
    adminLabelCoordinates: 'Coordinates',
    adminSectionDescription: 'Description',
    adminPropertyDescOriginalVi: 'Vietnamese (original)',
    adminPropertyDescTranslatedKo: 'Translation (KO)',
    adminSectionPhotos: 'Photos',
    adminPropertyNoImages: 'No images',
    adminSectionAmenitiesType: 'Amenities · type',
    adminLabelPropertyType: 'Type',
    adminLabelCleaningPerWeek: 'Cleaning / week',
    adminSectionPets: 'Pets',
    adminLabelPetAllowed: 'Allowed',
    adminLabelYes: 'Yes',
    adminLabelNo: 'No',
    adminLabelPetFeePerPet: 'Pet fee (VND/pet)',
    adminLabelMaxPets: 'Max pets',
    adminSectionSchedule: 'Schedule · check-in',
    adminLabelRentStart: 'Rent start',
    adminLabelRentEnd: 'Rent end',
    adminLabelCheckInTime: 'Check-in',
    adminLabelCheckOutTime: 'Check-out',
    adminSectionIcal: 'External calendar (iCal)',
    adminLabelIcalPlatform: 'Platform',
    adminLabelIcalCalendarName: 'Calendar name',
    adminLabelUrl: 'URL',
    adminSectionChangeHistory: 'Change history',
    adminPropertyMetaCreated: 'Created',
    adminPropertyMetaUpdated: 'Updated',
    adminPropertyDeletedFlag: 'Host deleted flag: deleted',
    adminSystemLogTitle: 'System log',
    adminSystemLogChecklist:
      '5‑minute checklist: ① spikes in 5xx/auth errors ② booking/payment write failures ③ KYC failures ④ repeated messages ⑤ trace by bookingId/ownerId.',
    adminSystemLogFilterNew: 'New',
    adminSystemLogFilterAll: 'All',
    adminSystemLogFilterError: 'Error',
    adminSystemLogFilterWarning: 'Warning',
    adminSystemLogFilterInfo: 'Info',
    adminSystemLogExportCsv: 'Export CSV',
    adminSystemLogClearEphemeral: 'Clear ephemeral logs',
    adminSystemLogClearPersistent: 'Reset persistent logs',
    adminSystemLogCountLine: 'Showing {{shown}} · page {{page}}/{{pages}}',
    adminSystemLogColTime: 'Time',
    adminSystemLogColSeverity: 'Severity',
    adminSystemLogColCategory: 'Category',
    adminSystemLogColMessage: 'Message',
    adminSystemLogColBookingId: 'bookingId',
    adminSystemLogColOwnerId: 'ownerId',
    adminSystemLogColSnapshot: 'Snapshot',
    adminSystemLogColCopy: 'Copy',
    adminSystemLogEmpty: 'No logs to show.',
    adminSystemLogLinkSettlements: 'Settlement',
    adminSystemLogSettlementsSearchHint: 'Paste ID into settlement search',
    adminSystemLogCopyRowTitle: 'Copy row',
    adminSystemLogFooterNote:
      'Paste booking IDs into settlement/contracts search. For analysis, export CSV (do not share secrets).',
    adminPropertyLogsTitle: 'Property delete/cancel log',
    adminPropertyLogsIntro: 'Server ledger — DELETED and CANCELLED property actions',
    adminPropertyLogsTabAll: 'All',
    adminPropertyLogsTabDeleted: 'Deleted',
    adminPropertyLogsTabCancelled: 'Cancelled',
    adminPropertyLogsColTime: 'Time',
    adminPropertyLogsColType: 'Type',
    adminPropertyLogsColPropertyId: 'propertyId',
    adminPropertyLogsColOwnerId: 'ownerId',
    adminPropertyLogsColRecorder: 'Recorder',
    adminPropertyLogsColReservation: 'reservation',
    adminPropertyLogsColNote: 'Note',
    adminPropertyLogsEmpty: 'No records.',
    adminAccountsTitle: 'Admin accounts',
    adminAccountsIntro: 'Super only · click an account to edit id, nickname, password, permissions',
    adminAccountsNewButton: 'New admin',
    adminAccountsFormNewTitle: 'New account',
    adminAccountsLabelUsername: 'Username',
    adminAccountsLabelNickname: 'Nickname',
    adminAccountsNicknamePlaceholder: 'Display name',
    adminAccountsPasswordMin: 'Password (8+ chars)',
    adminAccountsCreateSuper: 'Create as super admin',
    adminAccountsCreateSubmit: 'Create',
    adminAccountsListTitle: 'Accounts',
    adminAccountsRoleSuper: 'Super',
    adminAccountsRoleNormal: 'Standard',
    adminAccountsSelectPrompt: 'Select an account on the left.',
    adminAccountsProfileToggle: 'Account details',
    adminAccountsProfileExpand: 'Expand',
    adminAccountsProfileCollapse: 'Collapse',
    adminAccountsProfileNote: 'Only super can edit id, nickname, password here.',
    adminAccountsEditNickname: 'Nickname',
    adminAccountsEditUsername: 'Username',
    adminAccountsEditNewPassword: 'New password (empty to keep)',
    adminAccountsEditCurrentPassword: 'Current password',
    adminAccountsSaveProfile: 'Save profile',
    adminAccountsSaving: 'Saving…',
    adminAccountsRolesHeading: 'Role · permissions',
    adminAccountsSuperAllMenus: 'Super has access to all menus.',
    adminAccountsDemoteSuper: 'Demote to standard admin',
    adminAccountsSuperCheckbox: 'Super admin',
    adminAccountsPermHint: 'Checked items appear in the top nav.',
    adminAccountsSavePerms: 'Save permissions only',
    adminAccountsSelfPermNote: 'You cannot change your own menu permissions here.',
    adminNavDashboard: 'Dashboard',
    adminNavUsers: 'Accounts',
    adminNavProperties: 'Properties',
    adminNavPropertyLogs: 'Property log',
    adminNavContracts: 'Contracts',
    adminNavSettlements: 'Settlement',
    adminNavRefunds: 'Refunds',
    adminNavWithdrawals: 'Withdrawals',
    adminNavAudit: 'Audit',
    adminNavKyc: 'KYC',
    adminNavSystemLog: 'System log',
    adminHomeTitle: 'Admin dashboard',
    adminHomeSubtitle:
      'Use the menu below or the top bar to open work screens.',
    adminNavMenuAriaLabel: 'Admin menu',
    adminNavBadgeAria: '{{count}} notifications',
    adminNavDescUsers: 'Block, restore, and search',
    adminNavDescProperties: 'Hide and restore',
    adminNavDescPropertyLogs: 'Delete/cancel server logs',
    adminNavDescContracts: 'Contract execution & lease start scheduling',
    adminNavDescSettlements: 'Approve withdrawal-ready settlement updates',
    adminNavDescRefunds: 'Approve cancellation refunds',
    adminNavDescWithdrawals: 'Process withdrawal requests',
    adminNavDescAudit: 'Money & action logs',
    adminNavDescKyc: 'Identity verification & review',
    adminNavDescSystemLog: 'Client errors, warnings, volatile info',
    adminLoginTitle: 'Admin sign-in',
    adminLoginSubtitle: '500 STAY Admin · desktop',
    adminLoginUsernameLabel: 'Username',
    adminLoginPasswordLabel: 'Password',
    adminLoginSubmit: 'Sign in',
    adminLoginError: 'Invalid admin username or password. (Check server logs if DB is offline)',
    adminLoginBootstrapNote:
      'First login with ADMIN_BOOTSTRAP_* or NEXT_PUBLIC_ADMIN_* creates the super admin in DB.',
    adminLoginHomeLink: 'Back to site',
    adminNoAccessTitle: 'No menus available',
    adminNoAccessBodyWithUser:
      'Account {{username}} has no permissions. Ask a super admin to grant menu access.',
    adminNoAccessBodyGeneric: 'Ask a super admin to grant menu access.',
    adminNoAccessLogout: 'Log out and sign in with another account',
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
    dateBadgeRangeTemplate: '{{start}} ~ {{end}}',
    dateBadgeFromTemplate: 'From {{date}}',
    searchButton: 'Search',
    noResultsFound: 'No results found.',
    propertiesFound: ' properties found.',
    minExceedsMaxError: 'Min cannot exceed max. Please correct.',
    maxBelowMinError: 'Max cannot be lower than min. Please correct.',
    searchFilterPriceRangeLabel: 'Price range',
    searchFilterFacilityPickHeading: 'Amenities',
    searchPriceRangeDragHint: 'Drag to adjust the price range',
    searchRentPerWeekFragment: 'per week',
    chatSendingMessage: 'Sending message...',
    chatInputInProgressStatus: 'Typing...',
    signupErrorRequiredFields: 'Please fill in all required fields.',
    signupErrorInvalidEmailFormat: 'Please enter a valid email address.',
    signupErrorPasswordMismatch: 'Passwords do not match.',
    signupErrorPasswordMinLength: 'Password must be at least 6 characters.',
    signupErrorPhoneVerificationRequired: 'Please complete phone verification.',
    signupErrorOtpSendFailed: 'Could not send the verification code. Please try again.',
    signupErrorOtpSendSystem: 'Something went wrong while sending the verification code.',
    signupErrorOtpInvalidCode: 'The verification code is not valid.',
    signupErrorOtpVerifyFailed: 'Something went wrong during verification.',
    signupErrorFailedGeneric: 'Sign up failed.',
    signupErrorUnexpected: 'An unexpected error occurred.',
    signupErrorSocialLoginFailed: 'Social sign-in failed.',
    uiTranslateButtonLoading: 'Translating...',
    uiTranslateViewOriginal: 'View original',
    uiTranslateShowTranslation: 'Translate',
    emailWelcomeTitle: '[500 STAY VN] Welcome aboard',
    emailWelcomeBody:
      'Hi {{name}},\n\nThanks for joining 500 STAY VN — a platform for short-stay rental listings, search, and host messaging.\nSearch, book, and message hosts in the app.\n\nThis is an automated message; please do not reply.',
    emailBookingConfirmedGuestTitle: '[500 STAY VN] Your booking is confirmed',
    emailBookingConfirmedGuestBody:
      'Hi {{guestName}},\n\nYour booking is confirmed.\nBooking ID: {{bookingId}}\nProperty: {{propertyTitle}}\nCheck-in: {{checkIn}} / Check-out: {{checkOut}}\n\nSee details in the Bookings section of the app.',
    emailBookingConfirmedHostTitle: '[500 STAY VN] A booking is confirmed',
    emailBookingConfirmedHostBody:
      'Hi {{hostName}},\n\nA booking from {{guestName}} is confirmed.\nBooking ID: {{bookingId}}\nProperty: {{propertyTitle}}\nCheck-in: {{checkIn}} / Check-out: {{checkOut}}\n\nPlease check your schedule and messages in the app.',
    emailBookingCancelledGuestTitle: '[500 STAY VN] Booking cancelled',
    emailBookingCancelledGuestBody:
      'Hi {{guestName}},\n\nThe following booking has been cancelled.\nBooking ID: {{bookingId}}\nProperty: {{propertyTitle}}\n\nIf you need help, contact support in the app.',
    emailOtpCodeTitle: '[500 STAY VN] Your verification code',
    emailOtpCodeBody:
      'Your verification code: {{code}}\n\nThis code is valid for {{minutes}} minutes.\nIf you did not request this, you can ignore this email.',
    emailPasswordResetTitle: '[500 STAY VN] Reset your password',
    emailPasswordResetBody:
      'To reset your password, open the following link:\n{{resetLink}}\n\nThe link is valid for {{hours}} hours. If you did not request this, you can ignore this email.',
    emailVerifyEmailTitle: '[500 STAY VN] Confirm your email',
    emailVerifyEmailBody:
      'To verify your email address, open the following link:\n{{verifyLink}}\n\nIf you did not create an account, you can ignore this email.',
    emailHostNewBookingRequestTitle: '[500 STAY VN] New booking request',
    emailHostNewBookingRequestBody:
      'Hi {{hostName}},\n\n{{guestName}} sent a booking request.\nProperty: {{propertyTitle}}\nRequested check-in: {{checkIn}} / Check-out: {{checkOut}}\n\nPlease accept or decline in the app.',
    emailPayoutProcessedTitle: '[500 STAY VN] Payout processed',
    emailPayoutProcessedBody:
      'Hi {{name}},\n\nYour payout request has been processed.\nAmount: {{amount}} {{currency}}\n\nSee the Settlements section in the app for details.',
    emailGenericFooterNotice:
      '500 STAY VN provides information and messaging tools for short stays; we are not a party to rental agreements between users.',
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
    incomeStatusRevenueConfirmed: 'Revenue confirmed',
    incomeStatusSettlementRequest: 'Awaiting admin (request)',
    incomeStatusSettlementPending: 'Awaiting admin (queue)',
    incomeStatusSettlementApproved: 'Settled',
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
    fullNamePlaceholder: 'Enter your legal full name',
    signupOtpVerify: 'Verify',
    phoneVerificationComplete: 'Phone number verified',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    otpCodePlaceholder: '6-digit code',
    deleteAccountTitle: 'Account deletion',
    deleteAccountIntro:
      'To delete your account, please contact us using the email below.',
    deleteAccountFooterNote:
      'Including your account details and reason for deletion helps us process your request faster.',
    legalFooterTerms: 'Terms of Service',
    legalFooterPrivacy: 'Privacy Policy',
    legalFooterDeleteAccount: 'Delete account',
    legalFooterNavAriaLabel: 'Legal',
    toastHeadingSuccess: 'Done',
    toastHeadingInfo: 'Notice',
    propertyNotFound: 'Property not found.',
    bookPropertyTitle: 'Book',
    nightShort: ' nights',
    bookingDatesLoadError: 'Could not load date information',
    guestInfoSectionTitle: 'Guest details',
    bookingGuestNamePlaceholder: 'Full name',
    agreeTermsPrivacyBooking: 'I agree to the terms and privacy policy (required)',
    proceedToPaymentStep: 'Continue to payment',
    selectPaymentMethod: 'Select payment method',
    priceBreakdown: 'Price breakdown',
    perWeekSlash: ' /week',
    petsShort: 'Pets',
    petCountClassifier: '',
    perPetPerWeekSlash: ' /pet/week',
    bookingServiceFee: 'Service fee',
    totalAmountLabel: 'Total',
    agreePaymentTermsCheckbox: 'I agree to the payment terms and conditions. (Required)',
    payNow: 'Pay now',
    processingInProgress: 'Processing...',
    bookingDetailTitle: 'Booking details',
    paymentCompleteTitle: 'Payment complete!',
    waitingHostApproval: 'Waiting for host approval.',
    notifyWhenApprovedShort: 'We will notify you when approved.',
    bookingSuccessGotIt: 'Got it',
    bookingNumberLabel: 'Booking number',
    copyButton: 'Copy',
    copiedButton: 'Copied',
    bookingBadgeConfirmed: 'Confirmed',
    bookingBadgeCancelled: 'Cancelled',
    bookingBadgePending: 'Pending approval',
    propertyInfoHeading: 'Property',
    bookingDetailSectionTitle: 'Booking details',
    bookerFieldLabel: 'Guest',
    phoneFieldLabel: 'Phone',
    stayNightsUnit: ' nights',
    specialRequestsHeading: 'Special requests',
    weeklyPriceShort: 'weekly rate',
    petFeeShortLabel: 'per pet',
    totalPaymentHeading: 'Total paid',
    paymentStatusPaidLabel: 'Paid',
    paymentStatusPendingLabel: 'Payment pending',
    backToHomeButton: 'Back to home',
    viewBookingsHistoryButton: 'View my bookings',
    bookingSuccessLoadFailed:
      'Could not load booking details. Please check your bookings list.',
    bookingSuccessBookingIdMissing: 'Missing booking reference.',
    bookingSuccessCopyOk: 'Booking number copied to clipboard.',
    bookingSuccessCopyFail:
      'Copy failed. Please select the number and copy manually.',
    priceUnitVndSuffix: 'VND',
    reservationCancelRelistMerged:
      'The cancelled period has been merged with an existing listing. Your listing count stays the same.',
    reservationCancelRelistRelisted:
      'The reservation was cancelled. The property is listed again.',
    reservationCancelRelistLimitExceeded:
      'The reservation was cancelled. Please relist from the Waiting tab.',
    reservationCancelRelistShortTerm:
      'The reservation was cancelled and moved to Waiting. Edit the dates, then relist.',
    reservationStatusUpdateError:
      'An error occurred while updating the reservation status.',
    hostReservationRecordDeleteConfirm: 'Permanently delete this record?',
    hostReservationRecordDeleteError:
      'An error occurred while deleting the record.',
    hostReservationLabelCompleted: 'Reservation completed',
    paymentMethodLabelMomo: 'MoMo',
    paymentMethodLabelZalopay: 'ZaloPay',
    paymentMethodLabelBankTransfer: 'Bank transfer',
    paymentMethodLabelPayAtProperty: 'Pay at property',
    bookingDetailsPaymentHeading: 'Payment',
    bookingDetailsPayMethodRowLabel: 'Method',
    bookingDetailsAccommodationLine: 'Room rate',
    bookingDetailsFeesVatLine: 'Fees & VAT',
    bookingDetailsTotalRow: 'Total',
    bookingWeeksUnit: ' weeks',
    hostBookingCardStatusPending: 'Booking request',
    hostBookingCardStatusConfirmed: 'Booking confirmed',
    hostBookingCardStatusRequestCancelled: 'Request cancelled',
    hostBookingCardStatusBookingCancelled: 'Booking cancelled',
    myPropertiesPendingEndAdTitle: 'Move to ended listings',
    myPropertiesPendingEndAdDesc:
      'This listing will move to the ended tab. Your data is kept.',
    myPropertiesDuplicateLiveTitle: 'Same unit is already live',
    myPropertiesDuplicateLiveHint:
      'Yes: open the live listing editor and adjust dates in the calendar. No: stay on this list (avoids duplicate edits).',
    dialogNo: 'No',
    dialogYes: 'Yes',
    hostCancelModalTitle: 'Confirm cancellation',
    hostCancelModalAckLabel: 'I have read and confirm.',
    hostBookingConfirmToastOk: 'Booking confirmed.',
    hostBookingConfirmToastErr: 'Could not confirm the booking.',
    hostBookingChatOpenErr: 'Could not open chat.',
    hostBookingRejectToastListingOk: 'Listing status was updated.',
    hostBookingRejectToastErr: 'Could not reject the booking.',
    hostBookingDeleteConfirm: 'Delete this booking?',
    hostBookingDeleteOk: 'Booking removed.',
    hostBookingDeleteErr: 'Delete failed.',
    hostBookingCancelReasonByOwner: 'Declined/cancelled by host',
    reservationServerTimeDetail: 'Cannot verify server time. Please try again later.',
    hostManageBookedPropertiesTitle: 'Reservation management',
    hostTabBookedProperties: 'Active reservations',
    hostTabCompletedReservations: 'Completed',
    emptyNoActiveReservations: 'No active reservations.',
    emptyNoCompletedReservations: 'No completed reservations.',
    tenantInfoHeading: 'Tenant information',
    confirmReservationBtn: 'Confirm reservation',
    markStayCompletedBtn: 'Mark as completed',
    deleteHistoryRecordTitle: 'Delete record',
    hostApproveBooking: 'Approve',
    cancelPolicyAgreeRequired: 'Please agree to the cancellation policy.',
    bookingCancelledToast: 'Booking cancelled.',
    bookingCancelFailed: 'Could not cancel the booking.',
    confirmDeleteBookingRecord: 'Delete this booking record?',
    bookingDeletedToast: 'Removed.',
    bookingDeleteFailed: 'Delete failed.',
    checkInOutScheduleTitle: 'Check-in / check-out time',
    importExternalCalendar: 'Import external calendar',
    calendarPlatformLabel: 'Platform',
    calendarOptionNone: 'None',
    calendarOptionOther: 'Other',
    calendarNameLabel: 'Calendar name',
    calendarNamePlaceholderExample: 'e.g. Airbnb bookings',
    removeAddressAriaLabel: 'Remove address',
    backNavLabel: 'Back',
    kycFirebasePhoneTitle: 'Firebase phone verification',
    kycFirebasePhoneSubtitle: 'Secure phone verification via Google Firebase',
    kycPhoneVerificationHeading: 'Phone verification',
    kycPhoneVerificationForHostDesc: 'Please verify your phone number for host verification',
    kycPhoneVerifiedLong: '✅ Phone number verification completed.',
    kycNextStep: 'Next step',
    kycTestModeProceed: 'Proceed in test mode',
    calWarnTitleOwner: 'Cannot set period',
    calWarnTitleGuest: 'Cannot book',
    calWarnMinSevenBody: 'Bookings are only available in 7-day units. The selected date has less than 7 days until the rental end date. Please select another date.',
    calSelectRentalStart: 'Select rental start date',
    calSelectRentalEnd: 'Select rental end date',
    calSelectCheckIn: 'Select check-in date',
    calSelectCheckOut: 'Select check-out date',
    calOwnerLegendSelectableStart: 'Can select as start date',
    calOwnerLegendSelectedStart: 'Selected start date',
    calOwnerLegendEndHint: 'End date (7-day steps, max ~3 months)',
    calOwnerLegendWithinPeriod: 'Within rental period (click to change start date)',
    calOwnerLegendOtherDates: 'Other dates (click to change start date)',
    calOwnerSelectStartFirst: 'Please select start date first',
    calGuestLegendAvailable: 'Available dates',
    calGuestLegendMinSeven: 'Min 7 nights; blocked dates excluded (flexible checkout)',
    calGuestLegendBooked: 'Booked / unavailable',
    calGuestLegendCheckoutOk: 'Existing checkout (check-in available)',
    calGuestLegendCheckoutDayAbbr: 'OUT',
    calGuestLegendShortStayDemoDay: '31',
    calGuestLegendShortStay: 'Less than 7 days available (cannot check in)',
    calGuestLegendCheckinToEnd: 'Until listing end or limit',
    calGuestLegendValidCheckout: 'Valid checkout (≥7 nights, no overlap)',
    calGuestSelectCheckInFirst: 'Please select check-in date first',
    weeklyCostLabel: '/ week',
    bookingOccupancyLabel: 'Guests',
    importExternalCalendarHelp:
      'Sync bookings from Airbnb, Agoda, etc. with 500stay. Enter iCal URL (.ics).',
    carouselPrevious: 'Previous',
    carouselNext: 'Next',
    translationConsentTitle: 'Would you like to use translation?',
    translationConsentDescription:
      'We need your consent to enable translation. The on-device engine may work offline.',
    translationConsentAgree: 'Agree and continue',
    translationConsentDecline: 'Decline',
    translationLangPackTitle: 'Download translator',
    translationLangPackDescription:
      'Translation requires downloading the on-device translator (language pack). If you decline, you will be prompted again when you tap "Translate". About 50MB storage; Wi-Fi recommended.',
    translationLangPackAgree: 'Download and continue',
    translationLangPackDecline: 'Later',
    translationModalEngineLine: 'Engine: {{engine}}',
    translationModalWebRequiresNetwork: 'Internet connection required.',
    translationModalOfflineCapable: 'Also available offline.',
    translationLangPackStorageTitle: 'Storage needed: about 50MB',
    translationLangPackStorageHint:
      'Wi-Fi recommended. After download, available offline.',
    translationFooterConsentPrivacy:
      'By agreeing, you accept the privacy policy.',
    translationFooterLangPackDevice: 'The language pack is saved on your device.',
    chatTranslatedByGemini: 'Auto-translated with Gemini AI.',
    chatTranslatedByDevice: 'Auto-translated with the on-device engine.',
    chatTranslationErrorLabel: 'Translation error',
    chatTranslateShowOriginalTitle: 'Show original',
    chatTranslateShowTranslatedTitle: 'Show translation',
    chatTranslating: 'Translating',
    chatExampleTitle: 'Chat message example',
    chatExampleHowToTitle: 'How to use',
    chatExampleBullet1: 'Each message has a translate button at the bottom right.',
    chatExampleBullet2: 'Vietnamese messages can be translated to your UI language.',
    chatExampleBullet3: 'Other languages can be translated depending on your settings.',
    chatExampleBullet4: 'After translating, use "Show original" to toggle.',
    chatExampleBullet5: 'Translations are cached for reuse.',
    chatExampleDemoGuestName: 'Minh Anh',
    chatExampleDemoHostName: 'Host',
    chatExampleDemoTime1: '2:30 PM',
    chatExampleDemoTime2: '2:32 PM',
    chatExampleDemoTime3: '2:35 PM',
    chatExampleDemoMsgHostReply:
      'Hi — the place is available Feb 15–22. I can share more details.',
    propertyImageAltFallback: 'Listing photo',
    propertyFavoriteButtonAria: 'Save to favorites',
    carouselSlideSelectAria: 'Go to slide {{n}}',
    trustSignalKycTitle: 'Verified hosts',
    trustSignalKycDesc: 'Identity-verified hosts',
    trustSignalLanguagesTitle: '5 languages',
    trustSignalLanguagesDesc: 'KO/VI/EN/JA/ZH',
    trustSignalChatTitle: 'Real-time chat',
    trustSignalChatDesc: 'Message hosts directly',
    trustSignalBookingTitle: 'Instant confirmation',
    trustSignalBookingDesc: 'Fast booking approval',
    propertyDescriptionTranslateError: 'Something went wrong while translating.',
    propertyDescExampleTitle: 'Sample listing description',
    propertyDescHowToTitle: 'How to use',
    propertyDescBullet1: 'The Vietnamese original is shown by default.',
    propertyDescBullet2: 'Tap “Translate” to view a translation.',
    propertyDescBullet3: 'You may see a consent dialog on first use.',
    propertyDescBullet4: 'Native apps may require a language pack download.',
    propertyDescBullet5: 'After translating, use “View original” to toggle.',
    uiTranslateGenericFail: 'Translation failed. Please try again shortly.',
    uiTranslatedBadge: 'Translated',
    uiTranslateReset: 'Reset',
    uiTranslateCostSavingHint:
      'We translate on demand to save cost. Repeated text is cached.',
    chatSendFailed: 'Failed to send message.',
    chatRoleTenant: 'Tenant',
    chatRoleLandlord: 'Host',
    chatViewListing: 'View listing',
    chatViewListingDetail: 'View details →',
    chatResidencyNoticeTitle: 'Quick note before you move in!',
    chatResidencyNoticeBody:
      'Under Vietnamese law, temporary residency registration is required. Please complete it for a safe, comfortable stay ✈️',
    chatScrollOlderMessages: 'Scroll up for older messages',
    chatBookingNoticeTitle: 'Booking confirmation',
    chatBookingNoticeBody:
      'For a safe, pleasant stay, please complete temporary residency registration right after check-in.',
    chatEmptyState: 'Send a message to start the conversation',
    chatReadReceipt: 'Read',
    chatSystemPeerJoined: 'The other participant joined',
    chatSystemImageSent: 'Sent an image',
    chatInputPlaceholder: 'Type a message...',
    chatInputPlaceholderFull: 'Enter your message...',
    settlementProcessHaltedDetail:
      'Settlement process halted. Please try again later.',
    settlementEmptyRevenueList:
      'No paid bookings past check-in time yet.',
    settlementNoWithdrawalHistory: 'No withdrawal history yet.',
    settlementNoBankAccounts: 'No accounts registered.',
    withdrawalValidateAmount: 'Please enter a withdrawal amount.',
    withdrawalSelectBankRequired: 'Please select a bank account.',
    withdrawalRequestFailedMessage: 'Withdrawal request failed.',
    withdrawalSubmittedSuccess: 'Withdrawal request submitted.',
    bankAccountFormIncomplete: 'Please fill in all account details.',
    bankAccountAddFailed: 'Failed to register account.',
    bankAccountAddedSuccess: 'Account registered.',
    withdrawalStatusHeld: 'On hold',
    withdrawalStatusRejected: 'Rejected',
    profileKycCoinsProgress: 'Coins {n}/3',
    profileKycEncourageWithCount:
      'Complete KYC verification to collect 3 coins! (Current {n}/3)',
    deleteAccountButton: 'Delete account',
    deleteAccountExecuting: 'Processing...',
    phoneVerificationRequired: 'Phone verification is required.',
    langEndonymKo: '한국어',
    langEndonymVi: 'Tiếng Việt',
    langEndonymEn: 'English',
    langEndonymJa: '日本語',
    langEndonymZh: '中文',
    kycHostVerificationTitle: 'Host verification',
    kycCompleteThreeStepSubtitle: 'Please complete the 3-step verification',
    kycProgressLoadError:
      'Could not load verification progress. Please refresh and try again.',
    kycStepFailedGeneric: 'KYC step could not be completed.',
    kycIdDocumentStepTitle: 'ID capture',
    kycFaceVerificationStepTitle: 'Face verification',
    kycStep2CompleteTitle: 'Step 2 complete',
    kycStep2CompleteBody:
      'Your ID information was received safely. Please continue to step 3 face verification.',
    kycTestModeBannerTitle: 'Currently in test mode',
    kycTestModeFaceSubtitle: 'You can complete verification without capture',
    kycTestModeIdSubtitle: 'You can go to the next step without capture',
    kycFaceFiveDirectionInstruction: 'Please capture your face from 5 directions',
    kycStartCapture: 'Start capture',
    kycFaceCaptureSessionTitle: 'Face capture',
    kycMultistepProgress: 'Step {current}/{total}',
    kycCameraErrorTitle: 'Camera error',
    kycStopCapture: 'Stop capture',
    kycCaptureCompleteTitle: 'Capture complete',
    kycReviewCapturedImagesFace: 'Please review the captured images',
    kycRetakePhotos: 'Retake',
    kycCompleteVerification: 'Complete verification',
    kycAiAnalyzingTitle: 'AI analysis',
    kycAiAnalyzingDesc: 'Analyzing face verification data...',
    kycIdSelectTypeAndCapture: 'Select ID type and capture with the camera',
    kycCameraOpenIdCard: 'Turn on camera (ID card)',
    kycCameraOpenPassport: 'Turn on camera (passport)',
    kycIdCaptureTitleFrontIdCard: 'Capture front of ID card',
    kycIdCaptureTitleFrontPassport: 'Capture passport information page',
    kycIdCaptureTitleBack: 'Capture back of ID card',
    kycIdAlignInGuide: 'Align your ID within the guide frame',
    kycIdPlaceInFrame: 'Place your ID inside the guide frame',
    kycIdFullDocumentVisible: 'Make sure the full document is visible',
    kycImageConfirmTitle: 'Review images',
    kycImageConfirmDesc: 'Please confirm the captured images',
    kycIdSideFront: 'Front',
    kycIdSideBack: 'Back',
    kycShootBackSide: 'Capture back',
    kycRetakeCapture: 'Retake',
    kycFormTitleEnterIdInfo: 'Enter ID details',
    kycFormDescEnterIdInfo: 'Enter the information as shown on your ID',
    kycFormIdNumberLabel: 'ID number',
    kycFormDateOfBirthLabel: 'Date of birth',
    kycFormIssueDateLabel: 'Issue date',
    kycFormExpiryDateLabel: 'Expiry date',
    kycFormNextStep: 'Next step',
    kycFormRequiredFieldsMissing: 'Please fill in all required fields',
    kycFormImageRequired: 'Please select an image',
    kycCaptureCanvasError: 'Could not create canvas',
    kycCaptureFailedGeneric: 'Capture failed',
    cameraErrPermissionDenied:
      'Camera permission was denied. Allow camera access in your device settings and try again.',
    cameraErrNotFound: 'No available camera was found.',
    cameraErrGeneric: 'Camera error: {{detail}}',
    apiSyncErrorTransient:
      'Something went wrong. Check your internet connection and try again shortly.',
    userFacingAuthOrSessionError:
      'Something went wrong. Try again later or check your sign-in status.',
    bookingCreateFailedMessage:
      'Could not create the booking. Please try again later.',
    bookingPaymentCompleteFailedMessage:
      'Payment could not be completed. Check your connection and try again.',
    bookingPaymentMetaDefaultError:
      'Could not sync payment details to the server. Please try again shortly.',
    bookingPaymentMetaCreateError:
      'Could not register payment metadata. Your booking was created—refresh before paying or contact support.',
    bookingPaymentToastRefundCancelledBody:
      'Following a payment (refund) update, the booking was cancelled. Check status in My bookings.',
    bookingPaymentToastConfirmedBody:
      'Payment completed and your booking is confirmed.',
    bookingPaymentToastSyncedBody:
      'Payment details were saved. See the latest status in My bookings.',
    bookingRefundToastCancelledBody:
      'Refund applied and the booking was cancelled (refunded).',
    bookingRefundToastSyncedBody: 'Refund payment details were saved to the server.',
    bookingSyncImmediateFailed:
      'Could not save bookings. Please try again shortly.',
    bookingErrorPaymentNotCompleted: 'Payment has not been completed.',
    appPaymentErrUnparseableResponse: 'Could not parse the server response.',
    appPaymentErrRejected: 'The request was rejected.',
    appPaymentErrHttpStatus: 'Request failed (HTTP {{status}})',
    topBarUnreadChatSubtitle: '{n} unread message(s)',
    topBarNoNotifications: 'No new notifications',
    topBarAriaNotifications: 'Notifications',
    topBarAriaProfile: 'Profile menu',
    topBarAriaLogin: 'Log in',
    adminAccountsListLoadFailed: 'Could not load the list.',
    adminAccountsSaveFailed: 'Save failed.',
    adminAccountsCreateFailed: 'Could not create the account.',
    adminAccountsToggleFailed: 'Could not update the role.',
    apiErrAdminAccountInvalidInput:
      'Check username (3–64 chars, letters, digits, . _ -) and password (at least 8 characters).',
    apiErrAdminUsernameTaken: 'This username may already exist.',
    apiErrAdminUsernameInvalid: 'Invalid username format.',
    apiErrAdminUsernameConflict: 'That username is already in use.',
    apiErrAdminNewPasswordTooShort: 'New password must be at least 8 characters.',
    apiErrAdminCurrentPasswordInvalid: 'Current password is incorrect.',
    apiErrAdminCannotDemoteOwnSuper: 'You cannot remove your own super admin role here.',
    apiErrAdminCannotDemoteLastSuper: 'Cannot demote the last super administrator.',
    apiErrAdminNoValidUpdates: 'No valid changes to apply.',
    chatDateToday: 'Today',
    chatDateYesterday: 'Yesterday',
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
    popularStaysTitle: '人気の宿泊',
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
    whereDoYouWantToLive: 'エリアから宿泊・短期賃貸の情報を探す',
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
    loginWrongPassword: 'パスワードが正しくありません。',
    loginSocialLoginRequired: 'このアカウントはソーシャルログインで登録されています。',
    loginAccountBlocked: '管理者により利用が制限されているアカウントです。',
    loginNetworkError: 'ネットワークエラーです。しばらくしてからお試しください。',
    loginServerUnavailable: 'サーバーに接続できません。しばらくしてからお試しください。',
    adminUserBlockPrompt: 'ブロック理由を入力してください。',
    adminUserBlockDefaultReason: '管理者によるブロック',
    phoneSendOtpButton: '認証コードを送信',
    phoneEnterNumberPlaceholder: '電話番号を入力',
    phoneSelectCountry: '国・地域を選択',
    phoneOtpSentBadge: '送信済み',
    mapErrAwsApiKeyMissing:
      'AWS API キーが設定されていません。.env.local の NEXT_PUBLIC_AWS_API_KEY を確認してください。',
    mapErrAwsMapNameMissing:
      'AWS マップ名が設定されていません。.env.local の NEXT_PUBLIC_AWS_MAP_NAME を確認してください。',
    mapErrLoadGeneric: '地図の読み込み中にエラーが発生しました。',
    mapErrNetworkAws: 'ネットワークエラーで AWS 地図サービスに接続できません。',
    mapErrAwsKeyInvalid: 'AWS API キーが無効です。環境変数を確認してください。',
    mapErrMapNotFound: '地図リソースが見つかりません。Map 名を確認してください。',
    mapErrStyleLoad: '地図スタイルを読み込めませんでした。API キーと Map 名を確認してください。',
    mapErrorHeading: 'エラー',
    mapErrCheckEnvHint: 'NEXT_PUBLIC_AWS_API_KEY と NEXT_PUBLIC_AWS_MAP_NAME を確認してください。',
    legacyNewPropertyPageTitle: '新規物件を掲載',
    legacyNewPropertyFieldTitle: '物件名',
    legacyNewPropertyTitlePh: '例: 301号室、A棟',
    legacyNewPropertyDescVi: '説明（ベトナム語）',
    legacyNewPropertyAddrVi: '住所（ベトナム語）',
    legacyNewPropertyGeocoding: '座標を取得中…',
    legacyNewPropertyCoordsOk: '座標を取得しました',
    legacyNewPropertyAddrPh: '例: Quận 7, Thành phố Hồ Chí Minh',
    legacyNewPropertyCoordsLine: '座標: {{lat}}, {{lng}}',
    legacyNewPropertyPrice: '価格',
    legacyNewPropertyCurrency: '通貨',
    legacyNewPropertyArea: '面積 (m²)',
    legacyNewPropertyBedrooms: '寝室',
    legacyNewPropertyBathrooms: 'バスルーム',
    legacyNewPropertyCheckIn: 'チェックイン時間',
    legacyNewPropertyCheckOut: 'チェックアウト時間',
    legacyNewPropertyTimeAfter: '{{time}} 以降',
    legacyNewPropertyTimeBefore: '{{time}} 以前',
    legacyNewPropertyCheckInHelp: 'ゲストがチェックインできる時間',
    legacyNewPropertyCheckOutHelp: 'ゲストがチェックアウトする時間',
    legacyNewPropertyCancel: 'キャンセル',
    legacyNewPropertySubmit: '掲載する',
    legacyNewPropertySubmitting: '送信中…',
    legacyNewPropertySuccess: '物件を掲載しました。',
    legacyNewPropertyError: '掲載に失敗しました。',
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
    searchClearInputAria: '検索をクリア',
    locationBadgeCity: '都市',
    locationBadgeDistrict: '区/郡',
    locationBadgeLandmark: '名所',
    labelCity: '都市',
    labelDistrict: '区',
    selectDistrictPlaceholder: '区を選択',
    selectCityPlaceholder: '都市を選択',
    searchFiltersResetButton: 'フィルターをリセット',
    explorePopularCities: 'ベトナムの人気エリア',
    popularStaysViewMore: 'もっと見る',
    addressPatternTower: '{{name}}棟',
    addressPatternZone: '{{name}}エリア',
    addressPatternLobby: '{{name}}ロビー',
    addressPatternUnit: '{{name}}号室',
    adminKycPageTitle: 'KYCデータ',
    adminKycTotalRecordsTemplate: '{{count}} 件',
    adminKycRefreshButton: '更新',
    adminKycLoadingLabel: '読み込み...',
    adminKycEmptyMessage: 'データなし',
    adminKycNoNameFallback: '名前なし',
    bookingGuestSummaryWithChildren: '大人{{adults}}名、子ども{{children}}名',
    bookingGuestSummaryAdultsOnly: '大人{{adults}}名',
    searchRoomTypeStudio: 'スタジオ',
    searchRoomTypeOneRoom: '1ルーム（寝室+リビング）',
    searchRoomTypeTwoRoom: '2ルーム',
    searchRoomTypeThreePlus: '3ルーム以上',
    searchRoomTypeDetached: '戸建て',
    adminKycStatusVerified: '認証済み',
    adminKycStatusPending: '審査中',
    adminKycStatusRejected: '却下',
    adminKycStatusUnverified: '未認証',
    adminKycSubtitleNew: '新規 {{count}} 件',
    adminKycSubtitleVerified: '認証済み {{count}} 件',
    adminKycSubtitleUnverified: '未認証 {{count}} 件',
    adminKycTabNew: '新規',
    adminKycTabAll: 'すべて',
    adminKycTabVerified: '認証済み',
    adminKycTabUnverified: '未認証',
    adminKycColVerificationStatus: '認証状態',
    adminKycColIdDocument: '身分証明書',
    adminKycColDateOfBirth: '生年月日',
    adminKycIdTypePassportLabel: 'パスポート',
    adminKycIdTypeIdCardLabel: '身分証',
    adminKycMobileIdPrefix: 'ID',
    adminKycMobileDobPrefix: '生年月日',
    adminSettlementsEmptyRequest:
      '承認依頼の精算はありません。（チェックアウト後・契約終了後に表示されます。）',
    adminSettlementsEmptyPending: '承認待ちの件はありません。',
    adminSettlementsEmptyApproved: '承認済み（有効）の件はありません。',
    adminSettlementsEmptyHeld: '保留中の精算はありません。',
    adminSettlementsListFilteredEmpty: '検索・並べ替え・フィルターに一致する件はありません。',
    adminContractsEmptyNew: '新規契約の件はありません。',
    adminContractsEmptySealed: '契約締結（決済・確定、宿泊前）の予約はありません。',
    adminContractsEmptyInProgress: '契約進行中（チェックイン～チェックアウト）の予約はありません。',
    adminContractsEmptyCompleted: '契約終了（チェックアウト後・利用完了）の予約はありません。',
    adminRefundsEmptyAll: '返金待ちの件はありません。',
    adminRefundsEmptyNew: '新規の返金待ちはありません。',
    adminRefundsEmptyPre: '契約前の返金待ちはありません。',
    adminRefundsEmptyDuring: '契約中の返金待ちはありません。',
    adminWithdrawalsEmptyPending: '承認待ちの出金はありません。',
    adminWithdrawalsEmptyProcessing: '処理中の出金はありません。',
    adminWithdrawalsEmptyCompleted: '完了した出金履歴はありません。',
    adminWithdrawalsEmptyRejected: '却下された出金はありません。',
    adminWithdrawalsEmptyHeld: '保留中の出金はありません。',
    adminCommonRefresh: '更新',
    adminCommonLoading: '読み込み中...',
    adminSettlementsTabRequest: '承認依頼',
    adminSettlementsTabPending: '承認待ち',
    adminSettlementsTabApproved: '承認済み',
    adminSettlementsTabHeld: '保留',
    adminSettlementsPageTitle: '精算承認',
    adminSettlementsIntroLine:
      '承認依頼はチェックアウト後（契約終了後）にのみ作成されます。確認後に承認待ちへ進め、承認または保留を処理してください。チェックアウトから24時間後の承認で出金可能額に反映されます。・依頼 {{req}} ・待ち {{pend}} ・完了 {{appr}} ・保留 {{held}}',
    adminSettlementsBadgeContractEnded: '契約終了後の取込',
    adminContractsPageTitle: '契約',
    adminContractsIntroLine:
      '締結 → 宿泊中 → 終了（チェックアウト後）· 締結 {{sealed}} · 進行 {{inProgress}} · 終了 {{completed}}',
    adminContractsTabNew: '新規',
    adminContractsTabSealed: '契約締結',
    adminContractsTabInProgress: '契約進行',
    adminContractsTabCompleted: '契約終了',
    adminContractsSearchPlaceholder: 'メール、UID、予約・物件名、金額…',
    adminContractsSearchHint: '選択中のタブ内のみ検索されます。',
    adminRefundsPageTitle: '返金',
    adminRefundsIntroLine:
      'キャンセル済み・決済済みの予約の返金を承認します。・契約前 {{pre}}・契約中 {{during}}',
    adminRefundsTabNew: '新規',
    adminRefundsTabAll: 'すべて',
    adminRefundsTabPre: '契約前の返金',
    adminRefundsTabDuring: '契約中の返金',
    adminRefundsSearchPlaceholder: 'メール、UID、予約・物件名、金額…',
    adminRefundsSearchHint: '選択中のタブ内のみ検索されます。',
    adminRefundsApproveButton: '返金を承認',
    adminWithdrawalsPageTitle: '出金リクエスト承認',
    adminWithdrawalsIntroLine:
      'カテゴリごとに確認してください。・待ち {{pending}} ・処理 {{processing}} ・却下 {{rejected}} ・完了 {{completed}} ・保留 {{held}}',
    adminWithdrawalsTabPending: '承認待ち',
    adminWithdrawalsTabProcessing: '処理中',
    adminWithdrawalsTabRejected: '却下',
    adminWithdrawalsTabCompleted: '完了',
    adminWithdrawalsTabHeld: '保留',
    adminWithdrawalsSearchPlaceholder: 'メール、UID、口座ラベル、金額…',
    adminWithdrawalsSearchHint: '選択中のタブ内のみ検索されます。',
    adminWithdrawalApprove: '承認',
    adminWithdrawalReject: '却下',
    adminWithdrawalHold: '保留',
    adminWithdrawalComplete: '完了',
    adminWithdrawalResume: '再開',
    adminWithdrawalBadgeCompleted: '完了',
    adminWithdrawalBadgeRejected: '却下',
    adminWithdrawalRejectReason: '管理者による却下',
    adminWithdrawalHoldReason: '管理者による保留',
    csvKycColFullName: '氏名',
    csvKycColPhone: '連絡先',
    csvKycColIdType: '身分証の種類',
    csvKycColIdNumber: '番号',
    csvKycColDateOfBirth: '生年月日',
    csvKycColIdFrontUrl: '身分証写真URL（表面）',
    csvKycColIdBackUrl: '身分証写真URL（裏面）',
    csvKycColFaceUrl: '顔写真URL',
    csvKycColSubmittedAt: '申請日時',
    csvKycColVerificationStatus: '認証状態',
    adminKycCsvDownloadError: 'CSVのダウンロード中にエラーが発生しました。',
    adminSettlementsSearchHint: '選択中のタブ内のみ検索されます。',
    adminSettlementsFilterLabel: 'フィルター',
    adminSettlementsFilterTitle24hBaseline:
      '基準: チェックアウト終了から24時間。3つのうち1つのみ選択。',
    adminSettlementsSortRemainingAscTitle: '期限が早い順（残り時間昇順）',
    adminSettlementsSortRemainingDescTitle: '期限が遅い順（残り時間降順）',
    adminSettlementsFilterElapsed24hTitle:
      'チェックアウト+24時間経過のみ表示（↑・↓とは同時選択不可）',
    adminSettlementsSortRemainingAsc: '残り ↑',
    adminSettlementsSortRemainingDesc: '残り ↓',
    adminSettlementsFilterElapsed24h: '24h経過',
    adminSettlementActionMoveToPending: '承認待ちへ',
    adminSettlementResumeToRequest: '復元（依頼）',
    adminSettlementResumeToPending: '復元（待ち）',
    adminAuditPageTitle: '監査ログ',
    adminAuditPageIntro: '資金・運用操作・担当者・時刻（タブ）',
    adminAuditSearchPlaceholder: '操作、owner/ref、備考、担当者…',
    adminAuditSearchHint: '選択中のタブ内のみ検索されます。',
    adminAuditEmpty: '該当するログがありません。',
    adminAuditColAction: '操作',
    adminAuditColAmount: '金額',
    adminAuditColOwnerTarget: 'owner / 対象',
    adminAuditColRef: 'ref',
    adminAuditColActor: '担当者',
    adminAuditColNote: '備考',
    adminAuditColTime: '日時',
    adminAuditAmountDash: '金額 —',
    adminAuditMobileTarget: '対象:',
    adminAuditMobileActor: '担当:',
    adminAuditTabNew: '新規',
    adminAuditTabAll: 'すべて',
    adminAuditTabSettlement: '精算',
    adminAuditTabWithdrawal: '出金',
    adminAuditTabRefund: '返金',
    adminAuditTabAccount: 'アカウント',
    adminAuditTabProperty: '物件',
    adminAuditLedgerSettlementApproved: '精算承認',
    adminAuditLedgerSettlementHeld: '精算保留',
    adminAuditLedgerSettlementResumed: '精算再開（承認維持）',
    adminAuditLedgerSettlementRevertedPending: '精算復元 → 承認待ち',
    adminAuditLedgerSettlementRevertedRequest: '精算復元 → 承認依頼',
    adminAuditLedgerWithdrawalRequested: '出金依頼',
    adminAuditLedgerWithdrawalProcessing: '出金承認（処理中）',
    adminAuditLedgerWithdrawalHeld: '出金保留',
    adminAuditLedgerWithdrawalResumed: '出金再開',
    adminAuditLedgerWithdrawalCompleted: '出金完了',
    adminAuditLedgerWithdrawalRejectedRefund: '出金却下・返金',
    adminAuditLedgerRefundApproved: '返金承認',
    adminAuditModUserBlocked: 'アカウント停止',
    adminAuditModUserRestored: 'アカウント復元',
    adminAuditModPropertyHidden: '物件非表示',
    adminAuditModPropertyRestored: '物件復元',
    adminAuditModPropertyAdEndedByHost: '物件広告終了（ホスト）',
    adminAuditModPropertyDeletedByHost: '物件削除（ホスト）',
    adminUiBadPath: 'パスが正しくありません。',
    adminUiLoadingEllipsis: '読み込み中…',
    adminUiNoQueryResults: '該当がありません。',
    adminPaginationPrev: '前へ',
    adminPaginationNext: '次へ',
    adminPaginationLine: '{{page}} / {{total}} · {{count}}件',
    adminFilterNew: '新規',
    adminFilterAll: 'すべて',
    adminUserFilterActive: '正常',
    adminUserFilterBlocked: 'ブロック',
    adminUsersTitle: 'アカウント管理',
    adminUsersIntroLine:
      '新規=登録24h以内（行クリックで確認・当日のみ一覧） · 新規{{nNew}} · 全{{nAll}} · 正常{{nActive}} · ブロック{{nBlocked}}',
    adminUsersSearchPlaceholder: 'uid / メール / 名前',
    adminUsersSearchHint: '選択タブ内のみ検索されます。',
    adminColAlert: '通知',
    adminColName: '名前',
    adminColEmail: 'メール',
    adminColPhone: '電話',
    adminColUid: 'UID',
    adminColStatus: '状態',
    adminColActions: '操作',
    adminPingTitleUnseen: '未確認',
    adminPingTitleAck: '未確認',
    adminAriaUnseenNewUser: '未確認の新規アカウント',
    adminAriaAckNewUser: '確認済み新規アカウント',
    adminDotUnseen: '未確認',
    adminDotAcked: '確認済',
    adminStatusNormal: '正常',
    adminStatusBlocked: 'ブロック',
    adminActionRestore: '復元',
    adminActionBlock: 'ブロック',
    adminPropertiesTitle: '物件管理',
    adminPropertiesIntroLine:
      '親物件のみ · 新規は未確認まで維持 · 確認後は当日のみ · 新着順 · 全{{nAll}} · 新規{{nNew}} · 掲載{{nListed}} · 広告終了{{nPaused}} · 非表示{{nHidden}}',
    adminPropFilterListed: '掲載',
    adminPropFilterPaused: '広告終了',
    adminPropFilterHidden: '非表示',
    adminPropertiesSearchPlaceholder: 'id / タイトル / owner / 住所',
    adminPropertiesSearchHint: 'タブ内検索。掲載=ゲスト画面と同様に予約可。',
    adminPropColTitle: 'タイトル',
    adminPropColAddress: '住所',
    adminPropColOwner: 'Owner',
    adminPropColId: 'ID',
    adminListingHidden: '非表示',
    adminListingAdPaused: '広告終了',
    adminListingLive: '掲載中',
    adminPropUnhide: '復元',
    adminPropHide: '非表示',
    adminAriaUnseenNewProperty: '未確認の新規物件',
    adminAriaAckNewProperty: '確認済み新規物件',
    adminPropertiesHiddenReasonLabel: '非表示理由（固定）:',
    adminNotFoundUser: 'アカウントが見つかりません。',
    adminBackToUsersList: 'アカウント一覧へ',
    adminNotFoundProperty: '物件が見つかりません。',
    adminBackToPropertiesList: '物件一覧へ',
    adminUserDetailBack: '戻る',
    adminNoDisplayName: '名前なし',
    adminUserBadgeSuspended: '停止中',
    adminUserBadgeActive: '有効',
    adminLabelHostMemo: 'ホスト用メモ',
    adminLabelGuestMemo: 'ゲスト用メモ',
    adminMemoEmpty: 'メモなし',
    adminMemoPlaceholderHost: 'ホスト対応メモ',
    adminMemoPlaceholderGuest: 'ゲスト対応メモ',
    adminMemoNewestFirst: '新しいメモが上に表示されます。',
    adminUserUnblock: 'ブロック解除',
    adminUserBlockAccount: 'アカウント停止',
    adminSectionProfileStatus: '登録情報・状態',
    adminSectionHost: 'ホスト',
    adminSectionGuest: 'ゲスト',
    adminLabelKyc: 'KYC',
    adminUserJoinedAt: '登録日',
    adminUserStatHostBookingsTotal: '予約件数（全）',
    adminUserStatInProgress: '進行中',
    adminUserStatCompleted: '完了',
    adminUserStatCancelled: 'キャンセル',
    adminUserBalanceTitle: '残高状況',
    adminUserBalanceAvailable: '出金可能',
    adminUserBalanceApprovedRevenue: '承認売上合計',
    adminUserBalancePendingWithdraw: '出金処理中・保留',
    adminUserGuestCurrentRes: '現在の予約',
    adminUserGuestDepositPending: '入金待ち',
    adminUserGuestContractDone: '契約完了',
    adminUserRefundsHeading: '返金関連予約',
    adminUserRefundsEmpty: '該当なし。',
    adminUserRefundsColBookingId: '予約ID',
    adminUserRefundsColProperty: '物件',
    adminUserRefundsColAmount: '金額',
    adminUserRefundsColPayment: '決済',
    adminUserRefundsColRefund: '返金処理',
    adminRefundStatusDone: '返金済',
    adminRefundStatusAdminOk: '管理者承認済',
    adminRefundStatusPending: '承認待ち',
    adminPropertyDetailBackList: '物件一覧',
    adminPropertyNoTitle: 'タイトルなし',
    adminPropertyAdminMemo: '管理者メモ',
    adminPropertyMemoPlaceholder: '物件関連メモ',
    adminPropertyViewHost: 'ホストを表示',
    adminPropertyUnhide: '非表示解除',
    adminPropertyHide: '非表示',
    adminSectionHostId: 'ホスト・識別',
    adminLabelOwnerId: 'Owner ID',
    adminLabelDisplayName: '表示名',
    adminSectionPriceAreaGuests: '価格・面積・人数',
    adminLabelWeeklyRent: '週額',
    adminLabelAreaSqm: '面積',
    adminLabelBedBath: '寝室・浴室',
    adminLabelBedroomsBathrooms: '寝室{{bed}} · 浴室{{bath}}',
    adminLabelMaxGuests: '最大人数',
    adminLabelAdultsChildren: '大人{{adults}} · 子供{{children}}',
    adminSectionLocation: '所在地',
    adminLabelAddress: '住所',
    adminLabelUnitNumber: '号室',
    adminLabelCityDistrictIds: 'city / district',
    adminLabelCoordinates: '座標',
    adminSectionDescription: '説明',
    adminPropertyDescOriginalVi: 'ベトナム語原文',
    adminPropertyDescTranslatedKo: '翻訳（韓国語）',
    adminSectionPhotos: '写真',
    adminPropertyNoImages: '画像なし',
    adminSectionAmenitiesType: '設備・タイプ',
    adminLabelPropertyType: 'タイプ',
    adminLabelCleaningPerWeek: '週次清掃',
    adminSectionPets: 'ペット',
    adminLabelPetAllowed: '可',
    adminLabelYes: 'はい',
    adminLabelNo: 'いいえ',
    adminLabelPetFeePerPet: '追加料金(VND/匹)',
    adminLabelMaxPets: '最大匹数',
    adminSectionSchedule: '日程・チェックイン',
    adminLabelRentStart: '希望開始',
    adminLabelRentEnd: '希望終了',
    adminLabelCheckInTime: 'チェックイン',
    adminLabelCheckOutTime: 'チェックアウト',
    adminSectionIcal: '外部カレンダー(iCal)',
    adminLabelIcalPlatform: 'プラットフォーム',
    adminLabelIcalCalendarName: 'カレンダー名',
    adminLabelUrl: 'URL',
    adminSectionChangeHistory: '変更履歴',
    adminPropertyMetaCreated: '作成',
    adminPropertyMetaUpdated: '更新',
    adminPropertyDeletedFlag: 'ホスト削除フラグ: deleted',
    adminSystemLogTitle: 'システムログ',
    adminSystemLogChecklist:
      '5分チェック: ①5xx/401/403急増 ②予約・決済失敗 ③KYC失敗 ④同一メッセージ連発 ⑤bookingId/ownerIdで追跡',
    adminSystemLogFilterNew: '新規',
    adminSystemLogFilterAll: 'すべて',
    adminSystemLogFilterError: 'エラー',
    adminSystemLogFilterWarning: '警告',
    adminSystemLogFilterInfo: '情報',
    adminSystemLogExportCsv: 'CSV出力',
    adminSystemLogClearEphemeral: '揮発ログ削除',
    adminSystemLogClearPersistent: '永続ログ初期化',
    adminSystemLogCountLine: '表示{{shown}}件 · {{page}}/{{pages}}ページ',
    adminSystemLogColTime: '時刻',
    adminSystemLogColSeverity: '重大度',
    adminSystemLogColCategory: '分類',
    adminSystemLogColMessage: 'メッセージ',
    adminSystemLogColBookingId: 'bookingId',
    adminSystemLogColOwnerId: 'ownerId',
    adminSystemLogColSnapshot: 'スナップショット',
    adminSystemLogColCopy: 'コピー',
    adminSystemLogEmpty: '表示するログがありません。',
    adminSystemLogLinkSettlements: '精算',
    adminSystemLogSettlementsSearchHint: '精算画面の検索にIDを貼り付け',
    adminSystemLogCopyRowTitle: '行をコピー',
    adminSystemLogFooterNote:
      '予約IDは精算・契約の検索に貼り付け。分析はCSV利用（機密を含めない）。',
    adminPropertyLogsTitle: '物件削除・取消履歴',
    adminPropertyLogsIntro: 'サーバー台帳 — DELETED / CANCELLED',
    adminPropertyLogsTabAll: 'すべて',
    adminPropertyLogsTabDeleted: '永久削除',
    adminPropertyLogsTabCancelled: '予約取消',
    adminPropertyLogsColTime: '日時',
    adminPropertyLogsColType: '種別',
    adminPropertyLogsColPropertyId: 'propertyId',
    adminPropertyLogsColOwnerId: 'ownerId',
    adminPropertyLogsColRecorder: '記録者',
    adminPropertyLogsColReservation: 'reservation',
    adminPropertyLogsColNote: '備考',
    adminPropertyLogsEmpty: '記録がありません。',
    adminAccountsTitle: '管理者アカウント',
    adminAccountsIntro: 'スーパーのみ · クリックしてID・表示名・パス・権限を編集',
    adminAccountsNewButton: '新規管理者',
    adminAccountsFormNewTitle: '新規アカウント',
    adminAccountsLabelUsername: 'ログインID',
    adminAccountsLabelNickname: 'ニックネーム',
    adminAccountsNicknamePlaceholder: '表示名',
    adminAccountsPasswordMin: 'パスワード（8文字以上）',
    adminAccountsCreateSuper: 'スーパー管理者で作成',
    adminAccountsCreateSubmit: '作成',
    adminAccountsListTitle: 'アカウント一覧',
    adminAccountsRoleSuper: 'スーパー',
    adminAccountsRoleNormal: '一般',
    adminAccountsSelectPrompt: '左からアカウントを選択してください。',
    adminAccountsProfileToggle: 'アカウント情報',
    adminAccountsProfileExpand: '展開',
    adminAccountsProfileCollapse: '折りたたみ',
    adminAccountsProfileNote: 'ID・表示名・パスはスーパーのみここで編集。',
    adminAccountsEditNickname: 'ニックネーム',
    adminAccountsEditUsername: 'ログインID',
    adminAccountsEditNewPassword: '新パスワード（空で維持）',
    adminAccountsEditCurrentPassword: '現在のパスワード',
    adminAccountsSaveProfile: '保存',
    adminAccountsSaving: '保存中…',
    adminAccountsRolesHeading: 'ロール・権限',
    adminAccountsSuperAllMenus: 'スーパーは全メニューにアクセス。',
    adminAccountsDemoteSuper: '一般管理者に変更',
    adminAccountsSuperCheckbox: 'スーパー管理者',
    adminAccountsPermHint: 'チェックしたメニューのみナビに表示。',
    adminAccountsSavePerms: '権限のみ保存',
    adminAccountsSelfPermNote: '自分のメニュー権限はここでは変更しません。',
    adminNavDashboard: 'ダッシュボード',
    adminNavUsers: 'アカウント',
    adminNavProperties: '物件',
    adminNavPropertyLogs: '物件ログ',
    adminNavContracts: '契約',
    adminNavSettlements: '精算',
    adminNavRefunds: '返金',
    adminNavWithdrawals: '出金',
    adminNavAudit: '監査',
    adminNavKyc: 'KYC',
    adminNavSystemLog: 'システムログ',
    adminHomeTitle: '管理者ダッシュボード',
    adminHomeSubtitle:
      '下のメニューまたは上部バーから業務画面を開けます。',
    adminNavMenuAriaLabel: '管理者メニュー',
    adminNavBadgeAria: 'お知らせ {{count}}件',
    adminNavDescUsers: '停止・復旧と検索',
    adminNavDescProperties: '非表示・復旧',
    adminNavDescPropertyLogs: '削除・取消のサーバーログ',
    adminNavDescContracts: '締結・賃貸開始の予約',
    adminNavDescSettlements: '出金可能額の反映承認',
    adminNavDescRefunds: 'キャンセル返金の承認',
    adminNavDescWithdrawals: '出金依頼の処理',
    adminNavDescAudit: '金銭・操作ログ',
    adminNavDescKyc: '本人確認・審査',
    adminNavDescSystemLog: 'クライアントエラー・警告・揮発情報',
    adminLoginTitle: '管理者ログイン',
    adminLoginSubtitle: '500 STAY Admin · PC',
    adminLoginUsernameLabel: 'ID',
    adminLoginPasswordLabel: 'パスワード',
    adminLoginSubmit: 'ログイン',
    adminLoginError: 'IDまたはパスワードが正しくありません。（DB未接続時はサーバーログ）',
    adminLoginBootstrapNote:
      '初回: ADMIN_BOOTSTRAP_* または NEXT_PUBLIC_ADMIN_* と同じアカウントでスーパーがDBに作成されます。',
    adminLoginHomeLink: 'サイトトップへ',
    adminNoAccessTitle: '利用可能なメニューがありません',
    adminNoAccessBodyWithUser:
      'アカウント {{username}} に権限がありません。スーパー管理者に依頼してください。',
    adminNoAccessBodyGeneric: 'スーパー管理者にメニュー権限を依頼してください。',
    adminNoAccessLogout: 'ログアウトして別アカウントでログイン',
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
    dateBadgeRangeTemplate: '{{start}}～{{end}}',
    dateBadgeFromTemplate: '{{date}}から',
    searchButton: '検索',
    noResultsFound: '検索結果がありません。',
    propertiesFound: '件の物件が見つかりました。',
    minExceedsMaxError: '最低値は最高値を超えられません。修正してください。',
    maxBelowMinError: '最高値は最低値より低くできません。修正してください。',
    searchFilterPriceRangeLabel: '価格帯',
    searchFilterFacilityPickHeading: '設備を選択',
    searchPriceRangeDragHint: 'ドラッグして価格帯を調整',
    searchRentPerWeekFragment: '週あたり',
    chatSendingMessage: '送信中...',
    chatInputInProgressStatus: '入力中...',
    signupErrorRequiredFields: '必須項目をすべて入力してください。',
    signupErrorInvalidEmailFormat: '正しいメールアドレスを入力してください。',
    signupErrorPasswordMismatch: 'パスワードが一致しません。',
    signupErrorPasswordMinLength: 'パスワードは6文字以上にしてください。',
    signupErrorPhoneVerificationRequired: '電話番号の認証を完了してください。',
    signupErrorOtpSendFailed: '認証コードを送信できませんでした。しばらくしてから再度お試しください。',
    signupErrorOtpSendSystem: '認証コードの送信中にエラーが発生しました。',
    signupErrorOtpInvalidCode: '認証コードが正しくありません。',
    signupErrorOtpVerifyFailed: '認証処理中にエラーが発生しました。',
    signupErrorFailedGeneric: '登録に失敗しました。',
    signupErrorUnexpected: '予期しないエラーが発生しました。',
    signupErrorSocialLoginFailed: 'ソーシャルログインに失敗しました。',
    uiTranslateButtonLoading: '翻訳中...',
    uiTranslateViewOriginal: '原文を見る',
    uiTranslateShowTranslation: '翻訳する',
    emailWelcomeTitle: '[500 STAY VN] ご登録ありがとうございます',
    emailWelcomeBody:
      '{{name}} 様\n\n500 STAY VN（宿泊用の賃貸情報提供サービス）にご登録いただきありがとうございます。\nアプリから物件検索・予約・ホストとのメッセージができます。\n\n本メールは送信専用です。',
    emailBookingConfirmedGuestTitle: '[500 STAY VN] 予約が確定しました',
    emailBookingConfirmedGuestBody:
      '{{guestName}} 様\n\nご予約が確定しました。\n予約番号: {{bookingId}}\n物件: {{propertyTitle}}\nチェックイン: {{checkIn}} / チェックアウト: {{checkOut}}\n\n詳細はアプリの予約一覧からご確認ください。',
    emailBookingConfirmedHostTitle: '[500 STAY VN] 予約が確定しました（ホスト向け）',
    emailBookingConfirmedHostBody:
      '{{hostName}} 様\n\nゲスト {{guestName}} 様の予約が確定しました。\n予約番号: {{bookingId}}\n物件: {{propertyTitle}}\nチェックイン: {{checkIn}} / チェックアウト: {{checkOut}}\n\nアプリでスケジュールとメッセージをご確認ください。',
    emailBookingCancelledGuestTitle: '[500 STAY VN] 予約がキャンセルされました',
    emailBookingCancelledGuestBody:
      '{{guestName}} 様\n\n次の予約がキャンセルされました。\n予約番号: {{bookingId}}\n物件: {{propertyTitle}}\n\nお問い合わせはアプリ内サポートへどうぞ。',
    emailOtpCodeTitle: '[500 STAY VN] 認証コードのご案内',
    emailOtpCodeBody:
      '認証コード: {{code}}\n\n有効期限は {{minutes}} 分です。お心当たりがない場合は、このメールは無視してください。',
    emailPasswordResetTitle: '[500 STAY VN] パスワードの再設定',
    emailPasswordResetBody:
      'パスワードを再設定するには、次のリンクを開いてください。\n{{resetLink}}\n\n有効期限は {{hours}} 時間です。お心当たりがない場合は、このメールは無視してください。',
    emailVerifyEmailTitle: '[500 STAY VN] メールアドレスの確認',
    emailVerifyEmailBody:
      'メール認証を完了するには、次のリンクを開いてください。\n{{verifyLink}}\n\nお心当たりがない場合は、このメールは無視してください。',
    emailHostNewBookingRequestTitle: '[500 STAY VN] 新しい予約リクエスト',
    emailHostNewBookingRequestBody:
      '{{hostName}} 様\n\n{{guestName}} 様から予約リクエストがありました。\n物件: {{propertyTitle}}\n希望チェックイン: {{checkIn}} / チェックアウト: {{checkOut}}\n\nアプリで承認または辞退をお願いします。',
    emailPayoutProcessedTitle: '[500 STAY VN] お支払いのお知らせ',
    emailPayoutProcessedBody:
      '{{name}} 様\n\nご依頼の精算（お支払い）の処理が完了しました。\n金額: {{amount}} {{currency}}\n\n詳細はアプリの精算画面でご確認ください。',
    emailGenericFooterNotice:
      '500 STAY VN は宿泊・短期賃貸に関する情報と連絡のための機能を提供するプラットフォームです。利用者間の契約の当事者ではありません。',
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
    incomeStatusRevenueConfirmed: '収益確定',
    incomeStatusSettlementRequest: '承認依頼中',
    incomeStatusSettlementPending: '承認待ち中',
    incomeStatusSettlementApproved: '精算済み',
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
    fullNamePlaceholder: '氏名を入力してください',
    signupOtpVerify: '認証',
    phoneVerificationComplete: '電話番号の認証が完了しました',
    confirmPasswordLabel: 'パスワードの確認',
    confirmPasswordPlaceholder: 'パスワードを再入力してください',
    otpCodePlaceholder: '6桁の認証コード',
    deleteAccountTitle: 'アカウント削除のご案内',
    deleteAccountIntro:
      'アカウントの削除をご希望の場合は、下記メールまでお問い合わせください。',
    deleteAccountFooterNote:
      'お問い合わせの際にアカウント情報と削除理由をお知らせいただくと、迅速な対応が可能です。',
    legalFooterTerms: '利用規約',
    legalFooterPrivacy: 'プライバシーポリシー',
    legalFooterDeleteAccount: 'アカウント削除',
    legalFooterNavAriaLabel: '法的情報',
    toastHeadingSuccess: '完了',
    toastHeadingInfo: 'お知らせ',
    propertyNotFound: '物件が見つかりません。',
    bookPropertyTitle: '予約する',
    nightShort: '泊',
    bookingDatesLoadError: '日付情報を読み込めませんでした',
    guestInfoSectionTitle: '予約者情報',
    bookingGuestNamePlaceholder: '氏名',
    agreeTermsPrivacyBooking: '規約と個人情報の取り扱いに同意します（必須）',
    proceedToPaymentStep: '支払いへ進む',
    selectPaymentMethod: '支払い方法を選択',
    priceBreakdown: '料金内訳',
    perWeekSlash: '（週あたり）',
    petsShort: 'ペット',
    petCountClassifier: '匹',
    perPetPerWeekSlash: '（匹・週あたり）',
    bookingServiceFee: '予約手数料',
    totalAmountLabel: '合計',
    agreePaymentTermsCheckbox: '支払い条件に同意します（必須）',
    payNow: '支払う',
    processingInProgress: '処理中...',
    bookingDetailTitle: '予約詳細',
    paymentCompleteTitle: 'お支払いが完了しました！',
    waitingHostApproval: 'ホストの承認を待っています。',
    notifyWhenApprovedShort: '承認され次第お知らせします。',
    bookingSuccessGotIt: '閉じる',
    bookingNumberLabel: '予約番号',
    copyButton: 'コピー',
    copiedButton: 'コピー済み',
    bookingBadgeConfirmed: '確定',
    bookingBadgeCancelled: 'キャンセル',
    bookingBadgePending: '承認待ち',
    propertyInfoHeading: '宿泊先情報',
    bookingDetailSectionTitle: '予約の詳細',
    bookerFieldLabel: '予約者',
    phoneFieldLabel: '電話番号',
    stayNightsUnit: '泊',
    specialRequestsHeading: 'リクエスト',
    weeklyPriceShort: '週料金',
    petFeeShortLabel: '匹あたり',
    totalPaymentHeading: 'お支払い合計',
    paymentStatusPaidLabel: '支払い済み',
    paymentStatusPendingLabel: '未払い',
    backToHomeButton: 'ホームに戻る',
    viewBookingsHistoryButton: '予約履歴を見る',
    bookingSuccessLoadFailed:
      '予約情報を読み込めませんでした。一覧から再度ご確認ください。',
    bookingSuccessBookingIdMissing: '予約番号がありません。',
    bookingSuccessCopyOk: '予約番号をクリップボードにコピーしました。',
    bookingSuccessCopyFail:
      'コピーに失敗しました。番号を選択して手動でコピーしてください。',
    priceUnitVndSuffix: 'VND',
    reservationCancelRelistMerged:
      'キャンセルした期間を掲載中の物件と統合しました。物件数は変わりません。',
    reservationCancelRelistRelisted:
      '予約がキャンセルされ、物件が再掲載されました。',
    reservationCancelRelistLimitExceeded:
      '予約がキャンセルされました。「掲載待ち」タブから再登録してください。',
    reservationCancelRelistShortTerm:
      '予約がキャンセルされ、「掲載待ち」に移動しました。期間を修正してから再掲載してください。',
    reservationStatusUpdateError:
      '予約ステータスの更新中にエラーが発生しました。',
    hostReservationRecordDeleteConfirm: 'この記録を完全に削除しますか？',
    hostReservationRecordDeleteError: '記録の削除中にエラーが発生しました。',
    hostReservationLabelCompleted: '予約完了',
    paymentMethodLabelMomo: 'MoMo',
    paymentMethodLabelZalopay: 'ZaloPay',
    paymentMethodLabelBankTransfer: '銀行振込',
    paymentMethodLabelPayAtProperty: '現地払い',
    bookingDetailsPaymentHeading: 'お支払い情報',
    bookingDetailsPayMethodRowLabel: 'お支払い方法',
    bookingDetailsAccommodationLine: '宿泊料金',
    bookingDetailsFeesVatLine: '手数料・消費税等',
    bookingDetailsTotalRow: '合計',
    bookingWeeksUnit: '週',
    hostBookingCardStatusPending: '予約リクエスト',
    hostBookingCardStatusConfirmed: '予約確定',
    hostBookingCardStatusRequestCancelled: 'リクエストキャンセル',
    hostBookingCardStatusBookingCancelled: '予約キャンセル',
    myPropertiesPendingEndAdTitle: '掲載終了へ移動',
    myPropertiesPendingEndAdDesc:
      'この物件を掲載終了タブへ移します。データは保持されます。',
    myPropertiesDuplicateLiveTitle: '同一物件が掲載中です',
    myPropertiesDuplicateLiveHint:
      'はい: 掲載中の編集画面へ。日程はカレンダーで確認・変更してください。いいえ: この一覧に留まります（重複編集の防止）。',
    dialogNo: 'いいえ',
    dialogYes: 'はい',
    hostCancelModalTitle: 'キャンセルの確認',
    hostCancelModalAckLabel: '内容を確認しました。',
    hostBookingConfirmToastOk: '予約が確定しました。',
    hostBookingConfirmToastErr: '予約の確定に失敗しました。',
    hostBookingChatOpenErr: 'チャットを開けませんでした。',
    hostBookingRejectToastListingOk: '物件の状態が更新されました。',
    hostBookingRejectToastErr: '拒否の処理に失敗しました。',
    hostBookingDeleteConfirm: 'この予約を削除しますか？',
    hostBookingDeleteOk: '予約を削除しました。',
    hostBookingDeleteErr: '削除に失敗しました。',
    hostBookingCancelReasonByOwner: 'ホストが拒否/キャンセル',
    reservationServerTimeDetail: 'サーバー時刻を確認できません。しばらくしてから再度お試しください。',
    hostManageBookedPropertiesTitle: '予約中の物件管理',
    hostTabBookedProperties: '予約中',
    hostTabCompletedReservations: '完了済み',
    emptyNoActiveReservations: '予約中の物件はありません。',
    emptyNoCompletedReservations: '完了した予約はありません。',
    tenantInfoHeading: '借主情報',
    confirmReservationBtn: '予約を確定',
    markStayCompletedBtn: '滞在完了にする',
    deleteHistoryRecordTitle: '記録を削除',
    hostApproveBooking: '承認',
    cancelPolicyAgreeRequired: 'キャンセル規約に同意してください。',
    bookingCancelledToast: '予約をキャンセルしました。',
    bookingCancelFailed: 'キャンセルに失敗しました。',
    confirmDeleteBookingRecord: 'この予約記録を削除しますか？',
    bookingDeletedToast: '削除しました。',
    bookingDeleteFailed: '削除に失敗しました。',
    checkInOutScheduleTitle: 'チェックイン・チェックアウト時間',
    importExternalCalendar: '外部カレンダーを取り込む',
    calendarPlatformLabel: 'プラットフォーム',
    calendarOptionNone: 'なし',
    calendarOptionOther: 'その他',
    calendarNameLabel: 'カレンダー名',
    calendarNamePlaceholderExample: '例: Airbnb予約',
    removeAddressAriaLabel: '住所を削除',
    backNavLabel: '戻る',
    kycFirebasePhoneTitle: 'Firebase電話番号認証',
    kycFirebasePhoneSubtitle: 'Google Firebaseによる安全な電話番号認証',
    kycPhoneVerificationHeading: '電話番号認証',
    kycPhoneVerificationForHostDesc: 'ホスト認証のため電話番号を認証してください',
    kycPhoneVerifiedLong: '✅ 電話番号認証が完了しました。',
    kycNextStep: '次へ',
    kycTestModeProceed: 'テストモードで進む',
    calWarnTitleOwner: '期間を設定できません',
    calWarnTitleGuest: '予約できません',
    calWarnMinSevenBody: '7日単位でのみ予約できます。選択日から賃貸終了日まで7日未満です。別の日付を選んでください。',
    calSelectRentalStart: '賃貸開始日を選択',
    calSelectRentalEnd: '賃貸終了日を選択',
    calSelectCheckIn: 'チェックイン日を選択',
    calSelectCheckOut: 'チェックアウト日を選択',
    calOwnerLegendSelectableStart: '開始日として選択可能',
    calOwnerLegendSelectedStart: '選択した開始日',
    calOwnerLegendEndHint: '終了日（7日刻み、最大約3か月）',
    calOwnerLegendWithinPeriod: '賃貸期間中（クリックで開始日を変更）',
    calOwnerLegendOtherDates: 'その他の日付（クリックで開始日を変更）',
    calOwnerSelectStartFirst: '先に開始日を選択してください',
    calGuestLegendAvailable: '選択可能な日付',
    calGuestLegendMinSeven: '最低7泊、ブロック日を除く（チェックアウトは自由）',
    calGuestLegendBooked: '予約済み / 予約不可',
    calGuestLegendCheckoutOk: '既存予約のチェックアウト（チェックイン可）',
    calGuestLegendCheckoutDayAbbr: '退',
    calGuestLegendShortStayDemoDay: '31',
    calGuestLegendShortStay: '利用可能が7日未満（チェックイン不可）',
    calGuestLegendCheckinToEnd: '物件終了日（または上限）まで',
    calGuestLegendValidCheckout: '有効なチェックアウト（7泊以上・重複なし）',
    calGuestSelectCheckInFirst: '先にチェックイン日を選択してください',
    weeklyCostLabel: '/ 週',
    bookingOccupancyLabel: '利用人数',
    importExternalCalendarHelp:
      'Airbnb・Agodaなどの予約を500stayと同期します。iCal URL（.ics）を入力してください。',
    carouselPrevious: '前へ',
    carouselNext: '次へ',
    translationConsentTitle: '翻訳機能を使いますか？',
    translationConsentDescription:
      '翻訳を使うには同意が必要です。端末内蔵エンジンならオフラインでも使える場合があります。',
    translationConsentAgree: '同意して続行',
    translationConsentDecline: '拒否',
    translationLangPackTitle: '翻訳のダウンロード',
    translationLangPackDescription:
      '翻訳を使うには端末内蔵の翻訳（言語パック）のダウンロードが必要です。拒否すると、次に「翻訳」をタップした際に再度案内されます。約50MB必要。Wi-Fi推奨。',
    translationLangPackAgree: 'ダウンロードして続行',
    translationLangPackDecline: '後で',
    translationModalEngineLine: '使用エンジン: {{engine}}',
    translationModalWebRequiresNetwork: 'インターネット接続が必要です。',
    translationModalOfflineCapable: 'オフラインでも利用できます。',
    translationLangPackStorageTitle: '保存領域: 約50MB',
    translationLangPackStorageHint:
      'Wi-Fi接続を推奨します。ダウンロード後はオフラインで利用できます。',
    translationFooterConsentPrivacy:
      '同意によりプライバシーポリシーに同意したものとみなされます。',
    translationFooterLangPackDevice: '言語パックは端末のストレージに保存されます。',
    chatTranslatedByGemini: 'Gemini AI による自動翻訳です。',
    chatTranslatedByDevice: '端末エンジンによる自動翻訳です。',
    chatTranslationErrorLabel: '翻訳エラー',
    chatTranslateShowOriginalTitle: '原文を表示',
    chatTranslateShowTranslatedTitle: '翻訳を表示',
    chatTranslating: '翻訳中',
    chatExampleTitle: 'チャットメッセージの例',
    chatExampleHowToTitle: '使い方',
    chatExampleBullet1: '各メッセージ右下に翻訳ボタンがあります。',
    chatExampleBullet2: 'ベトナム語メッセージはUI言語に翻訳できます。',
    chatExampleBullet3: 'その他の言語も設定に応じて翻訳できます。',
    chatExampleBullet4: '翻訳後は「原文を表示」で切り替えられます。',
    chatExampleBullet5: '翻訳結果はキャッシュされ再利用されます。',
    chatExampleDemoGuestName: 'ミン・アイン',
    chatExampleDemoHostName: 'ホスト',
    chatExampleDemoTime1: '14:30',
    chatExampleDemoTime2: '14:32',
    chatExampleDemoTime3: '14:35',
    chatExampleDemoMsgHostReply:
      'こんにちは。2月15日から22日までご予約いただけます。詳細もお送りできます。',
    propertyImageAltFallback: '物件写真',
    propertyFavoriteButtonAria: 'お気に入り',
    carouselSlideSelectAria: 'スライド {{n}}へ移動',
    trustSignalKycTitle: '認証ホスト',
    trustSignalKycDesc: '本人確認済み',
    trustSignalLanguagesTitle: '5か国語対応',
    trustSignalLanguagesDesc: 'KO/VI/EN/JA/ZH',
    trustSignalChatTitle: 'リアルタイムチャット',
    trustSignalChatDesc: 'ホストと直接チャット',
    trustSignalBookingTitle: '即時確認',
    trustSignalBookingDesc: '迅速な予約承認',
    propertyDescriptionTranslateError: '翻訳中にエラーが発生しました。',
    propertyDescExampleTitle: '物件説明の例',
    propertyDescHowToTitle: '使い方',
    propertyDescBullet1: '既定ではベトナム語の原文が表示されます。',
    propertyDescBullet2: '「翻訳する」をタップすると翻訳を表示します。',
    propertyDescBullet3: '初回は同意ダイアログが表示される場合があります。',
    propertyDescBullet4: 'ネイティブアプリでは言語パックのダウンロードが必要な場合があります。',
    propertyDescBullet5: '翻訳後は「原文を見る」で切り替えられます。',
    uiTranslateGenericFail: '翻訳に失敗しました。しばらくしてからお試しください。',
    uiTranslatedBadge: '翻訳済み',
    uiTranslateReset: 'リセット',
    uiTranslateCostSavingHint:
      'コスト削減のため必要なときだけ翻訳します。同じテキストはキャッシュされます。',
    chatSendFailed: 'メッセージの送信に失敗しました。',
    chatRoleTenant: '借り手',
    chatRoleLandlord: '大家',
    chatViewListing: '物件を見る',
    chatViewListingDetail: '詳細を見る →',
    chatResidencyNoticeTitle: '入居前にご確認ください！',
    chatResidencyNoticeBody:
      'ベトナム法により仮滞在申告が必要です。快適で安全な滞在のため、必ず手続きしてください ✈️',
    chatScrollOlderMessages: '上にスクロールすると過去のメッセージ',
    chatBookingNoticeTitle: '予約確定のご案内',
    chatBookingNoticeBody:
      '安全で快適な滞在のため、チェックイン後すぐに仮滞在申告を行ってください。',
    chatEmptyState: 'メッセージを送って会話を始めましょう',
    chatReadReceipt: '既読',
    chatSystemPeerJoined: '相手がチャットに参加しました',
    chatSystemImageSent: '画像を送信しました',
    chatInputPlaceholder: 'メッセージを入力...',
    chatInputPlaceholderFull: 'メッセージを入力してください...',
    settlementProcessHaltedDetail:
      '決済処理を中断しました。しばらくしてから再度お試しください。',
    settlementEmptyRevenueList:
      'チェックイン時刻を過ぎた支払い済み予約はまだありません。',
    settlementNoWithdrawalHistory: '出金履歴はありません。',
    settlementNoBankAccounts: '登録済みの口座がありません。',
    withdrawalValidateAmount: '出金額を入力してください。',
    withdrawalSelectBankRequired: '口座を選択してください。',
    withdrawalRequestFailedMessage: '出金申請に失敗しました。',
    withdrawalSubmittedSuccess: '出金申請を受け付けました。',
    bankAccountFormIncomplete: '口座情報をすべて入力してください。',
    bankAccountAddFailed: '口座の登録に失敗しました。',
    bankAccountAddedSuccess: '口座を登録しました。',
    withdrawalStatusHeld: '保留',
    withdrawalStatusRejected: '却下',
    profileKycCoinsProgress: 'コイン {n}/3',
    profileKycEncourageWithCount:
      'KYC認証を完了してコイン3枚を集めましょう！（現在 {n}/3）',
    deleteAccountButton: 'アカウント退会',
    deleteAccountExecuting: '処理中...',
    phoneVerificationRequired: '電話番号の認証が必要です。',
    langEndonymKo: '한국어',
    langEndonymVi: 'Tiếng Việt',
    langEndonymEn: 'English',
    langEndonymJa: '日本語',
    langEndonymZh: '中文',
    kycHostVerificationTitle: 'ホスト認証',
    kycCompleteThreeStepSubtitle: '3段階の認証を完了してください',
    kycProgressLoadError:
      '認証の進捗を読み込めませんでした。更新して再度お試しください。',
    kycStepFailedGeneric: 'KYCの手順を完了できませんでした。',
    kycIdDocumentStepTitle: '身分証明書の撮影',
    kycFaceVerificationStepTitle: '顔認証',
    kycStep2CompleteTitle: '2段階認証完了',
    kycStep2CompleteBody:
      '身分証情報が安全に受理されました。続けて3段階の顔認証を進めてください。',
    kycTestModeBannerTitle: '現在テストモードです',
    kycTestModeFaceSubtitle: '撮影なしで認証完了可能',
    kycTestModeIdSubtitle: '撮影なしで次のステップに移動可能',
    kycFaceFiveDirectionInstruction: '5方向の顔撮影を行ってください',
    kycStartCapture: '撮影開始',
    kycFaceCaptureSessionTitle: '顔撮影',
    kycMultistepProgress: 'ステップ {current}/{total}',
    kycCameraErrorTitle: 'カメラエラー',
    kycStopCapture: '撮影を中止',
    kycCaptureCompleteTitle: '撮影完了',
    kycReviewCapturedImagesFace: '撮影された画像を確認してください',
    kycRetakePhotos: '撮り直し',
    kycCompleteVerification: '認証完了',
    kycAiAnalyzingTitle: 'AI分析中',
    kycAiAnalyzingDesc: '顔認証データを分析しています...',
    kycIdSelectTypeAndCapture:
      '身分証明書の種類を選択し、カメラで撮影してください',
    kycCameraOpenIdCard: 'カメラをオン（身分証明書）',
    kycCameraOpenPassport: 'カメラをオン（パスポート）',
    kycIdCaptureTitleFrontIdCard: '身分証明書の表面を撮影',
    kycIdCaptureTitleFrontPassport: 'パスポートの情報ページを撮影',
    kycIdCaptureTitleBack: '身分証明書の裏面を撮影',
    kycIdAlignInGuide: 'ガイドに合わせて身分証明書を撮影してください',
    kycIdPlaceInFrame: 'ガイド枠に身分証明書を合わせてください',
    kycIdFullDocumentVisible: '全体が写るように撮影してください',
    kycImageConfirmTitle: '画像の確認',
    kycImageConfirmDesc: '撮影された画像を確認してください',
    kycIdSideFront: '表面',
    kycIdSideBack: '裏面',
    kycShootBackSide: '裏面を撮影',
    kycRetakeCapture: '撮り直し',
    kycFormTitleEnterIdInfo: '身分証明書情報の入力',
    kycFormDescEnterIdInfo: '身分証明書に記載された情報を入力してください',
    kycFormIdNumberLabel: '身分証明書番号',
    kycFormDateOfBirthLabel: '生年月日',
    kycFormIssueDateLabel: '発行日',
    kycFormExpiryDateLabel: '有効期限',
    kycFormNextStep: '次へ',
    kycFormRequiredFieldsMissing: '必須項目をすべて入力してください',
    kycFormImageRequired: '画像を選択してください',
    kycCaptureCanvasError: 'キャンバスを作成できません',
    kycCaptureFailedGeneric: '撮影に失敗しました',
    cameraErrPermissionDenied:
      'カメラの許可が拒否されました。端末の設定でカメラを許可してから再度お試しください。',
    cameraErrNotFound: '利用できるカメラが見つかりません。',
    cameraErrGeneric: 'カメラエラー: {{detail}}',
    apiSyncErrorTransient:
      '一時的なエラーです。インターネット接続を確認し、しばらくしてから再度お試しください。',
    userFacingAuthOrSessionError:
      'エラーが発生しました。しばらくしてから再度お試しになるか、ログイン状態をご確認ください。',
    bookingCreateFailedMessage:
      '予約を作成できませんでした。しばらくしてから再度お試しください。',
    bookingPaymentCompleteFailedMessage:
      '決済を完了できませんでした。接続を確認して再度お試しください。',
    bookingPaymentMetaDefaultError:
      '決済情報をサーバーに反映できませんでした。しばらくしてから再度お試しください。',
    bookingPaymentMetaCreateError:
      '決済メタの登録に失敗しました。予約は作成済みです。決済前に再読み込みするかサポートへお問い合わせください。',
    bookingPaymentToastRefundCancelledBody:
      '決済（返金）の反映により予約がキャンセルされました。マイ予約で状態をご確認ください。',
    bookingPaymentToastConfirmedBody:
      'お支払いが完了し、予約が確定しました。',
    bookingPaymentToastSyncedBody:
      '決済情報がサーバーに反映されました。最新の状態はマイ予約でご確認ください。',
    bookingRefundToastCancelledBody:
      '返金が反映され、予約がキャンセル（返金）されました。',
    bookingRefundToastSyncedBody: '返金の決済情報がサーバーに反映されました。',
    bookingSyncImmediateFailed:
      '予約の保存に失敗しました。しばらくしてから再度お試しください。',
    bookingErrorPaymentNotCompleted: 'お支払いが完了していません。',
    appPaymentErrUnparseableResponse: 'サーバーの応答を解釈できませんでした。',
    appPaymentErrRejected: 'リクエストが拒否されました。',
    appPaymentErrHttpStatus: 'リクエストに失敗しました（HTTP {{status}}）',
    topBarUnreadChatSubtitle: '{n}件の未読メッセージがあります',
    topBarNoNotifications: '新しい通知はありません',
    topBarAriaNotifications: '通知',
    topBarAriaProfile: 'プロフィールメニュー',
    topBarAriaLogin: 'ログイン',
    adminAccountsListLoadFailed: '一覧を読み込めませんでした。',
    adminAccountsSaveFailed: '保存に失敗しました。',
    adminAccountsCreateFailed: 'アカウントを作成できませんでした。',
    adminAccountsToggleFailed: '権限の変更に失敗しました。',
    apiErrAdminAccountInvalidInput:
      'ログインID（3〜64文字、英数字・._-）とパスワード（8文字以上）を確認してください。',
    apiErrAdminUsernameTaken: 'このIDは既に使用されている可能性があります。',
    apiErrAdminUsernameInvalid: 'ログインIDの形式が正しくありません。',
    apiErrAdminUsernameConflict: 'このログインIDは既に使用されています。',
    apiErrAdminNewPasswordTooShort: '新しいパスワードは8文字以上にしてください。',
    apiErrAdminCurrentPasswordInvalid: '現在のパスワードが正しくありません。',
    apiErrAdminCannotDemoteOwnSuper: 'ご自身のスーパー管理者権限はここでは解除できません。',
    apiErrAdminCannotDemoteLastSuper: '最後のスーパー管理者の権限は解除できません。',
    apiErrAdminNoValidUpdates: '有効な変更がありません。',
    chatDateToday: '今日',
    chatDateYesterday: '昨日',
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
    popularStaysTitle: '热门住宿',
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
    whereDoYouWantToLive: '按区域查找住宿与短期租赁信息',
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
    loginWrongPassword: '密码不正确。',
    loginSocialLoginRequired: '此账户使用社交登录注册。',
    loginAccountBlocked: '此账户已被管理员限制使用。',
    loginNetworkError: '网络错误，请稍后重试。',
    loginServerUnavailable: '无法连接服务器，请稍后重试。',
    adminUserBlockPrompt: '请输入封禁原因。',
    adminUserBlockDefaultReason: '管理员封禁',
    phoneSendOtpButton: '发送验证码',
    phoneEnterNumberPlaceholder: '请输入手机号',
    phoneSelectCountry: '选择国家/地区',
    phoneOtpSentBadge: '已发送',
    mapErrAwsApiKeyMissing: '未设置 AWS API 密钥。请检查 .env.local 中的 NEXT_PUBLIC_AWS_API_KEY。',
    mapErrAwsMapNameMissing: '未设置 AWS 地图名称。请检查 .env.local 中的 NEXT_PUBLIC_AWS_MAP_NAME。',
    mapErrLoadGeneric: '加载地图时出错。',
    mapErrNetworkAws: '网络错误，无法连接 AWS 地图服务。',
    mapErrAwsKeyInvalid: 'AWS API 密钥无效。请检查环境变量。',
    mapErrMapNotFound: '未找到地图资源。请检查 Map 名称。',
    mapErrStyleLoad: '无法加载地图样式。请检查 API 密钥与 Map 资源名称。',
    mapErrorHeading: '错误',
    mapErrCheckEnvHint: '请检查 NEXT_PUBLIC_AWS_API_KEY 与 NEXT_PUBLIC_AWS_MAP_NAME。',
    legacyNewPropertyPageTitle: '发布新房源',
    legacyNewPropertyFieldTitle: '房源标题',
    legacyNewPropertyTitlePh: '例如：301室、A栋',
    legacyNewPropertyDescVi: '描述（越南语）',
    legacyNewPropertyAddrVi: '地址（越南语）',
    legacyNewPropertyGeocoding: '正在解析坐标…',
    legacyNewPropertyCoordsOk: '已生成坐标',
    legacyNewPropertyAddrPh: '例如：Quận 7, Thành phố Hồ Chí Minh',
    legacyNewPropertyCoordsLine: '坐标：{{lat}}, {{lng}}',
    legacyNewPropertyPrice: '价格',
    legacyNewPropertyCurrency: '货币',
    legacyNewPropertyArea: '面积 (m²)',
    legacyNewPropertyBedrooms: '卧室',
    legacyNewPropertyBathrooms: '卫生间',
    legacyNewPropertyCheckIn: '入住时间',
    legacyNewPropertyCheckOut: '退房时间',
    legacyNewPropertyTimeAfter: '{{time}} 之后',
    legacyNewPropertyTimeBefore: '{{time}} 之前',
    legacyNewPropertyCheckInHelp: '房客可办理入住的时间',
    legacyNewPropertyCheckOutHelp: '房客需退房的时间',
    legacyNewPropertyCancel: '取消',
    legacyNewPropertySubmit: '发布',
    legacyNewPropertySubmitting: '提交中…',
    legacyNewPropertySuccess: '房源已发布。',
    legacyNewPropertyError: '发布房源失败。',
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
    searchClearInputAria: '清除搜索',
    locationBadgeCity: '城市',
    locationBadgeDistrict: '区/县',
    locationBadgeLandmark: '景点',
    labelCity: '城市',
    labelDistrict: '区',
    selectDistrictPlaceholder: '选择区',
    selectCityPlaceholder: '选择城市',
    searchFiltersResetButton: '重置筛选',
    explorePopularCities: '越南热门地区',
    popularStaysViewMore: '查看更多',
    addressPatternTower: '{{name}}栋',
    addressPatternZone: '{{name}}片区',
    addressPatternLobby: '{{name}}大堂',
    addressPatternUnit: '{{name}}号',
    adminKycPageTitle: 'KYC 数据',
    adminKycTotalRecordsTemplate: '共 {{count}} 人',
    adminKycRefreshButton: '刷新',
    adminKycLoadingLabel: '加载中...',
    adminKycEmptyMessage: '无数据',
    adminKycNoNameFallback: '无姓名',
    bookingGuestSummaryWithChildren: '成人{{adults}}人，儿童{{children}}人',
    bookingGuestSummaryAdultsOnly: '成人{{adults}}人',
    searchRoomTypeStudio: '开间',
    searchRoomTypeOneRoom: '一室（卧室+客厅）',
    searchRoomTypeTwoRoom: '两室',
    searchRoomTypeThreePlus: '三室及以上',
    searchRoomTypeDetached: '独栋',
    adminKycStatusVerified: '已认证',
    adminKycStatusPending: '审核中',
    adminKycStatusRejected: '已拒绝',
    adminKycStatusUnverified: '未认证',
    adminKycSubtitleNew: '新增 {{count}} 人',
    adminKycSubtitleVerified: '已认证 {{count}} 人',
    adminKycSubtitleUnverified: '未认证 {{count}} 人',
    adminKycTabNew: '新增',
    adminKycTabAll: '全部',
    adminKycTabVerified: '已认证',
    adminKycTabUnverified: '未认证',
    adminKycColVerificationStatus: '认证状态',
    adminKycColIdDocument: '证件',
    adminKycColDateOfBirth: '出生日期',
    adminKycIdTypePassportLabel: '护照',
    adminKycIdTypeIdCardLabel: '身份证',
    adminKycMobileIdPrefix: '证件',
    adminKycMobileDobPrefix: '出生日期',
    adminSettlementsEmptyRequest: '暂无待审批的结算申请。（退房后/合同结束时显示。）',
    adminSettlementsEmptyPending: '暂无待审批项。',
    adminSettlementsEmptyApproved: '暂无已批准（生效）项。',
    adminSettlementsEmptyHeld: '暂无保留中的结算。',
    adminSettlementsListFilteredEmpty: '没有符合搜索/排序/筛选条件的记录。',
    adminContractsEmptyNew: '暂无新合同项。',
    adminContractsEmptySealed: '暂无已订立合同（已付款/已确认，入住前）的预订。',
    adminContractsEmptyInProgress: '暂无进行中合同（入住至退房）的预订。',
    adminContractsEmptyCompleted: '暂无已结束合同（退房后/已完成）的预订。',
    adminRefundsEmptyAll: '暂无待处理退款。',
    adminRefundsEmptyNew: '暂无新增待处理退款。',
    adminRefundsEmptyPre: '暂无合同前待处理退款。',
    adminRefundsEmptyDuring: '暂无合同期内待处理退款。',
    adminWithdrawalsEmptyPending: '暂无待审批提现。',
    adminWithdrawalsEmptyProcessing: '暂无处理中的提现。',
    adminWithdrawalsEmptyCompleted: '暂无已完成提现记录。',
    adminWithdrawalsEmptyRejected: '暂无已拒绝提现。',
    adminWithdrawalsEmptyHeld: '暂无保留中的提现。',
    adminCommonRefresh: '刷新',
    adminCommonLoading: '加载中...',
    adminSettlementsTabRequest: '审批请求',
    adminSettlementsTabPending: '待审批',
    adminSettlementsTabApproved: '已批准',
    adminSettlementsTabHeld: '保留',
    adminSettlementsPageTitle: '结算审批',
    adminSettlementsIntroLine:
      '审批请求仅在退房后（合同结束）生成。确认后转入待审批，再进行批准或保留。退房满24小时后批准将计入可提现余额。・请求 {{req}} ・待审 {{pend}} ・完成 {{appr}} ・保留 {{held}}',
    adminSettlementsBadgeContractEnded: '合同结束后进入',
    adminContractsPageTitle: '合同',
    adminContractsIntroLine:
      '订立 → 入住中 → 结束（退房后）· 已订立 {{sealed}} · 进行中 {{inProgress}} · 已结束 {{completed}}',
    adminContractsTabNew: '新增',
    adminContractsTabSealed: '已订立',
    adminContractsTabInProgress: '进行中',
    adminContractsTabCompleted: '已结束',
    adminContractsSearchPlaceholder: '邮箱、UID、预订、房源、金额…',
    adminContractsSearchHint: '仅在当前所选标签内搜索。',
    adminRefundsPageTitle: '退款',
    adminRefundsIntroLine:
      '为已取消且已付款的预订审批退款。・合同前 {{pre}} · 合同期内 {{during}}',
    adminRefundsTabNew: '新增',
    adminRefundsTabAll: '全部',
    adminRefundsTabPre: '合同前退款',
    adminRefundsTabDuring: '合同期内退款',
    adminRefundsSearchPlaceholder: '邮箱、UID、预订、房源、金额…',
    adminRefundsSearchHint: '仅在当前所选标签内搜索。',
    adminRefundsApproveButton: '批准退款',
    adminWithdrawalsPageTitle: '提现审批',
    adminWithdrawalsIntroLine:
      '按类别查看。・待审 {{pending}} · 处理中 {{processing}} · 已拒绝 {{rejected}} · 已完成 {{completed}} · 保留 {{held}}',
    adminWithdrawalsTabPending: '待审批',
    adminWithdrawalsTabProcessing: '处理中',
    adminWithdrawalsTabRejected: '已拒绝',
    adminWithdrawalsTabCompleted: '已完成',
    adminWithdrawalsTabHeld: '保留',
    adminWithdrawalsSearchPlaceholder: '邮箱、UID、账户标签、金额…',
    adminWithdrawalsSearchHint: '仅在当前所选标签内搜索。',
    adminWithdrawalApprove: '批准',
    adminWithdrawalReject: '拒绝',
    adminWithdrawalHold: '保留',
    adminWithdrawalComplete: '完成',
    adminWithdrawalResume: '继续',
    adminWithdrawalBadgeCompleted: '已完成',
    adminWithdrawalBadgeRejected: '已拒绝',
    adminWithdrawalRejectReason: '管理员拒绝',
    adminWithdrawalHoldReason: '管理员保留',
    csvKycColFullName: '姓名',
    csvKycColPhone: '联系电话',
    csvKycColIdType: '证件类型',
    csvKycColIdNumber: '证件号码',
    csvKycColDateOfBirth: '出生日期',
    csvKycColIdFrontUrl: '证件照片URL（正面）',
    csvKycColIdBackUrl: '证件照片URL（背面）',
    csvKycColFaceUrl: '人脸照片URL',
    csvKycColSubmittedAt: '申请时间',
    csvKycColVerificationStatus: '认证状态',
    adminKycCsvDownloadError: '下载 CSV 时出错。',
    adminSettlementsSearchHint: '仅在当前所选标签内搜索。',
    adminSettlementsFilterLabel: '筛选',
    adminSettlementsFilterTitle24hBaseline: '基准：退房结束后24小时。三项中选一项。',
    adminSettlementsSortRemainingAscTitle: '截止时间升序（剩余时间由短到长）',
    adminSettlementsSortRemainingDescTitle: '截止时间降序（剩余时间由长到短）',
    adminSettlementsFilterElapsed24hTitle: '仅显示已超过退房+24小时（不可与↑·↓同时选）',
    adminSettlementsSortRemainingAsc: '剩余 ↑',
    adminSettlementsSortRemainingDesc: '剩余 ↓',
    adminSettlementsFilterElapsed24h: '已满24小时',
    adminSettlementActionMoveToPending: '移至待审批',
    adminSettlementResumeToRequest: '恢复（请求）',
    adminSettlementResumeToPending: '恢复（待审）',
    adminAuditPageTitle: '审计日志',
    adminAuditPageIntro: '资金 · 运营操作 · 按处理人与时间（分栏）',
    adminAuditSearchPlaceholder: '操作、owner/ref、备注、处理人…',
    adminAuditSearchHint: '仅在所选标签范围内搜索。',
    adminAuditEmpty: '此标签或搜索下无记录。',
    adminAuditColAction: '操作',
    adminAuditColAmount: '金额',
    adminAuditColOwnerTarget: 'owner / 对象',
    adminAuditColRef: 'ref',
    adminAuditColActor: '处理人',
    adminAuditColNote: '备注',
    adminAuditColTime: '时间',
    adminAuditAmountDash: '金额 —',
    adminAuditMobileTarget: '对象:',
    adminAuditMobileActor: '处理:',
    adminAuditTabNew: '新增',
    adminAuditTabAll: '全部',
    adminAuditTabSettlement: '结算',
    adminAuditTabWithdrawal: '提现',
    adminAuditTabRefund: '退款',
    adminAuditTabAccount: '账户',
    adminAuditTabProperty: '房源',
    adminAuditLedgerSettlementApproved: '结算通过',
    adminAuditLedgerSettlementHeld: '结算暂缓',
    adminAuditLedgerSettlementResumed: '结算恢复（仍通过）',
    adminAuditLedgerSettlementRevertedPending: '结算恢复 → 待审',
    adminAuditLedgerSettlementRevertedRequest: '结算恢复 → 申请',
    adminAuditLedgerWithdrawalRequested: '提现申请',
    adminAuditLedgerWithdrawalProcessing: '提现通过（处理中）',
    adminAuditLedgerWithdrawalHeld: '提现暂缓',
    adminAuditLedgerWithdrawalResumed: '提现恢复',
    adminAuditLedgerWithdrawalCompleted: '提现完成',
    adminAuditLedgerWithdrawalRejectedRefund: '提现驳回·退回',
    adminAuditLedgerRefundApproved: '退款通过',
    adminAuditModUserBlocked: '封禁账户',
    adminAuditModUserRestored: '恢复账户',
    adminAuditModPropertyHidden: '隐藏房源',
    adminAuditModPropertyRestored: '恢复房源',
    adminAuditModPropertyAdEndedByHost: '房源停广（房东）',
    adminAuditModPropertyDeletedByHost: '房源删除（房东）',
    adminUiBadPath: '路径无效。',
    adminUiLoadingEllipsis: '加载中…',
    adminUiNoQueryResults: '无查询结果。',
    adminPaginationPrev: '上一页',
    adminPaginationNext: '下一页',
    adminPaginationLine: '{{page}} / {{total}} · {{count}} 条',
    adminFilterNew: '新增',
    adminFilterAll: '全部',
    adminUserFilterActive: '正常',
    adminUserFilterBlocked: '封禁',
    adminUsersTitle: '账户管理',
    adminUsersIntroLine:
      '新增=注册24小时内（点击行确认，仅当日列表） · 新{{nNew}} · 全{{nAll}} · 正常{{nActive}} · 封禁{{nBlocked}}',
    adminUsersSearchPlaceholder: '搜索 uid / 邮箱 / 姓名',
    adminUsersSearchHint: '仅在所选标签内搜索。',
    adminColAlert: '提醒',
    adminColName: '姓名',
    adminColEmail: '邮箱',
    adminColPhone: '电话',
    adminColUid: 'UID',
    adminColStatus: '状态',
    adminColActions: '操作',
    adminPingTitleUnseen: '未读提醒',
    adminPingTitleAck: '未确认',
    adminAriaUnseenNewUser: '未确认新账户',
    adminAriaAckNewUser: '已确认新账户',
    adminDotUnseen: '未确认',
    adminDotAcked: '已确认',
    adminStatusNormal: '正常',
    adminStatusBlocked: '封禁',
    adminActionRestore: '恢复',
    adminActionBlock: '封禁',
    adminPropertiesTitle: '房源管理',
    adminPropertiesIntroLine:
      '仅父房源 · 新增保持至确认 · 确认后仅当日 · 最新在前 · 全{{nAll}} · 新{{nNew}} · 上架{{nListed}} · 停广{{nPaused}} · 隐藏{{nHidden}}',
    adminPropFilterListed: '上架',
    adminPropFilterPaused: '停广',
    adminPropFilterHidden: '隐藏',
    adminPropertiesSearchPlaceholder: '搜索 id / 标题 / owner / 地址',
    adminPropertiesSearchHint: '在标签内搜索。上架=与客端可订一致。',
    adminPropColTitle: '标题',
    adminPropColAddress: '地址',
    adminPropColOwner: 'Owner',
    adminPropColId: 'ID',
    adminListingHidden: '隐藏',
    adminListingAdPaused: '停广',
    adminListingLive: '上架',
    adminPropUnhide: '恢复',
    adminPropHide: '隐藏',
    adminAriaUnseenNewProperty: '未确认新房源',
    adminAriaAckNewProperty: '已确认新房源',
    adminPropertiesHiddenReasonLabel: '隐藏原因（固定）:',
    adminNotFoundUser: '找不到账户。',
    adminBackToUsersList: '返回账户列表',
    adminNotFoundProperty: '找不到房源。',
    adminBackToPropertiesList: '返回房源列表',
    adminUserDetailBack: '返回',
    adminNoDisplayName: '无姓名',
    adminUserBadgeSuspended: '已暂停',
    adminUserBadgeActive: '正常',
    adminLabelHostMemo: '房东备注',
    adminLabelGuestMemo: '房客备注',
    adminMemoEmpty: '无备注',
    adminMemoPlaceholderHost: '房东客服备注',
    adminMemoPlaceholderGuest: '房客客服备注',
    adminMemoNewestFirst: '最新备注在前。',
    adminUserUnblock: '解除封禁',
    adminUserBlockAccount: '封禁账户',
    adminSectionProfileStatus: '注册信息 · 状态',
    adminSectionHost: '房东',
    adminSectionGuest: '房客',
    adminLabelKyc: 'KYC',
    adminUserJoinedAt: '注册日期',
    adminUserStatHostBookingsTotal: '订单数（总）',
    adminUserStatInProgress: '进行中',
    adminUserStatCompleted: '已完成',
    adminUserStatCancelled: '已取消',
    adminUserBalanceTitle: '余额概况',
    adminUserBalanceAvailable: '可提现',
    adminUserBalanceApprovedRevenue: '已核准收入',
    adminUserBalancePendingWithdraw: '提现处理中/暂缓',
    adminUserGuestCurrentRes: '当前预订',
    adminUserGuestDepositPending: '待付定金',
    adminUserGuestContractDone: '合同完成',
    adminUserRefundsHeading: '相关退款预订',
    adminUserRefundsEmpty: '暂无记录。',
    adminUserRefundsColBookingId: '预订 ID',
    adminUserRefundsColProperty: '房源',
    adminUserRefundsColAmount: '金额',
    adminUserRefundsColPayment: '支付',
    adminUserRefundsColRefund: '退款处理',
    adminRefundStatusDone: '已退款',
    adminRefundStatusAdminOk: '管理员已通过',
    adminRefundStatusPending: '待审批',
    adminPropertyDetailBackList: '房源列表',
    adminPropertyNoTitle: '无标题',
    adminPropertyAdminMemo: '管理员备注',
    adminPropertyMemoPlaceholder: '房源管理备注',
    adminPropertyViewHost: '查看房东账户',
    adminPropertyUnhide: '取消隐藏',
    adminPropertyHide: '隐藏',
    adminSectionHostId: '房东 · 标识',
    adminLabelOwnerId: 'Owner ID',
    adminLabelDisplayName: '显示名',
    adminSectionPriceAreaGuests: '价格 · 面积 · 人数',
    adminLabelWeeklyRent: '周租金',
    adminLabelAreaSqm: '面积',
    adminLabelBedBath: '卧室·卫浴',
    adminLabelBedroomsBathrooms: '卧室{{bed}} · 卫浴{{bath}}',
    adminLabelMaxGuests: '最多人数',
    adminLabelAdultsChildren: '成人{{adults}} · 儿童{{children}}',
    adminSectionLocation: '位置',
    adminLabelAddress: '地址',
    adminLabelUnitNumber: '单元/房号',
    adminLabelCityDistrictIds: 'city / district',
    adminLabelCoordinates: '坐标',
    adminSectionDescription: '描述',
    adminPropertyDescOriginalVi: '越南语原文',
    adminPropertyDescTranslatedKo: '翻译（韩语）',
    adminSectionPhotos: '照片',
    adminPropertyNoImages: '无图片',
    adminSectionAmenitiesType: '设施 · 类型',
    adminLabelPropertyType: '类型',
    adminLabelCleaningPerWeek: '每周清洁',
    adminSectionPets: '宠物',
    adminLabelPetAllowed: '允许',
    adminLabelYes: '是',
    adminLabelNo: '否',
    adminLabelPetFeePerPet: '附加费(VND/只)',
    adminLabelMaxPets: '最多只数',
    adminSectionSchedule: '日程 · 入住',
    adminLabelRentStart: '期望起租',
    adminLabelRentEnd: '期望止租',
    adminLabelCheckInTime: '入住时间',
    adminLabelCheckOutTime: '退房时间',
    adminSectionIcal: '外部日历(iCal)',
    adminLabelIcalPlatform: '平台',
    adminLabelIcalCalendarName: '日历名',
    adminLabelUrl: 'URL',
    adminSectionChangeHistory: '变更历史',
    adminPropertyMetaCreated: '创建',
    adminPropertyMetaUpdated: '更新',
    adminPropertyDeletedFlag: '房东删除标记: deleted',
    adminSystemLogTitle: '系统日志',
    adminSystemLogChecklist:
      '5分钟巡检: ①5xx/401/403激增 ②预订/支付写入失败 ③KYC失败 ④重复日志 ⑤用bookingId/ownerId追踪',
    adminSystemLogFilterNew: '新增',
    adminSystemLogFilterAll: '全部',
    adminSystemLogFilterError: '错误',
    adminSystemLogFilterWarning: '警告',
    adminSystemLogFilterInfo: '信息',
    adminSystemLogExportCsv: '导出 CSV',
    adminSystemLogClearEphemeral: '清空易失日志',
    adminSystemLogClearPersistent: '重置持久日志',
    adminSystemLogCountLine: '显示 {{shown}} 条 · 第 {{page}}/{{pages}} 页',
    adminSystemLogColTime: '时间',
    adminSystemLogColSeverity: '严重级别',
    adminSystemLogColCategory: '分类',
    adminSystemLogColMessage: '消息',
    adminSystemLogColBookingId: 'bookingId',
    adminSystemLogColOwnerId: 'ownerId',
    adminSystemLogColSnapshot: '快照',
    adminSystemLogColCopy: '复制',
    adminSystemLogEmpty: '没有可显示的日志。',
    adminSystemLogLinkSettlements: '结算',
    adminSystemLogSettlementsSearchHint: '在结算页搜索框粘贴 ID',
    adminSystemLogCopyRowTitle: '复制行',
    adminSystemLogFooterNote:
      '预订 ID 可粘贴到结算/合同搜索。分析请导出 CSV（勿含敏感信息）。',
    adminPropertyLogsTitle: '房源删除/取消记录',
    adminPropertyLogsIntro: '服务器账簿 — DELETED 与 CANCELLED',
    adminPropertyLogsTabAll: '全部',
    adminPropertyLogsTabDeleted: '永久删除',
    adminPropertyLogsTabCancelled: '预订取消',
    adminPropertyLogsColTime: '时间',
    adminPropertyLogsColType: '类型',
    adminPropertyLogsColPropertyId: 'propertyId',
    adminPropertyLogsColOwnerId: 'ownerId',
    adminPropertyLogsColRecorder: '记录人',
    adminPropertyLogsColReservation: 'reservation',
    adminPropertyLogsColNote: '备注',
    adminPropertyLogsEmpty: '无记录。',
    adminAccountsTitle: '管理员账户',
    adminAccountsIntro: '仅超级管理员 · 点击账户编辑账号、昵称、密码、权限',
    adminAccountsNewButton: '新建管理员',
    adminAccountsFormNewTitle: '新账户',
    adminAccountsLabelUsername: '用户名',
    adminAccountsLabelNickname: '昵称',
    adminAccountsNicknamePlaceholder: '显示名称',
    adminAccountsPasswordMin: '密码（至少8位）',
    adminAccountsCreateSuper: '创建为超级管理员',
    adminAccountsCreateSubmit: '创建',
    adminAccountsListTitle: '账户列表',
    adminAccountsRoleSuper: '超级',
    adminAccountsRoleNormal: '普通',
    adminAccountsSelectPrompt: '请从左侧选择账户。',
    adminAccountsProfileToggle: '账户信息',
    adminAccountsProfileExpand: '展开',
    adminAccountsProfileCollapse: '收起',
    adminAccountsProfileNote: '仅超级管理员可在此修改用户名、昵称、密码。',
    adminAccountsEditNickname: '昵称',
    adminAccountsEditUsername: '用户名',
    adminAccountsEditNewPassword: '新密码（留空不变）',
    adminAccountsEditCurrentPassword: '当前密码',
    adminAccountsSaveProfile: '保存信息',
    adminAccountsSaving: '保存中…',
    adminAccountsRolesHeading: '角色 · 权限',
    adminAccountsSuperAllMenus: '超级管理员可访问所有菜单。',
    adminAccountsDemoteSuper: '改为普通管理员',
    adminAccountsSuperCheckbox: '超级管理员',
    adminAccountsPermHint: '勾选的菜单显示在顶部导航。',
    adminAccountsSavePerms: '仅保存权限',
    adminAccountsSelfPermNote: '不能在此修改本人菜单权限。',
    adminNavDashboard: '控制台',
    adminNavUsers: '账户',
    adminNavProperties: '房源',
    adminNavPropertyLogs: '房源日志',
    adminNavContracts: '合同',
    adminNavSettlements: '结算',
    adminNavRefunds: '退款',
    adminNavWithdrawals: '提现',
    adminNavAudit: '审计',
    adminNavKyc: 'KYC',
    adminNavSystemLog: '系统日志',
    adminHomeTitle: '管理后台首页',
    adminHomeSubtitle: '可通过下方菜单或顶部栏进入业务页面。',
    adminNavMenuAriaLabel: '管理员菜单',
    adminNavBadgeAria: '{{count}} 条通知',
    adminNavDescUsers: '封禁、恢复与搜索',
    adminNavDescProperties: '隐藏与恢复',
    adminNavDescPropertyLogs: '删除/取消的服务器日志',
    adminNavDescContracts: '签约与起租预约',
    adminNavDescSettlements: '可提现余额的入账审批',
    adminNavDescRefunds: '取消退款的审批',
    adminNavDescWithdrawals: '提现申请处理',
    adminNavDescAudit: '资金与操作日志',
    adminNavDescKyc: '身份核验与审核',
    adminNavDescSystemLog: '客户端错误、警告与非持久信息',
    adminLoginTitle: '管理员登录',
    adminLoginSubtitle: '500 STAY Admin · 桌面端',
    adminLoginUsernameLabel: '用户名',
    adminLoginPasswordLabel: '密码',
    adminLoginSubmit: '登录',
    adminLoginError: '管理员用户名或密码不正确。（若数据库未连接请查看服务器日志）',
    adminLoginBootstrapNote:
      '首次：使用与 ADMIN_BOOTSTRAP_* 或 NEXT_PUBLIC_ADMIN_* 相同账号登录可在数据库创建超级管理员。',
    adminLoginHomeLink: '返回站点首页',
    adminNoAccessTitle: '没有可访问的菜单',
    adminNoAccessBodyWithUser:
      '账户 {{username}} 未授予权限。请联系超级管理员开通菜单。',
    adminNoAccessBodyGeneric: '请联系超级管理员申请菜单权限。',
    adminNoAccessLogout: '登出并使用其他账号登录',
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
    dateBadgeRangeTemplate: '{{start}} ~ {{end}}',
    dateBadgeFromTemplate: '从{{date}}开始',
    searchButton: '搜索',
    noResultsFound: '未找到结果。',
    propertiesFound: ' 个房源。',
    minExceedsMaxError: '最低值不能高于最高值。请修改。',
    maxBelowMinError: '最高值不能低于最低值。请修改。',
    searchFilterPriceRangeLabel: '价格区间',
    searchFilterFacilityPickHeading: '选择设施',
    searchPriceRangeDragHint: '拖动以调整价格区间',
    searchRentPerWeekFragment: '每周',
    chatSendingMessage: '正在发送...',
    chatInputInProgressStatus: '正在输入...',
    signupErrorRequiredFields: '请填写所有必填项。',
    signupErrorInvalidEmailFormat: '请输入有效的电子邮箱地址。',
    signupErrorPasswordMismatch: '两次输入的密码不一致。',
    signupErrorPasswordMinLength: '密码长度至少为 6 位。',
    signupErrorPhoneVerificationRequired: '请完成手机号验证。',
    signupErrorOtpSendFailed: '验证码发送失败，请稍后重试。',
    signupErrorOtpSendSystem: '发送验证码时出错。',
    signupErrorOtpInvalidCode: '验证码不正确。',
    signupErrorOtpVerifyFailed: '验证过程出错。',
    signupErrorFailedGeneric: '注册失败。',
    signupErrorUnexpected: '发生意外错误。',
    signupErrorSocialLoginFailed: '社交账号登录失败。',
    uiTranslateButtonLoading: '翻译中...',
    uiTranslateViewOriginal: '查看原文',
    uiTranslateShowTranslation: '翻译',
    emailWelcomeTitle: '[500 STAY VN] 欢迎加入',
    emailWelcomeBody:
      '您好，{{name}}：\n\n感谢注册 500 STAY VN（住宿租赁信息服务平台）。\n您可在应用内搜索房源、完成预订并与房东沟通。\n\n本邮件为系统自动发送，请勿直接回复。',
    emailBookingConfirmedGuestTitle: '[500 STAY VN] 预订已确认',
    emailBookingConfirmedGuestBody:
      '您好，{{guestName}}：\n\n您的预订已确认。\n预订编号：{{bookingId}}\n房源：{{propertyTitle}}\n入住：{{checkIn}} / 退房：{{checkOut}}\n\n详情请在应用的「预订」中查看。',
    emailBookingConfirmedHostTitle: '[500 STAY VN] 已有预订确认（房东）',
    emailBookingConfirmedHostBody:
      '您好，{{hostName}}：\n\n房客 {{guestName}} 的预订已确认。\n预订编号：{{bookingId}}\n房源：{{propertyTitle}}\n入住：{{checkIn}} / 退房：{{checkOut}}\n\n请在应用中查看日程与消息。',
    emailBookingCancelledGuestTitle: '[500 STAY VN] 预订已取消',
    emailBookingCancelledGuestBody:
      '您好，{{guestName}}：\n\n以下预订已取消。\n预订编号：{{bookingId}}\n房源：{{propertyTitle}}\n\n如需帮助，请通过应用内客服联系我们。',
    emailOtpCodeTitle: '[500 STAY VN] 验证码',
    emailOtpCodeBody:
      '您的验证码：{{code}}\n\n验证码在 {{minutes}} 分钟内有效。如非本人操作，请忽略本邮件。',
    emailPasswordResetTitle: '[500 STAY VN] 重置密码',
    emailPasswordResetBody:
      '请点击以下链接重置密码：\n{{resetLink}}\n\n链接在 {{hours}} 小时内有效。如非本人操作，请忽略本邮件。',
    emailVerifyEmailTitle: '[500 STAY VN] 验证邮箱',
    emailVerifyEmailBody:
      '请点击以下链接完成邮箱验证：\n{{verifyLink}}\n\n如非本人注册，请忽略本邮件。',
    emailHostNewBookingRequestTitle: '[500 STAY VN] 新的预订申请',
    emailHostNewBookingRequestBody:
      '您好，{{hostName}}：\n\n房客 {{guestName}} 提交了预订申请。\n房源：{{propertyTitle}}\n希望入住：{{checkIn}} / 退房：{{checkOut}}\n\n请在应用中接受或拒绝。',
    emailPayoutProcessedTitle: '[500 STAY VN] 结算付款通知',
    emailPayoutProcessedBody:
      '您好，{{name}}：\n\n您申请的结算已处理完成。\n金额：{{amount}} {{currency}}\n\n详情请在应用的结算页面查看。',
    emailGenericFooterNotice:
      '500 STAY VN 为短期住宿提供信息与沟通工具；我们不是用户之间租赁合同的一方。',
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
    incomeStatusRevenueConfirmed: '收益已确定',
    incomeStatusSettlementRequest: '待提交审核',
    incomeStatusSettlementPending: '审核排队中',
    incomeStatusSettlementApproved: '已结算',
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
    fullNamePlaceholder: '请输入真实姓名',
    signupOtpVerify: '验证',
    phoneVerificationComplete: '手机号已验证',
    confirmPasswordLabel: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    otpCodePlaceholder: '6位验证码',
    deleteAccountTitle: '账户删除说明',
    deleteAccountIntro: '如需删除账户，请通过下方邮箱联系我们。',
    deleteAccountFooterNote:
      '咨询时请一并提供账户信息与删除原因，以便我们尽快处理。',
    legalFooterTerms: '服务条款',
    legalFooterPrivacy: '隐私政策',
    legalFooterDeleteAccount: '删除账户',
    legalFooterNavAriaLabel: '法律信息',
    toastHeadingSuccess: '完成',
    toastHeadingInfo: '提示',
    propertyNotFound: '未找到该房源。',
    bookPropertyTitle: '预订',
    nightShort: '晚',
    bookingDatesLoadError: '无法加载日期信息',
    guestInfoSectionTitle: '预订人信息',
    bookingGuestNamePlaceholder: '姓名',
    agreeTermsPrivacyBooking: '同意条款与隐私政策（必填）',
    proceedToPaymentStep: '前往支付',
    selectPaymentMethod: '选择支付方式',
    priceBreakdown: '费用明细',
    perWeekSlash: '（每周）',
    petsShort: '宠物',
    petCountClassifier: '只',
    perPetPerWeekSlash: '（每只/周）',
    bookingServiceFee: '预订服务费',
    totalAmountLabel: '合计',
    agreePaymentTermsCheckbox: '同意支付条款（必填）',
    payNow: '支付',
    processingInProgress: '处理中...',
    bookingDetailTitle: '预订详情',
    paymentCompleteTitle: '支付完成！',
    waitingHostApproval: '等待房东确认。',
    notifyWhenApprovedShort: '确认后我们会通知您。',
    bookingSuccessGotIt: '知道了',
    bookingNumberLabel: '预订编号',
    copyButton: '复制',
    copiedButton: '已复制',
    bookingBadgeConfirmed: '已确认',
    bookingBadgeCancelled: '已取消',
    bookingBadgePending: '待批准',
    propertyInfoHeading: '房源信息',
    bookingDetailSectionTitle: '预订详情',
    bookerFieldLabel: '预订人',
    phoneFieldLabel: '联系电话',
    stayNightsUnit: '晚',
    specialRequestsHeading: '特殊要求',
    weeklyPriceShort: '周价格',
    petFeeShortLabel: '每只',
    totalPaymentHeading: '支付总额',
    paymentStatusPaidLabel: '已支付',
    paymentStatusPendingLabel: '待支付',
    backToHomeButton: '返回首页',
    viewBookingsHistoryButton: '查看预订记录',
    bookingSuccessLoadFailed: '无法加载预订信息。请从列表中再次确认。',
    bookingSuccessBookingIdMissing: '缺少预订编号。',
    bookingSuccessCopyOk: '预订编号已复制到剪贴板。',
    bookingSuccessCopyFail: '复制失败。请手动选择并复制编号。',
    priceUnitVndSuffix: 'VND',
    reservationCancelRelistMerged:
      '已取消的时段已与现有在广告中的房源合并，房源数量不变。',
    reservationCancelRelistRelisted: '预订已取消，房源已重新发布。',
    reservationCancelRelistLimitExceeded:
      '预订已取消，请在「等待发布」标签中重新提交。',
    reservationCancelRelistShortTerm:
      '预订已取消并移至等待发布。请编辑日期后重新上架。',
    reservationStatusUpdateError: '更新预订状态时出错。',
    hostReservationRecordDeleteConfirm: '要永久删除此记录吗？',
    hostReservationRecordDeleteError: '删除记录时出错。',
    hostReservationLabelCompleted: '预订完成',
    paymentMethodLabelMomo: 'MoMo',
    paymentMethodLabelZalopay: 'ZaloPay',
    paymentMethodLabelBankTransfer: '银行转账',
    paymentMethodLabelPayAtProperty: '现场付款',
    bookingDetailsPaymentHeading: '支付信息',
    bookingDetailsPayMethodRowLabel: '支付方式',
    bookingDetailsAccommodationLine: '房费',
    bookingDetailsFeesVatLine: '手续费及税费',
    bookingDetailsTotalRow: '总计',
    bookingWeeksUnit: '周',
    hostBookingCardStatusPending: '预订请求',
    hostBookingCardStatusConfirmed: '预订确认',
    hostBookingCardStatusRequestCancelled: '请求取消',
    hostBookingCardStatusBookingCancelled: '预订取消',
    myPropertiesPendingEndAdTitle: '移至已结束',
    myPropertiesPendingEndAdDesc: '该房源将移到已结束标签页，数据会保留。',
    myPropertiesDuplicateLiveTitle: '同一房源正在展示中',
    myPropertiesDuplicateLiveHint:
      '是：前往展示中房源的编辑页，请在日历中确认或修改租期。否：留在此列表（避免重复编辑）。',
    dialogNo: '否',
    dialogYes: '是',
    hostCancelModalTitle: '确认取消',
    hostCancelModalAckLabel: '我已确认以上内容。',
    hostBookingConfirmToastOk: '预订已确认。',
    hostBookingConfirmToastErr: '确认预订失败。',
    hostBookingChatOpenErr: '无法打开聊天。',
    hostBookingRejectToastListingOk: '房源状态已更新。',
    hostBookingRejectToastErr: '拒绝处理失败。',
    hostBookingDeleteConfirm: '要删除此预订吗？',
    hostBookingDeleteOk: '预订已删除。',
    hostBookingDeleteErr: '删除失败。',
    hostBookingCancelReasonByOwner: '房东拒绝/取消',
    reservationServerTimeDetail: '无法校验服务器时间，请稍后重试。',
    hostManageBookedPropertiesTitle: '已预订房源管理',
    hostTabBookedProperties: '进行中的预订',
    hostTabCompletedReservations: '已完成',
    emptyNoActiveReservations: '暂无进行中的预订。',
    emptyNoCompletedReservations: '暂无已完成的预订。',
    tenantInfoHeading: '租客信息',
    confirmReservationBtn: '确认预订',
    markStayCompletedBtn: '标记为已完成',
    deleteHistoryRecordTitle: '删除记录',
    hostApproveBooking: '批准',
    cancelPolicyAgreeRequired: '请同意取消政策。',
    bookingCancelledToast: '预订已取消。',
    bookingCancelFailed: '取消失败。',
    confirmDeleteBookingRecord: '删除此预订记录？',
    bookingDeletedToast: '已删除。',
    bookingDeleteFailed: '删除失败。',
    checkInOutScheduleTitle: '入住/退房时间',
    importExternalCalendar: '导入外部日历',
    calendarPlatformLabel: '平台',
    calendarOptionNone: '不选择',
    calendarOptionOther: '其他',
    calendarNameLabel: '日历名称',
    calendarNamePlaceholderExample: '例如：Airbnb预订',
    removeAddressAriaLabel: '删除地址',
    backNavLabel: '返回',
    kycFirebasePhoneTitle: 'Firebase 手机验证',
    kycFirebasePhoneSubtitle: '通过 Google Firebase 进行安全的手机验证',
    kycPhoneVerificationHeading: '手机验证',
    kycPhoneVerificationForHostDesc: '请验证手机号以完成房东认证',
    kycPhoneVerifiedLong: '✅ 手机验证已完成。',
    kycNextStep: '下一步',
    kycTestModeProceed: '以测试模式继续',
    calWarnTitleOwner: '无法设置日期范围',
    calWarnTitleGuest: '无法预订',
    calWarnMinSevenBody: '仅支持按7天为单位预订。所选日期距离租期结束不足7天，请选择其他日期。',
    calSelectRentalStart: '选择租期开始日',
    calSelectRentalEnd: '选择租期结束日',
    calSelectCheckIn: '选择入住日期',
    calSelectCheckOut: '选择退房日期',
    calOwnerLegendSelectableStart: '可选为开始日',
    calOwnerLegendSelectedStart: '已选开始日',
    calOwnerLegendEndHint: '结束日（7天步进，最长约3个月）',
    calOwnerLegendWithinPeriod: '租期内（点击更改开始日）',
    calOwnerLegendOtherDates: '其他日期（点击更改开始日）',
    calOwnerSelectStartFirst: '请先选择开始日',
    calGuestLegendAvailable: '可选日期',
    calGuestLegendMinSeven: '至少7晚，排除已占用（退房灵活）',
    calGuestLegendBooked: '已预订 / 不可订',
    calGuestLegendCheckoutOk: '既有预订退房日（可入住）',
    calGuestLegendCheckoutDayAbbr: '退',
    calGuestLegendShortStayDemoDay: '31',
    calGuestLegendShortStay: '可用不足7天（不可入住）',
    calGuestLegendCheckinToEnd: '至房源结束日（或上限）',
    calGuestLegendValidCheckout: '有效退房（≥7晚且不重叠）',
    calGuestSelectCheckInFirst: '请先选择入住日期',
    weeklyCostLabel: '/ 周',
    bookingOccupancyLabel: '入住人数',
    importExternalCalendarHelp:
      '将 Airbnb、Agoda 等平台的预订与 500stay 同步。请输入 iCal URL（.ics）。',
    carouselPrevious: '上一项',
    carouselNext: '下一项',
    translationConsentTitle: '是否使用翻译功能？',
    translationConsentDescription:
      '使用翻译前需要您同意。设备内置引擎在离线状态下也可能可用。',
    translationConsentAgree: '同意并继续',
    translationConsentDecline: '拒绝',
    translationLangPackTitle: '下载翻译器',
    translationLangPackDescription:
      '使用翻译需下载设备内置翻译（语言包）。若拒绝，下次点击「翻译」时会再次提示。约需50MB空间，建议使用Wi-Fi。',
    translationLangPackAgree: '下载并继续',
    translationLangPackDecline: '稍后',
    translationModalEngineLine: '使用引擎：{{engine}}',
    translationModalWebRequiresNetwork: '需要网络连接。',
    translationModalOfflineCapable: '离线也可使用。',
    translationLangPackStorageTitle: '所需空间：约 50MB',
    translationLangPackStorageHint: '建议使用 Wi-Fi。下载后可离线使用。',
    translationFooterConsentPrivacy: '同意即视为接受隐私政策。',
    translationFooterLangPackDevice: '语言包将下载到设备存储空间。',
    chatTranslatedByGemini: '由 Gemini AI 自动翻译。',
    chatTranslatedByDevice: '由设备引擎自动翻译。',
    chatTranslationErrorLabel: '翻译错误',
    chatTranslateShowOriginalTitle: '查看原文',
    chatTranslateShowTranslatedTitle: '查看译文',
    chatTranslating: '翻译中',
    chatExampleTitle: '聊天消息示例',
    chatExampleHowToTitle: '使用方法',
    chatExampleBullet1: '每条消息右下角有翻译按钮。',
    chatExampleBullet2: '越南语消息可译为界面语言。',
    chatExampleBullet3: '其他语言可按设置进行翻译。',
    chatExampleBullet4: '翻译后可点「查看原文」切换。',
    chatExampleBullet5: '译文会缓存以便复用。',
    chatExampleDemoGuestName: '明安',
    chatExampleDemoHostName: '房东',
    chatExampleDemoTime1: '14:30',
    chatExampleDemoTime2: '14:32',
    chatExampleDemoTime3: '14:35',
    chatExampleDemoMsgHostReply:
      '您好，2月15日至22日可以预订。如需更多细节我可以说明。',
    propertyImageAltFallback: '房源图片',
    propertyFavoriteButtonAria: '收藏',
    carouselSlideSelectAria: '转到第 {{n}} 张',
    trustSignalKycTitle: '认证房东',
    trustSignalKycDesc: '身份已验证',
    trustSignalLanguagesTitle: '5种语言',
    trustSignalLanguagesDesc: 'KO/VI/EN/JA/ZH',
    trustSignalChatTitle: '实时聊天',
    trustSignalChatDesc: '直接与房东沟通',
    trustSignalBookingTitle: '即时确认',
    trustSignalBookingDesc: '快速通过预订',
    propertyDescriptionTranslateError: '翻译时出错。',
    propertyDescExampleTitle: '房源描述示例',
    propertyDescHowToTitle: '使用方法',
    propertyDescBullet1: '默认显示越南语原文。',
    propertyDescBullet2: '点击「翻译」查看译文。',
    propertyDescBullet3: '首次使用可能会显示同意对话框。',
    propertyDescBullet4: '原生应用可能需要下载语言包。',
    propertyDescBullet5: '翻译后可点「查看原文」切换。',
    uiTranslateGenericFail: '翻译失败，请稍后重试。',
    uiTranslatedBadge: '已翻译',
    uiTranslateReset: '重置',
    uiTranslateCostSavingHint: '为节省成本仅在需要时翻译；相同文本会缓存复用。',
    chatSendFailed: '发送消息失败。',
    chatRoleTenant: '租客',
    chatRoleLandlord: '房东',
    chatViewListing: '查看房源',
    chatViewListingDetail: '查看详情 →',
    chatResidencyNoticeTitle: '入住前请务必确认！',
    chatResidencyNoticeBody:
      '根据越南法律，必须进行暂住申报。为了舒适安全的住宿，请务必办理 ✈️',
    chatScrollOlderMessages: '向上滚动查看更早消息',
    chatBookingNoticeTitle: '预订确认说明',
    chatBookingNoticeBody: '为了安全愉快的住宿，请在入住后尽快完成暂住申报。',
    chatEmptyState: '发送消息开始对话',
    chatReadReceipt: '已读',
    chatSystemPeerJoined: '对方已进入聊天',
    chatSystemImageSent: '已发送图片',
    chatInputPlaceholder: '输入消息...',
    chatInputPlaceholderFull: '请输入消息...',
    settlementProcessHaltedDetail:
      '已暂停结算流程。请稍后再试。',
    settlementEmptyRevenueList:
      '暂无已过入住时间的已付款预订。',
    settlementNoWithdrawalHistory: '暂无提现记录。',
    settlementNoBankAccounts: '暂无已登记账户。',
    withdrawalValidateAmount: '请输入提现金额。',
    withdrawalSelectBankRequired: '请选择银行账户。',
    withdrawalRequestFailedMessage: '提现申请失败。',
    withdrawalSubmittedSuccess: '提现已提交。',
    bankAccountFormIncomplete: '请填写完整的账户信息。',
    bankAccountAddFailed: '账户登记失败。',
    bankAccountAddedSuccess: '账户已添加。',
    withdrawalStatusHeld: '暂缓',
    withdrawalStatusRejected: '已拒绝',
    profileKycCoinsProgress: '硬币 {n}/3',
    profileKycEncourageWithCount:
      '完成KYC认证收集3个硬币！（当前 {n}/3）',
    deleteAccountButton: '注销账户',
    deleteAccountExecuting: '处理中...',
    phoneVerificationRequired: '需要完成手机号验证。',
    langEndonymKo: '한국어',
    langEndonymVi: 'Tiếng Việt',
    langEndonymEn: 'English',
    langEndonymJa: '日本語',
    langEndonymZh: '中文',
    kycHostVerificationTitle: '房东认证',
    kycCompleteThreeStepSubtitle: '请完成三步验证',
    kycProgressLoadError: '无法加载认证进度。请刷新后重试。',
    kycStepFailedGeneric: '无法完成该 KYC 步骤。',
    kycIdDocumentStepTitle: '证件拍摄',
    kycFaceVerificationStepTitle: '人脸认证',
    kycStep2CompleteTitle: '第2步已完成',
    kycStep2CompleteBody:
      '证件信息已安全提交。请继续进行第3步人脸认证。',
    kycTestModeBannerTitle: '当前为测试模式',
    kycTestModeFaceSubtitle: '无需拍摄即可完成认证',
    kycTestModeIdSubtitle: '无需拍摄即可进入下一步',
    kycFaceFiveDirectionInstruction: '请按5个方向拍摄面部',
    kycStartCapture: '开始拍摄',
    kycFaceCaptureSessionTitle: '面部拍摄',
    kycMultistepProgress: '第 {current}/{total} 步',
    kycCameraErrorTitle: '相机错误',
    kycStopCapture: '停止拍摄',
    kycCaptureCompleteTitle: '拍摄完成',
    kycReviewCapturedImagesFace: '请确认已拍摄的图片',
    kycRetakePhotos: '重新拍摄',
    kycCompleteVerification: '完成认证',
    kycAiAnalyzingTitle: 'AI 分析中',
    kycAiAnalyzingDesc: '正在分析人脸认证数据...',
    kycIdSelectTypeAndCapture: '选择证件类型并使用相机拍摄',
    kycCameraOpenIdCard: '打开相机（证件）',
    kycCameraOpenPassport: '打开相机（护照）',
    kycIdCaptureTitleFrontIdCard: '拍摄证件正面',
    kycIdCaptureTitleFrontPassport: '拍摄护照资料页',
    kycIdCaptureTitleBack: '拍摄证件背面',
    kycIdAlignInGuide: '请将证件对准引导框拍摄',
    kycIdPlaceInFrame: '请将证件放入引导框内',
    kycIdFullDocumentVisible: '请确保证件完整入镜',
    kycImageConfirmTitle: '确认图片',
    kycImageConfirmDesc: '请确认拍摄的图片',
    kycIdSideFront: '正面',
    kycIdSideBack: '背面',
    kycShootBackSide: '拍摄背面',
    kycRetakeCapture: '重新拍摄',
    kycFormTitleEnterIdInfo: '填写证件信息',
    kycFormDescEnterIdInfo: '请输入证件上所示信息',
    kycFormIdNumberLabel: '证件号码',
    kycFormDateOfBirthLabel: '出生日期',
    kycFormIssueDateLabel: '签发日期',
    kycFormExpiryDateLabel: '有效期限',
    kycFormNextStep: '下一步',
    kycFormRequiredFieldsMissing: '请填写所有必填项',
    kycFormImageRequired: '请选择图片',
    kycCaptureCanvasError: '无法创建画布',
    kycCaptureFailedGeneric: '拍摄失败',
    cameraErrPermissionDenied:
      '相机权限被拒绝。请在设备设置中允许相机后重试。',
    cameraErrNotFound: '未找到可用相机。',
    cameraErrGeneric: '相机错误：{{detail}}',
    apiSyncErrorTransient:
      '暂时出现问题。请检查网络连接后稍候重试。',
    userFacingAuthOrSessionError:
      '出现错误。请稍后重试或检查登录状态。',
    bookingCreateFailedMessage: '无法创建预订。请稍后重试。',
    bookingPaymentCompleteFailedMessage:
      '无法完成付款。请检查网络后重试。',
    bookingPaymentMetaDefaultError:
      '无法将支付信息同步到服务器。请稍后重试。',
    bookingPaymentMetaCreateError:
      '无法登记支付元数据。预订已创建，请在付款前刷新或联系客服。',
    bookingPaymentToastRefundCancelledBody:
      '根据支付（退款）更新，预订已取消。请在「我的预订」中查看状态。',
    bookingPaymentToastConfirmedBody: '支付已完成，预订已确认。',
    bookingPaymentToastSyncedBody:
      '支付信息已同步到服务器。最新状态请在「我的预订」查看。',
    bookingRefundToastCancelledBody: '退款已处理，预订已取消（退款）。',
    bookingRefundToastSyncedBody: '退款支付信息已同步到服务器。',
    bookingSyncImmediateFailed: '保存预订失败。请稍后重试。',
    bookingErrorPaymentNotCompleted: '尚未完成付款。',
    appPaymentErrUnparseableResponse: '无法解析服务器响应。',
    appPaymentErrRejected: '请求被拒绝。',
    appPaymentErrHttpStatus: '请求失败（HTTP {{status}}）',
    topBarUnreadChatSubtitle: '{n} 条未读消息',
    topBarNoNotifications: '暂无新通知',
    topBarAriaNotifications: '通知',
    topBarAriaProfile: '个人资料菜单',
    topBarAriaLogin: '登录',
    adminAccountsListLoadFailed: '无法加载列表。',
    adminAccountsSaveFailed: '保存失败。',
    adminAccountsCreateFailed: '无法创建账户。',
    adminAccountsToggleFailed: '无法更改权限。',
    apiErrAdminAccountInvalidInput:
      '请检查用户名（3–64 个字符，字母数字及 ._-）和密码（至少 8 位）。',
    apiErrAdminUsernameTaken: '该用户名可能已存在。',
    apiErrAdminUsernameInvalid: '用户名格式无效。',
    apiErrAdminUsernameConflict: '该用户名已被使用。',
    apiErrAdminNewPasswordTooShort: '新密码至少需要 8 个字符。',
    apiErrAdminCurrentPasswordInvalid: '当前密码不正确。',
    apiErrAdminCannotDemoteOwnSuper: '无法在此处移除您自己的超级管理员权限。',
    apiErrAdminCannotDemoteLastSuper: '无法移除最后一位超级管理员。',
    apiErrAdminNoValidUpdates: '没有可应用的更改。',
    chatDateToday: '今天',
    chatDateYesterday: '昨天',
  },
};

/** `getUIText` 조회용 — 기본 문구와 listing 문구 병합 (동일 키가 있으면 listing이 우선) */
const mergedUiTexts: Record<SupportedLanguage, Record<UITextKey, string>> = {
  ko: { ...uiTexts.ko, ...listingTexts.ko },
  vi: { ...uiTexts.vi, ...listingTexts.vi },
  en: { ...uiTexts.en, ...listingTexts.en },
  ja: { ...uiTexts.ja, ...listingTexts.ja },
  zh: { ...uiTexts.zh, ...listingTexts.zh },
};

const UI_TEXT_PARITY_LOCALES: SupportedLanguage[] = ['ko', 'vi', 'en', 'ja', 'zh'];

/**
 * `mergedUiTexts`의 5개 locale이 동일한 키 집합을 갖는지 검사 (Vitest·CI용).
 * ko를 기준 집합으로 하며, 다른 locale에만 있거나 빠진 키를 나열합니다.
 */
export function getMergedUiTextKeyParityMismatches(): string[] {
  const ref = new Set(Object.keys(mergedUiTexts.ko));
  const mismatches: string[] = [];
  for (const lang of UI_TEXT_PARITY_LOCALES) {
    const s = new Set(Object.keys(mergedUiTexts[lang]));
    for (const k of ref) {
      if (!s.has(k)) mismatches.push(`${lang} missing key (vs ko): ${k}`);
    }
    for (const k of s) {
      if (!ref.has(k)) mismatches.push(`${lang} extra key (vs ko): ${k}`);
    }
  }
  return mismatches;
}

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
    return getUIText('bookingGuestSummaryWithChildren', language)
      .replace(/\{\{adults\}\}/g, String(adults))
      .replace(/\{\{children\}\}/g, String(children));
  }
  return getUIText('bookingGuestSummaryAdultsOnly', language).replace(/\{\{adults\}\}/g, String(adults));
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
  return `${ci} ${inT} · ${co} ${outT}`;
}

/** 예약·표시용 `toLocaleDateString` 로케일 */
export function getDateLocaleForLanguage(language: SupportedLanguage): string {
  switch (language) {
    case 'ko':
      return 'ko-KR';
    case 'vi':
      return 'vi-VN';
    case 'ja':
      return 'ja-JP';
    case 'zh':
      return 'zh-CN';
    default:
      return 'en-US';
  }
}

/**
 * 언어별 UI 텍스트 가져오기
 * 
 * @param key - 텍스트 키
 * @param language - 현재 언어
 * @returns 언어에 맞는 텍스트
 */
export function getUIText(key: UITextKey, language: SupportedLanguage): string {
  return mergedUiTexts[language][key] ?? mergedUiTexts.ko[key] ?? String(key);
}

/**
 * 동기화 에러 배너용: 기술적/영문 원문은 친화 문구로, 이미 정제된 문구는 유지.
 */
export function resolveUserFacingSyncErrorMessage(
  raw: string,
  language: SupportedLanguage,
): string {
  const m = raw.trim();
  if (!m) return getUIText('apiSyncErrorTransient', language);
  if (m === USER_FACING_CLIENT_AUTH_ERROR_MESSAGE) {
    return getUIText('userFacingAuthOrSessionError', language);
  }
  const lower = m.toLowerCase();
  if (
    /\b5\d\d\b/.test(m) ||
    /\b4\d\d\b/.test(m) ||
    /http\s*\d{3}/i.test(m) ||
    lower.includes('networkerror') ||
    lower.includes('failed to fetch') ||
    lower.includes('econnrefused') ||
    lower.includes('err_network') ||
    lower.includes('timeout') ||
    lower.includes('server error') ||
    lower.includes('internal server') ||
    lower.includes('bad gateway') ||
    lower.includes('service unavailable')
  ) {
    return getUIText('apiSyncErrorTransient', language);
  }
  return m;
}

const LANG_ENDONYM_KEYS: Record<SupportedLanguage, BaseUITextKey> = {
  ko: 'langEndonymKo',
  vi: 'langEndonymVi',
  en: 'langEndonymEn',
  ja: 'langEndonymJa',
  zh: 'langEndonymZh',
};

/** 언어 코드 → 자국어 표기(한국어/日本語/…). UI 언어와 무관하게 동일한 문자열을 씁니다. */
export function getLanguageEndonym(code: SupportedLanguage): string {
  const key = LANG_ENDONYM_KEYS[code];
  return mergedUiTexts.ko[key] ?? code;
}

/** 매물 유형 코드 → 현재 언어 표시명 */
export function getPropertyTypeLabel(
  propertyType: string | undefined,
  language: SupportedLanguage,
): string {
  const lk = getPropertyTypeListingKey(propertyType);
  return lk ? getUIText(lk, language) : "";
}

export type { ListingTextKey } from "@/utils/i18nListing";
export { getPropertyTypeListingKey } from "@/utils/i18nListing";

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
