"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  FACILITY_OPTIONS,
  FACILITY_CATEGORIES,
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from "@/lib/constants/facilities";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice } from "@/lib/utils/propertyUtils";

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
  /** 섹션 제목 (임차·임대 문구 차이) */
  title: ReactNode;
};

/** 숙소시설 그리드 — 임차인/임대인 상세에서 동일 마크업 재사용 */
export function PropertyDetailFacilitiesSection({ property, currentLanguage, colors, title }: Props) {
  const curLabels = {
    vnd: getUIText("curVnd", currentLanguage),
    usd: getUIText("curUsd", currentLanguage),
    krw: getUIText("curKrw", currentLanguage),
  };

  return (
    <section
      className="p-5 rounded-2xl text-left"
      style={{
        backgroundColor: `${colors.border}20`,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <h2 className="text-base font-bold mb-4 text-left" style={{ color: colors.text }}>
        {title}
      </h2>
      {property.amenities && property.amenities.length > 0 ? (
        <div className="space-y-6 text-left">
          {FACILITY_CATEGORIES.map((cat, catIndex) => {
            const selectedInCategory = FACILITY_OPTIONS.filter(
              (o) => o.category === cat.id && property.amenities?.includes(o.id),
            );
            if (selectedInCategory.length === 0) return null;
            const hasPrevSelected = FACILITY_CATEGORIES.slice(0, catIndex).some((c) =>
              FACILITY_OPTIONS.some((o) => o.category === c.id && property.amenities?.includes(o.id)),
            );
            const isBadgeCategory = ["furniture", "electronics", "kitchen"].includes(cat.id);
            const fullFurniture =
              cat.id === "furniture" && FULL_FURNITURE_IDS.every((id) => property.amenities?.includes(id));
            const fullElectronics =
              cat.id === "electronics" && FULL_ELECTRONICS_IDS.every((id) => property.amenities?.includes(id));
            const fullOptionKitchen =
              cat.id === "kitchen" && FULL_OPTION_KITCHEN_IDS.every((id) => property.amenities?.includes(id));
            return (
              <div
                key={cat.id}
                className={`pb-2 text-left ${hasPrevSelected ? "pt-4" : ""}`}
                style={hasPrevSelected ? { borderTop: `1.5px dashed ${colors.border}` } : undefined}
              >
                <div className="flex items-center gap-2 mb-2 justify-start text-left">
                  <p className="text-xs font-bold text-gray-500 text-left">
                    {(cat.label as Record<string, string>)[currentLanguage] ?? cat.label.en}
                  </p>
                  {isBadgeCategory && (fullFurniture || fullElectronics || fullOptionKitchen) && (
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <p className="text-[10px] text-orange-600 font-medium">
                        {getUIText("facBadgeGot", currentLanguage)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-x-3 gap-y-4 justify-items-center">
                  {selectedInCategory.map((opt) => {
                    const Icon = opt.icon;
                    const label = (opt.label as Record<string, string>)[currentLanguage] || opt.label.en;
                    const isPet = opt.id === "pet";
                    const isCleaning = opt.id === "cleaning";
                    return (
                      <div key={opt.id} className="flex flex-col items-center w-full min-w-0">
                        <div
                          className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border transition-all"
                          style={{
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }}
                        >
                          <Icon className="w-6 h-6 text-white shrink-0" />
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium leading-tight text-center mt-1.5 w-full break-words">
                          {label}
                        </span>
                        {isPet && property.petAllowed && (
                          <div className="w-full mt-1 text-center">
                            <p className="text-[10px]" style={{ color: colors.textSecondary }}>
                              {property.maxPets != null &&
                                `${getUIText("facMaxShort", currentLanguage)}${property.maxPets}${getUIText("petCountClassifier", currentLanguage)}`}
                              {property.petFee != null &&
                                ` · ${formatFullPrice(property.petFee, property.priceUnit ?? "vnd", curLabels)} (${getUIText("facEachPet", currentLanguage)})`}
                            </p>
                          </div>
                        )}
                        {isCleaning && property.cleaningPerWeek != null && (
                          <p className="text-[10px] mt-1 w-full text-center" style={{ color: colors.textSecondary }}>
                            {property.cleaningPerWeek}
                            {getUIText("facTimesPerWeek", currentLanguage)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px]" style={{ color: colors.textMuted }}>
          {getUIText("noAmenities", currentLanguage)}
        </p>
      )}
    </section>
  );
}
