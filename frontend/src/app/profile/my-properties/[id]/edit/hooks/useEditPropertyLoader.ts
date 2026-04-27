import { useEffect } from "react";
import { parseDate } from "@/lib/utils/dateUtils";
import type { PropertyData } from "@/types/property";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface UseEditPropertyLoaderParams {
  propertyLoaded: boolean;
  authLoading: boolean;
  user: { uid: string } | null;
  propertyId: string;
  onRedirect: (path: string) => void;
  setIsDeleted: React.Dispatch<React.SetStateAction<boolean>>;
  setPropertyStatus: React.Dispatch<
    React.SetStateAction<PropertyData["status"] | undefined>
  >;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  setWeeklyRent: React.Dispatch<React.SetStateAction<string>>;
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  setCoordinates: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number } | null>
  >;
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setMaxAdults: React.Dispatch<React.SetStateAction<number>>;
  setMaxChildren: React.Dispatch<React.SetStateAction<number>>;
  setBedrooms: React.Dispatch<React.SetStateAction<number>>;
  setBathrooms: React.Dispatch<React.SetStateAction<number>>;
  setCheckInDate: React.Dispatch<React.SetStateAction<Date | null>>;
  setCheckOutDate: React.Dispatch<React.SetStateAction<Date | null>>;
  setPropertyType: React.Dispatch<React.SetStateAction<PropertyType>>;
  setCleaningPerWeek: React.Dispatch<React.SetStateAction<number>>;
  setPetFeeAmount: React.Dispatch<React.SetStateAction<string>>;
  setMaxPets: React.Dispatch<React.SetStateAction<number>>;
  setPropertyName: React.Dispatch<React.SetStateAction<string>>;
  setPropertyDescription: React.Dispatch<React.SetStateAction<string>>;
  setCheckInTime: React.Dispatch<React.SetStateAction<string>>;
  setCheckOutTime: React.Dispatch<React.SetStateAction<string>>;
  setIcalPlatform: React.Dispatch<React.SetStateAction<string>>;
  setIcalCalendarName: React.Dispatch<React.SetStateAction<string>>;
  setIcalUrl: React.Dispatch<React.SetStateAction<string>>;
  setBuildingNumber: React.Dispatch<React.SetStateAction<string>>;
  setRoomNumber: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDistrictId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCityId: React.Dispatch<React.SetStateAction<string>>;
  setBookedRanges: React.Dispatch<
    React.SetStateAction<{ checkIn: Date; checkOut: Date }[]>
  >;
  setPropertyLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingProperty: React.Dispatch<React.SetStateAction<boolean>>;
}

const parseUnitNumber = (unitNumber: string | undefined) => {
  if (!unitNumber || !unitNumber.trim()) return { building: "", room: "" };
  const match = unitNumber.match(/^(.+?)\uB3D9\s*(.+?)\uD638$/);
  if (match) {
    const room = match[2].replace(/^0+/, "") || match[2];
    return { building: match[1].trim(), room };
  }
  return { building: "", room: "" };
};

