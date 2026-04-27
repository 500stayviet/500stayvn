"use client";

import Image from "next/image";
import { Bed, Bath, Calendar, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice } from "@/lib/utils/propertyUtils";
import { isAvailableNow, formatDateForBadge } from "@/lib/utils/dateUtils";
import type { PropertyDetailImageSliderVm } from "./usePropertyDetailImageSlider";

type ColorTokens = {
  primary: string;
  border: string;
  text: string;
};

type Props = {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  mode: "tenant" | "owner";
  colors: ColorTokens;
  /** 풀 가구/가전/주방 뱃지 (슬라이더 하단 점선 영역) */
  hasFullFurniture: boolean;
  hasFullElectronics: boolean;
  hasFullKitchen: boolean;
  slider: PropertyDetailImageSliderVm;
};

export function PropertyDetailImageHero({
  property,
  currentLanguage,
  mode,
  colors,
  hasFullFurniture,
  hasFullElectronics,
  hasFullKitchen,
  slider: s,
}: Props) {
  const {
    propertyImages,
    N,
    displayDotIndex,
    slideWidthPx,
    overlapPx,
    initialOffsetPx,
    sliderWidth,
    sliderOffsetPx,
    sliderNoTransition,
    goToSlide,
    goToPrevSlide,
    goToNextSlide,
    handleSwipeStart,
    handleSwipeEnd,
    onTrackTransitionEnd,
    setFullScreenImageIndex,
  } = s;

  const curLabels = {
    vnd: getUIText("curVnd", currentLanguage),
    usd: getUIText("curUsd", currentLanguage),
    krw: getUIText("curKrw", currentLanguage),
  };

  return (
    <section className="overflow-hidden mb-0 w-full" ref={s.sliderRef}>
      <div
        ref={s.sliderViewportRef}
        className="relative w-full overflow-hidden bg-gray-200 select-none"
        style={{ aspectRatio: "4/3", perspective: 1200 }}
        onMouseDown={(e) => handleSwipeStart(e.clientX)}
        onMouseUp={(e) => handleSwipeEnd(e.clientX)}
        onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
        onTouchEnd={(e) => e.changedTouches[0] && handleSwipeEnd(e.changedTouches[0].clientX)}
      >
        <div
          className="flex h-full items-stretch ease-out"
          style={{
            paddingLeft: sliderWidth > 0 ? `${initialOffsetPx}px` : "11%",
            transform: N > 1 ? `translate3d(-${sliderOffsetPx}px, 0, 0)` : "none",
            transformStyle: "preserve-3d",
            transition: sliderNoTransition ? "none" : "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {(N > 1
            ? [propertyImages[N - 1], ...propertyImages, ...propertyImages, ...propertyImages, propertyImages[0]]
            : propertyImages
          ).map((src, idx) => {
            const currentPos = s.imageIndex < 0 ? 0 : s.imageIndex + 1;
            const isCenter = idx === currentPos;
            const offsetFromCenter = idx - currentPos;
            const isLast = N > 1 && idx === 3 * N + 1;
            return (
              <div
                key={idx}
                className="relative shrink-0 h-full transition-all duration-300 ease-out rounded-xl overflow-hidden"
                style={{
                  width: sliderWidth > 0 ? `${slideWidthPx}px` : "78%",
                  minWidth: sliderWidth > 0 ? slideWidthPx : undefined,
                  height: "100%",
                  marginRight: sliderWidth > 0 && !isLast ? -overlapPx : 0,
                  transform: isCenter
                    ? "scale(1) translateZ(20px)"
                    : `scale(0.9) translateZ(${-20 + Math.abs(offsetFromCenter) * -10}px)`,
                  transformOrigin: "center center",
                  opacity: isCenter ? 1 : 0.75,
                  zIndex: isCenter ? 20 : Math.max(1, 10 - Math.abs(offsetFromCenter)),
                  boxShadow: isCenter
                    ? "0 12px 40px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.15)",
                  transformStyle: "preserve-3d",
                }}
              >
                <Image
                  src={src}
                  alt={`${property.address || ""} ${
                    N > 1 ? (idx === 0 ? N : idx <= 3 * N ? ((idx - 1) % N) + 1 : 1) : idx + 1
                  }`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 430px) 85vw, 360px"
                  priority={idx <= 1}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {isAvailableNow(property.checkInDate) ? (
          <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-md z-40 flex items-center gap-1 shadow-lg">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-bold">{getUIText("immediateEntry", currentLanguage)}</span>
          </div>
        ) : property.checkInDate ? (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-md z-40 flex items-center gap-1 shadow-lg">
            <Calendar className="w-3 h-3" />
            <span className="text-xs font-bold">{formatDateForBadge(property.checkInDate, currentLanguage)}</span>
          </div>
        ) : null}

        {N > 1 && (
          <div className="card-slider-nav absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium">
            <span>
              {displayDotIndex + 1} / {N}
            </span>
            <div className="flex gap-1">
              {propertyImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                  className={`rounded-full transition-all ${
                    idx === displayDotIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/50"
                  }`}
                  aria-label={`${getUIText("a11yImgDot", currentLanguage)} ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {N > 1 && (
          <div className="card-slider-nav absolute inset-0 pointer-events-none z-40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all pointer-events-auto"
              aria-label={getUIText("a11yImgPrev", currentLanguage)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all pointer-events-auto"
              aria-label={getUIText("a11yImgNext", currentLanguage)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg z-40 shadow">
          <p className="text-sm font-bold">{formatFullPrice(property.price, property.priceUnit, curLabels)}</p>
          <p className="text-xs text-white/80">{getUIText("priceHeroPerWeek", currentLanguage)}</p>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg z-40 flex items-center gap-2 shadow">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1 text-xs">
              <Bed className="w-3.5 h-3.5" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1 text-xs">
              <Bath className="w-3.5 h-3.5" />
              {property.bathrooms}
            </span>
          )}
        </div>

        {mode === "owner" && (
          <button
            type="button"
            onClick={() => setFullScreenImageIndex(displayDotIndex)}
            className="absolute bottom-3 left-3 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full z-40 hover:bg-black/70 transition-colors"
            aria-label={getUIText("a11yImgFs", currentLanguage)}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div
        className="py-3 px-4 border-b border-dashed"
        style={{ borderColor: colors.border, borderBottomWidth: "1.5px" }}
      >
        {(hasFullFurniture || hasFullElectronics || hasFullKitchen) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {hasFullFurniture && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50"
                style={{ color: colors.primary }}
              >
                {getUIText("fullFurniture", currentLanguage)}
              </span>
            )}
            {hasFullElectronics && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50"
                style={{ color: colors.primary }}
              >
                {getUIText("fullElectronics", currentLanguage)}
              </span>
            )}
            {hasFullKitchen && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50"
                style={{ color: colors.primary }}
              >
                {getUIText("fullKitchen", currentLanguage)}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
