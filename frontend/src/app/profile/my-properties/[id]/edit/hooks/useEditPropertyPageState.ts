import { useEffect, useState } from "react";
import type { PropertyData } from "@/types/property";
import { getDistrictIdForCoord, getDistrictsByCityId, searchRegions, ALL_REGIONS } from "@/lib/data/vietnam-regions";
import { useEditPropertyLoader } from "./useEditPropertyLoader";
import { useEditPropertyImageManager } from "./useEditPropertyImageManager";
import { useEditPropertyCalendarRules } from "./useEditPropertyCalendarRules";
import { useEditPropertySubmit } from "./useEditPropertySubmit";

type PropertyType = "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached";

interface UseEditPropertyPageStateParams {
  propertyId: string;
  currentLanguage: string;
  user: { uid: string } | null;
  authLoading: boolean;
  dismissSiblingId: string | null;
  needsRentalCalendarAck: boolean;
  extensionMaxDate: Date;
  onRedirect: (path: string) => void;
}

export function useEditPropertyPageState({
  propertyId,
  currentLanguage,
  user,
  authLoading,
  dismissSiblingId,
  needsRentalCalendarAck,
  extensionMaxDate,
  onRedirect,
}: UseEditPropertyPageStateParams) {
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [propertyLoaded, setPropertyLoaded] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [propertyStatus, setPropertyStatus] = useState<PropertyData["status"] | undefined>(undefined);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [weeklyRent, setWeeklyRent] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [maxAdults, setMaxAdults] = useState(1);
  const [maxChildren, setMaxChildren] = useState(0);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);

  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("");
  const [cleaningPerWeek, setCleaningPerWeek] = useState(1);
  const [maxPets, setMaxPets] = useState(1);
  const [petFeeAmount, setPetFeeAmount] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [icalPlatform, setIcalPlatform] = useState("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const calendar = useEditPropertyCalendarRules({
    needsRentalCalendarAck,
    extensionMaxDate,
  });

  const image = useEditPropertyImageManager({
    imagePreviews,
    setImagePreviews,
    setImages,
    maxImageCount: 5,
  });

  useEffect(() => {
    if (!selectedCityId || !selectedDistrictId) return;
    const districts = getDistrictsByCityId(selectedCityId);
    if (!districts.some((d) => d.id === selectedDistrictId)) {
      setSelectedDistrictId("");
    }
  }, [selectedCityId, selectedDistrictId]);

  useEffect(() => {
    if (!propertyType) return;
    if (propertyType === "studio" || propertyType === "one_room") {
      setBedrooms(1);
      setBathrooms((b) => (b < 1 || b > 2 ? 1 : b));
    } else if (propertyType === "two_room") {
      setBedrooms(2);
      setBathrooms((b) => (b < 1 || b > 3 ? 1 : b));
    } else if (propertyType === "three_plus") {
      setBedrooms((prev) => (prev >= 2 && prev <= 5 ? prev : 2));
      setBathrooms((b) => (b < 1 || b > 6 ? 1 : b));
    } else if (propertyType === "detached") {
      setBedrooms((b) => Math.min(10, Math.max(1, b || 1)));
      setBathrooms((b) => Math.min(10, Math.max(1, b || 1)));
    }
  }, [propertyType]);

  useEditPropertyLoader({
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
    setCheckInDate: calendar.setCheckInDate,
    setCheckOutDate: calendar.setCheckOutDate,
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
  });

  const handleAddressConfirm = (data: { address: string; lat: number; lng: number }) => {
    setAddress(data.address);
    setCoordinates({ lat: data.lat, lng: data.lng });

    const districtId = getDistrictIdForCoord(data.lat, data.lng);
    if (districtId) {
      const district = ALL_REGIONS.find((r) => r.id === districtId);
      if (district?.parentCity) {
        setSelectedDistrictId(districtId);
        setSelectedCityId(district.parentCity);
        return;
      }
    }
    const matches = searchRegions(data.address);
    const districtMatch = matches.find((r) => r.type === "district");
    const cityMatch = matches.find((r) => r.type === "city");
    if (districtMatch) {
      setSelectedDistrictId(districtMatch.id);
      setSelectedCityId(districtMatch.parentCity ?? "");
    } else if (cityMatch) {
      setSelectedCityId(cityMatch.id);
      setSelectedDistrictId("");
    } else {
      setSelectedCityId("");
      setSelectedDistrictId("");
    }
  };

  const { handleSubmit } = useEditPropertySubmit({
    propertyId,
    user,
    currentLanguage,
    router: { push: onRedirect },
    needsRentalCalendarAck,
    rentalCalendarAcknowledged: calendar.rentalCalendarAcknowledged,
    isDeleted,
    propertyStatus,
    dismissSiblingId,
    setLoading,
    formState: {
      coordinates,
      imagePreviews,
      images,
      buildingNumber,
      roomNumber,
      address,
      propertyName,
      propertyDescription,
      weeklyRent,
      bedrooms,
      bathrooms,
      selectedAmenities,
      propertyType,
      cleaningPerWeek,
      maxPets,
      petFeeAmount,
      maxAdults,
      maxChildren,
      checkInDate: calendar.checkInDate,
      checkOutDate: calendar.checkOutDate,
      checkInTime,
      checkOutTime,
      icalPlatform,
      icalCalendarName,
      icalUrl,
    },
  });

  return {
    loading,
    loadingProperty,
    isDeleted,
    showAddressModal,
    setShowAddressModal,
    imagePreviews,
    image,
    selectedAmenities,
    maxPets,
    petFeeAmount,
    cleaningPerWeek,
    setSelectedAmenities,
    setMaxPets,
    setPetFeeAmount,
    setCleaningPerWeek,
    propertyType,
    bedrooms,
    bathrooms,
    maxAdults,
    setPropertyType,
    setBedrooms,
    setBathrooms,
    setMaxAdults,
    setMaxChildren,
    checkInDate: calendar.checkInDate,
    checkOutDate: calendar.checkOutDate,
    weeklyRent,
    setWeeklyRent,
    needsRentalCalendarAck,
    rentalCalendarAcknowledged: calendar.rentalCalendarAcknowledged,
    openCheckInCalendar: calendar.openCheckInCalendar,
    openCheckOutCalendar: calendar.openCheckOutCalendar,
    showCalendar: calendar.showCalendar,
    calendarMode: calendar.calendarMode,
    closeCalendar: calendar.closeCalendar,
    onCheckInSelect: calendar.onCheckInSelect,
    onCheckOutSelect: calendar.onCheckOutSelect,
    onCheckInReset: calendar.onCheckInReset,
    bookedRanges,
    address,
    coordinates,
    selectedCityId,
    selectedDistrictId,
    buildingNumber,
    roomNumber,
    setSelectedDistrictId,
    setBuildingNumber,
    setRoomNumber,
    handleAddressConfirm,
    clearAddress: () => {
      setAddress("");
      setCoordinates(null);
      setSelectedCityId("");
      setSelectedDistrictId("");
    },
    checkInTime,
    checkOutTime,
    propertyName,
    propertyDescription,
    showIcalDropdown,
    icalPlatform,
    icalCalendarName,
    icalUrl,
    setCheckInTime,
    setCheckOutTime,
    setPropertyName,
    setPropertyDescription,
    setShowIcalDropdown,
    setIcalPlatform,
    setIcalCalendarName,
    setIcalUrl,
    handleSubmit,
  };
}
