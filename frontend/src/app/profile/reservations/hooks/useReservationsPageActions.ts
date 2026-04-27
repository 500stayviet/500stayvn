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
import { getUIText } from "@/utils/i18n";

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
                message = getUIText("reservationCancelRelistMerged", currentLanguage);
                break;
              case "relisted":
                message = getUIText("reservationCancelRelistRelisted", currentLanguage);
                break;
              case "limit_exceeded":
                message = getUIText(
                  "reservationCancelRelistLimitExceeded",
                  currentLanguage,
                );
                targetTab = "pending";
                break;
              case "short_term":
                message = getUIText("reservationCancelRelistShortTerm", currentLanguage);
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
          message: getUIText("reservationStatusUpdateError", currentLanguage),
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
          getUIText("hostReservationRecordDeleteConfirm", currentLanguage),
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
          message: getUIText("hostReservationRecordDeleteError", currentLanguage),
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
