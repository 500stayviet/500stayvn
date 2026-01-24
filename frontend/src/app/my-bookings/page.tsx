/**
 * My Bookings Page (내 예약 내역 페이지 - Suspense 적용 버전)
 */

"use client";

import { useState, useEffect, Suspense } from "react"; // Suspense 추가
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getGuestBookings,
  BookingData,
  cancelBooking,
  deleteBooking,
} from "@/lib/api/bookings";
import { getUnreadCountByRoom, getUnreadCountsByRole } from "@/lib/api/chat";
import {
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Trash2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import ChatModal from "@/components/ChatModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import Image from "next/image";
import { SupportedLanguage } from "@/lib/api/translation";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<
  "pending" | "confirmed" | "cancelled" | "completed",
  Record<SupportedLanguage, string>
> = {
  pending: {
    ko: "승인 대기 중",
    vi: "Chờ phê duyệt",
    en: "Pending Approval",
    ja: "承認待ち",
    zh: "待批准",
  },
  confirmed: {
    ko: "확정됨",
    vi: "Đã xác nhận",
    en: "Confirmed",
    ja: "確定済み",
    zh: "已确认",
  },
  cancelled: {
    ko: "취소됨",
    vi: "Đã hủy",
    en: "Cancelled",
    ja: "キャンセル済み",
    zh: "已取消",
  },
  completed: {
    ko: "완료됨",
    vi: "Hoàn thành",
    en: "Completed",
    ja: "完了済み",
    zh: "已完成",
  },
};

// 1. 실제 로직이 들어있는 알맹이 컴포넌트
function BookingListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<BookingData | null>(null);
  const [cancelAgreed, setCancelCancelAgreed] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<BookingData | null>(null);

  const tabParam = searchParams.get("tab");
  const initialFilter =
    tabParam === "pending" ||
    tabParam === "confirmed" ||
    tabParam === "cancelled"
      ? tabParam
      : "pending";
  const [filter, setFilter] = useState<"pending" | "confirmed" | "cancelled">(
    initialFilter,
  );

  useEffect(() => {
    const newTab = searchParams.get("tab");
    if (
      newTab === "pending" ||
      newTab === "confirmed" ||
      newTab === "cancelled"
    ) {
      setFilter(newTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?returnUrl=" + encodeURIComponent("/my-bookings"));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await getGuestBookings(user.uid);
        const dataWithChatRooms = await Promise.all(
          data.map(async (booking) => {
            if (!booking.chatRoomId) {
              const { getChatRoomByBookingId } = await import("@/lib/api/chat");
              const room = await getChatRoomByBookingId(booking.id!);
              if (room) return { ...booking, chatRoomId: room.id };
            }
            return booking;
          }),
        );
        setBookings(
          dataWithChatRooms.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          ),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadBookings();
  }, [user]);

  useEffect(() => {
    if (!user || bookings.length === 0) return;
    const loadUnreadCounts = async () => {
      const roleCounts = await getUnreadCountsByRole(user.uid);
      setTotalUnreadChatCount(roleCounts.asGuest);
      const counts: Record<string, number> = {};
      for (const booking of bookings) {
        if (booking.chatRoomId)
          counts[booking.chatRoomId] = await getUnreadCountByRoom(
            booking.chatRoomId,
            user.uid,
          );
      }
      setUnreadCounts(counts);
    };
    loadUnreadCounts();
  }, [user, bookings]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();
  const formatPrice = (p: number, u: string) =>
    u === "vnd" ? `${p.toLocaleString()} VND` : `$${p.toLocaleString()}`;

  const handleCancel = async (bookingId: string) => {
    if (!cancelAgreed) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, "사용자 요청");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      setShowCancelModal(false);
    } catch (error) {
      alert("Error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

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
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold">
            {currentLanguage === "ko" ? "예약한 매물" : "My Bookings"}
          </h1>
          {totalUnreadChatCount > 0 && (
            <div className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2">
              <MessageCircle size={14} />
              {totalUnreadChatCount} unread messages
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-b flex gap-2">
          {(["pending", "confirmed", "cancelled"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold ${filter === t ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            >
              {t.toUpperCase()} ({bookings.filter((b) => b.status === t).length}
              )
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {bookings
            .filter((b) => b.status === filter)
            .map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBookingForDetails(booking)}
                className="border rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_COLORS[booking.status]}`}
                  >
                    {STATUS_LABELS[booking.status][currentLanguage]}
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
                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        if (booking.chatRoomId)
                          setActiveChatRoomId(booking.chatRoomId);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle size={14} /> Chat{" "}
                      {unreadCounts[booking.chatRoomId!] > 0 &&
                        `(${unreadCounts[booking.chatRoomId!]})`}
                    </button>
                  )}
                  {(booking.status === "pending" ||
                    booking.status === "confirmed") && (
                    <button
                      onClick={() => {
                        setSelectedBookingForCancel(booking);
                        setShowCancelModal(true);
                      }}
                      className="text-red-500 text-xs font-bold"
                    >
                      Cancel
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
                <AlertCircle /> Cancellation
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
                  I agree to the cancellation policy
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => handleCancel(selectedBookingForCancel.id!)}
                  disabled={!cancelAgreed}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Confirm
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

// 2. 외부용 메인 컴포넌트
export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingListContent />
    </Suspense>
  );
}
