"use client";

import { MessageCircle, Loader2, ArrowLeft } from "lucide-react";
import TopBar from "@/components/TopBar";
import ChatModal from "@/components/ChatModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import Image from "next/image";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { BookingData } from "@/lib/api/bookings";
import type { HostBookingsPageViewModel } from "../hooks/useHostBookingsPage";
import { getUIText } from "@/utils/i18n";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border border-green-300",
  cancelled_before: "bg-gray-100 text-gray-700 border border-gray-300",
  cancelled_after: "bg-red-100 text-red-800 border border-red-300",
  completed: "bg-gray-100 text-gray-700 border border-gray-300",
};

const STATUS_LABELS: Record<
  "pending" | "confirmed" | "cancelled_before" | "cancelled_after" | "completed",
  Record<SupportedLanguage, string>
> = {
  pending: {
    ko: "예약 요청",
    vi: "Yêu cầu đặt phòng",
    en: "Booking Request",
    ja: "予約リクエスト",
    zh: "预订请求",
  },
  confirmed: {
    ko: "예약 확정",
    vi: "Đặt phòng đã xác nhận",
    en: "Booking Confirmed",
    ja: "予約確定",
    zh: "预订确认",
  },
  cancelled_before: {
    ko: "요청 취소",
    vi: "Yêu cầu đã hủy",
    en: "Request Cancelled",
    ja: "リクエストキャンセル",
    zh: "请求取消",
  },
  cancelled_after: {
    ko: "예약 취소",
    vi: "Đặt phòng đã hủy",
    en: "Booking Cancelled",
    ja: "予約キャンセル",
    zh: "预订取消",
  },
  completed: {
    ko: "완료됨",
    vi: "Hoàn thành",
    en: "Completed",
    ja: "完了済み",
    zh: "已完成",
  },
};

const getCancellationType = (
  booking: BookingData,
): "cancelled_before" | "cancelled_after" => {
  return booking.confirmedAt ? "cancelled_after" : "cancelled_before";
};

type Props = { vm: HostBookingsPageViewModel };

export function HostBookingsPageView({ vm }: Props) {
  const {
    router,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    unreadCounts,
    showCancelModal,
    selectedBookingForCancel,
    cancelAgreed,
    setCancelCancelAgreed,
    activeChatRoomId,
    setActiveChatRoomId,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
    filter,
    setFilter,
    filteredBookings,
    formatDateTime,
    formatDate,
    formatPrice,
    openCancelModal,
    closeCancelModal,
    handleConfirm,
    handleChat,
    handleReject,
    handleDelete,
  } = vm;

  void handleDelete;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          hideLanguageSelector={false}
        />
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-gray-600 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{getUIText("back", currentLanguage)}</span>
          </button>
          <h1 className="text-xl font-bold">
            {getUIText("bookingManagement", currentLanguage)}
          </h1>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 flex gap-2">
          {[{ id: "active" as const }, { id: "closed" as const }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium ${filter === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {tab.id === "active"
                ? getUIText("activeBookings", currentLanguage)
                : getUIText("closedHistory", currentLanguage)}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredBookings.map((booking) => {
            let statusColorClass = "";
            let statusLabel = "";

            if (booking.status === "pending") {
              statusColorClass = STATUS_COLORS.pending;
              statusLabel = STATUS_LABELS.pending[currentLanguage];
            } else if (booking.status === "confirmed") {
              statusColorClass = STATUS_COLORS.confirmed;
              statusLabel = STATUS_LABELS.confirmed[currentLanguage];
            } else if (booking.status === "cancelled") {
              const cancellationType = getCancellationType(booking);
              statusColorClass = STATUS_COLORS[cancellationType];
              statusLabel = STATUS_LABELS[cancellationType][currentLanguage];
            } else if (booking.status === "completed") {
              statusColorClass = STATUS_COLORS.completed;
              statusLabel = STATUS_LABELS.completed[currentLanguage];
            } else {
              statusColorClass = "bg-gray-100 text-gray-700";
              statusLabel = booking.status;
            }

            return (
              <div
                key={booking.id}
                onClick={() => setSelectedBookingForDetails(booking)}
                className="border rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColorClass}`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {booking.createdAt && formatDateTime(booking.createdAt)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={booking.propertyImage || ""}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {booking.propertyAddress || booking.propertyTitle}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatDate(booking.checkInDate)} -{" "}
                      {formatDate(booking.checkOutDate)}
                    </p>
                    <p className="text-sm font-black text-blue-600 mt-1">
                      {formatPrice(booking.totalPrice, booking.priceUnit)}
                    </p>
                  </div>
                </div>
                <div
                  className="flex justify-end gap-2 mt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleConfirm(booking.id!);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        {getUIText("hostApproveBooking", currentLanguage)}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(booking);
                        }}
                        className="text-red-500 text-xs font-bold"
                      >
                        {getUIText("cancel", currentLanguage)}
                      </button>
                    </>
                  )}

                  {booking.status === "confirmed" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleChat(booking);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                      >
                        <MessageCircle size={14} />
                        {getUIText("chat", currentLanguage)}
                        {booking.chatRoomId &&
                          unreadCounts[booking.chatRoomId] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCounts[booking.chatRoomId]}
                            </span>
                          )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(booking);
                        }}
                        className="text-red-500 text-xs font-bold"
                      >
                        {getUIText("cancel", currentLanguage)}
                      </button>
                    </>
                  )}

                  {booking.status === "completed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleChat(booking);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                    >
                      <MessageCircle size={14} />
                      {getUIText("chat", currentLanguage)}
                      {booking.chatRoomId &&
                        unreadCounts[booking.chatRoomId] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[booking.chatRoomId]}
                          </span>
                        )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {showCancelModal && selectedBookingForCancel && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4">취소 확인</h3>
              <label className="flex items-center gap-2 mb-6">
                <input
                  type="checkbox"
                  checked={cancelAgreed}
                  onChange={(e) => setCancelCancelAgreed(e.target.checked)}
                />
                <span className="text-xs">내용을 확인했습니다.</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => closeCancelModal()}
                  className="flex-1 py-3 bg-gray-100 rounded-xl"
                >
                  닫기
                </button>
                <button
                  onClick={() => void handleReject(selectedBookingForCancel.id!)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
        {activeChatRoomId && (
          <ChatModal
            roomId={activeChatRoomId}
            onClose={() => setActiveChatRoomId(null)}
          />
        )}
        {selectedBookingForDetails && (
          <BookingDetailsModal
            booking={selectedBookingForDetails}
            onClose={() => setSelectedBookingForDetails(null)}
          />
        )}
      </div>
    </div>
  );
}
