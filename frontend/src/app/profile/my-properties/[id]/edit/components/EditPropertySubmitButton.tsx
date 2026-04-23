import { Loader2 } from "lucide-react";

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
          <span>
            {currentLanguage === "ko"
              ? "수정 중..."
              : currentLanguage === "vi"
                ? "Đang chỉnh sửa..."
                : "Updating..."}
          </span>
        </>
      ) : isDeleted ? (
        currentLanguage === "ko" ? "재등록" : currentLanguage === "zh" ? "重新注册" : currentLanguage === "vi" ? "Đăng ký lại" : currentLanguage === "ja" ? "再登録" : "Re-register"
      ) : currentLanguage === "ko" ? (
        "매물 수정"
      ) : currentLanguage === "zh" ? (
        "编辑房产"
      ) : currentLanguage === "vi" ? (
        "Chỉnh sửa bất động sản"
      ) : currentLanguage === "ja" ? (
        "物件編集"
      ) : (
        "Update Property"
      )}
    </button>
  );
}
