"use client";

import { Calendar } from "lucide-react";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyRentalSectionProps {
  currentLanguage: string;
  colors: AddPropertyColors;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  weeklyRent: string;
  onOpenCheckInCalendar: () => void;
  onOpenCheckOutCalendar: () => void;
  onWeeklyRentChange: (value: string) => void;
}

const formatDateDisplay = (
  value: Date | null,
  currentLanguage: string,
): string => {
  const emptyLabel =
    currentLanguage === "ko"
      ? "날짜 선택"
      : currentLanguage === "vi"
        ? "Chọn ngày"
        : "Select date";
  if (!value || Number.isNaN(value.getTime())) {
    return emptyLabel;
  }
  return value.toLocaleDateString(
    currentLanguage === "ko"
      ? "ko-KR"
      : currentLanguage === "vi"
        ? "vi-VN"
        : "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
};

export function AddPropertyRentalSection({
  currentLanguage,
  colors,
  checkInDate,
  checkOutDate,
  weeklyRent,
  onOpenCheckInCalendar,
  onOpenCheckOutCalendar,
  onWeeklyRentChange,
}: AddPropertyRentalSectionProps) {
  return (
    <>
      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: colors.text }}>
          {currentLanguage === "ko"
            ? "임대 희망 날짜"
            : currentLanguage === "vi"
              ? "Ngày cho thuê mong muốn"
              : currentLanguage === "ja"
                ? "賃貸希望日"
                : currentLanguage === "zh"
                  ? "租赁希望日期"
                  : "Desired Rental Dates"}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenCheckInCalendar}
            className="flex items-center px-3 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">
                  {currentLanguage === "ko"
                    ? "시작일"
                    : currentLanguage === "vi"
                      ? "Ngày bắt đầu"
                      : "Start Date"}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDateDisplay(checkInDate, currentLanguage)}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCheckOutCalendar}
            className="flex items-center px-3 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">
                  {currentLanguage === "ko"
                    ? "종료일"
                    : currentLanguage === "vi"
                      ? "Ngày kết thúc"
                      : "End Date"}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDateDisplay(checkOutDate, currentLanguage)}
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-1" style={{ color: colors.text }}>
          {currentLanguage === "ko"
            ? "1주일 임대료"
            : currentLanguage === "vi"
              ? "Giá thuê 1 tuần"
              : currentLanguage === "ja"
                ? "1週間賃貸料"
                : currentLanguage === "zh"
                  ? "1周租金"
                  : "Weekly Rent"}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <p className="text-[11px] mb-3" style={{ color: colors.textSecondary }}>
          {currentLanguage === "ko"
            ? "공과금/관리비 포함"
            : currentLanguage === "vi"
              ? "Bao gồm phí dịch vụ/quản lý"
              : "Utilities/Management fees included"}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={
              weeklyRent
                ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString()
                : ""
            }
            onChange={(e) => onWeeklyRentChange(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 px-3 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
            }}
            required
          />
          <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            VND
          </span>
        </div>
      </section>
    </>
  );
}
