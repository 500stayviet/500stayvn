"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  X,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Home,
  Plus,
  Building,
  MessageCircle,
  User,
  Map,
  Heart,
  Calendar,
  Wifi,
  Wind,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Car,
  Dumbbell,
  Waves,
  PawPrint,
  Cigarette,
  Users,
} from "lucide-react";

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

// 시설 및 정책 옵션
const FACILITY_OPTIONS = [
  { id: "wifi", icon: Wifi, ko: "와이파이", vi: "Wifi", en: "WiFi" },
  { id: "aircon", icon: Wind, ko: "에어컨", vi: "Điều hòa", en: "AC" },
  { id: "tv", icon: Tv, ko: "TV", vi: "TV", en: "TV" },
  { id: "kitchen", icon: UtensilsCrossed, ko: "주방", vi: "Bếp", en: "Kitchen" },
  { id: "washer", icon: WashingMachine, ko: "세탁기", vi: "Máy giặt", en: "Washer" },
  { id: "parking", icon: Car, ko: "주차장", vi: "Bãi đỗ xe", en: "Parking" },
  { id: "gym", icon: Dumbbell, ko: "헬스장", vi: "Phòng gym", en: "Gym" },
  { id: "pool", icon: Waves, ko: "수영장", vi: "Hồ bơi", en: "Pool" },
  { id: "pet", icon: PawPrint, ko: "반려동물", vi: "Thú cưng", en: "Pet OK" },
  { id: "smoking", icon: Cigarette, ko: "흡연", vi: "Hút thuốc", en: "Smoking" },
  { id: "party", icon: Users, ko: "파티허용", vi: "Tiệc", en: "Party OK" },
];

