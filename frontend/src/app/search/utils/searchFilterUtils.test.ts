import { describe, expect, it } from "vitest";
import type { PropertyData } from "@/types/property";
import type { VietnamRegion } from "@/lib/data/vietnam-regions";
import { applySearchPropertyFilters } from "./searchFilterUtils";

const DISTRICT_D1: VietnamRegion = {
  id: "hcmc-d1",
  name: "District 1",
  nameVi: "Quận 1",
  nameKo: "1군",
  nameJa: "1区",
  nameZh: "第一郡",
  keywords: ["d1"],
  center: [106.7019, 10.7756],
  type: "district",
  parentCity: "hcmc",
  zoom: 14,
};

function makeProperty(overrides: Partial<PropertyData> = {}): PropertyData {
  return {
    id: overrides.id ?? "p-default",
    title: "Test Property",
    original_description: "desc",
    translated_description: "desc",
    price: overrides.price ?? 10_000_000,
    priceUnit: "vnd",
    area: 30,
    coordinates: overrides.coordinates ?? { lat: 10.776, lng: 106.702 },
    amenities: overrides.amenities ?? [],
    cityId: overrides.cityId,
    districtId: overrides.districtId,
    checkInDate: overrides.checkInDate,
    checkOutDate: overrides.checkOutDate,
    bedrooms: overrides.bedrooms,
    propertyType: overrides.propertyType,
    petAllowed: overrides.petAllowed,
    cleaningPerWeek: overrides.cleaningPerWeek,
  };
}

function baseInput(properties: PropertyData[]) {
  return {
    properties,
    selectedCityId: null as string | null,
    selectedDistrictId: null as string | null,
    districts: [DISTRICT_D1],
    searchLocation: null as { lat: number; lng: number } | null,
    checkInDate: null as Date | null,
    checkOutDate: null as Date | null,
    roomFilter: null,
    fullFurniture: false,
    fullElectronics: false,
    fullOptionKitchen: false,
    amenityFilters: {} as Record<string, boolean>,
    minPrice: 0,
    maxPrice: 50_000_000,
  };
}

describe("applySearchPropertyFilters", () => {
  it("filters by price range", () => {
    const p1 = makeProperty({ id: "cheap", price: 5_000_000 });
    const p2 = makeProperty({ id: "mid", price: 15_000_000 });
    const p3 = makeProperty({ id: "high", price: 30_000_000 });

    const result = applySearchPropertyFilters({
      ...baseInput([p1, p2, p3]),
      minPrice: 10_000_000,
      maxPrice: 20_000_000,
    });

    expect(result.map((p) => p.id)).toEqual(["mid"]);
  });

  it("filters by district and city combination", () => {
    const sameDistrict = makeProperty({
      id: "match",
      cityId: "hcmc",
      districtId: "hcmc-d1",
    });
    const otherDistrict = makeProperty({
      id: "wrong-district",
      cityId: "hcmc",
      districtId: "hcmc-d2",
    });
    const otherCity = makeProperty({
      id: "wrong-city",
      cityId: "hanoi",
      districtId: "hcmc-d1",
    });

    const result = applySearchPropertyFilters({
      ...baseInput([sameDistrict, otherDistrict, otherCity]),
      selectedCityId: "hcmc",
      selectedDistrictId: "hcmc-d1",
    });

    expect(result.map((p) => p.id)).toEqual(["match"]);
  });

  it("filters by distance from search location", () => {
    const nearby = makeProperty({
      id: "nearby",
      coordinates: { lat: 10.78, lng: 106.7 },
    });
    const far = makeProperty({
      id: "far",
      coordinates: { lat: 16.06, lng: 108.2 },
    });

    const result = applySearchPropertyFilters({
      ...baseInput([nearby, far]),
      searchLocation: { lat: 10.7756, lng: 106.7019 },
    });

    expect(result.map((p) => p.id)).toEqual(["nearby"]);
  });

  it("filters amenities for pet and cleaning rules", () => {
    const petAndCleaning = makeProperty({
      id: "pet-cleaning",
      petAllowed: true,
      cleaningPerWeek: 1,
    });
    const petOnly = makeProperty({
      id: "pet-only",
      petAllowed: true,
      cleaningPerWeek: 0,
    });
    const cleaningOnly = makeProperty({
      id: "cleaning-only",
      petAllowed: false,
      amenities: ["cleaning"],
    });

    const result = applySearchPropertyFilters({
      ...baseInput([petAndCleaning, petOnly, cleaningOnly]),
      amenityFilters: { pet: true, cleaning: true },
    });

    expect(result.map((p) => p.id)).toEqual(["pet-cleaning"]);
  });

  it("filters by overlapping date range", () => {
    const overlap = makeProperty({
      id: "overlap",
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-20",
    });
    const noOverlap = makeProperty({
      id: "no-overlap",
      checkInDate: "2026-06-01",
      checkOutDate: "2026-06-10",
    });

    const result = applySearchPropertyFilters({
      ...baseInput([overlap, noOverlap]),
      checkInDate: new Date("2026-05-15"),
      checkOutDate: new Date("2026-05-18"),
    });

    expect(result.map((p) => p.id)).toEqual(["overlap"]);
  });

  it("supports combined filtering (city + room + amenities + price + dates)", () => {
    const winner = makeProperty({
      id: "winner",
      cityId: "hcmc",
      districtId: "hcmc-d1",
      propertyType: "studio",
      amenities: ["wifi"],
      price: 12_000_000,
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-30",
    });
    const wrongRoom = makeProperty({
      id: "wrong-room",
      cityId: "hcmc",
      districtId: "hcmc-d1",
      propertyType: "detached",
      amenities: ["wifi"],
      price: 12_000_000,
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-30",
    });
    const wrongPrice = makeProperty({
      id: "wrong-price",
      cityId: "hcmc",
      districtId: "hcmc-d1",
      propertyType: "studio",
      amenities: ["wifi"],
      price: 40_000_000,
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-30",
    });

    const result = applySearchPropertyFilters({
      ...baseInput([winner, wrongRoom, wrongPrice]),
      selectedCityId: "hcmc",
      selectedDistrictId: "hcmc-d1",
      roomFilter: "studio",
      amenityFilters: { wifi: true },
      minPrice: 10_000_000,
      maxPrice: 20_000_000,
      checkInDate: new Date("2026-05-12"),
      checkOutDate: new Date("2026-05-18"),
    });

    expect(result.map((p) => p.id)).toEqual(["winner"]);
  });
});
