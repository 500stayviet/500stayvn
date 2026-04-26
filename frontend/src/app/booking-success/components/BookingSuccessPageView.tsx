"use client";

import {
  Calendar,
  Clock,
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
import type { BookingSuccessPageViewModel } from "../hooks/useBookingSuccessPage";

type Props = { vm: BookingSuccessPageViewModel };

export function BookingSuccessPageView({ vm }: Props) {
  const {
    router,
    user,
    currentLanguage,
    setCurrentLanguage,
    booking,
    loading,
    showSuccessModal,
    setShowSuccessModal,
    activeChatRoomId,
    setActiveChatRoomId,
    copied,
    copyToClipboard,
    formatDate,
    formatPrice,
  } = vm;

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

        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              type="button"
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
                type="button"
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

        <div className="p-4 space-y-4 pb-12">
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
                type="button"
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

              {(booking.petCount ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    {currentLanguage === "ko" ? "애완동물" : "Thú cưng"}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {booking.petCount} {currentLanguage === "ko" ? "마리" : " con"}
                  </p>
                </div>
              )}

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
                  &quot;{booking.guestMessage}&quot;
                </p>
              </div>
            )}

            {(booking.accommodationTotal != null || (booking.petCount ?? 0) > 0) && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                {booking.accommodationTotal != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {booking.nights}
                      {currentLanguage === "ko" ? "박" : " đêm"} × {currentLanguage === "ko" ? "주당 가격" : "giá/tuần"}
                    </span>
                    <span className="font-medium">{formatPrice(booking.accommodationTotal, booking.priceUnit)}</span>
                  </div>
                )}
                {(booking.petCount ?? 0) > 0 && (booking.petTotal ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {currentLanguage === "ko" ? "애완동물" : "Thú cưng"} {booking.petCount}{currentLanguage === "ko" ? "마리" : " con"} × {currentLanguage === "ko" ? "마리당" : "con"}
                    </span>
                    <span className="font-medium">{formatPrice(booking.petTotal!, booking.priceUnit)}</span>
                  </div>
                )}
                {(booking.serviceFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {currentLanguage === "ko" ? "예약 수수료" : "Phí dịch vụ"} ({(booking.serviceFeePercent ?? 10)}%)
                    </span>
                    <span className="font-medium">{formatPrice(booking.serviceFee!, booking.priceUnit)}</span>
                  </div>
                )}
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

          <div className="space-y-3 pt-4 pb-10">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
            >
              <Home className="w-5 h-5" />
              {currentLanguage === "ko" ? "홈으로 돌아가기" : "Về trang chủ"}
            </button>

            <button
              type="button"
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
