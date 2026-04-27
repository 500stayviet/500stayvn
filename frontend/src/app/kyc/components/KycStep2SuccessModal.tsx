"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface KycStep2SuccessModalProps {
  currentLanguage: SupportedLanguage;
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
          {getUIText("kycStep2CompleteTitle", currentLanguage)}
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {getUIText("kycStep2CompleteBody", currentLanguage)}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold"
        >
          {getUIText("confirm", currentLanguage)}
        </button>
      </motion.div>
    </div>
  );
}
