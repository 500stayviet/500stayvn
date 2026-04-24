/**
 * Booking Page (예약 페이지)
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProperty } from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import {
  toISODateString,
  BookingData,
} from "@/lib/api/bookings";
import { getPaymentProvider } from "@/lib/providers/currentProviders";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle,
  Loader2,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import { SupportedLanguage } from "@/lib/api/translation";
import InternationalPhoneInput from "@/components/auth/InternationalPhoneInput";

// 결제 수단 옵션
const PAYMENT_METHODS: readonly {
  id: string;
  name: string | Record<SupportedLanguage, string>;
  icon: string;
}[] = [
  { id: "momo", name: "MoMo", icon: "💜" },
  { id: "zalopay", name: "ZaloPay", icon: "💙" },
  {
    id: "bank_transfer",
    name: {
      ko: "계좌이체",
      vi: "Chuyển khoản",
      en: "Bank Transfer",
      ja: "銀行振込",
      zh: "银行转账",
    },
    icon: "🏦",
  },
  {
    id: "pay_at_property",
    name: {
      ko: "현장 결제",
      vi: "Thanh toán tại chỗ",
      en: "Pay at Property",
      ja: "現地払い",
      zh: "现场付款",
    },
    icon: "🏠",
  },
] as const;

// 지원 5개국 목록
const COUNTRY_CODES = [
  {
    code: "+82",
    country: "🇰🇷",
    name: {
      ko: "한국",
      vi: "Hàn Quốc",
      en: "South Korea",
      ja: "韓国",
      zh: "韩国",
    },
  },
  {
    code: "+84",
    country: "🇻🇳",
    name: {
      ko: "베트남",
      vi: "Việt Nam",
      en: "Vietnam",
      ja: "베트남",
      zh: "越南",
    },
  },
  {
    code: "+1",
    country: "🇺🇸",
    name: { ko: "미국", vi: "Mỹ", en: "USA", ja: "アメリカ", zh: "미국" },
  },
  {
    code: "+81",
    country: "🇯🇵",
    name: { ko: "일본", vi: "Nhật Bản", en: "Japan", ja: "日本", zh: "일본" },
  },
  {
    code: "+86",
    country: "🇨🇳",
    name: { ko: "중국", vi: "Trung Quốc", en: "China", ja: "中国", zh: "중국" },
  },
] as const;

function BookingContent() {
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
  const guestsCount = Math.max(1, parseInt(guestsParam || "1", 10) || 1);
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
  // URL guests 반영
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
    loadProperty();
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
    weeks,
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
          title: property.address || property.title, // 임차인 비공개: 저장용은 주소
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
    } catch (error) {
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
    } catch (error) {
      alert("결제 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="p-4 border-b flex items-center gap-2">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">
            {currentLanguage === "ko" ? "예약하기" : "Đặt phòng"}
          </h1>
        </div>

        {/* 매물 요약 섹션 (안전 장치 강화) */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <Image
                src={property?.images?.[0] || "https://via.placeholder.com/80"}
                alt={property?.address || "property"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {property?.address || ''}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
                <Calendar className="w-3 h-3" />
                <span>
                  {checkInDate && checkOutDate
                    ? `${formatDate(checkInDate)} ~ ${formatDate(checkOutDate)}`
                    : "날짜 정보를 불러올 수 없습니다"}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {formatPrice(totalPrice)} ({nights}
                {currentLanguage === "ko" ? "박" : " đêm"})
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {step === "info" ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">
                {currentLanguage === "ko"
                  ? "예약자 정보"
                  : "Thông tin người đặt"}
              </h2>
              <input
                type="text"
                placeholder="이름"
                className="w-full p-3 border rounded-xl text-sm"
                value={guestInfo.name}
                onChange={(e) =>
                  setGuestInfo({ ...guestInfo, name: e.target.value })
                }
              />
              <div className="space-y-4">
                <InternationalPhoneInput 
                  currentLanguage={currentLanguage}
                  onPhoneChange={(normalized, isComplete) => {
                    setPhoneNumber(normalized);
                  }}
                  initialValue={''}
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>약관 및 개인정보 수집 동의 (필수)</span>
              </label>
              <button
                onClick={handleCreateBooking}
                disabled={!agreeTerms || submitting || !guestInfo.name}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300 transition-colors"
              >
                {submitting ? "처리 중..." : "결제 단계로 이동"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h2 className="font-bold text-lg">
                  {currentLanguage === "ko" ? "결제 수단 선택" : "Chọn phương thức thanh toán"}
                </h2>
              </div>
              {/* 요금 내역: 몇 박 × 주당 가격, 애완동물, 예약수수료, 총액 */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {currentLanguage === "ko" ? "요금 내역" : "Chi tiết thanh toán"}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {nights}
                    {currentLanguage === "ko" ? "박" : " đêm"} × {formatPrice(property?.price ?? 0)}
                    {currentLanguage === "ko" ? " (주당)" : " /tuần"}
                  </span>
                  <span className="font-medium">{formatPrice(accommodationTotal)}</span>
                </div>
                {petsCount > 0 && (property?.petFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {currentLanguage === "ko" ? "애완동물" : "Thú cưng"} {petsCount}
                      {currentLanguage === "ko" ? "마리" : " con"} × {formatPrice(property?.petFee ?? 0)}
                      {currentLanguage === "ko" ? " (마리당/주)" : " /con/tuần"}
                    </span>
                    <span className="font-medium">{formatPrice(petTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {currentLanguage === "ko" ? "예약 수수료" : "Phí dịch vụ"} ({serviceFeePercent}%)
                  </span>
                  <span className="font-medium">{formatPrice(serviceFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-base font-bold">
                  <span>{currentLanguage === "ko" ? "총액" : "Tổng cộng"}</span>
                  <span className="text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${selectedPaymentMethod === m.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-bold">
                      {typeof m.name === "string"
                        ? m.name
                        : (m.name as any)[currentLanguage]}
                    </span>
                  </button>
                ))}
              </div>
              <label className="flex items-start gap-3 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreePaymentTerms}
                  onChange={(e) => setAgreePaymentTerms(e.target.checked)}
                />
                <span>
                  {currentLanguage === "ko"
                    ? "약관 및 결제 조건에 동의합니다. (필수)"
                    : "Tôi đồng ý với điều khoản và điều kiện thanh toán. (Bắt buộc)"}
                </span>
              </label>
              <button
                onClick={handleCompletePayment}
                disabled={!selectedPaymentMethod || !agreePaymentTerms || submitting}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300"
              >
                {submitting ? "처리 중..." : currentLanguage === "ko" ? "결제하기" : "Thanh toán"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
