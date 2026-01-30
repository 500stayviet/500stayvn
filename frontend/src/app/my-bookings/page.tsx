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
import { getUIText } from "@/utils/i18n";

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
    tabParam === "active" || tabParam === "closed"
      ? tabParam
      : tabParam === "pending" || tabParam === "confirmed"
        ? "active"
        : tabParam === "cancelled"
          ? "closed"
          : "active";
  const [filter, setFilter] = useState<"active" | "closed">(initialFilter);

  useEffect(() => {
    const newTab = searchParams.get("tab");
    if (newTab === "active" || newTab === "closed") setFilter(newTab);
    else if (newTab === "pending" || newTab === "confirmed") setFilter("active");
    else if (newTab === "cancelled") setFilter("closed");
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

  // 활성 예약: 승인대기 + 예약확정 (임대인 예약관리와 동일 구조)
  const activeBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const activeBookingsSorted = [...activeBookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });
  // 종료 내역: 취소됨, 완료됨
  const closedBookings = bookings.filter(
    (b) => b.status === "cancelled" || b.status === "completed",
  );
  const filteredBookings =
    filter === "active" ? activeBookingsSorted : closedBookings;

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
            <span>{getUIText('back', currentLanguage)}</span>
          </button>
          <h1 className="text-xl font-bold">
            {getUIText('myBookings', currentLanguage)}
          </h1>
          {totalUnreadChatCount > 0 && (
            <div className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2">
              <MessageCircle size={14} />
              {totalUnreadChatCount} {getUIText('unreadMessages', currentLanguage)}
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
              onClick={() => {
                setFilter(tab.id);
                router.replace(`/my-bookings?tab=${tab.id}`, { scroll: false });
              }}
              className={`px-3 py-2 rounded-full text-sm font-medium ${filter === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {getUIText(tab.labelKey, currentLanguage)} (
              {tab.id === "active" ? activeBookings.length : closedBookings.length})
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
                  {/* 임차인 예약확정 UI 기준: 풀 컬러 버튼 + 텍스트 버튼 */}
                  
                  {/* 승인대기중(pending): 취소 버튼만 (텍스트) - 승인은 임대인만 가능 */}
                  {booking.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookingForCancel(booking);
                        setShowCancelModal(true);
                      }}
                      className="text-red-500 text-xs font-bold"
                    >
                      {getUIText('cancel', currentLanguage)}
                    </button>
                  )}
                  
                  {/* 예약확정(confirmed): 채팅 버튼 (풀 컬러) + 취소 버튼 (텍스트) */}
                  {booking.status === "confirmed" && (
                    <>
                      <button
                        onClick={() => {
                          if (booking.chatRoomId)
                            setActiveChatRoomId(booking.chatRoomId);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                      >
                        <MessageCircle size={14} /> {getUIText('chat', currentLanguage)}
                        {unreadCounts[booking.chatRoomId!] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[booking.chatRoomId!]}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingForCancel(booking);
                          setShowCancelModal(true);
                        }}
                        className="text-red-500 text-xs font-bold"
                      >
                        {getUIText('cancel', currentLanguage)}
                      </button>
                    </>
                  )}
                  
                  {/* 완료됨(completed): 채팅 버튼 (풀 컬러) */}
                  {booking.status === "completed" && (
                    <button
                      onClick={() => {
                        if (booking.chatRoomId)
                          setActiveChatRoomId(booking.chatRoomId);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 relative"
                    >
                      <MessageCircle size={14} /> {getUIText('chat', currentLanguage)}
                      {unreadCounts[booking.chatRoomId!] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCounts[booking.chatRoomId!]}
                        </span>
                      )}
                    </button>
                  )}
                  
                  {/* 취소됨(cancelled): 삭제 버튼 */}
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
                <AlertCircle /> {getUIText('cancellation', currentLanguage)}
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
                  {getUIText('agreeCancellationPolicy', currentLanguage)}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold"
                >
                  {getUIText('back', currentLanguage)}
                </button>
                <button
                  onClick={() => handleCancel(selectedBookingForCancel.id!)}
                  disabled={!cancelAgreed}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {getUIText('confirm', currentLanguage)}
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
