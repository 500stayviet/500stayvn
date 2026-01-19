/**
 * Property Detail Page (매물 상세 페이지)
 * 
 * - 매물 상세 정보 표시
 * - 이미지 갤러리
 * - 지도 표시
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProperty, PropertyData } from '@/lib/api/properties';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { MapPin, Bed, Bath, Square, ArrowLeft, Wind, Sofa, UtensilsCrossed, WashingMachine, Refrigerator, Table, Shirt, Wifi, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { AMENITY_OPTIONS } from '@/lib/constants/amenities';
import { useAuth } from '@/hooks/useAuth';
import { 
  formatFullPrice, 
  parseDate, 
  isAvailableNow, 
  formatDate, 
  formatDateForBadge 
} from '@/lib/utils/propertyUtils';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        setProperty(data);
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handlePreviousImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === 'ko' ? '로딩 중...' : 
           currentLanguage === 'vi' ? 'Đang tải...' : 
           'Loading...'}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {currentLanguage === 'ko' ? '매물을 찾을 수 없습니다.' : 
             currentLanguage === 'vi' ? 'Không tìm thấy bất động sản.' : 
             'Property not found.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentLanguage === 'ko' ? '홈으로 돌아가기' : 
             currentLanguage === 'vi' ? 'Về trang chủ' : 
             'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];
  
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar 
          currentLanguage={currentLanguage as any}
          onLanguageChange={() => {}}
        />

        <div className="px-6 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === 'ko' ? '뒤로' : 
                 currentLanguage === 'vi' ? 'Quay lại' : 
                 'Back'}
              </span>
            </button>
          </div>

          {/* 매물 카드 */}
          <div className="relative rounded-xl overflow-hidden mb-6 shadow-md border border-gray-100">
            <div className="relative w-full h-64 overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src={currentImage}
                  alt={property.title}
                  fill
                  className="object-cover transition-all duration-300"
                  sizes="(max-width: 430px) 100vw, 430px"
                />
                
                {/* 좌측 상단: 즉시입주가능 또는 임대 시작 날짜 */}
                {isAvailableNow(property.checkInDate) ? (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold">
                      {currentLanguage === 'ko' ? '즉시입주가능' : 
                       currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
                       'Available Now'}
                    </span>
                  </div>
                ) : (
                  property.checkInDate ? (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {formatDateForBadge(property.checkInDate, currentLanguage as any)}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-20 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {currentLanguage === 'ko' ? '날짜 미정' : 
                         currentLanguage === 'vi' ? 'Chưa xác định' : 
                         'Date TBD'}
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
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
                  <p className="text-sm font-bold">
                    {formatFullPrice(property.price, property.priceUnit)}
                  </p>
                  <p className="text-xs text-gray-300">
                    {currentLanguage === 'ko' ? '/주' : 
                     currentLanguage === 'vi' ? '/tuần' : 
                     '/week'}
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
          </div>

          {/* 매물 정보 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            {/* 주소 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '주소' : 
                 currentLanguage === 'vi' ? 'Địa chỉ' : 
                 'Address'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {property.address || property.title}
              </p>
            </div>

            {/* 가격 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '1주일 임대료' : 
                 currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 
                 'Weekly Rent'}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatFullPrice(property.price, property.priceUnit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentLanguage === 'ko' ? '공과금/관리비 포함' : 
                 currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 
                 'Utilities/Management fees included'}
              </p>
            </div>

            {/* 임대 가능 날짜 */}
            {(property.checkInDate || property.checkOutDate) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '임대 가능 날짜' : 
                   currentLanguage === 'vi' ? 'Ngày cho thuê' : 
                   'Available Dates'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">
                    {property.checkInDate && formatDate(property.checkInDate, currentLanguage as any)}
                    {property.checkInDate && property.checkOutDate && ' ~ '}
                    {property.checkOutDate && formatDate(property.checkOutDate, currentLanguage as any)}
                  </span>
                </div>
              </div>
            )}

            {/* 최대 인원 수 */}
            {(property.maxAdults || property.maxChildren) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '최대 인원 수' : 
                   currentLanguage === 'vi' ? 'Số người tối đa' : 
                   'Maximum Guests'}
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
                {currentLanguage === 'ko' ? '편의시설' : 
                 currentLanguage === 'vi' ? 'Tiện ích' : 
                 'Amenities'}
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

            {/* 예약하기 버튼 */}
            <div className="pt-4">
              <button
                onClick={() => {
                  // 예약 페이지로 이동 (날짜는 기본값으로 설정)
                  if (!propertyId) return;
                  
                  const today = new Date();
                  const checkIn = parseDate(property.checkInDate) || today;
                  const checkOut = new Date(checkIn);
                  checkOut.setDate(checkOut.getDate() + 7);

                  const returnUrl = `/booking?propertyId=${propertyId}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`;
                  
                  if (!user) {
                    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                  } else {
                    router.push(returnUrl);
                  }
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {currentLanguage === 'ko' ? '예약하기' : 
                 currentLanguage === 'vi' ? 'Đặt phòng' : 
                 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
