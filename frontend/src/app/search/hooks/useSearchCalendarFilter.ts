import { useCallback, useState } from "react";

type CalendarMode = "checkin" | "checkout";

export const useSearchCalendarFilter = (currentLanguage: string) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("checkin");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  const handleCheckInSelect = useCallback((date: Date) => {
    setCheckInDate(date);
    setCheckOutDate(null);
    setCalendarMode("checkout");
    setShowCalendar(true);
  }, []);

  const handleCheckOutSelect = useCallback((date: Date) => {
    setCheckOutDate(date);
    setShowCalendar(false);
  }, []);

  const openCalendar = useCallback((mode: CalendarMode) => {
    setCalendarMode(mode);
    setShowCalendar(true);
  }, []);

  const closeCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);

  const resetCalendarDates = useCallback(() => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setCalendarMode("checkin");
  }, []);

  const formatDate = useCallback(
    (date: Date | null): string => {
      if (!date) return "";
      const locale =
        currentLanguage === "ko"
          ? "ko-KR"
          : currentLanguage === "vi"
            ? "vi-VN"
            : currentLanguage === "ja"
              ? "ja-JP"
              : currentLanguage === "zh"
                ? "zh-CN"
                : "en-US";
      return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
    },
    [currentLanguage],
  );

  return {
    showCalendar,
    calendarMode,
    checkInDate,
    checkOutDate,
    setCheckInDate,
    setCheckOutDate,
    openCalendar,
    closeCalendar,
    handleCheckInSelect,
    handleCheckOutSelect,
    resetCalendarDates,
    formatDate,
  };
};
