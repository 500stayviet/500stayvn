import { Sparkles } from "lucide-react";
import {
  FACILITY_OPTIONS,
  FACILITY_CATEGORIES,
  FULL_ELECTRONICS_IDS,
  FULL_FURNITURE_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from "@/lib/constants/facilities";

interface EditPropertyPolicySectionProps {
  currentLanguage: string;
  selectedAmenities: string[];
  maxPets: number;
  petFeeAmount: string;
  cleaningPerWeek: number;
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  setMaxPets: (value: number) => void;
  setPetFeeAmount: (value: string) => void;
  setCleaningPerWeek: (value: number) => void;
}

export default function EditPropertyPolicySection({
  currentLanguage,
  selectedAmenities,
  maxPets,
  petFeeAmount,
  cleaningPerWeek,
  setSelectedAmenities,
  setMaxPets,
  setPetFeeAmount,
  setCleaningPerWeek,
}: EditPropertyPolicySectionProps) {
  const getLocalizedLabel = (label: { en: string } & Record<string, string>) =>
    label[currentLanguage] || label.en;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {currentLanguage === "ko"
          ? "숙소시설 및 정책"
          : currentLanguage === "vi"
            ? "Tiện ích và chính sách"
            : "Facilities & Policy"}
      </label>
      <div className="space-y-4">
        {FACILITY_CATEGORIES.map((cat) => {
          const options = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
          const catLabel = getLocalizedLabel(cat.label);
          const isBadgeCategory =
            cat.id === "furniture" || cat.id === "electronics" || cat.id === "kitchen";
          const fullFurniture =
            cat.id === "furniture" &&
            FULL_FURNITURE_IDS.every((id) => selectedAmenities.includes(id));
          const fullElectronics =
            cat.id === "electronics" &&
            FULL_ELECTRONICS_IDS.every((id) => selectedAmenities.includes(id));
          const fullOptionKitchen =
            cat.id === "kitchen" &&
            FULL_OPTION_KITCHEN_IDS.every((id) => selectedAmenities.includes(id));

          return (
            <div key={cat.id}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-xs font-medium text-gray-500">{catLabel}</p>
                {isBadgeCategory && (
                  <p className="text-[10px] text-gray-500">
                    {currentLanguage === "ko"
                      ? "모든 아이콘 선택시 뱃지 획득"
                      : currentLanguage === "vi"
                        ? "Chọn đủ tất cả để nhận huy hiệu"
                        : "Select all to earn badge"}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedAmenities.includes(opt.id);
                  const label = getLocalizedLabel(opt.label);
                  const isPet = opt.id === "pet";
                  const isCleaning = opt.id === "cleaning";

                  return (
                    <div key={opt.id} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAmenities((prev) =>
                            prev.includes(opt.id)
                              ? prev.filter((x) => x !== opt.id)
                              : [...prev, opt.id],
                          )
                        }
                        className={`w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                        <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                      </button>

                      {isPet && isSelected && (
                        <div className="w-full space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-gray-600 shrink-0">
                              {currentLanguage === "ko"
                                ? "최대 마리수"
                                : currentLanguage === "vi"
                                  ? "Số con tối đa"
                                  : "Max pets"}
                            </span>
                            <select
                              value={maxPets}
                              onChange={(e) => setMaxPets(Number(e.target.value))}
                              className="flex-1 px-1 py-0.5 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-50/80 border border-blue-200">
                            <input
                              type="text"
                              value={
                                petFeeAmount
                                  ? parseInt(petFeeAmount.replace(/\D/g, ""), 10).toLocaleString()
                                  : ""
                              }
                              onChange={(e) => setPetFeeAmount(e.target.value.replace(/\D/g, ""))}
                              placeholder="0"
                              className="w-14 px-1.5 py-0.5 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[9px] text-gray-600 font-medium shrink-0">VND</span>
                          </div>
                        </div>
                      )}

                      {isCleaning && isSelected && (
                        <div className="w-full">
                          <select
                            value={cleaningPerWeek}
                            onChange={(e) => setCleaningPerWeek(Number(e.target.value))}
                            className="w-full px-1.5 py-0.5 text-[10px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                              <option key={n} value={n}>
                                {n}
                                {currentLanguage === "ko" ? "회" : currentLanguage === "vi" ? " lần" : "x"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

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
    </div>
  );
}
