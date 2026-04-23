"use client";

import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyBasicInfoSectionProps {
  currentLanguage: SupportedLanguage;
  colors: AddPropertyColors;
  title: string;
  propertyDescription: string;
  onTitleChange: (value: string) => void;
  onPropertyDescriptionChange: (value: string) => void;
}

export function AddPropertyBasicInfoSection({
  currentLanguage,
  colors,
  title,
  propertyDescription,
  onTitleChange,
  onPropertyDescriptionChange,
}: AddPropertyBasicInfoSectionProps) {
  return (
    <>
      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: colors.text }}>
          {getUIText("title", currentLanguage)}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={getUIText("titlePlaceholder", currentLanguage)}
          className="w-full px-3 py-2.5 rounded-lg text-sm min-h-[40px] focus:outline-none transition-all"
          style={{
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
          }}
          required
        />
      </section>

      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: colors.text }}>
          {currentLanguage === "ko"
            ? "매물 설명"
            : currentLanguage === "vi"
              ? "Mô tả bất động sản"
              : "Property Description"}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <textarea
          value={propertyDescription}
          onChange={(e) => onPropertyDescriptionChange(e.target.value)}
          placeholder={
            currentLanguage === "ko"
              ? "매물에 대한 상세 설명을 입력해주세요..."
              : currentLanguage === "vi"
                ? "Nhập mô tả chi tiết về bất động sản..."
                : "Enter detailed description..."
          }
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg resize-none text-sm min-h-[100px] focus:outline-none transition-all"
          style={{
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
          }}
          required
        />
        <p className="text-[10px] mt-2 flex items-start gap-1" style={{ color: colors.success }}>
          <span>i</span>
          <span>
            {currentLanguage === "ko"
              ? "베트남어로 입력해주세요. 자동 번역 기능이 제공됩니다."
              : currentLanguage === "vi"
                ? "Vui lòng nhập bằng tiếng Việt. Tính năng dịch tự động sẽ được cung cấp."
                : "Please enter in Vietnamese. Automatic translation will be provided."}
          </span>
        </p>
      </section>
    </>
  );
}
