'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Bed, 
  Bath, 
} from 'lucide-react';
import { PropertyData } from '@/lib/api/properties';
import { getPropertyBookings, toISODateString } from '@/lib/api/bookings';
import CalendarComponent from '@/components/CalendarComponent';
import { useAuth } from '@/hooks/useAuth';
import { AMENITY_OPTIONS } from '@/lib/constants/amenities';
import { 
  formatFullPrice, 
  parseDate, 
  isAvailableNow, 
  formatDateForBadge 
} from '@/lib/utils/propertyUtils';

interface PropertyModalProps {
  propertyData: PropertyData;
  currentLanguage: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalProperties?: number;
}

export default function PropertyModal({
  propertyData,
  currentLanguage,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  currentIndex = 0,
  totalProperties = 0,
}: PropertyModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalCheckInDate, setModalCheckInDate] = useState<Date | null>(null);
  const [modalCheckOutDate, setModalCheckOutDate] = useState<Date | null>(null);
  const [showModalCalendar, setShowModalCalendar] = useState(false);
  const [modalCalendarMode, setModalCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (propertyData?.id) {
        const bookings = await getPropertyBookings(propertyData.id);
        const ranges = bookings.map(b => ({
          checkIn: new Date(b.checkInDate),
          checkOut: new Date(b.checkOutDate)
        }));
        setBookedRanges(ranges);
      }
    };
    fetchBookings();
  }, [propertyData?.id]);

  if (!propertyData) {
    return null;
  }

  const images = propertyData.images && propertyData.images.length > 0 
    ? propertyData.images 
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이전 매물 버튼 (모달 내부 좌측) */}
        {hasPrev && onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 top-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* 다음 매물 버튼 (모달 내부 우측) */}
        {hasNext && onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 top-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* 매물 인덱스 표시 */}
        {totalProperties > 1 && (
          <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium">
            {currentIndex + 1} / {totalProperties}
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 이미지 */}
        <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
          <Image
            src={images[modalImageIndex] || images[0]}
            alt={propertyData.title || ''}
            fill
            className="object-cover"
            sizes="(max-width: 430px) 100vw, 430px"
          />
          
          {/* 즉시입주가능 뱃지 */}
          {isAvailableNow(propertyData.checkInDate) ? (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-bold">
                {currentLanguage === 'ko' ? '즉시입주가능' : 
                 currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
                 'Available Now'}
              </span>
            </div>
          ) : propertyData.checkInDate && (
            <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">
                {formatDateForBadge(propertyData.checkInDate, currentLanguage as any)}
              </span>
            </div>
          )}

          {/* 이미지 네비게이션 */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setModalImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setModalImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* 이미지 인디케이터 */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === modalImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* 가격 뱃지 */}
          <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg z-10">
            <p className="text-sm font-bold">
              {formatFullPrice(propertyData.price, propertyData.priceUnit)}
            </p>
            <p className="text-xs text-gray-300">
              {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : '/week'}
            </p>
          </div>

          {/* 침실/욕실 뱃지 */}
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg z-10 flex items-center gap-3">
            {propertyData.bedrooms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4" />
                <span className="text-xs font-medium">{propertyData.bedrooms}</span>
              </div>
            )}
            {propertyData.bathrooms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                <span className="text-xs font-medium">{propertyData.bathrooms}</span>
              </div>
            )}
          </div>
        </div>

        {/* 매물 정보 */}
        <div className="p-5 space-y-4">
          {/* 주소 (원문 그대로 표시) */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {currentLanguage === 'ko' ? '주소' : currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {propertyData.address || propertyData.title}
            </p>
          </div>

          {/* 가격 + 체크인/체크아웃 시간 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {currentLanguage === 'ko' ? '1주일 임대료' : 
               currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 
               'Weekly Rent'}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatFullPrice(propertyData.price, propertyData.priceUnit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'ko' ? '공과금/관리비 포함' : 
               currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 
               'Utilities/Management fees included'}
            </p>
            {/* 체크인/체크아웃 시간 */}
            {(propertyData.checkInTime || propertyData.checkOutTime) && (
              <p className="text-xs text-blue-600 mt-2">
                {currentLanguage === 'ko' 
                  ? `체크인 ${propertyData.checkInTime || '14:00'} 이후 · 체크아웃 ${propertyData.checkOutTime || '12:00'} 이전`
                  : currentLanguage === 'vi'
                  ? `Nhận phòng sau ${propertyData.checkInTime || '14:00'} · Trả phòng trước ${propertyData.checkOutTime || '12:00'}`
                  : `Check-in after ${propertyData.checkInTime || '14:00'} · Check-out before ${propertyData.checkOutTime || '12:00'}`
                }
              </p>
            )}
          </div>

          {/* 임대 가능 날짜 */}
          {(propertyData.checkInDate || propertyData.checkOutDate) && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '임대 가능 날짜' : 
                 currentLanguage === 'vi' ? 'Ngày cho thuê' : 
                 'Available Dates'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium">
                  {propertyData.checkInDate && (() => {
                    const date = parseDate(propertyData.checkInDate);
                    if (!date) return '';
                    return date.toLocaleDateString(
                      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    );
                  })()}
                  {propertyData.checkInDate && propertyData.checkOutDate && ' ~ '}
                  {propertyData.checkOutDate && (() => {
                    const date = parseDate(propertyData.checkOutDate);
                    if (!date) return '';
                    return date.toLocaleDateString(
                      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    );
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* 최대 인원 수 */}
          {(propertyData.maxAdults || propertyData.maxChildren) && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '최대 인원 수' : 
                 currentLanguage === 'vi' ? 'Số người tối đa' : 
                 'Maximum Guests'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-900">
                {propertyData.maxAdults !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {currentLanguage === 'ko' ? `성인 ${propertyData.maxAdults}명` : 
                       currentLanguage === 'vi' ? `${propertyData.maxAdults} người lớn` : 
                       `${propertyData.maxAdults} adults`}
                    </span>
                  </div>
                )}
                {propertyData.maxChildren !== undefined && propertyData.maxChildren > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {currentLanguage === 'ko' ? `어린이 ${propertyData.maxChildren}명` : 
                       currentLanguage === 'vi' ? `${propertyData.maxChildren} trẻ em` : 
                       `${propertyData.maxChildren} children`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 편의시설 */}
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {currentLanguage === 'ko' ? '편의시설' : 
               currentLanguage === 'vi' ? 'Tiện ích' : 
               'Amenities'}
            </p>
            {propertyData.amenities && propertyData.amenities.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {AMENITY_OPTIONS.filter(amenity => propertyData.amenities?.includes(amenity.id)).map((amenity) => {
                  const Icon = amenity.icon;
                  const label = amenity.label[currentLanguage as keyof typeof amenity.label] || amenity.label.en;
                  
                  return (
                    <div
                      key={amenity.id}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-blue-500 bg-blue-50"
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-medium text-center text-blue-700 leading-tight">{label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">
                {currentLanguage === 'ko' ? '편의시설 정보가 없습니다' : 
                 currentLanguage === 'vi' ? 'Không có thông tin tiện ích' : 
                 'No amenities information'}
              </p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              {currentLanguage === 'ko' ? '예약 날짜 선택' : 
               currentLanguage === 'vi' ? 'Chọn ngày đặt phòng' : 
               'Select Booking Dates'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* 체크인 선택 */}
              <button
                onClick={() => {
                  setModalCalendarMode('checkin');
                  setShowModalCalendar(true);
                }}
                className={`flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all ${
                  modalCheckInDate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                }`}
              >
                <span className="text-[10px] text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '체크인' : currentLanguage === 'vi' ? 'Nhận phòng' : 'Check-in'}
                </span>
                <span className={`text-sm font-semibold ${modalCheckInDate ? 'text-blue-600' : 'text-gray-400'}`}>
                  {modalCheckInDate 
                    ? modalCheckInDate.toLocaleDateString(
                        currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                    : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select')
                  }
                </span>
              </button>

              {/* 체크아웃 선택 */}
              <button
                onClick={() => {
                  setModalCalendarMode('checkout');
                  setShowModalCalendar(true);
                }}
                className={`flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all ${
                  modalCheckOutDate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                }`}
              >
                <span className="text-[10px] text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '체크아웃' : currentLanguage === 'vi' ? 'Trả phòng' : 'Check-out'}
                </span>
                <span className={`text-sm font-semibold ${modalCheckOutDate ? 'text-blue-600' : 'text-gray-400'}`}>
                  {modalCheckOutDate 
                    ? modalCheckOutDate.toLocaleDateString(
                        currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                    : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select')
                  }
                </span>
              </button>
            </div>
          </div>

          {/* 예약하기 버튼 */}
          <div className="pt-3">
            <button
              onClick={() => {
                if (!modalCheckInDate || !modalCheckOutDate || !propertyData.id) return;
                
                // 비회원이면 로그인 페이지로 이동 (현재 매물 정보를 returnUrl에 포함)
                if (!user) {
                  const returnUrl = `/booking?propertyId=${propertyData.id}&checkIn=${toISODateString(modalCheckInDate)}&checkOut=${toISODateString(modalCheckOutDate)}`;
                  router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                  return;
                }
                
                // 로그인된 사용자는 예약 페이지로 이동
                router.push(`/booking?propertyId=${propertyData.id}&checkIn=${toISODateString(modalCheckInDate)}&checkOut=${toISODateString(modalCheckOutDate)}`);
              }}
              disabled={!modalCheckInDate || !modalCheckOutDate}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                modalCheckInDate && modalCheckOutDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {modalCheckInDate && modalCheckOutDate
                ? (currentLanguage === 'ko' ? '예약하기' : currentLanguage === 'vi' ? 'Đặt phòng' : 'Book Now')
                : (currentLanguage === 'ko' ? '날짜를 선택하세요' : currentLanguage === 'vi' ? 'Vui lòng chọn ngày' : 'Select dates')
              }
            </button>
          </div>
        </div>
      </div>

      {/* 모달 내 캘린더 */}
      {showModalCalendar && (
        <div 
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModalCalendar(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={modalCheckInDate}
              checkOutDate={modalCheckOutDate}
              onCheckInSelect={(date) => {
                setModalCheckInDate(date);
                setModalCheckOutDate(null);
                setModalCalendarMode('checkout');
              }}
              onCheckOutSelect={(date) => {
                setModalCheckOutDate(date);
                setShowModalCalendar(false);
              }}
              onCheckInReset={() => {
                setModalCheckInDate(null);
                setModalCheckOutDate(null);
                setModalCalendarMode('checkin');
              }}
              currentLanguage={currentLanguage as 'ko' | 'vi' | 'en'}
              onClose={() => setShowModalCalendar(false)}
              mode={modalCalendarMode}
              minDate={parseDate(propertyData.checkInDate) || undefined}
              maxDate={parseDate(propertyData.checkOutDate) || undefined}
              bookedRanges={bookedRanges}
            />
          </div>
        </div>
      )}
    </div>
  );
}
