"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { PropertyData } from "@/types/property";
import TopBar from "@/components/TopBar";
import CalendarComponent from "@/components/CalendarComponent";
import { useSearchRoomFilter } from "../hooks/useSearchRoomFilter";
import { useSearchCalendarFilter } from "../hooks/useSearchCalendarFilter";
import { useSearchLocationFilter } from "../hooks/useSearchLocationFilter";
import { useSearchFilterEngine } from "../hooks/useSearchFilterEngine";
import { useSearchPageActions } from "../hooks/useSearchPageActions";
import { useSearchPageLifecycle } from "../hooks/useSearchPageLifecycle";
import { SearchFiltersSection } from "./SearchFiltersSection";
import { SearchResultsSection } from "./SearchResultsSection";

export default function SearchPageContent() {
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

  const BRAND = {
    primary: "#E63946",
    primaryLight: "#FF6B6B",
    muted: "#9CA3AF",
    text: "#1F2937",
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        <SearchFiltersSection
          currentLanguage={currentLanguage}
          BRAND={BRAND}
          searchContainerRef={searchContainerRef}
          searchQuery={searchQuery}
          handleAddressInputChange={handleAddressInputChange}
          setShowSuggestions={setShowSuggestions}
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          closedBySelection={closedBySelection}
          handleSelectSuggestion={handleSelectSuggestion}
          isSearching={isSearching}
          selectedCityId={selectedCityId}
          handleCityChange={handleCityChange}
          selectedDistrictId={selectedDistrictId}
          handleDistrictChange={handleDistrictChange}
          districts={districts}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          openCalendar={openCalendar}
          formatDate={formatDate}
          roomDropdownRef={roomDropdownRef}
          roomFilter={roomFilter}
          showRoomDropdown={showRoomDropdown}
          toggleRoomDropdown={toggleRoomDropdown}
          closeCalendar={closeCalendar}
          closeRoomDropdown={closeRoomDropdown}
          resetRoomFilter={resetRoomFilter}
          roomFilterOptions={roomFilterOptions}
          setRoomFilter={setRoomFilter}
          selectedRoomLabel={selectedRoomLabel}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          priceCap={priceCap}
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          fullFurniture={fullFurniture}
          setFullFurniture={setFullFurniture}
          fullElectronics={fullElectronics}
          setFullElectronics={setFullElectronics}
          fullOptionKitchen={fullOptionKitchen}
          setFullOptionKitchen={setFullOptionKitchen}
          amenityFilters={amenityFilters}
          setAmenityFilters={setAmenityFilters}
          resetAdvancedFilters={resetAdvancedFilters}
          runSearch={runSearch}
        />

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

        <SearchResultsSection
          loading={loading}
          filteredProperties={filteredProperties}
          currentLanguage={currentLanguage}
          onPropertyClick={handlePropertyClick}
        />
      </div>
    </div>
  );
}
