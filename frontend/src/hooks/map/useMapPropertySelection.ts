"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { MapProperty } from "./mapTypes";

/**
 * 인근 목록 + 카드 슬라이더 스크롤과 동기화된 선택 인덱스.
 * (ref는 자식이 연결될 때 스크롤 동기에 사용; 미연결이면 이펙트는 no-op)
 */
export function useMapPropertySelection() {
  const [nearbyProperties, setNearbyProperties] = useState<MapProperty[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);

  const cardSliderRef = useRef<HTMLDivElement>(null);
  const programmaticScrollTargetRef = useRef<number | null>(null);

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

      if (
        index !== selectedPropertyIndex &&
        index >= 0 &&
        index < nearbyProperties.length
      ) {
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

  return {
    nearbyProperties,
    setNearbyProperties,
    selectedPropertyIndex,
    selectedProperty,
    cardSliderRef,
    handlePropertySelect,
    handlePropertyPriorityChange,
  };
}
