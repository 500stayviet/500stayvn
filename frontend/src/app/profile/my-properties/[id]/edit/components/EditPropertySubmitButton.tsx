import { Loader2 } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface EditPropertySubmitButtonProps {
  currentLanguage: string;
  loading: boolean;
  isDeleted: boolean;
  primaryColor: string;
  textColor: string;
}

export default function EditPropertySubmitButton({
  currentLanguage,
  loading,
  isDeleted,
  primaryColor,
  textColor,
}: EditPropertySubmitButtonProps) {
  const lang = currentLanguage as SupportedLanguage;
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 px-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      style={{ backgroundColor: primaryColor, color: textColor }}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{getUIText("editSaving", lang)}</span>
        </>
      ) : isDeleted ? (
        getUIText("editRelistCta", lang)
      ) : (
        getUIText("editSubmitCta", lang)
      )}
    </button>
  );
}
