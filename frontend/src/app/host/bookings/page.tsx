/**
 * Host Bookings Page (예약 관리 페이지 - 임대인용)
 */

"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getOwnerBookings,
  BookingData,
  confirmBooking,
  cancelBooking,
  deleteBooking,
} from "@/lib/api/bookings";
import { getUnreadCountByRoom, getUnreadCountsByRole } from "@/lib/api/chat";
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  Check,
  X,
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

// 새로운 상태별 색상 (Tailwind CSS 기준)
const STATUS_COLORS = {
  // 활성 예약 그룹
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300", // 예약 요청
  confirmed: "bg-green-100 text-green-800 border border-green-300", // 예약 확정
  
  // 종료 내역 그룹
  cancelled_before: "bg-gray-100 text-gray-700 border border-gray-300", // 요청 취소 (승인 전)
  cancelled_after: "bg-red-100 text-red-800 border border-red-300", // 예약 취소 (확정 후)
  completed: "bg-gray-100 text-gray-700 border border-gray-300",
};

// 새로운 상태 라벨 (다국어 지원)
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

// 취소 유형 판단 함수
const getCancellationType = (booking: BookingData): "cancelled_before" | "cancelled_after" => {
  // confirmedAt 필드가 있으면 확정 후 취소, 없으면 승인 전 취소
  return booking.confirmedAt ? "cancelled_after" : "cancelled_before";
};

