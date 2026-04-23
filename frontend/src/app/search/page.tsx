/**
 * Search Results Page (검색 결과 페이지)
 * * - 주소/업장 검색 결과 표시
 * - 날짜 및 인원수 필터
 * - 주소 기반 매물 필터링
 */

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAvailableProperties } from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { geocodeAddress } from "@/lib/api/geocoding";
import { getUIText } from "@/utils/i18n";
import PropertyCard from "@/components/PropertyCard";
import TopBar from "@/components/TopBar";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Search,
  X,
  Bed,
  Sparkles,
  Tv,
  RotateCcw,
} from "lucide-react";
import { FACILITY_OPTIONS } from "@/lib/constants/facilities";
import CalendarComponent from "@/components/CalendarComponent";
import Image from "next/image";
import { formatPrice, formatFullPrice } from "@/lib/utils/propertyUtils";
import { VIETNAM_CITIES } from "@/lib/data/vietnam-regions";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import { getSuggestionBadge, cleanDisplayName, cleanSubAddress } from "@/hooks/useLocationSearch";
import {
  useSearchRoomFilter,
} from "./hooks/useSearchRoomFilter";
import { useSearchCalendarFilter } from "./hooks/useSearchCalendarFilter";
import { useSearchLocationFilter } from "./hooks/useSearchLocationFilter";
import { useSearchFilterEngine } from "./hooks/useSearchFilterEngine";

function getRegionDisplayName(region: VietnamRegion, lang: string): string {
  if (lang === "ko") return region.nameKo ?? region.name ?? "";
  if (lang === "vi") return region.nameVi ?? region.name ?? "";
  if (lang === "ja") return region.nameJa ?? region.name ?? "";
  if (lang === "zh") return region.nameZh ?? region.name ?? "";
  return region.name ?? "";
}

