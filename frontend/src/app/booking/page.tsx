/**
 * Booking Page (예약 페이지)
 */

"use client";

import { useState, useEffect, Suspense } from "react"; // Suspense 추가
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProperty, updateProperty } from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import {
  createBooking,
  completePayment,
  confirmBooking,
  toISODateString,
  BookingData,
} from "@/lib/api/bookings";
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import { SupportedLanguage } from "@/lib/api/translation";

// 결제 수단 옵션
const PAYMENT_METHODS: readonly {
  id: string;
  name: string | Record<SupportedLanguage, string>;
  icon: string;
  color: string;
}[] = [
  { id: "momo", name: "MoMo", icon: "💜", color: "bg-pink-500" },
  { id: "zalopay", name: "ZaloPay", icon: "💙", color: "bg-blue-500" },
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
    color: "bg-green-500",
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
    color: "bg-orange-500",
  },
] as const;

// 국가 번호 목록
const COUNTRY_CODES: readonly {
  code: string;
  country: string;
  name: Record<SupportedLanguage, string>;
}[] = [
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
    name: { ko: "미국", vi: "Mỹ", en: "USA", ja: "アメリカ", zh: "美国" },
  },
  {
    code: "+81",
    country: "🇯🇵",
    name: { ko: "일본", vi: "Nhật Bản", en: "Japan", ja: "日本", zh: "日本" },
  },
  {
    code: "+86",
    country: "🇨🇳",
    name: { ko: "중국", vi: "Trung Quốc", en: "China", ja: "中国", zh: "中国" },
  },
  {
    code: "+65",
    country: "🇸🇬",
    name: {
      ko: "싱가포르",
      vi: "Singapore",
      en: "Singapore",
      ja: "シンガポール",
      zh: "新加坡",
    },
  },
  {
    code: "+66",
    country: "🇹🇭",
    name: {
      ko: "태국",
      vi: "Thái Lan",
      en: "Thailand",
      ja: "タイ",
      zh: "泰国",
    },
  },
  {
    code: "+60",
    country: "🇲🇾",
    name: {
      ko: "말레이시아",
      vi: "Malaysia",
      en: "Malaysia",
      ja: "マレー시아",
      zh: "말레이시아",
    },
  },
  {
    code: "+63",
    country: "🇵🇭",
    name: {
      ko: "필리핀",
      vi: "Philippines",
      en: "Philippines",
      ja: "フィ리핀",
      zh: "필리핀",
    },
  },
  {
    code: "+62",
    country: "🇮🇩",
    name: {
      ko: "인도네시아",
      vi: "Indonesia",
      en: "Indonesia",
      ja: "인도네시아",
      zh: "인도네시아",
    },
  },
  {
    code: "+91",
    country: "🇮🇳",
    name: { ko: "인도", vi: "Ấn Độ", en: "India", ja: "인도", zh: "인도" },
  },
  {
    code: "+44",
    country: "🇬🇧",
    name: { ko: "영국", vi: "Anh", en: "UK", ja: "英国", zh: "영국" },
  },
  {
    code: "+49",
    country: "🇩🇪",
    name: { ko: "독일", vi: "Đức", en: "Germany", ja: "독일", zh: "독일" },
  },
  {
    code: "+33",
    country: "🇫🇷",
    name: {
      ko: "프랑스",
      vi: "Pháp",
      en: "France",
      ja: "프랑스",
      zh: "프랑스",
    },
  },
  {
    code: "+61",
    country: "🇦🇺",
    name: { ko: "호주", vi: "Úc", en: "Australia", ja: "호주", zh: "호주" },
  },
] as const;

