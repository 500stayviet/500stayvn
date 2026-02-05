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
  Heart,
  MessageCircle,
  Map,
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
// 기존 import들 사이에 추가
import { uploadToS3 } from "@/lib/s3-client";
import { FACILITY_OPTIONS, FACILITY_CATEGORIES, FULL_OPTION_KITCHEN_IDS, FULL_FURNITURE_IDS, FULL_ELECTRONICS_IDS } from "@/lib/constants/facilities";
import {
  getDistrictIdForCoord,
  getDistrictsByCityId,
  searchRegions,
  VIETNAM_CITIES,
  ALL_REGIONS,
} from "@/lib/data/vietnam-regions";

// 베트남 스타일 컬러: Coral Red + Golden Orange + Sunshine Yellow
const COLORS = {
  primary: "#E63946",      // Coral Red - 메인 컬러
  primaryLight: "#FF6B6B", // Light Coral
  secondary: "#FF6B35",    // Golden Orange - 보조 컬러
  accent: "#FFB627",       // Sunshine Yellow - 강조
  success: "#10B981",      // Emerald Green - 성공/완료
  error: "#DC2626",        // Red - 에러
  white: "#FFFFFF",
  background: "#FFF8F0",   // 따뜻한 크림색 배경
  surface: "#FFFFFF",      // 카드 배경
  border: "#FED7AA",       // 따뜻한 오렌지 테두리
  borderFocus: "#E63946",  // 포커스 테두리
  text: "#1F2937",         // 메인 텍스트
  textSecondary: "#6B7280", // 보조 텍스트
  textMuted: "#9CA3AF",    // 희미한 텍스트
};

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwnerMode, setIsOwnerMode] = useState(false); // 임대인 모드 여부
  // 폼 상태
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [apartmentName, setApartmentName] = useState("");
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
  const [propertyNickname, setPropertyNickname] = useState(""); // 매물명 (임대인용)
  const [propertyDescription, setPropertyDescription] = useState("");
  // 체크인/체크아웃 시간
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
      setBedrooms((prev) => (prev >= 2 && prev <= 5 ? prev : 3));
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
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  // 외부 캘린더(iCal) 가져오기
  const [icalPlatform, setIcalPlatform] = useState<string>("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);

  // 사진첩 모달 상태
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>(
    [],
  );
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<
    Set<number>
  >(new Set());
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<
    number | null
  >(null);

  // 이미지 소스 선택 메뉴 상태
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showGuidelinePopup, setShowGuidelinePopup] = useState(false);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 주소 확인 모달
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 접근 권한 확인 및 사용자 모드 설정
  useEffect(() => {
    const checkAccessAndMode = async () => {
      if (authLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);

        // KYC 1~3단계 토큰이 모두 있어야 매물 등록 가능
        // 사용자 요구��항: "코인3개가 되면 다 사용가능한거야"
        const kycSteps = userData?.kyc_steps || {};
        const allStepsCompleted =
          kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

        // 프로필 페이지와 동일한 조건: KYC 완료 또는 owner 권한
        if (allStepsCompleted || userData?.is_owner === true) {
          setHasAccess(true);
          // 임대인 모드 설정 (KYC 완료 + 코인 3개 이상)
          // 실제로는 userData.coins 또는 userData.owner_status 등을 확인해야 함
          // 여기서는 KYC 완료 시 임대인 모드로 간주
          setIsOwnerMode(true);
        } else {
          // KYC 미완료 시 1~3단계 인증 페이지로 이동
          router.push("/kyc");
        }
      } catch (error) {
        router.push("/kyc");
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccessAndMode();
  }, [user, authLoading, router]);

  // 주소 확인 모달에서 주소 확정 시 (도시·구 자동 설정)
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

    // 사진첩에 파일 저장
    setPhotoLibraryFiles(files);

    // 미리보기 생성
    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoLibraryPreviews(previews);

    // 선택 초기화
    setSelectedLibraryIndices(new Set());

    // 사진첩 모달 열기
    setShowPhotoLibrary(true);

    // input 초기화
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

    // 미리보기 생성
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    // 사진첩 닫기 및 정리
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

    // 미리보기 생성
    const preview = URL.createObjectURL(file);
    setImagePreviews([...imagePreviews, preview]);

    // input 초기화
    e.target.value = "";
  };

  // 이미지 추가 버튼 클릭 (사진첩 또는 카메라 선택) - ref는 이미 위에서 선언됨

  const handleAddImageClick = () => {
    if (images.length >= 5) return;

    // 1시간에 한 번만 가이드라인 팝업 표시
    const GUIDELINE_STORAGE_KEY = "property_guideline_last_shown";
    const lastShownTime = localStorage.getItem(GUIDELINE_STORAGE_KEY);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1시간 (밀리초)

    if (lastShownTime) {
      const timeSinceLastShown = now - parseInt(lastShownTime, 10);
      if (timeSinceLastShown < oneHour) {
        // 1시간이 지나지 않았으면 팝업 없이 바로 이미지 소스 메뉴 표시
        setShowImageSourceMenu(true);
        return;
      }
    }

    // 1시간이 지났거나 처음이면 가이드라인 팝업 표시
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

    // 가이드라인을 본 시간을 localStorage에 저장
    const GUIDELINE_STORAGE_KEY = "property_guideline_last_shown";
    localStorage.setItem(GUIDELINE_STORAGE_KEY, Date.now().toString());

    setShowImageSourceMenu(true);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // URL 해제
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

  // 방 개수 옵션 (매물종류별)
  const bedroomOptions = (() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1];
    if (propertyType === "two_room") return [2];
    if (propertyType === "three_plus") return [2, 3, 4, 5]; // 5 = 5+
    if (propertyType === "detached") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return [];
  })();

  // 화장실 개수 옵션 (매물종류별)
  const bathroomOptions = (() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1, 2];
    if (propertyType === "two_room") return [1, 2, 3];
    if (propertyType === "three_plus") return [1, 2, 3, 4, 5, 6]; // 6 = 5+
    if (propertyType === "detached") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return [];
  })();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 정보 검증
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

    // 좌표 검증
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      alert(
        currentLanguage === "ko"
          ? "주소를 선택하여 좌표를 설정해주세요. 주소 입력 버튼을 클릭����여 주소를 확인해주세요."
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

    // 매물명 필수 검증
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
            ? "Vui lòng chọn ngày bắt đầu và kết thúc thuê."
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
      // KYC 1~3단계 토큰 확인
      const userData = await getCurrentUserData(user.uid);
      const kycSteps = userData?.kyc_steps || {};
      const allStepsCompleted =
        kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

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

      // 인당 매물 수 제한 확인 (최대 5개)
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

      // 동호수 조합 (비공개 - 별도 필드로만 저장)
      // 호실 번호는 4자리로 패딩 (예: 1호 → 0001호)
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

      // 주소와 설명에는 동호수 포함하지 않음 (비공개)
      const publicAddress = `${apartmentName ? `${apartmentName}, ` : ""}${address}`;

      // 이미지 업로드
      let imageUrls: string[];
      try {
        imageUrls = await Promise.all(
          images.map((image) => uploadToS3(image, "properties")),
        );
      } catch (error) {
        console.error("S3 업로드 실패:", error);
        // 실제 에러 메시지를 사용자에게 표시
        const errorMessage =
          error instanceof Error ? error.message : "S3 업로드 실패";
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

      // 날짜를 Date 객체로 변환 (LocalStorage용)
      const checkInDateObj = checkInDate || undefined;
      const checkOutDateObj = checkOutDate || undefined;

      await addProperty({
        title: apartmentName || address,
        propertyNickname: propertyNickname.trim(), // 매물명 (임대인용, 필수)
        original_description: propertyDescription, // 매물 설명 (빈 문자열 허용)
        translated_description: "", // 나중에 번역 서비스로 채움
        price: parseInt(weeklyRent.replace(/\D/g, "")),
        priceUnit: "vnd",
        area: 0, // 나중에 추가 가능
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        coordinates: coordinates, // 좌표는 필수 (위에서 검증됨)
        address: publicAddress, // 동호수 제외
        images: imageUrls,
        amenities: selectedFacilities,
        unitNumber: unitNumber, // 동호수 (예약 완료 후에만 표시, 비공개)
        propertyType,
        cleaningPerWeek: selectedFacilities.includes("cleaning") ? cleaningPerWeek : 0,
        petAllowed,
        ...(petAllowed && { maxPets }),
        ...(petAllowed && petFeeAmount.trim() && { petFee: parseInt(petFeeAmount.replace(/\D/g, ""), 10) || undefined }),
        ownerId: user.uid, // 임대인 사용자 ID 저장
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
        // 도시와 구 정보 ��장
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
      // 중복 등록 등 예상된 비즈니스 로직 에러는 콘솔 에러를 남기지 않음 (개발 오버레이 방지)
      const knownErrors = ["OverlapDetected", "AlreadyBooked"];
      if (!knownErrors.includes(error.message)) {
        console.error("매물 등록 중 예기치 못한 ��패:", error);
      }

      if (
        error.message === "OverlapDetected" ||
        error.message === "AlreadyBooked"
      ) {
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
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative pb-20" style={{ backgroundColor: COLORS.surface }}>
        {/* 상단 바 */}
        <TopBar />

        {/* 콘텐츠 */}
        <div className="px-5 py-5">
          {/* 헤더 */}
          <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
              {currentLanguage === "ko"
                ? "새 매물 등록"
                : currentLanguage === "vi"
                  ? "Đăng ký bất động sản mới"
                  : "Register New Property"}
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              {currentLanguage === "ko"
                ? "매물 정보를 입력해주세요"
                : currentLanguage === "vi"
                  ? "Vui lòng nhập thông tin bất động sản"
                  : "Please enter property information"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이미지 업로드 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold" style={{ color: COLORS.text }}>
                  {currentLanguage === "ko"
                    ? "사진 등록"
                    : currentLanguage === "vi"
                      ? "Đăng ảnh"
                      : "Upload Photos"}
                  <span style={{ color: COLORS.error }} className="ml-1">*</span>
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
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
                  className="fixed inset-0 bg-black/50 flex items-end z-50"
                  onClick={() => setShowImageSourceMenu(false)}
                >
                  <div
                    className="w-full bg-white rounded-t-2xl p-6"
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
                        className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                      >
                        <Camera className="w-5 h-5" />
                        <span>
                          {currentLanguage === "ko"
                            ? "사진첩에서 선택"
                            : currentLanguage === "vi"
                              ? "Chọn từ thư viện ảnh"
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
                              className={`w-full h-full object-cover rounded ${isSelected ? "opacity-50" : ""
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
                              className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
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
                          : "Library"}
                    </span>
                  </button>
                  {/* 닫기 버튼 (좌측 상단) */}
                  <button
                    type="button"
                    onClick={handleBackToLibrary}
                    className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}
            </section>

            {/* 매물 종류 / 방 개수 / 화장실 수 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "매물 종류"
                  : currentLanguage === "vi"
                    ? "Loại bất động sản"
                    : "Property Type"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <div className="grid grid-cols-5 gap-1.5">
                {(
                  [
                    { value: "studio", ko: "스튜디오", vi: "Studio", en: "Studio", icon: "🏢" },
                    { value: "one_room", ko: "원룸", vi: "1 phòng", en: "1 Room", icon: "🚪" },
                    { value: "two_room", ko: "2룸", vi: "2 phòng", en: "2 Rooms", icon: "🏠" },
                    { value: "three_plus", ko: "3+룸", vi: "3+ phòng", en: "3+ Rooms", icon: "🏡" },
                    { value: "detached", ko: "독채", vi: "Nhà riêng", en: "Detached", icon: "🏘️" },
                  ] as const
                ).map(({ value, ko, vi, en, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPropertyType(value)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-all min-h-[60px]"
                    style={{
                      backgroundColor: propertyType === value ? `${COLORS.primary}15` : COLORS.white,
                      border: `1px solid ${propertyType === value ? COLORS.primary : COLORS.border}`,
                      color: propertyType === value ? COLORS.primary : COLORS.text,
                    }}
                  >
                    <span className="text-lg mb-0.5">{icon}</span>
                    <span className="leading-tight text-center">{currentLanguage === "ko" ? ko : currentLanguage === "vi" ? vi : en}</span>
                  </button>
                ))}
              </div>

              {propertyType && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}40` }}>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      disabled={propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {bedroomOptions.map((n) => (
                        <option key={n} value={n}>
                          {n === 5 && (propertyType === "three_plus" || propertyType === "detached")
                            ? "5+"
                            : n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "화장실 수" : currentLanguage === "vi" ? "Số phòng tắm" : "Bathrooms"}
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
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "최대 인원" : currentLanguage === "vi" ? "Số người tối đa" : "Max Guests"}
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
                          {n}{currentLanguage === "ko" ? "명" : currentLanguage === "vi" ? " người" : " guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* 주소 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "주소"
                  : currentLanguage === "vi"
                    ? "Địa chỉ"
                    : "Address"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              {(!address || !coordinates) && (
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
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
                  style={{ backgroundColor: `${COLORS.success}15`, border: `1px solid ${COLORS.success}30` }}
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${COLORS.success}20` }}>
                      <Check className="w-4 h-4" style={{ color: COLORS.success }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium" style={{ color: COLORS.success }}>
                        {currentLanguage === "ko"
                          ? "확정된 주소 (클릭하여 수정)"
                          : currentLanguage === "vi"
                            ? "Địa chỉ đã xác nhận"
                            : "Confirmed Address"}
                      </span>
                      <p className="text-sm font-medium mt-0.5" style={{ color: COLORS.text }}>
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
                      className="p-1 rounded-full transition-colors flex-shrink-0"
                      style={{ backgroundColor: `${COLORS.success}20` }}
                    >
                      <X className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
                    </button>
                  </div>
                </div>
              )}

              {/* 도시·구 */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko" ? "도시" : currentLanguage === "vi" ? "Thành phố" : "City"}
                  </label>
                  <div 
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  >
                    {address && coordinates && selectedCityId
                      ? (() => {
                        const city = VIETNAM_CITIES.find((c) => c.id === selectedCityId);
                        if (!city) return "—";
                        const langMap: Record<string, string> = { ko: city.nameKo, vi: city.nameVi, en: city.name, ja: city.nameJa ?? city.name, zh: city.nameZh ?? city.name };
                        return langMap[currentLanguage] ?? city.name;
                      })()
                      : <span style={{ color: COLORS.textMuted }}>{currentLanguage === "ko" ? "자동 입력" : "Auto"}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko" ? "구" : currentLanguage === "vi" ? "Quận" : "District"}
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    disabled={!address || !coordinates}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{ 
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  >
                    <option value="">{currentLanguage === "ko" ? "선택" : currentLanguage === "vi" ? "Chọn" : "Select"}</option>
                    {getDistrictsByCityId(selectedCityId).map((d) => {
                      const langMap: Record<string, string> = { ko: d.nameKo, vi: d.nameVi, en: d.name, ja: d.nameJa ?? d.name, zh: d.nameZh ?? d.name };
                      return <option key={d.id} value={d.id}>{langMap[currentLanguage] ?? d.name}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* 동호수 입력 */}
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.border}20` }}>
                <label className="block text-xs font-medium mb-2" style={{ color: COLORS.text }}>
                  {currentLanguage === "ko"
                    ? "동호수"
                    : currentLanguage === "vi"
                      ? "Số phòng"
                      : "Unit Number"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "동" : currentLanguage === "vi" ? "Tòa" : "Building"}
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: A" : "e.g., A"}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "호실" : currentLanguage === "vi" ? "Phòng" : "Room"}
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: 101" : "e.g., 101"}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] mt-2 flex items-start gap-1" style={{ color: COLORS.textSecondary }}>
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
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "임대 희망 날짜"
                  : currentLanguage === "vi"
                    ? "Ngày cho thuê mong muốn"
                    : "Desired Rental Dates"}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {/* 체크인 날짜 */}
                <button
                  type="button"
                  onClick={() => {
                    setCalendarMode("checkin");
                    setShowCalendar(true);
                  }}
                  className="flex items-center px-3 py-2 rounded-md transition-colors"
                  style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
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
                  onClick={() => {
                    setCalendarMode("checkout");
                    setShowCalendar(true);
                  }}
                  className="flex items-center px-3 py-2 rounded-md transition-colors"
                  style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
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
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "1주일 임대료"
                  : currentLanguage === "vi"
                    ? "Giá thuê 1 tuần"
                    : "Weekly Rent"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <p className="text-[11px] mb-3" style={{ color: COLORS.textSecondary }}>
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
                  style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                  required
                />
                <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>VND</span>
              </div>
            </section>

            {/* 숙소시설 및 정책 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-4" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "숙소시설 및 정책"
                  : currentLanguage === "vi"
                    ? "Tiện ích và chính sách"
                    : "Facilities & Policy"}
              </h2>
              <div className="space-y-4">
                {FACILITY_CATEGORIES.map((cat) => {
                  const options = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
                  const catLabel = (cat.label as any)[currentLanguage] || cat.label.en;
                  const isBadgeCategory = cat.id === "furniture" || cat.id === "electronics" || cat.id === "kitchen";
                  const fullFurniture = cat.id === "furniture" && FULL_FURNITURE_IDS.every((id) => selectedFacilities.includes(id));
                  const fullElectronics = cat.id === "electronics" && FULL_ELECTRONICS_IDS.every((id) => selectedFacilities.includes(id));
                  const fullOptionKitchen = cat.id === "kitchen" && FULL_OPTION_KITCHEN_IDS.every((id) => selectedFacilities.includes(id));
                  return (
                    <div key={cat.id}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="text-xs font-medium text-gray-500">{catLabel}</p>
                        {isBadgeCategory && (
                          <p className="text-[10px] text-gray-500">
                            {currentLanguage === "ko"
                              ? "모든 아이콘 선택시 뱃지 획득"
                              : currentLanguage === "vi"
                                ? "Ch���n đủ tất cả để nhận huy hiệu"
                                : "Select all to earn badge"}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
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
                                className="w-full flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg transition-all"
                                style={{
                                  backgroundColor: isSelected ? `${COLORS.primary}15` : COLORS.white,
                                  border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                                  color: isSelected ? COLORS.primary : COLORS.text,
                                }}
                              >
                                <Icon className="w-5 h-5" style={{ color: isSelected ? COLORS.primary : COLORS.textMuted }} />
                                <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                              </button>
                              {isPet && isSelected && (
                                <div className="w-full space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-600 shrink-0">
                                      {currentLanguage === "ko" ? "최대 마리수" : currentLanguage === "vi" ? "Số con tối đa" : "Max pets"}
                                    </span>
                                    <select
                                      value={maxPets}
                                      onChange={(e) => setMaxPets(Number(e.target.value))}
                                      className="flex-1 px-1 py-0.5 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-50/80 border border-blue-200">
                                    <input
                                      type="text"
                                      value={petFeeAmount ? parseInt(petFeeAmount.replace(/\D/g, ""), 10).toLocaleString() : ""}
                                      onChange={(e) => setPetFeeAmount(e.target.value.replace(/\D/g, ""))}
                                      placeholder="0"
                                      className="w-14 px-1.5 py-0.5 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-[9px] text-gray-600 font-medium shrink-0">VND</span>
                                  </div>
                                </div>
                              )}
                              {isCleaning && isSelected && (
                                <div className="w-full">
                                  <select
                                    value={cleaningPerWeek}
                                    onChange={(e) => setCleaningPerWeek(Number(e.target.value))}
                                    className="w-full px-1.5 py-0.5 text-[10px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                      <option key={n} value={n}>
                                        {n}
                                        {currentLanguage === "ko" ? "회" : currentLanguage === "vi" ? " lần" : "x"}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {fullFurniture && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko" ? "풀 가구" : currentLanguage === "vi" ? "Nội thất đầy đủ" : "Full Furniture"}
                        </div>
                      )}
                      {fullElectronics && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko" ? "풀 가전" : currentLanguage === "vi" ? "Điện tử đầy đủ" : "Full Electronics"}
                        </div>
                      )}
                      {fullOptionKitchen && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          {currentLanguage === "ko" ? "풀옵션 주방" : currentLanguage === "vi" ? "Bếp đầy đủ" : "Full Kitchen"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 체크인/체크아웃 시간 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-4" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "체크인/체크아웃 시간"
                  : currentLanguage === "vi"
                    ? "Giờ check-in/check-out"
                    : "Check-in/Check-out Time"}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko" ? "체크인" : "Check-in"}
                  </label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
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
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
                  </label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
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

            {/* 매물명 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {getUIText('propertyNickname', currentLanguage)}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <input
                type="text"
                value={propertyNickname}
                onChange={(e) => setPropertyNickname(e.target.value)}
                placeholder={getUIText('propertyNicknamePlaceholder', currentLanguage)}
                className="w-full px-3 py-2.5 rounded-lg text-sm min-h-[40px] focus:outline-none transition-all"
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                required
              />
            </section>

            {/* 매물 설명 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko"
                  ? "매물 설명"
                  : currentLanguage === "vi"
                    ? "Mô tả bất động sản"
                    : "Property Description"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
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
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                required
              />
              <p className="text-[10px] mt-2 flex items-start gap-1" style={{ color: COLORS.success }}>
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
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <button
                type="button"
                onClick={() => setShowIcalDropdown(!showIcalDropdown)}
                className="w-full py-3 px-4 flex items-center justify-between transition-colors text-left min-h-[48px]"
                style={{ backgroundColor: `${COLORS.border}20` }}
              >
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>
                  {currentLanguage === "ko"
                    ? "외부 캘린더 가져오기"
                    : currentLanguage === "vi"
                      ? "Đồng bộ lịch ngoài"
                      : "Import External Calendar"}
                </span>
                {showIcalDropdown ? (
                  <ChevronUp className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
                )}
              </button>
              {showIcalDropdown && (
                <div className="p-4 pt-3 space-y-3" style={{ borderTop: `1px solid ${COLORS.border}30` }}>
                  <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko"
                      ? "에어비앤비, 아고다 등 예약을 500stay와 동기화합니다."
                      : "Sync bookings from Airbnb, Agoda, etc."}
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "플랫폼" : "Platform"}
                    </label>
                    <select
                      value={icalPlatform}
                      onChange={(e) => setIcalPlatform(e.target.value)}
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      <option value="">{currentLanguage === "ko" ? "선택 안 함" : "None"}</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="agoda">Agoda</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="other">{currentLanguage === "ko" ? "기타" : "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "캘린더 이름" : "Calendar name"}
                    </label>
                    <input
                      type="text"
                      value={icalCalendarName}
                      onChange={(e) => setIcalCalendarName(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: 에어비앤비 예약" : "e.g. Airbnb"}
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>iCal URL (.ics)</label>
                    <input
                      type="url"
                      value={icalUrl}
                      onChange={(e) => setIcalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
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
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "📸 추천 사진 가이드라인"
                : currentLanguage === "vi"
                  ? "📸 Hướng dẫn ảnh đề xuất"
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
                      : "Window View"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              {currentLanguage === "ko"
                ? "아무 곳이나 터치하여 카메라를 시작하세요"
                : currentLanguage === "vi"
                  ? "Chạm vào bất kỳ đâu để bắt đầu camera"
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
                  : "Agree"}
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

      {/* ===== 조건부 하단 네비게이션 바 ===== */}
      <nav 
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-40"
        style={{ backgroundColor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center justify-around py-2">
          {isOwnerMode ? (
            // 임대인 모드: 홈 / 매물 등록 / 매물관리 / 채팅 / 프로필
            <>
              <button
                onClick={() => router.push("/")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "홈" : "Home"}
                </span>
              </button>
              <button
                onClick={() => router.push("/add-property")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
                <span className="text-[10px] font-medium" style={{ color: COLORS.primary }}>
                  {currentLanguage === "ko" ? "매물등록" : "Add"}
                </span>
              </button>
              <button
                onClick={() => router.push("/profile/my-properties")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Building className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "매물관리" : "Manage"}
                </span>
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <MessageCircle className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "채팅" : "Chat"}
                </span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <User className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "프로필" : "Profile"}
                </span>
              </button>
            </>
          ) : (
            // 임차인 모드: 홈 / 지도로 검색 / 찜 / 예약 / 프로필
            <>
              <button
                onClick={() => router.push("/")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "홈" : "Home"}
                </span>
              </button>
              <button
                onClick={() => router.push("/map")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Map className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "지도검색" : "Map"}
                </span>
              </button>
              <button
                onClick={() => router.push("/wishlist")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Heart className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "찜" : "Wish"}
                </span>
              </button>
              <button
                onClick={() => router.push("/my-bookings")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <Calendar className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "예약" : "Bookings"}
                </span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]"
              >
                <User className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {currentLanguage === "ko" ? "프로필" : "Profile"}
                </span>
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
