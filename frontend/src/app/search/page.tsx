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
import { getAvailableProperties, PropertyData } from '@/lib/api/properties';
import { geocodeAddress } from '@/lib/api/geocoding';
import { getUIText } from '@/utils/i18n';
import PropertyCard from '@/components/PropertyCard';
import { Home, User, Calendar, Users, ChevronLeft, ChevronRight, MapPin, Search, X } from 'lucide-react';
import CalendarComponent from '@/components/CalendarComponent';
import Image from 'next/image';
import { AMENITY_OPTIONS } from '@/lib/constants/amenities';
import PropertyModal from '@/components/map/PropertyModal';
import { 
  parseDate, 
  formatPrice, 
  formatFullPrice, 
} from '@/lib/utils/propertyUtils';

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
  const { currentLanguage } = useLanguage();
  
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
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // 모달 내 날짜 선택
  const [modalCheckInDate, setModalCheckInDate] = useState<Date | null>(null);
  const [modalCheckOutDate, setModalCheckOutDate] = useState<Date | null>(null);
  const [showModalCalendar, setShowModalCalendar] = useState(false);
  const [modalCalendarMode, setModalCalendarMode] = useState<'checkin' | 'checkout'>('checkin');

  // 가격 포맷팅
  const formatPriceForModal = (price: number, unit: 'vnd' | 'usd') => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  // 매물 클릭 시 모달 열기
  const handlePropertyClick = (property: PropertyData) => {
    setSelectedProperty(property);
    setModalImageIndex(0);
    setModalCheckInDate(null);
    setModalCheckOutDate(null);
    setShowPropertyModal(true);
  };

  // 이전 매물로 이동
  const handlePrevProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(p => p.id === selectedProperty.id);
    const prevIndex = currentIndex <= 0 ? filteredProperties.length - 1 : currentIndex - 1;
    setSelectedProperty(filteredProperties[prevIndex]);
    setModalImageIndex(0);
    setModalCheckInDate(null);
    setModalCheckOutDate(null);
  };

  // 다음 매물로 이동
  const handleNextProperty = () => {
    if (!selectedProperty || filteredProperties.length <= 1) return;
    const currentIndex = filteredProperties.findIndex(p => p.id === selectedProperty.id);
    const nextIndex = currentIndex >= filteredProperties.length - 1 ? 0 : currentIndex + 1;
    setSelectedProperty(filteredProperties[nextIndex]);
    setModalImageIndex(0);
    setModalCheckInDate(null);
    setModalCheckOutDate(null);
  };

  // 현재 매물 인덱스
  const getCurrentPropertyIndex = () => {
    if (!selectedProperty) return 0;
    return filteredProperties.findIndex(p => p.id === selectedProperty.id) + 1;
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
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowPropertyModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 이전 매물 버튼 (모달 내부 좌측) */}
            {filteredProperties.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevProperty();
                }}
                className="absolute left-2 top-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* 다음 매물 버튼 (모달 내부 우측) */}
            {filteredProperties.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextProperty();
                }}
                className="absolute right-2 top-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2.5 rounded-full transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* 매물 인덱스 표시 */}
            {filteredProperties.length > 1 && (
              <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {getCurrentPropertyIndex()} / {filteredProperties.length}
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowPropertyModal(false)}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 이미지 */}
            <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <>
                  <Image
                    src={selectedProperty.images[modalImageIndex] || selectedProperty.images[0]}
                    alt={selectedProperty.title || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 430px) 100vw, 430px"
                  />
                  
                  {/* 즉시입주가능 뱃지 */}
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
                        {(() => {
                          const date = parseDateForModal(selectedProperty.checkInDate);
                          if (!date) return '';
                          if (currentLanguage === 'ko') {
                            return `${date.getMonth() + 1}월 ${date.getDate()}일부터`;
                          } else if (currentLanguage === 'vi') {
                            return `Từ ${date.getDate()}/${date.getMonth() + 1}`;
                          } else {
                            return `From ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  {/* 이미지 네비게이션 */}
                  {selectedProperty.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setModalImageIndex(prev => prev === 0 ? selectedProperty.images!.length - 1 : prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setModalImageIndex(prev => prev === selectedProperty.images!.length - 1 ? 0 : prev + 1)}
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
                  <div className="absolute top-3 right-12 bg-black/70 text-white px-3 py-1.5 rounded-lg z-10">
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
              {/* 주소 (원문 그대로 표시) */}
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
                        const date = parseDateForModal(selectedProperty.checkInDate);
                        if (!date) return '';
                        return date.toLocaleDateString(
                          currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        );
                      })()}
                      {selectedProperty.checkInDate && selectedProperty.checkOutDate && ' ~ '}
                      {selectedProperty.checkOutDate && (() => {
                        const date = parseDateForModal(selectedProperty.checkOutDate);
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
                    
                    // 비회원이면 로그인 페이지로 이동 (현재 매물 정보를 returnUrl에 포함)
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
              currentLanguage={currentLanguage as 'ko' | 'vi' | 'en'}
              onClose={() => setShowModalCalendar(false)}
              mode={modalCalendarMode}
              minDate={parseDateForModal(selectedProperty.checkInDate) || undefined}
              maxDate={parseDateForModal(selectedProperty.checkOutDate) || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
