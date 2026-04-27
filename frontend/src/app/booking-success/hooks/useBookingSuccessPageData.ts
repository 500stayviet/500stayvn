"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBooking, type BookingData } from "@/lib/api/bookings";
import {
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import {
  getDateLocaleForLanguage,
  getUIText,
} from "@/utils/i18n";

/**
 * 예약 완료 화면: 쿼리·예약 로드·모달 플래그·포맷 유틸.
 */
export function useBookingSuccessPageData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const languageRef = useRef(currentLanguage);
  languageRef.current = currentLanguage;

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowSuccessModal(true);
    } else {
      setShowSuccessModal(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadBooking = async () => {
      const lang = languageRef.current;
      if (!bookingId) {
        emitUserFacingSyncError({
          area: "bookings",
          action: "booking_success_missing_id",
          message: getUIText("bookingSuccessBookingIdMissing", lang),
        });
        router.push("/");
        return;
      }

      try {
        const data = await getBooking(bookingId);
        if (data) {
          setBooking(data);
        } else {
          emitUserFacingSyncError({
            area: "bookings",
            action: "booking_success_load",
            message: getUIText("bookingSuccessLoadFailed", lang),
          });
          router.push("/");
        }
      } catch (error) {
        console.error("Booking load failed:", error);
        emitUserFacingSyncError({
          area: "bookings",
          action: "booking_success_load",
          message: getUIText("bookingSuccessLoadFailed", languageRef.current),
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [bookingId, router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getDateLocaleForLanguage(currentLanguage), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === "vnd") {
      const n = price.toLocaleString(getDateLocaleForLanguage(currentLanguage));
      return `${n} ${getUIText("priceUnitVndSuffix", currentLanguage)}`;
    }
    return `$${price.toLocaleString(getDateLocaleForLanguage(currentLanguage))}`;
  };

  return {
    router,
    user,
    currentLanguage,
    setCurrentLanguage,
    booking,
    loading,
    showSuccessModal,
    setShowSuccessModal,
    activeChatRoomId,
    setActiveChatRoomId,
    copied,
    setCopied,
    formatDate,
    formatPrice,
  };
}

export type BookingSuccessPageData = ReturnType<typeof useBookingSuccessPageData>;
