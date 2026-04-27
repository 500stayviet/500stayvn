"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getOwnerBookings,
  type BookingData,
} from "@/lib/api/bookings";
import {
  refreshChatUnreadSnapshot,
  subscribeChatUnreadUpdates,
} from "@/lib/api/chat";
import { getDateLocaleForLanguage, getUIText } from "@/utils/i18n";

/**
 * 임대인 예약 관리 — 목록·탭·모달·채팅 읽지 않음 등 데이터 레이어.
 */
export function useHostBookingsPageData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<BookingData | null>(null);
  const [cancelAgreed, setCancelCancelAgreed] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<BookingData | null>(null);

  const tabParam = searchParams.get("tab");
  const initialFilter =
    tabParam === "active" || tabParam === "closed" ? tabParam : "active";
  const [filter, setFilter] = useState<"active" | "closed">(initialFilter);
  const [bookingsReloadTick, setBookingsReloadTick] = useState(0);

  useEffect(() => {
    const bump = () => {
      if (document.visibilityState === "visible") {
        setBookingsReloadTick((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    return () => {
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  useEffect(() => {
    const newTab = searchParams.get("tab");
    if (newTab === "active" || newTab === "closed") {
      setFilter(newTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?returnUrl=" + encodeURIComponent("/host/bookings"));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await getOwnerBookings(user.uid);
        const dataWithChatRooms = await Promise.all(
          data.map(async (booking) => {
            if (!booking.chatRoomId) {
              const { getChatRoomByBookingId } = await import("@/lib/api/chat");
              const room = await getChatRoomByBookingId(booking.id!);
              if (room) return { ...booking, chatRoomId: room.id };
            }
            return booking;
          }),
        );
        setBookings(
          dataWithChatRooms.sort((a, b) => {
            if (a.status === "pending" && b.status !== "pending") return -1;
            if (a.status !== "pending" && b.status === "pending") return 1;
            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          }),
        );
      } catch (error) {
        console.error("Host bookings load failed:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) void loadBookings();
  }, [user, bookingsReloadTick]);

  useEffect(() => {
    if (!user || bookings.length === 0) return;
    const roomIds = bookings.map((b) => b.chatRoomId || "").filter(Boolean);
    const loadUnreadCounts = async () => {
      const snap = await refreshChatUnreadSnapshot(user.uid, roomIds);
      setUnreadCounts(snap.byRoom);
    };
    void loadUnreadCounts();
    const unsub = subscribeChatUnreadUpdates(user.uid, (snapshot) => {
      if (snapshot) {
        setUnreadCounts(snapshot.byRoom);
        return;
      }
      void loadUnreadCounts();
    });
    return () => unsub();
  }, [user, bookings]);

  const activeBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );

  const closedBookings = bookings.filter((b) => b.status === "cancelled");

  const filteredBookings = filter === "active" ? activeBookings : closedBookings;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(getDateLocaleForLanguage(currentLanguage), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getDateLocaleForLanguage(currentLanguage), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };
  const formatPrice = (price: number, unit: string) => {
    const loc = getDateLocaleForLanguage(currentLanguage);
    if (unit === "vnd") {
      return `${price.toLocaleString(loc)} ${getUIText("priceUnitVndSuffix", currentLanguage)}`;
    }
    return `$${price.toLocaleString(loc)}`;
  };

  return {
    router,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    user,
    bookings,
    setBookings,
    unreadCounts,
    showCancelModal,
    setShowCancelModal,
    selectedBookingForCancel,
    setSelectedBookingForCancel,
    cancelAgreed,
    setCancelCancelAgreed,
    activeChatRoomId,
    setActiveChatRoomId,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
    filter,
    setFilter,
    activeBookings,
    closedBookings,
    filteredBookings,
    formatDateTime,
    formatDate,
    formatPrice,
  };
}

export type HostBookingsPageData = ReturnType<typeof useHostBookingsPageData>;
