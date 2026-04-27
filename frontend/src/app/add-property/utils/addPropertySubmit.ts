import { getCurrentUserData } from "@/lib/api/auth";
import { isOwnerSupplyLengthDays } from "@/lib/constants/listingCalendar";
import {
  buildUnitNumber,
  uploadPropertyFiles,
} from "@/lib/utils/propertyForm";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

type Coordinates = { lat: number; lng: number } | null;

export interface AddPropertyValidationInput {
  address: string;
  coordinates: Coordinates;
  selectedCityId: string;
  selectedDistrictId: string;
  imagePreviewsLength: number;
  weeklyRent: string;
  propertyType: PropertyType;
  title: string;
  hasUser: boolean;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  todayOnly: Date;
  maxRentalDay: Date;
  currentLanguage: SupportedLanguage;
}

export const validateAddPropertyInput = (
  input: AddPropertyValidationInput,
): string | null => {
  const lang = input.currentLanguage;
  const {
    address,
    coordinates,
    selectedCityId,
    selectedDistrictId,
    imagePreviewsLength,
    weeklyRent,
    propertyType,
    title,
    hasUser,
    checkInDate,
    checkOutDate,
    todayOnly,
    maxRentalDay,
    currentLanguage,
  } = input;

  if (!address || address.trim() === "") {
    return getUIText("valAddrRequired", lang);
  }

  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    return getUIText("valAddrGeoRequired", lang);
  }

  if (!selectedCityId) {
    return getUIText("valPickCity", lang);
  }

  if (!selectedDistrictId) {
    return getUIText("valPickDistrict", lang);
  }

  if (imagePreviewsLength === 0) {
    return getUIText("valMinOnePhoto", lang);
  }

  if (!weeklyRent || weeklyRent.trim() === "") {
    return getUIText("valWeeklyRentEmpty", lang);
  }

  const rentValue = parseInt(weeklyRent.replace(/\D/g, ""), 10);
  if (isNaN(rentValue) || rentValue <= 0) {
    return getUIText("valWeeklyRentBad", lang);
  }

  if (!propertyType) {
    return getUIText("valPickPropType", lang);
  }

  if (!title || title.trim() === "") {
    return getUIText("valPropTitleEmpty", lang);
  }

  if (!hasUser) {
    return getUIText("valNeedLogin", lang);
  }

  if (!checkInDate || !checkOutDate) {
    return getUIText("valPickBothRentalDates", lang);
  }

  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const inDayOnly = new Date(
    checkInDate.getFullYear(),
    checkInDate.getMonth(),
    checkInDate.getDate(),
  );
  const outDayOnly = new Date(
    checkOutDate.getFullYear(),
    checkOutDate.getMonth(),
    checkOutDate.getDate(),
  );

  const inOk =
    inDayOnly.getTime() >= todayOnly.getTime() &&
    inDayOnly.getTime() <= maxRentalDay.getTime();
  const outOk =
    outDayOnly.getTime() >= todayOnly.getTime() &&
    outDayOnly.getTime() <= maxRentalDay.getTime();

  if (!inOk || !outOk) {
    return getUIText("valRentalDates91", lang);
  }

  if (!isOwnerSupplyLengthDays(diffDays)) {
    return getUIText("valRental7dSteps", lang);
  }

  return null;
};

export const ensureAddPropertyKycReady = async (
  uid: string,
  currentLanguage: SupportedLanguage,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const userData = await getCurrentUserData(uid);
  const kycSteps = userData?.kyc_steps || {};
  const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

  if (allStepsCompleted) return { ok: true };

  return {
    ok: false,
    message: getUIText("valKyc123Required", currentLanguage),
  };
};

export { buildUnitNumber };

export const uploadPropertyImages = async (
  images: File[],
  currentLanguage: SupportedLanguage,
): Promise<{ ok: true; imageUrls: string[] } | { ok: false; message: string }> => {
  try {
    const imageUrls = await uploadPropertyFiles(images);
    return { ok: true, imageUrls };
  } catch (error) {
    console.error("S3 업로드 실패:", error);
    const errorMessage = error instanceof Error ? error.message : "S3 업로드 실패";
    return {
      ok: false,
      message: `${getUIText("valUploadFailPrefix", currentLanguage)}${errorMessage}`,
    };
  }
};

export const getAddPropertyErrorMessage = (
  currentLanguage: SupportedLanguage,
  errorMessage?: string,
) => {
  if (errorMessage === "OverlapDetected" || errorMessage === "AlreadyBooked") {
    return getUIText("valDupListingAddr", currentLanguage);
  }
  return getUIText("valRegisterUnexpected", currentLanguage);
};
