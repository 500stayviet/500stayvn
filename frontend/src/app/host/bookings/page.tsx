/**
 * Host Bookings Page (예약 관리 페이지 - 임대인용)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOwnerBookings, BookingData, confirmBooking, cancelBooking, deleteBooking } from '@/lib/api/bookings';
import { getUnreadCountByRoom, getUnreadCountsByRole } from '@/lib/api/chat';
import { Calendar, Clock, User, Phone, MessageCircle, Check, X, Loader2, ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
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
  pending: { ko: '승인 대기 중', vi: 'Chờ duyệt', en: 'Pending' },
  confirmed: { ko: '확정됨', vi: 'Đã xác nhận', en: 'Confirmed' },
  cancelled: { ko: '취소됨', vi: 'Đã hủy', en: 'Cancelled' },
  completed: { ko: '완료됨', vi: 'Hoàn thành', en: 'Completed' },
};

export default function HostBookingsPage() {
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
      router.push('/login?returnUrl=' + encodeURIComponent('/host/bookings'));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;

      try {
        const data = await getOwnerBookings(user.uid);
        
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

        // 최신 순으로 정렬, 대기 중인 예약 우선
        setBookings(dataWithChatRooms.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }));
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
      setTotalUnreadChatCount(roleCounts.asOwner);

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

  const filteredBookings = bookings.filter(b => b.status === filter);

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

  const handleConfirm = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await confirmBooking(bookingId);
      
      // 가용 기간 재계산 및 세그먼트 분리 (Rule 1, 3)
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const { recalculateAndSplitProperty } = await import('@/lib/api/properties');
        await recalculateAndSplitProperty(booking.propertyId, bookingId);
      }
      
      // 예약 확정 시 채팅방이 없으면 생성
      if (booking && !booking.chatRoomId) {
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
        
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'confirmed' as const, chatRoomId: room.id } : b
        ));
      } else {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
        ));
      }
    } catch (error) {
      console.error('예약 확정 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 확정에 실패했습니다.' : 'Xác nhận thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleChat = async (booking: BookingData) => {
    if (booking.chatRoomId) {
      setActiveChatRoomId(booking.chatRoomId);
      return;
    }

    // 채팅방이 없는 경우 생성 후 이동
    setProcessingId(booking.id!);
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
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!cancelAgreed) {
      alert(currentLanguage === 'ko' ? '취소 정책에 동의해주세요.' : 'Vui lòng đồng ý với chính sách hủy.');
      return;
    }

    setProcessingId(bookingId);
    try {
      const { booking, relistResult } = await cancelBooking(bookingId, '임대인이 거절/취소함');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
      
      // 결과에 따른 알림 및 이동 처리 (Rule 5)
      if (relistResult) {
        let message = '';
        let targetTab = 'active';

        switch (relistResult.type) {
          case 'merged':
            message = currentLanguage === 'ko' 
              ? '취소된 기간이 기존 광고 중인 매물과 병합되었습니다.' 
              : 'Cancelled period merged with existing ad.';
            break;
          case 'relisted':
            message = currentLanguage === 'ko' 
              ? '예약이 취소되어 매물이 다시 광고 중입니다.' 
              : 'Property is back in advertising.';
            break;
          case 'limit_exceeded':
            message = currentLanguage === 'ko' 
              ? '광고 한도(5개) 초과로 인해 해당 매물은 광고종료 탭으로 이동되었습니다.' 
              : 'Moved to Expired Listings due to ad limit.';
            targetTab = 'deleted';
            break;
          case 'short_term':
            message = currentLanguage === 'ko' 
              ? '남은 가용 기간이 7일 미만이라 광고종료 탭으로 이동되었습니다.' 
              : 'Moved to Expired Listings (period < 7 days).';
            targetTab = 'deleted';
            break;
        }

        alert(message);
        router.push(`/profile/my-properties?tab=${targetTab}`);
      }

      setShowCancelModal(false);
      setSelectedBookingForCancel(null);
      setCancelCancelAgreed(false);
    } catch (error) {
      console.error('예약 거절/취소 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 거절/취소에 실패했습니다.' : 'Thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!bookingId || !confirm(currentLanguage === 'ko' ? '예약 기록을 영구적으로 삭제하시겠습니까?' : 'Do you want to permanently delete the booking record?')) return;
    
    setProcessingId(bookingId);
    try {
      await deleteBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 기록 삭제에 실패했습니다.' : 'Failed to delete record.');
    } finally {
      setProcessingId(null);
    }
  };

  const openCancelModal = (booking: BookingData) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
    setCancelCancelAgreed(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

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
            {currentLanguage === 'ko' ? '예약 관리' : 
             currentLanguage === 'vi' ? 'Quản lý đặt phòng' : 
             'Booking Management'}
          </h1>
          <div className="flex flex-col gap-1.5 mt-2">
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
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-orange-600">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' ? `${pendingCount}건의 승인 대기 중인 예약이 있습니다` : 
                   currentLanguage === 'vi' ? `Có ${pendingCount} đặt phòng đang chờ phê duyệt` : 
                   `${pendingCount} bookings waiting for approval`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 필터 */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex gap-2">
            {/* 승인 대기 버튼 */}
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currentLanguage === 'ko' ? '승인 대기' : 
               currentLanguage === 'vi' ? 'Chờ duyệt' : 'Pending'}
              {pendingCount > 0 && (
                <span className="ml-1">({pendingCount})</span>
              )}
            </button>
            
            {/* 확정됨 버튼 */}
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
            
            {/* 취소됨 버튼 */}
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'pending' 
                  ? (currentLanguage === 'ko' ? '승인 대기 중인 예약이 없습니다.' : 
                     currentLanguage === 'vi' ? 'Không có đặt phòng chờ duyệt.' : 
                     'No bookings waiting for approval.')
                  : filter === 'confirmed'
                  ? (currentLanguage === 'ko' ? '확정된 예약이 없습니다.' : 
                     currentLanguage === 'vi' ? 'Không có đặt phòng đã xác nhận.' : 
                     'No confirmed bookings.')
                  : (currentLanguage === 'ko' ? '취소된 예약이 없습니다.' : 
                     currentLanguage === 'vi' ? 'Không có đặt phòng đã hủy.' : 
                     'No cancelled bookings.')
                }
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-white border rounded-xl overflow-hidden cursor-pointer hover:border-blue-300 transition-all ${
                  booking.status === 'pending' ? 'border-orange-300 shadow-md' : 'border-gray-200'
                }`}
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
                  <div className="flex gap-3 mb-4">
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

                  {/* 예약자 정보 */}
                  <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                    <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-700">{booking.guestName}</span>
                      </div>
                      <span className="text-gray-500 text-[12px]">{booking.guestPhone}</span>
                    </div>
                    {booking.guestMessage && (
                      <p className="text-[11px] text-gray-400 italic">"{booking.guestMessage}"</p>
                    )}
                  </div>

                  {/* 액션 버튼: 하단에 간결하게 배치 */}
                  <div className="flex items-center justify-end gap-3 mt-4 w-full">
                    {/* 대화하기 버튼: 크기 최대화 및 위치 이동 */}
                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChat(booking);
                        }}
                        disabled={processingId === booking.id}
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

                    {/* 취소 버튼: 위치 이동 및 간결화 */}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(booking);
                        }}
                        disabled={processingId === booking.id}
                        className="px-2 py-1.5 text-red-500 text-[11px] font-bold hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {currentLanguage === 'ko' ? '예약 취소' : 
                         currentLanguage === 'vi' ? 'Hủy đặt phòng' : 
                         'Cancel Booking'}
                      </button>
                    )}
                    
                    {/* 승인 대기 상태의 버튼들: 이전 스타일로 복구 (나란히 배치) */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(booking.id!);
                          }}
                          disabled={processingId === booking.id}
                          className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-[12px] font-bold shadow-sm hover:bg-green-700 transition-all active:scale-95"
                        >
                          {currentLanguage === 'ko' ? '승인' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCancelModal(booking);
                          }}
                          disabled={processingId === booking.id}
                          className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[12px] font-bold shadow-sm hover:bg-red-600 transition-all active:scale-95"
                        >
                          {currentLanguage === 'ko' ? '거절' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {/* 취소된 예약에 삭제 버튼 추가 */}
                    {booking.status === 'cancelled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(booking.id!);
                        }}
                        disabled={processingId === booking.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title={currentLanguage === 'ko' ? '기록 삭제' : 'Delete record'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
                    {currentLanguage === 'ko' 
                      ? (selectedBookingForCancel.status === 'pending' ? '예약 거절 확인' : '확정 예약 취소 확인') 
                      : currentLanguage === 'vi'
                      ? (selectedBookingForCancel.status === 'pending' ? 'Xác nhận từ chối đặt phòng' : 'Xác nhận hủy đặt phòng đã xác nhận')
                      : (selectedBookingForCancel.status === 'pending' ? 'Reject Booking Confirmation' : 'Confirmed Booking Cancellation')}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      {selectedBookingForCancel.guestName}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedBookingForCancel.checkInDate)} ~ {formatDate(selectedBookingForCancel.checkOutDate)}
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {formatPrice(selectedBookingForCancel.totalPrice, selectedBookingForCancel.priceUnit)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 leading-relaxed space-y-1">
                      {selectedBookingForCancel.status === 'pending' ? (
                        <p>
                          {currentLanguage === 'ko' 
                            ? '• 게스트의 예약을 거절하시겠습니까? 거절 시 게스트에게 거절 알림이 전송됩니다.' 
                            : currentLanguage === 'vi'
                            ? '• Bạn có muốn từ chối đặt phòng của khách không? Thông báo từ chối sẽ được gửi cho khách.'
                            : '• Do you want to reject this booking? A rejection notification will be sent to the guest.'}
                        </p>
                      ) : (
                        <p>
                          {currentLanguage === 'ko'
                            ? '• 이미 확정된 예약을 취소하면 게스트에게 큰 불편을 줄 수 있습니다.'
                            : currentLanguage === 'vi'
                            ? '• Hủy đặt phòng đã xác nhận có thể gây bất tiện lớn cho khách.'
                            : '• Cancelling a confirmed booking may cause significant inconvenience to the guest.'}
                        </p>
                      )}
                      <p>
                        {currentLanguage === 'ko'
                          ? '• 취소/거절 시 해당 날짜는 즉시 다시 예약 가능 상태로 변경됩니다.'
                          : currentLanguage === 'vi'
                          ? '• Khi hủy/từ chối, ngày này sẽ lập tức trở lại trạng thái có thể đặt phòng.'
                          : '• Upon cancellation/rejection, the dates will immediately become available again.'}
                      </p>
                    </div>

                    <label className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={cancelAgreed}
                        onChange={(e) => setCancelCancelAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {currentLanguage === 'ko'
                          ? '위 주의사항을 인지했으며, 예약을 거절/취소하겠습니다.'
                          : currentLanguage === 'vi'
                          ? 'Tôi đã kiểm tra nội dung trên 및 đồng ý từ chối/hủy.'
                          : 'I have checked the above and agree to reject/cancel.'}
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
                  onClick={() => handleReject(selectedBookingForCancel.id!)}
                  disabled={!cancelAgreed || processingId === selectedBookingForCancel.id}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {processingId === selectedBookingForCancel.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    currentLanguage === 'ko' ? '확인' : currentLanguage === 'vi' ? 'Xác nhận' : 'Confirm'
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
