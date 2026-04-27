"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { AddPropertyColors } from "../constants/addPropertyColors";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface AddPropertyExternalCalendarSectionProps {
  currentLanguage: string;
  colors: AddPropertyColors;
  showIcalDropdown: boolean;
  icalPlatform: string;
  icalCalendarName: string;
  icalUrl: string;
  onToggleIcalDropdown: () => void;
  onIcalPlatformChange: (value: string) => void;
  onIcalCalendarNameChange: (value: string) => void;
  onIcalUrlChange: (value: string) => void;
}

export function AddPropertyExternalCalendarSection({
  currentLanguage,
  colors,
  showIcalDropdown,
  icalPlatform,
  icalCalendarName,
  icalUrl,
  onToggleIcalDropdown,
  onIcalPlatformChange,
  onIcalCalendarNameChange,
  onIcalUrlChange,
}: AddPropertyExternalCalendarSectionProps) {
  const lang = currentLanguage as SupportedLanguage;
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <button
        type="button"
        onClick={onToggleIcalDropdown}
        className="w-full py-3 px-4 flex items-center justify-between transition-colors text-left min-h-[48px]"
        style={{ backgroundColor: `${colors.border}20` }}
      >
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {getUIText("importExternalCalendar", lang)}
        </span>
        {showIcalDropdown ? (
          <ChevronUp className="w-4 h-4" style={{ color: colors.textSecondary }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
        )}
      </button>
      {showIcalDropdown && (
        <div
          className="p-4 pt-3 space-y-3"
          style={{ borderTop: `1px solid ${colors.border}30` }}
        >
          <p className="text-[11px]" style={{ color: colors.textSecondary }}>
            {getUIText("listingIcalBlurb", lang)}
          </p>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("calendarPlatformLabel", lang)}
            </label>
            <select
              value={icalPlatform}
              onChange={(e) => onIcalPlatformChange(e.target.value)}
              className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <option value="">{getUIText("calendarOptionNone", lang)}</option>
              <option value="airbnb">Airbnb</option>
              <option value="agoda">Agoda</option>
              <option value="booking_com">Booking.com</option>
              <option value="other">{getUIText("calendarOptionOther", lang)}</option>
            </select>
          </div>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("calendarNameLabel", lang)}
            </label>
            <input
              type="text"
              value={icalCalendarName}
              onChange={(e) => onIcalCalendarNameChange(e.target.value)}
              placeholder={getUIText("calendarNamePlaceholderExample", lang)}
              className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
              }}
            />
          </div>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("detIcalUrlField", lang)} (.ics)
            </label>
            <input
              type="url"
              value={icalUrl}
              onChange={(e) => onIcalUrlChange(e.target.value)}
              placeholder="https://..."
              className="w-full px-2 py-2 text-sm rounded-md min-h-[36px] focus:outline-none"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
