"use client";

import type { SupportedLanguage } from "@/lib/api/translation";
import { getPropertyTypeLabel, getUIText } from "@/utils/i18n";
import type { AddPropertyColors } from "../constants/addPropertyColors";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface AddPropertyTypeSectionProps {
  currentLanguage: SupportedLanguage;
  colors: AddPropertyColors;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxAdults: number;
  bedroomOptions: number[];
  bathroomOptions: number[];
  onPropertyTypeChange: (type: PropertyType) => void;
  onBedroomsChange: (value: number) => void;
  onBathroomsChange: (value: number) => void;
  onMaxAdultsChange: (value: number) => void;
  onMaxChildrenReset: () => void;
}

const TYPE_VALUES: PropertyType[] = ["studio", "one_room", "two_room", "three_plus", "detached"];

export function AddPropertyTypeSection({
  currentLanguage,
  colors,
  propertyType,
  bedrooms,
  bathrooms,
  maxAdults,
  bedroomOptions,
  bathroomOptions,
  onPropertyTypeChange,
  onBedroomsChange,
  onBathroomsChange,
  onMaxAdultsChange,
  onMaxChildrenReset,
}: AddPropertyTypeSectionProps) {
  const lang = currentLanguage;
  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        backgroundColor: `${colors.border}20`,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <h2 className="text-sm font-bold mb-4" style={{ color: colors.text }}>
        {getUIText("listingKindTitle", lang)}
        <span style={{ color: colors.error }} className="ml-1">
          *
        </span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {TYPE_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPropertyTypeChange(value)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: propertyType === value ? colors.primary : colors.white,
              color: propertyType === value ? colors.white : colors.text,
              border: `1px solid ${propertyType === value ? colors.primary : colors.border}`,
            }}
          >
            {getPropertyTypeLabel(value, lang)}
          </button>
        ))}
      </div>

      {propertyType && (
        <div
          className="grid grid-cols-3 gap-2 mt-4 pt-4"
          style={{ borderTop: `1px solid ${colors.border}40` }}
        >
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("roomsLabel", lang)}
            </label>
            <select
              value={bedrooms}
              onChange={(e) => onBedroomsChange(Number(e.target.value))}
              disabled={
                propertyType === "studio" ||
                propertyType === "one_room" ||
                propertyType === "two_room"
              }
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              {bedroomOptions.map((n) => (
                <option key={n} value={n}>
                  {n === 5 && (propertyType === "three_plus" || propertyType === "detached")
                    ? "5+"
                    : n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("detBathCount", lang)}
            </label>
            <select
              value={bathrooms}
              onChange={(e) => onBathroomsChange(Number(e.target.value))}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              {bathroomOptions.map((n) => (
                <option key={n} value={n}>
                  {n === 6 && propertyType === "three_plus" ? "5+" : n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("maxGuests", lang)}
            </label>
            <select
              value={maxAdults}
              onChange={(e) => {
                onMaxAdultsChange(Number(e.target.value));
                onMaxChildrenReset();
              }}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                  {getUIText("detGuestSuffix", lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
