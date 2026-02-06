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

  // 브랜드 컬러
  const BRAND = {
    primary: '#E63946',
    text: '#111827',
    textSub: '#374151',
    muted: '#9CA3AF',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    bg: '#FAFAFA',
  };

  // 서버 사이드에서는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null;
  }

  return (
    <section className="pt-2 pb-4" style={{ backgroundColor: BRAND.bg }}>
      <div className="w-full">
        {/* 타이틀 */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-xs font-semibold tracking-wide uppercase" style={{ color: BRAND.muted }}>
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
          <div className="flex flex-col gap-4 px-5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BRAND.border}` }}>
                <div className="h-[200px] animate-pulse" style={{ backgroundColor: '#F3F4F6' }}></div>
                <div className="p-4">
                  <div className="h-4 w-3/4 rounded animate-pulse mb-2" style={{ backgroundColor: '#F3F4F6' }}></div>
                  <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: '#F3F4F6' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 데이터가 없을 때 */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12 px-5">
            <p className="text-sm" style={{ color: BRAND.muted }}>{getUIText('noProperties', currentLanguage)}</p>
          </div>
        )}

        {/* 매물 리스트 - 세로 카드 */}
        {!loading && properties.length > 0 && (
          <div className="flex flex-col gap-4 px-5">
            {properties.slice(0, 6).map((property) => {
              const imageUrl = property.images && property.images.length > 0
                ? property.images[0]
                : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

              return (
                <div
                  key={property.id}
                  onClick={() => openPropertyModal(property)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.99]"
                  style={{ border: `1px solid ${BRAND.border}` }}
                >
                  {/* 이미지 */}
                  <div className="relative h-[200px] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 430px) 100vw, 400px"
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
                          <div className="text-white px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: BRAND.text }}>
                            {formatDateForBadge(property.checkInDate, currentLanguage)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 정보 영역 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold line-clamp-1" style={{ color: BRAND.text }}>
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
                      <div className="flex-shrink-0 text-right">
                        <span className="text-base font-extrabold" style={{ color: BRAND.primary }}>
                          {formatPrice(property.price, property.priceUnit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 더보기 - 전체 검색으로 이동 */}
            {properties.length > 6 && (
              <button
                onClick={() => router.push('/search')}
                className="w-full py-3 text-sm font-semibold rounded-2xl transition-all active:scale-[0.98]"
                style={{ 
                  color: BRAND.text, 
                  border: `1.5px solid ${BRAND.border}`,
                  backgroundColor: BRAND.surface,
                }}
              >
                {getUIText('viewAll', currentLanguage) || 'View all properties'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
