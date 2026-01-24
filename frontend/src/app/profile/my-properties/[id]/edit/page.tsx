/**
 * 매물 수정 페이지
 *
 * - 기존 매물 데이터를 불러와서 폼에 채움
 * - 수정 완료 버튼 클릭 시 DB에 저장
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getProperty,
  updateProperty,
  restoreProperty,
  permanentlyDeleteProperty,
} from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { getPropertyBookings } from "@/lib/api/bookings";
import {
  searchPlaceIndexForSuggestions,
  searchPlaceIndexForText,
  getLocationServiceLanguage,
} from "@/lib/api/aws-location";
import {
  Camera,
  MapPin,
  Loader2,
  X,
  Maximize2,
  ArrowLeft,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";

import { AMENITY_OPTIONS } from "@/lib/constants/amenities";
import { formatFullPrice } from "@/lib/utils/propertyUtils";
import { parseDate } from "@/lib/utils/dateUtils";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const fromDeletedTab = searchParams.get("tab") === "deleted";
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [propertyLoaded, setPropertyLoaded] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] =
    useState(false);

  // 폼 상태
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [apartmentName, setApartmentName] = useState("");
  const [buildingNumber, setBuildingNumber] = useState(""); // 동
  const [roomNumber, setRoomNumber] = useState(""); // 호실
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [maxAdults, setMaxAdults] = useState(1);
  const [maxChildren, setMaxChildren] = useState(0);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  // 임대 희망 날짜
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [bookedRanges, setBookedRanges] = useState<
    { checkIn: Date; checkOut: Date }[]
  >([]);

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
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // AWS Location Service 주소 자동완성
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 기존 매물 데이터 로드 (한 번만 실행)
  useEffect(() => {
    // 이미 로드되었으면 실행하지 않음
    if (propertyLoaded) return;

    if (!authLoading && user && propertyId) {
      const loadProperty = async () => {
        try {
          const property = await getProperty(propertyId);

          if (!property) {
            alert(
              currentLanguage === "ko"
                ? "매물을 찾을 수 없습니다."
                : currentLanguage === "vi"
                  ? "Không tìm thấy bất động sản."
                  : "Property not found.",
            );
            router.push("/profile/my-properties");
            return;
          }

          // 삭제되었거나 광고 종료된 매물인지 확인
          const isExpOrDel = property.deleted || property.status !== "active";
          setIsDeleted(isExpOrDel);

          // 본인의 매물인지 확인
          if (property.ownerId !== user.uid) {
            alert(
              currentLanguage === "ko"
                ? "권한이 없습니다."
                : currentLanguage === "vi"
                  ? "Không có quyền."
                  : "No permission.",
            );
            router.push("/profile/my-properties");
            return;
          }

          // 기존 데이터로 폼 채우기 (한 번만)
          setAddress(property.address || "");
          setWeeklyRent(
            property.price ? property.price.toString().replace(/\D/g, "") : "",
          );
          setSelectedAmenities(property.amenities || []);
          setCoordinates(property.coordinates);

          // 동호수 분리
          if (property.unitNumber) {
            const unitMatch = property.unitNumber.match(/(\S+)동\s*(\S+)호/);
            if (unitMatch) {
              setBuildingNumber(unitMatch[1]);
              setRoomNumber(unitMatch[2]);
            } else {
              const buildingMatch = property.unitNumber.match(/(\S+)동/);
              const roomMatch = property.unitNumber.match(/(\S+)호/);
              if (buildingMatch) setBuildingNumber(buildingMatch[1]);
              if (roomMatch) setRoomNumber(roomMatch[1]);
            }
          }

          // 이미지 URL을 미리보기로 설정
          if (property.images && property.images.length > 0) {
            setImagePreviews(property.images);
          }

          // 인원 수 로드
          setMaxAdults(property.maxAdults || 1);
          setMaxChildren(property.maxChildren || 0);

          // 방/화장실 수 로드
          setBedrooms(property.bedrooms || 1);
          setBathrooms(property.bathrooms || 1);

          // 날짜 로드 (ISO 문자열을 Date 객체로 변환)
          // 날짜 파싱 (ISO 문자열 또는 Date 객체 대응)
          const propCheckInDate = parseDate(property.checkInDate);
          const propCheckOutDate = parseDate(property.checkOutDate);

          if (propCheckInDate) setCheckInDate(propCheckInDate);
          if (propCheckOutDate) setCheckOutDate(propCheckOutDate);

          // 예약 정보 로드
          const bookings = await getPropertyBookings(propertyId);
          const ranges = bookings.map((b) => ({
            checkIn: new Date(b.checkInDate),
            checkOut: new Date(b.checkOutDate),
          }));
          setBookedRanges(ranges);

          // 데이터 로드 완료 플래그 설정 (한 번만 로드되도록)
          setPropertyLoaded(true);
        } catch (error) {
          alert(
            currentLanguage === "ko"
              ? "매물 정보를 불러오는 중 오류가 발생했습니다."
              : currentLanguage === "vi"
                ? "Đã xảy ra lỗi khi tải thông tin bất động sản."
                : "Error loading property information.",
          );
          router.push("/profile/my-properties");
        } finally {
          setLoadingProperty(false);
        }
      };

      loadProperty();
    }
  }, [propertyId, user, authLoading, router]);

  // 주소 입력 시 추천 목록 가져오기 (AWS Location Service)
  const handleAddressInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setAddress(value);

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 디바운싱: 300ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const language = getLocationServiceLanguage(currentLanguage);
        const suggestions = await searchPlaceIndexForSuggestions(
          value,
          language as any,
        );
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // 추천 주소 선택
  const handleSelectSuggestion = async (suggestion: any) => {
    const text = suggestion.Text || "";
    setAddress(text);
    setShowSuggestions(false);
    setAddressSuggestions([]);

    try {
      // 선택한 주소의 상세 정보 가져오기
      const language = getLocationServiceLanguage(currentLanguage);
      const results = await searchPlaceIndexForText(text, language);

      if (results.length > 0) {
        const result = results[0];
        const position = result.Place?.Geometry?.Point || [];

        if (position.length >= 2) {
          setCoordinates({
            lat: position[1], // 위도
            lng: position[0], // 경도
          });
        }

        if (result.Place?.Label) {
          setAddress(result.Place.Label);
        }
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  // 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 사진첩 열기
  const handleOpenPhotoLibrary = () => {
    photoLibraryInputRef.current?.click();
  };

  // 사진첩에서 파일 선택
  const handlePhotoLibraryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoLibraryPreviews(previews);
    setPhotoLibraryFiles(files);
    setSelectedLibraryIndices(new Set());
    setShowPhotoLibrary(true);
    e.target.value = "";
  };

  // 사진첩에서 사진 선택/해제
  const togglePhotoSelection = (index: number) => {
    const maxSelectable = 5 - imagePreviews.length;
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

    const remainingSlots = 5 - imagePreviews.length;
    if (remainingSlots === 0) return;

    const file = files[0];
    const newImages = [...images, file];
    setImages(newImages);

    const preview = URL.createObjectURL(file);
    setImagePreviews([...imagePreviews, preview]);

    e.target.value = "";
  };

  const handleAddImageClick = () => {
    if (imagePreviews.length >= 5) return;
    setShowImageSourceMenu(true);
  };

  const handleSelectFromLibrary = () => {
    setShowImageSourceMenu(false);
    handleOpenPhotoLibrary();
  };

  const handleTakePhoto = () => {
    setShowImageSourceMenu(false);
    cameraInputRef.current?.click();
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // URL 해제 (blob URL인 경우만)
    if (imagePreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 편의시설 선택/해제
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId],
    );
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coordinates) {
      alert(
        currentLanguage === "ko"
          ? "주소를 선택해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng chọn địa chỉ."
            : "Please select an address.",
      );
      return;
    }

    if (imagePreviews.length === 0) {
      alert(
        currentLanguage === "ko"
          ? "최소 1장의 사진이 필요합니다."
          : currentLanguage === "vi"
            ? "Cần ít nhất 1 ảnh."
            : "Please upload at least 1 image.",
      );
      return;
    }

    const rentValue = parseInt(weeklyRent.replace(/\D/g, ""));
    if (isNaN(rentValue) || rentValue <= 0) {
      alert(
        currentLanguage === "ko"
          ? "1주일 임대료를 입력해주세요."
          : currentLanguage === "vi"
            ? "Vui lòng nhập giá thuê 1 tuần."
            : "Please enter weekly rent.",
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

    setLoading(true);
    try {
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

      // 기존 이미지 URL과 새로 추가된 이미지 구분
      // imagePreviews에는 기존 URL(string)과 새로 추가된 File의 preview URL이 섞여있음
      // TODO: 새로 추가된 이미지가 있으면 Firebase Storage에 업로드
      // 지금은 임시로 기존 URL만 유지
      // 기존 이미지 URL (base64 또는 URL)와 새로 추가한 이미지 파일을 base64로 변환
      const existingImageUrls = imagePreviews.filter(
        (url) => typeof url === "string" && !url.startsWith("blob:"),
      );
      const newImageFiles = images.filter((img) => img instanceof File);

      // 새 이미지를 base64로 변환
      const newImageBase64s: string[] = [];
      for (const file of newImageFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImageBase64s.push(base64);
      }

      // 기존 이미지와 새 이미지 합치기
      const imageUrls = [...existingImageUrls, ...newImageBase64s];

      // 날짜를 저장 (null이면 undefined로 변환하여 기존 값 유지)
      const updates: any = {
        title: apartmentName || address,
        original_description: publicAddress, // 동호수 제외
        price: parseInt(weeklyRent.replace(/\D/g, "")),
        priceUnit: "vnd",
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        coordinates,
        address: publicAddress, // 동호수 제외
        images: imageUrls,
        amenities: selectedAmenities,
        unitNumber: unitNumber, // 동호수 (예약 완료 후에만 표시, 비공개)
        maxAdults: maxAdults,
        maxChildren: maxChildren,
      };

      // 날짜는 Date 객체로 전달 (updateProperty에서 ISO 문자열로 변환됨)
      if (checkInDate !== null && checkInDate !== undefined) {
        updates.checkInDate = checkInDate;
      } else {
        updates.checkInDate = undefined;
      }

      if (checkOutDate !== null && checkOutDate !== undefined) {
        updates.checkOutDate = checkOutDate;
      } else {
        updates.checkOutDate = undefined;
      }

      console.log("Updating property with dates:", {
        checkInDate: updates.checkInDate,
        checkOutDate: updates.checkOutDate,
      });

      // 삭제된 매물인 경우 복구(재등록)
      if (isDeleted) {
        await restoreProperty(propertyId);
        await updateProperty(propertyId, updates);
        alert(
          currentLanguage === "ko"
            ? "매물이 성공적으로 재등록되었습니다!"
            : currentLanguage === "vi"
              ? "Bất động sản đã được đăng lại thành công!"
              : "Property re-registered successfully!",
        );
        // 재등록 후 매물 관리창으로 이동
        router.replace("/profile/my-properties");
      } else {
        await updateProperty(propertyId, updates);
        alert(
          currentLanguage === "ko"
            ? "매물이 성공적으로 수정되었습니다!"
            : currentLanguage === "vi"
              ? "Bất động sản đã được cập nhật thành công!"
              : "Property updated successfully!",
        );
        // 수정 후 상세 페이지로 이동
        router.replace(`/profile/my-properties/${propertyId}`);
      }
    } catch (error) {
      alert(
        currentLanguage === "ko"
          ? "매물 수정 중 오류가 발생했습니다."
          : currentLanguage === "vi"
            ? "Đã xảy ra lỗi khi cập nhật bất động sản."
            : "An error occurred while updating the property.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProperty) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        <div className="px-6 py-6">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => {
                if (fromDeletedTab || isDeleted) {
                  router.push("/profile/my-properties?tab=deleted");
                } else {
                  router.push("/profile/my-properties");
                }
              }}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === "ko"
                  ? "뒤로"
                  : currentLanguage === "vi"
                    ? "Quay lại"
                    : "Back"}
              </span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentLanguage === "ko"
                ? "매물 수정"
                : currentLanguage === "vi"
                  ? "Chỉnh sửa bất động sản"
                  : "Edit Property"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko"
                  ? "사진 등록"
                  : currentLanguage === "vi"
                    ? "Đăng ảnh"
                    : "Upload Photos"}
                <span className="text-red-500 text-xs ml-1">*</span>
                <span className="text-gray-500 text-xs ml-2">
                  ({imagePreviews.length}/5)
                </span>
              </label>
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
                {imagePreviews.length < 5 && (
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
                  </>
                )}
              </div>

              {/* 숨겨진 input */}
              <input
                ref={photoLibraryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoLibraryChange}
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

              {/* 이미지 소스 선택 메뉴 */}
              {showImageSourceMenu && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                  <div className="w-full bg-white rounded-t-3xl p-6">
                    <h3 className="text-lg font-bold mb-4 text-center">
                      {currentLanguage === "ko"
                        ? "사진 추가"
                        : currentLanguage === "vi"
                          ? "Thêm ảnh"
                          : "Add Photo"}
                    </h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleSelectFromLibrary}
                        className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        {currentLanguage === "ko"
                          ? "사진첩에서 선택"
                          : currentLanguage === "vi"
                            ? "Chọn từ thư viện"
                            : "Select from Library"}
                      </button>
                      <button
                        type="button"
                        onClick={handleTakePhoto}
                        className="w-full py-4 px-4 bg-gray-200 text-gray-900 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                      >
                        {currentLanguage === "ko"
                          ? "카메라로 촬영"
                          : currentLanguage === "vi"
                            ? "Chụp ảnh"
                            : "Take Photo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageSourceMenu(false)}
                        className="w-full py-4 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
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

              {/* 사진첩 모달 */}
              {showPhotoLibrary && (
                <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                  {fullScreenImageIndex === null ? (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <h3 className="text-white font-semibold">
                          {currentLanguage === "ko"
                            ? "사진 선택"
                            : currentLanguage === "vi"
                              ? "Chọn ảnh"
                              : "Select Photos"}
                        </h3>
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
                          }}
                          className="text-white"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-3 gap-2">
                          {photoLibraryPreviews.map((preview, index) => {
                            const isSelected =
                              selectedLibraryIndices.has(index);
                            return (
                              <div
                                key={index}
                                onClick={() => togglePhotoSelection(index)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                                  isSelected
                                    ? "border-blue-500"
                                    : "border-transparent"
                                }`}
                              >
                                <img
                                  src={preview}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">
                                        ✓
                                      </span>
                                    </div>
                                  </div>
                                )}
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

                      <div className="p-4 border-t border-gray-800">
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
                  ) : (
                    <div className="flex-1 flex items-center justify-center relative">
                      <img
                        src={photoLibraryPreviews[fullScreenImageIndex]}
                        alt={`Full screen ${fullScreenImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
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
                      <button
                        type="button"
                        onClick={handleBackToLibrary}
                        className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 주소 입력 (자동완성) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko"
                  ? "주소 입력 (자동완성)"
                  : currentLanguage === "vi"
                    ? "Nhập địa chỉ (Tự động hoàn thành)"
                    : "Enter Address (Autocomplete)"}
                <span className="text-red-500 text-xs ml-1">*</span>
                {coordinates && (
                  <span className="ml-2 text-green-600 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentLanguage === "ko"
                      ? "선택됨"
                      : currentLanguage === "vi"
                        ? "Đã chọn"
                        : "Selected"}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={address}
                  onChange={handleAddressInputChange}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder={
                    currentLanguage === "ko"
                      ? "주소를 입력하세요 (예: 41 hoang sa)"
                      : currentLanguage === "vi"
                        ? "Nhập địa chỉ (VD: 41 hoang sa)"
                        : "Enter address (e.g., 41 hoang sa)"
                  }
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />

                {/* 추천 주소 드롭다운 */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.PlaceId || index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.Text}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {apartmentName && (
                <p className="mt-2 text-sm text-gray-600">
                  {currentLanguage === "ko"
                    ? "아파트 이름"
                    : currentLanguage === "vi"
                      ? "Tên chung cư"
                      : "Apartment Name"}
                  : {apartmentName}
                </p>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* 동호수 입력 */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko"
                  ? "동호수"
                  : currentLanguage === "vi"
                    ? "Số phòng"
                    : "Unit Number"}
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
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
                      currentLanguage === "ko"
                        ? "예: A, 1"
                        : currentLanguage === "vi"
                          ? "VD: A, 1"
                          : "e.g., A, 1"
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {currentLanguage === "ko"
                      ? "호실"
                      : currentLanguage === "vi"
                        ? "Phòng"
                        : "Room"}
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder={
                      currentLanguage === "ko"
                        ? "예: 101, 201"
                        : currentLanguage === "vi"
                          ? "VD: 101, 201"
                          : "e.g., 101, 201"
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {currentLanguage === "ko"
                  ? "동호수는 예약이 완료된 이후에 임차인에게만 표시됩니다."
                  : currentLanguage === "vi"
                    ? "Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ hoàn tất."
                    : "Unit number will only be displayed to tenants after booking is completed."}
              </p>
            </div>

            {/* 임대 희망 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko"
                  ? "임대 희망 날짜"
                  : currentLanguage === "vi"
                    ? "Ngày cho thuê mong muốn"
                    : "Desired Rental Dates"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 체크인 날짜 */}
                <button
                  type="button"
                  onClick={() => {
                    setCalendarMode("checkin");
                    setShowCalendar(true);
                  }}
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
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
                                let date: Date;
                                if (checkInDate instanceof Date) {
                                  date = checkInDate;
                                } else if (typeof checkInDate === "string") {
                                  date = new Date(checkInDate);
                                } else {
                                  return currentLanguage === "ko"
                                    ? "날짜 선택"
                                    : currentLanguage === "vi"
                                      ? "Chọn ngày"
                                      : "Select date";
                                }
                                if (isNaN(date.getTime())) {
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
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200"
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
            </div>

            {/* 1주일 임대료 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko"
                  ? "1주일 임대료"
                  : currentLanguage === "vi"
                    ? "Giá thuê 1 tuần"
                    : "Weekly Rent"}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
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
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <span className="text-gray-600 font-medium">VND</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentLanguage === "ko"
                  ? "공과금/관리비 포함"
                  : currentLanguage === "vi"
                    ? "Bao gồm tiện ích/phí quản lý"
                    : "Utilities/Management fees included"}
              </p>
            </div>

            {/* 방/화장실 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko"
                  ? "방/화장실 수"
                  : currentLanguage === "vi"
                    ? "Số phòng/phòng tắm"
                    : "Bedrooms/Bathrooms"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 침실 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "침실"
                          : currentLanguage === "vi"
                            ? "Phòng ngủ"
                            : "Bedrooms"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {bedrooms}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBedrooms(bedrooms + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 화장실 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "화장실"
                          : currentLanguage === "vi"
                            ? "Phòng tắm"
                            : "Bathrooms"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {bathrooms}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBathrooms(bathrooms + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 편의시설 옵션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko"
                  ? "편의시설"
                  : currentLanguage === "vi"
                    ? "Tiện ích"
                    : "Amenities"}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map((amenity) => {
                  const Icon = amenity.icon;
                  const isSelected = selectedAmenities.includes(amenity.id);
                  const langKey = currentLanguage as "ko" | "vi" | "en";
                  const label =
                    (amenity.label as any)[langKey] || amenity.label.en;

                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isSelected ? "text-blue-600" : "text-gray-400"}`}
                      />
                      <span className="text-xs font-medium text-center">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 최대 인원 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko"
                  ? "최대 인원 수"
                  : currentLanguage === "vi"
                    ? "Số người tối đa"
                    : "Maximum Guests"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 성인 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "성인"
                          : currentLanguage === "vi"
                            ? "Người lớn"
                            : "Adults"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {maxAdults}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMaxAdults(Math.max(1, maxAdults - 1))}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaxAdults(maxAdults + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 어린이 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko"
                          ? "어린이"
                          : currentLanguage === "vi"
                            ? "Trẻ em"
                            : "Children"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {maxChildren}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMaxChildren(Math.max(0, maxChildren - 1))
                      }
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaxChildren(maxChildren + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 수정완료/재등록 버튼 */}
            <button
              type="submit"
              disabled={
                loading ||
                !coordinates ||
                imagePreviews.length === 0 ||
                !weeklyRent
              }
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isDeleted
                      ? currentLanguage === "ko"
                        ? "재등록 중..."
                        : currentLanguage === "vi"
                          ? "Đang đăng lại..."
                          : "Re-registering..."
                      : currentLanguage === "ko"
                        ? "수정 중..."
                        : currentLanguage === "vi"
                          ? "Đang cập nhật..."
                          : "Updating..."}
                  </span>
                </>
              ) : (
                <span>
                  {isDeleted
                    ? currentLanguage === "ko"
                      ? "재등록"
                      : currentLanguage === "vi"
                        ? "Đăng lại"
                        : "Re-register"
                    : currentLanguage === "ko"
                      ? "수정완료"
                      : currentLanguage === "vi"
                        ? "Hoàn thành"
                        : "Update Complete"}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 영구 삭제 확인 모달 */}
      {showPermanentDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {currentLanguage === "ko"
                ? "매물 영구 삭제"
                : currentLanguage === "vi"
                  ? "Xóa vĩnh viễn bất động sản"
                  : "Permanently Delete Property"}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLanguage === "ko"
                ? "이 매물을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                : currentLanguage === "vi"
                  ? "Bạn có chắc chắn muốn xóa vĩnh viễn bất động sản này? Hành động này không thể hoàn tác."
                  : "Are you sure you want to permanently delete this property? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermanentDeleteConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                {currentLanguage === "ko"
                  ? "취소"
                  : currentLanguage === "vi"
                    ? "Hủy"
                    : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    // 삭제 기록에 사용자 ID 포함
                    await permanentlyDeleteProperty(propertyId, user?.uid);
                    alert(
                      currentLanguage === "ko"
                        ? "매물이 영구적으로 삭제되었습니다."
                        : currentLanguage === "vi"
                          ? "Bất động sản đã được xóa vĩnh viễn."
                          : "Property has been permanently deleted.",
                    );
                    router.replace("/profile/my-properties");
                  } catch (error) {
                    alert(
                      currentLanguage === "ko"
                        ? "매물 영구 삭제 중 오류가 발생했습니다."
                        : currentLanguage === "vi"
                          ? "Đã xảy ra lỗi khi xóa vĩnh viễn bất động sản."
                          : "An error occurred while permanently deleting the property.",
                    );
                  } finally {
                    setLoading(false);
                    setShowPermanentDeleteConfirm(false);
                  }
                }}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? currentLanguage === "ko"
                    ? "삭제 중..."
                    : currentLanguage === "vi"
                      ? "Đang xóa..."
                      : "Deleting..."
                  : currentLanguage === "ko"
                    ? "영구 삭제"
                    : currentLanguage === "vi"
                      ? "Xóa vĩnh viễn"
                      : "Permanently Delete"}
              </button>
            </div>
          </div>
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
              currentLanguage={currentLanguage as "ko" | "vi" | "en"}
              onClose={() => setShowCalendar(false)}
              mode={calendarMode}
              bookedRanges={bookedRanges}
              isOwnerMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
