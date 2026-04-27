"use client";

import { Calendar } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyRentalSectionProps {
  currentLanguage: SupportedLanguage;
  colors: AddPropertyColors;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  weeklyRent: string;
  onOpenCheckInCalendar: () => void;
  onOpenCheckOutCalendar: () => void;
  onWeeklyRentChange: (value: string) => void;
}

const dateLocale = (lang: SupportedLanguage): string => {
  switch (lang) {
    case "ko":
      return "ko-KR";
    case "vi":
      return "vi-VN";
    case "ja":
      return "ja-JP";
    case "zh":
      return "zh-CN";
    default:
      return "en-US";
  }
};

const formatDateDisplay = (value: Date | null, lang: SupportedLanguage): string => {
  if (!value || Number.isNaN(value.getTime())) {
    return getUIText("selectDate", lang);
  }
  return value.toLocaleDateString(dateLocale(lang), {
    month: "short",
    day: "numeric",
  });
};

export function AddPropertyRentalSection({
  currentLanguage,
  colors,
  checkInDate,
  checkOutDate,
  weeklyRent,
  onOpenCheckInCalendar,
  onOpenCheckOutCalendar,
  onWeeklyRentChange,
}: AddPropertyRentalSectionProps) {
  const t = currentLanguage;
  return (
    <>
      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: colors.text }}>
          {getUIText("listingWantRentDates", t)}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenCheckInCalendar}
            className="flex items-center px-3 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">{getUIText("listingLabelStart", t)}</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDateDisplay(checkInDate, t)}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCheckOutCalendar}
            className="flex items-center px-3 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">{getUIText("listingLabelEnd", t)}</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDateDisplay(checkOutDate, t)}
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-1" style={{ color: colors.text }}>
          {getUIText("weeklyRent", t)}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <p className="text-[11px] mb-3" style={{ color: colors.textSecondary }}>
          {getUIText("utilitiesIncluded", t)}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={
              weeklyRent
                ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString()
                : ""
            }
            onChange={(e) => onWeeklyRentChange(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
            required
          />
          <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {getUIText("curVnd", t)}
          </span>
        </div>
      </section>
    </>
  );
}
