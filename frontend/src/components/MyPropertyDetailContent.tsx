"use client";

import { useState } from "react";
import { PropertyData } from "@/types/property";
import { 
  ArrowLeft, Edit, Calendar, CalendarDays, Users, ChevronLeft, ChevronRight, 
  Bed, Bath, MapPin, Home, Check, Sparkles, Camera, Maximize2, X
} from "lucide-react";
import Image from "next/image";
import { FACILITY_OPTIONS, FACILITY_CATEGORIES } from "@/lib/constants/facilities";
import { PropertyDescription } from "@/components/PropertyDescription";
import {
  formatFullPrice,
  getPropertyTypeLabel,
  getCityDistrictFromCoords,
} from "@/lib/utils/propertyUtils";
import {
  isAvailableNow,
  formatDate,
  formatDateForBadge,
} from "@/lib/utils/dateUtils";
import { VIETNAM_CITIES, getDistrictsByCityId } from "@/lib/data/vietnam-regions";

// 베트남 스타일 컬러: Coral Red + Golden Orange + Sunshine Yellow (add-property와 동일)
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

export interface MyPropertyDetailContentProps {
  property: PropertyData;
  currentLanguage: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function MyPropertyDetailContent({
  property,
  currentLanguage,
  onBack,
  onEdit,
}: MyPropertyDetailContentProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);

