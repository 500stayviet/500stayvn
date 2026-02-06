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

  // 브랜드 컬러 (하단바와 통일)
  const BRAND = {
    primary: '#E63946',
    text: '#1F2937',
    muted: '#9CA3AF',
    surface: '#FFFFFF',
    border: '#F3F4F6',
  };

  // 서버 사이드에서는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null;
  }

  return (
    <section className="py-5 bg-white">
      <div className="w-full">
        {/* 타이틀 - 항상 표시 */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-base font-bold" style={{ color: BRAND.text }}>
            {getUIText('popularStaysTitle', currentLanguage)}
          </h2>
          {!loading && properties.length > 0 && (
            <span className="text-xs font-medium" style={{ color: BRAND.muted }}>
              {properties.length}{getUIText('propertiesCount', currentLanguage)}
            </span>
          )}
        </div>

        {/* 로딩 중일 때 */}
        {loading && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px]">
                <div className="h-[180px] rounded-xl animate-pulse" style={{ backgroundColor: BRAND.border }}></div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: BRAND.border }}></div>
                  <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: BRAND.border }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 데이터가 없을 때 (로딩 완료 후) */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-sm" style={{ color: BRAND.muted }}>{getUIText('noProperties', currentLanguage)}</p>
          </div>
        )}

        {/* 매물 리스트 (로딩 완료 후 데이터가 있을 때) */}
        {!loading && properties.length > 0 && (
          <div className="relative">
            {/* 좌측 화살표 버튼 */}
            <button
              onClick={scrollLeft}
              className="flex absolute left-1 top-[90px] -translate-y-1/2 z-20 rounded-full p-1.5 shadow-md transition-all"
              style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: BRAND.text }} />
            </button>

            {/* 매물 리스트 (좌우 스크롤 가능) */}
            <div
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-4"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {properties.map((property, index) => {
                const imageUrl = property.images && property.images.length > 0
                  ? property.images[0]
                  : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

                return (
                  <div
                    key={property.id}
                    onClick={() => openPropertyModal(property)}
                    className="flex-shrink-0 w-[280px] cursor-pointer group"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* 이미지 */}
                    <div className="relative h-[180px] rounded-xl overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="280px"
                      />

                      {/* 상단 배지 */}
                      {property.checkInDate && (
                        <div className="absolute top-3 left-3 z-10">
                          {isAvailableNow(property.checkInDate) ? (
                            <div className="text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5" style={{ backgroundColor: '#059669' }}>
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              {getUIText('availableNow', currentLanguage)}
                            </div>
                          ) : (
                            <div className="text-white px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: '#2563EB' }}>
                              {formatDateForBadge(property.checkInDate, currentLanguage)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 가격 배지 */}
                      <div className="absolute bottom-3 right-3 z-10 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                        <span className="text-sm font-bold" style={{ color: BRAND.primary }}>
                          {formatPrice(property.price, property.priceUnit)}
                        </span>
                      </div>
                    </div>

                    {/* 정보 영역 */}
                    <div className="mt-2.5 px-0.5">
                      <h3 className="text-sm font-semibold line-clamp-1" style={{ color: BRAND.text }}>
                        {property.title}
                      </h3>
                      {property.address && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: BRAND.muted }} />
                          <span className="text-xs truncate" style={{ color: BRAND.muted }}>
                            {getCityName(property.address)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 인디케이터 점 */}
            {properties.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: Math.min(properties.length, 5) }).map((_, idx) => {
                  const maxDots = Math.min(properties.length, 5);
                  const activeIndex = currentIndex % maxDots;
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={idx}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: isActive ? '20px' : '6px',
                        backgroundColor: isActive ? BRAND.primary : '#E5E7EB',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* 우측 화살표 버튼 */}
            <button
              onClick={scrollRight}
              className="flex absolute right-1 top-[90px] -translate-y-1/2 z-20 rounded-full p-1.5 shadow-md transition-all"
              style={{ backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}` }}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" style={{ color: BRAND.text }} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