// 1. 실제 예약 로직이 담긴 컴포넌트
function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const propertyId = searchParams.get("propertyId");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"info" | "payment" | "confirm">("info");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const checkInDate = checkInParam ? new Date(checkInParam) : null;
  const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;

  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    adults: 1,
    children: 0,
  });

  const [countryCode, setCountryCode] = useState("+84");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    const limited = numbers.slice(0, 10);
    if (limited.length <= 3) return limited;
    if (limited.length <= 6)
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  const getPhoneDigits = (formatted: string) =>
    formatted.replace(/[^0-9]/g, "");

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
      return { nights: 0, weeks: 0, totalPrice: 0 };
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeks = Math.ceil(nights / 7);
    const totalPrice = property.price * weeks;
    return { nights, weeks, totalPrice };
  };

  const { nights, weeks, totalPrice } = calculatePrice();

  const formatDate = (date: Date | null) => {
    if (!date) return "";
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
      const fullPhoneNumber = `${countryCode} ${phoneNumber}`;
      const booking = await createBooking(
        {
          propertyId: property.id!,
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          guestPhone: fullPhoneNumber,
          guestMessage: guestInfo.message,
          checkInDate: toISODateString(checkInDate),
          checkOutDate: toISODateString(checkOutDate),
          adults: guestInfo.adults,
          children: guestInfo.children,
        },
        {
          title: property.title,
          address: property.address,
          image: property.images?.[0],
          ownerId: property.ownerId || "unknown",
          ownerName: undefined,
          price: property.price,
          priceUnit: property.priceUnit,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
        },
        user.uid,
      );
      setBookingId(booking.id!);
      setStep("payment");
    } catch (error: any) {
      if (error.message === "AlreadyBooked") {
        alert(
          currentLanguage === "ko"
            ? "이미 예약된 날짜입니다."
            : "Ngày này đã được đặt.",
        );
      } else {
        alert(
          currentLanguage === "ko" ? "예약 생성 실패." : "Đặt phòng thất bại.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!bookingId || !selectedPaymentMethod || !property?.id) return;
    setSubmitting(true);
    try {
      await completePayment(
        bookingId,
        selectedPaymentMethod as BookingData["paymentMethod"],
      );
      const { recalculateAndSplitProperty } =
        await import("@/lib/api/properties");
      await recalculateAndSplitProperty(property.id, bookingId);
      router.push(`/booking-success?bookingId=${bookingId}&new=true`);
    } catch (error) {
      alert(currentLanguage === "ko" ? "결제 실패." : "Thanh toán thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    guestInfo.name.trim() !== "" &&
    getPhoneDigits(phoneNumber).length >= 7 &&
    agreeTerms;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {currentLanguage === "ko" ? "뒤로" : "Quay lại"}
            </span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {currentLanguage === "ko" ? "예약하기" : "Đặt phòng"}
          </h1>
        </div>

        {/* 매물 요약 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={property.images?.[0] || "https://via.placeholder.com/80"}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {property.address || property.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDate(checkInDate)} ~ {formatDate(checkOutDate)}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {formatPrice(totalPrice)} ({weeks}주)
              </p>
            </div>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex items-center gap-2 ${step === "info" ? "text-blue-600" : "text-green-600"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "info" ? "bg-blue-600 text-white" : "bg-green-500 text-white"}`}
              >
                {step === "info" ? "1" : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium">
                {currentLanguage === "ko" ? "정보 입력" : "Thông tin"}
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div
              className={`flex items-center gap-2 ${step === "payment" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "payment" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                2
              </div>
              <span className="text-sm font-medium">
                {currentLanguage === "ko" ? "결제" : "Thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-4 space-y-4">
          {step === "info" ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">
                {currentLanguage === "ko" ? "예약자 정보" : "Thông tin"}
              </h2>
              <input
                type="text"
                value={guestInfo.name}
                onChange={(e) =>
                  setGuestInfo({ ...guestInfo, name: e.target.value })
                }
                placeholder="이름"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="border rounded-lg text-sm px-2"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(formatPhoneNumber(e.target.value))
                  }
                  placeholder="000-000-0000"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1"
                />
                <span>약관 및 개인정보 수집 동의</span>
              </label>
              <button
                onClick={handleCreateBooking}
                disabled={!isFormValid || submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300"
              >
                {submitting ? "처리 중..." : "다음으로"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-center">결제 수단 선택</h2>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m.id)}
                  className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 ${selectedPaymentMethod === m.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                >
                  <span>{m.icon}</span>
                  <span className="font-medium">
                    {(m.name as any)[currentLanguage] || m.id}
                  </span>
                </button>
              ))}
              <button
                onClick={handleCompletePayment}
                disabled={!selectedPaymentMethod || submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
              >
                {submitting ? "결제 중..." : "결제 완료"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. 외부로 내보내는 메인 컴포넌트 (Suspense 적용)
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
