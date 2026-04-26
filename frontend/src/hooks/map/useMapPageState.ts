"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMapUrlLocation } from "./useMapUrlLocation";
import { useMapPropertySelection } from "./useMapPropertySelection";

export type { MapProperty } from "./mapTypes";

/**
 * /map 페이지: 언어 + URL 기반 위치 + 목록/선택 (서브훅 조합).
 */
export function useMapPageState() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const { initialLocation, locationDenied, locationLoading } = useMapUrlLocation();
  const {
    nearbyProperties,
    setNearbyProperties,
    selectedPropertyIndex,
    selectedProperty,
    cardSliderRef,
    handlePropertySelect,
    handlePropertyPriorityChange,
  } = useMapPropertySelection();

  return {
    router,
    currentLanguage,
    setCurrentLanguage,
    nearbyProperties,
    setNearbyProperties,
    selectedPropertyIndex,
    selectedProperty,
    cardSliderRef,
    initialLocation,
    locationDenied,
    locationLoading,
    handlePropertySelect,
    handlePropertyPriorityChange,
  };
}
