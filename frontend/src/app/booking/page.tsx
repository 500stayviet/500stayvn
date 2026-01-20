/**
 * Booking Page (예약 페이지)
 * 
 * - 예약자 정보 입력
 * - 결제 수단 선택
 * - 예약 확정
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProperty, PropertyData, updateProperty } from '@/lib/api/properties';
import { createBooking, completePayment, confirmBooking } from '@/lib/api/bookings';
import { ArrowLeft, Calendar, Users, MapPin, Clock, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import TopBar from '@/components/TopBar';

// 결제 수단 옵션
const PAYMENT_METHODS = [
  { id: 'momo', name: 'MoMo', icon: '💜', color: 'bg-pink-500' },
  { id: 'zalopay', name: 'ZaloPay', icon: '💙', color: 'bg-blue-500' },
  { id: 'bank_transfer', name: { ko: '계좌이체', vi: 'Chuyển khoản', en: 'Bank Transfer' }, icon: '🏦', color: 'bg-green-500' },
  { id: 'pay_at_property', name: { ko: '현장 결제', vi: 'Thanh toán tại chỗ', en: 'Pay at Property' }, icon: '🏠', color: 'bg-orange-500' },
] as const;

// 국가 번호 목록
const COUNTRY_CODES = [
  { code: '+82', country: '🇰🇷', name: { ko: '한국', vi: 'Hàn Quốc', en: 'South Korea' } },
  { code: '+84', country: '🇻🇳', name: { ko: '베트남', vi: 'Việt Nam', en: 'Vietnam' } },
  { code: '+1', country: '🇺🇸', name: { ko: '미국', vi: 'Mỹ', en: 'USA' } },
  { code: '+81', country: '🇯🇵', name: { ko: '일본', vi: 'Nhật Bản', en: 'Japan' } },
  { code: '+86', country: '🇨🇳', name: { ko: '중국', vi: 'Trung Quốc', en: 'China' } },
  { code: '+65', country: '🇸🇬', name: { ko: '싱가포르', vi: 'Singapore', en: 'Singapore' } },
  { code: '+66', country: '🇹🇭', name: { ko: '태국', vi: 'Thái Lan', en: 'Thailand' } },
  { code: '+60', country: '🇲🇾', name: { ko: '말레이시아', vi: 'Malaysia', en: 'Malaysia' } },
  { code: '+63', country: '🇵🇭', name: { ko: '필리핀', vi: 'Philippines', en: 'Philippines' } },
  { code: '+62', country: '🇮🇩', name: { ko: '인도네시아', vi: 'Indonesia', en: 'Indonesia' } },
  { code: '+91', country: '🇮🇳', name: { ko: '인도', vi: 'Ấn Độ', en: 'India' } },
  { code: '+44', country: '🇬🇧', name: { ko: '영국', vi: 'Anh', en: 'UK' } },
  { code: '+49', country: '🇩🇪', name: { ko: '독일', vi: 'Đức', en: 'Germany' } },
  { code: '+33', country: '🇫🇷', name: { ko: '프랑스', vi: 'Pháp', en: 'France' } },
  { code: '+61', country: '🇦🇺', name: { ko: '호주', vi: 'Úc', en: 'Australia' } },
] as const;

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  // URL 파라미터에서 정보 가져오기
  const propertyId = searchParams.get('propertyId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');

  // 상태
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // 날짜 파싱
  const checkInDate = checkInParam ? new Date(checkInParam) : null;
  const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;

  // 예약자 정보
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    adults: 1,
    children: 0,
  });
  
  // 국가 번호 상태
  const [countryCode, setCountryCode] = useState('+84'); // 기본값: 베트남
  
  // 전화번호 상태 (포맷팅된 값)
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // 동의 체크박스 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // 전화번호 포맷팅 함수 (000-000-0000)
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 10자리까지만 허용
    const limited = numbers.slice(0, 10);
    
    // 포맷팅 적용
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };
  
  // 전화번호에서 숫자만 추출
  const getPhoneDigits = (formatted: string) => {
    return formatted.replace(/[^0-9]/g, '');
  };

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      // 비로그인 상태면 로그인 페이지로 리다이렉트
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, router]);

  // 매물 정보 로드
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) {
        router.push('/');
        return;
      }

      try {
        const data = await getProperty(propertyId);
        if (data) {
          setProperty(data);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('매물 로드 실패:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [propertyId, router]);

  // 가격 계산
  const calculatePrice = () => {
    if (!property || !checkInDate || !checkOutDate) return { nights: 0, weeks: 0, totalPrice: 0 };
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(nights / 7);
    const totalPrice = property.price * weeks;
    
    return { nights, weeks, totalPrice };
  };

  const { nights, weeks, totalPrice } = calculatePrice();

  // 날짜 포맷
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(
      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    if (property?.priceUnit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  // 예약 생성
  const handleCreateBooking = async () => {
    if (!property || !checkInDate || !checkOutDate || !user) return;

    setSubmitting(true);
    try {
      // 국가 번호 + 전화번호 합치기
      const fullPhoneNumber = `${countryCode} ${phoneNumber}`;
      
      const booking = await createBooking(
        {
          propertyId: property.id!,
          guestName: guestInfo.name,
          guestEmail: guestInfo.email,
          guestPhone: fullPhoneNumber,
          guestMessage: guestInfo.message,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          adults: guestInfo.adults,
          children: guestInfo.children,
        },
        {
          title: property.title,
          address: property.address,
          image: property.images?.[0],
          ownerId: property.ownerId || 'unknown',
          ownerName: undefined,
          price: property.price,
          priceUnit: property.priceUnit,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
        },
        user.uid
      );

      setBookingId(booking.id!);
      setStep('payment');
    } catch (error) {
      console.error('예약 생성 실패:', error);
      alert(currentLanguage === 'ko' ? '예약 생성에 실패했습니다.' : 'Đặt phòng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // 결제 수단 선택
  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  // 결제 완료 처리 (임시 - 실제 결제 연동 없이 바로 완료 처리)
  const handleCompletePayment = async () => {
    if (!bookingId || !selectedPaymentMethod || !property?.id) return;

    setSubmitting(true);
    try {
      // 결제 완료 처리 (pending 상태 유지, 결제 정보만 저장)
      await completePayment(bookingId, selectedPaymentMethod as BookingData['paymentMethod']);
      
      // 매물 상태를 'rented'로 변경하여 조회되지 않도록 함
      console.log('[Booking] Updating property status to rented:', property.id);
      await updateProperty(property.id, { status: 'rented' });
      console.log('[Booking] Property status updated successfully');
      
      setPaymentCompleted(true);
      // 바로 예약 완료 페이지로 이동 (pending 상태로 - 임대인 승인 대기)
      router.push(`/booking-success?bookingId=${bookingId}&new=true`);
    } catch (error) {
      console.error('결제 처리 실패:', error);
      alert(currentLanguage === 'ko' ? '결제 처리에 실패했습니다.' : 'Thanh toán thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // 전화번호 완성 여부 확인 (최소 7자리 이상)
  const isPhoneComplete = getPhoneDigits(phoneNumber).length >= 7;
  
  // 폼 유효성 검사 (이름, 전화번호, 동의 체크)
  const isFormValid = guestInfo.name.trim() !== '' && isPhoneComplete && agreeTerms;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property || !checkInDate || !checkOutDate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">
            {currentLanguage === 'ko' ? '잘못된 접근입니다.' : 'Truy cập không hợp lệ.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {currentLanguage === 'ko' ? '홈으로' : 'Về trang chủ'}
          </button>
        </div>
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {currentLanguage === 'ko' ? '뒤로' : currentLanguage === 'vi' ? 'Quay lại' : 'Back'}
            </span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {currentLanguage === 'ko' ? '예약하기' : currentLanguage === 'vi' ? 'Đặt phòng' : 'Book Now'}
          </h1>
        </div>

        {/* 매물 요약 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={property.images?.[0] || 'https://via.placeholder.com/80'}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{property.address || property.title}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(checkInDate)} ~ {formatDate(checkOutDate)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {currentLanguage === 'ko' 
                    ? `체크인 ${property.checkInTime || '14:00'} · 체크아웃 ${property.checkOutTime || '12:00'}`
                    : `Check-in ${property.checkInTime || '14:00'} · Check-out ${property.checkOutTime || '12:00'}`
                  }
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {formatPrice(totalPrice)} ({weeks}{currentLanguage === 'ko' ? '주' : ' tuần'})
              </p>
            </div>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'info' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {step === 'info' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium">{currentLanguage === 'ko' ? '정보 입력' : 'Thông tin'}</span>
            </div>
            <div className={`w-12 h-0.5 ${step === 'payment' ? 'bg-blue-400' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>2</div>
              <span className="text-sm font-medium">{currentLanguage === 'ko' ? '결제' : 'Thanh toán'}</span>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4 space-y-4">
          {step === 'info' && (
            <>
              {/* 예약자 정보 입력 */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {currentLanguage === 'ko' ? '예약자 정보' : 'Thông tin người đặt'}
                </h2>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '이름 *' : 'Họ tên *'}
                  </label>
                  <input
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                    placeholder={currentLanguage === 'ko' ? '홍길동' : 'Nguyễn Văn A'}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '이메일' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '전화번호 *' : 'Số điện thoại *'}
                  </label>
                  <div className="flex gap-2">
                    {/* 국가 번호 선택 */}
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-[120px] px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.country} {country.code}
                        </option>
                      ))}
                    </select>
                    {/* 전화번호 입력 (자동 000-000-0000 포맷) */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="000-000-0000"
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 인원 수 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '성인' : 'Người lớn'}
                    </label>
                    <select
                      value={guestInfo.adults}
                      onChange={(e) => setGuestInfo({ ...guestInfo, adults: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n}{currentLanguage === 'ko' ? '명' : ' người'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '어린이' : 'Trẻ em'}
                    </label>
                    <select
                      value={guestInfo.children}
                      onChange={(e) => setGuestInfo({ ...guestInfo, children: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n}{currentLanguage === 'ko' ? '명' : ' người'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '요청사항 (선택)' : 'Yêu cầu đặc biệt'}
                  </label>
                  <textarea
                    value={guestInfo.message}
                    onChange={(e) => setGuestInfo({ ...guestInfo, message: e.target.value })}
                    placeholder={currentLanguage === 'ko' ? '특별한 요청사항이 있으면 입력해주세요' : 'Nhập yêu cầu đặc biệt nếu có'}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* 결제 금액 표시 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {currentLanguage === 'ko' ? '숙박 기간' : 'Thời gian lưu trú'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {nights}{currentLanguage === 'ko' ? '박' : ' đêm'} ({weeks}{currentLanguage === 'ko' ? '주' : ' tuần'})
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {currentLanguage === 'ko' ? '주당 요금' : 'Giá mỗi tuần'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(property?.price || 0)}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">
                      {currentLanguage === 'ko' ? '총 결제 금액' : 'Tổng thanh toán'}
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 동의 체크박스 */}
              <div className="mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {currentLanguage === 'ko' 
                      ? '예약 정보가 정확함을 확인하였으며, 예약 취소 및 환불 정책에 동의합니다. 개인정보 수집 및 이용에 동의합니다.'
                      : 'Tôi xác nhận thông tin đặt phòng chính xác và đồng ý với chính sách hủy phòng và hoàn tiền. Tôi đồng ý với việc thu thập và sử dụng thông tin cá nhân.'}
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
              </div>

              {/* 결제하기 버튼 */}
              <button
                onClick={handleCreateBooking}
                disabled={!isFormValid || submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all mt-4 ${
                  isFormValid && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {currentLanguage === 'ko' ? '처리 중...' : 'Đang xử lý...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {currentLanguage === 'ko' ? '결제하기' : 'Thanh toán'}
                  </span>
                )}
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="text-center py-4">
                <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {currentLanguage === 'ko' ? '결제 수단 선택' : 'Chọn phương thức thanh toán'}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentLanguage === 'ko' ? '결제 수단을 선택 후 결제 완료 버튼을 눌러주세요' : 'Chọn phương thức và nhấn nút thanh toán'}
                </p>
              </div>

              {/* 결제 금액 표시 */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{currentLanguage === 'ko' ? '결제 금액' : 'Số tiền'}</span>
                  <span className="text-xl font-bold text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* 결제 수단 선택 */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectPaymentMethod(method.id)}
                    disabled={submitting}
                    className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors disabled:opacity-50 ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-medium text-gray-900 flex-1 text-left">
                      {typeof method.name === 'string' 
                        ? method.name 
                        : method.name[currentLanguage as keyof typeof method.name] || method.name.en
                      }
                    </span>
                    {selectedPaymentMethod === method.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* 결제 완료 버튼 */}
              <button
                onClick={handleCompletePayment}
                disabled={!selectedPaymentMethod || submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                  selectedPaymentMethod && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {currentLanguage === 'ko' ? '결제 중...' : 'Đang thanh toán...'}
                  </span>
                ) : (
                  currentLanguage === 'ko' ? '결제 완료' : 'Hoàn tất thanh toán'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {currentLanguage === 'ko' 
                  ? '* 결제 완료 후 임대인 승인을 기다려주세요'
                  : '* Sau khi thanh toán, vui lòng chờ chủ nhà phê duyệt'
                }
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
