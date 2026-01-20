/**
 * My Bookings Page (내 예약 내역 페이지 - 임차인용)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGuestBookings, BookingData, cancelBooking } from '@/lib/api/bookings';
import { getUnreadCountByRoom, getUnreadCountsByRole } from '@/lib/api/chat';
import { Calendar, Clock, MapPin, MessageCircle, Check, CheckCircle, X, Loader2, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import TopBar from '@/components/TopBar';
import ChatModal from '@/components/ChatModal';
import BookingDetailsModal from '@/components/BookingDetailsModal';
import Image from 'next/image';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS = {
  pending: { ko: '승인 대기 중', vi: 'Chờ phê duyệt', en: 'Pending Approval' },
  confirmed: { ko: '확정됨', vi: 'Đã xác nhận', en: 'Confirmed' },
  cancelled: { ko: '취소됨', vi: 'Đã hủy', en: 'Cancelled' },
  completed: { ko: '완료됨', vi: 'Hoàn thành', en: 'Completed' },
};

export default function MyBookingsPage() {
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
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<BookingData | null>(null);
  const [cancelAgreed, setCancelCancelAgreed] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<BookingData | null>(null);
  
  // URL의 tab 파라미터에서 초기 필터 값 가져오기
  const tabParam = searchParams.get('tab');
  const initialFilter = (tabParam === 'pending' || tabParam === 'confirmed' || tabParam === 'cancelled') 
    ? tabParam 
    : 'pending';
  const [filter, setFilter] = useState<'pending' | 'confirmed' | 'cancelled'>(initialFilter);
  
  // URL 파라미터 변경 시 필터 업데이트
  useEffect(() => {
    const newTab = searchParams.get('tab');
    if (newTab === 'pending' || newTab === 'confirmed' || newTab === 'cancelled') {
      setFilter(newTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=' + encodeURIComponent('/my-bookings'));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;

      try {
        const data = await getGuestBookings(user.uid);
        
        // 채팅방 ID가 없는 기존 예약들에 대해 채팅방 확인 및 복구
        const dataWithChatRooms = await Promise.all(data.map(async (booking) => {
          if (!booking.chatRoomId) {
            const { getChatRoomByBookingId } = await import('@/lib/api/chat');
            const room = await getChatRoomByBookingId(booking.id!);
            if (room) {
              return { ...booking, chatRoomId: room.id };
            }
          }
          return booking;
        }));

        // 최신 순으로 정렬
        setBookings(dataWithChatRooms.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ));
      } catch (error) {
        console.error('예약 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBookings();
    }
  }, [user]);

  // 각 예약의 채팅방 읽지 않은 메시지 수 로드
  useEffect(() => {
    if (!user || bookings.length === 0) return;

    const loadUnreadCounts = async () => {
      if (!user) return;
      
      const roleCounts = await getUnreadCountsByRole(user.uid);
      setTotalUnreadChatCount(roleCounts.asGuest);

      const counts: Record<string, number> = {};
      for (const booking of bookings) {
        if (booking.chatRoomId) {
          counts[booking.chatRoomId] = await getUnreadCountByRoom(booking.chatRoomId, user.uid);
        }
      }
      setUnreadCounts(counts);
    };

    loadUnreadCounts();

    // 메시지 업데이트 이벤트 구독
    const handleMessageUpdate = () => loadUnreadCounts();
    window.addEventListener('chatMessagesUpdated', handleMessageUpdate);
    window.addEventListener('chatRoomsUpdated', handleMessageUpdate);

    return () => {
      window.removeEventListener('chatMessagesUpdated', handleMessageUpdate);
      window.removeEventListener('chatRoomsUpdated', handleMessageUpdate);
    };
  }, [user, bookings]);

  // 베트남식 날짜/시간 포맷 (DD/MM/YYYY HH:mm)
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  // 날짜만 포맷 (체크인/체크아웃용)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  const handleCancel = async (bookingId: string) => {
    if (!cancelAgreed) {
      alert(currentLanguage === 'ko' ? '취소 정책에 동의해주세요.' : 'Vui lòng đồng ý với chính sách hủy.');
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, '사용자 요청으로 취소');
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
      setShowCancelModal(false);
      setSelectedBookingForCancel(null);
      setCancelCancelAgreed(false);
    } catch (error) {
      console.error('예약 취소 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 취소에 실패했습니다.' : 'Hủy đặt phòng thất bại.');
    } finally {
      setCancellingId(null);
    }
  };

  const openCancelModal = (booking: BookingData) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
    setCancelCancelAgreed(false);
  };

  const handleChat = async (booking: BookingData) => {
    if (booking.chatRoomId) {
      setActiveChatRoomId(booking.chatRoomId);
      return;
    }

    // 채팅방이 없는 경우 생성
    setCancellingId(booking.id!); // 공유 중인 로딩 상태 사용
    try {
      const { createChatRoom } = await import('@/lib/api/chat');
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
      
      // 상태 업데이트
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, chatRoomId: room.id } : b
      ));
      
      setActiveChatRoomId(room.id);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert(currentLanguage === 'ko' ? '채팅방을 열 수 없습니다.' : 'Không thể mở phòng chat.');
    } finally {
      setCancellingId(null);
    }
  };

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
          hideLanguageSelector={false}
        />

        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">
              {currentLanguage === 'ko' ? '뒤로' : currentLanguage === 'vi' ? 'Quay lại' : 'Back'}
            </span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {currentLanguage === 'ko' ? '예약한 매물' : 
             currentLanguage === 'vi' ? 'Đặt phòng của tôi' : 
             'My Bookings'}
          </h1>
          
          <div className="flex flex-col gap-1.5 mt-2">
            {/* 읽지 않은 채팅 알림 */}
            {totalUnreadChatCount > 0 && (
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' ? `${totalUnreadChatCount}통의 읽지 않은 메시지가 있습니다` : 
                   currentLanguage === 'vi' ? `Có ${totalUnreadChatCount} tin nhắn chưa đọc` : 
                   `You have ${totalUnreadChatCount} unread message(s)`}
                </span>
              </div>
            )}

            {/* 승인 대기 알림 */}
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-orange-600">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' 
                    ? `${bookings.filter(b => b.status === 'pending').length}건이 승인 대기 중입니다`
                    : currentLanguage === 'vi'
                    ? `Có ${bookings.filter(b => b.status === 'pending').length} đặt phòng đang chờ duyệt`
                    : `${bookings.filter(b => b.status === 'pending').length} booking(s) pending approval`
                  }
                </span>
              </div>
            )}

            {/* 확정 알림 */}
            {bookings.filter(b => b.status === 'confirmed').length > 0 && (
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' 
                    ? `${bookings.filter(b => b.status === 'confirmed').length}건의 매물이 확정되었습니다`
                    : currentLanguage === 'vi'
                    ? `Có ${bookings.filter(b => b.status === 'confirmed').length} đặt phòng đã được xác nhận`
                    : `${bookings.filter(b => b.status === 'confirmed').length} booking(s) confirmed`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currentLanguage === 'ko' ? '진행 중' : 
               currentLanguage === 'vi' ? 'Đang xử lý' : 'Processing'}
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="ml-1">({bookings.filter(b => b.status === 'pending').length})</span>
              )}
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currentLanguage === 'ko' ? '확정됨' : 
               currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed'}
              {bookings.filter(b => b.status === 'confirmed').length > 0 && (
                <span className="ml-1">({bookings.filter(b => b.status === 'confirmed').length})</span>
              )}
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currentLanguage === 'ko' ? '취소됨' : 
               currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}
              {bookings.filter(b => b.status === 'cancelled').length > 0 && (
                <span className="ml-1">({bookings.filter(b => b.status === 'cancelled').length})</span>
              )}
            </button>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="p-4 space-y-4">
          {(() => {
            const filteredBookings = bookings.filter(b => b.status === filter);
            
            if (filteredBookings.length === 0) {
              const emptyMessages = {
                pending: currentLanguage === 'ko' ? '진행 중인 예약이 없습니다.' : 
                         currentLanguage === 'vi' ? 'Không có đặt phòng đang xử lý.' : 
                         'No processing bookings.',
                confirmed: currentLanguage === 'ko' ? '확정된 예약이 없습니다.' : 
                           currentLanguage === 'vi' ? 'Không có đặt phòng đã xác nhận.' : 
                           'No confirmed bookings.',
                cancelled: currentLanguage === 'ko' ? '취소된 예약이 없습니다.' : 
                           currentLanguage === 'vi' ? 'Không có đặt phòng đã hủy.' : 
                           'No cancelled bookings.',
              };
              
              return (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{emptyMessages[filter]}</p>
                  {filter === 'pending' && (
                    <button
                      onClick={() => router.push('/')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      {currentLanguage === 'ko' ? '매물 둘러보기' : 'Khám phá'}
                    </button>
                  )}
                </div>
              );
            }
            
            return filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setSelectedBookingForDetails(booking)}
              >
                {/* 예약 상태 */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[booking.status]}`}>
                    {STATUS_LABELS[booking.status][currentLanguage as keyof typeof STATUS_LABELS['pending']] || STATUS_LABELS[booking.status].en}
                  </span>
                  <span className="text-xs text-gray-500">
                    {booking.createdAt && formatDateTime(booking.createdAt)}
                  </span>
                </div>

                {/* 매물 정보 */}
                <div className="p-4">
                  <div className="flex gap-3">
                    {booking.propertyImage && (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={booking.propertyImage}
                          alt={booking.propertyTitle || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {booking.propertyAddress || booking.propertyTitle}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                      </div>
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        {formatPrice(booking.totalPrice, booking.priceUnit)}
                      </p>
                    </div>
                  </div>

                  {/* 액션 버튼: 하단에 간결하게 배치 */}
                  <div className="flex items-center justify-end gap-3 mt-4 w-full">
                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChat(booking);
                        }}
                        disabled={cancellingId === booking.id}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all active:scale-95 relative"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {currentLanguage === 'ko' ? '대화하기' : 'Chat'}
                        
                        {booking.chatRoomId && unreadCounts[booking.chatRoomId] > 0 && (
                          <span className="absolute -top-2 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                            {unreadCounts[booking.chatRoomId]}
                          </span>
                        )}
                      </button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(booking);
                        }}
                        disabled={cancellingId === booking.id}
                        className="px-2 py-1.5 text-red-500 text-[11px] font-bold hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {currentLanguage === 'ko' ? '예약 취소 및 환불' : 
                         currentLanguage === 'vi' ? 'Hủy & hoàn tiền' : 
                         'Cancel & Refund'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>

        {/* 취소 확인 모달 */}
        {showCancelModal && selectedBookingForCancel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <div className="p-2 bg-red-50 rounded-full">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">
                    {currentLanguage === 'ko' ? '예약 취소 및 환불 확인' : 
                     currentLanguage === 'vi' ? 'Xác nhận hủy và hoàn tiền' : 
                     'Cancellation & Refund Confirmation'}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {selectedBookingForCancel.propertyTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedBookingForCancel.checkInDate)} ~ {formatDate(selectedBookingForCancel.checkOutDate)}
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {formatPrice(selectedBookingForCancel.totalPrice, selectedBookingForCancel.priceUnit)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {currentLanguage === 'ko' 
                        ? '• 예약 취소 시 숙소 환불 정책에 따라 취소 수수료가 발생할 수 있습니다.'
                        : currentLanguage === 'vi'
                        ? '• Phí hủy có thể phát sinh theo chính sách hoàn tiền của chỗ nghỉ.'
                        : '• Cancellation fees may apply according to the property\'s refund policy.'}
                      <br />
                      {currentLanguage === 'ko'
                        ? '• 취소 후에는 해당 예약 번호로 다시 이용할 수 없으며 복구가 불가능합니다.'
                        : currentLanguage === 'vi'
                        ? '• Sau khi hủy, không thể sử dụng lại mã đặt phòng này 및 không thể phục hồi.'
                        : '• Once cancelled, this booking cannot be restored or reused.'}
                    </p>

                    <label className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={cancelAgreed}
                        onChange={(e) => setCancelCancelAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {currentLanguage === 'ko'
                          ? '환불 정책을 확인했으며, 예약 취소에 동의합니다.'
                          : currentLanguage === 'vi'
                          ? 'Tôi đã kiểm tra chính sách hoàn tiền 및 đồng ý hủy.'
                          : 'I have checked the refund policy and agree to cancel.'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {currentLanguage === 'ko' ? '닫기' : currentLanguage === 'vi' ? 'Đóng' : 'Close'}
                </button>
                <button
                  onClick={() => handleCancel(selectedBookingForCancel.id!)}
                  disabled={!cancelAgreed || cancellingId === selectedBookingForCancel.id}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {cancellingId === selectedBookingForCancel.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    currentLanguage === 'ko' ? '취소확정' : currentLanguage === 'vi' ? 'Xác nhận hủy' : 'Confirm Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 채팅 모달 */}
        {activeChatRoomId && (
          <ChatModal 
            roomId={activeChatRoomId} 
            onClose={() => setActiveChatRoomId(null)} 
          />
        )}
        {/* 예약 상세 모달 */}
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
