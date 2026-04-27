"use client";

import { Check, MapPin, X } from "lucide-react";
import {
  getDistrictsByCityId,
  VIETNAM_CITIES,
} from "@/lib/data/vietnam-regions";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyAddressSectionProps {
  currentLanguage: SupportedLanguage;
  colors: AddPropertyColors;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  selectedCityId: string;
  selectedDistrictId: string;
  buildingNumber: string;
  roomNumber: string;
  onOpenAddressModal: () => void;
  onClearAddress: () => void;
  onCityChange: (cityId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onBuildingNumberChange: (value: string) => void;
  onRoomNumberChange: (value: string) => void;
}

export function AddPropertyAddressSection({
  currentLanguage,
  colors,
  address,
  coordinates,
  selectedCityId,
  selectedDistrictId,
  buildingNumber,
  roomNumber,
  onOpenAddressModal,
  onClearAddress,
  onCityChange,
  onDistrictChange,
  onBuildingNumberChange,
  onRoomNumberChange,
}: AddPropertyAddressSectionProps) {
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
        {getUIText("address", lang)}
        <span style={{ color: colors.error }} className="ml-1">
          *
        </span>
      </h2>

      <div className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-gray-500">{getUIText("listingFindAddrBtn", lang)}</p>
        </div>
        {(!address || !coordinates) && (
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.98]"
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
            }}
          >
            <MapPin className="w-5 h-5" />
            <span>{getUIText("listingFindAddrBtn", lang)}</span>
          </button>
        )}
        {address && coordinates && (
          <div
            className="p-3 rounded-lg cursor-pointer transition-colors"
            style={{
              backgroundColor: `${colors.success}15`,
              border: `1px solid ${colors.success}30`,
            }}
            onClick={onOpenAddressModal}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-1.5 rounded-md flex-shrink-0"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Check className="w-4 h-4" style={{ color: colors.success }} />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: colors.success }}
                >
                  {getUIText("listingAddrPinnedHint", lang)}
                </span>
                <p
                  className="text-sm font-medium mt-0.5"
                  style={{ color: colors.text }}
                >
                  {address}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAddress();
                }}
                className="property-register-icon-btn property-register-icon-btn--photo rounded-full transition-colors flex-shrink-0"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <X className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="pt-4 pb-2"
        style={{
          borderTop: `1.5px dashed ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-gray-500">{getUIText("listingCityDistHeader", lang)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("labelCity", lang)}
              <span style={{ color: colors.error }} className="ml-1">
                *
              </span>
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={!address || !coordinates}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <option value="">{getUIText("selectLabel", lang)}</option>
              {VIETNAM_CITIES.map((c) => {
                const langMap: Record<string, string> = {
                  ko: c.nameKo,
                  vi: c.nameVi,
                  en: c.name,
                  ja: c.nameJa ?? c.name,
                  zh: c.nameZh ?? c.name,
                };
                return (
                  <option key={c.id} value={c.id}>
                    {langMap[lang] ?? c.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("labelDistrict", lang)}
              <span style={{ color: colors.error }} className="ml-1">
                *
              </span>
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => onDistrictChange(e.target.value)}
              disabled={!address || !coordinates || !selectedCityId}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <option value="">{getUIText("selectLabel", lang)}</option>
              {getDistrictsByCityId(selectedCityId).map((d) => {
                const langMap: Record<string, string> = {
                  ko: d.nameKo,
                  vi: d.nameVi,
                  en: d.name,
                  ja: d.nameJa ?? d.name,
                  zh: d.nameZh ?? d.name,
                };
                return (
                  <option key={d.id} value={d.id}>
                    {langMap[lang] ?? d.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div
        className="pt-4 pb-2"
        style={{
          borderTop: `1.5px dashed ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-gray-500">{getUIText("listingUnitBlockTitle", lang)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {getUIText("listingWing", lang)}
            </label>
            <input
              type="text"
              value={buildingNumber}
              onChange={(e) => onBuildingNumberChange(e.target.value)}
              placeholder={getUIText("listingWingPh", lang)}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
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
              {getUIText("listingRoomNo", lang)}
              <span style={{ color: colors.error }} className="ml-1">
                *
              </span>
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => onRoomNumberChange(e.target.value)}
              placeholder={getUIText("listingRoomPh", lang)}
              className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
              }}
            />
          </div>
        </div>
        <p
          className="text-[10px] mt-2 flex items-start gap-1"
          style={{ color: colors.textSecondary }}
        >
          <span style={{ color: colors.primary }}>i</span>
          <span>
            {getUIText("listingUnitPrivacyGuest", lang)}
          </span>
        </p>
      </div>
    </section>
  );
}
