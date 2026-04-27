"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import { LISTING_MAX_SUPPLY_DAYS } from "@/lib/constants/listingCalendar";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import { useEditPropertyPageState } from "./hooks/useEditPropertyPageState";

const AddressVerificationModal = dynamic(
  () => import("@/components/AddressVerificationModal"),
  { ssr: false },
);
const EditPropertyHeader = dynamic(
  () => import("./components/EditPropertyHeader"),
);
const EditPropertyImageSection = dynamic(
  () => import("./components/EditPropertyImageSection"),
  {
    loading: () => (
      <div className="w-full h-48 rounded-xl bg-gray-100 animate-pulse" />
    ),
  },
);
const EditPropertyAddressSection = dynamic(
  () => import("./components/EditPropertyAddressSection"),
);
const EditPropertySubmitButton = dynamic(
  () => import("./components/EditPropertySubmitButton"),
);
const EditPropertyCalendarModal = dynamic(
  () => import("./components/EditPropertyCalendarModal"),
  { ssr: false },
);
const EditPropertyPolicySection = dynamic(
  () => import("./components/EditPropertyPolicySection"),
);
const EditPropertyCoreSection = dynamic(
  () => import("./components/EditPropertyCoreSection"),
);
const EditPropertyDetailsSection = dynamic(
  () => import("./components/EditPropertyDetailsSection"),
);

const COLORS = {
  primary: "#E63946",
  primaryLight: "#FF6B6B",
  secondary: "#FF6B35",
  accent: "#FFB627",
  success: "#10B981",
  error: "#DC2626",
  white: "#FFFFFF",
  background: "#FFF8F0",
  surface: "#FFFFFF",
  border: "#FED7AA",
  borderFocus: "#E63946",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
};

export default function EditPropertyContent() {
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
  const returnTabSafe =
    returnTab === "pending" || returnTab === "ended" ? returnTab : null;
  const dismissSiblingRaw = searchParams.get("dismissSiblingId");
  const dismissSiblingId =
    dismissSiblingRaw &&
    dismissSiblingRaw.trim() !== propertyId &&
    dismissSiblingRaw.trim().length > 0
      ? dismissSiblingRaw.trim()
      : null;
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
        <div className="text-gray-500">{getUIText("loading", toSupportedLanguage(currentLanguage))}</div>
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
        <TopBar />
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-4">
          <EditPropertyHeader
            currentLanguage={toSupportedLanguage(currentLanguage)}
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

      {state.showCalendar ? (
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
      ) : null}

      {state.showAddressModal ? (
        <AddressVerificationModal
          isOpen={state.showAddressModal}
          onClose={() => state.setShowAddressModal(false)}
          onConfirm={state.handleAddressConfirm}
          currentLanguage={currentLanguage}
          initialAddress={state.address}
        />
      ) : null}
    </div>
  );
}
