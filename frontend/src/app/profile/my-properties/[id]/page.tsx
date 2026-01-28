/**
 * 매물 상세 페이지
 * 
 * - 매물 정보 표시
 * - 수정 버튼 클릭 시 수정 모드로 전환
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProperty } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import { ArrowLeft, Edit, MapPin, Square, Calendar, Users, ChevronLeft, ChevronRight, Bed, Bath } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { PropertyDescription } from '@/components/PropertyDescription';
import Image from 'next/image';
import { AMENITY_OPTIONS } from '@/lib/constants/amenities';
import { 
  formatFullPrice, 
} from '@/lib/utils/propertyUtils';
import { 
  parseDate, 
  isAvailableNow, 
  formatDate, 
  formatDateForBadge 
} from '@/lib/utils/dateUtils';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyLoaded, setPropertyLoaded] = useState(false);

  useEffect(() => {
    // 이미 로드되었으면 실행하지 않음
    if (propertyLoaded) return;
    
    if (!authLoading && user) {
      const fetchProperty = async () => {
        try {
          const data = await getProperty(propertyId);
          if (!data) {
            router.push('/profile/my-properties');
            return;
          }
          
          // 본인의 매물인지 확인
          if (data.ownerId !== user.uid) {
            router.push('/profile/my-properties');
            return;
          }
          
          setProperty(data);
          setPropertyLoaded(true);
        } catch (error) {
          router.push('/profile/my-properties');
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [propertyId, user, authLoading, propertyLoaded, router]);

  const handleEdit = () => {
    router.push(`/profile/my-properties/${propertyId}/edit`);
  };

  // 매물 상태에 따른 테두리 색상
  const getBorderColor = (status?: string) => {
    if (status === 'rented') {
      return 'border-green-500 border-4';
    }
    return 'border-red-500 border-4';
  };

  // 매물 상태 텍스트
  const getStatusText = (status?: string) => {
    if (status === 'rented') {
      return currentLanguage === 'ko' ? '계약 완료' : 
             currentLanguage === 'vi' ? 'Đã cho thuê' : 
             'Rented';
    }
    return currentLanguage === 'ko' ? '계약 대기 중' : 
           currentLanguage === 'vi' ? 'Đang chờ thuê' : 
           'Available';
  };

  const handlePreviousImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!property?.images) return;
    setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
  };

  if (loading || authLoading) {
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

  if (!property || !user) {
    return null;
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];
  
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* 상단 바 */}
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        {/* 콘텐츠 */}
        <div className="px-6 py-6">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/profile/my-properties')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === 'ko' ? '뒤로' : 
                 currentLanguage === 'vi' ? 'Quay lại' : 
                 'Back'}
              </span>
            </button>
            
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentLanguage === 'ko' ? '매물 상세' : 
                 currentLanguage === 'vi' ? 'Chi tiết bất động sản' : 
                 'Property Details'}
              </h1>
              
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {currentLanguage === 'ko' ? '수정' : 
                   currentLanguage === 'vi' ? 'Chỉnh sửa' : 
                   'Edit'}
                </span>
              </button>
            </div>
          </div>

          {/* 매물 카드 */}
          <div className={`relative rounded-xl overflow-hidden ${getBorderColor(property.status)} mb-6`}>
            {/* 사진 갤러리 */}
            <div className="relative w-full h-64 overflow-hidden">
              {/* 메인 이미지 */}
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
                        {formatDateForBadge(property.checkInDate, currentLanguage)}
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

                {/* 이미지 네비게이션 */}
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
                
                {/* 우측 상단: 가격 */}
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

                {/* 우측 하단: 방 개수, 화장실 개수 */}
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
            {/* 제목 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '제목' : 
                 currentLanguage === 'vi' ? 'Tiêu đề' : 
                 'Title'}
              </p>
              <p className="text-lg font-bold text-gray-900">{property.title}</p>
            </div>

            {/* 주소 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '주소' : 
                 currentLanguage === 'vi' ? 'Địa chỉ' : 
                 'Address'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {property.address}
              </p>
              {property.unitNumber && (
                <p className="text-sm text-blue-600 mt-1 font-semibold">
                  {currentLanguage === 'ko' ? `동호수: ${property.unitNumber}` : 
                   currentLanguage === 'vi' ? `Số phòng: ${property.unitNumber}` : 
                   `Unit: ${property.unitNumber}`}
                </p>
              )}
            </div>

            {/* 설명 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {currentLanguage === 'ko' ? '설명' : 
                 currentLanguage === 'vi' ? 'Mô tả' : 
                 'Description'}
              </p>
              <PropertyDescription
                description={property.original_description}
                sourceLanguage="vi"
                cacheKey={`property-detail-owner-${property.id}`}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 면적 */}
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '면적' : 
                   currentLanguage === 'vi' ? 'Diện tích' : 
                   'Area'}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Square className="w-4 h-4 text-gray-600" />
                  {property.area} m²
                </div>
              </div>

              {/* 임대 가능 날짜 */}
              {(property.checkInDate || property.checkOutDate) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '임대 가능 날짜' : 
                     currentLanguage === 'vi' ? 'Ngày cho thuê' : 
                     'Available Dates'}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span>
                      {property.checkInDate && formatDate(property.checkInDate, currentLanguage)}
                      {property.checkInDate && property.checkOutDate && ' ~ '}
                      {property.checkOutDate && formatDate(property.checkOutDate, currentLanguage)}
                    </span>
                  </div>
                </div>
              )}
            </div>

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
                    const label = (amenity.label as any)[currentLanguage] || amenity.label.en;
                    
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
        </div>
      </div>
    </div>
  );
}