export default function AddPropertyDemoPage() {
  const router = useRouter();
  const [currentLanguage] = useState("ko");
  const [isOwnerMode] = useState(true);
  
  // 폼 상태
  const [images] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxAdults, setMaxAdults] = useState(2);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(["wifi", "aircon"]);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);
  const [icalPlatform, setIcalPlatform] = useState("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("데모 페이지입니다. 실제 등록은 되지 않습니다.");
    }, 1500);
  };

  // 데모용 주소 설정
  const handleSetDemoAddress = () => {
    setAddress("123 Nguyen Hue, District 1, Ho Chi Minh City");
    setCoordinates({ lat: 10.7769, lng: 106.7009 });
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative pb-20" style={{ backgroundColor: COLORS.surface }}>
        {/* 상단 바 */}
        <header 
          className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
        >
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: `${COLORS.border}40` }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: COLORS.text }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: COLORS.text }}>
            {currentLanguage === "ko" ? "매물 등록" : "Add Property"}
          </h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${COLORS.accent}30`, color: COLORS.secondary }}>
            Demo
          </span>
        </header>

        {/* 콘텐츠 */}
        <div className="px-5 py-5">
          {/* 헤더 */}
          <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
              {currentLanguage === "ko" ? "새 매물 등록" : "Register New Property"}
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              {currentLanguage === "ko" ? "매물 정보를 입력해주세요" : "Please enter property information"}
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
                  {currentLanguage === "ko" ? "사진 등록" : "Upload Photos"}
                  <span style={{ color: COLORS.error }} className="ml-1">*</span>
                </h2>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>
                  {images.length}/5
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all"
                  style={{ backgroundColor: `${COLORS.border}30`, border: `1px dashed ${COLORS.border}` }}
                >
                  <Camera className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    {currentLanguage === "ko" ? "추가" : "Add"}
                  </span>
                </button>
              </div>
            </section>

            {/* 매물 종류 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko" ? "매물 종류" : "Property Type"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "studio", ko: "스튜디오", en: "Studio" },
                  { value: "one_room", ko: "원룸(방·거실 분리)", en: "1 Room" },
                  { value: "two_room", ko: "2룸", en: "2 Rooms" },
                  { value: "three_plus", ko: "3+룸", en: "3+ Rooms" },
                  { value: "detached", ko: "독채", en: "Detached" },
                ].map(({ value, ko, en }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPropertyType(value)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: propertyType === value ? `${COLORS.primary}15` : COLORS.white,
                      border: `1px solid ${propertyType === value ? COLORS.primary : COLORS.border}`,
                      color: propertyType === value ? COLORS.primary : COLORS.text,
                    }}
                  >
                    {currentLanguage === "ko" ? ko : en}
                  </button>
                ))}
              </div>

              {propertyType && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}40` }}>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "방 개수" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "화장실" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "최대인원" : "Max"}
                    </label>
                    <select
                      value={maxAdults}
                      onChange={(e) => setMaxAdults(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}명</option>
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
                {currentLanguage === "ko" ? "주소" : "Address"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              {(!address || !coordinates) && (
                <button
                  type="button"
                  onClick={handleSetDemoAddress}
                  className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                >
                  <MapPin className="w-5 h-5" />
                  <span>{currentLanguage === "ko" ? "주소 찾기" : "Find Address"}</span>
                </button>
              )}
              {address && coordinates && (
                <div
                  className="p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: `${COLORS.success}15`, border: `1px solid ${COLORS.success}30` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${COLORS.success}20` }}>
                      <Check className="w-4 h-4" style={{ color: COLORS.success }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium" style={{ color: COLORS.success }}>
                        {currentLanguage === "ko" ? "확정된 주소 (클릭하여 수정)" : "Confirmed Address"}
                      </span>
                      <p className="text-sm font-medium mt-0.5" style={{ color: COLORS.text }}>
                        {address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddress("");
                        setCoordinates(null);
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
                    {currentLanguage === "ko" ? "도시" : "City"}
                  </label>
                  <div 
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] flex items-center"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  >
                    {address && coordinates
                      ? "Ho Chi Minh"
                      : <span style={{ color: COLORS.textMuted }}>{currentLanguage === "ko" ? "자동 입력" : "Auto"}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                    {currentLanguage === "ko" ? "구" : "District"}
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    disabled={!address || !coordinates}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  >
                    <option value="">{currentLanguage === "ko" ? "선택" : "Select"}</option>
                    <option value="d1">District 1</option>
                    <option value="d2">District 2</option>
                    <option value="d3">District 3</option>
                  </select>
                </div>
              </div>

              {/* 동호수 입력 */}
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.border}20` }}>
                <label className="block text-xs font-medium mb-2" style={{ color: COLORS.text }}>
                  {currentLanguage === "ko" ? "동호수" : "Unit Number"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "동" : "Building"}
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: A" : "e.g., A"}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                      {currentLanguage === "ko" ? "호실" : "Room"}
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder={currentLanguage === "ko" ? "예: 101" : "e.g., 101"}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] mt-2 flex items-start gap-1" style={{ color: COLORS.textSecondary }}>
                  <span style={{ color: COLORS.primary }}>i</span>
                  <span>
                    {currentLanguage === "ko"
                      ? "동호수는 예약 완료 후 임차인에게만 표시됩니다."
                      : "Unit number shown to tenants after booking."}
                  </span>
                </p>
              </div>
            </section>

            {/* 1주일 임대료 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>
                {currentLanguage === "ko" ? "1주일 임대료" : "Weekly Rent"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <p className="text-[11px] mb-3" style={{ color: COLORS.textSecondary }}>
                {currentLanguage === "ko" ? "공과금/관리비 포함" : "Utilities/Management fees included"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={weeklyRent ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString() : ""}
                  onChange={(e) => setWeeklyRent(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                  style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
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
                {currentLanguage === "ko" ? "숙소시설 및 정책" : "Facilities & Policy"}
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {FACILITY_OPTIONS.map(({ id, icon: Icon, ko, en }) => {
                  const isSelected = selectedFacilities.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleFacility(id)}
                      className="w-full flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: isSelected ? `${COLORS.primary}15` : COLORS.white,
                        border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                        color: isSelected ? COLORS.primary : COLORS.text,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: isSelected ? COLORS.primary : COLORS.textMuted }} />
                      <span className="text-[10px] font-medium">{currentLanguage === "ko" ? ko : en}</span>
                    </button>
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
                {currentLanguage === "ko" ? "체크인/체크아웃 시간" : "Check-in/Check-out Time"}
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
                {currentLanguage === "ko" ? "매물명 (임대인용)" : "Property Name"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <input
                type="text"
                value={propertyNickname}
                onChange={(e) => setPropertyNickname(e.target.value)}
                placeholder={currentLanguage === "ko" ? "예: 1군 스튜디오 A동 301호" : "e.g., D1 Studio A-301"}
                className="w-full px-3 py-2.5 rounded-lg text-sm min-h-[40px] focus:outline-none transition-all"
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
              />
            </section>

            {/* 매물 설명 */}
            <section 
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                {currentLanguage === "ko" ? "매물 설명" : "Property Description"}
                <span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <textarea
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder={currentLanguage === "ko" ? "매물에 대한 상세 설명을 입력해주세요..." : "Enter detailed description..."}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg resize-none text-sm min-h-[100px] focus:outline-none transition-all"
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
              />
              <p className="text-[10px] mt-2 flex items-start gap-1" style={{ color: COLORS.success }}>
                <span>i</span>
                <span>
                  {currentLanguage === "ko"
                    ? "베트남어로 입력해주세요. 자동 번역 기능이 제공됩니다."
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
                  {currentLanguage === "ko" ? "외부 캘린더 가져오기" : "Import External Calendar"}
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
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{currentLanguage === "ko" ? "등록 중..." : "Registering..."}</span>
                </>
              ) : (
                <span>{currentLanguage === "ko" ? "매물 등록하기" : "Register Property"}</span>
              )}
            </button>
          </form>
        </div>

        {/* 하단 네비게이션 바 */}
        <nav 
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-40"
          style={{ backgroundColor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-around py-2">
            {isOwnerMode ? (
              // 임대인 모드
              <>
                <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>홈</span>
                </button>
                <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
                  <span className="text-[10px] font-medium" style={{ color: COLORS.primary }}>매물등록</span>
                </button>
                <button onClick={() => router.push("/profile/my-properties")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Building className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>매물관리</span>
                </button>
                <button onClick={() => router.push("/chat")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <MessageCircle className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>채팅</span>
                </button>
                <button onClick={() => router.push("/profile")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <User className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>프로필</span>
                </button>
              </>
            ) : (
              // 임차인 모드
              <>
                <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>홈</span>
                </button>
                <button onClick={() => router.push("/map")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Map className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>지도검색</span>
                </button>
                <button onClick={() => router.push("/wishlist")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Heart className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>찜</span>
                </button>
                <button onClick={() => router.push("/my-bookings")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <Calendar className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>예약</span>
                </button>
                <button onClick={() => router.push("/profile")} className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
                  <User className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>프로필</span>
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
