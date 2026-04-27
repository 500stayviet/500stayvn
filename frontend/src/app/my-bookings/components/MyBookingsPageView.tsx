"use client";

import {
  MessageCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Trash2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import ChatModal from "@/components/ChatModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import Image from "next/image";
import { getUIText } from "@/utils/i18n";
import type { MyBookingsPageViewModel } from "../hooks/useMyBookingsPage";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
};

function bookingListStatusLabel(
  status: keyof typeof STATUS_COLORS,
  lang: Parameters<typeof getUIText>[1],
): string {
  switch (status) {
    case "pending":
      return getUIText("bookingBadgePending", lang);
    case "confirmed":
      return getUIText("bookingBadgeConfirmed", lang);
    case "cancelled":
      return getUIText("bookingBadgeCancelled", lang);
    case "completed":
      return getUIText("completed", lang);
    default:
      return status;
  }
}

type Props = { vm: MyBookingsPageViewModel };

export function MyBookingsPageView({ vm }: Props) {
  const {
    router,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    unreadCounts,
    totalUnreadChatCount,
    showCancelModal,
    selectedBookingForCancel,
    cancelAgreed,
    setCancelCancelAgreed,
    activeChatRoomId,
    setActiveChatRoomId,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
    filter,
    selectTab,
    activeBookings,
    closedBookings,
    filteredBookings,
    formatDateTime,
    formatDate,
    formatPrice,
    openCancelModal,
    closeCancelModal,
    handleCancel,
    handleDelete,
  } = vm;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
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
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-gray-600 mb-3"
          >
            <ArrowLeft size={20} />
            <span>{getUIText("back", currentLanguage)}</span>
          </button>
          <h1 className="text-xl font-bold">
            {getUIText("myBookings", currentLanguage)}
          </h1>
          {totalUnreadChatCount > 0 && (
            <div className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2">
              <MessageCircle size={14} />
              {totalUnreadChatCount}{" "}
              {getUIText("unreadMessages", currentLanguage)}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-b border-gray-200 flex gap-2">
          {[
            { id: "active" as const, labelKey: "activeBookings" as const },
            { id: "closed" as const, labelKey: "closedHistory" as const },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium ${filter === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {getUIText(tab.labelKey, currentLanguage)} (
              {tab.id === "active" ? activeBookings.length : closedBookings.length}
              )
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => setSelectedBookingForDetails(booking)}
              className="border rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_COLORS[booking.status]}`}
                >
                  {bookingListStatusLabel(booking.status, currentLanguage)}
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
                    {booking.propertyTitle}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCancelModal(booking);
                    }}
                    className="text-red-500 text-xs font-bold"
                  >
                    {getUIText("cancel", currentLanguage)}
                  </button>
                )}

                {booking.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => {
                        if (booking.chatRoomId)
                          setActiveChatRoomId(booking.chatRoomId);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                    >
                      <MessageCircle size={14} />{" "}
                      {getUIText("chat", currentLanguage)}
                      {unreadCounts[booking.chatRoomId!] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCounts[booking.chatRoomId!]}
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
                    onClick={() => {
                      if (booking.chatRoomId)
                        setActiveChatRoomId(booking.chatRoomId);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                  >
                    <MessageCircle size={14} />{" "}
                    {getUIText("chat", currentLanguage)}
                    {unreadCounts[booking.chatRoomId!] > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCounts[booking.chatRoomId!]}
                      </span>
                    )}
                  </button>
                )}

                {booking.status === "cancelled" && (
                  <button
                    onClick={() => handleDelete(booking.id!)}
                    className="text-gray-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showCancelModal && selectedBookingForCancel && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-red-600">
                <AlertCircle /> {getUIText("cancellation", currentLanguage)}
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <p className="text-sm font-bold">
                  {selectedBookingForCancel.propertyTitle}
                </p>
                <p className="text-xs">
                  {formatPrice(
                    selectedBookingForCancel.totalPrice,
                    selectedBookingForCancel.priceUnit,
                  )}
                </p>
              </div>
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelAgreed}
                  onChange={(e) => setCancelCancelAgreed(e.target.checked)}
                />
                <span className="text-xs">
                  {getUIText("agreeCancellationPolicy", currentLanguage)}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => closeCancelModal()}
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold"
                >
                  {getUIText("back", currentLanguage)}
                </button>
                <button
                  onClick={() => handleCancel(selectedBookingForCancel.id!)}
                  disabled={!cancelAgreed}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {getUIText("confirm", currentLanguage)}
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
