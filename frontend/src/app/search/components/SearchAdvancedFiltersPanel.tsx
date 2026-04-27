"use client";

import type { Dispatch, SetStateAction } from "react";
import { Bed, Sparkles, Tv } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { FACILITY_OPTIONS } from "@/lib/constants/facilities";
import { getUIText } from "@/utils/i18n";
import { SearchRentRangeSlider } from "./SearchRentRangeSlider";

type SearchAdvancedFiltersPanelProps = {
  currentLanguage: SupportedLanguage;
  primaryColor: string;
  priceCap: number;
  minPrice: number;
  maxPrice: number;
  setMinPrice: (v: number) => void;
  setMaxPrice: (v: number) => void;
  fullFurniture: boolean;
  setFullFurniture: Dispatch<SetStateAction<boolean>>;
  fullElectronics: boolean;
  setFullElectronics: Dispatch<SetStateAction<boolean>>;
  fullOptionKitchen: boolean;
  setFullOptionKitchen: Dispatch<SetStateAction<boolean>>;
  amenityFilters: Record<string, boolean>;
  setAmenityFilters: Dispatch<SetStateAction<Record<string, boolean>>>;
};

export function SearchAdvancedFiltersPanel({
  currentLanguage,
  primaryColor,
  priceCap,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  fullFurniture,
  setFullFurniture,
  fullElectronics,
  setFullElectronics,
  fullOptionKitchen,
  setFullOptionKitchen,
  amenityFilters,
  setAmenityFilters,
}: SearchAdvancedFiltersPanelProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-5">
      <SearchRentRangeSlider
        currentLanguage={currentLanguage}
        primaryColor={primaryColor}
        priceCap={priceCap}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
      />

      <div>
        <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
          {getUIText("fullOption", currentLanguage)}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFullFurniture(!fullFurniture)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              fullFurniture
                ? "text-white border"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
            style={
              fullFurniture
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : undefined
            }
          >
            <Bed className="w-3.5 h-3.5" />
            {getUIText("fullFurniture", currentLanguage)}
          </button>
          <button
            type="button"
            onClick={() => setFullElectronics(!fullElectronics)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              fullElectronics
                ? "text-white border"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
            style={
              fullElectronics
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : undefined
            }
          >
            <Tv className="w-3.5 h-3.5" />
            {getUIText("fullElectronics", currentLanguage)}
          </button>
          <button
            type="button"
            onClick={() => setFullOptionKitchen(!fullOptionKitchen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              fullOptionKitchen
                ? "text-white border"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
            style={
              fullOptionKitchen
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : undefined
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
            {getUIText("fullKitchen", currentLanguage)}
          </button>
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
          {getUIText("searchFilterFacilityPickHeading", currentLanguage)}
        </span>
        <div className="flex flex-wrap gap-2">
          {FACILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const label =
              opt.id === "cleaning"
                ? getUIText("cleaningShort", currentLanguage)
                : (opt.label[currentLanguage] ?? opt.label.en);
            const on = !!amenityFilters[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setAmenityFilters((prev) => ({
                    ...prev,
                    [opt.id]: !prev[opt.id],
                  }));
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                  on
                    ? "text-white border"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
                style={
                  on
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }
                    : undefined
                }
                title={label}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[70px]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
