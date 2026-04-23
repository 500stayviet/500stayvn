"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getUIText } from "@/utils/i18n";
import {
  RENT_SLIDER_LAST_INDEX,
  getRentSliderValueAtIndex,
  getRentSliderIndexForValue,
  rentSliderIndexToPct,
  rentSliderPctToIndex,
} from "../utils/rentPriceSliderUtils";

type SearchRentRangeSliderProps = {
  currentLanguage: SupportedLanguage;
  primaryColor: string;
  priceCap: number;
  minPrice: number;
  maxPrice: number;
  setMinPrice: (v: number) => void;
  setMaxPrice: (v: number) => void;
};

export function SearchRentRangeSlider({
  currentLanguage,
  primaryColor,
  priceCap,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}: SearchRentRangeSliderProps) {
  const rentTrackRef = useRef<HTMLDivElement>(null);
  const minPriceRef = useRef(minPrice);
  const maxPriceRef = useRef(maxPrice);
  const cap = Math.max(0, priceCap);

  useEffect(() => {
    minPriceRef.current = minPrice;
  }, [minPrice]);
  useEffect(() => {
    maxPriceRef.current = maxPrice;
  }, [maxPrice]);

  const minIdxRaw = getRentSliderIndexForValue(minPrice, cap);
  const maxIdxRaw = getRentSliderIndexForValue(maxPrice, cap);
  const safeMinIdx = Math.max(
    0,
    Math.min(minIdxRaw, maxIdxRaw - 1),
  );
  const safeMaxIdx = Math.min(
    RENT_SLIDER_LAST_INDEX,
    Math.max(maxIdxRaw, safeMinIdx + 1),
  );

  const setMinFromIndex = (idx: number) => {
    const maxIdx = getRentSliderIndexForValue(maxPriceRef.current, cap);
    const i = Math.max(0, Math.min(idx, maxIdx - 1));
    setMinPrice(getRentSliderValueAtIndex(i, cap));
  };

  const setMaxFromIndex = (idx: number) => {
    const minIdx = getRentSliderIndexForValue(minPriceRef.current, cap);
    const i = Math.min(RENT_SLIDER_LAST_INDEX, Math.max(idx, minIdx + 1));
    setMaxPrice(getRentSliderValueAtIndex(i, cap));
  };

  const handleRentTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const el = rentTrackRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = rect.width > 0 ? x / rect.width : 0;
    const idx = rentSliderPctToIndex(pct);

    const curMinIdx = getRentSliderIndexForValue(minPriceRef.current, cap);
    const curMaxIdx = getRentSliderIndexForValue(maxPriceRef.current, cap);
    const distMin = Math.abs(idx - curMinIdx);
    const distMax = Math.abs(idx - curMaxIdx);

    if (distMin < distMax) {
      setMinFromIndex(idx);
    } else if (distMax < distMin) {
      setMaxFromIndex(idx);
    } else {
      setMinFromIndex(idx);
    }
  };

  const weekLabel =
    currentLanguage === "ko"
      ? "주"
      : currentLanguage === "vi"
        ? "tuần"
        : "week";

  const dragHint =
    currentLanguage === "ko"
      ? "드래그하여 가격 범위 조정"
      : currentLanguage === "vi"
        ? "Kéo để điều chỉnh khoảng giá"
        : "Drag to adjust price range";

  const minPct = rentSliderIndexToPct(safeMinIdx) * 100;
  const maxPct = rentSliderIndexToPct(safeMaxIdx) * 100;
  const widthPct = maxPct - minPct;

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
        {getUIText("rentWeekly", currentLanguage)}
      </label>
      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 tracking-tight">
            {formatCurrency(minPrice)} — {formatCurrency(maxPrice)}
          </div>
          <div className="text-xs text-gray-400 mt-1 font-medium">
            VND / {weekLabel}
          </div>
        </div>
      </div>

      <div
        className="relative py-6"
        ref={rentTrackRef}
        onPointerDown={handleRentTrackPointerDown}
      >
        <div className="absolute left-0 right-0 top-3 h-px bg-gray-300" />

        <div className="absolute left-0 right-0 top-3 pointer-events-none">
          {Array.from({ length: RENT_SLIDER_LAST_INDEX + 1 }, (_, i) => {
            const v = getRentSliderValueAtIndex(i, cap);
            const left = rentSliderIndexToPct(i) * 100;
            return (
              <div
                key={`tick-${i}`}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <div className="w-px h-3 bg-gray-400" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
                  {formatCurrency(v)}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="absolute top-3 h-px rounded-full -translate-y-1/2"
          style={{
            backgroundColor: primaryColor,
            left: `${minPct}%`,
            width: `${widthPct}%`,
          }}
        />

        <div
          className="absolute top-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
          style={{ left: `${minPct}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const handlePointerMove = (moveEvent: PointerEvent) => {
              const trackEl = rentTrackRef.current;
              if (!trackEl) return;

              const rect = trackEl.getBoundingClientRect();
              const x = moveEvent.clientX - rect.left;
              const pct = rect.width > 0 ? x / rect.width : 0;
              const idx = rentSliderPctToIndex(pct);
              setMinFromIndex(idx);
            };

            const handlePointerUp = () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
              document.removeEventListener("pointerleave", handlePointerUp);
              document.removeEventListener("pointercancel", handlePointerUp);
            };

            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
            document.addEventListener("pointerleave", handlePointerUp);
            document.addEventListener("pointercancel", handlePointerUp);
          }}
        >
          <div
            className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center"
            style={{ borderColor: primaryColor }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
          >
            {formatCurrency(minPrice)}
          </div>
        </div>

        <div
          className="absolute top-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
          style={{ left: `${maxPct}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const handlePointerMove = (moveEvent: PointerEvent) => {
              const trackEl = rentTrackRef.current;
              if (!trackEl) return;

              const rect = trackEl.getBoundingClientRect();
              const x = moveEvent.clientX - rect.left;
              const pct = rect.width > 0 ? x / rect.width : 0;
              const idx = rentSliderPctToIndex(pct);
              setMaxFromIndex(idx);
            };

            const handlePointerUp = () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
              document.removeEventListener("pointerleave", handlePointerUp);
              document.removeEventListener("pointercancel", handlePointerUp);
            };

            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
            document.addEventListener("pointerleave", handlePointerUp);
            document.addEventListener("pointercancel", handlePointerUp);
          }}
        >
          <div
            className="w-6 h-6 bg-white border-2 rounded-full shadow-md flex items-center justify-center"
            style={{ borderColor: primaryColor }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-2 py-1 rounded-md shadow border whitespace-nowrap"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
          >
            {formatCurrency(maxPrice)}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={RENT_SLIDER_LAST_INDEX}
          step={1}
          value={safeMinIdx}
          onChange={(e) => {
            setMinFromIndex(Number(e.target.value));
          }}
          className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-20"
        />
        <input
          type="range"
          min={0}
          max={RENT_SLIDER_LAST_INDEX}
          step={1}
          value={safeMaxIdx}
          onChange={(e) => {
            setMaxFromIndex(Number(e.target.value));
          }}
          className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-20"
        />
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">{dragHint}</div>
    </div>
  );
}
