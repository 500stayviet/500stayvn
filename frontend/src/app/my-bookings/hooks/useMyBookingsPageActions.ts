"use client";

import { useCallback } from "react";
import { cancelBooking, deleteBooking, type BookingData } from "@/lib/api/bookings";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { MyBookingsPageData } from "./useMyBookingsPageData";

export function useMyBookingsPageActions(data: MyBookingsPageData) {
  const {
    router,
    currentLanguage,
    cancelAgreed,
    setBookings,
    setCancellingId,
    setShowCancelModal,
    setSelectedBookingForCancel,
    setFilter,
  } = data;

  const selectTab = useCallback(
    (tab: "active" | "closed") => {
      setFilter(tab);
      router.replace(`/my-bookings?tab=${tab}`, { scroll: false });
    },
    [router, setFilter],
  );

  const openCancelModal = useCallback(
    (booking: BookingData) => {
      setSelectedBookingForCancel(booking);
      setShowCancelModal(true);
    },
    [setSelectedBookingForCancel, setShowCancelModal],
  );

  const closeCancelModal = useCallback(() => {
    setShowCancelModal(false);
  }, [setShowCancelModal]);

  const handleCancel = useCallback(
    async (bookingId: string) => {
      if (!cancelAgreed) {
        emitUserFacingSyncError({
          area: "bookings",
          action: "guest_cancel_policy",
          message:
            currentLanguage === "ko"
              ? "취소 정책에 동의해 주세요."
              : currentLanguage === "vi"
                ? "Vui lòng đồng ý chính sách hủy."
                : "Please agree to the cancellation policy.",
        });
        return;
      }
      setCancellingId(bookingId);
      try {
        await cancelBooking(bookingId, "사용자 요청");
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        );
        setShowCancelModal(false);
        emitUserFacingAppToast({
          tone: "success",
          area: "bookings",
          action: "guest_cancel",
          message:
            currentLanguage === "ko"
              ? "예약이 취소되었습니다."
              : currentLanguage === "vi"
                ? "Đã hủy đặt phòng."
                : "Booking cancelled.",
        });
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "guest_cancel",
          message:
            currentLanguage === "ko"
              ? "취소 처리에 실패했습니다."
              : currentLanguage === "vi"
                ? "Hủy thất bại."
                : "Could not cancel the booking.",
        });
      } finally {
        setCancellingId(null);
      }
    },
    [
      cancelAgreed,
      currentLanguage,
      setBookings,
      setCancellingId,
      setShowCancelModal,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          currentLanguage === "ko"
            ? "이 예약 기록을 삭제할까요?"
            : currentLanguage === "vi"
              ? "Xóa mục đặt phòng này?"
              : "Delete this booking record?",
        )
      ) {
        return;
      }
      try {
        await deleteBooking(id);
        setBookings((prev) => prev.filter((b) => b.id !== id));
        emitUserFacingAppToast({
          tone: "success",
          area: "bookings",
          action: "guest_delete_booking",
          message:
            currentLanguage === "ko"
              ? "삭제되었습니다."
              : currentLanguage === "vi"
                ? "Đã xóa."
                : "Removed.",
        });
      } catch (error) {
        console.error(error);
        emitUserFacingSyncError({
          area: "bookings",
          action: "guest_delete_booking",
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
    selectTab,
    openCancelModal,
    closeCancelModal,
    handleCancel,
    handleDelete,
  };
}
