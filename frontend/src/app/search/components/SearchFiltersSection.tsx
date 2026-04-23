import { Calendar, ChevronRight, Search, Bed, RotateCcw } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { VIETNAM_CITIES } from "@/lib/data/vietnam-regions";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import {
  getSuggestionBadge,
  cleanDisplayName,
  cleanSubAddress,
} from "@/hooks/useLocationSearch";
import type { LocationSuggestion } from "@/hooks/useLocationSearch";
import { getUIText } from "@/utils/i18n";
import { SearchAdvancedFiltersPanel } from "./SearchAdvancedFiltersPanel";
import type { RoomFilterValue } from "../hooks/useSearchRoomFilter";

type RoomOption = {
  value: RoomFilterValue;
  ko: string;
  vi: string;
  en: string;
  ja: string;
  zh: string;
};

type SearchFiltersSectionProps = {
  currentLanguage: SupportedLanguage;
  BRAND: { primary: string; primaryLight: string; muted: string; text: string };
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  handleAddressInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  showSuggestions: boolean;
  suggestions: LocationSuggestion[];
  closedBySelection: boolean;
  handleSelectSuggestion: (suggestion: LocationSuggestion) => void;
  isSearching: boolean;
  selectedCityId: string | null;
  handleCityChange: (id: string | null) => void;
  selectedDistrictId: string | null;
  handleDistrictChange: (id: string | null) => void;
  districts: VietnamRegion[];
  checkInDate: Date | null;
  checkOutDate: Date | null;
  openCalendar: (mode: "checkin" | "checkout") => void;
  formatDate: (date: Date) => string;
  roomDropdownRef: React.RefObject<HTMLDivElement | null>;
  roomFilter: RoomFilterValue;
  showRoomDropdown: boolean;
  toggleRoomDropdown: () => void;
  closeCalendar: () => void;
  closeRoomDropdown: () => void;
  resetRoomFilter: () => void;
  roomFilterOptions: readonly RoomOption[];
  setRoomFilter: (value: RoomFilterValue) => void;
  selectedRoomLabel: string;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;
  priceCap: number;
  minPrice: number;
  maxPrice: number;
  setMinPrice: React.Dispatch<React.SetStateAction<number>>;
  setMaxPrice: React.Dispatch<React.SetStateAction<number>>;
  fullFurniture: boolean;
  setFullFurniture: React.Dispatch<React.SetStateAction<boolean>>;
  fullElectronics: boolean;
  setFullElectronics: React.Dispatch<React.SetStateAction<boolean>>;
  fullOptionKitchen: boolean;
  setFullOptionKitchen: React.Dispatch<React.SetStateAction<boolean>>;
  amenityFilters: Record<string, boolean>;
  setAmenityFilters: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  resetAdvancedFilters: () => void;
  runSearch: () => Promise<void>;
};

function getRegionDisplayName(region: VietnamRegion, lang: string): string {
  if (lang === "ko") return region.nameKo ?? region.name ?? "";
  if (lang === "vi") return region.nameVi ?? region.name ?? "";
  if (lang === "ja") return region.nameJa ?? region.name ?? "";
  if (lang === "zh") return region.nameZh ?? region.name ?? "";
  return region.name ?? "";
}

