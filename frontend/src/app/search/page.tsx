/**
 * Search Results Page (검색 결과 페이지)
 * * - 주소/업장 검색 결과 표시
 * - 날짜 및 인원수 필터
 * - 주소 기반 매물 필터링
 */

'use client';

import { useState, useEffect, Suspense } from 'react'; // 1. Suspense 추가
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAvailableProperties } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import { geocodeAddress } from '@/lib/api/geocoding';
import { getUIText } from '@/utils/i18n';
import PropertyCard from '@/components/PropertyCard';
import { Home, User, Calendar, Users, ChevronLeft, ChevronRight, MapPin, Search, X } from 'lucide-react';
import CalendarComponent from '@/components/CalendarComponent';
import Image from 'next/image';
import { AMENITY_OPTIONS } from '@/lib/constants/amenities';
import PropertyModal from '@/components/map/PropertyModal';
import { 
  formatPrice, 
  formatFullPrice, 
} from '@/lib/utils/propertyUtils';
import { 
  parseDate, 
  isAvailableNow,
  formatDateForBadge
} from '@/lib/utils/dateUtils';

// 두 좌표 간 거리 계산 (Haversine 공식)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km 단위
}

// 2. 실제 로직이 담긴 컴포넌트로 분리
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // 날짜 필터
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  
  // 인원수 필터
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  
  // 고급 설정
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000); // 최대 50M VND (기본값)
  
  // 필터 적용 상태 (검색 버튼을 눌러야 필터 적용)
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // 매물 상세 모달
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);

  // 매물 클릭 시 모달 열기
  const handlePropertyClick = (property: PropertyData) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // 이전 매물로 이동
  const handlePrevProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(p => p.id === selectedProperty.id);
    const prevIndex = currentIndex <= 0 ? filteredProperties.length - 1 : currentIndex - 1;
    setSelectedProperty(filteredProperties[prevIndex]);
  };

  // 다음 매물로 이동
  const handleNextProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(p => p.id === selectedProperty.id);
    const nextIndex = currentIndex >= filteredProperties.length - 1 ? 0 : currentIndex + 1;
    setSelectedProperty(filteredProperties[nextIndex]);
  };

  // 현재 매물 인덱스
  const getCurrentPropertyIndex = () => {
    if (!selectedProperty) return 0;
    return filteredProperties.findIndex(p => p.id === selectedProperty.id);
  };

  // 매물 데이터 로드
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const allProperties = await getAvailableProperties();
        setProperties(allProperties);
        
        if (allProperties.length > 0) {
          const maxPropertyPrice = Math.max(...allProperties.map(p => p.price || 0));
          if (maxPropertyPrice > 0) {
            setMaxPrice(Math.ceil(maxPropertyPrice * 1.1));
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    
    loadProperties();
  }, []);

  // 주소를 좌표로 변환
  const geocodeSearchQuery = async () => {
    if (!searchQuery.trim()) {
      setSearchLocation(null);
      return;
    }

    try {
      const result = await geocodeAddress(searchQuery, currentLanguage);
      setSearchLocation({ lat: result.lat, lng: result.lng });
    } catch (error) {
      setSearchLocation(null);
    }
  };

  // 매물 필터링
  const applyFilters = () => {
    let filtered = properties;

    if (searchLocation) {
      filtered = filtered
        .filter((property) => {
          if (!property.coordinates) return false;
          const distance = calculateDistance(
            searchLocation.lat,
            searchLocation.lng,
            property.coordinates.lat,
            property.coordinates.lng
          );
          return distance <= 50;
        });
    }

    if (checkInDate && checkOutDate) {
      filtered = filtered.filter((property) => {
        if (!property.checkInDate || !property.checkOutDate) return false;
        const propCheckInDate = parseDate(property.checkInDate);
        const propCheckOutDate = parseDate(property.checkOutDate);
        if (!propCheckInDate || !propCheckOutDate) return false;
        return checkInDate <= propCheckOutDate && checkOutDate >= propCheckInDate;
      });
    }

    filtered = filtered.filter((property) => {
      const maxTotalGuests = (property.maxAdults || 0) + (property.maxChildren || 0);
      const requiredGuests = adults + children;
      return maxTotalGuests >= requiredGuests;
    });

    filtered = filtered.filter((property) => {
      const price = property.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    if (searchLocation) {
      filtered = filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distA = calculateDistance(searchLocation.lat, searchLocation.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(searchLocation.lat, searchLocation.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });
    }

    setFilteredProperties(filtered);
    setFiltersApplied(true);
  };

  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    }
  }, [properties, filtersApplied]);

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    setCheckOutDate(null);
    setCalendarMode('checkout');
    setShowCalendar(true);
  };

  const handleCheckOutSelect = (date: Date) => {
    setCheckOutDate(date);
    setShowCalendar(false);
    setShowGuestSelector(false);
  };

  const openCalendar = (mode: 'checkin' | 'checkout') => {
    setCalendarMode(mode);
    setShowCalendar(true);
    setShowGuestSelector(false);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const adjustAdults = (delta: number) => {
    setAdults(Math.max(1, adults + delta));
  };

  const adjustChildren = (delta: number) => {
    setChildren(Math.max(0, children + delta));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Home className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={() => router.push(user ? '/profile' : '/login')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {searchQuery && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{searchQuery}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            <button onClick={() => openCalendar('checkin')} className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">{currentLanguage === 'ko' ? '체크인' : 'Check-in'}</div>
                  <div className="text-sm font-medium text-gray-900">{checkInDate ? formatDate(checkInDate) : 'Select date'}</div>
                </div>
              </div>
            </button>

            <button onClick={() => openCalendar('checkout')} className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">{currentLanguage === 'ko' ? '체크아웃' : 'Check-out'}</div>
                  <div className="text-sm font-medium text-gray-900">{checkOutDate ? formatDate(checkOutDate) : 'Select date'}</div>
                </div>
              </div>
            </button>

            <button onClick={() => { setShowGuestSelector(!showGuestSelector); setShowCalendar(false); }} className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">{currentLanguage === 'ko' ? '인원' : 'Guests'}</div>
                  <div className="text-sm font-medium text-gray-900">{adults + children} 명</div>
                </div>
              </div>
            </button>
          </div>

          {showGuestSelector && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500">{currentLanguage === 'ko' ? '성인' : 'Adults'}</div>
                  <div className="text-sm font-medium">{adults}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustAdults(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => adjustAdults(1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500">{currentLanguage === 'ko' ? '어린이' : 'Children'}</div>
                  <div className="text-sm font-medium">{children}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustChildren(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => adjustChildren(1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-center">
            <button onClick={() => { setShowAdvancedSettings(!showAdvancedSettings); setShowCalendar(false); setShowGuestSelector(false); }} className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
              <span>{currentLanguage === 'ko' ? '고급설정' : 'Advanced Settings'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">{currentLanguage === 'ko' ? '가격 범위' : 'Price Range'}</label>
                <div className="space-y-3">
                  <input type="range" min="0" max={maxPrice} value={minPrice} onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <input type="range" min="0" max={maxPrice} value={maxPrice} onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="text-gray-600">Min</span><span className="font-medium text-gray-900">{minPrice.toLocaleString()} VND</span></div>
                    <div className="flex items-center gap-2"><span className="text-gray-600">Max</span><span className="font-medium text-gray-900">{maxPrice.toLocaleString()} VND</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button onClick={async () => { setShowCalendar(false); setShowGuestSelector(false); await geocodeSearchQuery(); applyFilters(); }} className="w-full mt-4 py-3.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
            <Search className="w-5 h-5" />
            <span>{currentLanguage === 'ko' ? '검색하기' : 'Search'}</span>
          </button>
        </div>

        {showCalendar && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeCalendar}>
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent checkInDate={checkInDate} checkOutDate={checkOutDate} onCheckInSelect={handleCheckInSelect} onCheckOutSelect={handleCheckOutSelect} currentLanguage={currentLanguage} onClose={closeCalendar} mode={calendarMode} onCheckInReset={() => { setCheckInDate(null); setCheckOutDate(null); setCalendarMode('checkin'); }} />
            </div>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Searching...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No results found.</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">{filteredProperties.length} 개의 매물을 찾았습니다.</div>
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} isSelected={false} onClick={() => handlePropertyClick(property)} currentLanguage={currentLanguage} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showPropertyModal && selectedProperty && (
        <PropertyModal propertyData={selectedProperty} currentLanguage={currentLanguage} onClose={() => setShowPropertyModal(false)} onPrev={handlePrevProperty} onNext={handleNextProperty} hasPrev={filteredProperties.length > 1} hasNext={filteredProperties.length > 1} currentIndex={getCurrentPropertyIndex()} totalProperties={filteredProperties.length} />
      )}
    </div>
  );
}

// 3. 빌드 에러 해결을 위한 외부 래퍼
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}