"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBooking, type BookingData } from "@/lib/api/bookings";

/**
 * 예약 완료 화면: 쿼리·예약 로드, 복사/포맷 유틸.
 */
export function useBookingSuccessPage() {
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

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowSuccessModal(true);
    } else {
      setShowSuccessModal(false);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        router.push("/");
        return;
      }

      try {
        const data = await getBooking(bookingId);
        if (data) {
          setBooking(data);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("예약 로드 실패:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      currentLanguage === "ko"
        ? "ko-KR"
        : currentLanguage === "vi"
          ? "vi-VN"
          : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === "vnd") {
      return `${price.toLocaleString("vi-VN")} VND`;
    }
    return `$${price.toLocaleString()}`;
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
    copyToClipboard,
    formatDate,
    formatPrice,
  };
}

export type BookingSuccessPageViewModel = ReturnType<typeof useBookingSuccessPage>;
