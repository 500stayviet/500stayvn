"use client";

import { useState } from "react";
import {
  Camera,
  MapPin,
  X,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  Home,
  Search,
  Building,
  User,
  Plus,
  Wifi,
  Wind,
  Tv,
  Car,
  Waves,
  Dumbbell,
  Coffee,
  Utensils,
  ShieldCheck,
  Baby,
  PawPrint,
  Clock,
  Sparkles,
} from "lucide-react";

// Color constants
const COLORS = {
  deepBlue: "#003366",
  emeraldGreen: "#10B981",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

// Facility categories
const FACILITY_CATEGORIES = [
  {
    id: "basic",
    name: "기본 시설",
    icon: Home,
    items: [
      { id: "wifi", name: "와이파이", icon: Wifi },
      { id: "aircon", name: "에어컨", icon: Wind },
      { id: "tv", name: "TV", icon: Tv },
      { id: "parking", name: "주차장", icon: Car },
    ],
  },
  {
    id: "amenities",
    name: "부대시설",
    icon: Dumbbell,
    items: [
      { id: "pool", name: "수영장", icon: Waves },
      { id: "gym", name: "헬스장", icon: Dumbbell },
      { id: "cafe", name: "카페", icon: Coffee },
      { id: "kitchen", name: "공용주방", icon: Utensils },
    ],
  },
  {
    id: "policy",
    name: "정책",
    icon: ShieldCheck,
    items: [
      { id: "pet", name: "반려동물", icon: PawPrint },
      { id: "kids", name: "아동 동반", icon: Baby },
      { id: "cleaning", name: "청소 서비스", icon: Sparkles },
      { id: "security", name: "24시 보안", icon: ShieldCheck },
    ],
  },
];

// Time options
const TIME_OPTIONS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

export default function AddPropertyPage() {
  const [images, setImages] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<string>("");
  const [address, setAddress] = useState("");
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [propertyName, setPropertyName] = useState("");
  const [description, setDescription] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(2);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("basic");

  // Handle image upload simulation
  const handleImageAdd = () => {
    if (images.length >= 5) return;
    // Simulate adding a placeholder image
    const placeholders = [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop",
    ];
    setImages([...images, placeholders[images.length]]);
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleAddressSearch = () => {
    // Simulate address search
    setAddress("123 Nguyen Hue, District 1, Ho Chi Minh City");
    setIsAddressConfirmed(true);
  };

  // Check if all facilities in a category are selected
  const isCategoryComplete = (categoryId: string) => {
    const category = FACILITY_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return false;
    return category.items.every((item) => selectedFacilities.includes(item.id));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      {/* PWA Mobile Container */}
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: COLORS.deepBlue }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">500stay</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium">
              KO
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-40">
          {/* Page Header */}
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">새 매물 등록</h1>
            <p className="text-sm text-gray-500 mt-1">
              숙소 정보를 입력하여 매물을 등록하세요
            </p>
          </div>

          <form className="px-6 space-y-6">
            {/* Photo Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  사진 등록
                  <span className="text-red-500 ml-1">*</span>
                </h2>
                <span className="text-sm text-gray-500">({images.length}/5)</span>
              </div>

              {/* Horizontal Thumbnail List */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 text-center text-xs py-1 text-white font-medium"
                        style={{ backgroundColor: COLORS.deepBlue }}
                      >
                        대표
                      </div>
                    )}
                  </div>
                ))}

                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gray-400 min-h-[96px]"
                  >
                    <Plus className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">추가</span>
                  </button>
                )}
              </div>
            </section>

            {/* Property Type Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                매물 종류
                <span className="text-red-500 ml-1">*</span>
              </h2>

              {/* Chip Style Buttons */}
              <div className="flex flex-wrap gap-2">
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
                    className="px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px]"
                    style={{
                      backgroundColor:
                        propertyType === value ? COLORS.deepBlue : COLORS.gray100,
                      color: propertyType === value ? COLORS.white : COLORS.gray700,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Room Details */}
              {propertyType && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      방 개수
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      화장실
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      최대인원
                    </label>
                    <select
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}명
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* Address Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                주소
                <span className="text-red-500 ml-1">*</span>
              </h2>

              {!isAddressConfirmed ? (
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="w-full px-4 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 min-h-[56px] text-white font-medium"
                  style={{ backgroundColor: COLORS.deepBlue }}
                >
                  <MapPin className="w-5 h-5" />
                  <span>주소 찾기</span>
                </button>
              ) : (
                <div
                  className="p-4 rounded-2xl cursor-pointer transition-colors"
                  style={{
                    backgroundColor: `${COLORS.emeraldGreen}10`,
                    border: `2px solid ${COLORS.emeraldGreen}30`,
                  }}
                  onClick={() => setIsAddressConfirmed(false)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${COLORS.emeraldGreen}20` }}
                    >
                      <Check className="w-5 h-5" style={{ color: COLORS.emeraldGreen }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-xs font-medium"
                        style={{ color: COLORS.emeraldGreen }}
                      >
                        확정된 주소 (클릭하여 수정)
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddress("");
                        setIsAddressConfirmed(false);
                      }}
                      className="p-2 rounded-full transition-colors flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.emeraldGreen}20` }}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Unit Number */}
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: COLORS.gray50 }}>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  동호수 (선택)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      동
                    </label>
                    <input
                      type="text"
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder="예: A, 1"
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      호실
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="예: 101"
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm min-h-[44px] focus:outline-none"
                    />
                  </div>
                </div>
                <p
                  className="text-xs mt-3 flex items-start gap-1"
                  style={{ color: COLORS.gray500 }}
                >
                  <span style={{ color: COLORS.deepBlue }}>i</span>
                  <span>
                    동호수는 예약이 완료된 이후에 임차인에게만 표시됩니다.
                  </span>
                </p>
              </div>
            </section>

            {/* Rental Period Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                임대 희망 날짜
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    시작일
                  </label>
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 min-h-[56px]"
                    style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: COLORS.deepBlue }} />
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    종료일
                  </label>
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 min-h-[56px]"
                    style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }}
                  >
                    <Calendar className="w-5 h-5" style={{ color: COLORS.deepBlue }} />
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Check-in/out Time Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                체크인/체크아웃 시간
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    체크인
                  </label>
                  <select
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    체크아웃
                  </label>
                  <select
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Price Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                1주일 임대료
                <span className="text-red-500 ml-1">*</span>
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={weeklyRent}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = value ? Number(value).toLocaleString() : "";
                    setWeeklyRent(formatted);
                  }}
                  placeholder="0"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-xl font-bold text-right pr-16 min-h-[60px] focus:outline-none"
                  style={{ borderColor: weeklyRent ? COLORS.deepBlue : COLORS.gray200 }}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                  style={{ color: COLORS.deepBlue }}
                >
                  VND
                </span>
              </div>
              {weeklyRent && (
                <p className="text-sm text-gray-500 mt-2 text-right">
                  월 약{" "}
                  <span className="font-semibold" style={{ color: COLORS.deepBlue }}>
                    {(Number(weeklyRent.replace(/,/g, "")) * 4).toLocaleString()}
                  </span>{" "}
                  VND
                </p>
              )}
            </section>

            {/* Property Name Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                매물명
                <span className="text-red-500 ml-1">*</span>
              </h2>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="예: 호치민 1군 럭셔리 원룸"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm min-h-[52px] focus:outline-none"
                maxLength={50}
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {propertyName.length}/50
              </p>
            </section>

            {/* Description Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                소개글 (선택)
              </h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="숙소에 대한 간단한 소개를 작성해주세요..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm min-h-[120px] resize-none focus:outline-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {description.length}/500
              </p>
            </section>

            {/* Facilities Section */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                숙소시설 및 정책
              </h2>

              <div className="space-y-3">
                {FACILITY_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const isExpanded = expandedCategory === category.id;
                  const isComplete = isCategoryComplete(category.id);

                  return (
                    <div
                      key={category.id}
                      className="border-2 rounded-2xl overflow-hidden transition-all"
                      style={{
                        borderColor: isComplete
                          ? COLORS.emeraldGreen
                          : COLORS.gray200,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : category.id)
                        }
                        className="w-full px-4 py-4 flex items-center justify-between min-h-[56px]"
                        style={{
                          backgroundColor: isComplete
                            ? `${COLORS.emeraldGreen}10`
                            : COLORS.white,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: isComplete
                                ? `${COLORS.emeraldGreen}20`
                                : COLORS.gray100,
                            }}
                          >
                            <CategoryIcon
                              className="w-5 h-5"
                              style={{
                                color: isComplete
                                  ? COLORS.emeraldGreen
                                  : COLORS.gray600,
                              }}
                            />
                          </div>
                          <div className="text-left">
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                            {isComplete && (
                              <span
                                className="ml-2 text-xs font-semibold"
                                style={{ color: COLORS.emeraldGreen }}
                              >
                                뱃지 획득!
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-2 gap-2">
                            {category.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isSelected = selectedFacilities.includes(
                                item.id
                              );

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleFacility(item.id)}
                                  className="flex items-center gap-2 px-3 py-3 rounded-xl transition-all min-h-[48px]"
                                  style={{
                                    backgroundColor: isSelected
                                      ? COLORS.deepBlue
                                      : COLORS.gray100,
                                    color: isSelected
                                      ? COLORS.white
                                      : COLORS.gray700,
                                  }}
                                >
                                  <ItemIcon className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {item.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {!isComplete && (
                            <p
                              className="text-xs mt-3 text-center"
                              style={{ color: COLORS.emeraldGreen }}
                            >
                              모든 항목 선택 시 뱃지 획득!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </form>
        </div>

        {/* Fixed Bottom Submit Button */}
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-white border-t border-gray-100"
          style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}
        >
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all min-h-[56px] text-white"
            style={{ backgroundColor: COLORS.deepBlue }}
          >
            매물 등록하기
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-50"
          style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: "홈", active: false },
              { icon: Search, label: "검색", active: false },
              { icon: Building, label: "내 매물", active: true },
              { icon: User, label: "프로필", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] min-h-[56px]"
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: active ? COLORS.deepBlue : COLORS.gray400 }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: active ? COLORS.deepBlue : COLORS.gray500 }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
