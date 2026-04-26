"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProperty } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";
import { getPaymentProvider } from "@/lib/providers/currentProviders";

/**
 * 예약 페이지 데이터·파생 값·폼 상태.
 * 매물 로드는 `getProperty` → `parseAppPropertyDetailPayload`(`unwrapAppApiData`) 경로.
 */
export function useBookingPageData() {
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

  return {
    router,
    currentLanguage,
    setCurrentLanguage,
    paymentProvider,
    property,
    loading,
    submitting,
    setSubmitting,
    step,
    setStep,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    bookingId,
    setBookingId,
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
    user,
    propertyId,
    phoneNumber,
  };
}

export type BookingPageData = ReturnType<typeof useBookingPageData>;
