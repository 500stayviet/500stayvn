"use client";

import { PropertyDescription } from "@/components/PropertyDescription";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice } from "@/lib/utils/propertyUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { getDateLocaleForLanguage } from "@/utils/i18n";
import { PropertyDetailFacilitiesSection } from "./PropertyDetailFacilitiesSection";

const SECTION_DASHED = { borderBottom: "1.5px dashed rgba(254, 215, 170, 0.8)" };

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

type ColorTokens = {
  primary: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

type Props = {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  colors: ColorTokens;
  cityDistrictLine: string;
  propertyTypeLabel: string;
};

/**
 * 임대인 모드: 내 매물 확인 — 단위/외부캘린더 등 임대인 전용 필드 포함.
 */
export function PropertyDetailOwnerContent({
  property,
  currentLanguage,
  colors,
  cityDistrictLine,
  propertyTypeLabel,
}: Props) {
  const curLabels = {
    vnd: getUIText("curVnd", currentLanguage),
    usd: getUIText("curUsd", currentLanguage),
    krw: getUIText("curKrw", currentLanguage),
  };

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
          {getUIText("detCityDistLine", currentLanguage)}
        </p>
        <p className="text-sm" style={{ color: colors.text }}>
          {cityDistrictLine}
        </p>
      </section>
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("address", currentLanguage)}
        </p>
        <p className="text-sm break-words leading-relaxed" style={{ color: colors.text }}>
          {property.address || "—"}
        </p>
      </section>
      {property.unitNumber && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("detUnitBlock", currentLanguage)}
          </p>
          <p className="text-sm" style={{ color: colors.text }}>
            {property.unitNumber}
          </p>
          <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
            {getUIText("detUnitTenantOnly", currentLanguage)}
          </p>
        </section>
      )}

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
                {property.checkInDate ? formatDate(property.checkInDate, currentLanguage) : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {getUIText("listingLabelEnd", currentLanguage)}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkOutDate ? formatDate(property.checkOutDate, currentLanguage) : "—"}
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
        colors={colors}
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
              cacheKey={`property-detail-owner-${property.id}`}
              className="text-base leading-relaxed"
            />
          </div>
        </section>
      )}

      {(property.icalPlatform || property.icalCalendarName || property.icalUrl) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {getUIText("detExtCalTitle", currentLanguage)}
          </p>
          <div className="space-y-2">
            {property.icalPlatform && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  {getUIText("calendarPlatformLabel", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.icalPlatform}
                </p>
              </div>
            )}
            {property.icalCalendarName && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  {getUIText("calendarNameLabel", currentLanguage)}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.icalCalendarName}
                </p>
              </div>
            )}
            {property.icalUrl && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  {getUIText("detIcalUrlField", currentLanguage)}
                </p>
                <p className="text-sm break-all" style={{ color: colors.text }}>
                  {property.icalUrl}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
