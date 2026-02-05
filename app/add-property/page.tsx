"use client";

import { useState } from "react";
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

// 베트남 스타일 컬러
const COLORS = {
  primary: "#E63946",
  primaryLight: "#FF6B6B",
  secondary: "#FF6B35",
  accent: "#FFB627",
  success: "#10B981",
  error: "#DC2626",
  white: "#FFFFFF",
  background: "#FFF8F0",
  surface: "#FFFFFF",
  border: "#FED7AA",
  borderFocus: "#E63946",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
};

// 시설 옵션
const FACILITY_GROUPS = [
  {
    id: "amenities",
    label: { ko: "편의시설", vi: "Tiện nghi", en: "Amenities" },
    options: [
      { id: "wifi", icon: Wifi, label: { ko: "와이파이", vi: "Wifi", en: "WiFi" } },
      { id: "aircon", icon: Wind, label: { ko: "에어컨", vi: "Điều hòa", en: "A/C" } },
      { id: "tv", icon: Tv, label: { ko: "TV", vi: "TV", en: "TV" } },
      { id: "kitchen", icon: UtensilsCrossed, label: { ko: "주방", vi: "Bếp", en: "Kitchen" } },
      { id: "washer", icon: WashingMachine, label: { ko: "세탁기", vi: "Máy giặt", en: "Washer" } },
    ],
  },
  {
    id: "building",
    label: { ko: "건물시설", vi: "Tiện ích tòa nhà", en: "Building" },
    options: [
      { id: "parking", icon: Car, label: { ko: "주차", vi: "Đỗ xe", en: "Parking" } },
      { id: "gym", icon: Dumbbell, label: { ko: "헬스장", vi: "Phòng gym", en: "Gym" } },
      { id: "pool", icon: Waves, label: { ko: "수영장", vi: "Hồ bơi", en: "Pool" } },
    ],
  },
  {
    id: "policy",
    label: { ko: "정책", vi: "Chính sách", en: "Policy" },
    options: [
      { id: "pet", icon: PawPrint, label: { ko: "반려동물", vi: "Thú cưng", en: "Pets" } },
      { id: "smoking", icon: Cigarette, label: { ko: "흡연", vi: "Hút thuốc", en: "Smoking" } },
      { id: "party", icon: Users, label: { ko: "파티", vi: "Tiệc", en: "Party" } },
    ],
  },
];

