/**
 * Search Results Page (검색 결과 페이지)
 * * - 주소/업장 검색 결과 표시
 * - 날짜 및 인원수 필터
 * - 주소 기반 매물 필터링
 */

"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { flushSync } from "react-dom";
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
import {
  FULL_OPTION_KITCHEN_IDS,
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
  FACILITY_OPTIONS,
} from "@/lib/constants/facilities";
import CalendarComponent from "@/components/CalendarComponent";
import Image from "next/image";
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
  type RoomFilterValue =
    | "studio"
    | "one_room"
    | "two_room"
    | "three_plus"
    | "detached"
    | null;
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(null);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

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
  // URL 파라미터가 있으면 초기에 필터 적용 상태로 설정
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // 자동 필터����� 적용 여부 (URL 파라미터가 있으면 true)
  const [shouldAutoApplyFilters, setShouldAutoApplyFilters] = useState(
    !!(query || cityIdParam || districtIdParam)
  );


  // 방 개수 필터 옵션 라벨 (5개국어)
  const ROOM_FILTER_OPTIONS: {
    value: RoomFilterValue;
    ko: string;
    vi: string;
    en: string;
    ja: string;
    zh: string;
  }[] = [
    {
      value: "studio",
      ko: "스튜디오",
      vi: "Studio",
      en: "Studio",
      ja: "スタジオ",
      zh: "一室",
    },
    {
      value: "one_room",
      ko: "1룸(방·거실 분리)",
      vi: "1 phòng (phòng + phòng khách)",
      en: "1 Room (bed + living)",
      ja: "1ルーム",
      zh: "一室(卧室+客厅)",
    },
    {
      value: "two_room",
      ko: "2룸",
      vi: "2 phòng",
      en: "2 Rooms",
      ja: "2ルーム",
      zh: "两室",
    },
    {
      value: "three_plus",
      ko: "3룸+",
      vi: "3+ phòng",
      en: "3+ Rooms",
      ja: "3ルーム+",
      zh: "三室以上",
    },
    {
      value: "detached",
      ko: "독채",
      vi: "Nhà riêng",
      en: "Detached",
      ja: "戸建て",
      zh: "独栋",
    },
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
      // 구/도시 선택 시 자동으로 필터링 적용
      setTimeout(() => {
        applyFilters();
      }, 100);
    }
  };

  // 매물 클릭 시 /properties/[id] 로 이동 (인터셉팅 라우트에서 모달처럼 표시)
  const handlePropertyClick = (property: PropertyData) => {
    router.push(`/properties/${property.id}`);
  };

  // 현재 매물 인덱스

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
    
    // URL 파라미터가 있으면 자동 필터링 적용 플래그 설정
    if (query || cityIdParam || districtIdParam) {
      setShouldAutoApplyFilters(true);
    }
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
      setShouldAutoApplyFilters(true);
    } else if (cityMatch) {
      setSelectedCityId(cityMatch.id);
      setSelectedDistrictId(null);
      setShouldAutoApplyFilters(true);
    }
  }, [query]);

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

  // 매물 필터링
  const applyFilters = () => {
    console.log('applyFilters called with:', {
      propertiesCount: properties.length,
      selectedCityId,
      selectedDistrictId,
      searchLocation,
      filtersApplied,
      shouldAutoApplyFilters
    });
    
    if (properties.length === 0) {
      console.log('No properties to filter');
      setFilteredProperties([]);
      return;
    }
    
    let filtered = properties;

    // 구 필터링: 선택된 구에 있는 매물만 표시 (구 ID 직접 비교 + 도시 ID 검증)
    if (selectedDistrictId) {
      const selectedDistrict = districts.find(
        (d) => d.id === selectedDistrictId,
      );
      if (selectedDistrict) {
        filtered = filtered.filter((property) => {
          // 1. 구 ID가 있는 경우: 정확한 ID 비교
          if (property.districtId) {
            // 구 ID가 일치하는지 확인
            const districtMatch = property.districtId === selectedDistrictId;

            // 도시 ID도 있는 경우 도시 ID도 검증 (구는 특정 도시에 속하므로)
            if (property.cityId && selectedCityId) {
              return districtMatch && property.cityId === selectedCityId;
            }

            return districtMatch;
          }

          // 2. 구 ID가 없지만 도시 ID가 있는 경우: 도시 ID 비교
          if (property.cityId && selectedCityId) {
            // 구를 선택했으면 해당 구의 도시 ID와 매물의 도시 ID 비교
            return property.cityId === selectedCityId;
          }

          // 3. 구 ID와 도시 ID 모두 없는 경우: 거리 기반 필터링 (하위 호환성)
          if (!property.coordinates) return false;
          const distance = calculateDistance(
            selectedDistrict.center[1], // lat
            selectedDistrict.center[0], // lng
            property.coordinates.lat,
            property.coordinates.lng,
          );
          return distance <= 12; // 구 반경 12km 이내
        });
      }
    } else if (selectedCityId) {
      // 도시만 선택된 경우: 도시 ID 비교 + 하위 호환성
      const selectedCity =
        VIETNAM_CITIES.find((c) => c.id === selectedCityId) ||
        ALL_REGIONS.find((r) => r.id === selectedCityId);
      if (selectedCity) {
        filtered = filtered.filter((property) => {
          // 1. 도시 ID가 있는 경우: 정확한 ID 비교 (우선순위 1)
          if (property.cityId) {
            return property.cityId === selectedCityId;
          }

          // 2. 도시 ID가 없는 경우: 거리 기반 필터링 (하위 호환성)
          if (!property.coordinates) return false;
          const distance = calculateDistance(
            selectedCity.center[1], // lat
            selectedCity.center[0], // lng
            property.coordinates.lat,
            property.coordinates.lng,
          );
          return distance <= 50; // 도시 반경 50km 이내
        });
      }
    } else if (searchLocation) {
      // 검색 위치가 있는 경우: 검색 위치 기준 50km 이내
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

    if (fullFurniture) {
      filtered = filtered.filter((property) =>
        FULL_FURNITURE_IDS.every((id) =>
          (property.amenities || []).includes(id),
        ),
      );
    }
    if (fullElectronics) {
      filtered = filtered.filter((property) =>
        FULL_ELECTRONICS_IDS.every((id) =>
          (property.amenities || []).includes(id),
        ),
      );
    }
    if (fullOptionKitchen) {
      filtered = filtered.filter((property) =>
        FULL_OPTION_KITCHEN_IDS.every((id) =>
          (property.amenities || []).includes(id),
        ),
      );
    }
    // 시설·정책: 선택된 항목이 true인 매물만
    Object.entries(amenityFilters).forEach(([id, on]) => {
      if (!on) return;
      if (id === "pet") {
        filtered = filtered.filter((p) => p.petAllowed === true);
      } else if (id === "cleaning") {
        filtered = filtered.filter(
          (p) =>
            (p.amenities || []).includes("cleaning") ||
            (p.cleaningPerWeek != null && p.cleaningPerWeek > 0),
        );
      } else {
        filtered = filtered.filter((p) => (p.amenities || []).includes(id));
      }
    });

    filtered = filtered.filter((property) => {
      const price = property.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // 거리순 정렬 (가장 가까운 매물 먼저)
    if (selectedDistrictId || selectedCityId || searchLocation) {
      const centerPoint = selectedDistrictId
        ? districts.find((d) => d.id === selectedDistrictId)?.center
        : selectedCityId
          ? (
              VIETNAM_CITIES.find((c) => c.id === selectedCityId) ||
              ALL_REGIONS.find((r) => r.id === selectedCityId)
            )?.center
          : searchLocation
            ? [searchLocation.lng, searchLocation.lat]
            : null;

      if (centerPoint) {
        filtered = filtered.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return 0;
          const distA = calculateDistance(
            centerPoint[1], // lat
            centerPoint[0], // lng
            a.coordinates.lat,
            a.coordinates.lng,
          );
          const distB = calculateDistance(
            centerPoint[1], // lat
            centerPoint[0], // lng
            b.coordinates.lat,
            b.coordinates.lng,
          );
          return distA - distB;
        });
      }
    }

    setFilteredProperties(filtered);
    setFiltersApplied(true);
  };

  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    } else {
      // filtersApplied가 true이면 필터링 적용
      applyFilters();
    }
  }, [properties, filtersApplied]);

  // properties가 로드되면 shouldAutoApplyFilters가 true이면 자동으로 필터링 적용
  useEffect(() => {
    if (properties.length > 0 && shouldAutoApplyFilters) {
      setFiltersApplied(true);
      applyFilters();
      setShouldAutoApplyFilters(false); // 한 번만 실행
    }
  }, [properties, shouldAutoApplyFilters]);

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
    setRoomFilter(null);

    // 날짜 필터 초기화
    setCheckInDate(null);
    setCheckOutDate(null);

    // 주소, 도시, 구는 초기화하지 않음 (검색 위치, 검색어, 도시/구 선택 유지)
    // setSearchLocation(null);
    // setSearchQuery("");
    // setSelectedCityId(null);
    // setSelectedDistrictId(null);

    // 필터 적용 상태 초기화
    setFiltersApplied(false);
    setFilteredProperties(properties);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const locale =
      currentLanguage === "ko"
        ? "ko-KR"
        : currentLanguage === "vi"
          ? "vi-VN"
          : currentLanguage === "ja"
            ? "ja-JP"
            : currentLanguage === "zh"
              ? "zh-CN"
              : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
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
    if (!roomFilter) return getUIText("roomsLabel", currentLanguage);
    const opt = ROOM_FILTER_OPTIONS.find((o) => o.value === roomFilter);
    if (!opt) return "";
    return opt[currentLanguage as "ko" | "vi" | "en" | "ja" | "zh"] ?? opt.en;
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

        {/* 검색어 입력창 — 지도 페이지와 동일한 로직 (드롭다운 포함) */}
        <div className="px-4 pb-3 pt-3 border-b border-gray-200">
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
            {searchQuery &&
              showSuggestions &&
              suggestions.length > 0 &&
              !closedBySelection && (
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
                  // 도시 선택 시 자동으로 필터링 ����용
                  setTimeout(() => {
                    applyFilters();
                  }, 100);
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
                  // 구 선택 시 자동으로 필터링 적용
                  setTimeout(() => {
                    applyFilters();
                  }, 100);
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

        <div className="px-4 py-4 border-b border-gray-100 bg-white">
          {/* Quick Filters Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => openCalendar("checkin")}
              className="flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors"
              style={{ backgroundColor: "#FF6B6B", borderColor: "#FF6B6B" }}
            >
              <Calendar className="w-4 h-4 text-white mb-1" />
              <div className="text-[10px] text-white font-bold uppercase text-center mb-0.5 leading-tight">
                {getUIText("checkIn", currentLanguage)}
              </div>
              <div className="text-xs font-bold text-white">
                {checkInDate
                  ? formatDate(checkInDate)
                  : "—"}
              </div>
            </button>

            <button
              onClick={() => openCalendar("checkout")}
              className="flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors"
              style={{ backgroundColor: "#FF6B6B", borderColor: "#FF6B6B" }}
            >
              <Calendar className="w-4 h-4 text-white mb-1" />
              <div className="text-[10px] text-white font-bold uppercase text-center mb-0.5 leading-tight">
                {getUIText("checkOut", currentLanguage)}
              </div>
              <div className="text-xs font-bold text-white">
                {checkOutDate
                  ? formatDate(checkOutDate)
                  : "—"}
              </div>
            </button>

            <div className="relative" ref={roomDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowRoomDropdown(!showRoomDropdown);
                  setShowCalendar(false);
                }}
                className="w-full flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors"
                style={{ backgroundColor: "#FF6B6B", borderColor: "#FF6B6B" }}
              >
                <Bed className="w-4 h-4 text-white mb-1" />
                <div className="text-[10px] text-white font-bold uppercase text-center mb-0.5 leading-tight">
                  {getUIText("roomsLabel", currentLanguage)}
                </div>
                <div className="text-xs font-bold text-white truncate max-w-[100%]">
                  {roomFilter
                    ? (ROOM_FILTER_OPTIONS.find(o => o.value === roomFilter)?.[currentLanguage as "ko" | "vi" | "en" | "ja" | "zh"] ?? "Select").substring(0, 8)
                    : "—"}
                </div>
              </button>
              {showRoomDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md py-1 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomFilter(null);
                      setShowRoomDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${!roomFilter ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {getUIText("allLabel", currentLanguage)}
                  </button>
                  {ROOM_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value ?? "all"}
                      type="button"
                      onClick={() => {
                        setRoomFilter(opt.value);
                        setShowRoomDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${roomFilter === opt.value ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {opt[currentLanguage as "ko" | "vi" | "en" | "ja" | "zh"] ?? opt.en}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filter Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowAdvancedFilters(!showAdvancedFilters);
                setShowCalendar(false);
                setShowRoomDropdown(false);
              }}
              className={`text-xs font-bold flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? "bg-[#E63946] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{getUIText("advancedFilter", currentLanguage)}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${showAdvancedFilters ? "rotate-90" : ""}`}
              />
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
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
                    {/* 가격 표시 */}
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

                    {/* 가격 슬라이더 */}
                    <div
                      className="relative py-6"
                      ref={rentTrackRef}
                      onPointerDown={handleRentTrackPointerDown}
                    >
                      {/* 슬라이더 배경 */}
                      <div className="absolute left-0 right-0 top-3 h-1 bg-gray-300 rounded-full" />

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
                        className="absolute top-3 h-1 rounded-full -translate-y-1/2"
                        style={{
                          backgroundColor: "#E63946",
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
                        <div className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center" style={{ borderColor: "#E63946" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#E63946" }} />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap" style={{ backgroundColor: "#E63946", borderColor: "#E63946" }}>
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
                        <div className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center" style={{ borderColor: "#E63946" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#E63946" }} />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap" style={{ backgroundColor: "#E63946", borderColor: "#E63946" }}>
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
                      fullFurniture
                        ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullFurniture ? { backgroundColor: "#E63946", borderColor: "#E63946" } : undefined}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    {getUIText("fullFurniture", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullElectronics(!fullElectronics)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                      fullElectronics
                        ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullElectronics ? { backgroundColor: "#E63946", borderColor: "#E63946" } : undefined}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    {getUIText("fullElectronics", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullOptionKitchen(!fullOptionKitchen)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                      fullOptionKitchen
                        ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={fullOptionKitchen ? { backgroundColor: "#E63946", borderColor: "#E63946" } : undefined}
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
                          on
                            ? "text-white border" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                        style={on ? { backgroundColor: "#E63946", borderColor: "#E63946" } : undefined}
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

          {/* 초기화 버튼 - 검색하기 버튼 위에 배치 */}
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
                setShowCalendar(false);
                setShowRoomDropdown(false);
                await applyFilters();
              }}
              className="flex-1 py-3 px-4 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: "#E63946" }}
            >
              <Search className="w-3.5 h-3.5" />
              <span>
                {currentLanguage === "ko"
                  ? "검색하기"
                  : currentLanguage === "vi"
                    ? "Tìm kiếm"
                    : currentLanguage === "ja"
                      ? "検索"
                      : currentLanguage === "zh"
                        ? "搜索"
                        : "Search"}
              </span>
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
                onCheckInReset={() => {
                  setCheckInDate(null);
                  setCheckOutDate(null);
                  setCalendarMode("checkin");
                }}
              />
            </div>
          </div>
        )}

        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium">
              {getUIText("searching", currentLanguage)}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {getUIText("noResultsFound", currentLanguage)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Header with Count */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-900">
                  <span className="text-gray-600">{filteredProperties.length}</span>
                  <span className="text-gray-600 ml-2">{getUIText("propertiesFound", currentLanguage)}</span>
                </div>
              </div>

              {/* Properties List */}
              <div className="space-y-3">
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
