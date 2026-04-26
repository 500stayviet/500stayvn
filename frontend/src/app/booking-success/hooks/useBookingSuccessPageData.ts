"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBooking, type BookingData } from "@/lib/api/bookings";
import {
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";

function loadFailMessage(lang: string): string {
  if (lang === "ko") {
    return "예약 정보를 불러오지 못했습니다. 목록에서 다시 확인해 주세요.";
  }
  if (lang === "vi") {
    return "Không tải được thông tin đặt phòng. Vui lòng kiểm tra lại trong mục đặt chỗ.";
  }
  return "Could not load booking details. Please check your bookings list.";
}

function missingIdMessage(lang: string): string {
  if (lang === "ko") return "예약 번호가 없습니다.";
  if (lang === "vi") return "Thiếu mã đặt phòng.";
  return "Missing booking reference.";
}

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
          message: missingIdMessage(lang),
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
            message: loadFailMessage(lang),
          });
          router.push("/");
        }
      } catch (error) {
        console.error("예약 로드 실패:", error);
        emitUserFacingSyncError({
          area: "bookings",
          action: "booking_success_load",
          message: loadFailMessage(languageRef.current),
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
    setCopied,
    formatDate,
    formatPrice,
  };
}

export type BookingSuccessPageData = ReturnType<typeof useBookingSuccessPageData>;
