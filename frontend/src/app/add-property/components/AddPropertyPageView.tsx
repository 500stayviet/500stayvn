"use client";

import dynamic from "next/dynamic";
import { Loader2, Check } from "lucide-react";
import TopBar from "@/components/TopBar";
import { AddPropertyAddressSection } from "./AddPropertyAddressSection";
import { AddPropertyRentalSection } from "./AddPropertyRentalSection";
import { AddPropertyTypeSection } from "./AddPropertyTypeSection";
import { ADD_PROPERTY_COLORS as COLORS } from "../constants/addPropertyColors";
import type { AddPropertyPageViewModel } from "../hooks/useAddPropertyPageState";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

const AddPropertyImageSection = dynamic(
  () =>
    import("./AddPropertyImageSection").then((mod) => ({
      default: mod.AddPropertyImageSection,
    })),
  {
    loading: () => (
      <div className="w-full h-48 rounded-xl bg-gray-100 animate-pulse" />
    ),
  },
);
const AddPropertyPolicySection = dynamic(
  () =>
    import("./AddPropertyPolicySection").then((mod) => ({
      default: mod.AddPropertyPolicySection,
    })),
);
const CalendarComponent = dynamic(() => import("@/components/CalendarComponent"), {
  ssr: false,
});
const AddressVerificationModal = dynamic(
  () => import("@/components/AddressVerificationModal"),
  { ssr: false },
);
const AddPropertyCheckTimeSection = dynamic(
  () =>
    import("./AddPropertyCheckTimeSection").then((mod) => ({
      default: mod.AddPropertyCheckTimeSection,
    })),
);
const AddPropertyBasicInfoSection = dynamic(
  () =>
    import("./AddPropertyBasicInfoSection").then((mod) => ({
      default: mod.AddPropertyBasicInfoSection,
    })),
);
const AddPropertyExternalCalendarSection = dynamic(
  () =>
    import("./AddPropertyExternalCalendarSection").then((mod) => ({
      default: mod.AddPropertyExternalCalendarSection,
    })),
);

type Props = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  currentLanguage: SupportedLanguage;
  authLoading: boolean;
  vm: AddPropertyPageViewModel;
};

