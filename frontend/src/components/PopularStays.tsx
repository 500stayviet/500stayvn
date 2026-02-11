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
import { MapPin, ChevronLeft, ChevronRight, Calendar, Bed, Bath, Users } from 'lucide-react';
import Image from 'next/image';
import { SupportedLanguage } from '@/lib/api/translation';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { getUIText } from '@/utils/i18n';
import { PropertyData } from '@/types/property';
import { 
  formatPrice, 
  getCityName, 
} from '@/lib/utils/propertyUtils';
import { 
  isAvailableNow, 
  formatDateForBadge 
} from '@/lib/utils/dateUtils';

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

  // 클라이언트 사이드에서만 렌더링 (SSR 방지)
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // 매물 클릭 시 /properties/[id] 로 이동 (인터셉팅 라우트에서 모달처럼 표시)
  const openPropertyModal = (property: PropertyData) => {
    router.push(`/properties/${property.id}`);
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
          {getUIText('popularStaysTitle', currentLanguage)}
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
                  className="relative h-[260px] w-[calc(100vw-2rem)] sm:w-[350px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                {/* 이미지 */}
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={property.address || 'Property'}
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
                        const maxDots = Math.min(properties.length, 5);
                        const activeIndex = currentIndex % maxDots;
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
                            {getUIText('availableNow', currentLanguage)}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                          <span className="text-xs font-semibold">
                            {formatDateForBadge(property.checkInDate, currentLanguage)}
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
                        {property.address || getCityName(property.address)}
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

    </section>
  );
}
