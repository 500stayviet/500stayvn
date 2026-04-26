import { parseDate, toISODateString } from "@/lib/utils/dateUtils";
import { hasAvailableBookingPeriod, isParentPropertyRecord } from "@/lib/utils/propertyUtils";
import type { PropertyData } from "@/types/property";
import type { ReservationData } from "./reservations";

export interface PropertyDateRange {
  checkIn: Date;
  checkOut: Date;
}

export type PropertiesByOwnerResult = {
  properties: PropertyData[];
  bookedDateRanges: Map<string, PropertyDateRange[]>;
};

type QueryDeps = {
  hydratePropertiesMemoryIfLoggedIn: () => Promise<void>;
  readPropertiesArray: () => PropertyData[];
  getReservationsByOwner: (
    ownerId: string,
    status?: "all" | "active" | "completed",
  ) => Promise<ReservationData[]>;
  toDate: (value: string | Date | null | undefined) => Date | null;
};

export function buildBookedRangesForParentListingQuery(
  property: PropertyData,
  allProps: PropertyData[],
  reservations: ReservationData[],
): PropertyDateRange[] {
  const normalize = (s: string | undefined) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const targetAddress = normalize(property.address);
  const targetTitle = normalize(property.title);
  const targetUnit = normalize(property.unitNumber);

  return reservations
    .filter((r) => {
      if (r.status !== "pending" && r.status !== "confirmed") return false;
      const targetProp = allProps.find((p) => p.id === r.propertyId);
      if (!targetProp) return false;

      const bookedAddress = normalize(targetProp.address);
      const bookedTitle = normalize(targetProp.title);
      const bookedUnit = normalize(targetProp.unitNumber);
      return (
        ((targetAddress !== "" && bookedAddress !== "" && targetAddress === bookedAddress) ||
          (targetTitle !== "" && bookedTitle !== "" && targetTitle === bookedTitle)) &&
        targetUnit === bookedUnit
      );
    })
    .map((r) => {
      const checkIn = parseDate(r.checkInDate);
      const checkOut = parseDate(r.checkOutDate);
      return checkIn && checkOut ? { checkIn, checkOut } : null;
    })
    .filter((r): r is PropertyDateRange => r != null);
}

export async function getBookedRangesForPropertyQuery(
  propertyId: string,
  deps: Pick<QueryDeps, "hydratePropertiesMemoryIfLoggedIn" | "readPropertiesArray" | "getReservationsByOwner"> & {
    getProperty: (id: string) => Promise<PropertyData | null>;
  },
): Promise<PropertyDateRange[]> {
  const property = await deps.getProperty(propertyId);
  if (!property || !property.ownerId) return [];

  const allReservations = await deps.getReservationsByOwner(property.ownerId, "all");
  await deps.hydratePropertiesMemoryIfLoggedIn();
  const allProps = deps.readPropertiesArray();
  const normalize = (s: string | undefined) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const targetAddress = normalize(property.address);
  const targetTitle = normalize(property.title);
  const targetUnit = normalize(property.unitNumber);

  const related = allReservations.filter((r) => {
    if (r.status !== "pending" && r.status !== "confirmed") return false;
    if (r.propertyId === propertyId) return true;

    const reservedProp = allProps.find((p) => p.id === r.propertyId);
    if (!reservedProp) return false;
    const bookedAddress = normalize(reservedProp.address);
    const bookedTitle = normalize(reservedProp.title);
    const bookedUnit = normalize(reservedProp.unitNumber);

    return (
      ((targetAddress && bookedAddress && targetAddress === bookedAddress) ||
        (targetTitle && bookedTitle && targetTitle === bookedTitle)) &&
      targetUnit === bookedUnit
    );
  });

  return related
    .map((r) => {
      const checkIn = parseDate(r.checkInDate);
      const checkOut = parseDate(r.checkOutDate);
      return checkIn && checkOut ? { checkIn, checkOut } : null;
    })
    .filter((r): r is PropertyDateRange => r != null);
}

export async function getPropertiesByOwnerQuery(
  ownerId: string,
  includeDeleted = false,
  deps: QueryDeps,
): Promise<PropertiesByOwnerResult> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return { properties: [], bookedDateRanges: new Map() };
  }

  await deps.hydratePropertiesMemoryIfLoggedIn();
  const allProperties = deps.readPropertiesArray();
  let filtered = allProperties.filter((p) => {
    if (p.ownerId !== ownerId) return false;
    const isDeleted = p.deleted === true;
    if (!includeDeleted && isDeleted) return false;
    if (includeDeleted && !isDeleted) return false;
    return true;
  });

  filtered = filtered.filter((p) => isParentPropertyRecord(p));
  filtered.sort((a, b) => {
    const aUpdatedTime = deps.toDate(a.updatedAt)?.getTime() || deps.toDate(a.createdAt)?.getTime() || 0;
    const bUpdatedTime = deps.toDate(b.updatedAt)?.getTime() || deps.toDate(b.createdAt)?.getTime() || 0;
    return bUpdatedTime - aUpdatedTime;
  });

  const allReservations = await deps.getReservationsByOwner(ownerId, "all");
  const bookedDateRanges = new Map<string, PropertyDateRange[]>();
  filtered.forEach((property) => {
    const ranges = buildBookedRangesForParentListingQuery(property, allProperties, allReservations);
    bookedDateRanges.set(property.id!, ranges);
  });

  return { properties: filtered, bookedDateRanges };
}

export async function getPropertyCountByOwnerQuery(
  ownerId: string,
  deps: QueryDeps,
): Promise<number> {
  const { properties, bookedDateRanges } = await getPropertiesByOwnerQuery(ownerId, false, deps);
  let count = 0;
  for (const property of properties) {
    if (!property.id || !isParentPropertyRecord(property)) continue;
    if (
      property.status === "active" &&
      hasAvailableBookingPeriod(property, bookedDateRanges.get(property.id) || [])
    ) {
      count++;
    }
  }
  return count;
}

export function isDateOverlapQuery(
  range1: { start: Date | string; end: Date | string },
  range2: { start: Date | string; end: Date | string },
): boolean {
  const s1 = toISODateString(range1.start);
  const e1 = toISODateString(range1.end);
  const s2 = toISODateString(range2.start);
  const e2 = toISODateString(range2.end);
  return s1 < e2 && s2 < e1;
}
