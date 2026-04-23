import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { PropertyData } from "@/types/property";
import { useSearchRoomFilter } from "./useSearchRoomFilter";
import { useSearchCalendarFilter } from "./useSearchCalendarFilter";
import { useSearchLocationFilter } from "./useSearchLocationFilter";
import { useSearchFilterEngine } from "./useSearchFilterEngine";
import { useSearchPageActions } from "./useSearchPageActions";
import { useSearchPageLifecycle } from "./useSearchPageLifecycle";

export function useSearchPageContentState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const cityIdParam = searchParams.get("cityId") || "";
  const districtIdParam = searchParams.get("districtId") || "";
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [fullFurniture, setFullFurniture] = useState(false);
  const [fullElectronics, setFullElectronics] = useState(false);
  const [fullOptionKitchen, setFullOptionKitchen] = useState(false);
  const [amenityFilters, setAmenityFilters] = useState<Record<string, boolean>>(
    {},
  );

  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filterVersion, setFilterVersion] = useState(0);
  const [shouldAutoApplyFilters, setShouldAutoApplyFilters] = useState(
    !!(query || cityIdParam || districtIdParam),
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

  const handlePropertyClick = (property: PropertyData) => {
    router.push(`/properties/${property.id}`);
  };

  useSearchPageLifecycle({
    query,
    cityIdParam,
    districtIdParam,
    properties,
    filtersApplied,
    filterVersion,
    shouldAutoApplyFilters,
    applyFilters,
    syncFromUrlParams,
    applyRegionMatchFromQuery,
    setShouldAutoApplyFilters,
    setProperties,
    setFilteredProperties,
    setMinPrice,
    setMaxPrice,
    setLoading,
    setFiltersApplied,
  });

  const { priceCap, runSearch, resetAdvancedFilters } = useSearchPageActions({
    properties,
    searchQuery,
    currentLanguage,
    closeCalendar,
    closeRoomDropdown,
    resetRoomFilter,
    resetCalendarDates,
    setSearchLocation,
    setFiltersApplied,
    setFilterVersion,
    setFilteredProperties,
    setMinPrice,
    setMaxPrice,
    setFullFurniture,
    setFullElectronics,
    setFullOptionKitchen,
    setAmenityFilters,
  });

  return {
    currentLanguage,
    setCurrentLanguage,
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
    roomFilter,
    setRoomFilter,
    showRoomDropdown,
    roomDropdownRef,
    roomFilterOptions,
    selectedRoomLabel,
    closeRoomDropdown,
    resetRoomFilter,
    toggleRoomDropdown,
    showAdvancedFilters,
    setShowAdvancedFilters,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    fullFurniture,
    setFullFurniture,
    fullElectronics,
    setFullElectronics,
    fullOptionKitchen,
    setFullOptionKitchen,
    amenityFilters,
    setAmenityFilters,
    searchQuery,
    selectedCityId,
    selectedDistrictId,
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
    priceCap,
    runSearch,
    resetAdvancedFilters,
    loading,
    filteredProperties,
    handlePropertyClick,
  };
}
