import { Calendar } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getPropertyTypeLabel, getUIText } from "@/utils/i18n";

type PropertyType = "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached";

interface EditPropertyCoreSectionProps {
  currentLanguage: string;
  colors: {
    border: string;
    error: string;
    text: string;
    textSecondary: string;
    white: string;
    primary: string;
  };
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxAdults: number;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  weeklyRent: string;
  needsRentalCalendarAck: boolean;
  rentalCalendarAcknowledged: boolean;
  openCheckInCalendar: () => void;
  openCheckOutCalendar: () => void;
  setPropertyType: (value: PropertyType) => void;
  setBedrooms: (value: number) => void;
  setBathrooms: (value: number) => void;
  setMaxAdults: (value: number) => void;
  setMaxChildren: (value: number) => void;
  setWeeklyRent: (value: string) => void;
}

const TYPE_VALUES: PropertyType[] = ["studio", "one_room", "two_room", "three_plus", "detached"];

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

const getDateText = (value: Date | null, lang: SupportedLanguage) => {
  if (!value) {
    return getUIText("selectDate", lang);
  }
  try {
    return value.toLocaleDateString(dateLocale(lang), { month: "short", day: "numeric" });
  } catch {
    return getUIText("selectDate", lang);
  }
};

export default function EditPropertyCoreSection({
  currentLanguage,
  colors,
  propertyType,
  bedrooms,
  bathrooms,
  maxAdults,
  checkInDate,
  checkOutDate,
  weeklyRent,
  needsRentalCalendarAck,
  rentalCalendarAcknowledged,
  openCheckInCalendar,
  openCheckOutCalendar,
  setPropertyType,
  setBedrooms,
  setBathrooms,
  setMaxAdults,
  setMaxChildren,
  setWeeklyRent,
}: EditPropertyCoreSectionProps) {
  const lang = currentLanguage as SupportedLanguage;
  return (
    <>
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
              onClick={() => setPropertyType(value)}
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
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}40` }}>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {getUIText("roomsLabel", lang)}
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                disabled={propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                {(() => {
                  const opts =
                    propertyType === "studio" || propertyType === "one_room"
                      ? [1]
                      : propertyType === "two_room"
                        ? [2]
                        : propertyType === "three_plus"
                          ? [2, 3, 4, 5]
                          : propertyType === "detached"
                            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            : [];
                  return opts.map((n) => (
                    <option key={n} value={n}>
                      {n === 5 && propertyType === "three_plus" ? "5+" : n}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {getUIText("detBathCount", lang)}
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                {(() => {
                  const opts =
                    propertyType === "studio" || propertyType === "one_room"
                      ? [1, 2]
                      : propertyType === "two_room"
                        ? [1, 2, 3]
                        : propertyType === "three_plus"
                          ? [1, 2, 3, 4, 5, 6]
                          : propertyType === "detached"
                            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            : [];
                  return opts.map((n) => (
                    <option key={n} value={n}>
                      {n === 6 && propertyType === "three_plus" ? "5+" : n}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {getUIText("maxGuests", lang)}
              </label>
              <select
                value={maxAdults}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxAdults(v);
                  setMaxChildren(0);
                }}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{getUIText("listingWantRentDates", lang)}</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={openCheckInCalendar}
            className={`flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 ${
              needsRentalCalendarAck && !rentalCalendarAcknowledged ? "border-red-500" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">{getUIText("listingLabelStart", lang)}</div>
                <div className="text-sm font-medium text-gray-900">{getDateText(checkInDate, lang)}</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={openCheckOutCalendar}
            className={`flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 ${
              needsRentalCalendarAck && !rentalCalendarAcknowledged ? "border-red-500" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">{getUIText("listingLabelEnd", lang)}</div>
                <div className="text-sm font-medium text-gray-900">{getDateText(checkOutDate, lang)}</div>
              </div>
            </div>
          </button>
        </div>
        {needsRentalCalendarAck && !rentalCalendarAcknowledged && (
          <p className="text-[11px] text-red-600 mt-2">{getUIText("editRentalRangeWarn", lang)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIText("weeklyRent", lang)}
          <span className="text-red-500 text-xs ml-1">*</span>
          <span className="text-gray-500 text-xs ml-2 font-normal">({getUIText("utilitiesIncluded", lang)})</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={weeklyRent ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString() : ""}
            onChange={(e) => setWeeklyRent(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
          <span className="text-gray-600 font-medium">{getUIText("curVnd", lang)}</span>
        </div>
      </div>
    </>
  );
}
