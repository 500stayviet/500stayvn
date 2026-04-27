import { useMemo, useState } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { searchRegions } from "@/lib/data/vietnam-regions";
import { LISTING_MAX_SUPPLY_DAYS } from "@/lib/constants/listingCalendar";
import { useAddPropertyAccess } from "./useAddPropertyAccess";
import { useAddPropertyFormRules } from "./useAddPropertyFormRules";
import { useAddPropertyCalendarIcal } from "./useAddPropertyCalendarIcal";
import { useAddPropertySubmit } from "./useAddPropertySubmit";
import { usePropertyImageManager } from "./usePropertyImageManager";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface UseAddPropertyPageStateParams {
  user: { uid: string } | null;
  authLoading: boolean;
  currentLanguage: string;
  onPush: (path: string) => void;
}

export function useAddPropertyPageState({
  user,
  authLoading,
  currentLanguage,
  onPush,
}: UseAddPropertyPageStateParams) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<PropertyType>("");
  const [cleaningPerWeek, setCleaningPerWeek] = useState(1);
  const [maxPets, setMaxPets] = useState(1);
  const [petFeeAmount, setPetFeeAmount] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [maxAdults, setMaxAdults] = useState(1);
  const [maxChildren, setMaxChildren] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [title, setTitle] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const { checkingAccess, hasAccess } = useAddPropertyAccess({
    user,
    authLoading,
    onRedirect: onPush,
  });

  const todayOnly = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxRentalDay = useMemo(() => {
    const d = new Date(todayOnly);
    d.setDate(d.getDate() + LISTING_MAX_SUPPLY_DAYS);
    return d;
  }, [todayOnly]);

  const { toggleFacility, petAllowed, bedroomOptions, bathroomOptions } =
    useAddPropertyFormRules({
      propertyType,
      setBedrooms,
      setBathrooms,
      selectedCityId,
      selectedDistrictId,
      setSelectedDistrictId,
      selectedFacilities,
      setSelectedFacilities,
    });

  const calendarState = useAddPropertyCalendarIcal();

  const imageState = usePropertyImageManager({
    images,
    setImages,
    imagePreviews,
    setImagePreviews,
  });

  const { handleSubmit } = useAddPropertySubmit({
    currentLanguage,
    user: user ? { uid: user.uid } : null,
    router: { push: onPush },
    setLoading,
    onSuccess: () => setShowSuccessModal(true),
    formState: {
      address,
      coordinates,
      selectedCityId,
      selectedDistrictId,
      images,
      imagePreviews,
      weeklyRent,
      propertyType,
      title,
      propertyDescription,
      checkInDate: calendarState.checkInDate,
      checkOutDate: calendarState.checkOutDate,
      todayOnly,
      maxRentalDay,
      bedrooms,
      bathrooms,
      selectedFacilities,
      buildingNumber,
      roomNumber,
      cleaningPerWeek,
      petAllowed,
      maxPets,
      petFeeAmount,
      checkInTime,
      checkOutTime,
      maxAdults,
      maxChildren,
      icalPlatform: calendarState.icalPlatform,
      icalCalendarName: calendarState.icalCalendarName,
      icalUrl: calendarState.icalUrl,
    },
  });

  const lang = currentLanguage as SupportedLanguage;
  const getLocalizedLabel = (label: {
    en: string;
    ko?: string;
    vi?: string;
    ja?: string;
    zh?: string;
  }) => (label[lang] ?? label.en) as string;

  const clearAddress = () => {
    setAddress("");
    setCoordinates(null);
    setSelectedCityId("");
    setSelectedDistrictId("");
  };

  const handleAddressConfirm = (data: { address: string; lat: number; lng: number }) => {
    setAddress(data.address);
    setCoordinates({ lat: data.lat, lng: data.lng });
    setSelectedDistrictId("");
    const matches = searchRegions(data.address);
    const cityMatch = matches.find((r) => r.type === "city");
    setSelectedCityId(cityMatch ? cityMatch.id : "");
  };

  const submitDisabled =
    loading ||
    imagePreviews.length === 0 ||
    !weeklyRent ||
    weeklyRent.replace(/\D/g, "") === "" ||
    !propertyType ||
    bedrooms === 0 ||
    bathrooms === 0;

  return {
    loading,
    checkingAccess,
    hasAccess,
    todayOnly,
    maxRentalDay,
    images,
    imagePreviews,
    address,
    buildingNumber,
    roomNumber,
    weeklyRent,
    selectedFacilities,
    propertyType,
    cleaningPerWeek,
    maxPets,
    petFeeAmount,
    coordinates,
    selectedCityId,
    selectedDistrictId,
    maxAdults,
    maxChildren,
    bedrooms,
    bathrooms,
    title,
    propertyDescription,
    checkInTime,
    checkOutTime,
    showSuccessModal,
    showAddressModal,
    bedroomOptions,
    bathroomOptions,
    petAllowed,
    calendarState,
    imageState,
    handleSubmit,
    submitDisabled,
    getLocalizedLabel,
    handleAddressConfirm,
    clearAddress,
    setShowAddressModal,
    setShowSuccessModal,
    setBuildingNumber,
    setRoomNumber,
    setWeeklyRent,
    setPropertyType,
    setBedrooms,
    setBathrooms,
    setMaxAdults,
    setMaxChildren,
    setSelectedCityId,
    setSelectedDistrictId,
    setMaxPets,
    setPetFeeAmount,
    setCleaningPerWeek,
    setTitle,
    setPropertyDescription,
    setCheckInTime,
    setCheckOutTime,
    setIcalPlatform: calendarState.setIcalPlatform,
    setIcalCalendarName: calendarState.setIcalCalendarName,
    setIcalUrl: calendarState.setIcalUrl,
    toggleFacility,
  };
}

export type AddPropertyPageViewModel = ReturnType<typeof useAddPropertyPageState>;
