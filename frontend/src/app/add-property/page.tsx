"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LISTING_MAX_SUPPLY_DAYS } from "@/lib/constants/listingCalendar";
import { getUIText } from "@/utils/i18n";
import {
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import { searchRegions } from "@/lib/data/vietnam-regions";
import { usePropertyImageManager } from "./hooks/usePropertyImageManager";
import { useAddPropertyAccess } from "./hooks/useAddPropertyAccess";
import { useAddPropertyFormRules } from "./hooks/useAddPropertyFormRules";
import { useAddPropertyCalendarIcal } from "./hooks/useAddPropertyCalendarIcal";
import { useAddPropertySubmit } from "./hooks/useAddPropertySubmit";
import { AddPropertyImageSection } from "./components/AddPropertyImageSection";
import { AddPropertyPolicySection } from "./components/AddPropertyPolicySection";
import { AddPropertyAddressSection } from "./components/AddPropertyAddressSection";
import { AddPropertyRentalSection } from "./components/AddPropertyRentalSection";
import { ADD_PROPERTY_COLORS as COLORS } from "./constants/addPropertyColors";


export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { checkingAccess, hasAccess } = useAddPropertyAccess({
    user,
    authLoading,
    onRedirect: (path) => router.push(path),
  });

  const todayOnly = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const maxRentalDay = (() => {
    const d = new Date(todayOnly);
    d.setDate(d.getDate() + LISTING_MAX_SUPPLY_DAYS);
    return d;
  })();
  // 폼 상태
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState(""); // 동
  const [roomNumber, setRoomNumber] = useState(""); // 호실
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<
    "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached"
  >("");
  const [cleaningPerWeek, setCleaningPerWeek] = useState(1);
  const [maxPets, setMaxPets] = useState(1);
  const [petFeeAmount, setPetFeeAmount] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [maxAdults, setMaxAdults] = useState(1);
  const [maxChildren, setMaxChildren] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [title, setTitle] = useState(""); // 매물명 (title)
  const [propertyDescription, setPropertyDescription] = useState("");
  // 체크인/체크아웃 시간
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");

  const { toggleFacility, petAllowed, bedroomOptions, bathroomOptions } =
    useAddPropertyFormRules({
      propertyType,
      setBedrooms,
      setBathrooms,
      selectedCityId,
      selectedDistrictId,
      setSelectedDistrictId,
      selectedFacilities,
      setSelectedFacilities,
    });

  const {
    showCalendar,
    calendarMode,
    checkInDate,
    checkOutDate,
    icalPlatform,
    icalCalendarName,
    icalUrl,
    showIcalDropdown,
    setIcalPlatform,
    setIcalCalendarName,
    setIcalUrl,
    openCheckInCalendar,
    openCheckOutCalendar,
    closeCalendar,
    onCheckInSelect,
    onCheckOutSelect,
    onCheckInReset,
    toggleIcalDropdown,
  } = useAddPropertyCalendarIcal();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const {
    showPhotoLibrary,
    photoLibraryPreviews,
    selectedLibraryIndices,
    fullScreenImageIndex,
    showImageSourceMenu,
    showGuidelinePopup,
    photoLibraryInputRef,
    cameraInputRef,
    closePhotoLibrary,
    handlePhotoLibrarySelect,
    togglePhotoSelection,
    handleConfirmPhotoSelection,
    handleViewFullScreen,
    handleBackToLibrary,
    handleCameraCapture,
    handleAddImageClick,
    handleSelectFromLibrary,
    handleTakePhoto,
    closeImageSourceMenu,
    handleGuidelinePopupClick,
    handleImageRemove,
  } = usePropertyImageManager({
    images,
    setImages,
    imagePreviews,
    setImagePreviews,
  });

  // 주소 확인 모달
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 주소 확인 모달에서 주소 확정 시 (도시·구 자동 설정)
  const getLocalizedLabel = (
    label: { en: string; ko?: string; vi?: string; ja?: string; zh?: string },
  ) => {
    if (currentLanguage === "ko") return label.ko ?? label.en;
    if (currentLanguage === "vi") return label.vi ?? label.en;
    if (currentLanguage === "ja") return label.ja ?? label.en;
    if (currentLanguage === "zh") return label.zh ?? label.en;
    return label.en;
  };

  const handleAddressConfirm = (data: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setAddress(data.address);
    setCoordinates({ lat: data.lat, lng: data.lng });

    // 요구사항:
    // - 구(district)는 주소에 구 정보가 없어 항상 빈 값으로 두고, 사용자가 선택하게 함.
    // - 도시(city)는 주소 텍스트에서 city 키워드가 있는 경우에만 프리필.
    setSelectedDistrictId("");

    const matches = searchRegions(data.address);
    const cityMatch = matches.find((r) => r.type === "city");
    setSelectedCityId(cityMatch ? cityMatch.id : "");
  };

  const { handleSubmit } = useAddPropertySubmit({
    currentLanguage,
    user: user ? { uid: user.uid } : null,
    router: { push: (path) => router.push(path) },
    setLoading,
    onSuccess: () => setShowSuccessModal(true),
    formState: {
      address,
      coordinates,
      selectedCityId,
      selectedDistrictId,
      images,
      imagePreviews,
      weeklyRent,
      propertyType,
      title,
      propertyDescription,
      checkInDate,
      checkOutDate,
      todayOnly,
      maxRentalDay,
      bedrooms,
      bathrooms,
      selectedFacilities,
      buildingNumber,
      roomNumber,
      cleaningPerWeek,
      petAllowed,
      maxPets,
      petFeeAmount,
      checkInTime,
      checkOutTime,
      maxAdults,
      maxChildren,
      icalPlatform,
      icalCalendarName,
      icalUrl,
    },
  });

  // 접근 권한 확인 중
  if (checkingAccess || authLoading) {
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
        {/* 상단 바 */}
        <TopBar />

        {/* 콘텐츠 - 스크롤 가능한 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-4">
          {/* 헤더 */}
          <div
            className="mb-5 pb-4"
            style={{ borderBottom: `1px solid ${COLORS.border}` }}
          >
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
              {currentLanguage === "ko"
                ? "새 매물 등록"
                : currentLanguage === "vi"
                  ? "Đăng ký bất động sản mới"
                : currentLanguage === "ja"
                  ? "新規物件登録"
                : currentLanguage === "zh"
                  ? "新物业注册"
                  : "Register New Property"}
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              {currentLanguage === "ko"
                ? "매물 정보를 입력해주세요"
                : currentLanguage === "vi"
                  ? "Vui lòng nhập thông tin bất động sản"
                : currentLanguage === "ja"
                  ? "物件情報を入力してください"
                : currentLanguage === "zh"
                  ? "请输入物业信息"
                  : "Please enter property information"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AddPropertyImageSection
              currentLanguage={currentLanguage}
              colors={COLORS}
              images={images}
              imagePreviews={imagePreviews}
              showImageSourceMenu={showImageSourceMenu}
              showPhotoLibrary={showPhotoLibrary}
              photoLibraryPreviews={photoLibraryPreviews}
              selectedLibraryIndices={selectedLibraryIndices}
              fullScreenImageIndex={fullScreenImageIndex}
              showGuidelinePopup={showGuidelinePopup}
              photoLibraryInputRef={photoLibraryInputRef}
              cameraInputRef={cameraInputRef}
              onRemoveImage={handleImageRemove}
              onAddImageClick={handleAddImageClick}
              onPhotoLibrarySelect={handlePhotoLibrarySelect}
              onCameraCapture={handleCameraCapture}
              onCloseImageSourceMenu={closeImageSourceMenu}
              onSelectFromLibrary={handleSelectFromLibrary}
              onTakePhoto={handleTakePhoto}
              onClosePhotoLibrary={closePhotoLibrary}
              onTogglePhotoSelection={togglePhotoSelection}
              onViewFullScreen={handleViewFullScreen}
              onConfirmPhotoSelection={handleConfirmPhotoSelection}
              onBackToLibrary={handleBackToLibrary}
              onGuidelinePopupClick={handleGuidelinePopupClick}
            />

            {/* 매물 종류 / 방 개수 / 화장실 수 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: `${COLORS.border}20`,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-4"
                style={{ color: COLORS.text }}
              >
                {currentLanguage === "ko"
                  ? "매물 종류"
                  : currentLanguage === "vi"
                    ? "Loại bất động sản"
                  : currentLanguage === "ja"
                    ? "物件の種類"
                  : currentLanguage === "zh"
                    ? "物业类型"
                    : "Property Type"}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    {
                      value: "studio" as const,
                      ko: "스튜디오",
                      vi: "Studio",
                      en: "Studio",
                      ja: "スタジオ",
                      zh: "工作室",
                    },
                    {
                      value: "one_room" as const,
                      ko: "원룸(방·거실 분리)",
                      vi: "Phòng đơn (phòng ngủ & phòng khách riêng)",
                      en: "One Room (bedroom & living room separate)",
                      ja: "ワンルーム（寝室・リビング別）",
                      zh: "一室（卧室与客厅分开）",
                    },
                    {
                      value: "two_room" as const,
                      ko: "2룸",
                      vi: "2 phòng",
                      en: "2 Rooms",
                      ja: "2ルーム",
                      zh: "2室",
                    },
                    {
                      value: "three_plus" as const,
                      ko: "3+룸",
                      vi: "3+ phòng",
                      en: "3+ Rooms",
                      ja: "3+ルーム",
                      zh: "3+室",
                    },
                    {
                      value: "detached" as const,
                      ko: "독채",
                      vi: "Nhà riêng",
                      en: "Detached House",
                      ja: "一戸建て",
                      zh: "独栋房屋",
                    },
                  ] as const
                ).map(({ value, ko, vi, en, ja, zh }) => {
                  const label = 
                    currentLanguage === "ko" ? ko :
                    currentLanguage === "vi" ? vi :
                    currentLanguage === "ja" ? ja :
                    currentLanguage === "zh" ? zh :
                    en;
                  
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPropertyType(value)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        backgroundColor: propertyType === value ? COLORS.primary : COLORS.white,
                        color: propertyType === value ? COLORS.white : COLORS.text,
                        border: `1px solid ${propertyType === value ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {propertyType && (
                <div
                  className="grid grid-cols-3 gap-2 mt-4 pt-4"
                  style={{ borderTop: `1px solid ${COLORS.border}40` }}
                >
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "방 개수"
                        : currentLanguage === "vi"
                          ? "Số phòng"
                          : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      disabled={
                        propertyType === "studio" ||
                        propertyType === "one_room" ||
                        propertyType === "two_room"
                      }
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {bedroomOptions.map((n) => (
                        <option key={n} value={n}>
                          {n === 5 &&
                          (propertyType === "three_plus" ||
                            propertyType === "detached")
                            ? "5+"
                            : n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "화장실 수"
                        : currentLanguage === "vi"
                          ? "Số phòng tắm"
                          : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {bathroomOptions.map((n) => (
                        <option key={n} value={n}>
                          {n === 6 && propertyType === "three_plus" ? "5+" : n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "최대 인원"
                        : currentLanguage === "vi"
                          ? "Số người tối đa"
                          : "Max Guests"}
                    </label>
                    <select
                      value={maxAdults}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxAdults(v);
                        setMaxChildren(0);
                      }}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                          {currentLanguage === "ko"
                            ? "명"
                            : currentLanguage === "vi"
                              ? " người"
                              : " guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

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
              onClearAddress={() => {
                setAddress("");
                setCoordinates(null);
                setSelectedCityId("");
                setSelectedDistrictId("");
              }}
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
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              weeklyRent={weeklyRent}
              onOpenCheckInCalendar={openCheckInCalendar}
              onOpenCheckOutCalendar={openCheckOutCalendar}
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

            {/* 체크인/체크아웃 시간 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-4"
                style={{ color: COLORS.text }}
              >
                {currentLanguage === "ko"
                  ? "체크인/체크아웃 시간"
                  : currentLanguage === "vi"
                    ? "Giờ check-in/check-out"
                  : currentLanguage === "ja"
                    ? "チェックイン/チェックアウト時間"
                  : currentLanguage === "zh"
                    ? "入住/退房时间"
                    : "Check-in/Check-out Time"}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-[11px] font-medium mb-1.5"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {currentLanguage === "ko" ? "체크인" : "Check-in"}
                  </label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return [`${hour}:00`, `${hour}:30`];
                    })
                      .flat()
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-[11px] font-medium mb-1.5"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
                  </label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return [`${hour}:00`, `${hour}:30`];
                    })
                      .flat()
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </section>

            {/* 매물명 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-3"
                style={{ color: COLORS.text }}
              >
                {getUIText("title", currentLanguage)}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={getUIText(
                  "titlePlaceholder",
                  currentLanguage,
                )}
                className="w-full px-3 py-2.5 rounded-lg text-sm min-h-[40px] focus:outline-none transition-all"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                }}
                required
              />
            </section>

            {/* 매물 설명 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-3"
                style={{ color: COLORS.text }}
              >
                {currentLanguage === "ko"
                  ? "매물 설명"
                  : currentLanguage === "vi"
                    ? "Mô tả bất động sản"
                    : "Property Description"}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              <textarea
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder={
                  currentLanguage === "ko"
                    ? "매물에 대한 상세 설명을 입력해주세요..."
                    : currentLanguage === "vi"
                      ? "Nhập mô tả chi tiết về bất động sản..."
                      : "Enter detailed description..."
                }
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg resize-none text-sm min-h-[100px] focus:outline-none transition-all"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                }}
                required
              />
              <p
                className="text-[10px] mt-2 flex items-start gap-1"
                style={{ color: COLORS.success }}
              >
                <span>i</span>
                <span>
                  {currentLanguage === "ko"
                    ? "베트남어로 입력해주세요. 자동 번역 기능이 제공됩니다."
                    : currentLanguage === "vi"
                      ? "Vui lòng nhập bằng tiếng Việt. Tính năng dịch tự động sẽ được cung cấp."
                      : "Please enter in Vietnamese. Automatic translation will be provided."}
                </span>
              </p>
            </section>

            {/* 외부 캘린더 가져오기 */}
            <section
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <button
                type="button"
                onClick={toggleIcalDropdown}
                className="w-full py-3 px-4 flex items-center justify-between transition-colors text-left min-h-[48px]"
                style={{ backgroundColor: `${COLORS.border}20` }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.text }}
                >
                  {currentLanguage === "ko"
                    ? "외부 캘린더 가져오기"
                    : currentLanguage === "vi"
                      ? "Đồng bộ lịch ngoài"
                      : "Import External Calendar"}
                </span>
                {showIcalDropdown ? (
                  <ChevronUp
                    className="w-4 h-4"
                    style={{ color: COLORS.textSecondary }}
                  />
                ) : (
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: COLORS.textSecondary }}
                  />
                )}
              </button>
              {showIcalDropdown && (
                <div
                  className="p-4 pt-3 space-y-3"
                  style={{ borderTop: `1px solid ${COLORS.border}30` }}
                >
                  <p
                    className="text-[11px]"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {currentLanguage === "ko"
                      ? "에어비앤비, 아고다 등 예약을 500stay와 동기화합니다."
                      : "Sync bookings from Airbnb, Agoda, etc."}
                  </p>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko" ? "플랫폼" : "Platform"}
                    </label>
                    <select
                      value={icalPlatform}
                      onChange={(e) => setIcalPlatform(e.target.value)}
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      <option value="">
                        {currentLanguage === "ko" ? "선택 안 함" : "None"}
                      </option>
                      <option value="airbnb">Airbnb</option>
                      <option value="agoda">Agoda</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="other">
                        {currentLanguage === "ko" ? "기타" : "Other"}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "캘린더 이름"
                        : "Calendar name"}
                    </label>
                    <input
                      type="text"
                      value={icalCalendarName}
                      onChange={(e) => setIcalCalendarName(e.target.value)}
                      placeholder={
                        currentLanguage === "ko"
                          ? "예: 에어비앤비 예약"
                          : "e.g. Airbnb"
                      }
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      iCal URL (.ics)
                    </label>
                    <input
                      type="url"
                      value={icalUrl}
                      onChange={(e) => setIcalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 등록 버튼 */}
            <button
              type="submit"
              disabled={
                loading ||
                imagePreviews.length === 0 ||
                !weeklyRent ||
                weeklyRent.replace(/\D/g, "") === "" ||
                !propertyType ||
                bedrooms === 0 ||
                bathrooms === 0
              }
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {currentLanguage === "ko"
                      ? "등록 중..."
                      : currentLanguage === "vi"
                        ? "Đang đăng ký..."
                        : "Registering..."}
                  </span>
                </>
              ) : (
                <span>
                  {currentLanguage === "ko"
                    ? "매물 등록하기"
                    : currentLanguage === "vi"
                      ? "Đăng ký bất động sản"
                      : "Register Property"}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 달력 모달 */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeCalendar}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              maxDate={maxRentalDay}
              onCheckInSelect={onCheckInSelect}
              onCheckOutSelect={onCheckOutSelect}
              onCheckInReset={onCheckInReset}
              currentLanguage={currentLanguage}
              onClose={closeCalendar}
              mode={calendarMode}
              bookedRanges={[]}
              isOwnerMode={true}
            />
          </div>
        </div>
      )}

      {/* 등록 성공 모달 (메인 홈 톤과 유사한 코랄/오렌지 스타일) */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => {
            setShowSuccessModal(false);
            router.replace("/profile/my-properties");
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
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
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: COLORS.text }}>
              {currentLanguage === "ko"
                ? "매물 등록 완료!"
                : currentLanguage === "vi"
                  ? "Đăng ký bất động sản thành công!"
                  : currentLanguage === "ja"
                    ? "物件登録完了！"
                    : currentLanguage === "zh"
                      ? "物业注册完成！"
                      : "Property Registered!"}
            </h3>
            <p className="text-sm text-center mb-5" style={{ color: COLORS.textSecondary }}>
              {currentLanguage === "ko"
                ? "내 매물 목록에서 바로 확인할 수 있어요."
                : currentLanguage === "vi"
                  ? "Bạn có thể kiểm tra ngay trong danh sách bất động sản của tôi."
                  : currentLanguage === "ja"
                    ? "マイ物件一覧ですぐ確認できます。"
                    : currentLanguage === "zh"
                      ? "可在我的房源列表中立即查看。"
                      : "You can check it in My Properties now."}
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
              {currentLanguage === "ko"
                ? "내 매물 보러가기"
                : currentLanguage === "vi"
                  ? "Xem bất động sản của tôi"
                  : currentLanguage === "ja"
                    ? "マイ物件を見る"
                    : currentLanguage === "zh"
                      ? "查看我的房源"
                      : "Go to My Properties"}
            </button>
          </motion.div>
        </div>
      )}

      {/* 주소 정밀 확인 모달 */}
      <AddressVerificationModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onConfirm={handleAddressConfirm}
        currentLanguage={currentLanguage}
        initialAddress={address}
      />

    </div>
  );
}
