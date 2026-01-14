'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GrabMapComponent from '@/components/GrabMapComponent';

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  image?: string;
  address?: string;
}

export default function MapPage() {
  const { currentLanguage } = useLanguage();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);

  // 매물 선택 시 지도 중심 이동
  const handlePropertySelect = (index: number, property: Property) => {
    setSelectedPropertyIndex(index);
    setSelectedProperty(property);
  };

  // 매물 우선순위 변경 (마커 클릭 시)
  const handlePropertyPriorityChange = (property: Property) => {
    console.log('=== 마커 클릭 이벤트 ===');
    console.log('선택된 매물:', property);
    console.log('현재 nearbyProperties 개수:', nearbyProperties.length);
    
    // nearbyProperties가 비어있으면 아무것도 하지 않음
    if (nearbyProperties.length === 0) {
      console.warn('nearbyProperties가 비어있습니다. 지도가 아직 로드되지 않았을 수 있습니다.');
      return;
    }
    
    // 선택된 매물을 첫 번째로 이동
    const currentProperties = [...nearbyProperties];
    const selectedIndex = currentProperties.findIndex(p => p.id === property.id);
    
    console.log('선택된 매물 인덱스:', selectedIndex);
    
    if (selectedIndex !== -1) {
      // 선택된 매물을 첫 번째로 이동
      const newProperties = [
        property,
        ...currentProperties.filter((_, i) => i !== selectedIndex)
      ];
      
      console.log('매물 순서 변경:', {
        이전: currentProperties.map(p => p.name),
        이후: newProperties.map(p => p.name)
      });
      
      setNearbyProperties(newProperties);
      setSelectedPropertyIndex(0);
      setSelectedProperty(property);
      
      // 하단 카드를 첫 번째로 스크롤 (렌더링 후)
      setTimeout(() => {
        scrollToFirstCard();
        console.log('첫 번째 카드로 스크롤 완료');
      }, 300);
    } else {
      console.error('선택된 매물을 찾을 수 없습니다!');
      console.error('매물 ID:', property.id);
      console.error('매물 이름:', property.name);
      console.error('현재 매물 목록:', currentProperties.map(p => ({ id: p.id, name: p.name })));
    }
  };

  // 첫 번째 카드로 스크롤
  const scrollToFirstCard = () => {
    if (cardSliderRef.current) {
      cardSliderRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg flex flex-col">
        <TopBar 
          currentLanguage={currentLanguage}
          showLanguageSelector={true}
        />
        
        {/* 지도 영역 */}
        <div className="flex-1 relative" style={{ height: '50vh', minHeight: '400px' }}>
          <GrabMapComponent 
            onPropertiesChange={setNearbyProperties}
            onPropertySelect={setSelectedPropertyIndex}
            selectedProperty={selectedProperty}
            onPropertyPriorityChange={handlePropertyPriorityChange}
          />
        </div>

        {/* 매물 카드 영역 (지도 아래) */}
        {nearbyProperties.length > 0 && (
          <div className="bg-white border-t border-gray-200">
            <MapPropertyCards 
              properties={nearbyProperties}
              selectedIndex={selectedPropertyIndex}
              onSelect={handlePropertySelect}
              currentLanguage={currentLanguage}
              cardSliderRef={cardSliderRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 매물 카드 컴포넌트 (PopularStays 스타일)
function MapPropertyCards({ 
  properties, 
  selectedIndex, 
  onSelect,
  currentLanguage,
  cardSliderRef: externalCardSliderRef
}: { 
  properties: Property[];
  selectedIndex: number;
  onSelect: (index: number, property: Property) => void;
  currentLanguage: string;
  cardSliderRef?: React.RefObject<HTMLDivElement>;
}) {
  const internalScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalCardSliderRef || internalScrollContainerRef;
  const [currentIndex, setCurrentIndex] = useState(0);

  // 가격 포맷팅
  const formatPrice = (price: number): string => {
    return `${(price / 1000000).toFixed(1)}M VND`;
  };

  // 주소에서 도시명 추출
  const getCityName = (address?: string): string => {
    if (!address) return 'Ho Chi Minh City';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address;
  };

  // 카드 너비 계산
  const getCardWidth = () => {
    if (typeof window === 'undefined') return 350;
    const isMobile = window.innerWidth < 640;
    return isMobile ? window.innerWidth - 32 : 350;
  };

  // 스크롤 이벤트로 현재 인덱스 추적
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || properties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = getCardWidth() + 16;
      const index = Math.round(scrollLeft / cardWidth);
      const normalizedIndex = Math.max(0, Math.min(index, properties.length - 1));
      setCurrentIndex(normalizedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [properties.length]);

  // selectedIndex가 0으로 변경되면 첫 번째 카드로 스크롤
  useEffect(() => {
    if (selectedIndex === 0 && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            left: 0,
            behavior: 'smooth',
          });
          setCurrentIndex(0);
        }
      }, 100);
    }
  }, [selectedIndex]);

  // 좌우 스크롤 함수
  const scrollLeft = () => {
    if (scrollContainerRef.current && properties.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = getCardWidth() + 16;
      
      if (currentIndex === 0) {
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
      const cardWidth = getCardWidth() + 16;
      
      if (currentIndex >= properties.length - 1) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
        setCurrentIndex(0);
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  return (
    <section className="py-6 bg-white">
      <div className="w-full px-4">
        {/* 타이틀 */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">
          {currentLanguage === 'ko' 
            ? '지도 내 매물' 
            : currentLanguage === 'vi'
            ? 'Bất động sản trên bản đồ'
            : 'Properties on Map'}
        </h2>

        <div className="relative">
          {/* 좌측 화살표 버튼 */}
          <button
            onClick={scrollLeft}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* 매물 리스트 */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 sm:px-10"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {properties.map((property, index) => {
              const imageUrl = property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
              const isCurrentCard = currentIndex === index;

              return (
                <div
                  key={property.id}
                  onClick={() => {
                    onSelect(index, property);
                  }}
                  className="relative h-[280px] w-[calc(100vw-2rem)] sm:w-[350px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* 이미지 */}
                  <div className="relative w-full h-full">
                    <img
                      src={imageUrl}
                      alt={property.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                    {/* 인디케이터 점 */}
                    {isCurrentCard && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                        {Array.from({ length: Math.min(properties.length, 5) }).map((_, idx) => {
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

                    {/* 콘텐츠 오버레이 */}
                    <div className="absolute inset-0 flex flex-col justify-between p-5">
                      {/* 상단: 금액 */}
                      <div className="flex justify-end">
                        <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl shadow-lg">
                          <span className="text-lg font-bold">
                            {formatPrice(property.price)}
                          </span>
                        </div>
                      </div>

                      {/* 하단: 제목과 위치 */}
                      <div className="space-y-2">
                        <h3 className="text-white text-lg font-bold drop-shadow-lg line-clamp-2">
                          {property.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white" />
                          <span className="text-white text-sm drop-shadow-lg">
                            {getCityName(property.address)}
                          </span>
                        </div>
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
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
