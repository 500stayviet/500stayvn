"use client";

import { useCallback } from "react";
import { toISODateString, type BookingData } from "@/lib/api/bookings";
import { emitUserFacingSyncError } from "@/lib/runtime/networkResilience";
import type { BookingPageData } from "./useBookingPageData";

function createBookingFailMessage(lang: string): string {
  if (lang === "ko") {
    return "예약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (lang === "vi") {
    return "Không tạo được đặt phòng. Vui lòng thử lại sau.";
  }
  return "Could not create the booking. Please try again.";
}

function completePaymentFailMessage(lang: string): string {
  if (lang === "ko") {
    return "결제를 완료하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.";
  }
  if (lang === "vi") {
    return "Không hoàn tất thanh toán. Vui lòng kiểm tra mạng và thử lại.";
  }
  return "Payment could not be completed. Check your connection and try again.";
}

/**
 * 예약 생성·결제 완료 등 사용자 액션 (paymentProvider / 라우팅).
 */
export function useBookingPageActions(data: BookingPageData) {
  const {
    router,
    user,
    property,
    checkInDate,
    checkOutDate,
    guestInfo,
    phoneNumber,
    petsCount,
    bookingId,
    selectedPaymentMethod,
    paymentProvider,
    setSubmitting,
    setBookingId,
    setStep,
    currentLanguage,
  } = data;

  const handleCreateBooking = useCallback(async () => {
    if (!property || !checkInDate || !checkOutDate || !user) return;
    setSubmitting(true);
    try {
      const booking = await paymentProvider.createBooking(
        {
          propertyId: property.id!,
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          guestPhone: phoneNumber,
          guestMessage: guestInfo.message,
          checkInDate: toISODateString(checkInDate),
          checkOutDate: toISODateString(checkOutDate),
          adults: guestInfo.adults,
          children: guestInfo.children,
          petCount: petsCount > 0 ? petsCount : undefined,
        },
        {
          title: property.address || property.title,
          address: property.address,
          image: property.images?.[0],
          ownerId: property.ownerId || "",
          price: property.price,
          priceUnit: property.priceUnit,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
          petFee: property.petFee,
        },
        user.uid,
      );
      setBookingId(booking.id!);
      setStep("payment");
    } catch {
      emitUserFacingSyncError({
        area: "bookings",
        action: "booking_create",
        message: createBookingFailMessage(currentLanguage),
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    property,
    checkInDate,
    checkOutDate,
    user,
    guestInfo,
    phoneNumber,
    petsCount,
    paymentProvider,
    setSubmitting,
    setBookingId,
    setStep,
    currentLanguage,
  ]);

  const handleCompletePayment = useCallback(async () => {
    if (!bookingId || !selectedPaymentMethod || !property?.id) return;
    setSubmitting(true);
    try {
      await paymentProvider.completePayment(
        bookingId,
        selectedPaymentMethod as BookingData["paymentMethod"],
      );
      const { recalculateAndSplitProperty } =
        await import("@/lib/api/properties");
      await recalculateAndSplitProperty(property.id, bookingId);
      router.push(`/booking-success?bookingId=${bookingId}&new=true`);
    } catch {
      emitUserFacingSyncError({
        area: "bookings",
        action: "payment_complete",
        message: completePaymentFailMessage(currentLanguage),
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    bookingId,
    selectedPaymentMethod,
    property,
    paymentProvider,
    setSubmitting,
    router,
    currentLanguage,
  ]);

  return {
    handleCreateBooking,
    handleCompletePayment,
  };
}
