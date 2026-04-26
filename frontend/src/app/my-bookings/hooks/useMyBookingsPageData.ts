"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getGuestBookings,
  type BookingData,
} from "@/lib/api/bookings";
import {
  refreshChatUnreadSnapshot,
  subscribeChatUnreadUpdates,
} from "@/lib/api/chat";

/**
 * 게스트 내 예약 — 목록·탭·모달·읽지 않음 데이터 레이어.
 */
export function useMyBookingsPageData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<BookingData | null>(null);
  const [cancelAgreed, setCancelCancelAgreed] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<BookingData | null>(null);

  const tabParam = searchParams.get("tab");
  const initialFilter =
    tabParam === "active" || tabParam === "closed"
      ? tabParam
      : tabParam === "pending" || tabParam === "confirmed"
        ? "active"
        : tabParam === "cancelled"
          ? "closed"
          : "active";
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
    if (newTab === "active" || newTab === "closed") setFilter(newTab);
    else if (newTab === "pending" || newTab === "confirmed") setFilter("active");
    else if (newTab === "cancelled") setFilter("closed");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?returnUrl=" + encodeURIComponent("/my-bookings"));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await getGuestBookings(user.uid);
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
          dataWithChatRooms.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          ),
        );
      } catch (error) {
        console.error(error);
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
      setTotalUnreadChatCount(snap.asGuest);
      setUnreadCounts(snap.byRoom);
    };
    void loadUnreadCounts();
    const unsub = subscribeChatUnreadUpdates(user.uid, (snapshot) => {
      if (snapshot) {
        setTotalUnreadChatCount(snapshot.asGuest);
        setUnreadCounts(snapshot.byRoom);
        return;
      }
      void loadUnreadCounts();
    });
    return () => unsub();
  }, [user, bookings]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();
  const formatPrice = (p: number, u: string) =>
    u === "vnd" ? `${p.toLocaleString()} VND` : `$${p.toLocaleString()}`;

  const activeBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const activeBookingsSorted = [...activeBookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });
  const closedBookings = bookings.filter(
    (b) => b.status === "cancelled" || b.status === "completed",
  );
  const filteredBookings =
    filter === "active" ? activeBookingsSorted : closedBookings;

  return {
    router,
    user,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    bookings,
    setBookings,
    unreadCounts,
    totalUnreadChatCount,
    cancellingId,
    setCancellingId,
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

export type MyBookingsPageData = ReturnType<typeof useMyBookingsPageData>;
