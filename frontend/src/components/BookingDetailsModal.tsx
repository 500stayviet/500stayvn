/**
 * BookingDetailsModal Component
 * 
 * 예약 상세 내역을 보여주는 모달 컴포넌트
 */

'use client';

import { useState } from 'react';
import { BookingData } from '@/lib/api/bookings';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  X, Calendar, Clock, User, Phone, Home, 
  CreditCard, Copy, Check, Hash, Info, 
  ChevronRight, ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface BookingDetailsModalProps {
  booking: BookingData;
  onClose: () => void;
}

export default function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  const { currentLanguage } = useLanguage();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // 날짜 포맷 (DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 가격 포맷
  const formatPrice = (price: number, unit: string) => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  const copyIdToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyAddressToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // 결제 상세 계산
  const weeks = Math.ceil(booking.nights / 7);
  const pricePerWeek = booking.totalPrice / weeks;

  // 수수료 및 부가세 계산 (UI 표시용)
  const serviceFee = 0; // 0% 수수료
  const vat = 0; // 0% 부가세
  const basePrice = booking.totalPrice;

  const paymentMethodLabels: Record<string, { ko: string; vi: string; en: string }> = {
    momo: { ko: 'MoMo', vi: 'MoMo', en: 'MoMo' },
    zalopay: { ko: 'ZaloPay', vi: 'ZaloPay', en: 'ZaloPay' },
    bank_transfer: { ko: '계좌이체', vi: 'Chuyển khoản', en: 'Bank Transfer' },
    pay_at_property: { ko: '현장 결제', vi: 'Thanh toán tại chỗ', en: 'Pay at Property' }
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return '-';
    const label = paymentMethodLabels[method];
    return label ? (label[currentLanguage as keyof typeof label] || label.en) : method;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-[400px] max-h-[92vh] rounded-[32px] overflow-hidden shadow-xl flex flex-col border border-gray-100"
      >
        {/* 헤더 */}
        <div className="relative px-6 py-6 border-b border-gray-50 flex-shrink-0">
          <h2 className="text-[17px] font-semibold text-gray-900 text-center">
            {currentLanguage === 'ko' ? '예약 상세 내역' : 
             currentLanguage === 'vi' ? 'Chi tiết đặt phòng' : 
             'Booking Details'}
          </h2>
          <button 
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 stroke-[1.5]" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-6">
          
          {/* 기본 정보 (상태 & 예약번호) */}
          <div className="flex justify-between items-center py-4 border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                {currentLanguage === 'ko' ? '예약 번호' : 'Booking ID'}
              </span>
              <button 
                onClick={() => copyIdToClipboard(booking.id!)}
                className="flex items-center gap-1.5 group transition-colors"
              >
                <span className={`text-[15px] font-bold transition-colors ${copiedId ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}>
                  {booking.id}
                </span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 transition-colors stroke-[2]" />
                )}
              </button>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg inline-block ${
                booking.status === 'confirmed' 
                  ? 'bg-green-50 text-green-600' 
                  : booking.status === 'cancelled'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-orange-50 text-orange-600'
              }`}>
                {currentLanguage === 'ko' 
                  ? (booking.status === 'confirmed' ? '확정됨' : booking.status === 'cancelled' ? '취소됨' : '승인 대기 중')
                  : (booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'cancelled' ? 'Cancelled' : 'Pending')
                }
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {booking.createdAt && formatDate(booking.createdAt)}
              </p>
            </div>
          </div>

          {/* 숙소 정보 */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
              {currentLanguage === 'ko' ? '숙소 정보' : 'Property'}
            </h3>
            <div className="flex gap-4 items-start">
              {booking.propertyImage && (
                <div className="w-16 h-16 relative rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image src={booking.propertyImage} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <button 
                  onClick={() => copyAddressToClipboard(booking.propertyAddress || booking.propertyTitle || '')}
                  className="text-left group w-full"
                >
                  <p className={`text-[14px] font-bold leading-tight mb-1 transition-colors ${copiedAddress ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}>
                    {booking.propertyAddress || booking.propertyTitle}
                  </p>
                </button>
                <div className="text-[12px] text-gray-500 font-medium">
                  {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Check-in</p>
                <p className="text-[13px] font-bold text-gray-700">{booking.checkInTime || '14:00'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Check-out</p>
                <p className="text-[13px] font-bold text-gray-700">{booking.checkOutTime || '12:00'}</p>
              </div>
            </div>
          </section>

          {/* 예약자 정보 */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
              {currentLanguage === 'ko' ? '예약자 정보' : 'Guest'}
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 border border-gray-100 rounded-2xl">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{currentLanguage === 'ko' ? '성명' : 'Name'}</p>
                <p className="text-[13px] font-bold text-gray-900">{booking.guestName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{currentLanguage === 'ko' ? '연락처' : 'Phone'}</p>
                <p className="text-[13px] font-bold text-gray-900">{booking.guestPhone}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{currentLanguage === 'ko' ? '인원' : 'Guests'}</p>
                <p className="text-[13px] font-bold text-gray-900">
                  {currentLanguage === 'ko' ? `성인 ${booking.adults}, 아동 ${booking.children}` : `${booking.adults} Ad, ${booking.children} Ch`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{currentLanguage === 'ko' ? '기간' : 'Duration'}</p>
                <p className="text-[13px] font-bold text-gray-900">{booking.nights}{currentLanguage === 'ko' ? '박' : 'N'} ({weeks}W)</p>
              </div>
            </div>
          </section>

          {/* 결제 정보 */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                {currentLanguage === 'ko' ? '결제 정보' : 'Payment'}
              </h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                booking.paymentStatus === 'paid' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
              }`}>
                {booking.paymentStatus === 'paid' ? (currentLanguage === 'ko' ? '결제 완료' : 'Paid') : (currentLanguage === 'ko' ? '미결제' : 'Pending')}
              </span>
            </div>
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">{currentLanguage === 'ko' ? '결제 수단' : 'Method'}</span>
                <span className="font-bold">{getPaymentMethodLabel(booking.paymentMethod)}</span>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">{currentLanguage === 'ko' ? '숙박 요금' : 'Room Rate'}</span>
                  <span className="font-medium">{formatPrice(basePrice, booking.priceUnit)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">{currentLanguage === 'ko' ? '수수료 및 부가세' : 'Fees & VAT'}</span>
                  <span className="font-medium">{formatPrice(0, booking.priceUnit)}</span>
                </div>
                <div className="flex justify-between text-[15px] pt-2">
                  <span className="font-bold text-gray-900">{currentLanguage === 'ko' ? '합계' : 'Total'}</span>
                  <span className="font-black text-blue-600">{formatPrice(booking.totalPrice, booking.priceUnit)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="p-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-[15px] hover:bg-black transition-all"
          >
            {currentLanguage === 'ko' ? '확인' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
