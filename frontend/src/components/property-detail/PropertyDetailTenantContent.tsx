"use client";

import { ChevronDown } from "lucide-react";
import { PropertyDescription } from "@/components/PropertyDescription";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice, getBookableDateSegments } from "@/lib/utils/propertyUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { getDateLocaleForLanguage } from "@/utils/i18n";
import { PropertyDetailFacilitiesSection } from "./PropertyDetailFacilitiesSection";
import type { PropertyDetailBookingVm } from "./usePropertyDetailBooking";

const SECTION_DASHED = { borderBottom: "1.5px dashed rgba(254, 215, 170, 0.8)" };

type ColorTokens = {
  primary: string;
  secondary: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

type Props = {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  colors: ColorTokens;
  labelColor: string;
  cityDistrictLine: string;
  propertyTypeLabel: string;
  booking: PropertyDetailBookingVm;
};

function formatAreaNumber(area: number, lang: SupportedLanguage): string {
  return Number(area).toLocaleString(getDateLocaleForLanguage(lang), {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function hasDisplayableArea(property: PropertyData): boolean {
  const a = property.area;
  return typeof a === "number" && Number.isFinite(a) && a > 0;
}

/**
 * 임차인 모드: 매물 메타·이용기간(예약과 무관한 노출 기간)·시설·체크인·설명·날짜/인원/예약 CTA.
 */
export function PropertyDetailTenantContent({
  property,
  currentLanguage,
  colors,
  labelColor,
  cityDistrictLine,
  propertyTypeLabel,
  booking: b,
}: Props) {
  const {
    bookedRanges,
    checkInDate,
    checkOutDate,
    showGuestDropdown,
    setShowGuestDropdown,
    guestDropdownRef,
    addPetSelected,
    setAddPetSelected,
    selectedPetCount,
    setSelectedPetCount,
    showPetDropdown,
    setShowPetDropdown,
    petDropdownRef,
    selectedGuests,
    setSelectedGuests,
    maxGuests,
    maxPets,
    petAllowed,
    bookNow,
  } = b;

  const curLabels = {
    vnd: getUIText("curVnd", currentLanguage),
    usd: getUIText("curUsd", currentLanguage),
    krw: getUIText("curKrw", currentLanguage),
  };
  const dateLoc = getDateLocaleForLanguage(currentLanguage);

  return (
    <>
      {property.propertyType && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("listingKindTitle", currentLanguage)}
          </p>
          <p className="text-sm" style={{ color: colors.text }}>
            {propertyTypeLabel}
          </p>
        </section>
      )}
      {(property.bedrooms !== undefined ||
        property.bathrooms !== undefined ||
        property.maxAdults != null ||
        property.maxChildren != null ||
        hasDisplayableArea(property)) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <div className="grid grid-cols-3 gap-2">
            {property.bedrooms !== undefined && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {getUIText("roomsLabel", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.bedrooms}
                </p>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {getUIText("detBathCount", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.bathrooms}
                </p>
              </div>
            )}
            {(property.maxAdults != null || property.maxChildren != null) && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {getUIText("maxGuests", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {(property.maxAdults || 0) + (property.maxChildren || 0)}
                  {getUIText("detGuestSuffix", currentLanguage)}
                </p>
              </div>
            )}
            {hasDisplayableArea(property) && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {getUIText("detAreaLabel", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {formatAreaNumber(property.area, currentLanguage)}{" "}
                  {getUIText("areaUnitSqm", currentLanguage)}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("address", currentLanguage)}
        </p>
        <p className="text-sm break-words leading-relaxed" style={{ color: colors.text }}>
          {property.address || "—"}
        </p>
      </section>
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("detCityDistLine", currentLanguage)}
        </p>
        <p className="text-sm" style={{ color: colors.text }}>
          {cityDistrictLine}
        </p>
      </section>
      {(property.checkInDate || property.checkOutDate) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("detAvailRange", currentLanguage)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {getUIText("listingLabelStart", currentLanguage)}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkInDate && property.checkOutDate
                  ? (() => {
                      const segments = getBookableDateSegments(
                        property.checkInDate!,
                        property.checkOutDate!,
                        bookedRanges,
                      );
                      return segments.length > 0
                        ? segments.length === 1
                          ? formatDate(segments[0].start, currentLanguage)
                          : formatDate(segments[0].start, currentLanguage) + " ~"
                        : "—";
                    })()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {getUIText("listingLabelEnd", currentLanguage)}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkInDate && property.checkOutDate
                  ? (() => {
                      const segments = getBookableDateSegments(
                        property.checkInDate!,
                        property.checkOutDate!,
                        bookedRanges,
                      );
                      return segments.length > 0
                        ? segments.length === 1
                          ? formatDate(segments[0].end, currentLanguage)
                          : formatDate(segments[segments.length - 1].end, currentLanguage)
                        : "—";
                    })()
                  : "—"}
              </p>
            </div>
          </div>
        </section>
      )}
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("weeklyRent", currentLanguage)}
        </p>
        <p className="text-lg font-bold" style={{ color: colors.text }}>
          {formatFullPrice(property.price, property.priceUnit, curLabels)}
          <span className="text-sm font-normal ml-1.5" style={{ color: colors.textMuted }}>
            {getUIText("utilitiesIncluded", currentLanguage)}
          </span>
        </p>
      </section>

      <PropertyDetailFacilitiesSection
        property={property}
        currentLanguage={currentLanguage}
        colors={{
          primary: colors.primary,
          border: colors.border,
          text: colors.text,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
        }}
        title={getUIText("detPolicyTitle", currentLanguage)}
      />

      {(property.checkInTime || property.checkOutTime) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("checkInOutScheduleTitle", currentLanguage)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {getUIText("checkIn", currentLanguage)}
              </p>
              <p className="text-base" style={{ color: colors.text }}>
                {property.checkInTime || "14:00"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {getUIText("checkOut", currentLanguage)}
              </p>
              <p className="text-base" style={{ color: colors.text }}>
                {property.checkOutTime || "12:00"}
              </p>
            </div>
          </div>
        </section>
      )}

      {property.original_description && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("description", currentLanguage)}
          </p>
          <div style={{ color: colors.text }}>
            <PropertyDescription
              description={property.original_description}
              sourceLanguage="vi"
              targetLanguage={currentLanguage}
              cacheKey={`property-detail-tenant-${property.id}`}
              className="text-base leading-relaxed"
            />
          </div>
        </section>
      )}

      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("selectDatesAndGuests", currentLanguage)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              b.setCalendarMode("checkin");
              b.setShowCalendar(true);
              setShowGuestDropdown(false);
            }}
            className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
              checkInDate ? "bg-orange-50/50" : "bg-white"
            }`}
            style={{ borderColor: checkInDate ? colors.secondary : "#d1d5db" }}
          >
            <span className="text-[9px] text-gray-500 mb-0.5">{getUIText("checkIn", currentLanguage)}</span>
            <span className={`text-xs font-semibold ${checkInDate ? "text-orange-600" : "text-gray-400"}`}>
              {checkInDate
                ? checkInDate.toLocaleDateString(dateLoc, { month: "short", day: "numeric" })
                : getUIText("selectDate", currentLanguage)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              b.setCalendarMode("checkout");
              b.setShowCalendar(true);
              setShowGuestDropdown(false);
            }}
            className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
              checkOutDate ? "bg-orange-50/50" : "bg-white"
            }`}
            style={{ borderColor: checkOutDate ? colors.secondary : "#d1d5db" }}
          >
            <span className="text-[9px] text-gray-500 mb-0.5">{getUIText("checkOut", currentLanguage)}</span>
            <span className={`text-xs font-semibold ${checkOutDate ? "text-orange-600" : "text-gray-400"}`}>
              {checkOutDate
                ? checkOutDate.toLocaleDateString(dateLoc, { month: "short", day: "numeric" })
                : getUIText("selectDate", currentLanguage)}
            </span>
          </button>
          <div className="relative" ref={guestDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowGuestDropdown(!showGuestDropdown);
                b.setShowCalendar(false);
              }}
              className={`w-full min-h-[52px] flex flex-col items-center justify-center px-2 py-2 rounded-lg border-2 border-solid transition-all ${
                showGuestDropdown ? "bg-orange-50/50" : "bg-white"
              }`}
              style={{ borderColor: showGuestDropdown ? colors.secondary : "#d1d5db" }}
            >
              <span className="text-[9px] text-gray-500 mb-0.5">
                {getUIText("guestSelect", currentLanguage)}
              </span>
              <span className="text-xs font-semibold text-gray-900 flex items-center gap-0.5">
                {selectedGuests}
                <ChevronDown
                  className={`w-3 h-3 text-gray-500 transition-transform ${showGuestDropdown ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            {showGuestDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-32 overflow-y-auto">
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setSelectedGuests(n);
                      setShowGuestDropdown(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs ${
                      selectedGuests === n ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                    {getUIText("detGuestSuffix", currentLanguage)}
                    {n === maxGuests && (
                      <span className="text-gray-500 font-normal"> {getUIText("maxSuffix", currentLanguage)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {petAllowed && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={addPetSelected}
                onChange={(e) => {
                  setAddPetSelected(e.target.checked);
                  if (!e.target.checked) setSelectedPetCount(0);
                }}
                className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600"
              />
              <span className="text-xs text-gray-700">{getUIText("petsTravelQuestion", currentLanguage)}</span>
            </label>
            {addPetSelected && (
              <div className="relative" ref={petDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPetDropdown(!showPetDropdown)}
                  className="flex items-center gap-1 px-2 py-1 border-b border-solid text-xs font-medium"
                  style={{ borderColor: labelColor, color: labelColor }}
                >
                  {selectedPetCount}
                  {getUIText("petCountClassifier", currentLanguage)}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showPetDropdown ? "rotate-180" : ""}`}
                  />
                </button>
                {showPetDropdown && (
                  <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[70px]">
                    {Array.from({ length: maxPets }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setSelectedPetCount(n);
                          setShowPetDropdown(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs ${
                          selectedPetCount === n ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {n}
                        {getUIText("petCountClassifier", currentLanguage)}
                        {n === maxPets && (
                          <span className="text-gray-500"> {getUIText("maxSuffix", currentLanguage)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {maxGuests > 0 && selectedGuests === maxGuests && (
          <p className="mt-2 text-[10px] text-red-600 font-medium">{getUIText("guestOverMaxNotice", currentLanguage)}</p>
        )}
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={bookNow}
          disabled={!checkInDate || !checkOutDate}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
            checkInDate && checkOutDate
              ? "bg-orange-500 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {checkInDate && checkOutDate ? getUIText("bookNow", currentLanguage) : getUIText("selectDatesFirst", currentLanguage)}
        </button>
      </div>
    </>
  );
}