// 1. 실제 로직이 담긴 컴포넌트 (BookingsContent)
function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
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
      : "active";
  const [filter, setFilter] = useState<"active" | "closed">(
    initialFilter,
  );

  useEffect(() => {
    const newTab = searchParams.get("tab");
    if (newTab === "active" || newTab === "closed") {
      setFilter(newTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?returnUrl=" + encodeURIComponent("/host/bookings"));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await getOwnerBookings(user.uid);
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
          dataWithChatRooms.sort((a, b) => {
            if (a.status === "pending" && b.status !== "pending") return -1;
            if (a.status !== "pending" && b.status === "pending") return 1;
            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          }),
        );
      } catch (error) {
        console.error("예약 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadBookings();
  }, [user]);

  useEffect(() => {
    if (!user || bookings.length === 0) return;
    const loadUnreadCounts = async () => {
      if (!user) return;
      const roleCounts = await getUnreadCountsByRole(user.uid);
      setTotalUnreadChatCount(roleCounts.asOwner);
      const counts: Record<string, number> = {};
      for (const booking of bookings) {
        if (booking.chatRoomId) {
          counts[booking.chatRoomId] = await getUnreadCountByRoom(
            booking.chatRoomId,
            user.uid,
          );
        }
      }
      setUnreadCounts(counts);
    };
    loadUnreadCounts();
    const handleMessageUpdate = () => loadUnreadCounts();
    window.addEventListener("chatMessagesUpdated", handleMessageUpdate);
    window.addEventListener("chatRoomsUpdated", handleMessageUpdate);
    return () => {
      window.removeEventListener("chatMessagesUpdated", handleMessageUpdate);
      window.removeEventListener("chatRoomsUpdated", handleMessageUpdate);
    };
  }, [user, bookings]);

  // 활성 예약: pending + confirmed 상태
  const activeBookings = bookings.filter((b) => 
    b.status === "pending" || b.status === "confirmed"
  );
  
  // 종료 내역: cancelled 상태
  const closedBookings = bookings.filter((b) => b.status === "cancelled");
  
  const filteredBookings = filter === "active" ? activeBookings : closedBookings;
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };
  const formatPrice = (price: number, unit: string) => {
    return unit === "vnd"
      ? `${price.toLocaleString("vi-VN")} VND`
      : `$${price.toLocaleString()}`;
  };

  const handleConfirm = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await confirmBooking(bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const { recalculateAndSplitProperty } =
          await import("@/lib/api/properties");
        await recalculateAndSplitProperty(booking.propertyId, bookingId);
        if (!booking.chatRoomId) {
          const { createChatRoom } = await import("@/lib/api/chat");
          const room = await createChatRoom({
            bookingId: booking.id!,
            propertyId: booking.propertyId,
            propertyTitle: booking.propertyTitle,
            propertyImage: booking.propertyImage,
            ownerId: booking.ownerId,
            ownerName: booking.ownerName,
            guestId: booking.guestId,
            guestName: booking.guestName,
          });
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId
                ? { ...b, status: "confirmed", chatRoomId: room.id }
                : b,
            ),
          );
        } else {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId ? { ...b, status: "confirmed" } : b,
            ),
          );
        }
      }
    } catch (error) {
      alert(
        currentLanguage === "ko"
          ? "예약 확정에 실패했습니다."
          : "Xác nhận thất bại.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleChat = async (booking: BookingData) => {
    if (booking.chatRoomId) {
      setActiveChatRoomId(booking.chatRoomId);
      return;
    }
    setProcessingId(booking.id!);
    try {
      const { createChatRoom } = await import("@/lib/api/chat");
      const room = await createChatRoom({
        bookingId: booking.id!,
        propertyId: booking.propertyId,
        propertyTitle: booking.propertyTitle,
        propertyImage: booking.propertyImage,
        ownerId: booking.ownerId,
        ownerName: booking.ownerName,
        guestId: booking.guestId,
        guestName: booking.guestName,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, chatRoomId: room.id } : b,
        ),
      );
      setActiveChatRoomId(room.id);
    } catch (error) {
      alert(
        currentLanguage === "ko"
          ? "채팅방을 열 수 없습니다."
          : "Không thể mở phòng chat.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!cancelAgreed) {
      alert(
        currentLanguage === "ko"
          ? "취소 정책에 동의해주세요."
          : "Vui lòng đồng ý với chính sách hủy.",
      );
      return;
    }
    setProcessingId(bookingId);
    try {
      const { relistResult } = await cancelBooking(
        bookingId,
        "임대인이 거절/취소함",
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      if (relistResult) {
        alert(
          currentLanguage === "ko"
            ? "매물 상태가 업데이트되었습니다."
            : "Status updated.",
        );
        router.push(`/profile/my-properties`);
      }
      setShowCancelModal(false);
    } catch (error) {
      alert("실패");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setProcessingId(bookingId);
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error) {
      alert("실패");
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

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
            <span>{currentLanguage === "ko" ? "뒤로" : "Back"}</span>
          </button>
          <h1 className="text-xl font-bold">
            {currentLanguage === "ko" ? "예약 관리" : "Booking Management"}
          </h1>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 flex gap-2">
          {[
            { id: "active", labelKey: "activeBookings" as const },
            { id: "closed", labelKey: "closedHistory" as const }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as "active" | "closed")}
              className={`px-3 py-2 rounded-full text-sm font-medium ${filter === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {tab.id === "active" 
                ? (currentLanguage === "ko" ? "활성 예약" : 
                   currentLanguage === "vi" ? "Đặt phòng đang hoạt động" :
                   currentLanguage === "en" ? "Active Bookings" :
                   currentLanguage === "ja" ? "アクティブな予約" : "活跃预订")
                : (currentLanguage === "ko" ? "종료 내역" :
                   currentLanguage === "vi" ? "Lịch sử đã đóng" :
                   currentLanguage === "en" ? "Closed History" :
                   currentLanguage === "ja" ? "終了済み履歴" : "已结束记录")
              }
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {filteredBookings.map((booking) => {
            // 상태별 배지 정보 결정
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
                className="bg-white border rounded-xl p-4 shadow-sm"
                onClick={() => setSelectedBookingForDetails(booking)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${statusColorClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="font-semibold truncate">
                  {booking.propertyAddress || booking.propertyTitle}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(booking.checkInDate)} -{" "}
                  {formatDate(booking.checkOutDate)}
                </p>
                <div className="mt-4 flex gap-2">
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(booking.id!);
                        }}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold"
                      >
                        승인
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingForCancel(booking);
                          setShowCancelModal(true);
                        }}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                      >
                        취소
                      </button>
                    </>
                  )}
                  {(booking.status === "confirmed" ||
                    booking.status === "completed") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChat(booking);
                      }}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      대화하기
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
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleReject(selectedBookingForCancel.id!)}
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

// 2. 외부로 내보내는 기본 컴포넌트 (Suspense 보호막 설치)
export default function HostBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
