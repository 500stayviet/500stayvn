"use client";

import type { AddPropertyColors } from "../constants/addPropertyColors";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

interface AddPropertyTypeSectionProps {
  currentLanguage: string;
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
  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        backgroundColor: `${colors.border}20`,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <h2 className="text-sm font-bold mb-4" style={{ color: colors.text }}>
        {currentLanguage === "ko"
          ? "매물 종류"
          : currentLanguage === "vi"
            ? "Loại bất động sản"
            : currentLanguage === "ja"
              ? "物件の種類"
              : currentLanguage === "zh"
                ? "物业类型"
                : "Property Type"}
        <span style={{ color: colors.error }} className="ml-1">
          *
        </span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {(
          [
            {
              value: "studio" as const,
              ko: "스튜디오",
              vi: "Studio",
              en: "Studio",
              ja: "スタジオ",
              zh: "工作室",
            },
            {
              value: "one_room" as const,
              ko: "원룸(방·거실 분리)",
              vi: "Phòng đơn (phòng ngủ & phòng khách riêng)",
              en: "One Room (bedroom & living room separate)",
              ja: "ワンルーム（寝室・リビング別）",
              zh: "一室（卧室与客厅分开）",
            },
            {
              value: "two_room" as const,
              ko: "2룸",
              vi: "2 phòng",
              en: "2 Rooms",
              ja: "2ルーム",
              zh: "2室",
            },
            {
              value: "three_plus" as const,
              ko: "3+룸",
              vi: "3+ phòng",
              en: "3+ Rooms",
              ja: "3+ルーム",
              zh: "3+室",
            },
            {
              value: "detached" as const,
              ko: "독채",
              vi: "Nhà riêng",
              en: "Detached House",
              ja: "一戸建て",
              zh: "独栋房屋",
            },
          ] as const
        ).map(({ value, ko, vi, en, ja, zh }) => {
          const label =
            currentLanguage === "ko"
              ? ko
              : currentLanguage === "vi"
                ? vi
                : currentLanguage === "ja"
                  ? ja
                  : currentLanguage === "zh"
                    ? zh
                    : en;

          return (
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
              {label}
            </button>
          );
        })}
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
              {currentLanguage === "ko"
                ? "방 개수"
                : currentLanguage === "vi"
                  ? "Số phòng"
                  : "Bedrooms"}
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
                  {n === 5 &&
                  (propertyType === "three_plus" || propertyType === "detached")
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
              {currentLanguage === "ko"
                ? "화장실 수"
                : currentLanguage === "vi"
                  ? "Số phòng tắm"
                  : "Bathrooms"}
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
              {currentLanguage === "ko"
                ? "최대 인원"
                : currentLanguage === "vi"
                  ? "Số người tối đa"
                  : "Max Guests"}
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
                  {currentLanguage === "ko"
                    ? "명"
                    : currentLanguage === "vi"
                      ? " người"
                      : " guests"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
