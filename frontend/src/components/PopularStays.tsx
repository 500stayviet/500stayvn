/**
 * PopularStays 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 인기 숙소 리스트
 * - 상하 스크롤 가능한 리스트 형태
 * - 각 매물을 카드 형태로 표시
 * - 클릭 시 상세 페이지로 이동
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { SupportedLanguage } from '@/lib/api/translation';
import { useProperties } from '@/hooks/useProperties';
import { getUIText } from '@/utils/i18n';
import { PropertyData } from '@/lib/api/properties';

interface PopularStaysProps {
  currentLanguage: SupportedLanguage;
}

export default function PopularStays({ currentLanguage }: PopularStaysProps) {
  const router = useRouter();
  const { properties, loading } = useProperties();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

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
          {/* 좌측 화살표 버튼 (모바일에서 숨김, 터치 스와이프 사용) */}
          <button
            onClick={scrollLeft}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
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
                  onClick={() => router.push(`/properties/${property.id}`)}
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

            {/* 우측 화살표 버튼 (모바일에서 숨김, 터치 스와이프 사용) */}
            <button
              onClick={scrollRight}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
