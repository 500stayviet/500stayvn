"use client";

import { useCallback } from "react";
import {
  confirmBooking,
  cancelBooking,
  deleteBooking,
  type BookingData,
} from "@/lib/api/bookings";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { HostBookingsPageData } from "./useHostBookingsPageData";

export function useHostBookingsPageActions(data: HostBookingsPageData) {
  const {
    router,
    currentLanguage,
    bookings,
    setBookings,
    setShowCancelModal,
    setSelectedBookingForCancel,
    cancelAgreed,
    setCancelCancelAgreed,
    setActiveChatRoomId,
  } = data;

  const openCancelModal = useCallback((booking: BookingData) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
  }, [setSelectedBookingForCancel, setShowCancelModal]);

  const closeCancelModal = useCallback(() => {
    setShowCancelModal(false);
  }, [setShowCancelModal]);

  const handleConfirm = useCallback(
    async (bookingId: string) => {
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
        emitUserFacingAppToast({
          tone: "success",
          area: "bookings",
          action: "host_confirm",
          message:
            currentLanguage === "ko"
              ? "예약이 확정되었습니다."
              : currentLanguage === "vi"
                ? "Đã xác nhận đặt phòng."
                : "Booking confirmed.",
        });
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_confirm",
          message:
            currentLanguage === "ko"
              ? "예약 확정에 실패했습니다."
              : currentLanguage === "vi"
                ? "Xác nhận thất bại."
                : "Could not confirm the booking.",
        });
      }
    },
    [bookings, currentLanguage, setBookings],
  );

  const handleChat = useCallback(
    async (booking: BookingData) => {
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
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_chat_open",
          message:
            currentLanguage === "ko"
              ? "채팅방을 열 수 없습니다."
              : currentLanguage === "vi"
                ? "Không thể mở phòng chat."
                : "Could not open chat.",
        });
      }
    },
    [currentLanguage, setBookings, setActiveChatRoomId],
  );

  const handleReject = useCallback(
    async (bookingId: string) => {
      if (!cancelAgreed) {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_reject_policy",
          message:
            currentLanguage === "ko"
              ? "취소 정책에 동의해 주세요."
              : currentLanguage === "vi"
                ? "Vui lòng đồng ý với chính sách hủy."
                : "Please agree to the cancellation policy.",
        });
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
          emitUserFacingAppToast({
            tone: "info",
            area: "bookings",
            action: "host_reject_relist",
            message:
              currentLanguage === "ko"
                ? "매물 상태가 업데이트되었습니다."
                : currentLanguage === "vi"
                  ? "Đã cập nhật trạng thái tin đăng."
                  : "Listing status was updated.",
          });
          router.push(`/profile/my-properties`);
        }
        setShowCancelModal(false);
        setCancelCancelAgreed(false);
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_reject",
          message:
            currentLanguage === "ko"
              ? "거절 처리에 실패했습니다."
              : currentLanguage === "vi"
                ? "Từ chối thất bại."
                : "Could not reject the booking.",
        });
      }
    },
    [
      cancelAgreed,
      currentLanguage,
      router,
      setBookings,
      setShowCancelModal,
      setCancelCancelAgreed,
    ],
  );

  const handleDelete = useCallback(
    async (bookingId: string) => {
      if (!globalThis.confirm(
        currentLanguage === "ko"
          ? "이 예약을 삭제할까요?"
          : currentLanguage === "vi"
            ? "Xóa đặt phòng này?"
            : "Delete this booking?",
      )) {
        return;
      }
      try {
        await deleteBooking(bookingId);
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        emitUserFacingAppToast({
          tone: "success",
          area: "bookings",
          action: "host_delete_booking",
          message:
            currentLanguage === "ko"
              ? "예약이 삭제되었습니다."
              : currentLanguage === "vi"
                ? "Đã xóa đặt phòng."
                : "Booking removed.",
        });
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_delete_booking",
          message:
            currentLanguage === "ko"
              ? "삭제에 실패했습니다."
              : currentLanguage === "vi"
                ? "Xóa thất bại."
                : "Delete failed.",
        });
      }
    },
    [currentLanguage, setBookings],
  );

  return {
    openCancelModal,
    closeCancelModal,
    handleConfirm,
    handleChat,
    handleReject,
    handleDelete,
  };
}