export function AddPropertyPageView({
  router,
  currentLanguage,
  authLoading,
  vm,
}: Props) {
  const {
    loading,
    checkingAccess,
    hasAccess,
    maxRentalDay,
    images,
    imagePreviews,
    address,
    buildingNumber,
    roomNumber,
    weeklyRent,
    selectedFacilities,
    propertyType,
    cleaningPerWeek,
    maxPets,
    petFeeAmount,
    coordinates,
    selectedCityId,
    selectedDistrictId,
    maxAdults,
    maxChildren,
    bedrooms,
    bathrooms,
    title,
    propertyDescription,
    checkInTime,
    checkOutTime,
    showSuccessModal,
    showAddressModal,
    bedroomOptions,
    bathroomOptions,
    calendarState,
    imageState,
    handleSubmit,
    submitDisabled,
    getLocalizedLabel,
    handleAddressConfirm,
    clearAddress,
    setShowAddressModal,
    setShowSuccessModal,
    setBuildingNumber,
    setRoomNumber,
    setWeeklyRent,
    setPropertyType,
    setBedrooms,
    setBathrooms,
    setMaxAdults,
    setMaxChildren,
    setSelectedCityId,
    setSelectedDistrictId,
    setMaxPets,
    setPetFeeAmount,
    setCleaningPerWeek,
    setTitle,
    setPropertyDescription,
    setCheckInTime,
    setCheckOutTime,
    setIcalPlatform,
    setIcalCalendarName,
    setIcalUrl,
    toggleFacility,
  } = vm;

  void maxChildren;

  if (checkingAccess || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{getUIText("loading", currentLanguage)}</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div
      data-testid="add-property-content"
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <div
        className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative"
        style={{ backgroundColor: COLORS.surface }}
      >
        <TopBar />

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-4">
          <div
            className="mb-5 pb-4"
            style={{ borderBottom: `1px solid ${COLORS.border}` }}
          >
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
              {getUIText("addProperty", currentLanguage)}
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              {getUIText("addFormSubtitle", currentLanguage)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AddPropertyImageSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              images={images}
              imagePreviews={imagePreviews}
              showImageSourceMenu={imageState.showImageSourceMenu}
              showPhotoLibrary={imageState.showPhotoLibrary}
              photoLibraryPreviews={imageState.photoLibraryPreviews}
              selectedLibraryIndices={imageState.selectedLibraryIndices}
              fullScreenImageIndex={imageState.fullScreenImageIndex}
              showGuidelinePopup={imageState.showGuidelinePopup}
              photoLibraryInputRef={imageState.photoLibraryInputRef}
              cameraInputRef={imageState.cameraInputRef}
              onRemoveImage={imageState.handleImageRemove}
              onAddImageClick={imageState.handleAddImageClick}
              onPhotoLibrarySelect={imageState.handlePhotoLibrarySelect}
              onCameraCapture={imageState.handleCameraCapture}
              onCloseImageSourceMenu={imageState.closeImageSourceMenu}
              onSelectFromLibrary={imageState.handleSelectFromLibrary}
              onTakePhoto={imageState.handleTakePhoto}
              onClosePhotoLibrary={imageState.closePhotoLibrary}
              onTogglePhotoSelection={imageState.togglePhotoSelection}
              onViewFullScreen={imageState.handleViewFullScreen}
              onConfirmPhotoSelection={imageState.handleConfirmPhotoSelection}
              onBackToLibrary={imageState.handleBackToLibrary}
              onGuidelinePopupClick={imageState.handleGuidelinePopupClick}
            />

            <AddPropertyTypeSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              propertyType={propertyType}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              maxAdults={maxAdults}
              bedroomOptions={bedroomOptions}
              bathroomOptions={bathroomOptions}
              onPropertyTypeChange={setPropertyType}
              onBedroomsChange={setBedrooms}
              onBathroomsChange={setBathrooms}
              onMaxAdultsChange={setMaxAdults}
              onMaxChildrenReset={() => setMaxChildren(0)}
            />

            <AddPropertyAddressSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              address={address}
              coordinates={coordinates}
              selectedCityId={selectedCityId}
              selectedDistrictId={selectedDistrictId}
              buildingNumber={buildingNumber}
              roomNumber={roomNumber}
              onOpenAddressModal={() => setShowAddressModal(true)}
              onClearAddress={clearAddress}
              onCityChange={(cityId) => {
                setSelectedCityId(cityId);
                setSelectedDistrictId("");
              }}
              onDistrictChange={setSelectedDistrictId}
              onBuildingNumberChange={setBuildingNumber}
              onRoomNumberChange={setRoomNumber}
            />

            <AddPropertyRentalSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              checkInDate={calendarState.checkInDate}
              checkOutDate={calendarState.checkOutDate}
              weeklyRent={weeklyRent}
              onOpenCheckInCalendar={calendarState.openCheckInCalendar}
              onOpenCheckOutCalendar={calendarState.openCheckOutCalendar}
              onWeeklyRentChange={setWeeklyRent}
            />

            <AddPropertyPolicySection
              currentLanguage={currentLanguage}
              colors={COLORS}
              selectedFacilities={selectedFacilities}
              maxPets={maxPets}
              petFeeAmount={petFeeAmount}
              cleaningPerWeek={cleaningPerWeek}
              onToggleFacility={toggleFacility}
              onMaxPetsChange={setMaxPets}
              onPetFeeAmountChange={setPetFeeAmount}
              onCleaningPerWeekChange={setCleaningPerWeek}
              getLocalizedLabel={getLocalizedLabel}
            />

            <AddPropertyCheckTimeSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              checkInTime={checkInTime}
              checkOutTime={checkOutTime}
              onCheckInTimeChange={setCheckInTime}
              onCheckOutTimeChange={setCheckOutTime}
            />

            <AddPropertyBasicInfoSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              title={title}
              propertyDescription={propertyDescription}
              onTitleChange={setTitle}
              onPropertyDescriptionChange={setPropertyDescription}
            />

            <AddPropertyExternalCalendarSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              showIcalDropdown={calendarState.showIcalDropdown}
              icalPlatform={calendarState.icalPlatform}
              icalCalendarName={calendarState.icalCalendarName}
              icalUrl={calendarState.icalUrl}
              onToggleIcalDropdown={calendarState.toggleIcalDropdown}
              onIcalPlatformChange={setIcalPlatform}
              onIcalCalendarNameChange={setIcalCalendarName}
              onIcalUrlChange={setIcalUrl}
            />

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{getUIText("addSubmitting", currentLanguage)}</span>
                </>
              ) : (
                <span>{getUIText("addSubmitCta", currentLanguage)}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {calendarState.showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={calendarState.closeCalendar}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={calendarState.checkInDate}
              checkOutDate={calendarState.checkOutDate}
              maxDate={maxRentalDay}
              onCheckInSelect={calendarState.onCheckInSelect}
              onCheckOutSelect={calendarState.onCheckOutSelect}
              onCheckInReset={calendarState.onCheckInReset}
              currentLanguage={currentLanguage}
              onClose={calendarState.closeCalendar}
              mode={calendarState.calendarMode}
              bookedRanges={[]}
              isOwnerMode={true}
            />
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => {
            setShowSuccessModal(false);
            router.replace("/profile/my-properties");
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl transition-all duration-200 ease-out scale-100 opacity-100"
            style={{
              background:
                "linear-gradient(135deg, #FFF7ED 0%, #FFE8D6 50%, #FFD7BA 100%)",
              border: "1px solid #FDBA74",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/80 border border-orange-200">
              <Check className="w-8 h-8" style={{ color: COLORS.success }} />
            </div>
            <h3
              className="text-xl font-bold text-center mb-2"
              style={{ color: COLORS.text }}
            >
              {getUIText("addDoneTitle", currentLanguage)}
            </h3>
            <p
              className="text-sm text-center mb-5"
              style={{ color: COLORS.textSecondary }}
            >
              {getUIText("addDoneLine", currentLanguage)}
            </p>
            <button
              type="button"
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{
                background: "linear-gradient(90deg, #E63946 0%, #FF6B35 100%)",
              }}
              onClick={() => {
                setShowSuccessModal(false);
                router.replace("/profile/my-properties");
              }}
            >
              {getUIText("addGoMyprops", currentLanguage)}
            </button>
          </div>
        </div>
      )}

      {showAddressModal ? (
        <AddressVerificationModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onConfirm={handleAddressConfirm}
          currentLanguage={currentLanguage}
          initialAddress={address}
        />
      ) : null}
    </div>
  );
}
