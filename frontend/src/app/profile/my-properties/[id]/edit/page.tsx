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
  Maximize2,
  ArrowLeft,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bed,
  Bath,
  Check,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import AddressVerificationModal from "@/components/AddressVerificationModal";
import { FACILITY_OPTIONS, FACILITY_CATEGORIES } from "@/lib/constants/facilities";
import { parseDate } from "@/lib/utils/dateUtils";
import { getUIText } from "@/utils/i18n";

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
        setIcalPlatform(p.icalPlatform || "");
        setIcalCalendarName(p.icalCalendarName || "");
        setIcalUrl(p.icalUrl || "");

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

  // 주소 확인 모달에서 주소 확정 시
  const handleAddressConfirm = (data: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setAddress(data.address);
    setCoordinates({ lat: data.lat, lng: data.lng });
    // 개발 환경에서만 디버그 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.debug("✅ 주소 확정:", data);
    }
  };

  // 폼 제출 (Updates 에러 수정 및 Prisma 스키마 필드 매칭 완료)
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
        ...(icalPlatform !== undefined && { icalPlatform: icalPlatform || undefined }),
        ...(icalCalendarName !== undefined && { icalCalendarName: icalCalendarName.trim() || undefined }),
        ...(icalUrl !== undefined && { icalUrl: icalUrl.trim() || undefined }),
      };

      console.log("Sending updates to DB:", updates);

      if (isDeleted) await restoreProperty(propertyId);
      await updateProperty(propertyId, updates);

      alert(
        currentLanguage === "ko" ? "수정 완료!" :
        currentLanguage === "zh" ? "修改完成！" :
        currentLanguage === "vi" ? "Chỉnh sửa hoàn tất!" :
        currentLanguage === "ja" ? "編集完了！" :
        "Updated!"
      );
      // 매물 수정 완료 후 내매물관리페이지의 등록매물 탭으로 이동
      router.push('/profile/my-properties');
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
            onClick={() => router.back()}
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
            {/* 사진 섹션 */}
            <section>
              <label className="block text-sm font-bold mb-2">
                {currentLanguage === "ko" ? "사진" : 
                 currentLanguage === "zh" ? "照片" :
                 currentLanguage === "vi" ? "Ảnh" :
                 currentLanguage === "ja" ? "写真" : "Photos"} ({imagePreviews.length}/5)
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
                    <span className="text-[10px] mt-1">
                      {currentLanguage === "ko" ? "추가" : 
                       currentLanguage === "zh" ? "添加" :
                       currentLanguage === "vi" ? "Thêm" :
                       currentLanguage === "ja" ? "追加" : "Add"}
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* 주소 섹션 - 매물 등록 페이지와 동일한 UI */}
            <section>
              <label className="block text-sm font-bold mb-2">
                {getUIText('address', currentLanguage)}
              </label>
              
              {address ? (
                // 주소가 있는 경우: 확정된 주소 영역 (클릭 시 주소 검색 모달 열림)
                <div
                  onClick={() => setShowAddressModal(true)}
                  className="w-full p-3 border border-green-500 bg-green-50 rounded-xl cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Check className="text-green-600" size={18} />
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        {currentLanguage === "ko" ? "확정된 주소" : 
                         currentLanguage === "zh" ? "已确认地址" : 
                         currentLanguage === "vi" ? "Địa chỉ đã xác nhận" :
                         currentLanguage === "ja" ? "確定住所" : "Confirmed Address"}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{address}</p>
                    </div>
                  </div>
                  <MapPin className="text-gray-400" size={18} />
                </div>
              ) : (
                // 주소가 없는 경우: 주소 찾기 버튼
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                >
                  <MapPin size={24} />
                  <span className="text-sm font-medium">
                    {currentLanguage === "ko" ? "주소 찾기" : 
                     currentLanguage === "zh" ? "查找地址" : 
                     currentLanguage === "vi" ? "Tìm địa chỉ" :
                     currentLanguage === "ja" ? "住所を検索" : "Find Address"}
                  </span>
                </button>
              )}
            </section>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-4"></div>

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

            {/* 최대 인원 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko" ? "최대 인원 수" : 
                 currentLanguage === "zh" ? "最大入住人数" : 
                 currentLanguage === "vi" ? "Số người tối đa" :
                 currentLanguage === "ja" ? "最大人数" : "Maximum Guests"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 성인 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko" ? "성인" : 
                         currentLanguage === "zh" ? "成人" : 
                         currentLanguage === "vi" ? "Người lớn" :
                         currentLanguage === "ja" ? "大人" : "Adults"}
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
                        {currentLanguage === "ko" ? "어린이" : 
                         currentLanguage === "zh" ? "儿童" : 
                         currentLanguage === "vi" ? "Trẻ em" :
                         currentLanguage === "ja" ? "子供" : "Children"}
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

            {/* 방/화장실 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentLanguage === "ko" ? "방/화장실 수" : 
                 currentLanguage === "zh" ? "卧室/浴室数量" : 
                 currentLanguage === "vi" ? "Số phòng/phòng tắm" :
                 currentLanguage === "ja" ? "寝室/浴室数" : "Bedrooms/Bathrooms"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 침실 */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {currentLanguage === "ko" ? "침실" : 
                         currentLanguage === "zh" ? "卧室" : 
                         currentLanguage === "vi" ? "Phòng ngủ" :
                         currentLanguage === "ja" ? "寝室" : "Bedrooms"}
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
                        {currentLanguage === "ko" ? "화장실" : 
                         currentLanguage === "zh" ? "浴室" : 
                         currentLanguage === "vi" ? "Phòng tắm" :
                         currentLanguage === "ja" ? "浴室" : "Bathrooms"}
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

            {/* 숙소시설 및 정책 */}
            <section>
              <label className="block text-sm font-bold mb-3">
                {currentLanguage === "ko" ? "숙소시설 및 정책" : currentLanguage === "vi" ? "Tiện ích và chính sách" : "Facilities & Policy"}
              </label>
              <div className="space-y-3">
                {FACILITY_CATEGORIES.map((cat) => {
                  const options = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
                  const catLabel = (cat.label as any)[currentLanguage] || cat.label.en;
                  return (
                    <div key={cat.id}>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">{catLabel}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {options.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = selectedAmenities.includes(opt.id);
                          const label = (opt.label as any)[currentLanguage] || opt.label.en;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setSelectedAmenities((prev) =>
                                  prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id],
                                )
                              }
                              className={`p-3 rounded-xl border text-[10px] flex flex-col items-center gap-1 transition-all ${isSelected ? "border-blue-500 bg-blue-50 text-blue-600" : "text-gray-400"}`}
                            >
                              <Icon size={18} />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                <p className="text-[10px] text-gray-400">
                  {getUIText('checkIn', currentLanguage)}
                </p>
                <p className="text-xs font-bold">
                  {checkInDate ? checkInDate.toLocaleDateString() : getUIText('selectDate', currentLanguage)}
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
                <p className="text-[10px] text-gray-400">
                  {getUIText('checkOut', currentLanguage)}
                </p>
                <p className="text-xs font-bold">
                  {checkOutDate ? checkOutDate.toLocaleDateString() : getUIText('selectDate', currentLanguage)}
                </p>
              </button>
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