export default function AddPropertyPage() {
  const [currentLanguage] = useState("ko");
  const [isOwnerMode] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxAdults, setMaxAdults] = useState(2);
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);
  const [icalPlatform, setIcalPlatform] = useState("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const bedroomOptions = propertyType === "studio" ? [0] : propertyType === "one_room" ? [1] : propertyType === "two_room" ? [2] : [3, 4, 5];
  const bathroomOptions = [1, 2, 3, 4, 5, 6];

  const toggleFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).slice(0, 5 - images.length).map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("등록 완료!");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative pb-20" style={{ backgroundColor: COLORS.surface }}>
        {/* 상단 바 */}
        <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
          <button className="p-2 rounded-full" style={{ backgroundColor: `${COLORS.border}40` }}>
            <ArrowLeft className="w-5 h-5" style={{ color: COLORS.text }} />
          </button>
          <h1 className="text-base font-bold" style={{ color: COLORS.text }}>새 매물 등록</h1>
        </div>

        {/* 콘텐츠 */}
        <div className="px-5 py-5">
          {/* 헤더 */}
          <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>새 매물 등록</h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>매물 정보를 입력해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이미지 업로드 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold" style={{ color: COLORS.text }}>
                  사진 등록<span style={{ color: COLORS.error }} className="ml-1">*</span>
                </h2>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>{images.length}/5</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full"
                      style={{ backgroundColor: COLORS.white }}
                    >
                      <X className="w-3 h-3" style={{ color: COLORS.error }} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer" style={{ backgroundColor: `${COLORS.border}30`, border: `1px dashed ${COLORS.border}` }}>
                    <Camera className="w-6 h-6 mb-1" style={{ color: COLORS.textMuted }} />
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>추가</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </section>

            {/* 매물 종류 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                매물 종류<span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "studio", label: "스튜디오" },
                  { value: "one_room", label: "원룸" },
                  { value: "two_room", label: "2룸" },
                  { value: "three_plus", label: "3+룸" },
                  { value: "detached", label: "독채" },
                ].map(({ value, label }) => (
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
                    {label}
                  </button>
                ))}
              </div>
              {propertyType && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}40` }}>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>방 개수</label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {bedroomOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>화장실</label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {bathroomOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>최대인원</label>
                    <select
                      value={maxAdults}
                      onChange={(e) => setMaxAdults(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}명</option>)}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* 1주일 임대료 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>
                1주일 임대료<span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <p className="text-[11px] mb-3" style={{ color: COLORS.textSecondary }}>공과금/관리비 포함</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={weeklyRent ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString() : ""}
                  onChange={(e) => setWeeklyRent(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                  style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
                />
                <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>VND</span>
              </div>
            </section>

            {/* 숙소시설 및 정책 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: COLORS.text }}>숙소시설 및 정책</h2>
              <div className="space-y-4">
                {FACILITY_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="text-[11px] font-medium mb-2" style={{ color: COLORS.textSecondary }}>{group.label.ko}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {group.options.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedFacilities.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleFacility(opt.id)}
                            className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all"
                            style={{
                              backgroundColor: isSelected ? `${COLORS.primary}15` : COLORS.white,
                              border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                            }}
                          >
                            <Icon className="w-4 h-4" style={{ color: isSelected ? COLORS.primary : COLORS.textMuted }} />
                            <span className="text-[10px]" style={{ color: isSelected ? COLORS.primary : COLORS.text }}>{opt.label.ko}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 체크인/체크아웃 시간 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: COLORS.text }}>체크인/체크아웃 시간</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>체크인</label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return [`${hour}:00`, `${hour}:30`];
                    }).flat().map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>체크아웃</label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none"
                    style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return [`${hour}:00`, `${hour}:30`];
                    }).flat().map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 매물명 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                매물명<span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <input
                type="text"
                value={propertyNickname}
                onChange={(e) => setPropertyNickname(e.target.value)}
                placeholder="예: 호치민 1군 스튜디오"
                className="w-full px-3 py-2.5 rounded-lg text-sm min-h-[40px] focus:outline-none"
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
              />
            </section>

            {/* 매물 설명 */}
            <section className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                매물 설명<span style={{ color: COLORS.error }} className="ml-1">*</span>
              </h2>
              <textarea
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder="매물에 대한 상세 설명을 입력해주세요..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg resize-none text-sm min-h-[100px] focus:outline-none"
                style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}` }}
              />
            </section>

            {/* 외부 캘린더 가져오기 */}
            <section className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.surface, border: `1.5px dashed ${COLORS.border}` }}>
              <button
                type="button"
                onClick={() => setShowIcalDropdown(!showIcalDropdown)}
                className="w-full py-3 px-4 flex items-center justify-between transition-colors text-left min-h-[48px]"
                style={{ backgroundColor: `${COLORS.border}20` }}
              >
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>외부 캘린더 가져오기</span>
                {showIcalDropdown ? <ChevronUp className="w-4 h-4" style={{ color: COLORS.textSecondary }} /> : <ChevronDown className="w-4 h-4" style={{ color: COLORS.textSecondary }} />}
              </button>
              {showIcalDropdown && (
                <div className="p-4 pt-3 space-y-3" style={{ borderTop: `1px solid ${COLORS.border}30` }}>
                  <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>에어비앤비, 아고다 등 예약을 500stay와 동기화합니다.</p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>플랫폼</label>
                    <select
                      value={icalPlatform}
                      onChange={(e) => setIcalPlatform(e.target.value)}
                      className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
                      style={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                    >
                      <option value="">선택 안 함</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="agoda">Agoda</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>캘린더 이름</label>
                    <input
                      type="text"
                      value={icalCalendarName}
                      onChange={(e) => setIcalCalendarName(e.target.value)}
                      placeholder="예: 에어비앤비 예약"
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
              disabled={loading || images.length === 0 || !weeklyRent || !propertyType}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>등록 중...</span>
                </>
              ) : (
                <span>매물 등록하기</span>
              )}
            </button>
          </form>
        </div>

        {/* 하단 네비게이션 바 */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-40" style={{ backgroundColor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-around py-2">
            <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
              <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>홈</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
              <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
              <span className="text-[10px] font-medium" style={{ color: COLORS.primary }}>매물등록</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
              <Building className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>매물관리</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
              <MessageCircle className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>채팅</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px]">
              <User className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <span className="text-[10px]" style={{ color: COLORS.textMuted }}>프로필</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
