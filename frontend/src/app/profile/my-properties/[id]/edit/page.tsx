"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getProperty,
  updateProperty,
  restoreProperty,
} from "@/lib/api/properties";
import { getPropertyBookings } from "@/lib/api/bookings";
import {
  Camera,
  MapPin,
  Loader2,
  X,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import { FACILITY_OPTIONS, FACILITY_CATEGORIES, FULL_OPTION_KITCHEN_IDS, FULL_FURNITURE_IDS, FULL_ELECTRONICS_IDS } from "@/lib/constants/facilities";
import { parseDate } from "@/lib/utils/dateUtils";
import { getUIText } from "@/utils/i18n";
import {
  getDistrictIdForCoord,
  getDistrictsByCityId,
  searchRegions,
  VIETNAM_CITIES,
  ALL_REGIONS,
} from "@/lib/data/vietnam-regions";
import { uploadToS3 } from "@/lib/s3-client";

// 1. 모든 비즈니스 로직을 담은 내부 컴포넌트
function EditPropertyContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const fromDeletedTab = searchParams.get("tab") === "deleted";
  const fromModal = searchParams.get("from") === "modal";
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [propertyLoaded, setPropertyLoaded] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // --- 폼 상태 (원본 보존) ---
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [apartmentName, setApartmentName] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
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

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [bookedRanges, setBookedRanges] = useState<
    { checkIn: Date; checkOut: Date }[]
  >([]);

  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [propertyType, setPropertyType] = useState<
    "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached"
  >("");
  const [cleaningPerWeek, setCleaningPerWeek] = useState(1);
  const [maxPets, setMaxPets] = useState(1);
  const [petFeeAmount, setPetFeeAmount] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [icalPlatform, setIcalPlatform] = useState("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);

  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>(
    [],
  );
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<
    Set<number>
  >(new Set());
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const parseUnitNumber = (unitNumber: string | undefined) => {
    if (!unitNumber || !unitNumber.trim()) return { building: "", room: "" };
    const match = unitNumber.match(/^(.+?)동\s*(.+?)호$/);
    if (match) {
      const room = match[2].replace(/^0+/, "") || match[2];
      return { building: match[1].trim(), room };
    }
    return { building: "", room: "" };
  };

  useEffect(() => {
    if (!selectedCityId || !selectedDistrictId) return;
    const districts = getDistrictsByCityId(selectedCityId);
    if (!districts.some((d) => d.id === selectedDistrictId)) {
      setSelectedDistrictId("");
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (!propertyType) return;
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
    if (propertyLoaded || authLoading || !user || !propertyId) return;
    const loadData = async () => {
      try {
        const p = await getProperty(propertyId);
        if (!p) {
          router.push("/profile/my-properties");
          return;
        }

        setIsDeleted(!!p.deleted || p.status !== "active");
        setAddress(p.address || "");
        setWeeklyRent(p.price?.toString() || "");
        setSelectedAmenities(p.amenities || []);
        setCoordinates(p.coordinates || null);
        setImagePreviews(p.images || []);
        setMaxAdults(p.maxAdults ?? 1);
        setMaxChildren(p.maxChildren ?? 0);
        setBedrooms(p.bedrooms ?? 1);
        setBathrooms(p.bathrooms ?? 1);
        setCheckInDate(parseDate(p.checkInDate));
        setCheckOutDate(parseDate(p.checkOutDate));
        const pt = (p as { propertyType?: string }).propertyType || "";
        setPropertyType(pt as "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached");
        const cleaning = (p as { cleaningPerWeek?: number }).cleaningPerWeek ?? 0;
        setCleaningPerWeek(cleaning > 0 ? cleaning : 1);
        const fee = (p as { petFee?: number }).petFee;
        setPetFeeAmount(fee != null ? fee.toString() : "");
        setMaxPets((p as { maxPets?: number }).maxPets ?? 1);
        setPropertyDescription((p as { original_description?: string }).original_description || "");
        setIcalPlatform(p.icalPlatform || "");
        setIcalCalendarName(p.icalCalendarName || "");
        setIcalUrl(p.icalUrl || "");

        const { building, room } = parseUnitNumber(p.unitNumber);
        setBuildingNumber(building);
        setRoomNumber(room);

        if (p.coordinates) {
          const districtId = getDistrictIdForCoord(p.coordinates.lat, p.coordinates.lng);
          if (districtId) {
            const district = ALL_REGIONS.find((r) => r.id === districtId);
            if (district?.parentCity) {
              setSelectedDistrictId(districtId);
              setSelectedCityId(district.parentCity);
            }
          } else {
            const matches = searchRegions(p.address || "");
            const districtMatch = matches.find((r) => r.type === "district");
            const cityMatch = matches.find((r) => r.type === "city");
            if (districtMatch) {
              setSelectedDistrictId(districtMatch.id);
              setSelectedCityId(districtMatch.parentCity ?? "");
            } else if (cityMatch) {
              setSelectedCityId(cityMatch.id);
              setSelectedDistrictId("");
            }
          }
        }

        const b = await getPropertyBookings(propertyId);
        setBookedRanges(
          b.map((rs) => ({
            checkIn: new Date(rs.checkInDate),
            checkOut: new Date(rs.checkOutDate),
          })),
        );
        setPropertyLoaded(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProperty(false);
      }
    };
    loadData();
  }, [propertyId, user, authLoading, propertyLoaded, router]);

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

  const formatRoomNumber = (room: string) => {
    const num = parseInt(room.replace(/\D/g, ""), 10);
    if (isNaN(num)) return room;
    return num.toString().padStart(4, "0");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinates || !user) {
      alert(
        currentLanguage === "ko" ? "주소를 선택해주세요." :
        currentLanguage === "zh" ? "请选择地址。" :
        currentLanguage === "vi" ? "Vui lòng chọn địa chỉ." :
        currentLanguage === "ja" ? "住所を選択してください。" :
        "Please select address."
      );
      return;
    }
    setLoading(true);

    try {
      const existingUrls = imagePreviews.filter(
        (url) => typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))
      );
      let newUrls: string[] = [];
      if (images.length > 0) {
        newUrls = await Promise.all(
          images.map((file) => uploadToS3(file, "properties"))
        );
      }
      const imageUrls = [...existingUrls, ...newUrls];

      const unitNumber =
        buildingNumber && roomNumber
          ? `${buildingNumber}동 ${formatRoomNumber(roomNumber)}호`
          : buildingNumber
            ? `${buildingNumber}동`
            : roomNumber
              ? `${formatRoomNumber(roomNumber)}호`
              : undefined;

      const publicAddress = `${apartmentName ? `${apartmentName}, ` : ""}${address}`;

      const updates: Partial<import("@/types/property").PropertyData> = {
        title: apartmentName || address,
        original_description: propertyDescription || publicAddress,
        price: parseInt(weeklyRent.replace(/\D/g, "") || "0", 10),
        priceUnit: "vnd",
        area: 0,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        address: publicAddress,
        unitNumber: unitNumber || undefined,
        images: imageUrls,
        amenities: selectedAmenities,
        propertyType: propertyType || undefined,
        cleaningPerWeek: selectedAmenities.includes("cleaning") ? cleaningPerWeek : 0,
        petAllowed: selectedAmenities.includes("pet"),
        ...(selectedAmenities.includes("pet") && { maxPets }),
        petFee: selectedAmenities.includes("pet") && petFeeAmount.trim()
          ? parseInt(petFeeAmount.replace(/\D/g, ""), 10) || undefined
          : undefined,
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren),
        checkInDate: checkInDate ? new Date(checkInDate) : undefined,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
        ...(icalPlatform && { icalPlatform }),
        ...(icalCalendarName.trim() && { icalCalendarName: icalCalendarName.trim() }),
        ...(icalUrl.trim() && { icalUrl: icalUrl.trim() }),
      };

      if (isDeleted) await restoreProperty(propertyId);
      await updateProperty(propertyId, updates);

      alert(
        currentLanguage === "ko" ? "수정 완료!" :
        currentLanguage === "zh" ? "修改完成！" :
        currentLanguage === "vi" ? "Chỉnh sửa hoàn tất!" :
        currentLanguage === "ja" ? "編集完了！" :
        "Updated!"
      );
      router.push("/profile/my-properties");
    } catch (err) {
      console.error("Update failed:", err);
      const errorMessage = (err as any).message || String(err);
      alert(
        currentLanguage === "ko" ? `오류가 발생했습니다: ${errorMessage}` :
        currentLanguage === "zh" ? `发生错误: ${errorMessage}` :
        currentLanguage === "vi" ? `Đã xảy ra lỗi: ${errorMessage}` :
        currentLanguage === "ja" ? `エラーが発生しました: ${errorMessage}` :
        `Error occurred: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProperty)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
        <div className="p-6 overflow-y-auto">
          <button
            onClick={() => {
              // 모달 상세에서 들어온 경우: 뒤로 시 my-properties + 해당 매물 모달 다시 열기
              if (fromModal && propertyId) {
                router.push(`/profile/my-properties?open=${propertyId}`);
                return;
              }
              router.back();
            }}
            className="flex items-center gap-2 mb-4 text-gray-600"
          >
            <ArrowLeft size={20} /> {getUIText('back', currentLanguage)}
          </button>
          <h1 className="text-2xl font-bold mb-6">
            {currentLanguage === "ko" ? "매물 수정" : 
             currentLanguage === "zh" ? "编辑房产" : 
             currentLanguage === "vi" ? "Chỉnh sửa bất động sản" :
             currentLanguage === "ja" ? "物件編集" : "Edit Property"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 사진 등록 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko" ? "사진 등록" : currentLanguage === "vi" ? "Đăng ảnh" : "Upload Photos"}
                <span className="text-red-500 text-xs ml-1">*</span>
                <span className="text-gray-500 text-xs ml-2">({imagePreviews.length}/5)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
                  >
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const removed = imagePreviews[index];
                        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
                        if (removed?.startsWith("blob:")) {
                          const newIndex = imagePreviews.slice(0, index).filter((u) => u.startsWith("blob:")).length;
                          setImages((prev) => prev.filter((_, i) => i !== newIndex));
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setShowImageSourceMenu(true)}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">{currentLanguage === "ko" ? "추가" : currentLanguage === "vi" ? "Thêm" : "Add"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 매물 종류 */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {currentLanguage === "ko" ? "매물 종류" : currentLanguage === "vi" ? "Loại bất động sản" : "Property Type"}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "studio", ko: "스튜디오", vi: "Studio", en: "Studio" },
                    { value: "one_room", ko: "원룸(방·거실 분리)", vi: "1 phòng", en: "1 Room" },
                    { value: "two_room", ko: "2룸", vi: "2 phòng", en: "2 Rooms" },
                    { value: "three_plus", ko: "3+룸", vi: "3+ phòng", en: "3+ Rooms" },
                    { value: "detached", ko: "독채", vi: "Nhà riêng", en: "Detached" },
                  ] as const
                ).map(({ value, ko, vi, en }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPropertyType(value)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      propertyType === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {currentLanguage === "ko" ? ko : currentLanguage === "vi" ? vi : en}
                  </button>
                ))}
              </div>
              {propertyType && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      disabled={propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 ${
                        propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"
                          ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {(() => {
                        const opts = propertyType === "studio" || propertyType === "one_room" ? [1]
                          : propertyType === "two_room" ? [2]
                          : propertyType === "three_plus" ? [2, 3, 4, 5]
                          : propertyType === "detached" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [];
                        return opts.map((n) => (
                          <option key={n} value={n}>{n === 5 && propertyType === "three_plus" ? "5+" : n}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {currentLanguage === "ko" ? "화장실 수" : currentLanguage === "vi" ? "Số phòng tắm" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {(() => {
                        const opts = propertyType === "studio" || propertyType === "one_room" ? [1, 2]
                          : propertyType === "two_room" ? [1, 2, 3]
                          : propertyType === "three_plus" ? [1, 2, 3, 4, 5, 6]
                          : propertyType === "detached" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [];
                        return opts.map((n) => (
                          <option key={n} value={n}>{n === 6 && propertyType === "three_plus" ? "5+" : n}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {currentLanguage === "ko" ? "최대 인원" : currentLanguage === "vi" ? "Số người tối đa" : "Max Guests"}
                    </label>
                    <select
                      value={maxAdults}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxAdults(v);
                        setMaxChildren(0);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko" ? "주소" : currentLanguage === "vi" ? "Địa chỉ" : "Address"}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              {(!address || !coordinates) && (
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="w-full px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 font-medium bg-blue-500 text-white hover:bg-blue-600"
                >
                  <MapPin className="w-5 h-5" />
                  <span>{currentLanguage === "ko" ? "주소 찾기" : currentLanguage === "vi" ? "Tìm địa chỉ" : "Find Address"}</span>
                </button>
              )}
              {address && coordinates && (
                <div
                  className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl cursor-pointer hover:bg-green-100"
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-700 mb-1">
                        {currentLanguage === "ko" ? "확정된 주소 (클릭하여 수정)" : currentLanguage === "vi" ? "Địa chỉ đã xác nhận" : "Confirmed Address"}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{address}</p>
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
                      className="p-1.5 hover:bg-green-200 rounded-full"
                      aria-label={currentLanguage === "ko" ? "주소 삭제" : "Remove address"}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 도시·구 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {currentLanguage === "ko" ? "도시" : currentLanguage === "vi" ? "Thành phố" : "City"}
                </label>
                <div className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm ${address && coordinates ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
                  {address && coordinates && selectedCityId
                    ? (() => {
                        const city = VIETNAM_CITIES.find((c) => c.id === selectedCityId);
                        if (!city) return "—";
                        const langMap: Record<string, string> = { ko: city.nameKo, vi: city.nameVi, en: city.name, ja: city.nameJa ?? city.name, zh: city.nameZh ?? city.name };
                        return langMap[currentLanguage] ?? city.name;
                      })()
                    : (currentLanguage === "ko" ? "주소 입력 후 자동" : currentLanguage === "vi" ? "Tự động sau địa chỉ" : "Auto after address")}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {currentLanguage === "ko" ? "구" : currentLanguage === "vi" ? "Quận" : "District"}
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  disabled={!address || !coordinates}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 ${
                    address && coordinates ? "bg-gray-50 border-gray-200" : "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <option value="">{currentLanguage === "ko" ? "선택" : currentLanguage === "vi" ? "Chọn" : "Select"}</option>
                  {getDistrictsByCityId(selectedCityId).map((d) => {
                    const langMap: Record<string, string> = { ko: d.nameKo, vi: d.nameVi, en: d.name, ja: d.nameJa ?? d.name, zh: d.nameZh ?? d.name };
                    return <option key={d.id} value={d.id}>{langMap[currentLanguage] ?? d.name}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* 동호수 입력 (동, 호실 분리) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko" ? "동호수" : 
                 currentLanguage === "zh" ? "房号" : 
                 currentLanguage === "vi" ? "Số phòng" :
                 currentLanguage === "ja" ? "部屋番号" : "Unit Number"}
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* 동 입력 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {currentLanguage === "ko" ? "동" : 
                     currentLanguage === "zh" ? "栋" : 
                     currentLanguage === "vi" ? "Tòa" :
                     currentLanguage === "ja" ? "棟" : "Building"}
                  </label>
                  <input
                    type="text"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder={
                      currentLanguage === "ko" ? "예: A, 1" : 
                      currentLanguage === "zh" ? "例如: A, 1" : 
                      currentLanguage === "vi" ? "VD: A, 1" :
                      currentLanguage === "ja" ? "例: A, 1" : "e.g., A, 1"
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                {/* 호실 입력 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {currentLanguage === "ko" ? "호실" : 
                     currentLanguage === "zh" ? "房间" : 
                     currentLanguage === "vi" ? "Phòng" :
                     currentLanguage === "ja" ? "号室" : "Room"}
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder={
                      currentLanguage === "ko" ? "예: 101, 301" : 
                      currentLanguage === "zh" ? "例如: 101, 301" : 
                      currentLanguage === "vi" ? "VD: 101, 301" :
                      currentLanguage === "ja" ? "例: 101, 301" : "e.g., 101, 301"
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <span className="text-blue-600">ℹ️</span>
                <span>
                  {currentLanguage === "ko" ? "동호수는 예약이 완료된 이후에 임차인에게만 표시됩니다." : 
                   currentLanguage === "zh" ? "房号仅在预订完成后对租客显示。" : 
                   currentLanguage === "vi" ? "Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ được hoàn thành." :
                   currentLanguage === "ja" ? "部屋番号は予約完了後にのみ借主に表示されます。" : "Unit number will only be visible to tenants after booking is completed."}
                </span>
              </p>
            </div>

            {/* 임대 희망 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko" ? "임대 희망 날짜" : 
                 currentLanguage === "zh" ? "期望租赁日期" : 
                 currentLanguage === "vi" ? "Ngày cho thuê mong muốn" :
                 currentLanguage === "ja" ? "希望賃貸期間" : "Desired Rental Dates"}
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
                        {currentLanguage === "ko" ? "시작일" : 
                         currentLanguage === "zh" ? "开始日期" : 
                         currentLanguage === "vi" ? "Ngày bắt đầu" :
                         currentLanguage === "ja" ? "開始日" : "Start Date"}
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
                                  return currentLanguage === "ko" ? "날짜 선택" : 
                                         currentLanguage === "zh" ? "选择日期" : 
                                         currentLanguage === "vi" ? "Chọn ngày" :
                                         currentLanguage === "ja" ? "日付を選択" : "Select date";
                                }
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                if (isNaN(month) || isNaN(day)) {
                                  return currentLanguage === "ko" ? "날짜 선택" : 
                                         currentLanguage === "zh" ? "选择日期" : 
                                         currentLanguage === "vi" ? "Chọn ngày" :
                                         currentLanguage === "ja" ? "日付を選択" : "Select date";
                                }
                                return date.toLocaleDateString(
                                  currentLanguage === "ko" ? "ko-KR" : 
                                  currentLanguage === "zh" ? "zh-CN" : 
                                  currentLanguage === "vi" ? "vi-VN" :
                                  currentLanguage === "ja" ? "ja-JP" : "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                              } catch {
                                return currentLanguage === "ko" ? "날짜 선택" : 
                                       currentLanguage === "zh" ? "选择日期" : 
                                       currentLanguage === "vi" ? "Chọn ngày" :
                                       currentLanguage === "ja" ? "日付を選択" : "Select date";
                              }
                            })()
                          : currentLanguage === "ko" ? "날짜 선택" : 
                            currentLanguage === "zh" ? "选择日期" : 
                            currentLanguage === "vi" ? "Chọn ngày" :
                            currentLanguage === "ja" ? "日付を選択" : "Select date"}
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
                        {currentLanguage === "ko" ? "종료일" : 
                         currentLanguage === "zh" ? "结束日期" : 
                         currentLanguage === "vi" ? "Ngày kết thúc" :
                         currentLanguage === "ja" ? "終了日" : "End Date"}
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
                                  return currentLanguage === "ko" ? "날짜 선택" : 
                                         currentLanguage === "zh" ? "选择日期" : 
                                         currentLanguage === "vi" ? "Chọn ngày" :
                                         currentLanguage === "ja" ? "日付を選択" : "Select date";
                                }
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                if (isNaN(month) || isNaN(day)) {
                                  return currentLanguage === "ko" ? "날짜 선택" : 
                                         currentLanguage === "zh" ? "选择日期" : 
                                         currentLanguage === "vi" ? "Chọn ngày" :
                                         currentLanguage === "ja" ? "日付を選択" : "Select date";
                                }
                                return date.toLocaleDateString(
                                  currentLanguage === "ko" ? "ko-KR" : 
                                  currentLanguage === "zh" ? "zh-CN" : 
                                  currentLanguage === "vi" ? "vi-VN" :
                                  currentLanguage === "ja" ? "ja-JP" : "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                              } catch {
                                return currentLanguage === "ko" ? "날짜 선택" : 
                                       currentLanguage === "zh" ? "选择日期" : 
                                       currentLanguage === "vi" ? "Chọn ngày" :
                                       currentLanguage === "ja" ? "日付を選択" : "Select date";
                              }
                            })()
                          : currentLanguage === "ko" ? "날짜 선택" : 
                            currentLanguage === "zh" ? "选择日期" : 
                            currentLanguage === "vi" ? "Chọn ngày" :
                            currentLanguage === "ja" ? "日付を選択" : "Select date"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 1주일 임대료 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko" ? "1주일 임대료" : 
                 currentLanguage === "zh" ? "每周租金" : 
                 currentLanguage === "vi" ? "Giá thuê 1 tuần" :
                 currentLanguage === "ja" ? "1週間賃料" : "Weekly Rent"}
                <span className="text-red-500 text-xs ml-1">*</span>
                <span className="text-gray-500 text-xs ml-2 font-normal">
                  (
                  {currentLanguage === "ko" ? "공과금/관리비 포함" : 
                   currentLanguage === "zh" ? "包含水电费/管理费" : 
                   currentLanguage === "vi" ? "Bao gồm phí dịch vụ/quản lý" :
                   currentLanguage === "ja" ? "光熱費・管理費込み" : "Utilities/Management fees included"}
                  )
                </span>
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
            </div>

            {/* 숙소시설 및 정책 — 애완동물 요금, 주당 청소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko" ? "숙소시설 및 정책" : currentLanguage === "vi" ? "Tiện ích và chính sách" : "Facilities & Policy"}
              </label>
              <div className="space-y-4">
                {FACILITY_CATEGORIES.map((cat) => {
                  const options = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
                  const catLabel = (cat.label as any)[currentLanguage] || cat.label.en;
                  const isBadgeCategory = cat.id === "furniture" || cat.id === "electronics" || cat.id === "kitchen";
                  const fullFurniture = cat.id === "furniture" && FULL_FURNITURE_IDS.every((id) => selectedAmenities.includes(id));
                  const fullElectronics = cat.id === "electronics" && FULL_ELECTRONICS_IDS.every((id) => selectedAmenities.includes(id));
                  const fullOptionKitchen = cat.id === "kitchen" && FULL_OPTION_KITCHEN_IDS.every((id) => selectedAmenities.includes(id));
                  return (
                    <div key={cat.id}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="text-xs font-medium text-gray-500">{catLabel}</p>
                        {isBadgeCategory && (
                          <p className="text-[10px] text-gray-500">
                            {currentLanguage === "ko"
                              ? "모든 아이콘 선택시 뱃지 획득"
                              : currentLanguage === "vi"
                                ? "Chọn đủ tất cả để nhận huy hiệu"
                                : "Select all to earn badge"}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {options.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = selectedAmenities.includes(opt.id);
                          const label = (opt.label as any)[currentLanguage] || opt.label.en;
                          const isPet = opt.id === "pet";
                          const isCleaning = opt.id === "cleaning";
                          return (
                            <div key={opt.id} className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAmenities((prev) =>
                                    prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                                  )
                                }
                                className={`w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                  isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
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
                                      <option key={n} value={n}>{n}{currentLanguage === "ko" ? "회" : currentLanguage === "vi" ? " lần" : "x"}</option>
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
            </div>

            {/* 매물 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === "ko" ? "매물 설명" : currentLanguage === "vi" ? "Mô tả bất động sản" : "Property Description"}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <textarea
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder={
                  currentLanguage === "ko"
                    ? "매물에 대한 상세 설명을 입력해주세요."
                    : currentLanguage === "vi"
                      ? "Nhập mô tả chi tiết về bất động sản."
                      : "Enter detailed description of the property."
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 외부 캘린더 가져오기 (드롭다운) - 재등록/수정 버튼 바로 위 */}
            <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowIcalDropdown(!showIcalDropdown)}
                className="w-full py-3.5 px-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-700">
                  {currentLanguage === "ko" ? "외부 캘린더 가져오기" : currentLanguage === "vi" ? "Đồng bộ lịch ngoài" : "Import External Calendar"}
                </span>
                {showIcalDropdown ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showIcalDropdown && (
                <div className="p-4 pt-2 border-t border-gray-200 bg-white space-y-3">
                  <p className="text-xs text-gray-500">
                    {currentLanguage === "ko" ? "에어비앤비·아고다 등 예약을 500stay와 동기화합니다. iCal URL(.ics)을 입력하세요." : currentLanguage === "vi" ? "Đồng bộ đặt phòng từ Airbnb, Agoda,... với 500stay. Nhập URL iCal (.ics)." : "Sync bookings from Airbnb, Agoda, etc. with 500stay. Enter iCal URL (.ics)."}
                  </p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{currentLanguage === "ko" ? "플랫폼" : "Platform"}</label>
                    <select value={icalPlatform} onChange={(e) => setIcalPlatform(e.target.value)} className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">{currentLanguage === "ko" ? "선택 안 함" : "None"}</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="agoda">Agoda</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="other">{currentLanguage === "ko" ? "기타" : "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{currentLanguage === "ko" ? "캘린더 이름" : "Calendar name"}</label>
                    <input type="text" value={icalCalendarName} onChange={(e) => setIcalCalendarName(e.target.value)} placeholder={currentLanguage === "ko" ? "예: 에어비앤비 예약" : "e.g. Airbnb Bookings"} className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">iCal URL (.ics)</label>
                    <input type="url" value={icalUrl} onChange={(e) => setIcalUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isDeleted ? (
                currentLanguage === "ko" ? "재등록" : 
                currentLanguage === "zh" ? "重新注册" :
                currentLanguage === "vi" ? "Đăng ký lại" :
                currentLanguage === "ja" ? "再登録" : "Re-register"
              ) : (
                currentLanguage === "ko" ? "매물 수정" : 
                currentLanguage === "zh" ? "编辑房产" :
                currentLanguage === "vi" ? "Chỉnh sửa bất động sản" :
                currentLanguage === "ja" ? "物件編集" : "Update Property"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 모달 로직들 */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInSelect={(d) => {
                setCheckInDate(d);
                setCheckOutDate(null);
                setCalendarMode("checkout");
              }}
              onCheckOutSelect={(d) => {
                setCheckOutDate(d);
                setShowCalendar(false);
              }}
              onCheckInReset={() => {
                setCheckInDate(null);
                setCheckOutDate(null);
                setCalendarMode("checkin");
              }}
              mode={calendarMode}
              bookedRanges={bookedRanges}
              isOwnerMode={true}
              currentLanguage={currentLanguage as any}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}

      {showImageSourceMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowImageSourceMenu(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowImageSourceMenu(false);
                photoLibraryInputRef.current?.click();
              }}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold"
            >
              {currentLanguage === "ko" ? "사진 라이브러리" : 
               currentLanguage === "zh" ? "照片库" :
               currentLanguage === "vi" ? "Thư viện ảnh" :
               currentLanguage === "ja" ? "写真ライブラリ" : "Photo Library"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageSourceMenu(false);
                cameraInputRef.current?.click();
              }}
              className="w-full py-4 bg-gray-100 rounded-xl font-bold"
            >
              {currentLanguage === "ko" ? "카메라" : 
               currentLanguage === "zh" ? "相机" :
               currentLanguage === "vi" ? "Máy ảnh" :
               currentLanguage === "ja" ? "カメラ" : "Camera"}
            </button>
            <button
              type="button"
              onClick={() => setShowImageSourceMenu(false)}
              className="w-full py-4 text-gray-400"
            >
              {getUIText('cancel', currentLanguage)}
            </button>
          </div>
        </div>
      )}

      <input
        ref={photoLibraryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setImages((prev) => [...prev, ...files]);
          setImagePreviews((prev) => [
            ...prev,
            ...files.map((f) => URL.createObjectURL(f)),
          ]);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImages((prev) => [...prev, file]);
            setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
          }
        }}
      />

      {/* 주소 확인 모달 */}
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
