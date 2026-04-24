import { ArrowLeft } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface EditPropertyHeaderProps {
  currentLanguage: SupportedLanguage;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  onBack: () => void;
}

export default function EditPropertyHeader({
  currentLanguage,
  textColor,
  textSecondaryColor,
  borderColor,
  onBack,
}: EditPropertyHeaderProps) {
  return (
    <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
      <button onClick={onBack} className="flex items-center gap-2 mb-2 text-gray-600">
        <ArrowLeft size={20} /> {getUIText("back", currentLanguage)}
      </button>
      <h1 className="text-xl font-bold" style={{ color: textColor }}>
        {currentLanguage === "ko"
          ? "매물 수정"
          : currentLanguage === "zh"
            ? "编辑房产"
            : currentLanguage === "vi"
              ? "Chỉnh sửa bất động sản"
              : currentLanguage === "ja"
                ? "物件編集"
                : "Edit Property"}
      </h1>
      <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
        {currentLanguage === "ko"
          ? "매물 정보를 수정해주세요"
          : currentLanguage === "vi"
            ? "Vui lòng chỉnh sửa thông tin bất động sản"
            : "Please edit property information"}
      </p>
    </div>
  );
}
