/**
 * Search Results Page (검색 결과 페이지)
 * 
 * - 주소/업장 검색 결과 표시
 * - 날짜 및 인원수 필터
 * - 주소 기반 매물 필터링
 */

'use client';

import { useState, useEffect } from 'react';
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

// 달력 컴포넌트는 components/CalendarComponent.tsx에서 import하여 사용

export default function SearchPage() {
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
        
        // 최대 가격 계산 (매물 중 가장 높은 가격)
        if (allProperties.length > 0) {
          const maxPropertyPrice = Math.max(...allProperties.map(p => p.price || 0));
          if (maxPropertyPrice > 0) {
            // 최대 가격을 약간 여유있게 설정 (10% 증가)
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

  // 주소를 좌표로 변환 (검색 버튼을 눌렀을 때만 실행)
  const geocodeSearchQuery = async () => {
    if (!searchQuery.trim()) {
      setSearchLocation(null);
      return;
    }

    try {
      const result = await geocodeAddress(searchQuery, currentLanguage);
      setSearchLocation({ lat: result.lat, lng: result.lng });
    } catch (error) {
      // Geocoding 오류는 조용히 처리 (REQUEST_DENIED 등)
      setSearchLocation(null);
    }
  };

  // 매물 필터링 (검색 버튼을 눌렀을 때만 적용)
  const applyFilters = () => {
    let filtered = properties;

    // 주소 기반 거리 필터링
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

    // 날짜 필터링
    if (checkInDate && checkOutDate) {
      filtered = filtered.filter((property) => {
        if (!property.checkInDate || !property.checkOutDate) return false;
        
        const propCheckInDate = parseDate(property.checkInDate);
        const propCheckOutDate = parseDate(property.checkOutDate);
        
        if (!propCheckInDate || !propCheckOutDate) return false;
        
        // 검색 날짜가 매물의 임대 가능 기간과 겹치는지 확인
        return checkInDate <= propCheckOutDate && checkOutDate >= propCheckInDate;
      });
    }

    // 인원 필터링
    filtered = filtered.filter((property) => {
      const maxTotalGuests = (property.maxAdults || 0) + (property.maxChildren || 0);
      const requiredGuests = adults + children;
      
      // 매물의 최대 인원이 요구 인원 이상이어야 함
      return maxTotalGuests >= requiredGuests;
    });

    // 가격 필터링
    filtered = filtered.filter((property) => {
      const price = property.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // 거리순 정렬 (주소 검색이 있는 경우)
    if (searchLocation) {
      filtered = filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        
        const distA = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          a.coordinates.lat,
          a.coordinates.lng
        );
        const distB = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          b.coordinates.lat,
          b.coordinates.lng
        );
        
        return distA - distB;
      });
    }

    setFilteredProperties(filtered);
    setFiltersApplied(true);
  };

  // 초기 로드 시 모든 매물 표시
  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    }
  }, [properties, filtersApplied]);

  // 체크인 날짜 선택
  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    setCheckOutDate(null); // 체크아웃 초기화
    // 달력을 닫지 않고 체크아웃 모드로 전환
    setCalendarMode('checkout');
    setShowCalendar(true); // 달력 유지
  };

  // 체크아웃 날짜 선택
  const handleCheckOutSelect = (date: Date) => {
    setCheckOutDate(date);
    setShowCalendar(false);
    setShowGuestSelector(false);
  };

  // 달력 열기
  const openCalendar = (mode: 'checkin' | 'checkout') => {
    setCalendarMode(mode);
    setShowCalendar(true);
    setShowGuestSelector(false);
  };

  // 달력 닫기
  const closeCalendar = () => {
    setShowCalendar(false);
  };

  // 달력 날짜 포맷
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 인원수 증가/감소
  const adjustAdults = (delta: number) => {
    setAdults(Math.max(1, adults + delta));
  };

  const adjustChildren = (delta: number) => {
    setChildren(Math.max(0, children + delta));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => router.push(user ? '/profile' : '/login')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          {/* 검색어 표시 */}
          {searchQuery && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{searchQuery}</span>
              </div>
            </div>
          )}
        </div>

        {/* 필터 섹션 */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            {/* 체크인 필터 */}
            <button
              onClick={() => openCalendar('checkin')}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'ko' ? '체크인' : currentLanguage === 'vi' ? 'Nhận phòng' : 'Check-in'}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {checkInDate ? formatDate(checkInDate) : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                  </div>
                </div>
              </div>
            </button>

            {/* 체크아웃 필터 */}
            <button
              onClick={() => openCalendar('checkout')}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'ko' ? '체크아웃' : currentLanguage === 'vi' ? 'Trả phòng' : 'Check-out'}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {checkOutDate ? formatDate(checkOutDate) : (currentLanguage === 'ko' ? '날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày' : 'Select date')}
                  </div>
                </div>
              </div>
            </button>

            {/* 인원수 필터 */}
            <button 
              onClick={() => {
                setShowGuestSelector(!showGuestSelector);
                setShowCalendar(false);
              }}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'ko' ? '인원' : currentLanguage === 'vi' ? 'Số người' : 'Guests'}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {adults + children} {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? 'người' : ''}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* 인원수 조절 UI */}
          {showGuestSelector && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {/* 소인 (성인) */}
              <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'ko' ? '성인' : currentLanguage === 'vi' ? 'Người lớn' : 'Adults'}
                  </div>
                  <div className="text-sm font-medium">{adults}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustAdults(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => adjustAdults(1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 대인 (어린이) */}
              <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'ko' ? '어린이' : currentLanguage === 'vi' ? 'Trẻ em' : 'Children'}
                  </div>
                  <div className="text-sm font-medium">{children}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustChildren(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => adjustChildren(1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 고급설정 버튼 */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => {
                setShowAdvancedSettings(!showAdvancedSettings);
                setShowCalendar(false);
                setShowGuestSelector(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <span>{currentLanguage === 'ko' ? '고급설정' : currentLanguage === 'vi' ? 'Cài đặt nâng cao' : 'Advanced Settings'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* 고급설정 패널 */}
          {showAdvancedSettings && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {currentLanguage === 'ko' ? '가격 범위' : currentLanguage === 'vi' ? 'Phạm vi giá' : 'Price Range'}
                </label>
                <div className="space-y-3">
                  {/* 가격 슬라이더 */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  
                  {/* 가격 표시 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {currentLanguage === 'ko' ? '최소' : currentLanguage === 'vi' ? 'Tối thiểu' : 'Min'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {minPrice.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <span className="text-gray-400">~</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {currentLanguage === 'ko' ? '최대' : currentLanguage === 'vi' ? 'Tối đa' : 'Max'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {maxPrice.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 검색 버튼 */}
          <button
            onClick={async () => {
              setShowCalendar(false);
              setShowGuestSelector(false);
              
              // 주소를 좌표로 변환
              await geocodeSearchQuery();
              
              // 필터 적용
              applyFilters();
            }}
            className="w-full mt-4 py-3.5 px-6 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span>
              {currentLanguage === 'ko' ? '검색하기' : currentLanguage === 'vi' ? 'Tìm kiếm' : 'Search'}
            </span>
          </button>
        </div>

        {/* 달력 모달 */}
        {showCalendar && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeCalendar}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onCheckInSelect={handleCheckInSelect}
                onCheckOutSelect={handleCheckOutSelect}
                onCheckInReset={() => {
                  setCheckInDate(null);
                  setCheckOutDate(null);
                  setCalendarMode('checkin');
                }}
                currentLanguage={currentLanguage as 'ko' | 'vi' | 'en'}
                onClose={closeCalendar}
                mode={calendarMode}
              />
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              {currentLanguage === 'ko' ? '검색 중...' : currentLanguage === 'vi' ? 'Đang tìm kiếm...' : 'Searching...'}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">
                {currentLanguage === 'ko' ? '검색 결과가 없습니다.' : currentLanguage === 'vi' ? 'Không tìm thấy kết quả.' : 'No results found.'}
              </p>
              <p className="text-sm">
                {currentLanguage === 'ko' ? '다른 검색어로 시도해보세요.' : currentLanguage === 'vi' ? 'Thử tìm kiếm với từ khóa khác.' : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {filteredProperties.length} {currentLanguage === 'ko' ? '개의 매물을 찾았습니다.' : currentLanguage === 'vi' ? 'bất động sản được tìm thấy.' : 'properties found.'}
              </div>
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSelected={false}
                  onClick={() => handlePropertyClick(property)}
                  currentLanguage={currentLanguage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 매물 상세 모달 */}
      {showPropertyModal && selectedProperty && (
        <PropertyModal
          propertyData={selectedProperty}
          currentLanguage={currentLanguage}
          onClose={() => setShowPropertyModal(false)}
          onPrev={handlePrevProperty}
          onNext={handleNextProperty}
          hasPrev={filteredProperties.length > 1}
          hasNext={filteredProperties.length > 1}
          currentIndex={getCurrentPropertyIndex()}
          totalProperties={filteredProperties.length}
        />
      )}
    </div>
  );
}
