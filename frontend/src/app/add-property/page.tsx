"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { addProperty } from "@/lib/api/properties";
import { LISTING_MAX_SUPPLY_DAYS } from "@/lib/constants/listingCalendar";
import { getUIText } from "@/utils/i18n";
import {
  Camera,
  MapPin,
  Loader2,
  X,
  Maximize2,
  ArrowLeft,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Home,
  Search,
  Building,
  User,
  Plus,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Map,
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import {
  FACILITY_OPTIONS,
  FACILITY_CATEGORIES,
  FULL_OPTION_KITCHEN_IDS,
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
} from "@/lib/constants/facilities";
import {
  searchRegions,
  VIETNAM_CITIES,
  ALL_REGIONS,
} from "@/lib/data/vietnam-regions";
import { usePropertyImageManager } from "./hooks/usePropertyImageManager";
import { useAddPropertyAccess } from "./hooks/useAddPropertyAccess";
import { useAddPropertyFormRules } from "./hooks/useAddPropertyFormRules";
import { useAddPropertyCalendarIcal } from "./hooks/useAddPropertyCalendarIcal";
import {
  buildUnitNumber,
  ensureAddPropertyKycReady,
  getAddPropertyErrorMessage,
  uploadPropertyImages,
  validateAddPropertyInput,
} from "./utils/addPropertySubmit";

// 베트남 스타일 컬러: Coral Red + Golden Orange + Sunshine Yellow
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

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
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
    setShowIcalDropdown,
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
    setShowPhotoLibrary,
    handlePhotoLibrarySelect,
    togglePhotoSelection,
    handleConfirmPhotoSelection,
    handleViewFullScreen,
    handleBackToLibrary,
    handleCameraCapture,
    handleAddImageClick,
    handleSelectFromLibrary,
    handleTakePhoto,
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

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMessage = validateAddPropertyInput({
      address,
      coordinates,
      selectedCityId,
      selectedDistrictId,
      imagePreviewsLength: imagePreviews.length,
      weeklyRent,
      propertyType,
      title,
      hasUser: Boolean(user),
      checkInDate,
      checkOutDate,
      todayOnly,
      maxRentalDay,
      currentLanguage,
    });
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        alert(
          currentLanguage === "ko"
            ? "로그인이 필요합니다."
            : currentLanguage === "vi"
              ? "Cần đăng nhập."
              : "Please login.",
        );
        return;
      }

      const kycState = await ensureAddPropertyKycReady(user.uid, currentLanguage);
      if (!kycState.ok) {
        alert(kycState.message);
        router.push("/kyc");
        return;
      }

      const uploadResult = await uploadPropertyImages(images, currentLanguage);
      if (!uploadResult.ok) {
        alert(uploadResult.message);
        return;
      }

      await addProperty({
        title: title.trim(),
        original_description: propertyDescription, // 매물 설명 (빈 문자열 허용)
        translated_description: "", // 나중에 번역 서비스로 채움
        price: parseInt(weeklyRent.replace(/\D/g, "")),
        priceUnit: "vnd",
        area: 0, // 나중에 추가 가능
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        coordinates: coordinates, // 좌표는 필수 (위에서 검증됨)
        address: address, // 동호수 제외
        images: uploadResult.imageUrls,
        amenities: selectedFacilities,
        unitNumber: buildUnitNumber(buildingNumber, roomNumber), // 동호수 (예약 완료 후에만 표시, 비공개)
        propertyType,
        cleaningPerWeek: selectedFacilities.includes("cleaning")
          ? cleaningPerWeek
          : 0,
        petAllowed,
        ...(petAllowed && { maxPets }),
        ...(petAllowed &&
          petFeeAmount.trim() && {
            petFee: parseInt(petFeeAmount.replace(/\D/g, ""), 10) || undefined,
          }),
        ownerId: user.uid, // 임대인 사용자 ID 저장
        checkInDate: checkInDate || undefined,
        checkOutDate: checkOutDate || undefined,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        maxAdults: maxAdults,
        maxChildren: maxChildren,
        status: "active",
        ...(icalPlatform && { icalPlatform }),
        ...(icalCalendarName.trim() && {
          icalCalendarName: icalCalendarName.trim(),
        }),
        ...(icalUrl.trim() && { icalUrl: icalUrl.trim() }),
        // 도시와 구 정보 저장
        ...(selectedCityId && { cityId: selectedCityId }),
        ...(selectedDistrictId && { districtId: selectedDistrictId }),
      });

      setShowSuccessModal(true);
    } catch (error: unknown) {
      // 중복 등록 등 예상된 비즈니스 로직 에러는 콘솔 에러를 남기지 않음 (개발 오버레이 방지)
      const knownErrors = ["OverlapDetected", "AlreadyBooked"];
      const message = error instanceof Error ? error.message : undefined;
      if (!message || !knownErrors.includes(message)) {
        console.error("매물 등록 중 예기치 못한 패:", error);
      }
      alert(getAddPropertyErrorMessage(currentLanguage, message));
    } finally {
      setLoading(false);
    }
  };

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
            {/* 이미지 업로드 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-bold"
                  style={{ color: COLORS.text }}
                >
                  {currentLanguage === "ko"
                    ? "사진 등록"
                    : currentLanguage === "vi"
                      ? "Đăng ảnh"
                    : currentLanguage === "ja"
                      ? "写真登録"
                    : currentLanguage === "zh"
                      ? "照片上传"
                      : "Upload Photos"}
                  <span style={{ color: COLORS.error }} className="ml-1">
                    *
                  </span>
                </h2>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>
                  {images.length}/5
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="property-register-icon-btn property-register-icon-btn--photo absolute top-1 right-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <>
                    <button
                      type="button"
                      onClick={handleAddImageClick}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "추가"
                          : currentLanguage === "vi"
                            ? "Thêm"
                            : "Add"}
                      </span>
                    </button>

                    {/* 숨겨진 input들 */}
                    <input
                      ref={photoLibraryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoLibrarySelect}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* 이미지 소스 선택 메뉴 */}
              {showImageSourceMenu && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
                  onClick={() => setShowImageSourceMenu(false)}
                >
                  <div
                    className="w-full bg-white rounded-t-2xl p-6 max-w-[430px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      {currentLanguage === "ko"
                        ? "사진 추가 방법 선택"
                        : currentLanguage === "vi"
                          ? "Chọn cách thêm ảnh"
                        : currentLanguage === "ja"
                          ? "写真追加方法の選択"
                        : currentLanguage === "zh"
                          ? "选择照片添加方式"
                        : "Select Photo Source"}
                    </h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleSelectFromLibrary}
                        className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                      >
                        <Camera className="w-5 h-5" />
                        <span>
                          {currentLanguage === "ko"
                            ? "사진첩에서 선택"
                            : currentLanguage === "vi"
                              ? "Chọn từ thư viện ảnh"
                            : currentLanguage === "ja"
                              ? "写真ライブラリから選択"
                            : currentLanguage === "zh"
                              ? "从照片库选择"
                            : "Select from Photo Library"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleTakePhoto}
                        className="w-full py-4 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                      >
                        <Camera className="w-5 h-5" />
                        <span>
                          {currentLanguage === "ko"
                            ? "카메라로 촬영"
                            : currentLanguage === "vi"
                              ? "Chụp ảnh"
                            : currentLanguage === "ja"
                              ? "カメラで撮影"
                            : currentLanguage === "zh"
                              ? "用相机拍摄"
                            : "Take Photo"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageSourceMenu(false)}
                        className="w-full py-3 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                      >
                        {currentLanguage === "ko"
                          ? "취소"
                          : currentLanguage === "vi"
                            ? "Hủy"
                          : currentLanguage === "ja"
                            ? "キャンセル"
                          : currentLanguage === "zh"
                            ? "取消"
                          : "Cancel"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 사진첩 모달 (카톡 스타일) */}
              {showPhotoLibrary && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoLibrary(false);
                        setPhotoLibraryFiles([]);
                        photoLibraryPreviews.forEach((url) =>
                          URL.revokeObjectURL(url),
                        );
                        setPhotoLibraryPreviews([]);
                        setSelectedLibraryIndices(new Set());
                        setFullScreenImageIndex(null);
                      }}
                      className="text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentLanguage === "ko"
                        ? "사진 선택"
                        : currentLanguage === "vi"
                          ? "Chọn ảnh"
                        : currentLanguage === "ja"
                          ? "写真選択"
                        : currentLanguage === "zh"
                          ? "选择照片"
                        : "Select Photos"}
                    </h2>
                    <div className="w-6" /> {/* 공간 맞춤 */}
                  </div>

                  {/* 사진 그리드 */}
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-4 gap-1">
                      {photoLibraryPreviews.map((preview, index) => {
                        const isSelected = selectedLibraryIndices.has(index);
                        return (
                          <div
                            key={index}
                            className="relative aspect-square"
                            onClick={() => togglePhotoSelection(index)}
                          >
                            <img
                              src={preview}
                              alt={`Photo ${index + 1}`}
                              className={`w-full h-full object-cover rounded ${
                                isSelected ? "opacity-50" : ""
                              }`}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 rounded">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            {/* 전체화면 보기 버튼 (우측 하단) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFullScreen(index);
                              }}
                              className="property-register-icon-btn property-register-icon-btn--library absolute bottom-1 right-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 하단 버튼 */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleConfirmPhotoSelection}
                      disabled={selectedLibraryIndices.size === 0}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentLanguage === "ko"
                        ? `선택한 ${selectedLibraryIndices.size}장 추가`
                        : currentLanguage === "vi"
                          ? `Thêm ${selectedLibraryIndices.size} ảnh đã chọn`
                        : currentLanguage === "ja"
                          ? `選択した ${selectedLibraryIndices.size}枚を追加`
                        : currentLanguage === "zh"
                          ? `添加选中的 ${selectedLibraryIndices.size}张`
                        : `Add ${selectedLibraryIndices.size} selected`}
                    </button>
                  </div>
                </div>
              )}

              {/* 전체화면 이미지 보기 */}
              {fullScreenImageIndex !== null && (
                <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
                  <img
                    src={photoLibraryPreviews[fullScreenImageIndex]}
                    alt={`Full screen ${fullScreenImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* 우측 하단: 사진첩으로 돌아가기 버튼 */}
                  <button
                    type="button"
                    onClick={handleBackToLibrary}
                    className="absolute bottom-6 right-6 bg-white/90 text-gray-900 rounded-full p-4 hover:bg-white transition-colors shadow-lg flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">
                      {currentLanguage === "ko"
                        ? "사진첩"
                        : currentLanguage === "vi"
                          ? "Thư viện ảnh"
                        : currentLanguage === "ja"
                          ? "写真ライブラリ"
                        : currentLanguage === "zh"
                          ? "照片库"
                        : "Library"}
                    </span>
                  </button>
                  {/* 닫기 버튼 (좌측 상단) */}
                  <button
                    type="button"
                    onClick={handleBackToLibrary}
                    className="property-register-icon-btn property-register-icon-btn--fullscreen absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full hover:bg-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}
            </section>

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

            {/* 주소 */}
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
                  ? "주소"
                  : currentLanguage === "vi"
                    ? "Địa chỉ"
                  : currentLanguage === "ja"
                    ? "住所"
                  : currentLanguage === "zh"
                    ? "地址"
                    : "Address"}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              
              {/* 주소 찾기 버튼 */}
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    {currentLanguage === "ko" ? "주소 찾기" : 
                     currentLanguage === "vi" ? "Tìm địa chỉ" :
                     currentLanguage === "ja" ? "住所検索" :
                     currentLanguage === "zh" ? "查找地址" :
                     "Find Address"}
                  </p>
                </div>
                {(!address || !coordinates) && (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.98]"
                    style={{
                      backgroundColor: COLORS.primary,
                      color: COLORS.white,
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>
                      {currentLanguage === "ko"
                        ? "주소 찾기"
                        : currentLanguage === "vi"
                          ? "Tìm địa chỉ"
                          : "Find Address"}
                    </span>
                  </button>
                )}
                {address && coordinates && (
                  <div
                    className="p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: `${COLORS.success}15`,
                      border: `1px solid ${COLORS.success}30`,
                    }}
                    onClick={() => setShowAddressModal(true)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${COLORS.success}20` }}
                      >
                        <Check
                          className="w-4 h-4"
                          style={{ color: COLORS.success }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: COLORS.success }}
                        >
                          {currentLanguage === "ko"
                            ? "확정된 주소 (클릭하여 수정)"
                            : currentLanguage === "vi"
                              ? "Địa chỉ đã xác nhận"
                              : "Confirmed Address"}
                        </span>
                        <p
                          className="text-sm font-medium mt-0.5"
                          style={{ color: COLORS.text }}
                        >
                          {address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddress("");
                          setCoordinates(null);
                          setSelectedCityId("");
                          setSelectedDistrictId("");
                        }}
                        className="property-register-icon-btn property-register-icon-btn--photo rounded-full transition-colors flex-shrink-0"
                        style={{ backgroundColor: `${COLORS.success}20` }}
                      >
                        <X
                          className="w-3.5 h-3.5"
                          style={{ color: COLORS.textSecondary }}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 도시·구 */}
              <div className="pt-4 pb-2"
                style={{
                  borderTop: `1.5px dashed ${COLORS.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    {currentLanguage === "ko" ? "도시·구" : 
                     currentLanguage === "vi" ? "Thành phố·Quận" :
                     currentLanguage === "ja" ? "都市・区" :
                     currentLanguage === "zh" ? "城市・区" :
                     "City·District"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "도시"
                        : currentLanguage === "vi"
                          ? "Thành phố"
                          : "City"}
                      <span style={{ color: COLORS.error }} className="ml-1">
                        *
                      </span>
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => {
                        setSelectedCityId(e.target.value);
                        setSelectedDistrictId("");
                      }}
                      disabled={!address || !coordinates}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      <option value="">
                        {currentLanguage === "ko"
                          ? "선택"
                          : currentLanguage === "vi"
                            ? "Chọn"
                            : currentLanguage === "ja"
                              ? "選択"
                              : currentLanguage === "zh"
                                ? "选择"
                                : "Select"}
                      </option>
                      {VIETNAM_CITIES.map((c) => {
                        const langMap: Record<string, string> = {
                          ko: c.nameKo,
                          vi: c.nameVi,
                          en: c.name,
                          ja: c.nameJa ?? c.name,
                          zh: c.nameZh ?? c.name,
                        };
                        return (
                          <option key={c.id} value={c.id}>
                            {langMap[currentLanguage] ?? c.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "구"
                        : currentLanguage === "vi"
                          ? "Quận"
                          : "District"}
                      <span style={{ color: COLORS.error }} className="ml-1">
                        *
                      </span>
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      disabled={!address || !coordinates || !selectedCityId}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      <option value="">
                        {currentLanguage === "ko"
                          ? "선택"
                          : currentLanguage === "vi"
                            ? "Chọn"
                          : currentLanguage === "ja"
                            ? "選択"
                          : currentLanguage === "zh"
                            ? "选择"
                            : "Select"}
                      </option>
                      {getDistrictsByCityId(selectedCityId).map((d) => {
                        const langMap: Record<string, string> = {
                          ko: d.nameKo,
                          vi: d.nameVi,
                          en: d.name,
                          ja: d.nameJa ?? d.name,
                          zh: d.nameZh ?? d.name,
                        };
                        return (
                          <option key={d.id} value={d.id}>
                            {langMap[currentLanguage] ?? d.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* 동호수 입력 */}
              <div className="pt-4 pb-2"
                style={{
                  borderTop: `1.5px dashed ${COLORS.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    {currentLanguage === "ko" ? "동호수" : 
                     currentLanguage === "vi" ? "Số phòng" :
                     currentLanguage === "ja" ? "部屋番号" :
                     currentLanguage === "zh" ? "房间号" :
                     "Unit Number"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-1.5"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {currentLanguage === "ko"
                        ? "동"
                        : currentLanguage === "vi"
                          ? "Tòa"
                          : "Building"}
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder={
                        currentLanguage === "ko" ? "예: A" : "e.g., A"
                      }
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
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
                      {currentLanguage === "ko"
                        ? "호실"
                        : currentLanguage === "vi"
                          ? "Phòng"
                          : "Room"}
                      <span style={{ color: COLORS.error }} className="ml-1">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder={
                        currentLanguage === "ko" ? "예: 101" : "e.g., 101"
                      }
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                </div>
                <p
                  className="text-[10px] mt-2 flex items-start gap-1"
                  style={{ color: COLORS.textSecondary }}
                >
                  <span style={{ color: COLORS.primary }}>i</span>
                  <span>
                    {currentLanguage === "ko"
                      ? "동호수는 예약 완료 후 임차인에게만 표시됩니다."
                      : currentLanguage === "vi"
                        ? "Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ."
                        : "Unit number shown to tenants after booking."}
                  </span>
                </p>
              </div>
            </section>

            {/* 임대 희망 날짜 */}
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
                  ? "임대 희망 날짜"
                  : currentLanguage === "vi"
                    ? "Ngày cho thuê mong muốn"
                  : currentLanguage === "ja"
                    ? "賃貸希望日"
                  : currentLanguage === "zh"
                    ? "租赁希望日期"
                    : "Desired Rental Dates"}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {/* 체크인 날짜 */}
                <button
                  type="button"
                  onClick={openCheckInCalendar}
                  className="flex items-center px-3 py-2 rounded-md transition-colors"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "시작일"
                          : currentLanguage === "vi"
                            ? "Ngày bắt đầu"
                            : "Start Date"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {checkInDate
                          ? (() => {
                              try {
                                let date: Date | null = null;
                                if (checkInDate instanceof Date) {
                                  date = checkInDate;
                                } else if (typeof checkInDate === "string") {
                                  date = new Date(checkInDate);
                                }
                                if (!date || isNaN(date.getTime())) {
                                  return currentLanguage === "ko"
                                    ? "날짜 선택"
                                    : currentLanguage === "vi"
                                      ? "Chọn ngày"
                                      : "Select date";
                                }
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                if (isNaN(month) || isNaN(day)) {
                                  return currentLanguage === "ko"
                                    ? "날짜 선택"
                                    : currentLanguage === "vi"
                                      ? "Chọn ngày"
                                      : "Select date";
                                }
                                return date.toLocaleDateString(
                                  currentLanguage === "ko"
                                    ? "ko-KR"
                                    : currentLanguage === "vi"
                                      ? "vi-VN"
                                      : "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                              } catch {
                                return currentLanguage === "ko"
                                  ? "날짜 선택"
                                  : currentLanguage === "vi"
                                    ? "Chọn ngày"
                                    : "Select date";
                              }
                            })()
                          : currentLanguage === "ko"
                            ? "날짜 선택"
                            : currentLanguage === "vi"
                              ? "Chọn ngày"
                              : "Select date"}
                      </div>
                    </div>
                  </div>
                </button>

                {/* 체크아웃 날짜 */}
                <button
                  type="button"
                  onClick={openCheckOutCalendar}
                  className="flex items-center px-3 py-2 rounded-md transition-colors"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "종료일"
                          : currentLanguage === "vi"
                            ? "Ngày kết thúc"
                            : "End Date"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {checkOutDate
                          ? (() => {
                              try {
                                let date: Date | null = null;
                                if (checkOutDate instanceof Date) {
                                  date = checkOutDate;
                                } else if (typeof checkOutDate === "string") {
                                  date = new Date(checkOutDate);
                                }
                                if (!date || isNaN(date.getTime())) {
                                  return currentLanguage === "ko"
                                    ? "날짜 선택"
                                    : currentLanguage === "vi"
                                      ? "Chọn ngày"
                                      : "Select date";
                                }
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                if (isNaN(month) || isNaN(day)) {
                                  return currentLanguage === "ko"
                                    ? "날짜 선택"
                                    : currentLanguage === "vi"
                                      ? "Chọn ngày"
                                      : "Select date";
                                }
                                return date.toLocaleDateString(
                                  currentLanguage === "ko"
                                    ? "ko-KR"
                                    : currentLanguage === "vi"
                                      ? "vi-VN"
                                      : "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                              } catch {
                                return currentLanguage === "ko"
                                  ? "날짜 선택"
                                  : currentLanguage === "vi"
                                    ? "Chọn ngày"
                                    : "Select date";
                              }
                            })()
                          : currentLanguage === "ko"
                            ? "날짜 선택"
                            : currentLanguage === "vi"
                              ? "Chọn ngày"
                              : "Select date"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* 1주일 임대료 */}
            <section
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-1"
                style={{ color: COLORS.text }}
              >
                {currentLanguage === "ko"
                  ? "1주일 임대료"
                  : currentLanguage === "vi"
                    ? "Giá thuê 1 tuần"
                  : currentLanguage === "ja"
                    ? "1週間賃貸料"
                  : currentLanguage === "zh"
                    ? "1周租金"
                    : "Weekly Rent"}
                <span style={{ color: COLORS.error }} className="ml-1">
                  *
                </span>
              </h2>
              <p
                className="text-[11px] mb-3"
                style={{ color: COLORS.textSecondary }}
              >
                {currentLanguage === "ko"
                  ? "공과금/관리비 포함"
                  : currentLanguage === "vi"
                    ? "Bao gồm phí dịch vụ/quản lý"
                    : "Utilities/Management fees included"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={
                    weeklyRent
                      ? parseInt(
                          weeklyRent.replace(/\D/g, "") || "0",
                          10,
                        ).toLocaleString()
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setWeeklyRent(value);
                  }}
                  placeholder="0"
                  className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                  }}
                  required
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.textSecondary }}
                >
                  VND
                </span>
              </div>
            </section>

            {/* 숙소시설 및 정책 — 편지지: 상단 제목, 하단 내용, 왼쪽 정렬 */}
            <section
              className="p-5 rounded-2xl text-left"
              style={{
                backgroundColor: `${COLORS.border}20`,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <h2
                className="text-sm font-bold mb-4 text-left"
                style={{ color: COLORS.text }}
              >
                {currentLanguage === "ko"
                  ? "숙소시설 및 정책"
                  : currentLanguage === "vi"
                    ? "Tiện ích và chính sách"
                  : currentLanguage === "ja"
                    ? "施設とポリシー"
                  : currentLanguage === "zh"
                    ? "设施与政策"
                    : "Facilities & Policy"}
              </h2>
              <div className="space-y-6 text-left">
                {FACILITY_CATEGORIES.map((cat) => {
                  const isBadgeCategory = ["furniture", "electronics", "kitchen"].includes(cat.id);
                  const fullFurniture =
                    cat.id === "furniture" &&
                    FULL_FURNITURE_IDS.every((id) =>
                      selectedFacilities.includes(id),
                    );
                  const fullElectronics =
                    cat.id === "electronics" &&
                    FULL_ELECTRONICS_IDS.every((id) =>
                      selectedFacilities.includes(id),
                    );
                  const fullOptionKitchen =
                    cat.id === "kitchen" &&
                    FULL_OPTION_KITCHEN_IDS.every((id) =>
                      selectedFacilities.includes(id),
                    );
                  return (
                    <div
                      key={cat.id}
                      className="pt-4 pb-2 text-left"
                      style={{
                        borderTop: `1.5px dashed ${COLORS.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2 justify-start text-left">
                        <p className="text-xs font-bold text-gray-500 text-left">{(cat.label as any)[currentLanguage]}</p>
                        {/* 뱃지 획득 안내 문구 추가 */}
                        {isBadgeCategory && (
                          <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-orange-500" />
                            <p className="text-[10px] text-orange-600 font-medium">모든 선택 시 뱃지 획득</p>
                          </div>
                        )}
                      </div>
                      
                      {/* 시설 아이콘 그리드 — 왼쪽 정렬 */}
                      <div className="grid grid-cols-4 gap-3 justify-items-start">
                        {FACILITY_OPTIONS.filter(o => o.category === cat.id).map(opt => {
                          const Icon = opt.icon;
                          const isSelected = selectedFacilities.includes(opt.id);
                          const label = (opt.label as any)[currentLanguage] || opt.label.en;
                          return (
                            <div key={opt.id} className="flex flex-col items-center gap-1.5 text-left">
                              <button
                                type="button"
                                onClick={() => toggleFacility(opt.id)}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all"
                                style={{
                                  backgroundColor: isSelected ? COLORS.primary : COLORS.white,
                                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                                }}
                              >
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                              </button>
                              <span className="text-[10px] text-gray-600 font-medium leading-tight text-center">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* pet/cleaning 상세 입력은 그리드 셀 밖으로 빼서(레이아웃 겹침 방지) */}
                      {cat.id === "policy" && selectedFacilities.includes("pet") && (
                        <div className="mt-3">
                          <div className="grid grid-cols-2 gap-3 items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium" style={{ color: COLORS.textSecondary }}>
                                {currentLanguage === "ko"
                                  ? "최대 마리수"
                                  : currentLanguage === "vi"
                                    ? "Số con tối đa"
                                    : "Max pets"}
                              </span>
                              <select
                                value={maxPets}
                                onChange={(e) => setMaxPets(Number(e.target.value))}
                                className="w-[72px] px-2 py-2 text-xs rounded-lg focus:outline-none"
                                style={{
                                  backgroundColor: COLORS.white,
                                  border: `1px solid ${COLORS.border}`,
                                  color: COLORS.text,
                                }}
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium" style={{ color: COLORS.textSecondary }}>
                                {currentLanguage === "ko"
                                  ? "펫 수수료 (마리당)"
                                  : currentLanguage === "vi"
                                    ? "Phí thú cưng (mỗi con)"
                                    : "Pet fee (per pet)"}
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={
                                    petFeeAmount
                                      ? parseInt(petFeeAmount.replace(/\D/g, ""), 10).toLocaleString()
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setPetFeeAmount(e.target.value.replace(/\D/g, ""))
                                  }
                                  placeholder="0"
                                  className="w-[88px] px-2 py-2 text-xs rounded-lg focus:outline-none"
                                  style={{
                                    backgroundColor: COLORS.white,
                                    border: `1px solid ${COLORS.border}`,
                                    color: COLORS.text,
                                  }}
                                />
                                <span className="text-xs font-medium shrink-0" style={{ color: COLORS.textSecondary }}>
                                  VND
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {cat.id === "policy" && selectedFacilities.includes("cleaning") && (
                        <div className="mt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium" style={{ color: COLORS.textSecondary }}>
                              {currentLanguage === "ko"
                                ? "주당 청소 횟수"
                                : currentLanguage === "vi"
                                  ? "Số lần dọn dẹp/tuần"
                                  : "Cleaning per week"}
                            </span>
                            <select
                              value={cleaningPerWeek}
                              onChange={(e) => setCleaningPerWeek(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none"
                              style={{
                                backgroundColor: COLORS.white,
                                border: `1px solid ${COLORS.border}`,
                                color: COLORS.text,
                              }}
                            >
                              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                  {currentLanguage === "ko"
                                    ? "회"
                                    : currentLanguage === "vi"
                                      ? " lần"
                                      : "x"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {fullFurniture && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko"
                            ? "풀 가구"
                            : currentLanguage === "vi"
                              ? "Nội thất đầy đủ"
                              : "Full Furniture"}
                        </div>
                      )}
                      {fullElectronics && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko"
                            ? "풀 가전"
                            : currentLanguage === "vi"
                              ? "Điện tử đầy đủ"
                              : "Full Electronics"}
                        </div>
                      )}
                      {fullOptionKitchen && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko"
                            ? "풀옵션 주방"
                            : currentLanguage === "vi"
                              ? "Bếp đầy đủ"
                              : "Full Kitchen"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

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

      {/* 가이드라인 팝업 */}
      {showGuidelinePopup && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={handleGuidelinePopupClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "📸 추천 사진 가이드라인"
                : currentLanguage === "vi"
                  ? "📸 Hướng dẫn ảnh đề xuất"
                : currentLanguage === "ja"
                  ? "📸 おすすめ写真ガイドライン"
                : currentLanguage === "zh"
                  ? "📸 推荐照片指南"
                : "📸 Recommended Photo Guidelines"}
            </h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-2xl">🛏️</span>
                <span>
                  {currentLanguage === "ko"
                    ? "침실"
                    : currentLanguage === "vi"
                      ? "Phòng ngủ"
                    : currentLanguage === "ja"
                      ? "寝室"
                    : currentLanguage === "zh"
                      ? "卧室"
                    : "Bedroom"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-2xl">🍳</span>
                <span>
                  {currentLanguage === "ko"
                    ? "주방"
                    : currentLanguage === "vi"
                      ? "Bếp"
                    : currentLanguage === "ja"
                      ? "キッチン"
                    : currentLanguage === "zh"
                      ? "厨房"
                    : "Kitchen"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-2xl">🛋️</span>
                <span>
                  {currentLanguage === "ko"
                    ? "거실"
                    : currentLanguage === "vi"
                      ? "Phòng khách"
                    : currentLanguage === "ja"
                      ? "リビングルーム"
                    : currentLanguage === "zh"
                      ? "客厅"
                    : "Living Room"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-2xl">🚿</span>
                <span>
                  {currentLanguage === "ko"
                    ? "화장실"
                    : currentLanguage === "vi"
                      ? "Phòng tắm"
                    : currentLanguage === "ja"
                      ? "バスルーム"
                    : currentLanguage === "zh"
                      ? "浴室"
                    : "Bathroom"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-2xl">🪟</span>
                <span>
                  {currentLanguage === "ko"
                    ? "창문뷰"
                    : currentLanguage === "vi"
                      ? "Cửa sổ"
                    : currentLanguage === "ja"
                      ? "窓の景色"
                    : currentLanguage === "zh"
                      ? "窗户景观"
                    : "Window View"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              {currentLanguage === "ko"
                ? "아무 곳이나 터치하여 카메라를 시작하세요"
                : currentLanguage === "vi"
                  ? "Chạm vào bất kỳ đâu để bắt đầu camera"
                : currentLanguage === "ja"
                  ? "どこかをタップしてカメラを開始"
                : currentLanguage === "zh"
                  ? "点击任意位置开始相机"
                : "Tap anywhere to start camera"}
            </p>
            <button
              onClick={handleGuidelinePopupClick}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              {currentLanguage === "ko"
                ? "동의"
                : currentLanguage === "vi"
                  ? "Đồng ý"
                : currentLanguage === "ja"
                  ? "同意"
                : currentLanguage === "zh"
                  ? "同意"
                : "Agree"}
            </button>
          </motion.div>
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
