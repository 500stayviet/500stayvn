import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { SupportedLanguage } from "@/lib/api/translation";
import {
  ALL_REGIONS,
  VIETNAM_CITIES,
  getDistrictsByCityId,
  searchRegions,
  type VietnamRegion,
} from "@/lib/data/vietnam-regions";
import {
  useLocationSearch,
  type LocationSuggestion,
} from "@/hooks/useLocationSearch";

interface UseSearchLocationFilterParams {
  currentLanguage: SupportedLanguage;
  initialQuery: string;
  initialCityId: string;
  initialDistrictId: string;
  applyFilters: () => void;
}

export const useSearchLocationFilter = ({
  currentLanguage,
  initialQuery,
  initialCityId,
  initialDistrictId,
  applyFilters,
}: UseSearchLocationFilterParams) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(
    initialCityId || null,
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    initialDistrictId || null,
  );
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { suggestions, isSearching, search, clearSuggestions } =
    useLocationSearch(currentLanguage);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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
    setClosedBySelection(false);
    setSearchQuery(value);
    if (!value.trim()) {
      clearSuggestions();
      setShowSuggestions(false);
      return;
    }
    await search(value);
    setShowSuggestions(true);
  };

  const triggerApplyFiltersSoon = () => {
    setTimeout(() => {
      applyFilters();
    }, 100);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const text = suggestion.Text || "";
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
      triggerApplyFiltersSoon();
    }
  };

  const handleCityChange = (id: string | null) => {
    setSelectedCityId(id);
    setSelectedDistrictId(null);
    if (id) {
      const city =
        VIETNAM_CITIES.find((c) => c.id === id) ??
        ALL_REGIONS.find((r) => r.id === id);
      if (city) {
        setSearchLocation({ lat: city.center[1], lng: city.center[0] });
      }
    } else {
      setSearchLocation(null);
    }
    triggerApplyFiltersSoon();
  };

  const handleDistrictChange = (id: string | null) => {
    setSelectedDistrictId(id);
    if (id) {
      const district = districts.find((d) => d.id === id);
      if (district) {
        setSearchLocation({ lat: district.center[1], lng: district.center[0] });
      }
    } else if (selectedCityId) {
      const city =
        VIETNAM_CITIES.find((c) => c.id === selectedCityId) ??
        ALL_REGIONS.find((r) => r.id === selectedCityId);
      if (city) {
        setSearchLocation({ lat: city.center[1], lng: city.center[0] });
      }
    } else {
      setSearchLocation(null);
    }
    triggerApplyFiltersSoon();
  };

  const selectedCity = selectedCityId
    ? (VIETNAM_CITIES.find((c) => c.id === selectedCityId) ??
      ALL_REGIONS.find((r) => r.id === selectedCityId) ??
      null)
    : null;
  const districts = selectedCityId ? getDistrictsByCityId(selectedCityId) : [];
  const selectedDistrict = selectedDistrictId
    ? districts.find((d) => d.id === selectedDistrictId) ?? null
    : null;

  const syncFromUrlParams = (
    query: string,
    cityIdParam: string,
    districtIdParam: string,
  ) => {
    setSearchQuery(query);
    setSelectedCityId(cityIdParam || null);
    setSelectedDistrictId(districtIdParam || null);
  };

  const applyRegionMatchFromQuery = (query: string) => {
    const matches = searchRegions(query);
    const districtMatch = matches.find((r) => r.type === "district");
    const cityMatch = matches.find((r) => r.type === "city");
    if (districtMatch) {
      setSelectedCityId(districtMatch.parentCity ?? null);
      setSelectedDistrictId(districtMatch.id);
      return true;
    }
    if (cityMatch) {
      setSelectedCityId(cityMatch.id);
      setSelectedDistrictId(null);
      return true;
    }
    return false;
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCityId,
    setSelectedCityId,
    selectedDistrictId,
    setSelectedDistrictId,
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
    selectedCity: selectedCity as VietnamRegion | null,
    selectedDistrict: selectedDistrict as VietnamRegion | null,
    districts,
    clearSuggestions,
    syncFromUrlParams,
    applyRegionMatchFromQuery,
  };
};
