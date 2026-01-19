/**
 * My Bookings Page (내 예약 내역 페이지 - 임차인용)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGuestBookings, BookingData, cancelBooking } from '@/lib/api/bookings';
import { Calendar, Clock, MapPin, MessageCircle, X, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import TopBar from '@/components/TopBar';
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
  const { currentLanguage } = useLanguage();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
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
        // 최신 순으로 정렬
        setBookings(data.sort((a, b) => 
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
    if (!confirm(currentLanguage === 'ko' ? '예약을 취소하시겠습니까?' : 'Bạn có chắc muốn hủy đặt phòng?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, '사용자 요청으로 취소');
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
    } catch (error) {
      console.error('예약 취소 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 취소에 실패했습니다.' : 'Hủy đặt phòng thất bại.');
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
            {currentLanguage === 'ko' ? '예약한 매물' : 
             currentLanguage === 'vi' ? 'Đặt phòng của tôi' : 
             'My Bookings'}
          </h1>
          {/* 상태별 안내 메시지 */}
          {bookings.filter(b => b.status === 'pending').length > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {currentLanguage === 'ko' 
                ? `${bookings.filter(b => b.status === 'pending').length}건이 승인대기 중입니다`
                : currentLanguage === 'vi'
                ? `${bookings.filter(b => b.status === 'pending').length} đặt phòng đang chờ duyệt`
                : `${bookings.filter(b => b.status === 'pending').length} booking(s) pending approval`
              }
            </p>
          )}
          {bookings.filter(b => b.status === 'confirmed').length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              {currentLanguage === 'ko' 
                ? `${bookings.filter(b => b.status === 'confirmed').length}건의 매물이 확정되었습니다`
                : currentLanguage === 'vi'
                ? `${bookings.filter(b => b.status === 'confirmed').length} đặt phòng đã được xác nhận`
                : `${bookings.filter(b => b.status === 'confirmed').length} booking(s) confirmed`
              }
            </p>
          )}
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
              {currentLanguage === 'ko' ? '진행 중' : 'Đang xử lý'}
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
              {currentLanguage === 'ko' ? '확정됨' : 'Đã xác nhận'}
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
              {currentLanguage === 'ko' ? '취소됨' : 'Đã hủy'}
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
                pending: currentLanguage === 'ko' ? '진행 중인 예약이 없습니다.' : 'Không có đặt phòng đang xử lý.',
                confirmed: currentLanguage === 'ko' ? '확정된 예약이 없습니다.' : 'Không có đặt phòng đã xác nhận.',
                cancelled: currentLanguage === 'ko' ? '취소된 예약이 없습니다.' : 'Không có đặt phòng đã hủy.',
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
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
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

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 mt-4">
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
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {currentLanguage === 'ko' ? '채팅' : 'Chat'}
                      </button>
                    )}
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancel(booking.id!)}
                        disabled={cancellingId === booking.id}
                        className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        {currentLanguage === 'ko' ? '취소' : 'Hủy'}
                      </button>
                    )}

                    <button
                      onClick={() => router.push(`/booking-success?bookingId=${booking.id}`)}
                      className="py-2 px-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
