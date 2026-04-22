import { useCallback, useEffect, useMemo } from "react";
import { getDistrictsByCityId } from "@/lib/data/vietnam-regions";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface UseAddPropertyFormRulesParams {
  propertyType: PropertyType;
  setBedrooms: React.Dispatch<React.SetStateAction<number>>;
  setBathrooms: React.Dispatch<React.SetStateAction<number>>;
  selectedCityId: string;
  selectedDistrictId: string;
  setSelectedDistrictId: React.Dispatch<React.SetStateAction<string>>;
  selectedFacilities: string[];
  setSelectedFacilities: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useAddPropertyFormRules = ({
  propertyType,
  setBedrooms,
  setBathrooms,
  selectedCityId,
  selectedDistrictId,
  setSelectedDistrictId,
  selectedFacilities,
  setSelectedFacilities,
}: UseAddPropertyFormRulesParams) => {
  useEffect(() => {
    if (!propertyType) {
      setBedrooms(0);
      setBathrooms(0);
      return;
    }

    if (propertyType === "studio" || propertyType === "one_room") {
      setBedrooms(1);
      setBathrooms((b) => (b < 1 || b > 2 ? 1 : b));
      return;
    }

    if (propertyType === "two_room") {
      setBedrooms(2);
      setBathrooms((b) => (b < 1 || b > 3 ? 1 : b));
      return;
    }

    if (propertyType === "three_plus") {
      setBedrooms((prev) => (prev >= 2 && prev <= 5 ? prev : 3));
      setBathrooms((b) => (b < 1 || b > 6 ? 1 : b));
      return;
    }

    setBedrooms((b) => Math.min(10, Math.max(1, b || 1)));
    setBathrooms((b) => Math.min(10, Math.max(1, b || 1)));
  }, [propertyType, setBathrooms, setBedrooms]);

  useEffect(() => {
    if (!selectedCityId || !selectedDistrictId) return;

    const districts = getDistrictsByCityId(selectedCityId);
    if (!districts.some((d) => d.id === selectedDistrictId)) {
      setSelectedDistrictId("");
    }
  }, [selectedCityId, selectedDistrictId, setSelectedDistrictId]);

  const toggleFacility = useCallback(
    (facilityId: string) => {
      setSelectedFacilities((prev) =>
        prev.includes(facilityId)
          ? prev.filter((id) => id !== facilityId)
          : [...prev, facilityId],
      );
    },
    [setSelectedFacilities],
  );

  const petAllowed = useMemo(
    () => selectedFacilities.includes("pet"),
    [selectedFacilities],
  );

  const bedroomOptions = useMemo(() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1];
    if (propertyType === "two_room") return [2];
    if (propertyType === "three_plus") return [2, 3, 4, 5];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [propertyType]);

  const bathroomOptions = useMemo(() => {
    if (!propertyType) return [];
    if (propertyType === "studio" || propertyType === "one_room") return [1, 2];
    if (propertyType === "two_room") return [1, 2, 3];
    if (propertyType === "three_plus") return [1, 2, 3, 4, 5, 6];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [propertyType]);

  return {
    toggleFacility,
    petAllowed,
    bedroomOptions,
    bathroomOptions,
  };
};
