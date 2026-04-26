"use client";

import { useCallback } from "react";
import {
  updateReservationStatus,
  deleteReservation,
} from "@/lib/api/reservations";
import { logCancelledProperty, handleCancellationRelist } from "@/lib/api/properties";
import { markAllMessagesInRoomAsRead, findChatRoom } from "@/lib/api/chat";
import type { ReservationData } from "@/lib/api/reservations";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { ReservationsPageData } from "./useReservationsPageData";

/**
 * 임대인 예약 관리 — 상태 변경·삭제·취소 후 재리스트 네비게이션.
 */
export function useReservationsPageActions(data: ReservationsPageData) {
  const {
    router,
    user,
    currentLanguage,
    reservations,
    setUpdatingId,
    reloadReservations,
  } = data;

  const handleUpdateStatus = useCallback(
    async (reservationId: string, newStatus: ReservationData["status"]) => {
      if (!reservationId || !user) return;

      setUpdatingId(reservationId);
      try {
        await updateReservationStatus(reservationId, newStatus);

        if (newStatus === "cancelled") {
          const reservation = reservations.find((r) => r.id === reservationId);
          if (reservation) {
            await logCancelledProperty({
              propertyId: reservation.propertyId,
              reservationId: reservation.id,
              ownerId: user.uid,
            });

            try {
              const chatRoom = await findChatRoom(
                reservation.propertyId,
                user.uid,
                reservation.tenantId,
              );
              if (chatRoom) {
                await markAllMessagesInRoomAsRead(chatRoom.id);
              }
            } catch (chatError) {
              console.error("Failed to mark messages as read on cancellation:", chatError);
            }

            const result = await handleCancellationRelist(reservation.propertyId, user.uid);

            let message = "";
            let targetTab = "active";

            switch (result.type) {
              case "merged":
                message =
                  currentLanguage === "ko"
                    ? "취소된 기간이 기존 광고 중인 매물과 병합되었습니다. 매물 개수가 유지됩니다."
                    : "The cancelled period has been merged with an existing ad.";
                break;
              case "relisted":
                message =
                  currentLanguage === "ko"
                    ? "예약이 취소되어 매물이 다시 광고 중입니다."
                    : "Reservation cancelled. Property is back in advertising.";
                break;
              case "limit_exceeded":
                message =
                  currentLanguage === "ko"
                    ? "예약이 취소되어 광고대기 탭에서 다시 등록해 주세요."
                    : "Reservation cancelled — open Waiting to relist and re-submit.";
                targetTab = "pending";
                break;
              case "short_term":
                message =
                  currentLanguage === "ko"
                    ? "예약이 취소되어 광고대기 탭으로 이동되었습니다. 펜(수정)으로 기간을 맞춘 뒤 다시 올리세요."
                    : "Reservation cancelled — moved to waiting. Edit dates then relist.";
                targetTab = "pending";
                break;
            }

            emitUserFacingAppToast({
              tone: "info",
              area: "bookings",
              action: "reservation_cancel_relist",
              message,
            });
            router.push(`/profile/my-properties?tab=${targetTab}`);
          }
        }

        await reloadReservations();
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "reservation_status",
          message:
            currentLanguage === "ko"
              ? "예약 상태 업데이트 중 오류가 발생했습니다."
              : currentLanguage === "vi"
                ? "Đã xảy ra lỗi khi cập nhật trạng thái đặt phòng."
                : "An error occurred while updating reservation status.",
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [
      user,
      currentLanguage,
      reservations,
      setUpdatingId,
      reloadReservations,
      router,
    ],
  );

  const handleDeleteReservation = useCallback(
    async (reservationId: string) => {
      if (!reservationId || !user) return;
      if (
        !globalThis.confirm(
          currentLanguage === "ko"
            ? "기록을 영구적으로 삭제하시겠습니까?"
            : "Do you want to permanently delete the record?",
        )
      )
        return;

      setUpdatingId(reservationId);
      try {
        await deleteReservation(reservationId);
        await reloadReservations();
      } catch {
        emitUserFacingSyncError({
          area: "bookings",
          action: "reservation_delete",
          message:
            currentLanguage === "ko"
              ? "기록 삭제 중 오류가 발생했습니다."
              : "Error deleting record.",
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [user, currentLanguage, setUpdatingId, reloadReservations],
  );

  return {
    handleUpdateStatus,
    handleDeleteReservation,
  };
}