/** VND 천 단위 콤마 포맷 */
function formatVndWithComma(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** VND 만 단위 포맷 (예: 2,500,000 -> 250만) */
function formatVndToMan(value: number): string {
  if (value < 10000) return value.toString();
  const man = Math.floor(value / 10000);
  const remainder = value % 10000;
  if (remainder === 0) return `${man.toLocaleString()}만`;
  return `${man.toLocaleString()}.${Math.floor(remainder / 1000)}만`;
}

/** VND 만 단위 간단 포맷 (예: 2,500,000 -> 250만) */
function formatVndToManSimple(value: number): string {
  if (value < 10000) return value.toString();
  const man = Math.floor(value / 10000);
  return `${man.toLocaleString()}만`;
}

/** 입력 문자열을 숫자로 파싱 (콤마 제거) */
function parseVndInput(s: string): number {
  const n = parseInt(String(s).replace(/\D/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

/** 비선형 구간별 step (VND): ~200만 10만 / 200만~500만 50만 / 500만~1000만 100만 / 1000만+ 1000만 */
function getStepForValue(value: number): number {
  if (value < 2_000_000) return 100_000;
  if (value < 5_000_000) return 500_000;
  if (value < 10_000_000) return 1_000_000;
  return 10_000_000;
}

/** 0 ~ priceCap 구간의 비선형 허용 금액 배열 (슬라이더 스텝용) */
function getAllowedPriceValues(priceCap: number): number[] {
  const out: number[] = [0];
  let v = 0;
  while (v < priceCap) {
    const step = getStepForValue(v);
    v += step;
    if (v <= priceCap) out.push(v);
  }
  if (out[out.length - 1] !== priceCap) out.push(priceCap);
  return out;
}

/** 허용 값 배열에서 value에 가장 가까운 인덱스 */
function getClosestAllowedIndex(value: number, allowed: number[]): number {
  if (allowed.length === 0) return 0;
  let best = 0;
  let bestDist = Math.abs(allowed[0] - value);
  for (let i = 1; i < allowed.length; i++) {
    const d = Math.abs(allowed[i] - value);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
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

  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // 날짜 필터
  const {
    showCalendar,
    calendarMode,
    checkInDate,
    checkOutDate,
    openCalendar,
    closeCalendar,
    handleCheckInSelect,
    handleCheckOutSelect,
    resetCalendarDates,
    formatDate,
  } = useSearchCalendarFilter(currentLanguage);

  // 방 개수 필터 (매물 등록 시 카테고리/방 개수 기반)
  const {
    roomFilter,
    setRoomFilter,
    showRoomDropdown,
    roomDropdownRef,
    roomFilterOptions,
    selectedRoomLabel,
    closeRoomDropdown,
    resetRoomFilter,
    toggleRoomDropdown,
  } = useSearchRoomFilter(currentLanguage);

  // 고급필터
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [fullFurniture, setFullFurniture] = useState(false);
  const [fullElectronics, setFullElectronics] = useState(false);
  const [fullOptionKitchen, setFullOptionKitchen] = useState(false);
  /** 시설·정책: 매물 등록 시 숙소시설 및 정책과 동일한 아이콘 전체. id -> 켜짐 여부 */
  const [amenityFilters, setAmenityFilters] = useState<Record<string, boolean>>(
    {},
  );
  /** 임대료 바: 클릭한 쪽 포인터만 드래그되도록 (min | max | null) */
  const [rentActiveThumb, setRentActiveThumb] = useState<"min" | "max" | null>(
    null,
  );
  const rentTrackRef = useRef<HTMLDivElement>(null);

  // 필터 적용 상태 (검색 버튼을 눌러야 필터 적용)
  const [filtersApplied, setFiltersApplied] = useState(false);
  // 검색하기 클릭 시마다 증가 → useEffect에서 최신 고급필터(와이파이 등)로 재적용
  const [filterVersion, setFilterVersion] = useState(0);

  // 자동 필터링 적용 여부 (URL 파라미터가 있으면 true)
  const [shouldAutoApplyFilters, setShouldAutoApplyFilters] = useState(
    !!(query || cityIdParam || districtIdParam)
  );

  const {
    searchQuery,
    selectedCityId,
    selectedDistrictId,
    searchLocation,
    setSearchLocation,
    suggestions,
    isSearching,
    showSuggestions,
    setShowSuggestions,
    searchContainerRef,
    closedBySelection,
    handleAddressInputChange,
    handleSelectSuggestion,
    handleCityChange,
    handleDistrictChange,
    districts,
    syncFromUrlParams,
    applyRegionMatchFromQuery,
  } = useSearchLocationFilter({
    currentLanguage,
    initialQuery: query,
    initialCityId: cityIdParam,
    initialDistrictId: districtIdParam,
    applyFilters: () => applyFilters(),
  });

  const { applyFilters } = useSearchFilterEngine({
    properties,
    setFilteredProperties,
    setFiltersApplied,
    selectedCityId,
    selectedDistrictId,
    districts,
    searchLocation,
    checkInDate,
    checkOutDate,
    roomFilter,
    fullFurniture,
    fullElectronics,
    fullOptionKitchen,
    amenityFilters,
    minPrice,
    maxPrice,
  });

  // 매물 클릭 시 /properties/[id] 로 이동 (인터셉팅 라우트에서 모달처럼 표시)
  const handlePropertyClick = (property: PropertyData) => {
    router.push(`/properties/${property.id}`);
  };

  // 현재 매물 인덱스

  // URL 파라미터와 동기화: q, cityId, districtId
  useEffect(() => {
    syncFromUrlParams(query, cityIdParam, districtIdParam);
    
    // URL 파라미터가 있으면 자동 필터링 적용 플래그 설정
    if (query || cityIdParam || districtIdParam) {
      setShouldAutoApplyFilters(true);
    }
  }, [query, cityIdParam, districtIdParam, syncFromUrlParams]);

  // 홈에서 도시/구 검색으로 들어온 경우: q만 있고 cityId/districtId 없으면 검색어로 지역 매칭
  useEffect(() => {
    if (!query.trim() || cityIdParam || districtIdParam) return;
    if (applyRegionMatchFromQuery(query)) {
      setShouldAutoApplyFilters(true);
    }
  }, [query, cityIdParam, districtIdParam, applyRegionMatchFromQuery]);

  // 매물 주당 임대료 최대값 (고급필터 슬라이더 상한)
  const priceCap =
    properties.length > 0
      ? Math.max(0, ...properties.map((p) => p.price || 0))
      : 50000000;

  // 매물 데이터 로드
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const allProperties = await getAvailableProperties();
        console.log('Loaded properties:', allProperties.length, allProperties);
        setProperties(allProperties);
        if (allProperties.length > 0) {
          const prices = allProperties
            .map((p) => p.price || 0)
            .filter((p) => p > 0);
          if (prices.length > 0) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setMinPrice(min);
            setMaxPrice(max);
          }
        }
        
        // 매물 로드 후, URL 파라미터가 있으면 자동으로 필터링 적용
        // 홈에서 검색 후 검색 결과 페이지로 넘어올 때 바로 필터링 적용
        if (cityIdParam || districtIdParam || query) {
          console.log('URL params detected, applying filters...');
          // 즉시 필터링 적용
          applyFilters();
        } else {
          // URL 파라미터가 없으면 모든 매물 표시
          setFilteredProperties(allProperties);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
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

  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    } else {
      applyFilters();
    }
  }, [properties, filtersApplied, filterVersion]);

  // properties가 로드되면 shouldAutoApplyFilters가 true이면 자동으로 필터링 적용
  useEffect(() => {
    if (properties.length > 0 && shouldAutoApplyFilters) {
      setFiltersApplied(true);
      applyFilters();
      setShouldAutoApplyFilters(false); // 한 번만 실행
    }
  }, [properties, shouldAutoApplyFilters]);


  // 고급 필터 초기화 함수 (주소, 도시, 구는 유지)
  const resetAdvancedFilters = () => {
    // 가격 범위 초기화 (전체 매물의 최소/최대값으로)
    if (properties.length > 0) {
      const prices = properties.map((p) => p.price || 0).filter((p) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setMinPrice(min);
        setMaxPrice(max);
      } else {
        setMinPrice(0);
        setMaxPrice(50000000);
      }
    } else {
      setMinPrice(0);
      setMaxPrice(50000000);
    }

    // 풀 옵션 필터 초기화
    setFullFurniture(false);
    setFullElectronics(false);
    setFullOptionKitchen(false);

    // 시설·정책 필터 초기화
    setAmenityFilters({});

    // 방 개수 필터 초기화
    resetRoomFilter();

    // 날짜 필터 초기화
    resetCalendarDates();

    // 주소, 도시, 구는 초기화하지 않음 (검색 위치, 검색어, 도시/구 선택 유지)
    // setSearchLocation(null);
    // setSearchQuery("");
    // setSelectedCityId(null);
    // setSelectedDistrictId(null);

    // 필터 적용 상태 초기화
    setFiltersApplied(false);
    setFilteredProperties(properties);
  };

  const BRAND = {
    primary: "#E63946",
    primaryLight: "#FF6B6B", // Light Coral (밝은 산호)
    muted: "#9CA3AF",
    text: "#1F2937",
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* TopBar 컴포넌트 사용 */}
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        {/* 검색어 입력창 — 홈(HeroSection)과 동일한 카드 스타일 */}
        <div className="px-4 pb-3 pt-3">
          <div className="bg-white rounded-2xl shadow-lg p-4" style={{ border: "1px solid #F3F4F6" }}>
          <div className="relative" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4" style={{ color: BRAND.muted }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleAddressInputChange}
              onFocus={() => setShowSuggestions(false)}
              placeholder={getUIText(
                "searchPlaceholderCityDistrict",
                currentLanguage,
              )}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl transition-all focus:outline-none"
              style={{
                backgroundColor: "#F9FAFB",
                border: `1.5px solid ${BRAND.primary}`,
                color: BRAND.text,
                outline: "none",
              }}
            />
            {searchQuery &&
              showSuggestions &&
              suggestions.length > 0 &&
              !closedBySelection && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg max-h-72 overflow-y-auto" style={{ border: "1px solid #E5E7EB" }}>
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
                        className="w-full text-left px-4 py-3 transition-colors border-b border-gray-50 last:border-b-0"
                        style={{ backgroundColor: suggestion.isRegion ? "#FFF8F6" : "transparent" }}
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
                              <p className="text-sm font-semibold truncate" style={{ color: BRAND.text }}>
                                {mainName}
                              </p>
                            </div>
                            {subAddress && (
                              <p className="text-xs mt-1 truncate" style={{ color: BRAND.muted }}>
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
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg p-4" style={{ border: "1px solid #E5E7EB" }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: BRAND.primary }} />
                  <span className="text-sm" style={{ color: BRAND.muted }}>
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
                  handleCityChange(e.target.value || null);
                }}
                className="w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-[#E63946] focus:border-transparent transition-colors"
                style={{
                  ...(selectedCityId ? { borderColor: BRAND.primary, backgroundColor: "#E6394615", color: "#C62D3A", fontWeight: 600 } : { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", color: BRAND.text }),
                }}
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
                  handleDistrictChange(e.target.value || null);
                }}
                disabled={!selectedCityId || districts.length === 0}
                className="w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-[#E63946] focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{
                  ...(selectedDistrictId ? { borderColor: BRAND.primary, backgroundColor: "#E6394615", color: "#C62D3A", fontWeight: 600 } : { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", color: BRAND.text }),
                }}
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

        <div className="px-4 py-4 border-b border-gray-100 bg-white">
          {/* 체크인/체크아웃/인원 필터 - v0 스타일 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => openCalendar("checkin")}
              className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors ${checkInDate ? "text-white hover:opacity-90" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              style={checkInDate ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
            >
              <Calendar className={`w-4 h-4 mb-1 ${checkInDate ? "text-white" : "text-gray-600"}`} />
              <div className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${checkInDate ? "text-white" : "text-gray-400"}`}>
                {getUIText("checkIn", currentLanguage)}
              </div>
              <div className={`text-xs inline-block ${checkInDate ? "font-bold text-white" : "font-black"}`} style={!checkInDate ? { color: BRAND.primaryLight, WebkitTextStroke: "1.5px", WebkitTextStrokeColor: BRAND.primaryLight } : undefined}>
                {checkInDate ? formatDate(checkInDate) : "—"}
              </div>
            </button>

            <button
              onClick={() => openCalendar("checkout")}
              className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors ${checkOutDate ? "text-white hover:opacity-90" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              style={checkOutDate ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
            >
              <Calendar className={`w-4 h-4 mb-1 ${checkOutDate ? "text-white" : "text-gray-600"}`} />
              <div className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${checkOutDate ? "text-white" : "text-gray-400"}`}>
                {getUIText("checkOut", currentLanguage)}
              </div>
              <div className={`text-xs inline-block ${checkOutDate ? "font-bold text-white" : "font-black"}`} style={!checkOutDate ? { color: BRAND.primaryLight, WebkitTextStroke: "1.5px", WebkitTextStrokeColor: BRAND.primaryLight } : undefined}>
                {checkOutDate ? formatDate(checkOutDate) : "—"}
              </div>
            </button>

            <div className="relative" ref={roomDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  toggleRoomDropdown();
                  closeCalendar();
                }}
                className={`w-full flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors ${roomFilter ? "text-white hover:opacity-90" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                style={roomFilter ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
              >
                <Bed className={`w-4 h-4 mb-1 ${roomFilter ? "text-white" : "text-gray-600"}`} />
                <div className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${roomFilter ? "text-white" : "text-gray-400"}`}>
                  {getUIText("roomsLabel", currentLanguage)}
                </div>
                <div className={`text-xs truncate max-w-[100%] inline-block ${roomFilter ? "font-bold text-white" : "font-black"}`} style={!roomFilter ? { color: BRAND.primaryLight, WebkitTextStroke: "1.5px", WebkitTextStrokeColor: BRAND.primaryLight } : undefined}>
                  {roomFilter
                    ? selectedRoomLabel.substring(0, 8)
                    : "—"}
                </div>
              </button>
              {showRoomDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md py-1 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      resetRoomFilter();
                      closeRoomDropdown();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${!roomFilter ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {getUIText("allLabel", currentLanguage)}
                  </button>
                  {roomFilterOptions.map((opt) => (
                    <button
                      key={opt.value ?? "all"}
                      type="button"
                      onClick={() => {
                        setRoomFilter(opt.value);
                        closeRoomDropdown();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${roomFilter === opt.value ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {opt[currentLanguage as "ko" | "vi" | "en" | "ja" | "zh"] ??
                        opt.en}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 고급 필터 토글 버튼 - v0 스타일 */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowAdvancedFilters(!showAdvancedFilters);
                closeCalendar();
                closeRoomDropdown();
              }}
              className={`text-xs font-bold flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${showAdvancedFilters ? "text-white" : "hover:bg-gray-50"}`}
              style={showAdvancedFilters ? { backgroundColor: BRAND.primary } : { color: BRAND.primary }}
            >
              <span>{getUIText("advancedFilter", currentLanguage)}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${showAdvancedFilters ? "rotate-90" : ""}`}
              />
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
              {/* 임대료(주당) — 비선형 가격 범위 슬라이더만, 실시간 금액 표시, 최소 거리 유지 */}
              {(() => {
                const allowedValues = getAllowedPriceValues(priceCap);
                const minIndex = getClosestAllowedIndex(
                  minPrice,
                  allowedValues,
                );
                const maxIndex = getClosestAllowedIndex(
                  maxPrice,
                  allowedValues,
                );
                const safeMinIndex = Math.max(
                  0,
                  Math.min(minIndex, maxIndex - 1),
                );
                const safeMaxIndex = Math.min(
                  allowedValues.length - 1,
                  Math.max(maxIndex, safeMinIndex + 1),
                );
                const handleRentTrackPointerDown = (e: React.PointerEvent) => {
                  e.stopPropagation();
                  e.preventDefault();

                  const el = rentTrackRef.current;
                  if (!el) {
                    return;
                  }

                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, x / rect.width));

                  // 클릭한 위치와 각 포인터의 거리 계산 (퍼센트 단위)
                  const minPos = (minPrice / (priceCap || 1)) * 100;
                  const maxPos = (maxPrice / (priceCap || 1)) * 100;
                  const clickPos = pct * 100;

                  // 가까운 포인터 선택
                  const distToMin = Math.abs(clickPos - minPos);
                  const distToMax = Math.abs(clickPos - maxPos);

                  // 더 가까운 포인터만 이동
                  if (distToMin < distToMax) {
                    // 최저값 포인터가 더 가까움
                    const newValue = Math.round(pct * priceCap);
                    const nearestValue =
                      allowedValues[
                        getClosestAllowedIndex(newValue, allowedValues)
                      ];
                    if (nearestValue < maxPrice) {
                      setMinPrice(nearestValue);
                    } else {
                      // 최저값이 최대값에 도달하면 최대값 이동
                      setMaxPrice(nearestValue);
                    }
                  } else if (distToMax < distToMin) {
                    // 최대값 포인터가 더 가까움
                    const newValue = Math.round(pct * priceCap);
                    const nearestValue =
                      allowedValues[
                        getClosestAllowedIndex(newValue, allowedValues)
                      ];
                    if (nearestValue > minPrice) {
                      setMaxPrice(nearestValue);
                    } else {
                      // 최대값이 최저값에 도달하면 최저값 이동
                      setMinPrice(nearestValue);
                    }
                  } else {
                    // 거리가 같을 때 (매우 드문 경우)
                    const newValue = Math.round(pct * priceCap);
                    const nearestValue =
                      allowedValues[
                        getClosestAllowedIndex(newValue, allowedValues)
                      ];
                    if (nearestValue < maxPrice) {
                      setMinPrice(nearestValue);
                    } else {
                      setMaxPrice(nearestValue);
                    }
                  }
                };
                return (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      {getUIText("rentWeekly", currentLanguage)}
                    </label>
                    {/* 가격 표시 - v0 스타일 */}
                    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 tracking-tight">
                          {formatVndToManSimple(minPrice)} — {formatVndToManSimple(maxPrice)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">
                          VND / {currentLanguage === "ko" ? "주" : currentLanguage === "vi" ? "tuần" : "week"}
                        </div>
                      </div>
                    </div>

                    {/* 개선된 비선형 슬라이더 - 자 모양 눈금 추가 */}
                    <div
                      className="relative py-6"
                      ref={rentTrackRef}
                      onPointerDown={handleRentTrackPointerDown}
                    >
                      {/* 자 모양 배경 - 가로선 */}
                      <div className="absolute left-0 right-0 top-3 h-px bg-gray-300" />

                      {/* 주요 구간 눈금 (자 모양) */}
                      <div className="absolute left-0 right-0 top-3 flex justify-between pointer-events-none">
                        {[0, 2000000, 5000000, 10000000, priceCap]
                          .filter((value, index, array) => 
                            // 중복 제거: priceCap이 배열의 다른 값과 같으면 마지막 요소만 유지
                            value !== priceCap || index === array.length - 1
                          )
                          .map((value) => {
                            if (value > priceCap) return null;
                            const position = (value / (priceCap || 1)) * 100;
                            return (
                              <div
                                key={`price-marker-${value}`}
                                className="absolute top-0 -translate-x-1/2"
                                style={{ left: `${position}%` }}
                              >
                                {/* 긴 눈금선 */}
                                <div className="w-px h-3 bg-gray-400" />
                                {/* 눈금 라벨 */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
                                  {formatVndToManSimple(value)}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* 중간 눈금 (짧은 선) */}
                      <div className="absolute left-0 right-0 top-3 flex justify-between pointer-events-none">
                        {[
                          1000000, 3000000, 4000000, 6000000, 7000000, 8000000,
                          9000000,
                        ].map((value) => {
                          if (value > priceCap) return null;
                          const position = (value / (priceCap || 1)) * 100;
                          return (
                            <div
                              key={value}
                              className="absolute top-0 -translate-x-1/2"
                              style={{ left: `${position}%` }}
                            >
                              <div className="w-px h-2 bg-gray-300" />
                            </div>
                          );
                        })}
                      </div>

                      {/* 선택된 범위 */}
                      <div
                        className="absolute top-3 h-px rounded-full -translate-y-1/2"
                        style={{
                          backgroundColor: BRAND.primary,
                          left: `${(minPrice / (priceCap || 1)) * 100}%`,
                          width: `${((maxPrice - minPrice) / (priceCap || 1)) * 100}%`,
                        }}
                      />

                      {/* 최저가 포인터 - 드래그 가능 (웹+앱 호환) */}
                      <div
                        className="absolute top-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
                        style={{
                          left: `${(minPrice / (priceCap || 1)) * 100}%`,
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // 포인터 이동 이벤트 핸들러 (웹+앱 호환)
                          const handlePointerMove = (
                            moveEvent: PointerEvent,
                          ) => {
                            const trackEl = rentTrackRef.current;
                            if (!trackEl) {
                              return;
                            }

                            const rect = trackEl.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const pct = Math.max(
                              0,
                              Math.min(1, x / rect.width),
                            );
                            const newValue = Math.round(pct * priceCap);
                            const nearestValue =
                              allowedValues[
                                getClosestAllowedIndex(newValue, allowedValues)
                              ];

                            if (nearestValue < maxPrice) {
                              setMinPrice(nearestValue);
                            }
                          };

                          // 포인터 업 이벤트 핸들러
                          const handlePointerUp = () => {
                            document.removeEventListener(
                              "pointermove",
                              handlePointerMove,
                            );
                            document.removeEventListener(
                              "pointerup",
                              handlePointerUp,
                            );
                            document.removeEventListener(
                              "pointerleave",
                              handlePointerUp,
                            );
                            document.removeEventListener(
                              "pointercancel",
                              handlePointerUp,
                            );
                          };

                          // 포인터가 창 밖으로 나갈 때도 드래그 종료
                          const handlePointerLeave = () => {
                            handlePointerUp();
                          };

                          // 포인터 취소 시 드래그 종료
                          const handlePointerCancel = () => {
                            handlePointerUp();
                          };

                          document.addEventListener(
                            "pointermove",
                            handlePointerMove,
                          );
                          document.addEventListener(
                            "pointerup",
                            handlePointerUp,
                          );
                          document.addEventListener(
                            "pointerleave",
                            handlePointerLeave,
                          );
                          document.addEventListener(
                            "pointercancel",
                            handlePointerCancel,
                          );
                        }}
                      >
                        <div className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center" style={{ borderColor: BRAND.primary }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap" style={{ backgroundColor: BRAND.primary, borderColor: BRAND.primary }}>
                          {formatVndToManSimple(minPrice)}
                        </div>
                      </div>

                      {/* 최대가 포인터 - 드래그 가능 (웹+앱 호환) */}
                      <div
                        className="absolute top-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
                        style={{
                          left: `${(maxPrice / (priceCap || 1)) * 100}%`,
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // 포인터 이동 이벤트 핸들러 (웹+앱 호환)
                          const handlePointerMove = (
                            moveEvent: PointerEvent,
                          ) => {
                            const trackEl = rentTrackRef.current;
                            if (!trackEl) {
                              return;
                            }

                            const rect = trackEl.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const pct = Math.max(
                              0,
                              Math.min(1, x / rect.width),
                            );
                            const newValue = Math.round(pct * priceCap);
                            const nearestValue =
                              allowedValues[
                                getClosestAllowedIndex(newValue, allowedValues)
                              ];

                            if (nearestValue > minPrice) {
                              setMaxPrice(nearestValue);
                            }
                          };

                          // 포인터 업 이벤트 핸들러
                          const handlePointerUp = () => {
                            document.removeEventListener(
                              "pointermove",
                              handlePointerMove,
                            );
                            document.removeEventListener(
                              "pointerup",
                              handlePointerUp,
                            );
                            document.removeEventListener(
                              "pointerleave",
                              handlePointerUp,
                            );
                            document.removeEventListener(
                              "pointercancel",
                              handlePointerUp,
                            );
                          };

                          // 포인터가 창 밖으로 나갈 때도 드래그 종료
                          const handlePointerLeave = () => {
                            handlePointerUp();
                          };

                          // 포인터 취소 시 드래그 종료
                          const handlePointerCancel = () => {
                            handlePointerUp();
                          };

                          document.addEventListener(
                            "pointermove",
                            handlePointerMove,
                          );
                          document.addEventListener(
                            "pointerup",
                            handlePointerUp,
                          );
                          document.addEventListener(
                            "pointerleave",
                            handlePointerLeave,
                          );
                          document.addEventListener(
                            "pointercancel",
                            handlePointerCancel,
                          );
                        }}
                      >
                        <div className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center" style={{ borderColor: BRAND.primary }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap" style={{ backgroundColor: BRAND.primary, borderColor: BRAND.primary }}>
                          {formatVndToManSimple(maxPrice)}
                        </div>
                      </div>

                      {/* 숨겨진 슬라이더 (백업) */}
                      <input
                        type="range"
                        min={0}
                        max={allowedValues.length - 1}
                        step={1}
                        value={safeMinIndex}
                        onChange={(e) => {
                          const idx = Math.min(
                            Number(e.target.value),
                            safeMaxIndex - 1,
                          );
                          setMinPrice(allowedValues[idx]);
                        }}
                        className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-20"
                      />
                      <input
                        type="range"
                        min={0}
                        max={allowedValues.length - 1}
                        step={1}
                        value={safeMaxIndex}
                        onChange={(e) => {
                          const idx = Math.max(
                            Number(e.target.value),
                            safeMinIndex + 1,
                          );
                          setMaxPrice(allowedValues[idx]);
                        }}
                        className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-20"
                      />
                    </div>

                    {/* 간단한 설명 */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      {currentLanguage === "ko"
                        ? "드래그하여 가격 범위 조정"
                        : currentLanguage === "vi"
                          ? "Kéo để điều chỉnh khoảng giá"
                          : "Drag to adjust price range"}
                    </div>
                  </div>
                );
              })()}

              {/* 풀 가구 / 풀 가전 / 풀옵션 주방 */}
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  {getUIText("fullOption", currentLanguage)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFullFurniture(!fullFurniture)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                      fullFurniture ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullFurniture ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    {getUIText("fullFurniture", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullElectronics(!fullElectronics)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                      fullElectronics ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullElectronics ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    {getUIText("fullElectronics", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullOptionKitchen(!fullOptionKitchen)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                      fullOptionKitchen ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullOptionKitchen ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {getUIText("fullKitchen", currentLanguage)}
                  </button>
                </div>
              </div>

              {/* 시설·정책 — 매물 등록 시 숙소시설 및 정책과 동일한 아이콘 전체 */}
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  {getUIText("amenitiesPolicy", currentLanguage)}
                </span>
                <div className="flex flex-wrap gap-2">
                  {FACILITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const label =
                      opt.id === "cleaning"
                        ? getUIText("cleaningShort", currentLanguage)
                        : (opt.label[currentLanguage] ?? opt.label.en);
                    const on = !!amenityFilters[opt.id];
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAmenityFilters((prev) => ({
                            ...prev,
                            [opt.id]: !prev[opt.id],
                          }));
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                          on ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                        style={on ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary } : undefined}
                        title={label}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[70px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 초기화 버튼 - 검색하기 버튼 위에 배치 - v0 스타일 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={resetAdvancedFilters}
              className="flex-1 py-3 px-4 bg-white text-gray-700 rounded-lg font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {currentLanguage === "ko"
                  ? "초기화"
                  : currentLanguage === "vi"
                    ? "Đặt lại"
                    : currentLanguage === "ja"
                      ? "リセット"
                      : currentLanguage === "zh"
                        ? "重置"
                        : "Reset"}
              </span>
            </button>
            <button
              onClick={async () => {
                closeCalendar();
                closeRoomDropdown();
                await geocodeSearchQuery();
                setFiltersApplied(true);
                setFilterVersion((v) => v + 1);
              }}
              className="flex-1 py-3 px-4 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND.primary }}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{getUIText("searchButton", currentLanguage)}</span>
            </button>
          </div>
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
                onCheckInReset={resetCalendarDates}
              />
            </div>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              {getUIText("searching", currentLanguage)}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {getUIText("noResultsFound", currentLanguage)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {filteredProperties.length}
                {getUIText("propertiesFound", currentLanguage)}
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
