/**
 * Pure search result filtering (location, dates, room type, amenities, price, sort by distance).
 */

import {
  FULL_OPTION_KITCHEN_IDS,
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
} from "@/lib/constants/facilities";
import { VIETNAM_CITIES, ALL_REGIONS } from "@/lib/data/vietnam-regions";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import { parseDate } from "@/lib/utils/dateUtils";
import type { PropertyData } from "@/types/property";
import type { RoomFilterValue } from "../hooks/useSearchRoomFilter";

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type ApplySearchPropertyFiltersInput = {
  properties: PropertyData[];
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

export function applySearchPropertyFilters(
  input: ApplySearchPropertyFiltersInput,
): PropertyData[] {
  const {
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
  } = input;

  if (properties.length === 0) {
    return [];
  }

  let filtered: PropertyData[] = properties;

  if (selectedDistrictId) {
    const selectedDistrict = districts.find(
      (d) => d.id === selectedDistrictId,
    );
    if (selectedDistrict) {
      filtered = filtered.filter((property) => {
        if (property.districtId) {
          const districtMatch = property.districtId === selectedDistrictId;
          if (property.cityId && selectedCityId) {
            return districtMatch && property.cityId === selectedCityId;
          }
          return districtMatch;
        }
        if (property.cityId && selectedCityId) {
          return property.cityId === selectedCityId;
        }
        if (!property.coordinates) return false;
        const distance = calculateDistance(
          selectedDistrict.center[1],
          selectedDistrict.center[0],
          property.coordinates.lat,
          property.coordinates.lng,
        );
        return distance <= 12;
      });
    }
  } else if (selectedCityId) {
    const selectedCity =
      VIETNAM_CITIES.find((c) => c.id === selectedCityId) ||
      ALL_REGIONS.find((r) => r.id === selectedCityId);
    if (selectedCity) {
      filtered = filtered.filter((property) => {
        if (property.cityId) {
          return property.cityId === selectedCityId;
        }
        if (!property.coordinates) return false;
        const distance = calculateDistance(
          selectedCity.center[1],
          selectedCity.center[0],
          property.coordinates.lat,
          property.coordinates.lng,
        );
        return distance <= 50;
      });
    }
  } else if (searchLocation) {
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
          return beds === 2;
        case "three_plus":
          return beds >= 3;
        case "detached":
          return pt === "detached";
        default:
          return true;
      }
    });
  }

  if (fullFurniture) {
    filtered = filtered.filter((property) =>
      FULL_FURNITURE_IDS.every((id) => (property.amenities || []).includes(id)),
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
          centerPoint[1],
          centerPoint[0],
          a.coordinates.lat,
          a.coordinates.lng,
        );
        const distB = calculateDistance(
          centerPoint[1],
          centerPoint[0],
          b.coordinates.lat,
          b.coordinates.lng,
        );
        return distA - distB;
      });
    }
  }

  return filtered;
}
