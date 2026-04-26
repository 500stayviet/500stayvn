"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toISODateString } from "@/lib/api/bookings";
import { getBookedRangesForProperty } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";

/**
 * 임차인 매물 상세: 예약 가능 구간 로드(서버·iCal), 체크인/아웃·인원·애완, 캘린더 UI state, `/booking` 이동.
 */
export function usePropertyDetailBooking(property: PropertyData) {
  const router = useRouter();
  const { user } = useAuth();
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"checkin" | "checkout">("checkin");
  const [selectedGuests, setSelectedGuests] = useState(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const [addPetSelected, setAddPetSelected] = useState(false);
  const [selectedPetCount, setSelectedPetCount] = useState(1);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petDropdownRef = useRef<HTMLDivElement>(null);

  const maxGuests = Math.max(1, (property?.maxAdults ?? 0) + (property?.maxChildren ?? 0));
  const maxPets = Math.max(1, property?.maxPets ?? 1);
  const petAllowed = !!(property?.petAllowed && (property?.petFee ?? 0) > 0);

  useEffect(() => {
    const max = Math.max(1, (property?.maxAdults ?? 0) + (property?.maxChildren ?? 0));
    setSelectedGuests((prev) => (prev > max ? max : prev));
  }, [property?.maxAdults, property?.maxChildren]);

  useEffect(() => {
    const max = Math.max(1, property?.maxPets ?? 1);
    setSelectedPetCount((prev) => (prev > max ? max : prev));
  }, [property?.maxPets]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(e.target as Node)) {
        setShowGuestDropdown(false);
      }
      if (petDropdownRef.current && !petDropdownRef.current.contains(e.target as Node)) {
        setShowPetDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadBookedRanges = async () => {
      if (!property?.id) {
        setBookedRanges([]);
        return;
      }
      try {
        let ranges = await getBookedRangesForProperty(property.id);
        if (property.icalUrl && property.icalUrl.trim()) {
          const res = await fetch("/api/ical/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: property.icalUrl.trim() }),
          });
          if (res.ok) {
            const { events } = await res.json();
            const icalRanges = (events || []).map(
              (ev: { start: string; end: string }) => ({
                checkIn: new Date(ev.start),
                checkOut: new Date(ev.end),
              }),
            );
            ranges = [...ranges, ...icalRanges];
          }
        }
        setBookedRanges(ranges);
      } catch {
        setBookedRanges([]);
      }
    };
    void loadBookedRanges();
  }, [property?.id, property?.icalUrl]);

  const bookNow = useCallback(() => {
    if (!checkInDate || !checkOutDate || !property.id) return;
    const pets = addPetSelected ? selectedPetCount : 0;
    const query = `propertyId=${property.id}&checkIn=${toISODateString(checkInDate)}&checkOut=${toISODateString(checkOutDate)}&guests=${selectedGuests}&pets=${pets}`;
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/booking?${query}`)}`);
      return;
    }
    router.push(`/booking?${query}`);
  }, [
    addPetSelected,
    checkInDate,
    checkOutDate,
    property.id,
    selectedGuests,
    selectedPetCount,
    router,
    user,
  ]);

  return {
    bookedRanges,
    checkInDate,
    setCheckInDate,
    checkOutDate,
    setCheckOutDate,
    showCalendar,
    setShowCalendar,
    calendarMode,
    setCalendarMode,
    selectedGuests,
    setSelectedGuests,
    showGuestDropdown,
    setShowGuestDropdown,
    guestDropdownRef,
    addPetSelected,
    setAddPetSelected,
    selectedPetCount,
    setSelectedPetCount,
    showPetDropdown,
    setShowPetDropdown,
    petDropdownRef,
    maxGuests,
    maxPets,
    petAllowed,
    bookNow,
  };
}

export type PropertyDetailBookingVm = ReturnType<typeof usePropertyDetailBooking>;
