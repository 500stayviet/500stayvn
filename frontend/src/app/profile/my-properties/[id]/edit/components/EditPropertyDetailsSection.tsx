import { ChevronDown, ChevronUp } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface EditPropertyDetailsSectionProps {
  currentLanguage: string;
  checkInTime: string;
  checkOutTime: string;
  propertyName: string;
  propertyDescription: string;
  showIcalDropdown: boolean;
  icalPlatform: string;
  icalCalendarName: string;
  icalUrl: string;
  setCheckInTime: (value: string) => void;
  setCheckOutTime: (value: string) => void;
  setPropertyName: (value: string) => void;
  setPropertyDescription: (value: string) => void;
  setShowIcalDropdown: (value: boolean) => void;
  setIcalPlatform: (value: string) => void;
  setIcalCalendarName: (value: string) => void;
  setIcalUrl: (value: string) => void;
}

export default function EditPropertyDetailsSection({
  currentLanguage,
  checkInTime,
  checkOutTime,
  propertyName,
  propertyDescription,
  showIcalDropdown,
  icalPlatform,
  icalCalendarName,
  icalUrl,
  setCheckInTime,
  setCheckOutTime,
  setPropertyName,
  setPropertyDescription,
  setShowIcalDropdown,
  setIcalPlatform,
  setIcalCalendarName,
  setIcalUrl,
}: EditPropertyDetailsSectionProps) {
  const lang = currentLanguage as SupportedLanguage;
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIText("checkInOutScheduleTitle", lang)}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {getUIText("checkIn", lang)}
            </label>
            <select
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return [`${hour}:00`, `${hour}:30`];
              })
                .flat()
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {getUIText("checkOut", lang)}
            </label>
            <select
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return [`${hour}:00`, `${hour}:30`];
              })
                .flat()
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIText("propertyName", lang)}
          <span className="text-red-500 text-xs ml-1">*</span>
        </label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder={getUIText("titlePlaceholder", lang)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIText("propertyDescription", lang)}
          <span className="text-red-500 text-xs ml-1">*</span>
        </label>
        <textarea
          value={propertyDescription}
          onChange={(e) => setPropertyDescription(e.target.value)}
          placeholder={getUIText("propertyDescriptionPlaceholder", lang)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIcalDropdown(!showIcalDropdown)}
          className="w-full py-3.5 px-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="text-sm font-medium text-gray-700">
            {getUIText("importExternalCalendar", lang)}
          </span>
          {showIcalDropdown ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>
        {showIcalDropdown && (
          <div className="p-4 pt-2 border-t border-gray-200 bg-white space-y-3">
            <p className="text-xs text-gray-500">
              {getUIText("importExternalCalendarHelp", lang)}
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{getUIText("calendarPlatformLabel", lang)}</label>
              <select
                value={icalPlatform}
                onChange={(e) => setIcalPlatform(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{getUIText("calendarOptionNone", lang)}</option>
                <option value="airbnb">Airbnb</option>
                <option value="agoda">Agoda</option>
                <option value="booking_com">Booking.com</option>
                <option value="other">{getUIText("calendarOptionOther", lang)}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{getUIText("calendarNameLabel", lang)}</label>
              <input
                type="text"
                value={icalCalendarName}
                onChange={(e) => setIcalCalendarName(e.target.value)}
                placeholder={getUIText("calendarNamePlaceholderExample", lang)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {getUIText("detIcalUrlField", lang)} (.ics)
              </label>
              <input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
