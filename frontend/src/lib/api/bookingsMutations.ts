/**
 * 예약 — 쓰기(Write/Mutation): 로컬 캐시 변경 + PUT + 결제 메타
 */

import { toISODateString } from "../utils/dateUtils";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
} from "@/lib/runtime/networkResilience";
import { withAppActor } from "@/lib/api/withAppActor";
import type { BookingData, CreateBookingRequest } from "./bookingsTypes";
import {
  createPaymentMetaForBooking,
  emitPayCompleteTransitionToast,
  emitRefundAdminTransitionToast,
  patchPaymentMetaByBooking,
} from "./bookingsPaymentMeta";
import {
  getAllBookings,
  isDateRangeBooked,
  refreshBookingsFromServer,
} from "./bookingsQueries";
import { readStoredUiLanguage } from "@/lib/uiLanguageStorage";
import { getUIText } from "@/utils/i18n";
import { readBookingsArray, writeBookingsArray } from "./bookingsState";

/** 즉시 PUT: 결제·확정·취소 등 사용자 액션 직후 서버 원장과 맞출 때 사용 (debounce 없음) */
export async function syncBookingsNow(snapshot: BookingData[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetchWithRetry(
      "/api/app/bookings",
      withAppActor({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 },
    );
  } catch (e) {
    console.warn("[bookings] immediate PUT sync failed", e);
    emitUserFacingSyncError({
      area: "bookings",
      action: "sync",
      message: getUIText("bookingSyncImmediateFailed", readStoredUiLanguage()),
    });
  }
}

function generateId(): string {
  return (
    "booking_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  );
}

/** 동일 예약 결제 확정 PATCH 재시도 시 서버 멱등 키로 재사용 */
function getOrCreatePaymentConfirmIdempotencyKey(bookingId: string): string {
  const storageKey = `stayviet:payConfirmIdem:${bookingId}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${bookingId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `${bookingId}-${Date.now()}`;
  }
}

/**
 * 예약 생성
 */
export async function createBooking(
  data: CreateBookingRequest,
  propertyData: {
    title: string;
    address?: string;
    image?: string;
    ownerId: string;
    ownerName?: string;
    price: number;
    priceUnit: "vnd" | "usd";
    checkInTime?: string;
    checkOutTime?: string;
    petFee?: number;
  },
  guestId: string,
): Promise<BookingData> {
  if (typeof window === "undefined") {
    throw new Error("Not supported in SSR");
  }
  const isBooked = await isDateRangeBooked(
    data.propertyId,
    data.checkInDate,
    data.checkOutDate,
  );
  if (isBooked) {
    throw new Error("AlreadyBooked");
  }

  const bookings = await getAllBookings();

  const checkIn = new Date(toISODateString(data.checkInDate));
  const checkOut = new Date(toISODateString(data.checkOutDate));
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
  );

  const weeks = Math.ceil(nights / 7);
  const accommodationTotal = propertyData.price * weeks;
  const petCount = data.petCount ?? 0;
  const petFeePerWeek = propertyData.petFee ?? 0;
  const petTotal = petCount * petFeePerWeek * weeks;
  const serviceFeePercent = 10;
  const serviceFee = Math.round(
    (accommodationTotal + petTotal) * (serviceFeePercent / 100),
  );
  const totalPrice = accommodationTotal + petTotal + serviceFee;

  const newBooking: BookingData = {
    id: generateId(),
    propertyId: data.propertyId,
    propertyTitle: propertyData.title,
    propertyAddress: propertyData.address,
    propertyImage: propertyData.image,

    guestId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    guestMessage: data.guestMessage,

    ownerId: propertyData.ownerId,
    ownerName: propertyData.ownerName,

    checkInDate: toISODateString(data.checkInDate),
    checkOutDate: toISODateString(data.checkOutDate),
    checkInTime: propertyData.checkInTime || "14:00",
    checkOutTime: propertyData.checkOutTime || "12:00",

    adults: data.adults,
    children: data.children,
    petCount: petCount || undefined,

    totalPrice,
    priceUnit: propertyData.priceUnit,
    nights,
    accommodationTotal,
    petTotal: petTotal || undefined,
    serviceFee,
    serviceFeePercent,

    paymentStatus: "pending",
    status: "pending",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { createChatRoom } = await import("./chat");
  const chatRoom = await createChatRoom({
    bookingId: newBooking.id!,
    propertyId: newBooking.propertyId,
    propertyTitle: newBooking.propertyTitle,
    propertyImage: newBooking.propertyImage,
    ownerId: newBooking.ownerId,
    ownerName: newBooking.ownerName,
    guestId: newBooking.guestId,
    guestName: newBooking.guestName,
  });

  newBooking.chatRoomId = chatRoom.id;

  bookings.push(newBooking);
  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  await createPaymentMetaForBooking(newBooking);

  return newBooking;
}

/**
 * 결제 완료 처리
 */
export async function completePayment(
  bookingId: string,
  paymentMethod: BookingData["paymentMethod"],
): Promise<BookingData | null> {
  if (typeof window === "undefined") return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) return null;

  bookings[index] = {
    ...bookings[index],
    paymentMethod,
    paymentStatus: "paid",
    paymentDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  const paymentPatch = await patchPaymentMetaByBooking(bookingId, {
    status: "paid",
    provider: paymentMethod || null,
    idempotencyKey: getOrCreatePaymentConfirmIdempotencyKey(bookingId),
  });
  if (!paymentPatch.ok) {
    await refreshBookingsFromServer();
    throw new Error("payment_server_sync_failed");
  }
  await refreshBookingsFromServer();
  emitPayCompleteTransitionToast(paymentPatch.transition);
  return readBookingsArray().find((b) => b.id === bookingId) || null;
}

/**
 * 예약 확정 처리
 */
export async function confirmBooking(
  bookingId: string,
): Promise<BookingData | null> {
  if (typeof window === "undefined") return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) return null;

  if (bookings[index].paymentStatus !== "paid") {
    throw new Error(
      getUIText("bookingErrorPaymentNotCompleted", readStoredUiLanguage()),
    );
  }

  bookings[index] = {
    ...bookings[index],
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return bookings[index];
}

/**
 * 예약 취소 처리
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<{
  booking: BookingData | null;
  relistResult?: {
    type: "merged" | "relisted" | "limit_exceeded" | "short_term";
    targetId?: string;
  };
}> {
  if (typeof window === "undefined") return { booking: null };
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) return { booking: null };

  const booking = bookings[index];
  bookings[index] = {
    ...bookings[index],
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
    updatedAt: new Date().toISOString(),
  };

  let relistResult;
  try {
    const { handleCancellationRelist } = await import("./properties");
    relistResult = await handleCancellationRelist(
      booking.propertyId,
      booking.ownerId,
    );
  } catch (error) {
    console.error("Property auto-relist after cancel failed:", error);
  }

  const chatRoomId = booking.chatRoomId;
  try {
    const { markAllMessagesInRoomAsRead, getChatRoomByBookingId } = await import(
      "./chat"
    );
    if (chatRoomId) {
      await markAllMessagesInRoomAsRead(chatRoomId);
    } else {
      const room = await getChatRoomByBookingId(booking.id!);
      if (room) {
        await markAllMessagesInRoomAsRead(room.id);
      }
    }
  } catch (error) {
    console.error("Failed to mark messages as read on cancellation:", error);
  }

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return { booking: bookings[index], relistResult };
}

/**
 * 예약 데이터 영구 삭제
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const bookings = await getAllBookings();
    if (bookings.length === 0) return;
    const filtered = bookings.filter((b) => b.id !== bookingId);
    if (filtered.length === bookings.length) return;

    writeBookingsArray(filtered);
    await syncBookingsNow(filtered);

    try {
      const { purgeSettlementStateForDeletedBooking } = await import(
        "./adminFinance"
      );
      await purgeSettlementStateForDeletedBooking(bookingId);
    } catch (e) {
      console.error("Settlement queue purge failed:", e);
    }
  } catch (error) {
    console.error("deleteBooking failed:", error);
    throw error;
  }
}

/**
 * 취소되었고 결제는 완료됐으나 관리자 환불 승인 전인 건에 대해 환불 처리(상태 반영).
 */
export async function approveRefundBooking(
  bookingId: string,
  adminId: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return false;
  const b = bookings[index];
  if (b.status !== "cancelled" || b.paymentStatus !== "paid" || b.refundAdminApproved)
    return false;

  bookings[index] = {
    ...b,
    paymentStatus: "refunded",
    refundAdminApproved: true,
    refundAdminApprovedAt: new Date().toISOString(),
    refundAdminApprovedBy: adminId,
    updatedAt: new Date().toISOString(),
  };
  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  const refundPatch = await patchPaymentMetaByBooking(bookingId, {
    status: "refunded",
    refundStatus: "approved",
    refundAmount: b.totalPrice,
  });
  if (!refundPatch.ok) {
    await refreshBookingsFromServer();
    return false;
  }
  await refreshBookingsFromServer();
  emitRefundAdminTransitionToast(refundPatch.transition);

  const { appendRefundLedgerEntry } = await import("@/lib/api/adminFinance");
  await appendRefundLedgerEntry({
    ownerId: b.ownerId,
    amount: b.totalPrice,
    bookingId: b.id!,
    adminId,
  });
  return true;
}

/**
 * 채팅방 ID 설정
 */
export async function setChatRoomId(
  bookingId: string,
  chatRoomId: string,
): Promise<BookingData | null> {
  if (typeof window === "undefined") return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);

  if (index === -1) return null;

  bookings[index] = {
    ...bookings[index],
    chatRoomId,
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return bookings[index];
}