export function SearchFiltersSection({
  currentLanguage,
  BRAND,
  searchContainerRef,
  searchQuery,
  handleAddressInputChange,
  setShowSuggestions,
  showSuggestions,
  suggestions,
  closedBySelection,
  handleSelectSuggestion,
  isSearching,
  selectedCityId,
  handleCityChange,
  selectedDistrictId,
  handleDistrictChange,
  districts,
  checkInDate,
  checkOutDate,
  openCalendar,
  formatDate,
  roomDropdownRef,
  roomFilter,
  showRoomDropdown,
  toggleRoomDropdown,
  closeCalendar,
  closeRoomDropdown,
  resetRoomFilter,
  roomFilterOptions,
  setRoomFilter,
  selectedRoomLabel,
  showAdvancedFilters,
  setShowAdvancedFilters,
  priceCap,
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
  resetAdvancedFilters,
  runSearch,
}: SearchFiltersSectionProps) {
  return (
    <>
      <div className="px-4 pb-3 pt-3">
        <div
          className="bg-white rounded-2xl shadow-lg p-4"
          style={{ border: "1px solid #F3F4F6" }}
        >
          <div className="relative" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4" style={{ color: BRAND.muted }} />
            </div>
            <input
              data-testid="search-input"
              type="text"
              value={searchQuery}
              onChange={handleAddressInputChange}
              onFocus={() => setShowSuggestions(false)}
              placeholder={getUIText("searchPlaceholderCityDistrict", currentLanguage)}
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
                <div
                  className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg max-h-72 overflow-y-auto"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  {suggestions.map((suggestion, index) => {
                    const badge = getSuggestionBadge(suggestion, currentLanguage);
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
                        style={{
                          backgroundColor: suggestion.isRegion
                            ? "#FFF8F6"
                            : "transparent",
                        }}
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
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: BRAND.text }}
                              >
                                {mainName}
                              </p>
                            </div>
                            {subAddress && (
                              <p
                                className="text-xs mt-1 truncate"
                                style={{ color: BRAND.muted }}
                              >
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
              <div
                className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg p-4"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2"
                    style={{ borderColor: BRAND.primary }}
                  />
                  <span className="text-sm" style={{ color: BRAND.muted }}>
                    {getUIText("searching", currentLanguage)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {getUIText("labelCity", currentLanguage)}
              </label>
              <select
                data-testid="city-select"
                value={selectedCityId ?? ""}
                onChange={(e) => {
                  handleCityChange(e.target.value || null);
                }}
                className="w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-[#E63946] focus:border-transparent transition-colors"
                style={{
                  ...(selectedCityId
                    ? {
                        borderColor: BRAND.primary,
                        backgroundColor: "#E6394615",
                        color: "#C62D3A",
                        fontWeight: 600,
                      }
                    : {
                        borderColor: "#E5E7EB",
                        backgroundColor: "#F9FAFB",
                        color: BRAND.text,
                      }),
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
                data-testid="district-select"
                value={selectedDistrictId ?? ""}
                onChange={(e) => {
                  handleDistrictChange(e.target.value || null);
                }}
                disabled={!selectedCityId || districts.length === 0}
                className="w-full rounded-lg border px-3 py-2.5 text-sm min-h-[42px] focus:ring-2 focus:ring-[#E63946] focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                style={{
                  ...(selectedDistrictId
                    ? {
                        borderColor: BRAND.primary,
                        backgroundColor: "#E6394615",
                        color: "#C62D3A",
                        fontWeight: 600,
                      }
                    : {
                        borderColor: "#E5E7EB",
                        backgroundColor: "#F9FAFB",
                        color: BRAND.text,
                      }),
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => openCalendar("checkin")}
            className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors ${checkInDate ? "text-white hover:opacity-90" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
            style={
              checkInDate
                ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                : undefined
            }
          >
            <Calendar
              className={`w-4 h-4 mb-1 ${checkInDate ? "text-white" : "text-gray-600"}`}
            />
            <div
              className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${checkInDate ? "text-white" : "text-gray-400"}`}
            >
              {getUIText("checkIn", currentLanguage)}
            </div>
            <div
              className={`text-xs inline-block ${checkInDate ? "font-bold text-white" : "font-black"}`}
              style={
                !checkInDate
                  ? {
                      color: BRAND.primaryLight,
                      WebkitTextStroke: "1.5px",
                      WebkitTextStrokeColor: BRAND.primaryLight,
                    }
                  : undefined
              }
            >
              {checkInDate ? formatDate(checkInDate) : "—"}
            </div>
          </button>

          <button
            onClick={() => openCalendar("checkout")}
            className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-colors ${checkOutDate ? "text-white hover:opacity-90" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
            style={
              checkOutDate
                ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                : undefined
            }
          >
            <Calendar
              className={`w-4 h-4 mb-1 ${checkOutDate ? "text-white" : "text-gray-600"}`}
            />
            <div
              className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${checkOutDate ? "text-white" : "text-gray-400"}`}
            >
              {getUIText("checkOut", currentLanguage)}
            </div>
            <div
              className={`text-xs inline-block ${checkOutDate ? "font-bold text-white" : "font-black"}`}
              style={
                !checkOutDate
                  ? {
                      color: BRAND.primaryLight,
                      WebkitTextStroke: "1.5px",
                      WebkitTextStrokeColor: BRAND.primaryLight,
                    }
                  : undefined
              }
            >
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
              style={
                roomFilter
                  ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                  : undefined
              }
            >
              <Bed
                className={`w-4 h-4 mb-1 ${roomFilter ? "text-white" : "text-gray-600"}`}
              />
              <div
                className={`text-[10px] font-bold uppercase text-center mb-0.5 leading-tight ${roomFilter ? "text-white" : "text-gray-400"}`}
              >
                {getUIText("roomsLabel", currentLanguage)}
              </div>
              <div
                className={`text-xs truncate max-w-[100%] inline-block ${roomFilter ? "font-bold text-white" : "font-black"}`}
                style={
                  !roomFilter
                    ? {
                        color: BRAND.primaryLight,
                        WebkitTextStroke: "1.5px",
                        WebkitTextStrokeColor: BRAND.primaryLight,
                      }
                    : undefined
                }
              >
                {roomFilter ? selectedRoomLabel.substring(0, 8) : "—"}
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

        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAdvancedFilters(!showAdvancedFilters);
              closeCalendar();
              closeRoomDropdown();
            }}
            className={`text-xs font-bold flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${showAdvancedFilters ? "text-white" : "hover:bg-gray-50"}`}
            style={
              showAdvancedFilters
                ? { backgroundColor: BRAND.primary }
                : { color: BRAND.primary }
            }
          >
            <span>{getUIText("advancedFilter", currentLanguage)}</span>
            <ChevronRight
              className={`w-3 h-3 transition-transform ${showAdvancedFilters ? "rotate-90" : ""}`}
            />
          </button>
        </div>

        {showAdvancedFilters && (
          <SearchAdvancedFiltersPanel
            currentLanguage={currentLanguage}
            primaryColor={BRAND.primary}
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
          />
        )}

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
            data-testid="search-run-button"
            onClick={runSearch}
            className="flex-1 py-3 px-4 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND.primary }}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{getUIText("searchButton", currentLanguage)}</span>
          </button>
        </div>
      </div>
    </>
  );
}
