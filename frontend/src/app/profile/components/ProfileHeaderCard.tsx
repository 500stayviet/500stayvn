"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";

interface ProfileHeaderCardProps {
  currentLanguage: SupportedLanguage;
  displayName?: string | null;
  email?: string | null;
  fallbackEmail?: string | null;
  photoURL?: string | null;
  onClick: () => void;
}

export default function ProfileHeaderCard({
  currentLanguage,
  displayName,
  email,
  fallbackEmail,
  photoURL,
  onClick,
}: ProfileHeaderCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 shadow-md rounded-none ring-2 ring-transparent hover:ring-white/50 focus:ring-white/50 focus:outline-none transition-all"
      whileTap={{ scale: 0.98 }}
      whileHover={{ backgroundColor: "rgb(37 99 235)" }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-white mb-0.5">
            {getUIText("myPage", currentLanguage)}
          </h1>
          <p className="text-xs font-medium text-white truncate">
            {displayName || fallbackEmail?.split("@")[0] || "—"}
          </p>
          <p className="text-[11px] text-white/80 truncate mt-0.5">
            {email || fallbackEmail || "—"}
          </p>
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden ring-1 ring-white/30">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
