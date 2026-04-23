import { addProperty } from "@/lib/api/properties";
import {
  buildUnitNumber,
  ensureAddPropertyKycReady,
  getAddPropertyErrorMessage,
  uploadPropertyImages,
  validateAddPropertyInput,
} from "../utils/addPropertySubmit";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface AddPropertyAddressState {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  selectedCityId: string;
  selectedDistrictId: string;
  buildingNumber: string;
  roomNumber: string;
}

interface AddPropertyMediaState {
  images: File[];
  imagePreviews: string[];
}

interface AddPropertyPricingAndCapacityState {
  weeklyRent: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxAdults: number;
  maxChildren: number;
}

interface AddPropertyContentState {
  title: string;
  propertyDescription: string;
}

interface AddPropertyScheduleState {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  todayOnly: Date;
  maxRentalDay: Date;
  checkInTime: string;
  checkOutTime: string;
}

interface AddPropertyFacilityState {
  selectedFacilities: string[];
  cleaningPerWeek: number;
  petAllowed: boolean;
  maxPets: number;
  petFeeAmount: string;
}

interface AddPropertyExternalCalendarState {
  icalPlatform: string;
  icalCalendarName: string;
  icalUrl: string;
}

type AddPropertySubmitFormState = AddPropertyAddressState &
  AddPropertyMediaState &
  AddPropertyPricingAndCapacityState &
  AddPropertyContentState &
  AddPropertyScheduleState &
  AddPropertyFacilityState &
  AddPropertyExternalCalendarState;

interface UseAddPropertySubmitParams {
  currentLanguage: string;
  user: { uid: string } | null;
  router: { push: (path: string) => void };
  setLoading: (value: boolean) => void;
  onSuccess: () => void;
  formState: AddPropertySubmitFormState;
}

export function useAddPropertySubmit({
  currentLanguage,
  user,
  router,
  setLoading,
  onSuccess,
  formState,
}: UseAddPropertySubmitParams) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMessage = validateAddPropertyInput({
      address: formState.address,
      coordinates: formState.coordinates,
      selectedCityId: formState.selectedCityId,
      selectedDistrictId: formState.selectedDistrictId,
      imagePreviewsLength: formState.imagePreviews.length,
      weeklyRent: formState.weeklyRent,
      propertyType: formState.propertyType,
      title: formState.title,
      hasUser: Boolean(user),
      checkInDate: formState.checkInDate,
      checkOutDate: formState.checkOutDate,
      todayOnly: formState.todayOnly,
      maxRentalDay: formState.maxRentalDay,
      currentLanguage,
    });
    if (validationMessage) {
      alert(validationMessage);
      return;
    }
    if (!formState.coordinates) {
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        alert(
          currentLanguage === "ko"
            ? "로그인이 필요합니다."
            : currentLanguage === "vi"
              ? "Cần đăng nhập."
              : "Please login.",
        );
        return;
      }

      const kycState = await ensureAddPropertyKycReady(user.uid, currentLanguage);
      if (!kycState.ok) {
        alert(kycState.message);
        router.push("/kyc");
        return;
      }

      const uploadResult = await uploadPropertyImages(formState.images, currentLanguage);
      if (!uploadResult.ok) {
        alert(uploadResult.message);
        return;
      }

      await addProperty({
        title: formState.title.trim(),
        original_description: formState.propertyDescription,
        translated_description: "",
        price: parseInt(formState.weeklyRent.replace(/\D/g, ""), 10),
        priceUnit: "vnd",
        area: 0,
        bedrooms: formState.bedrooms,
        bathrooms: formState.bathrooms,
        coordinates: formState.coordinates,
        address: formState.address,
        images: uploadResult.imageUrls,
        amenities: formState.selectedFacilities,
        unitNumber: buildUnitNumber(formState.buildingNumber, formState.roomNumber),
        propertyType: formState.propertyType,
        cleaningPerWeek: formState.selectedFacilities.includes("cleaning")
          ? formState.cleaningPerWeek
          : 0,
        petAllowed: formState.petAllowed,
        ...(formState.petAllowed && { maxPets: formState.maxPets }),
        ...(formState.petAllowed &&
          formState.petFeeAmount.trim() && {
            petFee: parseInt(formState.petFeeAmount.replace(/\D/g, ""), 10) || undefined,
          }),
        ownerId: user.uid,
        checkInDate: formState.checkInDate || undefined,
        checkOutDate: formState.checkOutDate || undefined,
        checkInTime: formState.checkInTime,
        checkOutTime: formState.checkOutTime,
        maxAdults: formState.maxAdults,
        maxChildren: formState.maxChildren,
        status: "active",
        ...(formState.icalPlatform && { icalPlatform: formState.icalPlatform }),
        ...(formState.icalCalendarName.trim() && {
          icalCalendarName: formState.icalCalendarName.trim(),
        }),
        ...(formState.icalUrl.trim() && { icalUrl: formState.icalUrl.trim() }),
        ...(formState.selectedCityId && { cityId: formState.selectedCityId }),
        ...(formState.selectedDistrictId && { districtId: formState.selectedDistrictId }),
      });

      onSuccess();
    } catch (error: unknown) {
      const knownErrors = ["OverlapDetected", "AlreadyBooked"];
      const message = error instanceof Error ? error.message : undefined;
      if (!message || !knownErrors.includes(message)) {
        console.error("매물 등록 중 예기치 못한 패:", error);
      }
      alert(getAddPropertyErrorMessage(currentLanguage, message));
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
