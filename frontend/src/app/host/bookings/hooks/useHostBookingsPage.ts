"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getOwnerBookings,
  type BookingData,
  confirmBooking,
  cancelBooking,
  deleteBooking,
} from "@/lib/api/bookings";
import {
  refreshChatUnreadSnapshot,
  subscribeChatUnreadUpdates,
} from "@/lib/api/chat";

/**
 * 임대인 예약 관리: 목록·읽지 않음·승인·채팅·거절·삭제·취소 모달 상태를 묶는다.
 */
export function useHostBookingsPage() {
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
        console.error("예약 로드 실패:", error);
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
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };
  const formatPrice = (price: number, unit: string) => {
    return unit === "vnd"
      ? `${price.toLocaleString("vi-VN")} VND`
      : `$${price.toLocaleString()}`;
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const { recalculateAndSplitProperty } =
          await import("@/lib/api/properties");
        await recalculateAndSplitProperty(booking.propertyId, bookingId);
        if (!booking.chatRoomId) {
          const { createChatRoom } = await import("@/lib/api/chat");
          const room = await createChatRoom({
            bookingId: booking.id!,
            propertyId: booking.propertyId,
            propertyTitle: booking.propertyTitle,
            propertyImage: booking.propertyImage,
            ownerId: booking.ownerId,
            ownerName: booking.ownerName,
            guestId: booking.guestId,
            guestName: booking.guestName,
          });
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId
                ? { ...b, status: "confirmed", chatRoomId: room.id }
                : b,
            ),
          );
        } else {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId ? { ...b, status: "confirmed" } : b,
            ),
          );
        }
      }
    } catch {
      alert(
        currentLanguage === "ko"
          ? "예약 확정에 실패했습니다."
          : "Xác nhận thất bại.",
      );
    }
  };

  const handleChat = async (booking: BookingData) => {
    if (booking.chatRoomId) {
      setActiveChatRoomId(booking.chatRoomId);
      return;
    }
    try {
      const { createChatRoom } = await import("@/lib/api/chat");
      const room = await createChatRoom({
        bookingId: booking.id!,
        propertyId: booking.propertyId,
        propertyTitle: booking.propertyTitle,
        propertyImage: booking.propertyImage,
        ownerId: booking.ownerId,
        ownerName: booking.ownerName,
        guestId: booking.guestId,
        guestName: booking.guestName,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, chatRoomId: room.id } : b,
        ),
      );
      setActiveChatRoomId(room.id);
    } catch {
      alert(
        currentLanguage === "ko"
          ? "채팅방을 열 수 없습니다."
          : "Không thể mở phòng chat.",
      );
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!cancelAgreed) {
      alert(
        currentLanguage === "ko"
          ? "취소 정책에 동의해주세요."
          : "Vui lòng đồng ý với chính sách hủy.",
      );
      return;
    }
    try {
      const { relistResult } = await cancelBooking(
        bookingId,
        "임대인이 거절/취소함",
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      if (relistResult) {
        alert(
          currentLanguage === "ko"
            ? "매물 상태가 업데이트되었습니다."
            : "Status updated.",
        );
        router.push(`/profile/my-properties`);
      }
      setShowCancelModal(false);
    } catch {
      alert("실패");
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch {
      alert("실패");
    }
  };

  const openCancelModal = (booking: BookingData) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  return {
    router,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    unreadCounts,
    showCancelModal,
    selectedBookingForCancel,
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
    openCancelModal,
    closeCancelModal,
    handleConfirm,
    handleChat,
    handleReject,
    handleDelete,
  };
}

export type HostBookingsPageViewModel = ReturnType<typeof useHostBookingsPage>;
