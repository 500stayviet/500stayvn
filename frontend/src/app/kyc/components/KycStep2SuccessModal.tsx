"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface KycStep2SuccessModalProps {
  currentLanguage: string;
  onClose: () => void;
}

export default function KycStep2SuccessModal({
  currentLanguage,
  onClose,
}: KycStep2SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {currentLanguage === "ko"
            ? "2단계 인증 완료"
            : currentLanguage === "vi"
              ? "Hoan thanh buoc 2"
              : currentLanguage === "ja"
                ? "2段階認証完了"
                : currentLanguage === "zh"
                  ? "第2阶段认证完成"
                  : "Step 2 Verification Complete"}
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {currentLanguage === "ko"
            ? "신분증 정보가 안전하게 접수되었습니다. 이제 3단계 얼굴 인증을 진행해주세요."
            : currentLanguage === "vi"
              ? "Thong tin giay to da duoc tiep nhan an toan. Hay tiep tuc buoc 3 xac thuc khuon mat."
              : currentLanguage === "ja"
                ? "身分証情報が安全に受理されました。続けて3段階の顔認証を進めてください。"
                : currentLanguage === "zh"
                  ? "证件信息已安全接收。请继续进行第3阶段的人脸认证。"
                  : "Your ID information has been received safely. Please continue to step 3 face verification."}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold"
        >
          {currentLanguage === "ko"
            ? "확인"
            : currentLanguage === "vi"
              ? "Xac nhan"
              : currentLanguage === "ja"
                ? "確認"
                : currentLanguage === "zh"
                  ? "确认"
                  : "Confirm"}
        </button>
      </motion.div>
    </div>
  );
}