  const getBorderColor = (status?: string) => {
    if (status === "rented") return "border-green-500 border-4";
    return "border-red-500 border-4";
  };

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop"];
  const currentImage = images[currentImageIndex] || images[0];
  const { cityName, districtName } = property.coordinates
    ? getCityDistrictFromCoords(property.coordinates.lat, property.coordinates.lng, currentLanguage as any)
    : { cityName: "", districtName: "" };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleViewFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
  };

  const handleBackFromFullScreen = () => {
    setFullScreenImageIndex(null);
  };

  // 도시 이름 가져오기
  const getCityName = () => {
    if (!property.cityId) return "";
    const city = VIETNAM_CITIES.find(c => c.id === property.cityId);
    if (!city) return "";
    
    const langMap: Record<string, string> = {
      ko: city.nameKo,
      vi: city.nameVi,
      en: city.name,
      ja: city.nameJa ?? city.name,
      zh: city.nameZh ?? city.name,
    };
    return langMap[currentLanguage] ?? city.name;
  };

  // 구 이름 가져오기
  const getDistrictName = () => {
    if (!property.districtId || !property.cityId) return "";
    const districts = getDistrictsByCityId(property.cityId);
    const district = districts.find(d => d.id === property.districtId);
    if (!district) return "";
    
    const langMap: Record<string, string> = {
      ko: district.nameKo,
      vi: district.nameVi,
      en: district.name,
      ja: district.nameJa ?? district.name,
      zh: district.nameZh ?? district.name,
    };
    return langMap[currentLanguage] ?? district.name;
  };

  // 매물 종류 라벨
  const getPropertyTypeDisplay = () => {
    if (!property.propertyType) return "";
    
    const typeMap: Record<string, Record<string, string>> = {
      studio: {
        ko: "스튜디오",
        vi: "Studio",
        en: "Studio",
        ja: "スタジオ",
        zh: "工作室",
      },
      one_room: {
        ko: "원룸(방·거실 분리)",
        vi: "Phòng đơn (phòng ngủ & phòng khách riêng)",
        en: "One Room (bedroom & living room separate)",
        ja: "ワンルーム（寝室・リビング別）",
        zh: "一室（卧室与客厅分开）",
      },
      two_room: {
        ko: "2룸",
        vi: "2 phòng",
        en: "2 Rooms",
        ja: "2ルーム",
        zh: "2室",
      },
      three_plus: {
        ko: "3+룸",
        vi: "3+ phòng",
        en: "3+ Rooms",
        ja: "3+ルーム",
        zh: "3+室",
      },
      detached: {
        ko: "독채",
        vi: "Nhà riêng",
        en: "Detached House",
        ja: "一戸建て",
        zh: "独栋房屋",
      },
    };
    
    return typeMap[property.propertyType]?.[currentLanguage] || property.propertyType;
  };

  return (
    <div 
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <div
        className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* 헤더 */}
        <div className="px-5 py-4 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === "ko" ? "뒤로" : currentLanguage === "vi" ? "Quay lại" : "Back"}
              </span>
            </button>
            <h1 className="text-lg font-bold" style={{ color: COLORS.text }}>
              {currentLanguage === "ko"
                ? "매물 상세"
                : currentLanguage === "vi"
                  ? "Chi tiết bất động sản"
                  : "Property Details"}
            </h1>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentLanguage === "ko" ? "수정" : currentLanguage === "vi" ? "Chỉnh sửa" : "Edit"}
              </span>
            </button>
          </div>
        </div>

        {/* 콘텐츠 - 스크롤 가능한 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-4">
          {/* 이미지 슬라이더 */}
          <section
            className="mb-5 rounded-2xl overflow-hidden"
            style={{
              border: `2px solid ${getBorderColor(property.status).includes("green") ? COLORS.success : COLORS.error}`,
            }}
          >
            <div className="relative w-full h-64">
              <Image
                src={currentImage}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 430px) 100vw, 430px"
              />
              
              {/* 상태 배지 */}
              {isAvailableNow(property.checkInDate) ? (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-bold">
                    {currentLanguage === "ko"
                      ? "즉시입주가능"
                      : currentLanguage === "vi"
                        ? "Có thể vào ở ngay"
                        : "Available Now"}
                  </span>
                </div>
              ) : property.checkInDate ? (
                <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">
                    {formatDateForBadge(property.checkInDate, currentLanguage as any)}
                  </span>
                </div>
              ) : (
                <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">
                    {currentLanguage === "ko"
                      ? "날짜 미정"
                      : currentLanguage === "vi"
                        ? "Chưa xác định"
                        : "Date TBD"}
                  </span>
                </div>
              )}

              {/* 이미지 네비게이션 */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* 가격 배지 */}
              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
                <p className="text-sm font-bold">{formatFullPrice(property.price, property.priceUnit)}</p>
                <p className="text-xs text-gray-300">
                  {currentLanguage === "ko" ? "/주" : currentLanguage === "vi" ? "/tuần" : "/week"}
                </p>
              </div>

              {/* 방/화장실 정보 */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm z-10 flex items-center gap-3">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4" />
                    <span className="text-xs font-medium">{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4" />
                    <span className="text-xs font-medium">{property.bathrooms}</span>
                  </div>
                )}
              </div>

              {/* 전체화면 보기 버튼 */}
              <button
                onClick={() => handleViewFullScreen(currentImageIndex)}
                className="absolute bottom-3 left-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* 매물 종류 / 방 개수 / 화장실 수 */}
          <section
            className="p-5 rounded-2xl mb-5"
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
                  : "Property Type"}
            </h2>
            
            {property.propertyType && (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.white,
                    border: `1px solid ${COLORS.primary}`,
                  }}
                >
                  {getPropertyTypeDisplay()}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4"
                  style={{ borderTop: `1px solid ${COLORS.border}40` }}
                >
                  {property.bedrooms !== undefined && (
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
                      <div className="flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: COLORS.text }}
                      >
                        <Bed className="w-4 h-4 text-gray-600 shrink-0" />
                        <span>{property.bedrooms}</span>
                      </div>
                    </div>
                  )}
                  
                  {property.bathrooms !== undefined && (
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
                      <div className="flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: COLORS.text }}
                      >
                        <Bath className="w-4 h-4 text-gray-600 shrink-0" />
                        <span>{property.bathrooms}</span>
                      </div>
                    </div>
                  )}
                  
                  {(property.maxAdults != null || property.maxChildren != null) && (
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
                      <div className="flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: COLORS.text }}
                      >
                        <Users className="w-4 h-4 text-gray-600 shrink-0" />
                        <span>
                          {property.maxAdults || 0}
                          {currentLanguage === "ko" ? "명" : currentLanguage === "vi" ? " người" : " guests"}
                          {(property.maxChildren ?? 0) > 0 && (
                            <>
                              {" "}
                              (+ {property.maxChildren}{" "}
                              {currentLanguage === "ko"
                                ? "어린이"
                                : currentLanguage === "vi"
                                  ? "trẻ em"
                                  : "children"}
                              )
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 주소 */}
          <section
            className="p-5 rounded-2xl mb-5"
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
                  : "Address"}
            </h2>
            
            <div className="space-y-4">
              {/* 주소 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    {currentLanguage === "ko" ? "주소" : 
                     currentLanguage === "vi" ? "Địa chỉ" :
                     currentLanguage === "ja" ? "住所" :
                     currentLanguage === "zh" ? "地址" :
                     "Address"}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: `${COLORS.success}15`,
                    border: `1px solid ${COLORS.success}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-1.5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: `${COLORS.success}20` }}
                    >
                      <MapPin
                        className="w-4 h-4"
                        style={{ color: COLORS.success }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: COLORS.text }}
                      >
                        {property.address || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 동호수 */}
              {property.unitNumber && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-bold text-gray-500">
                      {currentLanguage === "ko" ? "동호수" : 
                       currentLanguage === "vi" ? "Số phòng" :
                       currentLanguage === "ja" ? "部屋番号" :
                       currentLanguage === "zh" ? "房间号" :
                       "Unit Number"}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: `${COLORS.primary}10`,
                      border: `1px solid ${COLORS.primary}30`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${COLORS.primary}20` }}
                      >
                        <Home
                          className="w-4 h-4"
                          style={{ color: COLORS.primary }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{ color: COLORS.text }}
                        >
                          {property.unitNumber}
                        </p>
                        <p
                          className="text-[10px] mt-1"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {currentLanguage === "ko"
                            ? "예약 완료 후 임차인에게만 표시"
                            : currentLanguage === "vi"
                              ? "Chỉ hiển thị cho người thuê sau khi đặt chỗ"
                              : "Shown to tenants after booking"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    </label>
                    <div
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {getCityName() || cityName || "—"}
                    </div>
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
                    </label>
                    <div
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                      }}
                    >
                      {getDistrictName() || districtName || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 임대 희망 날짜 */}
          <section
            className="p-5 rounded-2xl mb-5"
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
                ? "임대 가능 날짜"
                : currentLanguage === "vi"
                  ? "Ngày cho thuê"
                  : "Available Dates"}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {/* 체크인 날짜 */}
              <div className="flex items-center px-3 py-2 rounded-md"
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
                      {property.checkInDate
                        ? formatDate(property.checkInDate, currentLanguage as any)
                        : currentLanguage === "ko"
                          ? "날짜 선택"
                          : currentLanguage === "vi"
                            ? "Chọn ngày"
                            : "Select date"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 체크아웃 날짜 */}
              <div className="flex items-center px-3 py-2 rounded-md"
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
                      {property.checkOutDate
                        ? formatDate(property.checkOutDate, currentLanguage as any)
                        : currentLanguage === "ko"
                          ? "날짜 선택"
                          : currentLanguage === "vi"
                            ? "Chọn ngày"
                            : "Select date"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 체크인/체크아웃 시간 */}
          {(property.checkInTime || property.checkOutTime) && (
            <section
              className="p-5 rounded-2xl mb-5"
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
                  <div
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                    style={{
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  >
                    {property.checkInTime || "14:00"}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-[11px] font-medium mb-1.5"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
                  </label>
                  <div
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                    style={{
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  >
                    {property.checkOutTime || "12:00"}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 1주일 임대료 */}
          <section
            className="p-5 rounded-2xl mb-5"
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
              <div
                className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                }}
              >
                {formatFullPrice(property.price, property.priceUnit)}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.textSecondary }}
              >
                VND
              </span>
            </div>
          </section>

          {/* 숙소시설 및 정책 */}
          <section
            className="p-5 rounded-2xl mb-5"
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
                ? "숙소시설 및 정책"
                : currentLanguage === "vi"
                  ? "Tiện ích và chính sách"
                : currentLanguage === "ja"
                  ? "施設とポリシー"
                : currentLanguage === "zh"
                  ? "设施与政策"
                  : "Facilities & Policy"}
            </h2>
            <div className="space-y-6">
              {FACILITY_CATEGORIES.map((cat) => {
                const categoryFacilities = FACILITY_OPTIONS.filter(o => o.category === cat.id);
                const selectedFacilitiesInCategory = categoryFacilities.filter(opt => 
                  property.amenities?.includes(opt.id)
                );
                
                if (selectedFacilitiesInCategory.length === 0) return null;
                
                return (
                  <div 
                    key={cat.id}
                    className="pt-4 pb-2"
                    style={{
                      borderTop: `1.5px dashed ${COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-gray-500">{(cat.label as any)[currentLanguage]}</p>
                    </div>
                    
                    {/* 시설 아이콘 그리드 */}
                    <div className="grid grid-cols-4 gap-3">
                      {selectedFacilitiesInCategory.map(opt => {
                        const Icon = opt.icon;
                        const label = (opt.label as any)[currentLanguage] || opt.label.en;
                        const isPet = opt.id === "pet";
                        const isCleaning = opt.id === "cleaning";
                        
                        return (
                          <div key={opt.id} className="flex flex-col items-center gap-1.5">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                              style={{
                                backgroundColor: COLORS.primary,
                                borderColor: COLORS.primary,
                              }}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[10px] text-gray-600 font-medium leading-tight text-center">
                              {label}
                            </span>
                            {isPet && property.petAllowed && property.petFee != null && (
                              <span className="text-[10px] font-semibold text-blue-800">
                                {property.priceUnit === "vnd"
                                  ? `${property.petFee.toLocaleString("vi-VN")} VND`
                                  : `$${property.petFee.toLocaleString()}`}
                              </span>
                            )}
                            {isCleaning && property.cleaningPerWeek && (
                              <span className="text-[10px] font-semibold text-blue-800">
                                {property.cleaningPerWeek}
                                {currentLanguage === "ko"
                                  ? "회/주"
                                  : currentLanguage === "vi"
                                    ? " lần/tuần"
                                    : "/week"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 매물 설명 */}
          {property.original_description && (
            <section
              className="p-5 rounded-2xl mb-5"
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
              </h2>
              <PropertyDescription
                description={property.original_description}
                sourceLanguage="vi"
                targetLanguage={currentLanguage as any}
                cacheKey={`property-detail-owner-${property.id}`}
                className="mt-2"
              />
            </section>
          )}

          {/* 외부 캘린더 가져오기 */}
          {(property.icalPlatform || property.icalCalendarName || property.icalUrl) && (
            <section
              className="rounded-2xl overflow-hidden mb-5"
              style={{
                backgroundColor: COLORS.surface,
                border: `1.5px dashed ${COLORS.border}`,
              }}
            >
              <div
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
              </div>
              <div
                className="p-4 pt-3 space-y-3"
                style={{ borderTop: `1px solid ${COLORS.border}30` }}
              >
                <div className="space-y-1.5 text-sm text-gray-800">
                  {property.icalPlatform && (
                    <p>
                      <span className="text-gray-500">
                        {currentLanguage === "ko" ? "플랫폼: " : currentLanguage === "vi" ? "Nền tảng: " : "Platform: "}
                      </span>
                      <span className="font-medium capitalize">{property.icalPlatform}</span>
                    </p>
                  )}
                  {property.icalCalendarName && (
                    <p>
                      <span className="text-gray-500">
                        {currentLanguage === "ko"
                          ? "캘린더 이름: "
                          : currentLanguage === "vi"
                            ? "Tên lịch: "
                            : "Calendar name: "}
                      </span>
                      <span className="font-medium">{property.icalCalendarName}</span>
                    </p>
                  )}
                  {property.icalUrl && (
                    <p className="break-all">
                      <span className="text-gray-500">iCal URL: </span>
                      <span className="text-blue-600 font-medium">{property.icalUrl}</span>
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 전체화면 이미지 보기 */}
          {fullScreenImageIndex !== null && (
            <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
              <img
                src={images[fullScreenImageIndex]}
                alt={`Full screen ${fullScreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              <button
                type="button"
                onClick={handleBackFromFullScreen}
                className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
