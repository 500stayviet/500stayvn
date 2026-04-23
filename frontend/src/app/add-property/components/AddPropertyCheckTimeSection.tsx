"use client";

import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyCheckTimeSectionProps {
  currentLanguage: string;
  colors: AddPropertyColors;
  checkInTime: string;
  checkOutTime: string;
  onCheckInTimeChange: (value: string) => void;
  onCheckOutTimeChange: (value: string) => void;
}

export function AddPropertyCheckTimeSection({
  currentLanguage,
  colors,
  checkInTime,
  checkOutTime,
  onCheckInTimeChange,
  onCheckOutTimeChange,
}: AddPropertyCheckTimeSectionProps) {
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        backgroundColor: colors.surface,
        border: `1.5px dashed ${colors.border}`,
      }}
    >
      <h2 className="text-sm font-bold mb-4" style={{ color: colors.text }}>
        {currentLanguage === "ko"
          ? "체크인/체크아웃 시간"
          : currentLanguage === "vi"
            ? "Giờ check-in/check-out"
            : currentLanguage === "ja"
              ? "チェックイン/チェックアウト時間"
              : currentLanguage === "zh"
                ? "入住/退房时间"
                : "Check-in/Check-out Time"}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: colors.textSecondary }}
          >
            {currentLanguage === "ko" ? "체크인" : "Check-in"}
          </label>
          <select
            value={checkInTime}
            onChange={(e) => onCheckInTimeChange(e.target.value)}
            className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: colors.textSecondary }}
          >
            {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
          </label>
          <select
            value={checkOutTime}
            onChange={(e) => onCheckOutTimeChange(e.target.value)}
            className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
