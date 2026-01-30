'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar, 
  Users, 
  Bed, 
  Bath, 
} from 'lucide-react';
import { PropertyData } from '@/types/property';
import { getBookedRangesForProperty } from '@/lib/api/properties';
import { toISODateString } from '@/lib/api/bookings';
import CalendarComponent from '@/components/CalendarComponent';
import { PropertyDescription } from '@/components/PropertyDescription';
import { useAuth } from '@/hooks/useAuth';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import { 
  formatFullPrice, 
  getBookableDateSegments 
} from '@/lib/utils/propertyUtils';
import { 
  parseDate, 
  isAvailableNow, 
  formatDateForBadge, 
  formatDate 
} from '@/lib/utils/dateUtils';

import { getUIText } from '@/utils/i18n';
import { SupportedLanguage } from '@/lib/api/translation';

interface PropertyModalProps {
  propertyData: PropertyData;
  currentLanguage: SupportedLanguage;
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
  const [selectedGuests, setSelectedGuests] = useState(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const [addPetSelected, setAddPetSelected] = useState(false);
  const [selectedPetCount, setSelectedPetCount] = useState(1);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petDropdownRef = useRef<HTMLDivElement>(null);

  const maxGuests = Math.max(1, (propertyData?.maxAdults ?? 0) + (propertyData?.maxChildren ?? 0));
  const maxPets = Math.max(1, propertyData?.maxPets ?? 1);
  const petAllowed = !!(propertyData?.petAllowed && (propertyData?.petFee ?? 0) > 0);

  useEffect(() => {
    const max = Math.max(1, (propertyData?.maxAdults ?? 0) + (propertyData?.maxChildren ?? 0));
    setSelectedGuests((prev) => (prev > max ? max : prev));
  }, [propertyData?.maxAdults, propertyData?.maxChildren]);

  useEffect(() => {
    const max = Math.max(1, propertyData?.maxPets ?? 1);
    setSelectedPetCount((prev) => (prev > max ? max : prev));
  }, [propertyData?.maxPets]);

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

  // 상세페이지와 동일: getBookedRangesForProperty + iCal 병합 → 달력 가용 구간과 동일하게 표시
  useEffect(() => {
    const loadBookedRanges = async () => {
      if (!propertyData?.id) {
        setBookedRanges([]);
        return;
      }
      try {
        let ranges = await getBookedRangesForProperty(propertyData.id);
        if (propertyData.icalUrl && propertyData.icalUrl.trim()) {
          const res = await fetch('/api/ical/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: propertyData.icalUrl.trim() }),
          });
          if (res.ok) {
            const { events } = await res.json();
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
      } catch {
        setBookedRanges([]);
      }
    };
    loadBookedRanges();
  }, [propertyData?.id, propertyData?.icalUrl]);

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
                {getUIText('immediateEntry', currentLanguage)}
              </span>
            </div>
          ) : propertyData.checkInDate && (
            <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">
                {formatDateForBadge(propertyData.checkInDate, currentLanguage)}
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
              {getUIText('address', currentLanguage)}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {propertyData.address || propertyData.title}
            </p>
          </div>

          {/* 가격 + 체크인/체크아웃 시간 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {getUIText('weeklyRent', currentLanguage)}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatFullPrice(propertyData.price, propertyData.priceUnit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getUIText('utilitiesIncluded', currentLanguage)}
            </p>
            {/* 체크인/체크아웃 시간 */}
            {(propertyData.checkInTime || propertyData.checkOutTime) && (
              <p className="text-xs text-blue-600 mt-2">
                {getUIText('checkIn', currentLanguage)} {propertyData.checkInTime || '14:00'} {getUIText('checkInAfter', currentLanguage)} · {getUIText('checkOut', currentLanguage)} {propertyData.checkOutTime || '12:00'} {getUIText('checkOutBefore', currentLanguage)}
              </p>
            )}
          </div>

          {/* 임대 가능 날짜: 달력과 동일하게 예약 제외 후 실제 예약 가능 구간만 표시 */}
          {(propertyData.checkInDate || propertyData.checkOutDate) && (() => {
            const segments = propertyData.checkInDate && propertyData.checkOutDate
              ? getBookableDateSegments(propertyData.checkInDate, propertyData.checkOutDate, bookedRanges)
              : [];
            return (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {getUIText('availableDates', currentLanguage)}
                </p>
                {segments.length > 0 ? (
                  <div className="flex items-start gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {segments.length === 1 ? (
                        <span className="font-medium">
                          {formatDate(segments[0].start, currentLanguage)} ~ {formatDate(segments[0].end, currentLanguage)}
                        </span>
                      ) : (
                        <ul className="space-y-1.5 text-gray-700">
                          {segments.map((seg, i) => (
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
                      {currentLanguage === 'ko' ? '예약 가능한 구간 없음' : currentLanguage === 'vi' ? 'Không còn khoảng trống' : 'No available periods'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 최대 인원 수 */}
          {(propertyData.maxAdults || propertyData.maxChildren) && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {getUIText('maxGuests', currentLanguage)}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-900">
                {propertyData.maxAdults !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {getUIText('adults', currentLanguage)} {propertyData.maxAdults}
                    </span>
                  </div>
                )}
                {propertyData.maxChildren !== undefined && propertyData.maxChildren > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {getUIText('children', currentLanguage)} {propertyData.maxChildren}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 편의시설 */}
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {getUIText('amenities', currentLanguage)}
            </p>
            {propertyData.amenities && propertyData.amenities.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {FACILITY_OPTIONS.filter(opt => propertyData.amenities?.includes(opt.id)).map((amenity) => {
                  const Icon = amenity.icon;
                  const label = (amenity.label as any)[currentLanguage] || amenity.label.en;
                  const isPet = amenity.id === 'pet';
                  const isCleaning = amenity.id === 'cleaning';
                  const petFee = isPet && propertyData.petAllowed && propertyData.petFee != null ? propertyData.petFee : null;
                  const cleaningCount = isCleaning && (propertyData.cleaningPerWeek ?? 0) > 0 ? propertyData.cleaningPerWeek : null;
                  return (
                    <div
                      key={amenity.id}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-blue-500 bg-blue-50"
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-medium text-center text-blue-700 leading-tight">{label}</span>
                      {petFee != null && (
                        <span className="text-[10px] font-semibold text-blue-800">
                          {propertyData.priceUnit === 'vnd' ? `${(petFee / 1_000_000).toFixed(1)}M VND` : `$${petFee}`}
                        </span>
                      )}
                      {cleaningCount != null && (
                        <span className="text-[10px] font-semibold text-blue-800">
                          {cleaningCount}
                          {currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : '/week'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">
                {getUIText('noAmenities', currentLanguage)}
              </p>
            )}
          </div>

          {/* 매물 설명 - 날짜 선택 위에 표시 */}
          {propertyData.original_description && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {getUIText('description', currentLanguage)}
              </p>
              <PropertyDescription
                description={propertyData.original_description}
                sourceLanguage="vi"
                targetLanguage={currentLanguage}
                cacheKey={`property-modal-${propertyData.id}`}
                className="mt-2"
              />
            </div>
          )}

          {/* 예약날짜 및 인원 선택 (5개국어: i18n) */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              {getUIText('selectDatesAndGuests', currentLanguage)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* 체크인 선택 */}
              <button
                onClick={() => {
                  setModalCalendarMode('checkin');
                  setShowModalCalendar(true);
                  setShowGuestDropdown(false);
                }}
                className={`flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all ${
                  modalCheckInDate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                }`}
              >
                <span className="text-[10px] text-gray-500 mb-1">
                  {getUIText('checkIn', currentLanguage)}
                </span>
                <span className={`text-xs font-semibold ${modalCheckInDate ? 'text-blue-600' : 'text-gray-400'}`}>
                  {modalCheckInDate 
                    ? modalCheckInDate.toLocaleDateString(
                        currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                    : getUIText('selectDate', currentLanguage)
                  }
                </span>
              </button>

              {/* 체크아웃 선택 */}
              <button
                onClick={() => {
                  setModalCalendarMode('checkout');
                  setShowModalCalendar(true);
                  setShowGuestDropdown(false);
                }}
                className={`flex flex-col items-center px-2 py-2.5 rounded-xl border-2 transition-all ${
                  modalCheckOutDate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                }`}
              >
                <span className="text-[10px] text-gray-500 mb-1">
                  {getUIText('checkOut', currentLanguage)}
                </span>
                <span className={`text-xs font-semibold ${modalCheckOutDate ? 'text-blue-600' : 'text-gray-400'}`}>
                  {modalCheckOutDate 
                    ? modalCheckOutDate.toLocaleDateString(
                        currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                    : getUIText('selectDate', currentLanguage)
                  }
                </span>
              </button>

              {/* 인원 선택 (체크아웃 우측) */}
              <div className="relative" ref={guestDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowGuestDropdown(!showGuestDropdown);
                    setShowModalCalendar(false);
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
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-40 overflow-y-auto">
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setSelectedGuests(n);
                          setShowGuestDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${selectedGuests === n ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
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
                <span className="text-sm text-gray-700">
                  {currentLanguage === 'ko' ? '애완동물 추가 하시겠습니까?' : currentLanguage === 'vi' ? 'Thêm thú cưng?' : 'Add pets?'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setAddPetSelected(true); setShowPetDropdown(true); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${addPetSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {currentLanguage === 'ko' ? '예' : currentLanguage === 'vi' ? 'Có' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddPetSelected(false); setSelectedPetCount(0); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!addPetSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {currentLanguage === 'ko' ? '아니오' : currentLanguage === 'vi' ? 'Không' : 'No'}
                  </button>
                </div>
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

          {/* 예약하기 버튼 */}
          <div className="pt-3">
            <button
              onClick={() => {
                if (!modalCheckInDate || !modalCheckOutDate || !propertyData.id) return;
                
                const pets = addPetSelected ? selectedPetCount : 0;
                const query = `propertyId=${propertyData.id}&checkIn=${toISODateString(modalCheckInDate)}&checkOut=${toISODateString(modalCheckOutDate)}&guests=${selectedGuests}&pets=${pets}`;
                
                // 비회원이면 로그인 페이지로 이동 (현재 매물 정보를 returnUrl에 포함)
                if (!user) {
                  const returnUrl = `/booking?${query}`;
                  router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                  return;
                }
                
                // 로그인된 사용자는 예약 페이지로 이동
                router.push(`/booking?${query}`);
              }}
              disabled={!modalCheckInDate || !modalCheckOutDate}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                modalCheckInDate && modalCheckOutDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {modalCheckInDate && modalCheckOutDate
                ? getUIText('bookNow', currentLanguage)
                : getUIText('selectDatesFirst', currentLanguage)
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
              currentLanguage={currentLanguage}
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
