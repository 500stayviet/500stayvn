"use client";

import { Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Loader2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import {
  LISTING_MAX_SUPPLY_DAYS,
} from "@/lib/constants/listingCalendar";
import type { SupportedLanguage } from "@/lib/api/translation";
import { useEditPropertyPageState } from "./hooks/useEditPropertyPageState";
import EditPropertyImageSection from "./components/EditPropertyImageSection";
import EditPropertyAddressSection from "./components/EditPropertyAddressSection";
import EditPropertyPolicySection from "./components/EditPropertyPolicySection";
import EditPropertyCoreSection from "./components/EditPropertyCoreSection";
import EditPropertyDetailsSection from "./components/EditPropertyDetailsSection";
import EditPropertyHeader from "./components/EditPropertyHeader";
import EditPropertySubmitButton from "./components/EditPropertySubmitButton";
import EditPropertyCalendarModal from "./components/EditPropertyCalendarModal";

// 베트남 스타일 컬러: Coral Red + Golden Orange + Sunshine Yellow (add-property와 동일)
const COLORS = {
  primary: "#E63946", // Coral Red - 메인 컬러
  primaryLight: "#FF6B6B", // Light Coral
  secondary: "#FF6B35", // Golden Orange - 보조 컬러
  accent: "#FFB627", // Sunshine Yellow - 강조
  success: "#10B981", // Emerald Green - 성공/완료
  error: "#DC2626", // Red - 에러
  white: "#FFFFFF",
  background: "#FFF8F0", // 따뜻한 크림색 배경
  surface: "#FFFFFF", // 카드 배경
  border: "#FED7AA", // 따뜻한 오렌지 테두리
  borderFocus: "#E63946", // 포커스 테두리
  text: "#1F2937", // 메인 텍스트
  textSecondary: "#6B7280", // 보조 텍스트
  textMuted: "#9CA3AF", // 희미한 텍스트
};

// 1. 모든 비즈니스 로직을 담은 내부 컴포넌트
function EditPropertyContent() {
  const toSupportedLanguage = (lang: string): SupportedLanguage => {
    if (lang === "ko" || lang === "vi" || lang === "ja" || lang === "zh") {
      return lang;
    }
    return "en";
  };

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();

  const fromModal = searchParams.get("from") === "modal";
  const autoExtend = searchParams.get("extend") === "1";
  const returnTab = searchParams.get("returnTab");
  /** 광고대기/광고종료에서 연 장소로 뒤로가기 */
  const returnTabSafe =
    returnTab === "pending" || returnTab === "ended" ? returnTab : null;
  const dismissSiblingRaw = searchParams.get("dismissSiblingId");
  const dismissSiblingId =
    dismissSiblingRaw &&
    dismissSiblingRaw.trim() !== propertyId &&
    dismissSiblingRaw.trim().length > 0
      ? dismissSiblingRaw.trim()
      : null;
  /** 재등록·날짜 확인 플로우: 달력에서 유효한 날짜를 다시 선택해야 저장 가능 */
  const needsRentalCalendarAck =
    autoExtend || returnTabSafe === "pending" || returnTabSafe === "ended";
  const extensionMaxDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + LISTING_MAX_SUPPLY_DAYS);
    return d;
  })();
  const state = useEditPropertyPageState({
    propertyId,
    currentLanguage,
    user: user ? { uid: user.uid } : null,
    authLoading,
    dismissSiblingId,
    needsRentalCalendarAck,
    extensionMaxDate,
    onRedirect: (path) => router.push(path),
  });

  if (authLoading || state.loadingProperty)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === "ko"
            ? "로딩 중..."
            : currentLanguage === "vi"
              ? "Đang tải..."
              : "Loading..."}
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <div
        className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* 상단 바 */}
        <TopBar />

        {/* 콘텐츠 - 스크롤 가능한 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-4">
          <EditPropertyHeader
            currentLanguage={currentLanguage}
            textColor={COLORS.text}
            textSecondaryColor={COLORS.textSecondary}
            borderColor={COLORS.border}
            onBack={() => {
              if (returnTabSafe) {
                router.push(`/profile/my-properties?tab=${returnTabSafe}`);
                return;
              }
              if (fromModal && propertyId) {
                router.push(`/profile/my-properties?open=${propertyId}`);
                return;
              }
              router.back();
            }}
          />

          <form onSubmit={state.handleSubmit} className="space-y-5">
            <EditPropertyImageSection
              currentLanguage={currentLanguage}
              imagePreviews={state.imagePreviews}
              showImageSourceMenu={state.image.showImageSourceMenu}
              colors={COLORS}
              photoLibraryInputRef={state.image.photoLibraryInputRef}
              cameraInputRef={state.image.cameraInputRef}
              handlePhotoLibraryChange={state.image.handlePhotoLibraryChange}
              handleCameraChange={state.image.handleCameraChange}
              handleRemoveImage={state.image.handleRemoveImage}
              openImageSourceMenu={state.image.openImageSourceMenu}
              closeImageSourceMenu={state.image.closeImageSourceMenu}
              openPhotoLibrary={state.image.openPhotoLibrary}
              openCamera={state.image.openCamera}
            />

            <EditPropertyCoreSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              propertyType={state.propertyType}
              bedrooms={state.bedrooms}
              bathrooms={state.bathrooms}
              maxAdults={state.maxAdults}
              checkInDate={state.checkInDate}
              checkOutDate={state.checkOutDate}
              weeklyRent={state.weeklyRent}
              needsRentalCalendarAck={state.needsRentalCalendarAck}
              rentalCalendarAcknowledged={state.rentalCalendarAcknowledged}
              openCheckInCalendar={state.openCheckInCalendar}
              openCheckOutCalendar={state.openCheckOutCalendar}
              setPropertyType={state.setPropertyType}
              setBedrooms={state.setBedrooms}
              setBathrooms={state.setBathrooms}
              setMaxAdults={state.setMaxAdults}
              setMaxChildren={state.setMaxChildren}
              setWeeklyRent={state.setWeeklyRent}
            />

            <EditPropertyAddressSection
              currentLanguage={currentLanguage}
              address={state.address}
              coordinates={state.coordinates}
              selectedCityId={state.selectedCityId}
              selectedDistrictId={state.selectedDistrictId}
              buildingNumber={state.buildingNumber}
              roomNumber={state.roomNumber}
              setSelectedDistrictId={state.setSelectedDistrictId}
              setBuildingNumber={state.setBuildingNumber}
              setRoomNumber={state.setRoomNumber}
              onOpenAddressModal={() => state.setShowAddressModal(true)}
              onClearAddress={state.clearAddress}
            />


            <EditPropertyPolicySection
              currentLanguage={currentLanguage}
              selectedAmenities={state.selectedAmenities}
              maxPets={state.maxPets}
              petFeeAmount={state.petFeeAmount}
              cleaningPerWeek={state.cleaningPerWeek}
              setSelectedAmenities={state.setSelectedAmenities}
              setMaxPets={state.setMaxPets}
              setPetFeeAmount={state.setPetFeeAmount}
              setCleaningPerWeek={state.setCleaningPerWeek}
            />

            <EditPropertyDetailsSection
              currentLanguage={currentLanguage}
              checkInTime={state.checkInTime}
              checkOutTime={state.checkOutTime}
              propertyName={state.propertyName}
              propertyDescription={state.propertyDescription}
              showIcalDropdown={state.showIcalDropdown}
              icalPlatform={state.icalPlatform}
              icalCalendarName={state.icalCalendarName}
              icalUrl={state.icalUrl}
              setCheckInTime={state.setCheckInTime}
              setCheckOutTime={state.setCheckOutTime}
              setPropertyName={state.setPropertyName}
              setPropertyDescription={state.setPropertyDescription}
              setShowIcalDropdown={state.setShowIcalDropdown}
              setIcalPlatform={state.setIcalPlatform}
              setIcalCalendarName={state.setIcalCalendarName}
              setIcalUrl={state.setIcalUrl}
            />

            <EditPropertySubmitButton
              currentLanguage={currentLanguage}
              loading={state.loading}
              isDeleted={state.isDeleted}
              primaryColor={COLORS.primary}
              textColor={COLORS.white}
            />
          </form>
        </div>
      </div>

      <EditPropertyCalendarModal
        isOpen={state.showCalendar}
        autoExtend={autoExtend}
        calendarMode={state.calendarMode}
        checkInDate={state.checkInDate}
        checkOutDate={state.checkOutDate}
        extensionMaxDate={extensionMaxDate}
        bookedRanges={state.bookedRanges}
        currentLanguage={toSupportedLanguage(currentLanguage)}
        onClose={state.closeCalendar}
        onCheckInSelect={state.onCheckInSelect}
        onCheckOutSelect={state.onCheckOutSelect}
        onCheckInReset={state.onCheckInReset}
      />

      {/* 주소 확인 모달 */}
      <AddressVerificationModal
        isOpen={state.showAddressModal}
        onClose={() => state.setShowAddressModal(false)}
        onConfirm={state.handleAddressConfirm}
        currentLanguage={currentLanguage}
        initialAddress={state.address}
      />
    </div>
  );
}

// 2. 최종 페이지 컴포넌트 (Suspense 적용)
export default function EditPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }
    >
      <EditPropertyContent />
    </Suspense>
  );
}
