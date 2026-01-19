/**
 * PopularStays 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 인기 숙소 리스트
 * - 상하 스크롤 가능한 리스트 형태
 * - 각 매물을 카드 형태로 표시
 * - 클릭 시 상세 모달 표시 (날짜 선택 + 예약하기)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronLeft, ChevronRight, X, Calendar, Bed, Bath, Users } from 'lucide-react';
import Image from 'next/image';
import { SupportedLanguage } from '@/lib/api/translation';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { getUIText } from '@/utils/i18n';
import { PropertyData } from '@/lib/api/properties';
import CalendarComponent from '@/components/CalendarComponent';

// 편의시설 옵션 (지도 컴포넌트와 동일)
import { Wifi, Wind, Tv, UtensilsCrossed, Shirt, Dumbbell, Car, Waves, Sofa, Coffee, Snowflake, Sun, ShowerHead, Lock, Trees, Dog, Cigarette, Baby, Accessibility, Building } from 'lucide-react';

const AMENITY_OPTIONS = [
  { id: 'wifi', label: { ko: '와이파이', vi: 'Wifi', en: 'WiFi' }, icon: Wifi },
  { id: 'aircon', label: { ko: '에어컨', vi: 'Điều hòa', en: 'AC' }, icon: Wind },
  { id: 'tv', label: { ko: 'TV', vi: 'TV', en: 'TV' }, icon: Tv },
  { id: 'kitchen', label: { ko: '주방', vi: 'Bếp', en: 'Kitchen' }, icon: UtensilsCrossed },
  { id: 'washer', label: { ko: '세탁기', vi: 'Máy giặt', en: 'Washer' }, icon: Shirt },
  { id: 'gym', label: { ko: '헬스장', vi: 'Phòng gym', en: 'Gym' }, icon: Dumbbell },
  { id: 'parking', label: { ko: '주차장', vi: 'Bãi đậu xe', en: 'Parking' }, icon: Car },
  { id: 'pool', label: { ko: '수영장', vi: 'Hồ bơi', en: 'Pool' }, icon: Waves },
  { id: 'furnished', label: { ko: '가구완비', vi: 'Đầy đủ nội thất', en: 'Furnished' }, icon: Sofa },
  { id: 'coffee', label: { ko: '커피머신', vi: 'Máy pha cà phê', en: 'Coffee' }, icon: Coffee },
  { id: 'heating', label: { ko: '난방', vi: 'Sưởi ấm', en: 'Heating' }, icon: Snowflake },
  { id: 'balcony', label: { ko: '발코니', vi: 'Ban công', en: 'Balcony' }, icon: Sun },
  { id: 'bathtub', label: { ko: '욕조', vi: 'Bồn tắm', en: 'Bathtub' }, icon: ShowerHead },
  { id: 'security', label: { ko: '보안', vi: 'An ninh', en: 'Security' }, icon: Lock },
  { id: 'garden', label: { ko: '정원', vi: 'Sân vườn', en: 'Garden' }, icon: Trees },
  { id: 'pet', label: { ko: '반려동물', vi: 'Thú cưng', en: 'Pet OK' }, icon: Dog },
  { id: 'smoking', label: { ko: '흡연가능', vi: 'Hút thuốc OK', en: 'Smoking' }, icon: Cigarette },
  { id: 'baby', label: { ko: '유아용품', vi: 'Đồ em bé', en: 'Baby' }, icon: Baby },
  { id: 'accessible', label: { ko: '휠체어', vi: 'Xe lăn', en: 'Accessible' }, icon: Accessibility },
  { id: 'elevator', label: { ko: '엘리베이터', vi: 'Thang máy', en: 'Elevator' }, icon: Building },
];

interface PopularStaysProps {
  currentLanguage: SupportedLanguage;
}

export default function PopularStays({ currentLanguage }: PopularStaysProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, loading } = useProperties();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // 모달 상태
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalCheckInDate, setModalCheckInDate] = useState<Date | null>(null);
  const [modalCheckOutDate, setModalCheckOutDate] = useState<Date | null>(null);
  const [showModalCalendar, setShowModalCalendar] = useState(false);
  const [modalCalendarMode, setModalCalendarMode] = useState<'checkin' | 'checkout'>('checkin');

  // 클라이언트 사이드에서만 렌더링 (SSR 방지)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 가격 포맷팅
  const formatPrice = (price: number, unit: string): string => {
    if (unit === 'vnd') {
      return `${(price / 1000000).toFixed(1)}M VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  // 주소에서 도시명 추출
  const getCityName = (address?: string): string => {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address;
  };

  // ISO 문자열 또는 Date 객체를 Date로 변환
  const parseDate = (dateInput: string | Date | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  // 즉시 입주 가능 여부 확인
  const isAvailableNow = (checkInDate?: string | Date): boolean => {
    if (!checkInDate) return false;
    const checkIn = parseDate(checkInDate);
    if (!checkIn) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    return checkIn <= today;
  };

  // 날짜 포맷팅 (배지용)
  const formatDateForBadge = (checkInDate?: string | Date): string => {
    if (!checkInDate) return '';
    const date = parseDate(checkInDate);
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (currentLanguage === 'ko') {
      return `${month}월 ${day}일부터`;
    } else if (currentLanguage === 'vi') {
      return `Từ ${day}/${month}`;
    } else {
      return `From ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  // 카드 너비 계산 (반응형)
  const getCardWidth = () => {
    if (typeof window === 'undefined') return 350;
    const isMobile = window.innerWidth < 640; // sm breakpoint
    return isMobile ? window.innerWidth - 32 : 350; // 모바일: 화면 너비 - padding(16px * 2), 데스크톱: 350px
  };

  // 현재 인덱스 추적
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || properties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = getCardWidth() + 16; // 카드 너비 + gap
      const index = Math.round(scrollLeft / cardWidth);
      const normalizedIndex = index % properties.length;
      setCurrentIndex(normalizedIndex < 0 ? properties.length + normalizedIndex : normalizedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [properties.length]);

  // 좌우 스크롤 함수 (무한 루프)
  const scrollLeft = () => {
    if (scrollContainerRef.current && properties.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = getCardWidth() + 16; // 카드 너비 + gap
      
      if (currentIndex === 0) {
        // 첫 번째에서 왼쪽으로 가면 마지막으로
        const targetIndex = properties.length - 1;
        container.scrollTo({ left: targetIndex * cardWidth, behavior: 'smooth' });
        setCurrentIndex(targetIndex);
      } else {
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current && properties.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = getCardWidth() + 16; // 카드 너비 + gap
      
      if (currentIndex >= properties.length - 1) {
        // 마지막에서 오른쪽으로 가면 첫 번째로
        container.scrollTo({ left: 0, behavior: 'smooth' });
        setCurrentIndex(0);
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  // 모달 열기
  const openPropertyModal = (property: PropertyData) => {
    setSelectedProperty(property);
    setModalImageIndex(0);
    setModalCheckInDate(null);
    setModalCheckOutDate(null);
  };

  // 모달 닫기
  const closePropertyModal = () => {
    setSelectedProperty(null);
    setModalImageIndex(0);
    setModalCheckInDate(null);
    setModalCheckOutDate(null);
  };

  // 가격 포맷팅 (모달용)
  const formatPriceForModal = (price: number, unit: string): string => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  // 서버 사이드에서는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null;
  }

  return (
    <section className="py-6 bg-white">
      <div className="w-full px-4">
        {/* 타이틀 - 항상 표시 */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">
          {currentLanguage === 'ko' 
            ? '지금 가장 인기 있는 숙소' 
            : currentLanguage === 'vi'
            ? 'Chỗ ở phổ biến nhất hiện tại'
            : 'Popular Stays Now'}
        </h2>

        {/* 로딩 중일 때 */}
        {loading && (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative h-[280px] w-[calc(100vw-2rem)] sm:w-[350px] flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        )}

        {/* 데이터가 없을 때 (로딩 완료 후) */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{getUIText('noProperties', currentLanguage)}</p>
          </div>
        )}

        {/* 매물 리스트 (로딩 완료 후 데이터가 있을 때) */}
        {!loading && properties.length > 0 && (
          <div className="relative">
          {/* 좌측 화살표 버튼 */}
          <button
            onClick={scrollLeft}
            className="flex absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          {/* 매물 리스트 (좌우 스크롤 가능) */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 sm:px-10"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {properties.map((property, index) => {
              const imageUrl = property.images && property.images.length > 0
                ? property.images[0]
                : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
              const isCurrentCard = currentIndex === index;

              return (
                <div
                  key={property.id}
                  onClick={() => openPropertyModal(property)}
                  className="relative h-[280px] w-[calc(100vw-2rem)] sm:w-[350px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                {/* 이미지 */}
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 430px) 100vw, 430px"
                  />

                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                  {/* 사진 내부 하단 중앙: 인디케이터 점 (현재 보이는 사진에만 표시) */}
                  {isCurrentCard && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                      {Array.from({ length: Math.min(properties.length, 5) }).map((_, idx) => {
                        // 매물이 5개 이상이면 currentIndex % 5로 계산, 그 외에는 currentIndex 직접 사용
                        const maxDots = Math.min(properties.length, 5);
                        const activeIndex = properties.length > 5 ? currentIndex % 5 : currentIndex;
                        const isActive = idx === activeIndex;
                        return (
                          <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isActive ? 'bg-white w-6' : 'bg-white/50 w-2'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* 좌측 상단: 체크인 날짜 배지 */}
                  {property.checkInDate && (
                    <div className="absolute top-4 left-4 z-10">
                      {isAvailableNow(property.checkInDate) ? (
                        <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-xs font-semibold">
                            {currentLanguage === 'ko' ? '즉시 입주 가능' : 
                             currentLanguage === 'vi' ? 'Có thể vào ngay' : 
                             'Available Now'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                          <span className="text-xs font-semibold">
                            {formatDateForBadge(property.checkInDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 콘텐츠 오버레이 */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    {/* 상단: 금액 */}
                    <div className="flex justify-end">
                      <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl shadow-lg">
                        <span className="text-lg font-bold">
                          {formatPrice(property.price, property.priceUnit)}
                        </span>
                      </div>
                    </div>

                    {/* 하단: 제목과 위치 */}
                    <div className="space-y-2">
                      <h3 className="text-white text-lg font-bold drop-shadow-lg line-clamp-2">
                        {property.title}
                      </h3>
                      {property.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white" />
                          <span className="text-white text-sm drop-shadow-lg">
                            {getCityName(property.address)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

            {/* 우측 화살표 버튼 */}
            <button
              onClick={scrollRight}
              className="flex absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedProperty && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closePropertyModal}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={closePropertyModal}
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* 이미지 섹션 */}
            <div className="relative w-full h-[240px]">
              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <>
                  <Image
                    src={selectedProperty.images[modalImageIndex]}
                    alt={selectedProperty.title}
                    fill
                    className="object-cover"
                  />

                  {/* 입주 가능일 배지 */}
                  {isAvailableNow(selectedProperty.checkInDate) ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold">
                        {currentLanguage === 'ko' ? '즉시입주가능' : 
                         currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
                         'Available Now'}
                      </span>
                    </div>
                  ) : selectedProperty.checkInDate && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {formatDateForBadge(selectedProperty.checkInDate)}
                      </span>
                    </div>
                  )}

                  {/* 이미지 네비게이션 */}
                  {selectedProperty.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalImageIndex(prev => prev === 0 ? selectedProperty.images!.length - 1 : prev - 1);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalImageIndex(prev => prev === selectedProperty.images!.length - 1 ? 0 : prev + 1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      {/* 이미지 인디케이터 */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {selectedProperty.images.map((_, idx) => (
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
                      {formatPriceForModal(selectedProperty.price, selectedProperty.priceUnit)}
                    </p>
                    <p className="text-xs text-gray-300">
                      {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : '/week'}
                    </p>
                  </div>

                  {/* 침실/욕실 뱃지 */}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg z-10 flex items-center gap-3">
                    {selectedProperty.bedrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4" />
                        <span className="text-xs font-medium">{selectedProperty.bedrooms}</span>
                      </div>
                    )}
                    {selectedProperty.bathrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        <span className="text-xs font-medium">{selectedProperty.bathrooms}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* 매물 정보 */}
            <div className="p-5 space-y-4">
              {/* 주소 */}
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '주소' : currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedProperty.address || selectedProperty.title}
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
                  {formatPriceForModal(selectedProperty.price, selectedProperty.priceUnit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentLanguage === 'ko' ? '공과금/관리비 포함' : 
                   currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 
                   'Utilities/Management fees included'}
                </p>
                {/* 체크인/체크아웃 시간 */}
                {(selectedProperty.checkInTime || selectedProperty.checkOutTime) && (
                  <p className="text-xs text-blue-600 mt-2">
                    {currentLanguage === 'ko' 
                      ? `체크인 ${selectedProperty.checkInTime || '14:00'} 이후 · 체크아웃 ${selectedProperty.checkOutTime || '12:00'} 이전`
                      : currentLanguage === 'vi'
                      ? `Nhận phòng sau ${selectedProperty.checkInTime || '14:00'} · Trả phòng trước ${selectedProperty.checkOutTime || '12:00'}`
                      : `Check-in after ${selectedProperty.checkInTime || '14:00'} · Check-out before ${selectedProperty.checkOutTime || '12:00'}`
                    }
                  </p>
                )}
              </div>

              {/* 임대 가능 날짜 */}
              {(selectedProperty.checkInDate || selectedProperty.checkOutDate) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '임대 가능 날짜' : 
                     currentLanguage === 'vi' ? 'Ngày cho thuê' : 
                     'Available Dates'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      {selectedProperty.checkInDate && (() => {
                        const date = parseDate(selectedProperty.checkInDate);
                        if (!date) return '';
                        return date.toLocaleDateString(
                          currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        );
                      })()}
                      {selectedProperty.checkInDate && selectedProperty.checkOutDate && ' ~ '}
                      {selectedProperty.checkOutDate && (() => {
                        const date = parseDate(selectedProperty.checkOutDate);
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
              {(selectedProperty.maxAdults || selectedProperty.maxChildren) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '최대 인원 수' : 
                     currentLanguage === 'vi' ? 'Số người tối đa' : 
                     'Maximum Guests'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-900">
                    {selectedProperty.maxAdults !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">
                          {currentLanguage === 'ko' ? `성인 ${selectedProperty.maxAdults}명` : 
                           currentLanguage === 'vi' ? `${selectedProperty.maxAdults} người lớn` : 
                           `${selectedProperty.maxAdults} adults`}
                        </span>
                      </div>
                    )}
                    {selectedProperty.maxChildren !== undefined && selectedProperty.maxChildren > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">
                          {currentLanguage === 'ko' ? `어린이 ${selectedProperty.maxChildren}명` : 
                           currentLanguage === 'vi' ? `${selectedProperty.maxChildren} trẻ em` : 
                           `${selectedProperty.maxChildren} children`}
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
                {selectedProperty.amenities && selectedProperty.amenities.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {AMENITY_OPTIONS.filter(amenity => selectedProperty.amenities?.includes(amenity.id)).map((amenity) => {
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
                    if (!modalCheckInDate || !modalCheckOutDate || !selectedProperty) return;
                    
                    // 비회원이면 로그인 페이지로 이동
                    if (!user) {
                      const returnUrl = `/booking?propertyId=${selectedProperty.id}&checkIn=${modalCheckInDate.toISOString()}&checkOut=${modalCheckOutDate.toISOString()}`;
                      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                      return;
                    }
                    
                    // 로그인된 사용자는 예약 페이지로 이동
                    router.push(`/booking?propertyId=${selectedProperty.id}&checkIn=${modalCheckInDate.toISOString()}&checkOut=${modalCheckOutDate.toISOString()}`);
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
        </div>
      )}

      {/* 모달 내 캘린더 */}
      {showModalCalendar && selectedProperty && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
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
              minDate={parseDate(selectedProperty.checkInDate) || undefined}
              maxDate={parseDate(selectedProperty.checkOutDate) || undefined}
            />
          </div>
        </div>
      )}
    </section>
  );
}
