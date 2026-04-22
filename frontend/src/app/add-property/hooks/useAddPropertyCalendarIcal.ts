import { useCallback, useState } from "react";

type CalendarMode = "checkin" | "checkout";

export const useAddPropertyCalendarIcal = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("checkin");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  const [icalPlatform, setIcalPlatform] = useState<string>("");
  const [icalCalendarName, setIcalCalendarName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [showIcalDropdown, setShowIcalDropdown] = useState(false);

  const openCheckInCalendar = useCallback(() => {
    setCalendarMode("checkin");
    setShowCalendar(true);
  }, []);

  const openCheckOutCalendar = useCallback(() => {
    setCalendarMode("checkout");
    setShowCalendar(true);
  }, []);

  const closeCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);

  const onCheckInSelect = useCallback((date: Date) => {
    setCheckInDate(date);
    setCheckOutDate(null);
    setCalendarMode("checkout");
    setShowCalendar(true);
  }, []);

  const onCheckOutSelect = useCallback((date: Date) => {
    setCheckOutDate(date);
    setShowCalendar(false);
  }, []);

  const onCheckInReset = useCallback(() => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setCalendarMode("checkin");
  }, []);

  const toggleIcalDropdown = useCallback(() => {
    setShowIcalDropdown((prev) => !prev);
  }, []);

  return {
    showCalendar,
    calendarMode,
    checkInDate,
    checkOutDate,
    icalPlatform,
    icalCalendarName,
    icalUrl,
    showIcalDropdown,
    setIcalPlatform,
    setIcalCalendarName,
    setIcalUrl,
    setShowIcalDropdown,
    openCheckInCalendar,
    openCheckOutCalendar,
    closeCalendar,
    onCheckInSelect,
    onCheckOutSelect,
    onCheckInReset,
    toggleIcalDropdown,
  };
};
