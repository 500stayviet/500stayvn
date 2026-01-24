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
import { parseDate } from "@/lib/utils/dateUtils";

// 1. 모든 비즈니스 로직을 담은 내부 컴포넌트
function EditPropertyContent() {
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

  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>(
    [],
  );
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<
    Set<number>
  >(new Set());
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);

  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 데이터 로드 로직
  useEffect(() => {
    if (propertyLoaded || authLoading || !user || !propertyId) return;
    const loadData = async () => {
      try {
        const p = await getProperty(propertyId);
        if (!p) {
          router.push("/profile/my-properties");
          return;
        }

        setIsDeleted(p.deleted || p.status !== "active");
        setAddress(p.address || "");
        setWeeklyRent(p.price?.toString() || "");
        setSelectedAmenities(p.amenities || []);
        setCoordinates(p.coordinates);
        setImagePreviews(p.images || []);
        setMaxAdults(p.maxAdults || 1);
        setMaxChildren(p.maxChildren || 0);
        setBedrooms(p.bedrooms || 1);
        setBathrooms(p.bathrooms || 1);
        setCheckInDate(parseDate(p.checkInDate));
        setCheckOutDate(parseDate(p.checkOutDate));

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

  // 주소 검색 핸들러
  const handleAddressChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setAddress(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (!val.trim()) return;
      const res = await searchPlaceIndexForSuggestions(
        val,
        getLocationServiceLanguage(currentLanguage) as any,
      );
      setAddressSuggestions(res);
      setShowSuggestions(true);
    }, 300);
  };

  // 폼 제출 (Updates 에러 수정 및 Prisma 스키마 필드 매칭 완료)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinates || !user) {
      alert(
        currentLanguage === "ko"
          ? "주소를 선택해주세요."
          : "Please select address.",
      );
      return;
    }
    setLoading(true);

    try {
      // 1. 새 이미지를 Base64로 변환
      const newImages = await Promise.all(
        images.map(
          (file) =>
            new Promise<string>((res) => {
              const r = new FileReader();
              r.onload = () => res(r.result as string);
              r.readAsDataURL(file);
            }),
        ),
      );

      // 2. 최종 이미지 리스트 생성 (기존 URL + 새 Base64)
      // 여기서 imageUrls 변수가 확실하게 정의됩니다.
      const imageUrls = [
        ...imagePreviews.filter((url) => !url.startsWith("blob:")),
        ...newImages,
      ];

      // 3. Updates 객체 구성 (Prisma 스키마의 lat, lng 필드와 100% 일치)
      const updates: any = {
        title: apartmentName || address,
        original_description: address, // 스키마 필드명 일치
        price: parseFloat(weeklyRent.replace(/\D/g, "") || "0"), // 숫자로 변환
        priceUnit: "vnd",
        area: 0, // 스키마 필수값 대비 (기본값)
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),

        // [핵심] coordinates 객체 대신 스키마 필드명 lat, lng로 각각 할당
        lat: coordinates?.lat ? parseFloat(coordinates.lat.toString()) : null,
        lng: coordinates?.lng ? parseFloat(coordinates.lng.toString()) : null,

        address: address,
        unitNumber:
          buildingNumber && roomNumber
            ? `${buildingNumber}동 ${roomNumber}호`
            : null,
        images: imageUrls, // 위에서 정의한 imageUrls 사용 (빨간줄 해결)
        amenities: selectedAmenities,
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren),

        // 날짜 데이터 (Date 객체로 전달)
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
      };

      console.log("Sending updates to DB:", updates);

      if (isDeleted) await restoreProperty(propertyId);
      await updateProperty(propertyId, updates);

      alert(currentLanguage === "ko" ? "수정 완료!" : "Updated!");
      router.push(`/profile/my-properties/${propertyId}`);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error: " + (err as any).message);
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
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-gray-600"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-2xl font-bold mb-6">
            {currentLanguage === "ko" ? "매물 수정" : "Edit Property"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 사진 섹션 */}
            <section>
              <label className="block text-sm font-bold mb-2">
                Photos ({imagePreviews.length}/5)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border"
                  >
                    <img src={p} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreviews((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        );
                        setImages((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setShowImageSourceMenu(true)}
                    className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] mt-1">Add</span>
                  </button>
                )}
              </div>
            </section>

            {/* 주소 섹션 */}
            <section className="relative">
              <label className="block text-sm font-bold mb-2">Address</label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border shadow-lg rounded-xl mt-1 max-h-40 overflow-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAddress(s.Text);
                        setShowSuggestions(false);
                        searchPlaceIndexForText(
                          s.Text,
                          getLocationServiceLanguage(currentLanguage) as any,
                        ).then((res) => {
                          const p = res[0]?.Place?.Geometry?.Point;
                          if (p) setCoordinates({ lat: p[1], lng: p[0] });
                        });
                      }}
                      className="w-full text-left p-3 text-sm hover:bg-gray-50 border-b"
                    >
                      {s.Text}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 가격 & 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Price (VND)
                </label>
                <input
                  type="text"
                  value={
                    weeklyRent ? parseInt(weeklyRent).toLocaleString() : ""
                  }
                  onChange={(e) =>
                    setWeeklyRent(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full p-3 border rounded-xl"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Adults</label>
                <div className="flex items-center justify-between p-2 border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMaxAdults(Math.max(1, maxAdults - 1))}
                  >
                    <ChevronLeft />
                  </button>
                  <span>{maxAdults}</span>
                  <button
                    type="button"
                    onClick={() => setMaxAdults(maxAdults + 1)}
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            </div>

            {/* 편의시설 */}
            <section>
              <label className="block text-sm font-bold mb-3">Amenities</label>
              <div className="grid grid-cols-3 gap-2">
                {AMENITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSelectedAmenities((prev) =>
                        prev.includes(opt.id)
                          ? prev.filter((x) => x !== opt.id)
                          : [...prev, opt.id],
                      )
                    }
                    className={`p-3 rounded-xl border text-[10px] flex flex-col items-center gap-1 transition-all ${selectedAmenities.includes(opt.id) ? "border-blue-500 bg-blue-50 text-blue-600" : "text-gray-400"}`}
                  >
                    <opt.icon size={18} />
                    {opt.label[currentLanguage as "ko"] || opt.label.en}
                  </button>
                ))}
              </div>
            </section>

            {/* 날짜 선택 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarMode("checkin");
                  setShowCalendar(true);
                }}
                className="p-3 border rounded-xl text-left"
              >
                <p className="text-[10px] text-gray-400">Start</p>
                <p className="text-xs font-bold">
                  {checkInDate ? checkInDate.toLocaleDateString() : "Select"}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarMode("checkout");
                  setShowCalendar(true);
                }}
                className="p-3 border rounded-xl text-left"
              >
                <p className="text-[10px] text-gray-400">End</p>
                <p className="text-xs font-bold">
                  {checkOutDate ? checkOutDate.toLocaleDateString() : "Select"}
                </p>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isDeleted ? (
                "Re-register"
              ) : (
                "Update Property"
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
              Photo Library
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageSourceMenu(false);
                cameraInputRef.current?.click();
              }}
              className="w-full py-4 bg-gray-100 rounded-xl font-bold"
            >
              Camera
            </button>
            <button
              type="button"
              onClick={() => setShowImageSourceMenu(false)}
              className="w-full py-4 text-gray-400"
            >
              Cancel
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
