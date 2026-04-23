"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export interface MapProperty {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

export function useMapPageState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [nearbyProperties, setNearbyProperties] = useState<MapProperty[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(
    null,
  );

  const cardSliderRef = useRef<HTMLDivElement>(null);
  const programmaticScrollTargetRef = useRef<number | null>(null);

  // 카드 스크롤과 선택 상태를 동기화한다.
  useEffect(() => {
    const container = cardSliderRef.current;
    if (!container || nearbyProperties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      const index = Math.round(scrollLeft / cardWidth);
      const target = programmaticScrollTargetRef.current;

      if (target !== null) {
        if (index === target) {
          flushSync(() => {
            setSelectedPropertyIndex(index);
            setSelectedProperty(nearbyProperties[index] ?? null);
          });
          programmaticScrollTargetRef.current = null;
        }
        return;
      }

      if (index !== selectedPropertyIndex && index >= 0 && index < nearbyProperties.length) {
        flushSync(() => {
          setSelectedPropertyIndex(index);
          setSelectedProperty(nearbyProperties[index] ?? null);
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [nearbyProperties, selectedPropertyIndex]);

  const handlePropertySelect = (index: number, property?: MapProperty) => {
    const selected = property || nearbyProperties[index];
    flushSync(() => {
      setSelectedPropertyIndex(index);
      if (selected) setSelectedProperty(selected);
    });
    if (cardSliderRef.current) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / (nearbyProperties.length || 1);
      container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    }
  };

  const handlePropertyPriorityChange = (property: MapProperty) => {
    const currentIndex = nearbyProperties.findIndex((p) => p.id === property.id);
    if (currentIndex !== -1) handlePropertySelect(currentIndex, property);
  };

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const deniedParam = searchParams.get("denied");
  const loadingParam = searchParams.get("loading");

  const initialLocation = useMemo(
    () =>
      latParam && lngParam
        ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
        : null,
    [latParam, lngParam],
  );

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
    locationDenied: deniedParam === "true",
    locationLoading: loadingParam === "true",
    handlePropertySelect,
    handlePropertyPriorityChange,
  };
}
