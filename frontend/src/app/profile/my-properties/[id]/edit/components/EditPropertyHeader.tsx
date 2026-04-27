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
        {getUIText("editFormTitle", currentLanguage)}
      </h1>
      <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
        {getUIText("editFormSubtitle", currentLanguage)}
      </p>
    </div>
  );
}
