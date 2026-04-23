import { useCallback, useMemo } from "react";
import { geocodeAddress } from "@/lib/api/geocoding";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { snapRentSliderPrice } from "../utils/rentPriceSliderUtils";

type UseSearchPageActionsParams = {
  properties: PropertyData[];
  searchQuery: string;
  currentLanguage: SupportedLanguage;
  closeCalendar: () => void;
  closeRoomDropdown: () => void;
  resetRoomFilter: () => void;
  resetCalendarDates: () => void;
  setSearchLocation: (value: { lat: number; lng: number } | null) => void;
  setFiltersApplied: (value: boolean) => void;
  setFilterVersion: React.Dispatch<React.SetStateAction<number>>;
  setFilteredProperties: (value: PropertyData[]) => void;
  setMinPrice: (value: number) => void;
  setMaxPrice: (value: number) => void;
  setFullFurniture: (value: boolean) => void;
  setFullElectronics: (value: boolean) => void;
  setFullOptionKitchen: (value: boolean) => void;
  setAmenityFilters: (value: Record<string, boolean>) => void;
};

export function useSearchPageActions({
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
}: UseSearchPageActionsParams) {
  const priceCap = useMemo(
    () =>
      properties.length > 0
        ? Math.max(0, ...properties.map((p) => p.price || 0))
        : 50_000_000,
    [properties],
  );

  const geocodeSearchQuery = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchLocation(null);
      return;
    }

    try {
      const result = await geocodeAddress(searchQuery, currentLanguage);
      setSearchLocation({ lat: result.lat, lng: result.lng });
    } catch {
      setSearchLocation(null);
    }
  }, [searchQuery, currentLanguage, setSearchLocation]);

  const runSearch = useCallback(async () => {
    closeCalendar();
    closeRoomDropdown();
    await geocodeSearchQuery();
    setFiltersApplied(true);
    setFilterVersion((v) => v + 1);
  }, [
    closeCalendar,
    closeRoomDropdown,
    geocodeSearchQuery,
    setFiltersApplied,
    setFilterVersion,
  ]);

  const resetAdvancedFilters = useCallback(() => {
    const sliderCap =
      properties.length > 0
        ? Math.max(0, ...properties.map((p) => p.price || 0))
        : 50_000_000;

    if (properties.length > 0) {
      const prices = properties.map((p) => p.price || 0).filter((p) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setMinPrice(snapRentSliderPrice(min, sliderCap));
        setMaxPrice(snapRentSliderPrice(max, sliderCap));
      } else {
        setMinPrice(0);
        setMaxPrice(snapRentSliderPrice(50_000_000, sliderCap));
      }
    } else {
      setMinPrice(0);
      setMaxPrice(snapRentSliderPrice(50_000_000, sliderCap));
    }

    setFullFurniture(false);
    setFullElectronics(false);
    setFullOptionKitchen(false);
    setAmenityFilters({});
    resetRoomFilter();
    resetCalendarDates();
    setFiltersApplied(false);
    setFilteredProperties(properties);
  }, [
    properties,
    resetRoomFilter,
    resetCalendarDates,
    setAmenityFilters,
    setFilteredProperties,
    setFiltersApplied,
    setFullElectronics,
    setFullFurniture,
    setFullOptionKitchen,
    setMaxPrice,
    setMinPrice,
  ]);

  return {
    priceCap,
    runSearch,
    resetAdvancedFilters,
  };
}
