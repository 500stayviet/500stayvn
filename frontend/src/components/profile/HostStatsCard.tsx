"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  index?: number;
}

export default function HostStatsCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${bgColor} rounded-xl p-4 border border-opacity-20`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}
