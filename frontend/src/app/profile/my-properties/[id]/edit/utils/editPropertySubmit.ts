import { uploadToS3 } from "@/lib/s3-client";
import type { PropertyData } from "@/types/property";

export const buildUnitNumber = (buildingNumber: string, roomNumber: string) => {
  const formatRoomNumber = (room: string) => {
    const num = parseInt(room.replace(/\D/g, ""), 10);
    if (isNaN(num)) return room;
    return num.toString().padStart(4, "0");
  };

  if (buildingNumber && roomNumber) {
    return `${buildingNumber}동 ${formatRoomNumber(roomNumber)}호`;
  }
  if (buildingNumber) return `${buildingNumber}동`;
  if (roomNumber) return `${formatRoomNumber(roomNumber)}호`;
  return undefined;
};

export const resolveEditPropertyImageUrls = async (
  imagePreviews: string[],
  images: File[],
) => {
  const existingUrls = imagePreviews.filter(
    (url) =>
      typeof url === "string" && (url.startsWith("http") || url.startsWith("/")),
  );
  let newUrls: string[] = [];
  if (images.length > 0) {
    newUrls = await Promise.all(images.map((file) => uploadToS3(file, "properties")));
  }
  return [...existingUrls, ...newUrls];
};

interface BuildEditPropertyUpdatesInput {
  propertyName: string;
  propertyDescription: string;
  address: string;
  weeklyRent: string;
  bedrooms: number;
  bathrooms: number;
  coordinates: { lat: number; lng: number };
  unitNumber?: string;
  imageUrls: string[];
  selectedAmenities: string[];
  propertyType: "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached";
  cleaningPerWeek: number;
  maxPets: number;
  petFeeAmount: string;
  maxAdults: number;
  maxChildren: number;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  checkInTime: string;
  checkOutTime: string;
  icalPlatform: string;
  icalCalendarName: string;
  icalUrl: string;
  propertyStatus?: PropertyData["status"];
}

export const buildEditPropertyUpdates = ({
  propertyName,
  propertyDescription,
  address,
  weeklyRent,
  bedrooms,
  bathrooms,
  coordinates,
  unitNumber,
  imageUrls,
  selectedAmenities,
  propertyType,
  cleaningPerWeek,
  maxPets,
  petFeeAmount,
  maxAdults,
  maxChildren,
  checkInDate,
  checkOutDate,
  checkInTime,
  checkOutTime,
  icalPlatform,
  icalCalendarName,
  icalUrl,
  propertyStatus,
}: BuildEditPropertyUpdatesInput) => {
  const updates: Partial<PropertyData> = {
    title: propertyName.trim(),
    original_description: propertyDescription || address,
    price: parseInt(weeklyRent.replace(/\D/g, "") || "0", 10),
    priceUnit: "vnd",
    area: 0,
    bedrooms: Number(bedrooms),
    bathrooms: Number(bathrooms),
    coordinates: { lat: coordinates.lat, lng: coordinates.lng },
    address,
    unitNumber: unitNumber || undefined,
    images: imageUrls,
    amenities: selectedAmenities,
    propertyType: propertyType || undefined,
    cleaningPerWeek: selectedAmenities.includes("cleaning") ? cleaningPerWeek : 0,
    petAllowed: selectedAmenities.includes("pet"),
    ...(selectedAmenities.includes("pet") && { maxPets }),
    petFee:
      selectedAmenities.includes("pet") && petFeeAmount.trim()
        ? parseInt(petFeeAmount.replace(/\D/g, ""), 10) || undefined
        : undefined,
    maxAdults: Number(maxAdults),
    maxChildren: Number(maxChildren),
    checkInDate: checkInDate ? new Date(checkInDate) : undefined,
    checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
    checkInTime,
    checkOutTime,
    ...(icalPlatform && { icalPlatform }),
    ...(icalCalendarName.trim() && {
      icalCalendarName: icalCalendarName.trim(),
    }),
    ...(icalUrl.trim() && { icalUrl: icalUrl.trim() }),
  };

  if (propertyStatus === "pending") {
    updates.status = "active";
  }

  return updates;
};
