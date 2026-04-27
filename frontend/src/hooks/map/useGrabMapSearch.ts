"use client";

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";
import maplibregl from "maplibre-gl";
import type { SupportedLanguage } from "@/lib/api/translation";
import {
  searchRegions,
  regionToSuggestion,
} from "@/lib/data/vietnam-regions";
import {
  searchLandmarksScored,
  landmarkToSuggestion,
} from "@/lib/data/vietnam-landmarks";
import { Suggestion } from "@/types/map";

interface UseGrabMapSearchParams {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  markerRef: MutableRefObject<maplibregl.Marker | null>;
  currentLanguage: SupportedLanguage;
  updateVisiblePropertiesRef: MutableRefObject<(() => void) | undefined>;
  setSelectedDistrictIdFilter: Dispatch<SetStateAction<string | null>>;
}

/**
 * 지도 상단 검색: 행정구역 + 대표 명소만 (POI 제외).
 * 디바운스·필터·flyTo·검색 핀 마커까지 한 훅에서 관리한다.
 */
export function useGrabMapSearch({
  mapRef,
  markerRef,
  currentLanguage,
  updateVisiblePropertiesRef,
  setSelectedDistrictIdFilter,
}: UseGrabMapSearchParams) {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          setIsSearching(true);

          const regionResults = searchRegions(value);
          const regionSuggestions: Suggestion[] = regionResults.map(
            (region) =>
              regionToSuggestion(region, currentLanguage) as Suggestion,
          );
          const cityResults = regionSuggestions.filter(
            (r) => r.regionType === "city",
          );
          const districtResults = regionSuggestions.filter(
            (r) => r.regionType === "district",
          );

          const landmarkScored = searchLandmarksScored(value);
          const landmarkResults: Suggestion[] = landmarkScored
            .slice(0, 5)
            .map(
              ({ landmark }) =>
                ({
                  ...landmarkToSuggestion(landmark, currentLanguage),
                  zoom: 16,
                }) as Suggestion,
            );

          const combinedResults = [
            ...cityResults,
            ...districtResults,
            ...landmarkResults,
          ].slice(0, 10);

          setSuggestions(combinedResults);
          setShowSuggestions(combinedResults.length > 0);
        } catch (error) {
          console.error("Grab map search error:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsSearching(false);
        }
      }, 250);
    },
    [currentLanguage],
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      const map = mapRef.current;
      if (!map) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flushSync(() => {
        setShowSuggestions(false);
        setSuggestions([]);
      });
      const displayText = suggestion.Text || "";
      setSearchValue(displayText);
      setIsSearching(true);

      if (suggestion.isRegion && suggestion.regionType === "city") {
        setSelectedDistrictIdFilter(null);
      }
      if (
        suggestion.isRegion &&
        suggestion.regionType === "district" &&
        suggestion.PlaceId
      ) {
        const districtId = suggestion.PlaceId.replace(/^region-/, "");
        setSelectedDistrictIdFilter(districtId);
      }
      if (suggestion.isLandmark && suggestion.districtId) {
        setSelectedDistrictIdFilter(suggestion.districtId);
      }

      const point = suggestion.Place?.Geometry?.Point;
      if (point && point.length >= 2) {
        const [longitude, latitude] = point;
        const safeLat = Number(latitude);
        const safeLng = Number(longitude);
        if (!isNaN(safeLat) && !isNaN(safeLng)) {
          const zoomLevel = suggestion.isRegion ? (suggestion.zoom ?? 13) : 16;
          map.flyTo({
            center: [safeLng, safeLat],
            zoom: zoomLevel,
            duration: 1200,
            essential: true,
          });

          if (markerRef.current) markerRef.current.remove();
          if (!suggestion.isRegion) {
            markerRef.current = new maplibregl.Marker({
              color:
                suggestion.isLandmark &&
                suggestion.landmarkCategory === "landmark"
                  ? "#dc2626"
                  : suggestion.isLandmark &&
                      suggestion.landmarkCategory === "shopping"
                    ? "#2563eb"
                    : suggestion.isLandmark &&
                        suggestion.landmarkCategory === "residential"
                      ? "#16a34a"
                      : suggestion.isLandmark &&
                          suggestion.landmarkCategory === "tourism"
                        ? "#9333ea"
                        : "#FF6B35",
              scale: 1.2,
            })
              .setLngLat([safeLng, safeLat])
              .addTo(map);
          } else {
            markerRef.current = null;
          }

          map.once("moveend", () => {
            updateVisiblePropertiesRef.current?.();
          });
        }
      }
      setIsSearching(false);
    },
    [mapRef, markerRef, setSelectedDistrictIdFilter, updateVisiblePropertiesRef],
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedDistrictIdFilter(null);
  }, [setSelectedDistrictIdFilter]);

  const handleSearchSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setShowSuggestions(false);

      if (searchValue.trim() && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    },
    [handleSelectSuggestion, searchValue, suggestions],
  );

  return {
    searchValue,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    handleSearchChange,
    handleSelectSuggestion,
    handleClearSearch,
    handleSearchSubmit,
  };
}
