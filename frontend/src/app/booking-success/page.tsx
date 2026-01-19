/**
 * Booking Success Page (예약 완료 페이지)
 * 
 * - 예약 완료 확인
 * - 예약 정보 요약
 * - 다음 단계 안내
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBooking, BookingData } from '@/lib/api/bookings';
import { CheckCircle, Calendar, MapPin, Clock, Users, MessageCircle, Home, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import Image from 'next/image';

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { currentLanguage } = useLanguage();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        router.push('/');
        return;
      }

      try {
        const data = await getBooking(bookingId);
        if (data) {
          setBooking(data);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('예약 로드 실패:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  // 가격 포맷
  const formatPrice = (price: number, unit: string) => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={() => {}} />

        {/* 성공 모달 */}
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '결제가 완료되었습니다!' : 
                 currentLanguage === 'vi' ? 'Thanh toán thành công!' : 
                 'Payment Complete!'}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {currentLanguage === 'ko' 
                  ? '임대인의 승인을 기다리고 있습니다.'
                  : currentLanguage === 'vi'
                  ? 'Đang chờ chủ nhà phê duyệt.'
                  : 'Waiting for host approval.'
                }
              </p>
              <p className="text-xs text-gray-400 mb-6">
                {currentLanguage === 'ko' 
                  ? '승인이 완료되면 알림을 보내드립니다.'
                  : currentLanguage === 'vi'
                  ? 'Chúng tôi sẽ thông báo khi được phê duyệt.'
                  : 'We will notify you when approved.'
                }
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
              >
                {currentLanguage === 'ko' ? '확인' : currentLanguage === 'vi' ? 'Đã hiểu' : 'Got it'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 콘텐츠 */}
        <div className="p-4 space-y-4">
          {/* 예약 상태 */}
          <div className={`rounded-xl p-4 text-center ${
            booking.status === 'confirmed' 
              ? 'bg-green-50 border border-green-200' 
              : booking.status === 'cancelled'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-xs mb-1 ${
              booking.status === 'confirmed' 
                ? 'text-green-600' 
                : booking.status === 'cancelled'
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}>
              {currentLanguage === 'ko' 
                ? (booking.status === 'confirmed' ? '예약 확정' : booking.status === 'cancelled' ? '예약 취소됨' : '승인 대기 중')
                : (booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ phê duyệt')
              }
            </p>
            <p className={`text-lg font-bold ${
              booking.status === 'confirmed' 
                ? 'text-green-700' 
                : booking.status === 'cancelled'
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>{booking.id}</p>
          </div>

          {/* 매물 정보 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex gap-3">
              {booking.propertyImage && (
                <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
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
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(booking.checkInDate)} ~ {formatDate(booking.checkOutDate)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {currentLanguage === 'ko' 
                      ? `체크인 ${booking.checkInTime || '14:00'} · 체크아웃 ${booking.checkOutTime || '12:00'}`
                      : `Check-in ${booking.checkInTime || '14:00'} · Check-out ${booking.checkOutTime || '12:00'}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 예약 정보 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {currentLanguage === 'ko' ? '예약 정보' : 'Thông tin đặt phòng'}
            </h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{currentLanguage === 'ko' ? '예약자' : 'Người đặt'}</span>
              <span className="font-medium">{booking.guestName}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{currentLanguage === 'ko' ? '연락처' : 'Liên hệ'}</span>
              <span className="font-medium">{booking.guestPhone}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{currentLanguage === 'ko' ? '인원' : 'Số người'}</span>
              <span className="font-medium">
                {currentLanguage === 'ko' 
                  ? `성인 ${booking.adults}명${booking.children > 0 ? `, 어린이 ${booking.children}명` : ''}`
                  : `${booking.adults} adults${booking.children > 0 ? `, ${booking.children} children` : ''}`
                }
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{currentLanguage === 'ko' ? '숙박 기간' : 'Thời gian'}</span>
              <span className="font-medium">{booking.nights}{currentLanguage === 'ko' ? '박' : ' đêm'}</span>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">{currentLanguage === 'ko' ? '총 결제 금액' : 'Tổng tiền'}</span>
                <span className="font-bold text-blue-600">{formatPrice(booking.totalPrice, booking.priceUnit)}</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3 pt-4">
            {/* 채팅하기 버튼 */}
            <button
              onClick={() => {
                if (booking.chatRoomId) {
                  router.push(`/chat/${booking.chatRoomId}`);
                } else {
                  alert(currentLanguage === 'ko' 
                    ? '예약이 확정되면 채팅을 시작할 수 있습니다.' 
                    : 'Bạn có thể chat sau khi đặt phòng được xác nhận.');
                }
              }}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                booking.chatRoomId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!booking.chatRoomId}
            >
              <MessageCircle className="w-5 h-5" />
              {currentLanguage === 'ko' ? '임대인과 채팅하기' : 'Chat với chủ nhà'}
            </button>

            {/* 예약 내역 보기 */}
            <button
              onClick={() => router.push('/my-bookings')}
              className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              {currentLanguage === 'ko' ? '예약 내역 보기' : 'Xem lịch sử đặt phòng'}
            </button>

            {/* 홈으로 */}
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 border border-gray-200 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              {currentLanguage === 'ko' ? '홈으로 돌아가기' : 'Về trang chủ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
