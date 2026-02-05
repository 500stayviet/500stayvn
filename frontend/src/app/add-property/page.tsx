"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentUserData } from "@/lib/api/auth";
import { addProperty, getPropertyCountByOwner } from "@/lib/api/properties";
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
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import { uploadToS3 } from "@/lib/s3-client";
import { FACILITY_OPTIONS, FACILITY_CATEGORIES, FULL_OPTION_KITCHEN_IDS, FULL_FURNITURE_IDS, FULL_ELECTRONICS_IDS } from "@/lib/constants/facilities";
import {
  getDistrictIdForCoord,
  getDistrictsByCityId,
  searchRegions,
  VIETNAM_CITIES,
  ALL_REGIONS,
} from "@/lib/data/vietnam-regions";

// 아기자기한 파스텔 컬러 상수
const COLORS = {
  primary: "#FF6B9D",      // Soft Pink - 메인 컬러
  secondary: "#C44DFF",    // Lavender Purple - 보조 컬러  
  accent: "#4ECDC4",       // Mint Teal - 강조 컬러
  peach: "#FFB4A2",        // Soft Peach - 따뜻한 포인트
  lemon: "#FFE66D",        // Lemon Yellow - 밝은 포인트
  success: "#7ED321",      // Fresh Green - 성공/완료
  white: "#FFFFFF",
  cream: "#FFF5F7",        // 핑크빛 크림색 배경
  lavenderBg: "#F8F4FF",   // 연한 라벤더 배경
  mintBg: "#F0FFFC",       // 연한 민트 배경
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#E8E8E8",
  gray300: "#D4D4D4",
  gray400: "#A3A3A3",
  gray500: "#737373",
  gray600: "#525252",
  gray700: "#404040",
  gray800: "#262626",
  gray900: "#171717",
};

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // 폼 상태
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [apartmentName, setApartmentName] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
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
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");

  // 매물종류에 따라 방/화장실 제한 적용
  useEffect(() => {
    if (!propertyType) {
      setBedrooms(0);
      setBathrooms(0);
      return;
    }
    if (propertyType === "studio" || propertyType === "one_room") {
      setBedrooms(1);
      setBathrooms((b) => (b < 1 || b > 2 ? 1 : b));
    } else if (propertyType === "two_room") {
      setBedrooms(2);
      setBathrooms((b) => (b < 1 || b > 3 ? 1 : b));
    } else if (propertyType === "three_plus") {
      setBedrooms((prev) => (prev >= 2 && prev <= 5 ? prev : 2));
      setBathrooms((b) => (b < 1 || b > 6 ? 1 : b));
    } else if (propertyType === "detached") {
      setBedrooms((b) => Math.min(10, Math.max(1, b || 1)));
      setBathrooms((b) => Math.min(10, Math.max(1, b || 1)));
    }
  }, [propertyType]);

  useEffect(() => {
    if (!selectedCityId || !selectedDistrictId) return;
    const districts = getDistrictsByCityId(selectedCityId);
    if (!districts.some((d) => d.id === selectedDistrictId)) {
      setSelectedDistrictId("");
    }
  }, [selectedCityId]);

  // 임대 희망 날짜
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">("checkin");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  // 외부 캘린더(iCal)
  const [icalPlatform, setIcalPlatform] = useState<string>("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);

  // 사진첩 모달 상태
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>([]);
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<Set<number>>(new Set());
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);

  // 이미지 소스 선택 메뉴 상태
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showGuidelinePopup, setShowGuidelinePopup] = useState(false);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 주소 확인 모달
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 접근 권한 확인
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);
        const kycSteps = userData?.kyc_steps || {};
        const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

        if (allStepsCompleted || userData?.is_owner === true) {
          setHasAccess(true);
        } else {
          router.push("/kyc");
        }
      } catch (error) {
        router.push("/kyc");
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, authLoading, router]);

  // 주소 확인 모달에서 주소 확정 시
  const handleAddressConfirm = (data: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setAddress(data.address);
    setCoordinates({ lat: data.lat, lng: data.lng });
    const districtId = getDistrictIdForCoord(data.lat, data.lng);
    if (districtId) {
      const district = ALL_REGIONS.find((r) => r.id === districtId);
      if (district?.parentCity) {
        setSelectedDistrictId(districtId);
        setSelectedCityId(district.parentCity);
        return;
      }
    }
    const matches = searchRegions(data.address);
    const districtMatch = matches.find((r) => r.type === "district");
    const cityMatch = matches.find((r) => r.type === "city");
    if (districtMatch) {
      setSelectedDistrictId(districtMatch.id);
      setSelectedCityId(districtMatch.parentCity ?? "");
    } else if (cityMatch) {
      setSelectedCityId(cityMatch.id);
      setSelectedDistrictId("");
    } else {
      setSelectedCityId("");
      setSelectedDistrictId("");
    }
  };

  // 사진첩 열기 핸들러
  const handleOpenPhotoLibrary = () => {
    photoLibraryInputRef.current?.click();
  };

  // 사진첩에서 파일 선택 시
  const handlePhotoLibrarySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotoLibraryFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoLibraryPreviews(previews);
    setSelectedLibraryIndices(new Set());
    setShowPhotoLibrary(true);
    e.target.value = "";
  };

  // 사진첩에서 사진 선택/해제
  const togglePhotoSelection = (index: number) => {
    const maxSelectable = 5 - images.length;
    if (maxSelectable <= 0) return;

    setSelectedLibraryIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (newSet.size < maxSelectable) {
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  // 선택한 사진들을 추가
  const handleConfirmPhotoSelection = () => {
    const selectedFiles = Array.from(selectedLibraryIndices)
      .sort((a, b) => a - b)
      .map((index) => photoLibraryFiles[index]);

    if (selectedFiles.length === 0) return;

    const newImages = [...images, ...selectedFiles];
    setImages(newImages);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    setShowPhotoLibrary(false);
    setPhotoLibraryFiles([]);
    photoLibraryPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoLibraryPreviews([]);
    setSelectedLibraryIndices(new Set());
    setFullScreenImageIndex(null);
  };

  // 전체화면 이미지 보기
  const handleViewFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
  };

  // 전체화면에서 사진첩으로 돌아가기
  const handleBackToLibrary = () => {
    setFullScreenImageIndex(null);
  };

  // 카메라로 촬영 핸들러
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots === 0) return;

    const file = files[0];
    const newImages = [...images, file];
    setImages(newImages);

    const preview = URL.createObjectURL(file);
    setImagePreviews([...imagePreviews, preview]);
    e.target.value = "";
  };

  const handleAddImageClick = () => {
    if (images.length >= 5) return;

    const GUIDELINE_STORAGE_KEY = "property_guideline_last_shown";
    const lastShownTime = localStorage.getItem(GUIDELINE_STORAGE_KEY);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastShownTime) {
      const timeSinceLastShown = now - parseInt(lastShownTime, 10);
      if (timeSinceLastShown < oneHour) {
        setShowImageSourceMenu(true);
        return;
      }
    }

    setShowGuidelinePopup(true);
  };

  const handleSelectFromLibrary = () => {
    setShowImageSourceMenu(false);
    handleOpenPhotoLibrary();
  };

  const handleTakePhoto = () => {
    setShowImageSourceMenu(false);
    cameraInputRef.current?.click();
  };

  const handleGuidelinePopupClick = () => {
    setShowGuidelinePopup(false);
    const GUIDELINE_STORAGE_KEY = "property_guideline_last_shown";
    localStorage.setItem(GUIDELINE_STORAGE_KEY, Date.now().toString());
    setShowImageSourceMenu(true);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 숙소시설 및 정책 선택/해제
  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId],
    );
  };

  const petAllowed = selectedFacilities.includes("pet");

  // 방 개수 옵션
  const bedroomOptions = (() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1];
    if (propertyType === "two_room") return [2];
    if (propertyType === "three_plus") return [2, 3, 4, 5];
    if (propertyType === "detached") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return [];
  })();

  // 화장실 개수 옵션
  const bathroomOptions = (() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1, 2];
    if (propertyType === "two_room") return [1, 2, 3];
    if (propertyType === "three_plus") return [1, 2, 3, 4, 5, 6];
    if (propertyType === "detached") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return [];
  })();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || address.trim() === "") {
      alert(
        currentLanguage === "ko"
          ? "주소를 입력해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng nhập địa chỉ."
            : "Please enter an address.",
      );
      return;
    }

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      alert(
        currentLanguage === "ko"
          ? "주소를 선택하여 좌표를 설정해주세요. 주소 입력 버튼을 클릭하여 주소를 확인해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng chọn địa chỉ để thiết lập tọa độ. Vui lòng nhấp vào nút nhập địa chỉ để xác nhận địa chỉ."
            : "Please select an address to set coordinates. Please click the address input button to verify the address.",
      );
      return;
    }

    if (imagePreviews.length === 0) {
      alert(
        currentLanguage === "ko"
          ? "최소 1장의 사진을 등록해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng đăng ít nhất 1 ảnh."
            : "Please upload at least 1 image.",
      );
      return;
    }

    if (!weeklyRent || weeklyRent.trim() === "") {
      alert(
        currentLanguage === "ko"
          ? "1주일 임대료를 입력해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng nhập giá thuê 1 tuần."
            : "Please enter weekly rent.",
      );
      return;
    }

    const rentValue = parseInt(weeklyRent.replace(/\D/g, ""));
    if (isNaN(rentValue) || rentValue <= 0) {
      alert(
        currentLanguage === "ko"
          ? "유효한 임대료를 입력해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng nhập giá thuê hợp lệ."
            : "Please enter a valid rent amount.",
      );
      return;
    }

    if (!propertyType) {
      alert(
        currentLanguage === "ko"
          ? "매물 종류를 선택해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng chọn loại bất động sản."
            : "Please select property type.",
      );
      return;
    }

    if (!propertyNickname || propertyNickname.trim() === "") {
      alert(
        currentLanguage === "ko"
          ? "매물명을 입력해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng nhập tên bất động sản."
            : "Please enter property name.",
      );
      return;
    }

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

    if (!checkInDate || !checkOutDate) {
      alert(
        currentLanguage === "ko"
          ? "임대 시작일과 종료일을 선택해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng chọn ngày bắt đ��u và kết thúc thuê."
            : "Please select rental start and end dates.",
      );
      return;
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (![7, 14, 21, 28].includes(diffDays)) {
      alert(
        currentLanguage === "ko"
          ? "임대 기간은 7, 14, 21, 28일 단위여야 합니다."
          : currentLanguage === "vi"
            ? "Thời hạn thuê phải theo đơn vị 7, 14, 21, 28 ngày."
            : "Rental period must be in units of 7, 14, 21, 28 days.",
      );
      return;
    }

    setLoading(true);
    try {
      const userData = await getCurrentUserData(user.uid);
      const kycSteps = userData?.kyc_steps || {};
      const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

      if (!allStepsCompleted) {
        alert(
          currentLanguage === "ko"
            ? "매물을 등록하려면 KYC 인증 1~3단계를 모두 완료해야 합니다."
            : currentLanguage === "vi"
              ? "Bạn phải hoàn thành tất cả các bước xác thực KYC (1-3) để đăng bất động sản."
              : "You must complete all KYC verification steps (1-3) to register a property.",
        );
        setLoading(false);
        router.push("/kyc");
        return;
      }

      const propertyCount = await getPropertyCountByOwner(user.uid);
      if (propertyCount >= 5) {
        alert(
          currentLanguage === "ko"
            ? "매물은 인당 최대 5개까지 등록할 수 있습니다."
            : currentLanguage === "vi"
              ? "Bạn chỉ có thể đăng tối đa 5 bất động sản."
              : "You can only register up to 5 properties.",
        );
        setLoading(false);
        return;
      }

      const formatRoomNumber = (room: string) => {
        const num = parseInt(room.replace(/\D/g, ""));
        if (isNaN(num)) return room;
        return num.toString().padStart(4, "0");
      };

      const unitNumber =
        buildingNumber && roomNumber
          ? `${buildingNumber}동 ${formatRoomNumber(roomNumber)}호`
          : buildingNumber
            ? `${buildingNumber}동`
            : roomNumber
              ? `${formatRoomNumber(roomNumber)}호`
              : undefined;

      const publicAddress = `${apartmentName ? `${apartmentName}, ` : ""}${address}`;

      let imageUrls: string[];
      try {
        imageUrls = await Promise.all(
          images.map((image) => uploadToS3(image, "properties")),
        );
      } catch (error) {
        console.error("S3 업로드 실패:", error);
        const errorMessage = error instanceof Error ? error.message : "S3 업로드 실패";
        alert(
          currentLanguage === "ko"
            ? `사진 업로드 실패: ${errorMessage}`
            : currentLanguage === "vi"
              ? `Tải ảnh lên thất bại: ${errorMessage}`
              : `Photo upload failed: ${errorMessage}`,
        );
        setLoading(false);
        return;
      }

      const checkInDateObj = checkInDate || undefined;
      const checkOutDateObj = checkOutDate || undefined;

      await addProperty({
        title: apartmentName || address,
        propertyNickname: propertyNickname.trim(),
        original_description: propertyDescription,
        translated_description: "",
        price: parseInt(weeklyRent.replace(/\D/g, "")),
        priceUnit: "vnd",
        area: 0,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        coordinates: coordinates,
        address: publicAddress,
        images: imageUrls,
        amenities: selectedFacilities,
        unitNumber: unitNumber,
        propertyType,
        cleaningPerWeek: selectedFacilities.includes("cleaning") ? cleaningPerWeek : 0,
        petAllowed,
        ...(petAllowed && { maxPets }),
        ...(petAllowed && petFeeAmount.trim() && { petFee: parseInt(petFeeAmount.replace(/\D/g, ""), 10) || undefined }),
        ownerId: user.uid,
        checkInDate: checkInDateObj,
        checkOutDate: checkOutDateObj,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        maxAdults: maxAdults,
        maxChildren: maxChildren,
        status: "active",
        ...(icalPlatform && { icalPlatform }),
        ...(icalCalendarName.trim() && { icalCalendarName: icalCalendarName.trim() }),
        ...(icalUrl.trim() && { icalUrl: icalUrl.trim() }),
        ...(selectedCityId && { cityId: selectedCityId }),
        ...(selectedDistrictId && { districtId: selectedDistrictId }),
      });

      alert(
        currentLanguage === "ko"
          ? "매물이 성공적으로 등록되었습니다!"
          : currentLanguage === "vi"
            ? "Bất động sản đã được đăng ký thành công!"
            : "Property registered successfully!",
      );
      router.replace("/profile/my-properties");
    } catch (error: any) {
      const knownErrors = ["OverlapDetected", "AlreadyBooked"];
      if (!knownErrors.includes(error.message)) {
        console.error("매물 등록 중 예기치 못한 실패:", error);
      }

      if (error.message === "OverlapDetected" || error.message === "AlreadyBooked") {
        alert(
          currentLanguage === "ko"
            ? "이미 동일한 주소와 날짜에 등록된 매물이 있습니다."
            : "Đã có bất động sản được đăng ký với cùng địa chỉ và ngày.",
        );
      } else {
        alert(
          currentLanguage === "ko"
            ? "매물 등록 중 오류가 발생했습니다."
            : currentLanguage === "vi"
              ? "Đã xảy ra lỗi khi đăng ký bất động sản."
              : "An error occurred while registering the property.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 접근 권한 확인 중
  if (checkingAccess || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
          <span className="text-gray-500 font-sans">
            {currentLanguage === "ko"
              ? "로딩 중..."
              : currentLanguage === "vi"
                ? "Đang tải..."
                : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen flex justify-center font-sans" style={{ backgroundColor: COLORS.cream }}>
      {/* PWA 모바일 컨테이너 */}
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* 상단 바 */}
        <TopBar />

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto pb-40">
          {/* 그라데이션 헤더 */}
          <div 
            className="px-6 pt-8 pb-6 rounded-b-3xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
          >
            <h1 className="text-2xl font-bold text-white">
              {currentLanguage === "ko"
                ? "새 매물 등록"
                : currentLanguage === "vi"
                  ? "Đăng ký bất động sản mới"
                  : "Register New Property"}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {currentLanguage === "ko"
                ? "매물 정보를 입력해주세요"
                : currentLanguage === "vi"
                  ? "Vui lòng nhập thông tin bất động sản"
                  : "Please enter property information"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 space-y-5 pt-5">
            {/* ===== 사진 등록 섹션 ===== */}
            <section 
              className="rounded-3xl p-5 border-2 shadow-sm"
              style={{ backgroundColor: COLORS.lavenderBg, borderColor: `${COLORS.secondary}30` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.secondary }}>
                  <span className="text-lg">📸</span>
                  {currentLanguage === "ko"
                    ? "사진 등록"
                    : currentLanguage === "vi"
                      ? "Đăng ảnh"
                      : "Upload Photos"}
                  <span className="text-red-500 ml-1">*</span>
                </h2>
                <span className="text-sm text-gray-500">
                  ({images.length}/5)
                </span>
              </div>

              {/* 가로형 썸네일 리스트 */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddImageClick}
                    className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[96px]"
                    style={{ 
                      borderColor: images.length < 5 ? COLORS.gray300 : COLORS.gray200,
                    }}
                  >
                    <Plus className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">
                      {currentLanguage === "ko"
                        ? "추가"
                        : currentLanguage === "vi"
                          ? "Thêm"
                          : "Add"}
                    </span>
                  </button>
                )}
              </div>

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
            </section>

            {/* ===== 매물 종류 섹션 ===== */}
            <section 
              className="rounded-3xl p-5 border-2 shadow-sm"
              style={{ backgroundColor: COLORS.mintBg, borderColor: `${COLORS.accent}30` }}
            >
              <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.accent }}>
                <span className="text-lg">🏠</span>
                {currentLanguage === "ko"
                  ? "매물 종류"
                  : currentLanguage === "vi"
                    ? "Loại bất động sản"
                    : "Property Type"}
                <span style={{ color: COLORS.primary }}>*</span>
              </h2>

              {/* 칩 스타일 버튼 - 아기자기한 스타일 */}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "studio", ko: "스튜디오", vi: "Studio", en: "Studio", icon: "🛋️" },
                    { value: "one_room", ko: "원룸", vi: "1 phòng", en: "1 Room", icon: "🚪" },
                    { value: "two_room", ko: "2룸", vi: "2 phòng", en: "2 Rooms", icon: "🏡" },
                    { value: "three_plus", ko: "3+룸", vi: "3+ phòng", en: "3+ Rooms", icon: "🏘️" },
                    { value: "detached", ko: "독채", vi: "Nhà riêng", en: "Detached", icon: "🏰" },
                  ] as const
                ).map(({ value, ko, vi, en, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPropertyType(value)}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all min-h-[44px] border-2"
                    style={{
                      backgroundColor: propertyType === value ? COLORS.accent : COLORS.white,
                      color: propertyType === value ? COLORS.white : COLORS.gray700,
                      borderColor: propertyType === value ? COLORS.accent : COLORS.gray200,
                      boxShadow: propertyType === value ? `0 4px 12px ${COLORS.accent}40` : 'none',
                    }}
                  >
                    <span className="mr-1">{icon}</span>
                    {currentLanguage === "ko" ? ko : currentLanguage === "vi" ? vi : en}
                  </button>
                ))}
              </div>

              {/* 방/화장실/최대인원 */}
              {propertyType && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      disabled={propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room" ? COLORS.gray100 : COLORS.white,
                      }}
                    >
                      {bedroomOptions.map((n) => (
                        <option key={n} value={n}>
                          {n === 5 && (propertyType === "three_plus" || propertyType === "detached") ? "5+" : n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "화장실" : currentLanguage === "vi" ? "Phòng tắm" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                      style={{ 
                        borderColor: COLORS.gray200,
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
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "최대인원" : currentLanguage === "vi" ? "Tối đa" : "Max"}
                    </label>
                    <select
                      value={maxAdults}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxAdults(v);
                        setMaxChildren(0);
                      }}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}{currentLanguage === "ko" ? "명" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* ===== 주소 섹션 ===== */}
            <section 
              className="rounded-3xl p-5 border-2 shadow-sm"
              style={{ backgroundColor: `${COLORS.peach}15`, borderColor: `${COLORS.peach}50` }}
            >
              <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.gray800 }}>
                <span className="text-lg">📍</span>
                {currentLanguage === "ko"
                  ? "주소"
                  : currentLanguage === "vi"
                    ? "Địa chỉ"
                    : "Address"}
                <span style={{ color: COLORS.primary }}>*</span>
              </h2>

              {(!address || !coordinates) && (
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="w-full px-4 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 min-h-[56px] text-white font-semibold border-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.peach} 100%)`,
                    borderColor: 'transparent',
                    boxShadow: `0 4px 14px ${COLORS.primary}30`
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
                  className="p-4 rounded-2xl cursor-pointer transition-colors"
                  style={{ backgroundColor: `${COLORS.success}10`, border: `2px solid ${COLORS.success}30` }}
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${COLORS.success}20` }}>
                      <Check className="w-5 h-5" style={{ color: COLORS.success }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium" style={{ color: COLORS.success }}>
                        {currentLanguage === "ko"
                          ? "확정된 주소 (클릭하여 수정)"
                          : currentLanguage === "vi"
                            ? "Địa chỉ đã xác nhận"
                            : "Confirmed Address"}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{address}</p>
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
                      className="p-2 rounded-full transition-colors flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.success}20` }}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* 도시/구 자동 표시 */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {currentLanguage === "ko" ? "도시" : currentLanguage === "vi" ? "Thành phố" : "City"}
                  </label>
                  <div className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 min-h-[44px] flex items-center">
                    {address && coordinates && selectedCityId
                      ? (() => {
                          const city = VIETNAM_CITIES.find((c) => c.id === selectedCityId);
                          if (!city) return "—";
                          const langMap: Record<string, string> = { ko: city.nameKo, vi: city.nameVi, en: city.name, ja: city.nameJa ?? city.name, zh: city.nameZh ?? city.name };
                          return langMap[currentLanguage] ?? city.name;
                        })()
                      : <span className="text-gray-400">{currentLanguage === "ko" ? "자동 입력" : "Auto"}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {currentLanguage === "ko" ? "구" : currentLanguage === "vi" ? "Quận" : "District"}
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    disabled={!address || !coordinates}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                    style={{ backgroundColor: !address || !coordinates ? COLORS.gray100 : COLORS.white }}
                  >
                    <option value="">{currentLanguage === "ko" ? "선택" : "Select"}</option>
                    {getDistrictsByCityId(selectedCityId).map((d) => {
                      const langMap: Record<string, string> = { ko: d.nameKo, vi: d.nameVi, en: d.name, ja: d.nameJa ?? d.name, zh: d.nameZh ?? d.name };
                      return <option key={d.id} value={d.id}>{langMap[currentLanguage] ?? d.name}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* 동호수 */}
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: COLORS.gray50 }}>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentLanguage === "ko"
                    ? "동호수"
                    : currentLanguage === "vi"
                      ? "Số phòng"
                      : "Unit Number"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "동" : currentLanguage === "vi" ? "Tòa" : "Building"}
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: A, 1" : "e.g., A"}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                      style={{ borderColor: COLORS.gray200 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "호실" : currentLanguage === "vi" ? "Phòng" : "Room"}
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: 101" : "e.g., 101"}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                  <span style={{ color: COLORS.primary }}>i</span>
                  <span>
                    {currentLanguage === "ko"
                      ? "동호수는 예약이 완료된 이후에 임차인에게만 표시됩니다."
                      : currentLanguage === "vi"
                        ? "Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ được hoàn thành."
                        : "Unit number will only be visible to tenants after booking is completed."}
                  </span>
                </p>
              </div>
            </section>

            {/* ===== 임대 희망 날짜 섹션 ===== */}
            <section 
              className="rounded-3xl p-5 border-2 shadow-sm"
              style={{ backgroundColor: `${COLORS.lemon}15`, borderColor: `${COLORS.lemon}50` }}
            >
              <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.gray800 }}>
                <span className="text-lg">📅</span>
                {currentLanguage === "ko"
                  ? "임대 희망 날짜"
                  : currentLanguage === "vi"
                    ? "Ngày cho thuê"
                    : "Rental Dates"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarMode("checkin");
                    setShowCalendar(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors min-h-[56px] border-2"
                  style={{ borderColor: `${COLORS.lemon}80`, backgroundColor: COLORS.white }}
                >
                  <span className="text-xl">🌅</span>
                  <div className="text-left">
                    <div className="text-xs font-medium" style={{ color: COLORS.gray500 }}>
                      {currentLanguage === "ko" ? "시작일" : "Start"}
                    </div>
                    <div className="text-sm font-bold" style={{ color: COLORS.gray800 }}>
                      {checkInDate
                        ? checkInDate.toLocaleDateString(
                            currentLanguage === "ko" ? "ko-KR" : currentLanguage === "vi" ? "vi-VN" : "en-US",
                            { month: "short", day: "numeric" }
                          )
                        : currentLanguage === "ko" ? "선택" : "Select"}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalendarMode("checkout");
                    setShowCalendar(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors min-h-[56px] border-2"
                  style={{ borderColor: `${COLORS.lemon}80`, backgroundColor: COLORS.white }}
                >
                  <span className="text-xl">🌇</span>
                  <div className="text-left">
                    <div className="text-xs font-medium" style={{ color: COLORS.gray500 }}>
                      {currentLanguage === "ko" ? "종료일" : "End"}
                    </div>
                    <div className="text-sm font-bold" style={{ color: COLORS.gray800 }}>
                      {checkOutDate
                        ? checkOutDate.toLocaleDateString(
                            currentLanguage === "ko" ? "ko-KR" : currentLanguage === "vi" ? "vi-VN" : "en-US",
                            { month: "short", day: "numeric" }
                          )
                        : currentLanguage === "ko" ? "선택" : "Select"}
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* ===== 1주일 임대료 섹션 ===== */}
            <section 
              className="rounded-3xl p-5 border-2 shadow-sm"
              style={{ backgroundColor: `${COLORS.primary}08`, borderColor: `${COLORS.primary}30` }}
            >
              <h2 className="text-base font-bold flex items-center gap-2 mb-1" style={{ color: COLORS.primary }}>
                <span className="text-lg">💰</span>
                {currentLanguage === "ko"
                  ? "1주일 임대료"
                  : currentLanguage === "vi"
                    ? "Giá thuê 1 tuần"
                    : "Weekly Rent"}
                <span style={{ color: COLORS.primary }}>*</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                {currentLanguage === "ko"
                  ? "공과금/관리비 포함"
                  : currentLanguage === "vi"
                    ? "Bao gồm phí dịch vụ"
                    : "Utilities included"}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={
                    weeklyRent
                      ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString()
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setWeeklyRent(value);
                  }}
                  placeholder="0"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl min-h-[48px] text-lg font-semibold focus:outline-none transition-all"
                  style={{ borderColor: COLORS.gray200 }}
                  required
                />
                <span className="text-gray-600 font-semibold text-lg">VND</span>
              </div>
            </section>

            {/* ===== 시설 및 정책 섹션 ===== */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {currentLanguage === "ko"
                  ? "숙소시설 및 정책"
                  : currentLanguage === "vi"
                    ? "Tiện ích và chính sách"
                    : "Facilities & Policy"}
              </h2>

              <div className="space-y-5">
                {FACILITY_CATEGORIES.map((cat) => {
                  const options = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
                  const catLabel = (cat.label as any)[currentLanguage] || cat.label.en;
                  const isBadgeCategory = cat.id === "furniture" || cat.id === "electronics" || cat.id === "kitchen";
                  const fullFurniture = cat.id === "furniture" && FULL_FURNITURE_IDS.every((id) => selectedFacilities.includes(id));
                  const fullElectronics = cat.id === "electronics" && FULL_ELECTRONICS_IDS.every((id) => selectedFacilities.includes(id));
                  const fullOptionKitchen = cat.id === "kitchen" && FULL_OPTION_KITCHEN_IDS.every((id) => selectedFacilities.includes(id));
                  const hasBadge = fullFurniture || fullElectronics || fullOptionKitchen;

                  return (
                    <div key={cat.id} className="p-4 rounded-2xl" style={{ backgroundColor: COLORS.gray50 }}>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="text-sm font-medium text-gray-700">{catLabel}</p>
                        {isBadgeCategory && (
                          <p className="text-xs" style={{ color: hasBadge ? COLORS.success : COLORS.gray400 }}>
                            {hasBadge ? (
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {currentLanguage === "ko" ? "뱃지 획득!" : "Badge earned!"}
                              </span>
                            ) : (
                              currentLanguage === "ko"
                                ? "모든 아이콘 선택 시 뱃지 획득"
                                : "Select all for badge"
                            )}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {options.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = selectedFacilities.includes(opt.id);
                          const label = (opt.label as any)[currentLanguage] || opt.label.en;
                          const isPet = opt.id === "pet";
                          const isCleaning = opt.id === "cleaning";

                          return (
                            <div key={opt.id} className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleFacility(opt.id)}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all min-h-[56px] min-w-[56px]"
                                style={{
                                  backgroundColor: isSelected ? COLORS.primary : COLORS.white,
                                  border: `2px solid ${isSelected ? COLORS.primary : COLORS.gray200}`,
                                }}
                              >
                                <Icon
                                  className="w-6 h-6"
                                  style={{ color: isSelected ? COLORS.white : COLORS.gray500 }}
                                />
                              </button>
                              <span className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* 펫 추가 옵션 */}
                      {cat.id === "policy" && petAllowed && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {currentLanguage === "ko" ? "최대 마리수" : "Max pets"}
                            </span>
                            <select
                              value={maxPets}
                              onChange={(e) => setMaxPets(Number(e.target.value))}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm min-h-[40px]"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-2">
                              {currentLanguage === "ko" ? "펫 요금 (선택)" : "Pet fee (optional)"}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={petFeeAmount ? parseInt(petFeeAmount.replace(/\D/g, "") || "0", 10).toLocaleString() : ""}
                                onChange={(e) => setPetFeeAmount(e.target.value.replace(/\D/g, ""))}
                                placeholder="0"
                                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm min-h-[40px]"
                              />
                              <span className="text-gray-500 text-sm">VND</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 청소 횟수 */}
                      {cat.id === "policy" && selectedFacilities.includes("cleaning") && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {currentLanguage === "ko" ? "주당 청소 횟수" : "Cleaning per week"}
                            </span>
                            <select
                              value={cleaningPerWeek}
                              onChange={(e) => setCleaningPerWeek(Number(e.target.value))}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm min-h-[40px]"
                            >
                              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                <option key={n} value={n}>{n}{currentLanguage === "ko" ? "회" : "x"}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ===== 체크인/체크아웃 시간 섹션 ===== */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {currentLanguage === "ko"
                  ? "체크인/체크아웃 시간"
                  : currentLanguage === "vi"
                    ? "Giờ check-in/check-out"
                    : "Check-in/Check-out Time"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {currentLanguage === "ko" ? "체크인" : "Check-in"}
                  </label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm min-h-[48px] focus:outline-none transition-all"
                    style={{ backgroundColor: COLORS.gray50 }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return [`${hour}:00`, `${hour}:30`];
                    }).flat().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
                  </label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm min-h-[48px] focus:outline-none transition-all"
                    style={{ backgroundColor: COLORS.gray50 }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return [`${hour}:00`, `${hour}:30`];
                    }).flat().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ===== 매물명 섹션 ===== */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {getUIText('propertyNickname', currentLanguage)}
                <span className="text-red-500 ml-1">*</span>
              </h2>
              <input
                type="text"
                value={propertyNickname}
                onChange={(e) => setPropertyNickname(e.target.value)}
                placeholder={getUIText('propertyNicknamePlaceholder', currentLanguage)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl min-h-[48px] focus:outline-none transition-all"
                style={{ borderColor: COLORS.gray200 }}
                required
              />
            </section>

            {/* ===== 매물 설명 섹션 ===== */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {currentLanguage === "ko"
                  ? "매물 설명"
                  : currentLanguage === "vi"
                    ? "Mô tả bất động sản"
                    : "Property Description"}
                <span className="text-red-500 ml-1">*</span>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl resize-none min-h-[120px] focus:outline-none transition-all"
                style={{ borderColor: COLORS.gray200 }}
                required
              />
              <p className="text-xs mt-3 flex items-start gap-2" style={{ color: COLORS.success }}>
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

            {/* ===== 외부 캘린더 섹션 ===== */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowIcalDropdown(!showIcalDropdown)}
                className="w-full py-4 px-5 flex items-center justify-between transition-colors text-left min-h-[56px]"
                style={{ backgroundColor: COLORS.gray50 }}
              >
                <span className="text-sm font-medium text-gray-700">
                  {currentLanguage === "ko"
                    ? "외부 캘린더 가져오기"
                    : currentLanguage === "vi"
                      ? "Đồng bộ lịch ngoài"
                      : "Import External Calendar"}
                </span>
                {showIcalDropdown ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showIcalDropdown && (
                <div className="p-5 pt-3 border-t border-gray-200 bg-white space-y-4">
                  <p className="text-xs text-gray-500">
                    {currentLanguage === "ko"
                      ? "에어비앤비, 아고다 등 예약을 500stay와 동기화합니다."
                      : "Sync bookings from Airbnb, Agoda, etc."}
                  </p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "플랫폼" : "Platform"}
                    </label>
                    <select
                      value={icalPlatform}
                      onChange={(e) => setIcalPlatform(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl bg-white min-h-[48px] focus:outline-none"
                    >
                      <option value="">{currentLanguage === "ko" ? "선택 안 함" : "None"}</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="agoda">Agoda</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="other">{currentLanguage === "ko" ? "기타" : "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      {currentLanguage === "ko" ? "캘린더 이름" : "Calendar name"}
                    </label>
                    <input
                      type="text"
                      value={icalCalendarName}
                      onChange={(e) => setIcalCalendarName(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: 에어비앤비 예약" : "e.g. Airbnb"}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl min-h-[48px] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">iCal URL (.ics)</label>
                    <input
                      type="url"
                      value={icalUrl}
                      onChange={(e) => setIcalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl min-h-[48px] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </section>
          </form>
        </div>

        {/* ===== 하단 고정 등록 버튼 ===== */}
        <div 
          className="sticky bottom-16 left-0 right-0 p-4 border-t shadow-lg"
          style={{ backgroundColor: COLORS.cream, borderColor: `${COLORS.primary}20` }}
        >
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              loading ||
              imagePreviews.length === 0 ||
              !weeklyRent ||
              weeklyRent.replace(/\D/g, "") === "" ||
              !propertyType ||
              bedrooms === 0 ||
              bathrooms === 0
            }
            className="w-full py-4 px-6 rounded-full font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px] text-white"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
              boxShadow: `0 6px 20px ${COLORS.primary}40`
            }}
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
              <>
                <span className="text-lg">✨</span>
                <span>
                  {currentLanguage === "ko"
                    ? "매물 등록하기"
                    : currentLanguage === "vi"
                      ? "Đăng bất động sản"
                      : "Register Property"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* ===== 하단 네비게이션 바 ===== */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 px-2 py-2 z-50">
          <div className="flex items-center justify-around">
            <button
              onClick={() => router.push("/")}
              className="flex flex-col items-center gap-1 py-2 px-4 min-h-[56px] min-w-[56px]"
            >
              <Home className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">
                {currentLanguage === "ko" ? "홈" : "Home"}
              </span>
            </button>
            <button
              onClick={() => router.push("/search")}
              className="flex flex-col items-center gap-1 py-2 px-4 min-h-[56px] min-w-[56px]"
            >
              <Search className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">
                {currentLanguage === "ko" ? "검색" : "Search"}
              </span>
            </button>
            <button
              onClick={() => router.push("/profile/my-properties")}
              className="flex flex-col items-center gap-1 py-2 px-4 min-h-[56px] min-w-[56px]"
            >
              <Building className="w-6 h-6" style={{ color: COLORS.primary }} />
              <span className="text-xs font-medium" style={{ color: COLORS.primary }}>
                {currentLanguage === "ko" ? "내 매물" : "My"}
              </span>
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex flex-col items-center gap-1 py-2 px-4 min-h-[56px] min-w-[56px]"
            >
              <User className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">
                {currentLanguage === "ko" ? "프로필" : "Profile"}
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* ===== 모달들 ===== */}

      {/* 이미지 소스 선택 메뉴 */}
      {showImageSourceMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowImageSourceMenu(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "사진 추가 방법 선택"
                : currentLanguage === "vi"
                  ? "Chọn cách thêm ảnh"
                  : "Select Photo Source"}
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSelectFromLibrary}
                className="w-full py-4 px-4 rounded-2xl font-medium flex items-center justify-center gap-3 min-h-[56px] text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <ImageIcon className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "사진첩에서 선택"
                    : currentLanguage === "vi"
                      ? "Chọn từ thư viện ảnh"
                      : "Select from Library"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleTakePhoto}
                className="w-full py-4 px-4 rounded-2xl font-medium flex items-center justify-center gap-3 min-h-[56px]"
                style={{ backgroundColor: COLORS.gray100, color: COLORS.gray900 }}
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "카메라로 촬영"
                    : currentLanguage === "vi"
                      ? "Chụp ảnh"
                      : "Take Photo"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowImageSourceMenu(false)}
                className="w-full py-3 px-4 text-gray-600 rounded-2xl font-medium min-h-[48px]"
              >
                {currentLanguage === "ko" ? "취소" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진첩 모달 */}
      {showPhotoLibrary && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowPhotoLibrary(false);
                setPhotoLibraryFiles([]);
                photoLibraryPreviews.forEach((url) => URL.revokeObjectURL(url));
                setPhotoLibraryPreviews([]);
                setSelectedLibraryIndices(new Set());
                setFullScreenImageIndex(null);
              }}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentLanguage === "ko" ? "사진 선택" : "Select Photos"}
            </h2>
            <div className="w-10" />
          </div>

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
                      className={`w-full h-full object-cover rounded-lg ${isSelected ? "opacity-50" : ""}`}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${COLORS.primary}30` }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFullScreen(index);
                      }}
                      className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1.5 min-h-[28px] min-w-[28px] flex items-center justify-center"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleConfirmPhotoSelection}
              disabled={selectedLibraryIndices.size === 0}
              className="w-full py-4 px-4 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              {currentLanguage === "ko"
                ? `선택한 ${selectedLibraryIndices.size}장 추가`
                : `Add ${selectedLibraryIndices.size} selected`}
            </button>
          </div>
        </div>
      )}

      {/* 전체화면 이미지 */}
      {fullScreenImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
          <img
            src={photoLibraryPreviews[fullScreenImageIndex]}
            alt={`Full screen ${fullScreenImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
          <button
            type="button"
            onClick={handleBackToLibrary}
            className="absolute bottom-6 right-6 bg-white/90 text-gray-900 rounded-full p-4 shadow-lg flex items-center gap-2 min-h-[56px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {currentLanguage === "ko" ? "사진첩" : "Library"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleBackToLibrary}
            className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* 달력 모달 */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInSelect={(date) => {
                setCheckInDate(date);
                setCheckOutDate(null);
                setCalendarMode("checkout");
                setShowCalendar(true);
              }}
              onCheckOutSelect={(date) => {
                setCheckOutDate(date);
                setShowCalendar(false);
              }}
              onCheckInReset={() => {
                setCheckInDate(null);
                setCheckOutDate(null);
                setCalendarMode("checkin");
              }}
              currentLanguage={currentLanguage}
              onClose={() => setShowCalendar(false)}
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
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "추천 사진 가이드라인"
                : "Photo Guidelines"}
            </h3>
            <div className="space-y-3 mb-4">
              {[
                { icon: "🛏️", label: currentLanguage === "ko" ? "침실" : "Bedroom" },
                { icon: "🍳", label: currentLanguage === "ko" ? "주방" : "Kitchen" },
                { icon: "🛋️", label: currentLanguage === "ko" ? "거실" : "Living Room" },
                { icon: "🚿", label: currentLanguage === "ko" ? "화장실" : "Bathroom" },
                { icon: "🪟", label: currentLanguage === "ko" ? "창문뷰" : "Window View" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              {currentLanguage === "ko"
                ? "아무 곳이나 터치하여 시작하세요"
                : "Tap anywhere to start"}
            </p>
            <button
              onClick={handleGuidelinePopupClick}
              className="w-full py-4 px-4 rounded-2xl font-medium min-h-[56px] text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              {currentLanguage === "ko" ? "확인" : "OK"}
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
