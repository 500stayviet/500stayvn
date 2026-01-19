/**
 * Host Bookings Page (예약 관리 페이지 - 임대인용)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOwnerBookings, BookingData, confirmBooking, cancelBooking } from '@/lib/api/bookings';
import { Calendar, Clock, User, Phone, MessageCircle, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Image from 'next/image';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS = {
  pending: { ko: '승인 대기', vi: 'Chờ duyệt', en: 'Pending' },
  confirmed: { ko: '확정됨', vi: 'Đã xác nhận', en: 'Confirmed' },
  cancelled: { ko: '취소됨', vi: 'Đã hủy', en: 'Cancelled' },
  completed: { ko: '완료됨', vi: 'Hoàn thành', en: 'Completed' },
};

export default function HostBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
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
        // 최신 순으로 정렬, 대기 중인 예약 우선
        setBookings(data.sort((a, b) => {
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
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
      ));
    } catch (error) {
      console.error('예약 확정 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 확정에 실패했습니다.' : 'Xác nhận thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!confirm(currentLanguage === 'ko' ? '예약을 거절하시겠습니까?' : 'Bạn có chắc muốn từ chối?')) {
      return;
    }

    setProcessingId(bookingId);
    try {
      await cancelBooking(bookingId, '임대인이 거절함');
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
    } catch (error) {
      console.error('예약 거절 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 거절에 실패했습니다.' : 'Từ chối thất bại.');
    } finally {
      setProcessingId(null);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={() => {}} />

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
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {currentLanguage === 'ko' 
                ? `${pendingCount}건의 승인 대기 중인 예약이 있습니다`
                : `${pendingCount} bookings waiting for approval`
              }
            </p>
          )}
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
              {currentLanguage === 'ko' ? '승인 대기' : 'Chờ duyệt'}
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
              {currentLanguage === 'ko' ? '확정됨' : 'Đã xác nhận'}
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
              {currentLanguage === 'ko' ? '취소됨' : 'Đã hủy'}
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
                  ? (currentLanguage === 'ko' ? '승인 대기 중인 예약이 없습니다.' : 'Không có đặt phòng chờ duyệt.')
                  : filter === 'confirmed'
                  ? (currentLanguage === 'ko' ? '확정된 예약이 없습니다.' : 'Không có đặt phòng đã xác nhận.')
                  : (currentLanguage === 'ko' ? '취소된 예약이 없습니다.' : 'Không có đặt phòng đã hủy.')
                }
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-white border rounded-xl overflow-hidden ${
                  booking.status === 'pending' ? 'border-orange-300 shadow-md' : 'border-gray-200'
                }`}
              >
                {/* 예약 상태 */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
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
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.propertyAddress || booking.propertyTitle}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(booking.checkInDate)} ~ {formatDate(booking.checkOutDate)}</span>
                      </div>
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        {formatPrice(booking.totalPrice, booking.priceUnit)}
                      </p>
                    </div>
                  </div>

                  {/* 예약자 정보 */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.guestName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{booking.guestPhone}</span>
                    </div>
                    {booking.guestMessage && (
                      <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        "{booking.guestMessage}"
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 mt-4">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(booking.id!)}
                          disabled={processingId === booking.id}
                          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {processingId === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {currentLanguage === 'ko' ? '승인' : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => handleReject(booking.id!)}
                          disabled={processingId === booking.id}
                          className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          {currentLanguage === 'ko' ? '거절' : 'Từ chối'}
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          // 채팅방으로 이동
                          if (booking.chatRoomId) {
                            router.push(`/chat/${booking.chatRoomId}`);
                          } else {
                            router.push('/chat');
                          }
                        }}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {currentLanguage === 'ko' ? '채팅하기' : 'Chat'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
