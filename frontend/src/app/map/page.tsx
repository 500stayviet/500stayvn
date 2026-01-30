"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import GrabMapComponent from "@/components/GrabMapComponent";
import { getProperty } from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import PropertyModal from "@/components/map/PropertyModal";
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
  image?: string;
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

// 1. 실제 로직이 들어있는 알맹이 컴포넌트
function MapContent() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const cardSliderRef = useRef<HTMLDivElement>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProperty, setDetailProperty] = useState<PropertyData | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

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

  useEffect(() => {
    const container = cardSliderRef.current;
    if (!container || nearbyProperties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      const index = Math.round(scrollLeft / cardWidth);
      if (
        index !== selectedPropertyIndex &&
        index >= 0 &&
        index < nearbyProperties.length
      ) {
        setSelectedPropertyIndex(index);
        setSelectedProperty(nearbyProperties[index]);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [nearbyProperties, selectedPropertyIndex]);

  const scrollLeft = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      if (selectedPropertyIndex === 0) {
        container.scrollTo({
          left: (nearbyProperties.length - 1) * cardWidth,
          behavior: "smooth",
        });
      } else {
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    }
  };

  const scrollRight = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      if (selectedPropertyIndex >= nearbyProperties.length - 1) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }
  };

  // URL 파라미터 처리
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const deniedParam = searchParams.get("denied");
  const loadingParam = searchParams.get("loading");

  const initialLocation =
    latParam && lngParam
      ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
      : null;
  const locationDenied = deniedParam === "true";
  const locationLoading = loadingParam === "true";

  const handlePropertySelect = (index: number, property?: Property) => {
    setSelectedPropertyIndex(index);
    const selected = property || nearbyProperties[index];
    if (selected) setSelectedProperty(selected);
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

  const handleOpenDetailModal = async (propertyId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const data = await getProperty(propertyId);
      setDetailProperty(data);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <main className="flex-1 relative flex flex-col overflow-hidden bg-white">
          <div className="h-full relative">
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

          <div className="h-[50%] flex flex-col bg-white py-6 overflow-hidden">
            <div className="px-6 mb-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {getUIText('popularStaysNearby', currentLanguage)}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {nearbyProperties.length}{" "}
                  {getUIText('propertiesCount', currentLanguage)}
                </p>
              </div>
            </div>

            <div className="flex-1 relative group/slider">
              <button
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow-lg opacity-0 group-hover/slider:opacity-100 disabled:hidden"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div
                ref={cardSliderRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-6"
              >
                {nearbyProperties.map((property, index) => (
                  <div
                    key={property.id}
                    onClick={() => handleOpenDetailModal(property.id)}
                    className={`relative h-[250px] w-[calc(100vw-4rem)] max-w-[320px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg snap-start transition-all ${selectedPropertyIndex === index ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <Image
                      src={
                        property.image ||
                        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                      }
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <div className="bg-white/95 text-blue-600 px-3 py-1 rounded-xl font-black text-sm">
                          {formatPrice(property.price, "vnd")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white text-base font-bold line-clamp-1">
                          {property.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/90 text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          {getCityName(property.address)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow-lg opacity-0 group-hover/slider:opacity-100 disabled:hidden"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </main>
        {showDetailModal && detailProperty && (
          <PropertyModal
            propertyData={detailProperty}
            currentLanguage={currentLanguage}
            onClose={() => setShowDetailModal(false)}
          />
        )}
        {detailLoading && (
          <div className="absolute inset-0 z-[110] bg-black/20 flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" />
              <span>{getUIText('loading', currentLanguage)}</span>
            </div>
          </div>
        )}
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