export const useEditPropertyLoader = ({
  propertyLoaded,
  authLoading,
  user,
  propertyId,
  onRedirect,
  setIsDeleted,
  setPropertyStatus,
  setAddress,
  setWeeklyRent,
  setSelectedAmenities,
  setCoordinates,
  setImagePreviews,
  setMaxAdults,
  setMaxChildren,
  setBedrooms,
  setBathrooms,
  setCheckInDate,
  setCheckOutDate,
  setPropertyType,
  setCleaningPerWeek,
  setPetFeeAmount,
  setMaxPets,
  setPropertyName,
  setPropertyDescription,
  setCheckInTime,
  setCheckOutTime,
  setIcalPlatform,
  setIcalCalendarName,
  setIcalUrl,
  setBuildingNumber,
  setRoomNumber,
  setSelectedDistrictId,
  setSelectedCityId,
  setBookedRanges,
  setPropertyLoaded,
  setLoadingProperty,
}: UseEditPropertyLoaderParams) => {
  useEffect(() => {
    if (propertyLoaded || authLoading || !user || !propertyId) return;

    const loadData = async () => {
      try {
        const [{ getProperty }, { getPropertyBookings }] = await Promise.all([
          import("@/lib/api/properties"),
          import("@/lib/api/bookings"),
        ]);
        const p = await getProperty(propertyId);
        if (!p) {
          onRedirect("/profile/my-properties");
          return;
        }

        setIsDeleted(Boolean(p.deleted) || p.status !== "active");
        setPropertyStatus(p.status);
        setAddress(p.address || "");
        setWeeklyRent(p.price?.toString() || "");
        setSelectedAmenities(p.amenities || []);
        setCoordinates(p.coordinates || null);
        setImagePreviews(p.images || []);
        setMaxAdults(p.maxAdults ?? 1);
        setMaxChildren(p.maxChildren ?? 0);
        setBedrooms(p.bedrooms ?? 1);
        setBathrooms(p.bathrooms ?? 1);
        setCheckInDate(parseDate(p.checkInDate));
        setCheckOutDate(parseDate(p.checkOutDate));
        const pt = (p as { propertyType?: string }).propertyType || "";
        setPropertyType(pt as PropertyType);
        const cleaning = (p as { cleaningPerWeek?: number }).cleaningPerWeek ?? 0;
        setCleaningPerWeek(cleaning > 0 ? cleaning : 1);
        const fee = (p as { petFee?: number }).petFee;
        setPetFeeAmount(fee != null ? fee.toString() : "");
        setMaxPets((p as { maxPets?: number }).maxPets ?? 1);
        setPropertyName(p.title || "");
        setPropertyDescription(
          (p as { original_description?: string }).original_description || "",
        );
        setCheckInTime((p as { checkInTime?: string }).checkInTime || "14:00");
        setCheckOutTime((p as { checkOutTime?: string }).checkOutTime || "12:00");
        setIcalPlatform(p.icalPlatform || "");
        setIcalCalendarName(p.icalCalendarName || "");
        setIcalUrl(p.icalUrl || "");

        const { building, room } = parseUnitNumber(p.unitNumber);
        setBuildingNumber(building);
        setRoomNumber(room);

        if (p.coordinates) {
          const { getDistrictIdForCoord, searchRegions, ALL_REGIONS } =
            await import("@/lib/data/vietnam-regions");
          const districtId = getDistrictIdForCoord(
            p.coordinates.lat,
            p.coordinates.lng,
          );
          if (districtId) {
            const district = ALL_REGIONS.find((r) => r.id === districtId);
            if (district?.parentCity) {
              setSelectedDistrictId(districtId);
              setSelectedCityId(district.parentCity);
            }
          } else {
            const matches = searchRegions(p.address || "");
            const districtMatch = matches.find((r) => r.type === "district");
            const cityMatch = matches.find((r) => r.type === "city");
            if (districtMatch) {
              setSelectedDistrictId(districtMatch.id);
              setSelectedCityId(districtMatch.parentCity ?? "");
            } else if (cityMatch) {
              setSelectedCityId(cityMatch.id);
              setSelectedDistrictId("");
            }
          }
        }

        const b = await getPropertyBookings(propertyId);
        setBookedRanges(
          b.map((rs) => ({
            checkIn: new Date(rs.checkInDate),
            checkOut: new Date(rs.checkOutDate),
          })),
        );
        setPropertyLoaded(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProperty(false);
      }
    };

    loadData();
  }, [
    propertyLoaded,
    authLoading,
    user,
    propertyId,
    onRedirect,
    setIsDeleted,
    setPropertyStatus,
    setAddress,
    setWeeklyRent,
    setSelectedAmenities,
    setCoordinates,
    setImagePreviews,
    setMaxAdults,
    setMaxChildren,
    setBedrooms,
    setBathrooms,
    setCheckInDate,
    setCheckOutDate,
    setPropertyType,
    setCleaningPerWeek,
    setPetFeeAmount,
    setMaxPets,
    setPropertyName,
    setPropertyDescription,
    setCheckInTime,
    setCheckOutTime,
    setIcalPlatform,
    setIcalCalendarName,
    setIcalUrl,
    setBuildingNumber,
    setRoomNumber,
    setSelectedDistrictId,
    setSelectedCityId,
    setBookedRanges,
    setPropertyLoaded,
    setLoadingProperty,
  ]);
};
