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
import { getUIText } from "@/utils/i18n";

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
          message: getUIText("hostBookingConfirmToastOk", currentLanguage),
        });
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_confirm",
          message: getUIText("hostBookingConfirmToastErr", currentLanguage),
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
          message: getUIText("hostBookingChatOpenErr", currentLanguage),
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
          message: getUIText("cancelPolicyAgreeRequired", currentLanguage),
        });
        return;
      }
      try {
        const { relistResult } = await cancelBooking(
          bookingId,
          getUIText("hostBookingCancelReasonByOwner", currentLanguage),
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
            message: getUIText("hostBookingRejectToastListingOk", currentLanguage),
          });
          router.push(`/profile/my-properties`);
        }
        setShowCancelModal(false);
        setCancelCancelAgreed(false);
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_reject",
          message: getUIText("hostBookingRejectToastErr", currentLanguage),
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
        getUIText("hostBookingDeleteConfirm", currentLanguage),
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
          message: getUIText("hostBookingDeleteOk", currentLanguage),
        });
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "host_delete_booking",
          message: getUIText("hostBookingDeleteErr", currentLanguage),
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
