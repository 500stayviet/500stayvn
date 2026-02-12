"use client";

import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";

interface MenuCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  onClick: () => void;
  disabled?: boolean;
  index?: number;
}

export default function MenuCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  onClick,
  disabled = false,
  index = 0,
}: MenuCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full"
    >
      <div
        className={`${bgColor} rounded-xl p-4 flex items-center justify-between border border-opacity-10 transition-all hover:shadow-md active:scale-95 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </motion.button>
  );
}
