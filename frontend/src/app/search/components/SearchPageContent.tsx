"use client";

import TopBar from "@/components/TopBar";
import { useSearchPageContentState } from "../hooks/useSearchPageContentState";
import { SEARCH_BRAND } from "../constants/searchBrand";
import { SearchCalendarModal } from "./SearchCalendarModal";
import { SearchFiltersSection } from "./SearchFiltersSection";
import { SearchResultsSection } from "./SearchResultsSection";

export default function SearchPageContent() {
  const {
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
  } = useSearchPageContentState();

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
          BRAND={SEARCH_BRAND}
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
          <SearchCalendarModal
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            onCheckInSelect={handleCheckInSelect}
            onCheckOutSelect={handleCheckOutSelect}
            currentLanguage={currentLanguage}
            onClose={closeCalendar}
            mode={calendarMode}
            onCheckInReset={resetCalendarDates}
          />
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
