/**
 * Booking Success Page (예약 완료 페이지)
 */

"use client";

import { useState, useEffect, Suspense } from "react"; // Suspense 추가
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBooking, BookingData } from "@/lib/api/bookings";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Home,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import ChatModal from "@/components/ChatModal";
import Image from "next/image";

// 1. 기존 로직을 담은 실제 콘텐츠 컴포넌트
function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // 초기값 false로 변경
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // URL에 new=true가 있으면 성공 모달을 띄움
    if (searchParams.get("new") === "true") {
      setShowSuccessModal(true);
    } else {
      setShowSuccessModal(false);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        router.push("/");
        return;
      }

      try {
        const data = await getBooking(bookingId);
        if (data) {
          setBooking(data);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("예약 로드 실패:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      currentLanguage === "ko"
        ? "ko-KR"
        : currentLanguage === "vi"
          ? "vi-VN"
          : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === "vnd") {
      return `${price.toLocaleString("vi-VN")} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (user?.uid === booking.ownerId) {
                  router.push("/host/bookings");
                } else {
                  router.push("/my-bookings");
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {currentLanguage === "ko"
                ? "예약 상세 내역"
                : currentLanguage === "vi"
                  ? "Chi tiết đặt phòng"
                  : "Booking Details"}
            </h1>
          </div>
        </div>

        {/* 성공 모달 */}
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === "ko"
                  ? "결제가 완료되었습니다!"
                  : currentLanguage === "vi"
                    ? "Thanh toán thành công!"
                    : "Payment Complete!"}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {currentLanguage === "ko"
                  ? "임대인의 승인을 기다리고 있습니다."
                  : currentLanguage === "vi"
                    ? "Đang chờ chủ nhà phê duyệt."
                    : "Waiting for host approval."}
              </p>
              <p className="text-xs text-gray-400 mb-6">
                {currentLanguage === "ko"
                  ? "승인이 완료되면 알림을 보내드립니다."
                  : currentLanguage === "vi"
                    ? "Chúng tôi sẽ thông báo khi được phê duyệt."
                    : "We will notify you when approved."}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
              >
                {currentLanguage === "ko"
                  ? "확인"
                  : currentLanguage === "vi"
                    ? "Đã hiểu"
                    : "Got it"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 콘텐츠 */}
        <div className="p-4 space-y-4 pb-12">
          {/* 예약 번호 섹션 */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {currentLanguage === "ko"
                  ? "예약 번호"
                  : currentLanguage === "vi"
                    ? "Mã đặt phòng"
                    : "Booking Number"}
              </span>
              <button
                onClick={() => copyToClipboard(booking.id!)}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {booking.id}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : booking.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {currentLanguage === "ko"
                    ? booking.status === "confirmed"
                      ? "확정됨"
                      : booking.status === "cancelled"
                        ? "취소됨"
                        : "승인 대기 중"
                    : booking.status === "confirmed"
                      ? "Đã xác nhận"
                      : booking.status === "cancelled"
                        ? "Đã hủy"
                        : "Chờ phê duyệt"}
                </span>
                <span className="text-[11px] font-bold text-gray-400">
                  {booking.createdAt &&
                    new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* 매물 정보 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" />
              {currentLanguage === "ko" ? "숙소 정보" : "Thông tin chỗ ở"}
            </h3>
            <div className="flex gap-4">
              {booking.propertyImage && (
                <div className="w-24 h-24 relative rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                  <Image
                    src={booking.propertyImage}
                    alt={booking.propertyTitle || ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-bold text-gray-900 leading-tight mb-2">
                  {booking.propertyAddress || booking.propertyTitle}
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {formatDate(booking.checkInDate)} -{" "}
                      {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {currentLanguage === "ko"
                        ? `체크인 ${booking.checkInTime || "14:00"} · 체크아웃 ${booking.checkOutTime || "12:00"}`
                        : `Check-in ${booking.checkInTime || "14:00"} · Check-out ${booking.checkOutTime || "12:00"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 예약자 상세 정보 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 -mx-1">
              {currentLanguage === "ko"
                ? "상세 예약 정보"
                : "Chi tiết đặt phòng"}
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase">
                  {currentLanguage === "ko" ? "예약자" : "Người đặt"}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {booking.guestName}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase">
                  {currentLanguage === "ko" ? "연락처" : "Số điện thoại"}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {booking.guestPhone}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase">
                  {currentLanguage === "ko" ? "이용 인원" : "Số khách"}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {currentLanguage === "ko"
                    ? `성인 ${booking.adults}명${booking.children > 0 ? `, 어린이 ${booking.children}명` : ""}`
                    : `${booking.adults} người lớn${booking.children > 0 ? `, ${booking.children} trẻ em` : ""}`}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase">
                  {currentLanguage === "ko" ? "숙박 기간" : "Thời gian"}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {booking.nights}
                  {currentLanguage === "ko" ? "박" : " đêm"}
                </p>
              </div>
            </div>

            {booking.guestMessage && (
              <div className="bg-blue-50/50 rounded-xl p-3.5 space-y-1.5 border border-blue-50">
                <p className="text-[11px] font-bold text-blue-400 uppercase">
                  {currentLanguage === "ko" ? "요청사항" : "Yêu cầu 특별"}
                </p>
                <p className="text-xs font-medium text-blue-700 leading-relaxed italic">
                  "{booking.guestMessage}"
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">
                {currentLanguage === "ko" ? "총 결제 금액" : "Tổng số tiền"}
              </p>
              <div className="text-right">
                <p className="text-lg font-black text-blue-600 leading-none">
                  {formatPrice(booking.totalPrice, booking.priceUnit)}
                </p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                  {booking.paymentStatus === "paid"
                    ? currentLanguage === "ko"
                      ? "결제 완료"
                      : "Đã thanh toán"
                    : currentLanguage === "ko"
                      ? "결제 대기"
                      : "Chờ thanh toán"}
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3 pt-4 pb-10">
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
            >
              <Home className="w-5 h-5" />
              {currentLanguage === "ko" ? "홈으로 돌아가기" : "Về trang chủ"}
            </button>

            <button
              onClick={() => router.push("/my-bookings")}
              className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Calendar className="w-5 h-5" />
              {currentLanguage === "ko"
                ? "예약 내역 확인"
                : "Xem lịch sử đặt phòng"}
            </button>
          </div>
        </div>

        {/* 채팅 모달 */}
        {activeChatRoomId && (
          <ChatModal
            roomId={activeChatRoomId}
            onClose={() => setActiveChatRoomId(null)}
          />
        )}
      </div>
    </div>
  );
}

// 2. 외부로 내보내는 메인 컴포넌트 (Suspense로 감싸기)
export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
