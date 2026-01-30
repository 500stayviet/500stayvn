/**
 * Property Detail Page (매물 상세 페이지)
 * 
 * - 매물 상세 정보 표시
 * - 이미지 갤러리
 * - 지도 표시
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProperty, getBookedRangesForProperty } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import { getBookableDateSegments } from '@/lib/utils/propertyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { MapPin, Bed, Bath, Square, ArrowLeft, Wind, Sofa, UtensilsCrossed, WashingMachine, Refrigerator, Table, Shirt, Wifi, Calendar, Users, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { PropertyDescription } from '@/components/PropertyDescription';
import CalendarComponent from '@/components/CalendarComponent';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import { useAuth } from '@/hooks/useAuth';
import { toISODateString } from '@/lib/api/bookings';
import { 
  formatFullPrice, 
} from '@/lib/utils/propertyUtils';
import { 
  parseDate, 
  isAvailableNow, 
  formatDate, 
  formatDateForBadge 
} from '@/lib/utils/dateUtils';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableSegments, setAvailableSegments] = useState<{ start: string; end: string }[]>([]);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);
  const [pageCheckInDate, setPageCheckInDate] = useState<Date | null>(null);
  const [pageCheckOutDate, setPageCheckOutDate] = useState<Date | null>(null);
  const [showPageCalendar, setShowPageCalendar] = useState(false);
  const [pageCalendarMode, setPageCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  const [selectedGuests, setSelectedGuests] = useState<number>(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const [addPetSelected, setAddPetSelected] = useState(false);
  const [selectedPetCount, setSelectedPetCount] = useState(1);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petDropdownRef = useRef<HTMLDivElement>(null);

  const maxGuests = Math.max(1, (property?.maxAdults ?? 0) + (property?.maxChildren ?? 0));
  const maxPets = Math.max(1, property?.maxPets ?? 1);
  const petAllowed = !!(property?.petAllowed && (property?.petFee ?? 0) > 0);

  useEffect(() => {
    if (!property) return;
    const max = Math.max(1, (property.maxAdults ?? 0) + (property.maxChildren ?? 0));
    setSelectedGuests((prev) => (prev > max ? max : prev));
  }, [property?.maxAdults, property?.maxChildren]);

  useEffect(() => {
    const max = Math.max(1, property?.maxPets ?? 1);
    setSelectedPetCount((prev) => (prev > max ? max : prev));
  }, [property?.maxPets]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(e.target as Node)) {
        setShowGuestDropdown(false);
      }
      if (petDropdownRef.current && !petDropdownRef.current.contains(e.target as Node)) {
        setShowPetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        setProperty(data);
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  useEffect(() => {
    if (!property || !propertyId || !property.checkInDate || !property.checkOutDate) {
      setAvailableSegments([]);
      setBookedRanges([]);
      return;
    }
    const loadSegments = async () => {
      try {
        let ranges = await getBookedRangesForProperty(propertyId);
        if (property.icalUrl && property.icalUrl.trim()) {
          const icalRes = await fetch('/api/ical/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: property.icalUrl.trim() }),
          });
          if (icalRes.ok) {
            const { events } = await icalRes.json();
            const icalRanges = (events || []).map(
              (e: { start: string; end: string }) => ({
                checkIn: new Date(e.start),
                checkOut: new Date(e.end),
              })
            );
            ranges = [...ranges, ...icalRanges];
          }
        }
        setBookedRanges(ranges);
        const segments = getBookableDateSegments(
          property.checkInDate,
          property.checkOutDate,
          ranges
        );
        setAvailableSegments(segments);
      } catch {
        setAvailableSegments([]);
        setBookedRanges([]);
      }
    };
    loadSegments();
  }, [property, propertyId]);

  const handlePreviousImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === 'ko' ? '로딩 중...' : 
           currentLanguage === 'vi' ? 'Đang tải...' : 
           'Loading...'}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {currentLanguage === 'ko' ? '매물을 찾을 수 없습니다.' : 
             currentLanguage === 'vi' ? 'Không tìm thấy bất động sản.' : 
             'Property not found.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentLanguage === 'ko' ? '홈으로 돌아가기' : 
             currentLanguage === 'vi' ? 'Về trang chủ' : 
             'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];
  
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        <div className="px-6 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === 'ko' ? '뒤로' : 
                 currentLanguage === 'vi' ? 'Quay lại' : 
                 'Back'}
              </span>
            </button>
          </div>

          {/* 매물 카드 */}
          <div className="relative rounded-xl overflow-hidden mb-6 shadow-md border border-gray-100">
            <div className="relative w-full h-64 overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src={currentImage}
                  alt={property.title}
                  fill
                  className="object-cover transition-all duration-300"
                  sizes="(max-width: 430px) 100vw, 430px"
                />
                
                {/* 좌측 상단: 즉시입주가능 또는 임대 시작 날짜 */}
                {isAvailableNow(property.checkInDate) ? (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold">
                      {currentLanguage === 'ko' ? '즉시입주가능' : 
                       currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
                       'Available Now'}
                    </span>
                  </div>
                ) : (
                  property.checkInDate ? (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {formatDateForBadge(property.checkInDate, currentLanguage)}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {currentLanguage === 'ko' ? '날짜 미정' : 
                         currentLanguage === 'vi' ? 'Chưa xác định' : 
                         'Date TBD'}
                      </span>
                    </div>
                  )
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
                  <p className="text-sm font-bold">
                    {formatFullPrice(property.price, property.priceUnit)}
                  </p>
                  <p className="text-xs text-gray-300">
                    {currentLanguage === 'ko' ? '/주' : 
                     currentLanguage === 'vi' ? '/tuần' : 
                     '/week'}
                  </p>
                </div>

                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm z-10 flex items-center gap-3">
                  {property.bedrooms !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Bed className="w-4 h-4" />
                      <span className="text-xs font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Bath className="w-4 h-4" />
                      <span className="text-xs font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 매물 정보 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            {/* 주소 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '주소' : 
                 currentLanguage === 'vi' ? 'Địa chỉ' : 
                 'Address'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {property.address || property.title}
              </p>
            </div>

            {/* 가격 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '1주일 임대료' : 
                 currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 
                 'Weekly Rent'}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatFullPrice(property.price, property.priceUnit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentLanguage === 'ko' ? '공과금/관리비 포함' : 
                 currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 
                 'Utilities/Management fees included'}
              </p>
            </div>

            {/* 임대 가능 날짜: 달력과 동일하게 예약 제외 후 실제 예약 가능 구간만 표시 */}
            {(property.checkInDate || property.checkOutDate) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '임대 가능 날짜' : 
                   currentLanguage === 'vi' ? 'Ngày cho thuê' : 
                   'Available Dates'}
                </p>
                {availableSegments.length > 0 ? (
                  <div className="flex items-start gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {availableSegments.length === 1 ? (
                        <span className="font-medium">
                          {formatDate(availableSegments[0].start, currentLanguage)} ~ {formatDate(availableSegments[0].end, currentLanguage)}
                        </span>
                      ) : (
                        <ul className="space-y-1.5 text-gray-700">
                          {availableSegments.map((seg, i) => (
                            <li key={i} className="font-medium">
                              {formatDate(seg.start, currentLanguage)} ~ {formatDate(seg.end, currentLanguage)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>
                      {currentLanguage === 'ko' ? '예약 가능한 구간 없음' : 
                       currentLanguage === 'vi' ? 'Không còn khoảng trống' : 
                       'No available periods'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 최대 인원 수 */}
            {(property.maxAdults || property.maxChildren) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '최대 인원 수' : 
                   currentLanguage === 'vi' ? 'Số người tối đa' : 
                   'Maximum Guests'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-900">
                  {property.maxAdults !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">
                        {currentLanguage === 'ko' ? `성인 ${property.maxAdults}명` : 
                         currentLanguage === 'vi' ? `${property.maxAdults} người lớn` : 
                         `${property.maxAdults} adults`}
                      </span>
                    </div>
                  )}
                  {property.maxChildren !== undefined && property.maxChildren > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">
                        {currentLanguage === 'ko' ? `어린이 ${property.maxChildren}명` : 
                         currentLanguage === 'vi' ? `${property.maxChildren} trẻ em` : 
                         `${property.maxChildren} children`}
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
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {FACILITY_OPTIONS.filter(opt => property.amenities?.includes(opt.id)).map((amenity) => {
                    const Icon = amenity.icon;
                    const label = (amenity.label as any)[currentLanguage] || amenity.label.en;
                    const isPet = amenity.id === "pet";
                    const isCleaning = amenity.id === "cleaning";
                    const petFee = isPet && property.petAllowed && property.petFee != null ? property.petFee : null;
                    const cleaningCount = isCleaning && (property.cleaningPerWeek ?? 0) > 0 ? property.cleaningPerWeek : null;
                    return (
                      <div
                        key={amenity.id}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-50"
                      >
                        <Icon className="w-6 h-6 text-blue-600" />
                        <span className="text-xs font-medium text-center text-blue-700">{label}</span>
                        {petFee != null && (
                          <span className="text-xs font-semibold text-blue-800">
                            {property.priceUnit === "vnd" ? `${petFee.toLocaleString("vi-VN")} VND` : `$${petFee.toLocaleString()}`}
                          </span>
                        )}
                        {cleaningCount != null && (
                          <span className="text-xs font-semibold text-blue-800">
                            {cleaningCount}
                            {currentLanguage === "ko" ? "회/주" : currentLanguage === "vi" ? " lần/tuần" : "/week"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  {currentLanguage === 'ko' ? '편의시설 정보가 없습니다' : 
                   currentLanguage === 'vi' ? 'Không có thông tin tiện ích' : 
                   'No amenities information'}
                </p>
              )}
            </div>

            {/* 매물 설명 - 달력 선택창 바로 위에 표시 */}
            {property.original_description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '매물 설명' : 
                   currentLanguage === 'vi' ? 'Mô tả bất động sản' : 
                   'Property Description'}
                </p>
                <PropertyDescription
                  description={property.original_description}
                  sourceLanguage="vi"
                  targetLanguage={currentLanguage}
                  cacheKey={`property-detail-${property.id}`}
                  className="mt-2"
                />
              </div>
            )}

            {/* 예약날짜 및 인원 선택 (5개국어: i18n) */}
            {(property.checkInDate || property.checkOutDate) && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">
                  {getUIText('selectDatesAndGuests', currentLanguage)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setPageCalendarMode('checkin');
                      setShowPageCalendar(true);
                      setShowGuestDropdown(false);
                    }}
                    className={`flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all ${
                      pageCheckInDate 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '체크인' : currentLanguage === 'vi' ? 'Nhận phòng' : 'Check-in'}
                    </span>
                    <span className={`text-xs font-semibold ${pageCheckInDate ? 'text-blue-600' : 'text-gray-400'}`}>
                      {pageCheckInDate 
                        ? pageCheckInDate.toLocaleDateString(
                            currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )
                        : (currentLanguage === 'ko' ? '날짜를 선택하세요' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setPageCalendarMode('checkout');
                      setShowPageCalendar(true);
                      setShowGuestDropdown(false);
                    }}
                    className={`flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all ${
                      pageCheckOutDate 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '체크아웃' : currentLanguage === 'vi' ? 'Trả phòng' : 'Check-out'}
                    </span>
                    <span className={`text-xs font-semibold ${pageCheckOutDate ? 'text-blue-600' : 'text-gray-400'}`}>
                      {pageCheckOutDate 
                        ? pageCheckOutDate.toLocaleDateString(
                            currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )
                        : (currentLanguage === 'ko' ? '날짜를 선택하세요' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                    </span>
                  </button>
                  <div className="relative" ref={guestDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuestDropdown(!showGuestDropdown);
                        setShowPageCalendar(false);
                      }}
                      className={`w-full h-full min-h-[52px] flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border-2 transition-all ${
                        showGuestDropdown ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 mb-1">
                        {getUIText('guestSelect', currentLanguage)}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 flex items-center gap-0.5">
                        {selectedGuests}
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {showGuestDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
                        {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setSelectedGuests(n);
                              setShowGuestDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm ${selectedGuests === n ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {n} {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? 'người' : currentLanguage === 'ja' ? '名' : currentLanguage === 'zh' ? '人' : ''}
                            {n === maxGuests && (
                              <span className="text-gray-500 font-normal">
                                {' '}{getUIText('maxSuffix', currentLanguage)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* 애완동물 추가 선택 — 임대인이 애완동물 가능 선택한 경우만 활성화, 경고 위 */}
                {petAllowed && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addPetSelected}
                        onChange={(e) => {
                          setAddPetSelected(e.target.checked);
                          if (!e.target.checked) setSelectedPetCount(0);
                          else setSelectedPetCount((p) => (p < 1 ? 1 : p));
                          if (e.target.checked) setShowPetDropdown(true);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {currentLanguage === 'ko' ? '애완동물과 함께 여행하시나요?' : currentLanguage === 'vi' ? 'Bạn có đi cùng thú cưng?' : 'Traveling with pets?'}
                      </span>
                    </label>
                    {addPetSelected && (
                      <div className="relative" ref={petDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowPetDropdown(!showPetDropdown)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-blue-500 bg-blue-50 text-sm font-medium text-blue-700"
                        >
                          {selectedPetCount}
                          {currentLanguage === 'ko' ? '마리' : currentLanguage === 'vi' ? ' con' : ' pet(s)'}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showPetDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showPetDropdown && (
                          <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[80px]">
                            {Array.from({ length: maxPets }, (_, i) => i + 1).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => { setSelectedPetCount(n); setShowPetDropdown(false); }}
                                className={`w-full text-left px-3 py-2 text-sm ${selectedPetCount === n ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                {n} {currentLanguage === 'ko' ? '마리' : currentLanguage === 'vi' ? 'con' : ''}
                                {n === maxPets && <span className="text-gray-500"> {getUIText('maxSuffix', currentLanguage)}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 임대인 최대인원 선택 시에만 경고 — 인원 선택 아래, 예약하기 버튼 위 (빨간색, 글자 축소, 5개국어) */}
                {maxGuests > 0 && selectedGuests === maxGuests && (
                  <p className="mt-3 text-xs text-red-600 font-medium">
                    {getUIText('guestOverMaxNotice', currentLanguage)}
                  </p>
                )}
              </div>
            )}

            {/* 예약하기 버튼 */}
            <div className="pt-4">
              <button
                onClick={() => {
                  if (!propertyId) return;
                  const checkIn = pageCheckInDate || parseDate(property.checkInDate) || new Date();
                  const checkOut = pageCheckOutDate || (() => {
                    const c = new Date(checkIn);
                    c.setDate(c.getDate() + 7);
                    return c;
                  })();

                  const pets = addPetSelected ? selectedPetCount : 0;
                  const returnUrl = `/booking?propertyId=${propertyId}&checkIn=${toISODateString(checkIn)}&checkOut=${toISODateString(checkOut)}&guests=${selectedGuests}&pets=${pets}`;
                  
                  if (!user) {
                    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                  } else {
                    router.push(returnUrl);
                  }
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {currentLanguage === 'ko' ? '예약하기' : 
                 currentLanguage === 'vi' ? 'Đặt phòng' : 
                 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 달력 모달 */}
      {showPageCalendar && property && (
        <div 
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowPageCalendar(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              checkInDate={pageCheckInDate}
              checkOutDate={pageCheckOutDate}
              onCheckInSelect={(date) => {
                setPageCheckInDate(date);
                setPageCheckOutDate(null);
                setPageCalendarMode('checkout');
              }}
              onCheckOutSelect={(date) => {
                setPageCheckOutDate(date);
                setShowPageCalendar(false);
              }}
              onCheckInReset={() => {
                setPageCheckInDate(null);
                setPageCheckOutDate(null);
                setPageCalendarMode('checkin');
              }}
              currentLanguage={currentLanguage}
              onClose={() => setShowPageCalendar(false)}
              mode={pageCalendarMode}
              minDate={parseDate(property.checkInDate) || undefined}
              maxDate={parseDate(property.checkOutDate) || undefined}
              bookedRanges={bookedRanges}
            />
          </div>
        </div>
      )}
    </div>
  );
}
