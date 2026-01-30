/**
 * Search Results Page (검색 결과 페이지)
 * * - 주소/업장 검색 결과 표시
 * - 날짜 및 인원수 필터
 * - 주소 기반 매물 필터링
 */

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAvailableProperties } from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { geocodeAddress } from "@/lib/api/geocoding";
import { getUIText } from "@/utils/i18n";
import PropertyCard from "@/components/PropertyCard";
import {
  Home,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Search,
  X,
  Bed,
} from "lucide-react";
import CalendarComponent from "@/components/CalendarComponent";
import Image from "next/image";
import PropertyModal from "@/components/map/PropertyModal";
import MyPropertyDetailContent from "@/components/MyPropertyDetailContent";
import { formatPrice, formatFullPrice } from "@/lib/utils/propertyUtils";
import {
  parseDate,
  isAvailableNow,
  formatDateForBadge,
} from "@/lib/utils/dateUtils";
import {
  VIETNAM_CITIES,
  getDistrictsByCityId,
  ALL_REGIONS,
  searchRegions,
} from "@/lib/data/vietnam-regions";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import {
  useLocationSearch,
  getSuggestionBadge,
  cleanDisplayName,
  cleanSubAddress,
  type LocationSuggestion,
} from "@/hooks/useLocationSearch";

// 두 좌표 간 거리 계산 (Haversine 공식)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km 단위
}

function getRegionDisplayName(region: VietnamRegion, lang: string): string {
  if (lang === "ko") return region.nameKo ?? region.name ?? "";
  if (lang === "vi") return region.nameVi ?? region.name ?? "";
  if (lang === "ja") return region.nameJa ?? region.name ?? "";
  if (lang === "zh") return region.nameZh ?? region.name ?? "";
  return region.name ?? "";
}

