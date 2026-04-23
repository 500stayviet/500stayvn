"use client";

import { Check, MapPin, X } from "lucide-react";
import {
  getDistrictsByCityId,
  VIETNAM_CITIES,
} from "@/lib/data/vietnam-regions";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyAddressSectionProps {
  currentLanguage: string;
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
          ? "주소"
          : currentLanguage === "vi"
            ? "Địa chỉ"
            : currentLanguage === "ja"
              ? "住所"
              : currentLanguage === "zh"
                ? "地址"
                : "Address"}
        <span style={{ color: colors.error }} className="ml-1">
          *
        </span>
      </h2>

      <div className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-gray-500">
            {currentLanguage === "ko"
              ? "주소 찾기"
              : currentLanguage === "vi"
                ? "Tìm địa chỉ"
                : currentLanguage === "ja"
                  ? "住所検索"
                  : currentLanguage === "zh"
                    ? "查找地址"
                    : "Find Address"}
          </p>
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
            <span>
              {currentLanguage === "ko"
                ? "주소 찾기"
                : currentLanguage === "vi"
                  ? "Tìm địa chỉ"
                  : "Find Address"}
            </span>
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
                  {currentLanguage === "ko"
                    ? "확정된 주소 (클릭하여 수정)"
                    : currentLanguage === "vi"
                      ? "Địa chỉ đã xác nhận"
                      : "Confirmed Address"}
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
          <p className="text-xs font-bold text-gray-500">
            {currentLanguage === "ko"
              ? "도시·구"
              : currentLanguage === "vi"
                ? "Thành phố·Quận"
                : currentLanguage === "ja"
                  ? "都市・区"
                  : currentLanguage === "zh"
                    ? "城市・区"
                    : "City·District"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {currentLanguage === "ko"
                ? "도시"
                : currentLanguage === "vi"
                  ? "Thành phố"
                  : "City"}
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
              <option value="">
                {currentLanguage === "ko"
                  ? "선택"
                  : currentLanguage === "vi"
                    ? "Chọn"
                    : currentLanguage === "ja"
                      ? "選択"
                      : currentLanguage === "zh"
                        ? "选择"
                        : "Select"}
              </option>
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
                    {langMap[currentLanguage] ?? c.name}
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
              {currentLanguage === "ko"
                ? "구"
                : currentLanguage === "vi"
                  ? "Quận"
                  : "District"}
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
              <option value="">
                {currentLanguage === "ko"
                  ? "선택"
                  : currentLanguage === "vi"
                    ? "Chọn"
                    : currentLanguage === "ja"
                      ? "選択"
                      : currentLanguage === "zh"
                        ? "选择"
                        : "Select"}
              </option>
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
                    {langMap[currentLanguage] ?? d.name}
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
          <p className="text-xs font-bold text-gray-500">
            {currentLanguage === "ko"
              ? "동호수"
              : currentLanguage === "vi"
                ? "Số phòng"
                : currentLanguage === "ja"
                  ? "部屋番号"
                  : currentLanguage === "zh"
                    ? "房间号"
                    : "Unit Number"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="block text-[11px] font-medium mb-1.5"
              style={{ color: colors.textSecondary }}
            >
              {currentLanguage === "ko"
                ? "동"
                : currentLanguage === "vi"
                  ? "Tòa"
                  : "Building"}
            </label>
            <input
              type="text"
              value={buildingNumber}
              onChange={(e) => onBuildingNumberChange(e.target.value)}
              placeholder={currentLanguage === "ko" ? "예: A" : "e.g., A"}
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
              {currentLanguage === "ko"
                ? "호실"
                : currentLanguage === "vi"
                  ? "Phòng"
                  : "Room"}
              <span style={{ color: colors.error }} className="ml-1">
                *
              </span>
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => onRoomNumberChange(e.target.value)}
              placeholder={currentLanguage === "ko" ? "예: 101" : "e.g., 101"}
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
            {currentLanguage === "ko"
              ? "동호수는 예약 완료 후 임차인에게만 표시됩니다."
              : currentLanguage === "vi"
                ? "Số phòng chỉ hiển thị cho người thuê sau khi đặt chỗ."
                : "Unit number shown to tenants after booking."}
          </span>
        </p>
      </div>
    </section>
  );
}
