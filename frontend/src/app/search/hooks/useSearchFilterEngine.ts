import { useCallback } from "react";
import {
  applySearchPropertyFilters,
  type ApplySearchPropertyFiltersInput,
} from "../utils/searchFilterUtils";
import type { PropertyData } from "@/types/property";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import type { RoomFilterValue } from "./useSearchRoomFilter";

type UseSearchFilterEngineParams = {
  properties: PropertyData[];
  setFilteredProperties: (p: PropertyData[]) => void;
  setFiltersApplied: (v: boolean) => void;
  selectedCityId: string | null;
  selectedDistrictId: string | null;
  districts: VietnamRegion[];
  searchLocation: { lat: number; lng: number } | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  roomFilter: RoomFilterValue;
  fullFurniture: boolean;
  fullElectronics: boolean;
  fullOptionKitchen: boolean;
  amenityFilters: Record<string, boolean>;
  minPrice: number;
  maxPrice: number;
};

export function useSearchFilterEngine({
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
}: UseSearchFilterEngineParams) {
  const applyFilters = useCallback(() => {
    console.log("applyFilters called with:", {
      propertiesCount: properties.length,
      selectedCityId,
      selectedDistrictId,
      searchLocation,
    });

    if (properties.length === 0) {
      console.log("No properties to filter");
      setFilteredProperties([]);
      return;
    }

    const input: ApplySearchPropertyFiltersInput = {
      properties,
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
    };
    setFilteredProperties(applySearchPropertyFilters(input));
    setFiltersApplied(true);
  }, [
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
  ]);

  return { applyFilters };
}
