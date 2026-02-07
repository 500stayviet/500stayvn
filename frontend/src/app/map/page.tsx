"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/TopBar";
import GrabMapComponent from "@/components/GrabMapComponent";
import { PropertyData } from "@/types/property";
import { formatPrice, getCityName } from "@/lib/utils/propertyUtils";
import { isAvailableNow, formatDateForBadge } from "@/lib/utils/dateUtils";
import Image from "next/image";
import { getUIText } from "@/utils/i18n";
import { ChevronLeft, ChevronRight, MapPin, Loader2, Search } from "lucide-react";
import { ALL_REGIONS } from "@/lib/data/vietnam-regions";
import {
  useLocationSearch,
  getSuggestionBadge,
  cleanDisplayName,
  cleanSubAddress,
  type LocationSuggestion,
} from "@/hooks/useLocationSearch";

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

// 1. 실제 로직이 들어있는 알맹이 컴포넌트
function MapContent() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const cardSliderRef = useRef<HTMLDivElement>(null);
  const programmaticScrollTargetRef = useRef<number | null>(null);


  // 검색어 입력 — 홈과 동일 로직 (보기 드롭다운)
  const [searchValue, setSearchValue] = useState("");
  const { suggestions, isSearching, search, clearSuggestions } = useLocationSearch(currentLanguage);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
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
    clearSuggestions();
    setShowSuggestions(false);
    setSearchValue(text);
    const regionId = (suggestion.PlaceId || "").replace(/^region-/, "");
    const region = ALL_REGIONS.find((r) => r.id === regionId);
    if (region) {
      const [lng, lat] = region.center;
      router.push(`/map?lat=${lat}&lng=${lng}`);
    }
  };

  // 카드 스크롤 시 선택만 갱신. 화살표로 넘길 때는 목표 인덱스에 도달했을 때만 갱신해 5→1 바로 이동.
  useEffect(() => {
    const container = cardSliderRef.current;
    if (!container || nearbyProperties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      const index = Math.round(scrollLeft / cardWidth);
      const target = programmaticScrollTargetRef.current;
      if (target !== null) {
        if (index === target) {
          flushSync(() => {
            setSelectedPropertyIndex(index);
            setSelectedProperty(nearbyProperties[index]);
          });
          programmaticScrollTargetRef.current = null;
        }
        return;
      }
      if (
        index !== selectedPropertyIndex &&
        index >= 0 &&
        index < nearbyProperties.length
      ) {
        flushSync(() => {
          setSelectedPropertyIndex(index);
          setSelectedProperty(nearbyProperties[index]);
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [nearbyProperties, selectedPropertyIndex]);

  // 좌우 버튼: 선택을 즉시 목표로 바꾸고 스크롤. 목표 도달 전까지 스크롤 이벤트는 선택 갱신 안 함 → 5에서 1로 바로 이동.
  const scrollLeft = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      if (selectedPropertyIndex === 0) {
        const lastIndex = nearbyProperties.length - 1;
        programmaticScrollTargetRef.current = lastIndex;
        flushSync(() => {
          setSelectedPropertyIndex(lastIndex);
          setSelectedProperty(nearbyProperties[lastIndex] ?? null);
        });
        container.scrollTo({
          left: lastIndex * cardWidth,
          behavior: "smooth",
        });
      } else {
        const newIndex = selectedPropertyIndex - 1;
        programmaticScrollTargetRef.current = newIndex;
        flushSync(() => {
          setSelectedPropertyIndex(newIndex);
          setSelectedProperty(nearbyProperties[newIndex] ?? null);
        });
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    }
  };

  const scrollRight = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      if (selectedPropertyIndex >= nearbyProperties.length - 1) {
        programmaticScrollTargetRef.current = 0;
        flushSync(() => {
          setSelectedPropertyIndex(0);
          setSelectedProperty(nearbyProperties[0] ?? null);
        });
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const newIndex = selectedPropertyIndex + 1;
        programmaticScrollTargetRef.current = newIndex;
        flushSync(() => {
          setSelectedPropertyIndex(newIndex);
          setSelectedProperty(nearbyProperties[newIndex] ?? null);
        });
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }
  };

  // URL 파라미터 처리
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const deniedParam = searchParams.get("denied");
  const loadingParam = searchParams.get("loading");

  const initialLocation = useMemo(
    () =>
      latParam && lngParam
        ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
        : null,
    [latParam, lngParam]
  );
  const locationDenied = deniedParam === "true";
  const locationLoading = loadingParam === "true";

  // 카드 클릭/마커 클릭 시 선택 갱신 + 카드 스크롤. 지도 마커 테두리는 즉시 반영되도록 flushSync.
  const handlePropertySelect = (index: number, property?: Property) => {
    const selected = property || nearbyProperties[index];
    flushSync(() => {
      setSelectedPropertyIndex(index);
      if (selected) setSelectedProperty(selected);
    });
    if (cardSliderRef.current) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / (nearbyProperties.length || 1);
      container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    }
  };

  const handlePropertyPriorityChange = (property: Property) => {
    const currentIndex = nearbyProperties.findIndex(
      (p) => p.id === property.id,
    );
    if (currentIndex !== -1) handlePropertySelect(currentIndex, property);
  };


  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 웹 기준 우측 스크롤바: 지도 우측 끝(max-w 영역)에 세로 스크롤 표시 */}
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative overflow-y-scroll overscroll-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="flex-1 relative flex flex-col min-h-0 bg-white">
          {/* 지도: 고정 비율, 아래 영역과 겹치지 않도록 overflow-hidden */}
          <div className="h-[50vh] min-h-[280px] max-h-[50vh] relative flex-shrink-0 overflow-hidden w-full">
            <GrabMapComponent
              onPropertiesChange={setNearbyProperties}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
              onPropertyPriorityChange={handlePropertyPriorityChange}
              initialLocation={initialLocation}
              locationDenied={locationDenied}
              locationLoading={locationLoading}
            />
          </div>

          {/* 주변 인기 매물: 지도 아래 고정, 잘리지 않도록 최소 높이·패딩 적용 */}
          <div className="flex-1 flex flex-col min-h-[320px] bg-white flex-shrink-0 w-full">
            <div className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-tight">
                {getUIText('popularStaysNearby', currentLanguage)}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {nearbyProperties.length}{" "}
                {getUIText('propertiesCount', currentLanguage)}
              </p>
            </div>

            <div className="flex-1 min-h-[260px] relative group/slider px-4 sm:px-6 pb-6">
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow-lg opacity-0 group-hover/slider:opacity-100 disabled:hidden"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div
                ref={cardSliderRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              >
                {nearbyProperties.map((property, index) => (
                  <div
                    key={property.id}
                    onClick={() => {
                      handlePropertySelect(index, property);
                      router.push(`/properties/${property.id}`);
                    }}
                    className={`relative h-[250px] w-[calc(100vw-4rem)] max-w-[320px] flex-shrink-0 cursor-pointer overflow-hidden snap-start transition-all ${selectedPropertyIndex === index ? "ring-4 ring-[#E63946] rounded-3xl" : "rounded-2xl"}`}
                    style={{
                      boxShadow: selectedPropertyIndex === index 
                        ? '0 10px 30px rgba(230, 57, 70, 0.3)' 
                        : '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <Image
                      src={
                        property.images?.[0] ||
                        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                      }
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <div className="bg-white/95 text-[#E63946] px-3 py-1.5 rounded-xl font-bold text-xs tracking-tight">
                          {formatPrice(property.price, "vnd")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-white text-base font-bold line-clamp-1">
                          {property.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/90 text-xs">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{getCityName(property.address)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow-lg opacity-0 group-hover/slider:opacity-100 disabled:hidden"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 2. 외부에 노출되는 페이지 컴포넌트 (Suspense 적용)
export default function MapPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <span className="ml-2">{getUIText('loading', currentLanguage)}</span>
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
