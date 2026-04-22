import { useCallback, useState } from "react";
import { LISTING_MIN_STAY_DAYS } from "@/lib/constants/listingCalendar";

type CalendarMode = "checkin" | "checkout";

interface UseEditPropertyCalendarRulesParams {
  needsRentalCalendarAck: boolean;
  extensionMaxDate: Date;
}

const stripTime = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const useEditPropertyCalendarRules = ({
  needsRentalCalendarAck,
  extensionMaxDate,
}: UseEditPropertyCalendarRulesParams) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [rentalCalendarAcknowledged, setRentalCalendarAcknowledged] =
    useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("checkin");
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  const isValidRentalDates = useCallback(
    (checkIn: Date | null, checkOut: Date | null) => {
      if (!checkIn || !checkOut) return false;

      const inDay = stripTime(checkIn);
      const outDay = stripTime(checkOut);
      if (!(outDay.getTime() > inDay.getTime())) return false;

      const diffDays = Math.round(
        (outDay.getTime() - inDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays < LISTING_MIN_STAY_DAYS) return false;
      if (diffDays % LISTING_MIN_STAY_DAYS !== 0) return false;

      const today = stripTime(new Date());
      if (inDay.getTime() < today.getTime()) return false;

      const maxDay = stripTime(extensionMaxDate);
      if (outDay.getTime() > maxDay.getTime()) return false;

      return true;
    },
    [extensionMaxDate],
  );

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

  const onCheckInSelect = useCallback(
    (d: Date) => {
      if (needsRentalCalendarAck) setRentalCalendarAcknowledged(false);
      setCheckInDate(d);
      setCheckOutDate(null);
      setCalendarMode("checkout");
    },
    [needsRentalCalendarAck],
  );

  const onCheckOutSelect = useCallback(
    (d: Date) => {
      setCheckOutDate(d);
      if (needsRentalCalendarAck) {
        const valid = isValidRentalDates(checkInDate, d);
        setRentalCalendarAcknowledged(valid);
      }
      setShowCalendar(false);
    },
    [checkInDate, isValidRentalDates, needsRentalCalendarAck],
  );

  const onCheckInReset = useCallback(() => {
    setCheckInDate(null);
    setCheckOutDate(null);
    if (needsRentalCalendarAck) setRentalCalendarAcknowledged(false);
    setCalendarMode("checkin");
  }, [needsRentalCalendarAck]);

  return {
    showCalendar,
    rentalCalendarAcknowledged,
    calendarMode,
    checkInDate,
    checkOutDate,
    setCheckInDate,
    setCheckOutDate,
    openCheckInCalendar,
    openCheckOutCalendar,
    closeCalendar,
    onCheckInSelect,
    onCheckOutSelect,
    onCheckInReset,
  };
};
