"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyData } from "@/types/property";

/**
 * 매물 상세 상단 3D 이미지 슬라이더 + 임대인 전체화면용 인덱스 state.
 * 스와이프·무한 루프 리셋·뷰포트 너비 관측은 기존 PropertyDetailView와 동일.
 */
export function usePropertyDetailImageSlider(property: PropertyData) {
  const propertyImages =
    property.images && property.images.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop"];

  const N = propertyImages.length;
  const SLIDER_MID = N;
  const SLIDER_MAX = 3 * N;
  const [imageIndex, setImageIndex] = useState(N > 1 ? SLIDER_MID : 0);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderViewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const [sliderNoTransition, setSliderNoTransition] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    const el = sliderViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setSliderWidth(e.contentRect.width);
    });
    ro.observe(el);
    setSliderWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [N]);

  const displayDotIndex = imageIndex < 0 ? N - 1 : imageIndex > SLIDER_MAX ? 0 : imageIndex % N;
  const SLIDE_WIDTH_PCT = 0.78;
  const OVERLAP_PCT = 0.1;
  const slideWidthPx = sliderWidth * SLIDE_WIDTH_PCT;
  const overlapPx = slideWidthPx * OVERLAP_PCT;
  const stepPx = slideWidthPx - overlapPx;
  const initialOffsetPx = (sliderWidth * (1 - SLIDE_WIDTH_PCT)) / 2;
  const sliderOffsetPx =
    N <= 1 || sliderWidth <= 0
      ? 0
      : imageIndex < 0
        ? 0
        : imageIndex > SLIDER_MAX
          ? (3 * N + 1) * stepPx
          : (imageIndex + 1) * stepPx;

  const goToSlide = useCallback(
    (dotIndex: number) => {
      const target = SLIDER_MID + dotIndex;
      if (imageIndex < 0 || imageIndex > SLIDER_MAX) {
        setSliderNoTransition(true);
        setImageIndex(target);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setSliderNoTransition(false));
        });
      } else {
        setImageIndex(target);
      }
    },
    [imageIndex, N],
  );

  const goToPrevSlide = useCallback(() => {
    if (N <= 1) return;
    setImageIndex((i) => (i <= 0 ? -1 : i - 1));
  }, [N]);

  const goToNextSlide = useCallback(() => {
    if (N <= 1) return;
    setImageIndex((i) => (i >= SLIDER_MAX - 1 ? SLIDER_MAX : i + 1));
  }, [N, SLIDER_MAX]);

  const handleSwipeStart = useCallback((clientX: number) => {
    touchStartX.current = clientX;
  }, []);

  const handleSwipeEnd = useCallback(
    (clientX: number) => {
      const diff = clientX - touchStartX.current;
      const minSwipe = 50;
      if (Math.abs(diff) < minSwipe || N <= 1) return;
      if (diff > 0) goToPrevSlide();
      else goToNextSlide();
    },
    [N, goToPrevSlide, goToNextSlide],
  );

  const onTrackTransitionEnd = useCallback(() => {
    if (N <= 1) return;
    if (imageIndex === SLIDER_MAX) {
      setSliderNoTransition(true);
      setImageIndex(SLIDER_MID);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSliderNoTransition(false));
      });
    } else if (imageIndex === -1) {
      setSliderNoTransition(true);
      setImageIndex(2 * N - 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSliderNoTransition(false));
      });
    }
  }, [N, imageIndex, SLIDER_MID, SLIDER_MAX]);

  return {
    propertyImages,
    N,
    SLIDER_MAX,
    imageIndex,
    sliderRef,
    sliderViewportRef,
    displayDotIndex,
    slideWidthPx,
    overlapPx,
    initialOffsetPx,
    sliderWidth,
    sliderOffsetPx,
    sliderNoTransition,
    fullScreenImageIndex,
    setFullScreenImageIndex,
    goToSlide,
    goToPrevSlide,
    goToNextSlide,
    handleSwipeStart,
    handleSwipeEnd,
    onTrackTransitionEnd,
  };
}

export type PropertyDetailImageSliderVm = ReturnType<typeof usePropertyDetailImageSlider>;
