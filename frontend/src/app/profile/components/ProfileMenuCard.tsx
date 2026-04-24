"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface ProfileMenuCardProps {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  containerClassName: string;
}

export default function ProfileMenuCard({
  onClick,
  icon,
  title,
  description,
  containerClassName,
}: ProfileMenuCardProps) {
  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full rounded-xl py-3 px-4 transition-all cursor-pointer hover:shadow flex items-center justify-between ${containerClassName}`}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg">{icon}</div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
