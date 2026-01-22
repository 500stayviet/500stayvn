'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import GrabMapComponent from '@/components/GrabMapComponent';
import { getProperty, PropertyData } from '@/lib/api/properties';
import { useAuth } from '@/hooks/useAuth';
import PropertyModal from '@/components/map/PropertyModal';
import { 
  formatPrice, 
  getCityName, 
} from '@/lib/utils/propertyUtils';
import { 
  isAvailableNow,
  formatDateForBadge
} from '@/lib/utils/dateUtils';
import Image from 'next/image';
import { MapPin, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  image?: string;
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

export default function MapPage() {
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);
  
  // 상세 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProperty, setDetailProperty] = useState<PropertyData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 현재 인덱스 추적 (슬라이더용)
  useEffect(() => {
    const container = cardSliderRef.current;
    if (!container || nearbyProperties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      const index = Math.round(scrollLeft / cardWidth);
      if (index !== selectedPropertyIndex && index >= 0 && index < nearbyProperties.length) {
        setSelectedPropertyIndex(index);
        setSelectedProperty(nearbyProperties[index]);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nearbyProperties, selectedPropertyIndex]);

  // 좌우 스크롤 함수
  const scrollLeft = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      
      if (selectedPropertyIndex === 0) {
        const targetIndex = nearbyProperties.length - 1;
        container.scrollTo({ left: targetIndex * cardWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      
      if (selectedPropertyIndex >= nearbyProperties.length - 1) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }
  };

  // URL 파라미터에서 위치 정보 읽기
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const deniedParam = searchParams.get('denied');
  const loadingParam = searchParams.get('loading');
  
  const initialLocation = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : null;
  const locationDenied = deniedParam === 'true';
  const locationLoading = loadingParam === 'true'; // 위치 로딩 중 상태

  // 매물 선택 시 지도 중심 이동
  const handlePropertySelect = (index: number, property: Property) => {
    setSelectedPropertyIndex(index);
    setSelectedProperty(property);
    
    // 슬라이더 이동
    if (cardSliderRef.current) {
      const container = cardSliderRef.current;
      const cardWidth = container.scrollWidth / nearbyProperties.length;
      container.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    }
  };

  // 매물 우선순위 변경 (마커 클릭 시)
  const handlePropertyPriorityChange = (property: Property) => {
    if (nearbyProperties.length === 0) return;
    
    const currentIndex = nearbyProperties.findIndex(p => p.id === property.id);
    if (currentIndex !== -1) {
      handlePropertySelect(currentIndex, property);
    }
  };

  // 매물 상세 모달 열기
  const handleOpenDetailModal = async (propertyId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    
    try {
      const data = await getProperty(propertyId);
      setDetailProperty(data);
    } catch (error) {
      console.error('Failed to load property details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 매물 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailProperty(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        <TopBar />
        
        <main className="flex-1 relative flex flex-col overflow-hidden bg-white">
          {/* 지도 영역 (상단 50%) */}
          <div className="h-[50%] relative border-b border-gray-100">
            <GrabMapComponent 
              onPropertiesChange={setNearbyProperties}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
              onPropertyPriorityChange={handlePropertyPriorityChange}
              initialLocation={initialLocation}
              locationDenied={locationDenied}
              locationLoading={locationLoading}
            />
          </div>

          {/* 하단 매물 목록 영역 (50% - 홈 화면 추천 매물 스타일) */}
          <div className="h-[50%] flex flex-col bg-white py-6 overflow-hidden">
            <div className="px-6 mb-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentLanguage === 'ko' ? '주변 인기 숙소' : 
                   currentLanguage === 'vi' ? 'Chỗ ở phổ biến xung quanh' : 
                   'Popular stays nearby'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {nearbyProperties.length}
                  {currentLanguage === 'ko' ? '개의 매물이 검색되었습니다' : 
                   currentLanguage === 'vi' ? ' tài sản được tìm thấy' : 
                   ' properties found'}
                </p>
              </div>
            </div>

            <div className="flex-1 relative group/slider">
              {/* 좌측 화살표 버튼 */}
              <button
                onClick={scrollLeft}
                className="flex absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover/slider:opacity-100 disabled:opacity-0"
                aria-label="Previous"
                disabled={nearbyProperties.length <= 1}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div 
                ref={cardSliderRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-6"
                style={{
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  scrollSnapType: 'x mandatory'
                }}
              >
                {nearbyProperties.length > 0 ? (
                  nearbyProperties.map((property, index) => {
                    const isCurrentCard = selectedPropertyIndex === index;
                    return (
                      <div 
                        key={property.id}
                        onClick={() => handleOpenDetailModal(property.id)}
                        className={`
                          relative h-[250px] w-[calc(100vw-4rem)] max-w-[320px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg 
                          snap-start transition-all duration-300
                          ${isCurrentCard ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        {/* 이미지 */}
                        <div className="relative w-full h-full">
                          <Image
                            src={property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
                            alt={property.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 430px) 100vw, 320px"
                          />
                          {/* 그라데이션 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>

                          {/* 내부 인디케이터 점 */}
                          {isCurrentCard && nearbyProperties.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                              {Array.from({ length: Math.min(nearbyProperties.length, 5) }).map((_, idx) => {
                                const maxDots = Math.min(nearbyProperties.length, 5);
                                const activeIndex = selectedPropertyIndex % maxDots;
                                const isActive = idx === activeIndex;
                                return (
                                  <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      isActive ? 'bg-white w-5' : 'bg-white/50 w-1.5'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* 좌측 상단: 배지 */}
                          {property.checkInDate && (
                            <div className="absolute top-4 left-4 z-10">
                              {isAvailableNow(property.checkInDate) ? (
                                <div className="bg-green-500 text-white px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  <span className="text-[10px] font-bold">NOW</span>
                                </div>
                              ) : (
                                <div className="bg-blue-500 text-white px-2 py-1 rounded-lg shadow-sm">
                                  <span className="text-[10px] font-bold">
                                    {formatDateForBadge(property.checkInDate, currentLanguage as any)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 콘텐츠 오버레이 */}
                          <div className="absolute inset-0 flex flex-col justify-between p-4">
                            <div className="flex justify-end">
                              <div className="bg-white/95 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-xl shadow-md">
                                <span className="text-sm font-black tracking-tight">
                                  {formatPrice(property.price, 'vnd')}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-white text-base font-bold drop-shadow-md line-clamp-1">
                                {property.name}
                              </h3>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-white/80" />
                                <span className="text-white/90 text-xs truncate">
                                  {getCityName(property.address)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center text-gray-400 py-10">
                      <MapPin className="w-12 h-12 opacity-10 mb-2" />
                      <p className="text-sm">
                        {currentLanguage === 'ko' ? '주변에 매물이 없습니다' : 
                         currentLanguage === 'vi' ? 'Không có tài sản nào xung quanh' : 
                         'No properties found nearby'}
                      </p>
                    </div>
                  )}
              </div>

              {/* 우측 화살표 버튼 */}
              <button
                onClick={scrollRight}
                className="flex absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover/slider:opacity-100 disabled:opacity-0"
                aria-label="Next"
                disabled={nearbyProperties.length <= 1}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </main>

        {/* 매물 상세 모달 */}
        {showDetailModal && detailProperty && (
          <PropertyModal
            propertyData={detailProperty}
            currentLanguage={currentLanguage}
            onClose={handleCloseDetailModal}
          />
        )}
        
        {/* 로딩 중 표시 */}
        {detailLoading && (
          <div className="absolute inset-0 z-[110] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                {currentLanguage === 'ko' ? '로딩 중...' : 
                 currentLanguage === 'vi' ? 'Đang tải...' : 
                 'Loading...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
