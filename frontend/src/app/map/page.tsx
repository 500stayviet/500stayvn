'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, ChevronLeft, ChevronRight, X, Bed, Bath, Calendar, Users, Wind, Sofa, UtensilsCrossed, WashingMachine, Refrigerator, Table, Shirt, Wifi, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GrabMapComponent from '@/components/GrabMapComponent';
import CalendarComponent from '@/components/CalendarComponent';
import { getProperty, PropertyData } from '@/lib/api/properties';
import { useAuth } from '@/hooks/useAuth';

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
  const searchParams = useSearchParams();
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);
  
  // 상세 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProperty, setDetailProperty] = useState<PropertyData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
  };

  // 매물 우선순위 변경 (마커 클릭 시)
  const handlePropertyPriorityChange = (property: Property) => {
    // nearbyProperties가 비어있으면 아무것도 하지 않음
    if (nearbyProperties.length === 0) {
      return;
    }
    
    // 선택된 매물을 첫 번째로 이동
    const currentProperties = [...nearbyProperties];
    const selectedIndex = currentProperties.findIndex(p => p.id === property.id);
    
    if (selectedIndex !== -1) {
      // 선택된 매물을 첫 번째로 이동
      const newProperties = [
        property,
        ...currentProperties.filter((_, i) => i !== selectedIndex)
      ];
      
      setNearbyProperties(newProperties);
      setSelectedPropertyIndex(0);
      setSelectedProperty(property);
      
      // 하단 카드를 첫 번째로 스크롤 (렌더링 후)
      setTimeout(() => {
        scrollToFirstCard();
      }, 300);
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

  // 매물 상세 모달 열기
  const handleOpenDetailModal = async (propertyId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    setCurrentImageIndex(0);
    
    try {
      const data = await getProperty(propertyId);
      setDetailProperty(data);
    } catch (error) {
      console.error('Error fetching property details:', error);
      setDetailProperty(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // 매물 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailProperty(null);
    setCurrentImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg flex flex-col">
        <TopBar 
          currentLanguage={currentLanguage}
          hideLanguageSelector={false}
        />
        
        {/* 지도 영역 */}
        <div className="flex-1 relative" style={{ height: '50vh', minHeight: '400px' }}>
          <GrabMapComponent 
            onPropertiesChange={setNearbyProperties}
            onPropertySelect={setSelectedPropertyIndex}
            selectedProperty={selectedProperty}
            onPropertyPriorityChange={handlePropertyPriorityChange}
            initialLocation={initialLocation}
            locationDenied={locationDenied}
          />
        </div>

        {/* 매물 카드 영역 (지도 아래) */}
        {nearbyProperties.length > 0 && (
          <div className="bg-white border-t border-gray-200">
            <MapPropertyCards 
              properties={nearbyProperties}
              selectedIndex={selectedPropertyIndex}
              onSelect={handlePropertySelect}
              onImageClick={handleOpenDetailModal}
              currentLanguage={currentLanguage}
              cardSliderRef={cardSliderRef}
            />
          </div>
        )}
      </div>

      {/* 매물 상세 모달 */}
      {showDetailModal && (
        <PropertyDetailModal
          property={detailProperty}
          loading={detailLoading}
          currentLanguage={currentLanguage}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
}

// 매물 상세 모달 컴포넌트
function PropertyDetailModal({
  property,
  loading,
  currentLanguage,
  currentImageIndex,
  onImageIndexChange,
  onClose,
}: {
  property: PropertyData | null;
  loading: boolean;
  currentLanguage: string;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  
  // 날짜 선택 상태
  const [modalCheckInDate, setModalCheckInDate] = useState<Date | null>(null);
  const [modalCheckOutDate, setModalCheckOutDate] = useState<Date | null>(null);
  const [showModalCalendar, setShowModalCalendar] = useState(false);
  const [modalCalendarMode, setModalCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  
  // 편의시설 옵션 정의
  const AMENITY_OPTIONS = [
    { id: 'bed', label: { ko: '침대', vi: 'Giường', en: 'Bed' }, icon: Bed },
    { id: 'aircon', label: { ko: '에어컨', vi: 'Điều hòa', en: 'Air Conditioner' }, icon: Wind },
    { id: 'sofa', label: { ko: '소파', vi: 'Ghế sofa', en: 'Sofa' }, icon: Sofa },
    { id: 'kitchen', label: { ko: '주방', vi: 'Bếp', en: 'Kitchen' }, icon: UtensilsCrossed },
    { id: 'washing', label: { ko: '세탁기', vi: 'Máy giặt', en: 'Washing Machine' }, icon: WashingMachine },
    { id: 'refrigerator', label: { ko: '냉장고', vi: 'Tủ lạnh', en: 'Refrigerator' }, icon: Refrigerator },
    { id: 'table', label: { ko: '식탁', vi: 'Bàn ăn', en: 'Dining Table' }, icon: Table },
    { id: 'wardrobe', label: { ko: '옷장', vi: 'Tủ quần áo', en: 'Wardrobe' }, icon: Shirt },
    { id: 'wifi', label: { ko: '와이파이', vi: 'WiFi', en: 'WiFi' }, icon: Wifi },
  ] as const;

  // 헬퍼 함수들 (상세 페이지와 동일)
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

  const formatPrice = (price: number, unit: 'vnd' | 'usd') => {
    if (unit === 'vnd') {
      return `${price.toLocaleString('vi-VN')} VND`;
    }
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateInput: string | Date | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return '';
    return date.toLocaleDateString(
      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const formatDateForBadge = (dateInput: string | Date | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return '';
    if (currentLanguage === 'ko') {
      return `${date.getMonth() + 1}월 ${date.getDate()}일부터`;
    } else if (currentLanguage === 'vi') {
      return `Từ ${date.getDate()}/${date.getMonth() + 1}`;
    } else {
      return `From ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const isAvailableNow = () => {
    const checkIn = parseDate(property?.checkInDate);
    if (!checkIn) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    return checkIn <= today;
  };

  const handlePreviousImage = () => {
    if (!property?.images) return;
    onImageIndexChange(currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1);
  };

  const handleNextImage = () => {
    if (!property?.images) return;
    onImageIndexChange(currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1);
  };

  const images = property?.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];
  
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[430px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {currentLanguage === 'ko' ? '매물 상세' : currentLanguage === 'vi' ? 'Chi tiết bất động sản' : 'Property Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">
                {currentLanguage === 'ko' ? '로딩 중...' : currentLanguage === 'vi' ? 'Đang tải...' : 'Loading...'}
              </div>
            </div>
          ) : !property ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  {currentLanguage === 'ko' ? '매물을 찾을 수 없습니다.' : currentLanguage === 'vi' ? 'Không tìm thấy bất động sản.' : 'Property not found.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 이미지 */}
              <div className="relative rounded-xl overflow-hidden border-4 border-red-500 mb-6">
                <div className="relative w-full h-64 overflow-hidden">
                  <img
                    src={currentImage}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 좌측 상단: 즉시입주가능 또는 임대 시작 날짜 */}
                  {isAvailableNow() ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold">
                        {currentLanguage === 'ko' ? '즉시입주가능' : currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 'Available Now'}
                      </span>
                    </div>
                  ) : (
                    property.checkInDate && (
                      <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">
                          {formatDateForBadge(property.checkInDate)}
                        </span>
                      </div>
                    )
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
                    <p className="text-sm font-bold">
                      {formatPrice(property.price, property.priceUnit)}
                    </p>
                    <p className="text-xs text-gray-300">
                      {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : '/week'}
                    </p>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm z-10 flex items-center gap-3">
                    {property.bedrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4" />
                        <span className="text-xs font-medium">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        <span className="text-xs font-medium">{property.bathrooms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 매물 정보 */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
                {/* 주소 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '주소' : currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {property.address 
                      ? property.address.split(',').filter((part) => {
                          const trimmed = part.trim();
                          return !trimmed.match(/[가-힣A-Za-z]동\s*\d+호/);
                        }).filter((part, index, arr) => {
                          const trimmed = part.trim();
                          if (index === 0) return true;
                          return trimmed !== arr[index - 1].trim();
                        }).join(', ').trim()
                      : property.title}
                  </p>
                </div>

                {/* 가격 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '1주일 임대료' : currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 'Weekly Rent'}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(property.price, property.priceUnit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentLanguage === 'ko' ? '공과금/관리비 포함' : currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 'Utilities/Management fees included'}
                  </p>
                </div>

                {/* 임대 가능 날짜 */}
                {(property.checkInDate || property.checkOutDate) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '임대 가능 날짜' : currentLanguage === 'vi' ? 'Ngày cho thuê' : 'Available Dates'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">
                        {property.checkInDate && formatDate(property.checkInDate)}
                        {property.checkInDate && property.checkOutDate && ' ~ '}
                        {property.checkOutDate && formatDate(property.checkOutDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 최대 인원 수 */}
                {(property.maxAdults || property.maxChildren) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {currentLanguage === 'ko' ? '최대 인원 수' : currentLanguage === 'vi' ? 'Số người tối đa' : 'Maximum Guests'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-900">
                      {property.maxAdults !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">
                            {currentLanguage === 'ko' ? `성인 ${property.maxAdults}명` : 
                             currentLanguage === 'vi' ? `${property.maxAdults} người lớn` : 
                             `${property.maxAdults} adults`}
                          </span>
                        </div>
                      )}
                      {property.maxChildren !== undefined && property.maxChildren > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">
                            {currentLanguage === 'ko' ? `어린이 ${property.maxChildren}명` : 
                             currentLanguage === 'vi' ? `${property.maxChildren} trẻ em` : 
                             `${property.maxChildren} children`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 편의시설 */}
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    {currentLanguage === 'ko' ? '편의시설' : currentLanguage === 'vi' ? 'Tiện ích' : 'Amenities'}
                  </p>
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {AMENITY_OPTIONS.filter(amenity => property.amenities?.includes(amenity.id)).map((amenity) => {
                        const Icon = amenity.icon;
                        const langKey = currentLanguage as 'ko' | 'vi' | 'en';
                        const label = amenity.label[langKey] || amenity.label.en;
                        
                        return (
                          <div
                            key={amenity.id}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-500 bg-blue-50"
                          >
                            <Icon className="w-6 h-6 text-blue-600" />
                            <span className="text-xs font-medium text-center text-blue-700">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      {currentLanguage === 'ko' ? '편의시설 정보가 없습니다' : 
                       currentLanguage === 'vi' ? 'Không có thông tin tiện ích' : 
                       'No amenities information'}
                    </p>
                  )}
                </div>
              </div>

              {/* 날짜 선택 */}
              <div className="pt-4 border-t border-gray-100">
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
                    if (!modalCheckInDate || !modalCheckOutDate || !property) return;
                    
                    // 비회원이면 로그인 페이지로 이동 (현재 매물 정보를 returnUrl에 포함)
                    if (!user) {
                      const returnUrl = `/booking?propertyId=${property.id}&checkIn=${modalCheckInDate.toISOString()}&checkOut=${modalCheckOutDate.toISOString()}`;
                      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                      return;
                    }
                    
                    // 로그인된 사용자는 예약 페이지로 이동
                    router.push(`/booking?propertyId=${property.id}&checkIn=${modalCheckInDate.toISOString()}&checkOut=${modalCheckOutDate.toISOString()}`);
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
            </>
          )}
        </div>
      </div>
      
      {/* 모달 내 캘린더 */}
      {showModalCalendar && property && (
        <div 
          className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
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
              minDate={parseDate(property.checkInDate) || undefined}
              maxDate={parseDate(property.checkOutDate) || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 매물 카드 컴포넌트 (PopularStays 스타일)
function MapPropertyCards({ 
  properties, 
  selectedIndex, 
  onSelect,
  onImageClick,
  currentLanguage,
  cardSliderRef: externalCardSliderRef
}: { 
  properties: Property[];
  selectedIndex: number;
  onSelect: (index: number, property: Property) => void;
  onImageClick?: (propertyId: string) => void;
  currentLanguage: string;
  cardSliderRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const internalScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalCardSliderRef || internalScrollContainerRef;
  const [currentIndex, setCurrentIndex] = useState(0);

  // 가격 포맷팅
  const formatPrice = (price: number): string => {
    return `${(price / 1000000).toFixed(1)}M VND`;
  };

  // 주소에서 도시명 추출 (Thành phố Hồ Chí Minh -> Ho Chi Minh City 변환)
  const getCityName = (address?: string): string => {
    if (!address) return 'Ho Chi Minh City';
    const parts = address.split(',');
    if (parts.length > 1) {
      const cityPart = parts[parts.length - 1].trim();
      // 베트남어 도시명을 영어로 변환
      if (cityPart.toLowerCase().includes('thành phố hồ chí minh') || 
          cityPart.toLowerCase().includes('ho chi minh')) {
        return 'Ho Chi Minh City';
      }
      return cityPart;
    }
    return 'Ho Chi Minh City';
  };

  // 주소에서 상세 주소 추출 (도시명 제외)
  const getDetailedAddress = (address?: string): string => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length > 1) {
      // 마지막 부분(도시명) 제외하고 나머지 합치기
      const detailedParts = parts.slice(0, -1);
      return detailedParts.map(part => part.trim()).join(', ');
    }
    return address;
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
            className="flex absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
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
                  <div 
                    className="relative w-full h-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(property.id);
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={property.name}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
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

                      {/* 하단: 상세 주소와 도시명 */}
                      <div className="space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/properties/${property.id}`);
                          }}
                          className="text-left w-full group"
                        >
                          <h3 className="text-white text-lg font-bold drop-shadow-lg line-clamp-2 transition-all duration-200 group-hover:text-blue-200 group-hover:underline">
                            {getDetailedAddress(property.address) || property.name}
                          </h3>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/properties/${property.id}`);
                          }}
                          className="flex items-center gap-2 group transition-all duration-200 hover:gap-3"
                        >
                          <MapPin className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110" />
                          <span className="text-white text-sm drop-shadow-lg underline-offset-2 transition-all duration-200 group-hover:underline group-hover:text-blue-200">
                            {getCityName(property.address)}
                          </span>
                        </button>
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
            className="flex absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
