"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProperty } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";
import { toISODateString, type BookingData } from "@/lib/api/bookings";
import { getPaymentProvider } from "@/lib/providers/currentProviders";

/**
 * 예약 플로우: 매물 로드, 요금 계산, 예약 생성·결제 완료까지 한 훅에 묶는다.
 */
export function useBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const paymentProvider = getPaymentProvider();

  const propertyId = searchParams.get("propertyId");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests");
  const petsParam = searchParams.get("pets");
  const petsCount = Math.max(0, parseInt(petsParam || "0", 10) || 0);

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"info" | "payment">("info");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    message: "",
    adults: 1,
    children: 0,
  });

  useEffect(() => {
    const g = Math.max(1, parseInt(guestsParam || "1", 10) || 1);
    setGuestInfo((prev) => ({ ...prev, adults: g, children: 0 }));
  }, [guestsParam]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePaymentTerms, setAgreePaymentTerms] = useState(false);

  const checkInDate = checkInParam ? new Date(checkInParam) : null;
  const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) {
        router.push("/");
        return;
      }
      try {
        const data = await getProperty(propertyId);
        if (data) setProperty(data);
        else router.push("/");
      } catch (error) {
        console.error("매물 로드 실패:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    void loadProperty();
  }, [propertyId, router]);

  const calculatePrice = () => {
    if (!property || !checkInDate || !checkOutDate)
      return {
        nights: 0,
        weeks: 0,
        accommodationTotal: 0,
        petTotal: 0,
        serviceFee: 0,
        serviceFeePercent: 10,
        totalPrice: 0,
      };
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeks = Math.ceil(nights / 7);
    const accommodationTotal = property.price * weeks;
    const petFeePerWeek = property.petFee ?? 0;
    const petTotal = petsCount * petFeePerWeek * weeks;
    const serviceFeePercent = 10;
    const serviceFee = Math.round(
      (accommodationTotal + petTotal) * (serviceFeePercent / 100),
    );
    const totalPrice = accommodationTotal + petTotal + serviceFee;
    return {
      nights,
      weeks,
      accommodationTotal,
      petTotal,
      serviceFee,
      serviceFeePercent,
      totalPrice,
    };
  };

  const {
    nights,
    accommodationTotal,
    petTotal,
    serviceFee,
    serviceFeePercent,
    totalPrice,
  } = calculatePrice();

  const formatDate = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return "";
    return date.toLocaleDateString(
      currentLanguage === "ko"
        ? "ko-KR"
        : currentLanguage === "vi"
          ? "vi-VN"
          : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  const formatPrice = (price: number) => {
    if (property?.priceUnit === "vnd")
      return `${price.toLocaleString("vi-VN")} VND`;
    return `$${price.toLocaleString()}`;
  };

  const handleCreateBooking = async () => {
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
      alert("예약 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletePayment = async () => {
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
      alert("결제 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    router,
    currentLanguage,
    setCurrentLanguage,
    property,
    loading,
    submitting,
    step,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    guestInfo,
    setGuestInfo,
    setPhoneNumber,
    agreeTerms,
    setAgreeTerms,
    agreePaymentTerms,
    setAgreePaymentTerms,
    checkInDate,
    checkOutDate,
    petsCount,
    nights,
    accommodationTotal,
    petTotal,
    serviceFee,
    serviceFeePercent,
    totalPrice,
    formatDate,
    formatPrice,
    handleCreateBooking,
    handleCompletePayment,
  };
}

export type BookingPageViewModel = ReturnType<typeof useBookingPage>;