// 2. 실제 로직이 담긴 컴포넌트로 분리
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const cityIdParam = searchParams.get("cityId") || "";
  const districtIdParam = searchParams.get("districtId") || "";
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(
    cityIdParam || null,
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    districtIdParam || null,
  );
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 날짜 필터
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">(
    "checkin",
  );
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  // 방 개수 필터 (매물 등록 시 카테고리/방 개수 기반)
  type RoomFilterValue = "studio" | "one_room" | "two_room" | "three_plus" | "detached" | null;
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(null);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  // 고급 설정
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000); // 최대 50M VND (기본값)

  // 필터 적용 상태 (검색 버튼을 눌러야 필터 적용)
  const [filtersApplied, setFiltersApplied] = useState(false);

  // 매물 상세 모달
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null,
  );

  // 방 개수 필터 옵션 라벨 (검색 필터용)
  const ROOM_FILTER_OPTIONS: { value: RoomFilterValue; ko: string; vi: string; en: string }[] = [
    { value: "studio", ko: "스튜디오", vi: "Studio", en: "Studio" },
    { value: "one_room", ko: "1룸(방·거실 분리)", vi: "1 phòng (phòng + phòng khách)", en: "1 Room (bed + living)" },
    { value: "two_room", ko: "2룸", vi: "2 phòng", en: "2 Rooms" },
    { value: "three_plus", ko: "3룸+", vi: "3+ phòng", en: "3+ Rooms" },
    { value: "detached", ko: "독채", vi: "Nhà riêng", en: "Detached" },
  ];
  // 주소 검색 보기 (홈과 동일 로직)
  const { suggestions, isSearching, search, clearSuggestions } =
    useLocationSearch(currentLanguage);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  /** 보기 선택으로 닫은 뒤, 검색창 내용을 수정하기 전까지 드롭다운 비표시 (state로 해서 선택 직후 리렌더 보장) */
  const [closedBySelection, setClosedBySelection] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setClosedBySelection(false); // 검색창 수정 시에만 드롭다운 다시 허용
    setSearchQuery(value);
    if (!value.trim()) {
      clearSuggestions();
      setShowSuggestions(false);
      return;
    }
    await search(value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const text = suggestion.Text || "";
    // 보기 선택 직후 드롭다운이 즉시 사라지도록 동기 반영 (지도/시야 가림 방지)
    flushSync(() => {
      setShowSuggestions(false);
      setClosedBySelection(true);
    });
    clearSuggestions();
    setSearchQuery(text);
    const regionId = (suggestion.PlaceId || "").replace(/^region-/, "");
    const region = ALL_REGIONS.find((r) => r.id === regionId);
    if (region) {
      if (region.type === "city") {
        setSelectedCityId(region.id);
        setSelectedDistrictId(null);
        setSearchLocation({ lat: region.center[1], lng: region.center[0] });
      } else {
        setSelectedCityId(region.parentCity ?? null);
        setSelectedDistrictId(region.id);
        setSearchLocation({ lat: region.center[1], lng: region.center[0] });
      }
    }
  };

  // 매물 클릭 시 모달 열기
  const handlePropertyClick = (property: PropertyData) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // 이전 매물로 이동
  const handlePrevProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(
      (p) => p.id === selectedProperty.id,
    );
    const prevIndex =
      currentIndex <= 0 ? filteredProperties.length - 1 : currentIndex - 1;
    setSelectedProperty(filteredProperties[prevIndex]);
  };

  // 다음 매물로 이동
  const handleNextProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(
      (p) => p.id === selectedProperty.id,
    );
    const nextIndex =
      currentIndex >= filteredProperties.length - 1 ? 0 : currentIndex + 1;
    setSelectedProperty(filteredProperties[nextIndex]);
  };

  // 현재 매물 인덱스
  const getCurrentPropertyIndex = () => {
    if (!selectedProperty) return 0;
    return filteredProperties.findIndex((p) => p.id === selectedProperty.id);
  };

  const selectedCity = selectedCityId
    ? (VIETNAM_CITIES.find((c) => c.id === selectedCityId) ??
      ALL_REGIONS.find((r) => r.id === selectedCityId))
    : null;
  const districts = selectedCityId ? getDistrictsByCityId(selectedCityId) : [];
  const selectedDistrict = selectedDistrictId
    ? districts.find((d) => d.id === selectedDistrictId)
    : null;

  // URL 파라미터와 동기화: q, cityId, districtId
  useEffect(() => {
    setSearchQuery(query);
    if (cityIdParam) setSelectedCityId(cityIdParam);
    else setSelectedCityId(null);
    if (districtIdParam) setSelectedDistrictId(districtIdParam);
    else setSelectedDistrictId(null);
  }, [query, cityIdParam, districtIdParam]);

  // 홈에서 도시/구 검색으로 들어온 경우: q만 있고 cityId/districtId 없으면 검색어로 지역 매칭
  useEffect(() => {
    if (!query.trim() || cityIdParam || districtIdParam) return;
    const matches = searchRegions(query);
    const districtMatch = matches.find((r) => r.type === "district");
    const cityMatch = matches.find((r) => r.type === "city");
    if (districtMatch) {
      setSelectedCityId(districtMatch.parentCity ?? null);
      setSelectedDistrictId(districtMatch.id);
    } else if (cityMatch) {
      setSelectedCityId(cityMatch.id);
      setSelectedDistrictId(null);
    }
  }, [query]);

  // 매물 데이터 로드
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const allProperties = await getAvailableProperties();
        setProperties(allProperties);

        if (allProperties.length > 0) {
          const maxPropertyPrice = Math.max(
            ...allProperties.map((p) => p.price || 0),
          );
          if (maxPropertyPrice > 0) {
            setMaxPrice(Math.ceil(maxPropertyPrice * 1.1));
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // 주소를 좌표로 변환
  const geocodeSearchQuery = async () => {
    if (!searchQuery.trim()) {
      setSearchLocation(null);
      return;
    }

    try {
      const result = await geocodeAddress(searchQuery, currentLanguage);
      setSearchLocation({ lat: result.lat, lng: result.lng });
    } catch (error) {
      setSearchLocation(null);
    }
  };

  // 매물 필터링
  const applyFilters = () => {
    let filtered = properties;

    if (searchLocation) {
      filtered = filtered.filter((property) => {
        if (!property.coordinates) return false;
        const distance = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          property.coordinates.lat,
          property.coordinates.lng,
        );
        return distance <= 50;
      });
    }

    if (checkInDate && checkOutDate) {
      filtered = filtered.filter((property) => {
        if (!property.checkInDate || !property.checkOutDate) return false;
        const propCheckInDate = parseDate(property.checkInDate);
        const propCheckOutDate = parseDate(property.checkOutDate);
        if (!propCheckInDate || !propCheckOutDate) return false;
        return (
          checkInDate <= propCheckOutDate && checkOutDate >= propCheckInDate
        );
      });
    }

    // 방 개수/카테고리 필터 (매물 등록 시 저장된 propertyType, bedrooms 기반)
    // 독채: 카테고리 '독채' 선택 시 노출 + 방 개수 필터(2룸/3룸+) 선택 시 해당 방 수 독채도 노출
    if (roomFilter) {
      filtered = filtered.filter((property) => {
        const pt = property.propertyType;
        const beds = property.bedrooms ?? 0;
        switch (roomFilter) {
          case "studio":
            return pt === "studio";
          case "one_room":
            return pt === "one_room";
          case "two_room":
            return beds === 2; // 방 개수 2 (two_room, three_plus 2, 독채 2 포함)
          case "three_plus":
            return beds >= 3; // 방 개수 3,4,5+ (three_plus, 독채 3+ 포함)
          case "detached":
            return pt === "detached";
          default:
            return true;
        }
      });
    }

    filtered = filtered.filter((property) => {
      const price = property.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    if (searchLocation) {
      filtered = filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distA = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          a.coordinates.lat,
          a.coordinates.lng,
        );
        const distB = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          b.coordinates.lat,
          b.coordinates.lng,
        );
        return distA - distB;
      });
    }

    setFilteredProperties(filtered);
    setFiltersApplied(true);
  };

  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    }
  }, [properties, filtersApplied]);

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    setCheckOutDate(null);
    setCalendarMode("checkout");
    setShowCalendar(true);
  };

  const handleCheckOutSelect = (date: Date) => {
    setCheckOutDate(date);
    setShowCalendar(false);
  };

  const openCalendar = (mode: "checkin" | "checkout") => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
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
  };

  // 방 개수 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoomDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roomFilterLabel = (): string => {
    if (!roomFilter) return currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Rooms";
    const opt = ROOM_FILTER_OPTIONS.find((o) => o.value === roomFilter);
    if (!opt) return "";
    return opt[currentLanguage as "ko" | "vi" | "en"] ?? opt.en;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => router.push(user ? "/profile" : "/login")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {/* 검색어 입력창 — 지도 페이지와 동일한 로직 (드롭다운 포함) */}
          <div className="px-4 pb-3">
            <div className="relative" ref={searchContainerRef}>
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleAddressInputChange}
                  onFocus={() => {
                    // 검색창 클릭 시 드롭다운 닫기
                    setShowSuggestions(false);
                  }}
                  placeholder={getUIText(
                    "searchPlaceholderCityDistrict",
                    currentLanguage,
                  )}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
              {searchQuery && showSuggestions && suggestions.length > 0 && !closedBySelection && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                  {suggestions.map((suggestion, index) => {
                    const badge = getSuggestionBadge(
                      suggestion,
                      currentLanguage,
                    );
                    const displayText = suggestion.Text || "";
                    const parts = displayText.split(",");
                    const mainName = cleanDisplayName(
                      parts[0]?.trim() || displayText,
                    );
                    const subAddress = cleanSubAddress(
                      parts.slice(1).join(",").trim(),
                    );
                    return (
                      <button
                        key={suggestion.PlaceId || index}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${suggestion.isRegion ? "bg-blue-50/30" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">
                            {badge.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${badge.color} text-white font-medium flex-shrink-0`}
                              >
                                {badge.text}
                              </span>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {mainName}
                              </p>
                            </div>
                            {subAddress && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {subAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {isSearching && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    <span className="text-sm">
                      {getUIText("searching", currentLanguage)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* 도시·구 — 도시 드롭다운, 선택 시 파란색 */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {getUIText("labelCity", currentLanguage)}
                </label>
                <select
                  value={selectedCityId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedCityId(id);
                    setSelectedDistrictId(null);
                    if (id) {
                      const city =
                        VIETNAM_CITIES.find((c) => c.id === id) ??
                        ALL_REGIONS.find((r) => r.id === id);
                      if (city)
                        setSearchLocation({
                          lat: city.center[1],
                          lng: city.center[0],
                        });
                    } else setSearchLocation(null);
                  }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    selectedCityId
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                >
                  <option value="">
                    {currentLanguage === "ko"
                      ? "도시 선택"
                      : currentLanguage === "vi"
                        ? "Chọn thành phố"
                        : "Select city"}
                  </option>
                  {VIETNAM_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getRegionDisplayName(c, currentLanguage)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {getUIText("labelDistrict", currentLanguage)}
                </label>
                <select
                  value={selectedDistrictId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedDistrictId(id);
                    if (id) {
                      const district = districts.find((d) => d.id === id);
                      if (district)
                        setSearchLocation({
                          lat: district.center[1],
                          lng: district.center[0],
                        });
                    } else if (selectedCityId) {
                      const city =
                        VIETNAM_CITIES.find((c) => c.id === selectedCityId) ??
                        ALL_REGIONS.find((r) => r.id === selectedCityId);
                      if (city)
                        setSearchLocation({
                          lat: city.center[1],
                          lng: city.center[0],
                        });
                    } else setSearchLocation(null);
                  }}
                  disabled={!selectedCityId || districts.length === 0}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
                    selectedDistrictId
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                >
                  <option value="">
                    {getUIText("selectDistrictPlaceholder", currentLanguage)}
                  </option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {getRegionDisplayName(d, currentLanguage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            <button
              onClick={() => openCalendar("checkin")}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentLanguage === "ko" ? "체크인" : "Check-in"}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {checkInDate ? formatDate(checkInDate) : "Select date"}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => openCalendar("checkout")}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {checkOutDate ? formatDate(checkOutDate) : "Select date"}
                  </div>
                </div>
              </div>
            </button>

            <div className="flex-1 relative" ref={roomDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowRoomDropdown(!showRoomDropdown);
                  setShowCalendar(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-gray-600" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500">
                      {currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Rooms"}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {roomFilter ? roomFilterLabel() : currentLanguage === "ko" ? "선택" : currentLanguage === "vi" ? "Chọn" : "Select"}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showRoomDropdown ? "rotate-180" : ""}`} />
              </button>
              {showRoomDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomFilter(null);
                      setShowRoomDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${!roomFilter ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {currentLanguage === "ko" ? "전체" : currentLanguage === "vi" ? "Tất cả" : "All"}
                  </button>
                  {ROOM_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value ?? "all"}
                      type="button"
                      onClick={() => {
                        setRoomFilter(opt.value);
                        setShowRoomDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm ${roomFilter === opt.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {opt[currentLanguage as "ko" | "vi" | "en"] ?? opt.en}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <button
              onClick={() => {
                setShowAdvancedSettings(!showAdvancedSettings);
                setShowCalendar(false);
                setShowRoomDropdown(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <span>
                {currentLanguage === "ko" ? "고급설정" : "Advanced Settings"}
              </span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${showAdvancedSettings ? "rotate-90" : ""}`}
              />
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {currentLanguage === "ko" ? "가격 범위" : "Price Range"}
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(Math.min(Number(e.target.value), maxPrice))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(Math.max(Number(e.target.value), minPrice))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Min</span>
                      <span className="font-medium text-gray-900">
                        {minPrice.toLocaleString()} VND
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Max</span>
                      <span className="font-medium text-gray-900">
                        {maxPrice.toLocaleString()} VND
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={async () => {
              setShowCalendar(false);
              setShowRoomDropdown(false);
              await geocodeSearchQuery();
              applyFilters();
            }}
            className="w-full mt-4 py-3.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span>{currentLanguage === "ko" ? "검색하기" : "Search"}</span>
          </button>
        </div>

        {showCalendar && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeCalendar}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onCheckInSelect={handleCheckInSelect}
                onCheckOutSelect={handleCheckOutSelect}
                currentLanguage={currentLanguage}
                onClose={closeCalendar}
                mode={calendarMode}
                onCheckInReset={() => {
                  setCheckInDate(null);
                  setCheckOutDate(null);
                  setCalendarMode("checkin");
                }}
              />
            </div>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Searching...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No results found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {filteredProperties.length} 개의 매물을 찾았습니다.
              </div>
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSelected={false}
                  onClick={() => handlePropertyClick(property)}
                  currentLanguage={currentLanguage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showPropertyModal && selectedProperty && (
        user && selectedProperty.ownerId === user.uid ? (
          <div
            className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowPropertyModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[430px] max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <MyPropertyDetailContent
                property={selectedProperty}
                currentLanguage={currentLanguage}
                onBack={() => setShowPropertyModal(false)}
                onEdit={() => {
                  setShowPropertyModal(false);
                  if (selectedProperty?.id)
                    router.push(`/profile/my-properties/${selectedProperty.id}/edit`);
                }}
              />
            </div>
          </div>
        ) : (
          <PropertyModal
            propertyData={selectedProperty}
            currentLanguage={currentLanguage}
            onClose={() => setShowPropertyModal(false)}
            onPrev={handlePrevProperty}
            onNext={handleNextProperty}
            hasPrev={filteredProperties.length > 1}
            hasNext={filteredProperties.length > 1}
            currentIndex={getCurrentPropertyIndex()}
            totalProperties={filteredProperties.length}
          />
        )
      )}
    </div>
  );
}

// 3. 빌드 에러 해결을 위한 외부 래퍼
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
