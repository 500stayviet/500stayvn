"use client";

import { Sparkles } from "lucide-react";
import {
  FACILITY_CATEGORIES,
  FACILITY_OPTIONS,
  FULL_ELECTRONICS_IDS,
  FULL_FURNITURE_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from "@/lib/constants/facilities";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyPolicySectionProps {
  currentLanguage: string;
  colors: AddPropertyColors;
  selectedFacilities: string[];
  maxPets: number;
  petFeeAmount: string;
  cleaningPerWeek: number;
  onToggleFacility: (facilityId: string) => void;
  onMaxPetsChange: (value: number) => void;
  onPetFeeAmountChange: (value: string) => void;
  onCleaningPerWeekChange: (value: number) => void;
  getLocalizedLabel: (
    label: { en: string; ko?: string; vi?: string; ja?: string; zh?: string },
  ) => string;
}

export function AddPropertyPolicySection({
  currentLanguage,
  colors,
  selectedFacilities,
  maxPets,
  petFeeAmount,
  cleaningPerWeek,
  onToggleFacility,
  onMaxPetsChange,
  onPetFeeAmountChange,
  onCleaningPerWeekChange,
  getLocalizedLabel,
}: AddPropertyPolicySectionProps) {
  return (
    <section
      className="p-5 rounded-2xl text-left"
      style={{
        backgroundColor: `${colors.border}20`,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <h2 className="text-sm font-bold mb-4 text-left" style={{ color: colors.text }}>
        {currentLanguage === "ko"
          ? "숙소시설 및 정책"
          : currentLanguage === "vi"
            ? "Tiện ích và chính sách"
            : currentLanguage === "ja"
              ? "施設とポリシー"
              : currentLanguage === "zh"
                ? "设施与政策"
                : "Facilities & Policy"}
      </h2>
      <div className="space-y-6 text-left">
        {FACILITY_CATEGORIES.map((cat) => {
          const isBadgeCategory = ["furniture", "electronics", "kitchen"].includes(cat.id);
          const fullFurniture =
            cat.id === "furniture" &&
            FULL_FURNITURE_IDS.every((id) => selectedFacilities.includes(id));
          const fullElectronics =
            cat.id === "electronics" &&
            FULL_ELECTRONICS_IDS.every((id) => selectedFacilities.includes(id));
          const fullOptionKitchen =
            cat.id === "kitchen" &&
            FULL_OPTION_KITCHEN_IDS.every((id) => selectedFacilities.includes(id));

          return (
            <div
              key={cat.id}
              className="pt-4 pb-2 text-left"
              style={{ borderTop: `1.5px dashed ${colors.border}` }}
            >
              <div className="flex items-center gap-2 mb-2 justify-start text-left">
                <p className="text-xs font-bold text-gray-500 text-left">
                  {getLocalizedLabel(cat.label)}
                </p>
                {isBadgeCategory && (
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <p className="text-[10px] text-orange-600 font-medium">
                      모든 선택 시 뱃지 획득
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 justify-items-start">
                {FACILITY_OPTIONS.filter((option) => option.category === cat.id).map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedFacilities.includes(opt.id);
                  const label = getLocalizedLabel(opt.label);
                  return (
                    <div key={opt.id} className="flex flex-col items-center gap-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => onToggleFacility(opt.id)}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.white,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <Icon
                          className={`w-6 h-6 ${isSelected ? "text-white" : "text-gray-400"}`}
                        />
                      </button>
                      <span className="text-[10px] text-gray-600 font-medium leading-tight text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {cat.id === "policy" && selectedFacilities.includes("pet") && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                        {currentLanguage === "ko"
                          ? "최대 마리수"
                          : currentLanguage === "vi"
                            ? "Số con tối đa"
                            : "Max pets"}
                      </span>
                      <select
                        value={maxPets}
                        onChange={(e) => onMaxPetsChange(Number(e.target.value))}
                        className="w-[72px] px-2 py-2 text-xs rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: colors.white,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                        {currentLanguage === "ko"
                          ? "펫 수수료 (마리당)"
                          : currentLanguage === "vi"
                            ? "Phí thú cưng (mỗi con)"
                            : "Pet fee (per pet)"}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={
                            petFeeAmount
                              ? parseInt(petFeeAmount.replace(/\D/g, ""), 10).toLocaleString()
                              : ""
                          }
                          onChange={(e) => onPetFeeAmountChange(e.target.value.replace(/\D/g, ""))}
                          placeholder="0"
                          className="w-[88px] px-2 py-2 text-xs rounded-lg focus:outline-none"
                          style={{
                            backgroundColor: colors.white,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        />
                        <span className="text-xs font-medium shrink-0" style={{ color: colors.textSecondary }}>
                          VND
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cat.id === "policy" && selectedFacilities.includes("cleaning") && (
                <div className="mt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                      {currentLanguage === "ko"
                        ? "주당 청소 횟수"
                        : currentLanguage === "vi"
                          ? "Số lần dọn dẹp/tuần"
                          : "Cleaning per week"}
                    </span>
                    <select
                      value={cleaningPerWeek}
                      onChange={(e) => onCleaningPerWeekChange(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n}
                          {currentLanguage === "ko"
                            ? "회"
                            : currentLanguage === "vi"
                              ? " lần"
                              : "x"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {fullFurniture && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentLanguage === "ko"
                    ? "풀 가구"
                    : currentLanguage === "vi"
                      ? "Nội thất đầy đủ"
                      : "Full Furniture"}
                </div>
              )}
              {fullElectronics && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentLanguage === "ko"
                    ? "풀 가전"
                    : currentLanguage === "vi"
                      ? "Điện tử đầy đủ"
                      : "Full Electronics"}
                </div>
              )}
              {fullOptionKitchen && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentLanguage === "ko"
                    ? "풀옵션 주방"
                    : currentLanguage === "vi"
                      ? "Bếp đầy đủ"
                      : "Full Kitchen"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
