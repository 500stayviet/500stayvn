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
import { ArrowLeft, Edit, Calendar, CalendarDays, Users, ChevronLeft, ChevronRight, Bed, Bath, Square } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { PropertyDescription } from '@/components/PropertyDescription';
import Image from 'next/image';
import { FACILITY_OPTIONS } from '@/lib/constants/facilities';
import {
  formatFullPrice,
  getPropertyTypeLabel,
  getCityDistrictFromCoords,
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
  const { cityName, districtName } = property.coordinates
    ? getCityDistrictFromCoords(property.coordinates.lat, property.coordinates.lng, currentLanguage)
    : { cityName: '', districtName: '' };

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

          {/* 매물 정보 — 등록 시 기입한 모든 항목 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            {property.propertyType && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {currentLanguage === 'ko' ? '매물 종류' : currentLanguage === 'vi' ? 'Loại bất động sản' : 'Property Type'}
                </p>
                <p className="text-sm font-semibold text-gray-900">{getPropertyTypeLabel(property.propertyType, currentLanguage)}</p>
                {(property.bedrooms !== undefined || property.bathrooms !== undefined || property.maxAdults != null) && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {property.bedrooms !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{currentLanguage === 'ko' ? '방 개수' : currentLanguage === 'vi' ? 'Số phòng' : 'Bedrooms'}</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <Bed className="w-4 h-4 text-gray-600 shrink-0" />
                          <span>{property.bedrooms}</span>
                        </div>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{currentLanguage === 'ko' ? '화장실 수' : currentLanguage === 'vi' ? 'Số phòng tắm' : 'Bathrooms'}</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <Bath className="w-4 h-4 text-gray-600 shrink-0" />
                          <span>{property.bathrooms}</span>
                        </div>
                      </div>
                    )}
                    {property.maxAdults != null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{currentLanguage === 'ko' ? '최대 인원' : currentLanguage === 'vi' ? 'Số người tối đa' : 'Max Guests'}</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <Users className="w-4 h-4 text-gray-600 shrink-0" />
                          <span>
                            {property.maxAdults}
                            {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? ' người' : ' guests'}
                            {(property.maxChildren ?? 0) > 0 && (
                              <> (+ {property.maxChildren} {currentLanguage === 'ko' ? '어린이' : currentLanguage === 'vi' ? 'trẻ em' : 'children'})</>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                {currentLanguage === 'ko' ? '주소' : currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}
              </p>
              <p className="text-sm font-medium text-gray-900">{property.address}</p>
              {property.unitNumber && (
                <p className="text-sm text-blue-600 mt-1 font-semibold">
                  {currentLanguage === 'ko' ? `동호수: ${property.unitNumber}` : currentLanguage === 'vi' ? `Số phòng: ${property.unitNumber}` : `Unit: ${property.unitNumber}`}
                </p>
              )}
            </div>

            {(cityName || districtName) && (
              <div className="grid grid-cols-2 gap-3">
                {cityName && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{currentLanguage === 'ko' ? '도시' : currentLanguage === 'vi' ? 'Thành phố' : 'City'}</p>
                    <p className="text-sm font-medium text-gray-900">{cityName}</p>
                  </div>
                )}
                {districtName && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{currentLanguage === 'ko' ? '구' : currentLanguage === 'vi' ? 'Quận' : 'District'}</p>
                    <p className="text-sm font-medium text-gray-900">{districtName}</p>
                  </div>
                )}
              </div>
            )}

            {(property.checkInDate || property.checkOutDate) && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {currentLanguage === 'ko' ? '임대 가능 날짜' : currentLanguage === 'vi' ? 'Ngày cho thuê' : 'Available Dates'}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-600 shrink-0" />
                  <span>
                    {property.checkInDate && formatDate(property.checkInDate, currentLanguage)}
                    {property.checkInDate && property.checkOutDate && ' ~ '}
                    {property.checkOutDate && formatDate(property.checkOutDate, currentLanguage)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                {currentLanguage === 'ko' ? '1주일 임대료' : currentLanguage === 'vi' ? 'Giá thuê 1 tuần' : 'Weekly Rent'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatFullPrice(property.price, property.priceUnit)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {currentLanguage === 'ko' ? '공과금/관리비 포함' : currentLanguage === 'vi' ? 'Bao gồm tiện ích/phí quản lý' : 'Utilities/Management fees included'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-3">
                {currentLanguage === 'ko' ? '숙소시설 및 정책' : currentLanguage === 'vi' ? 'Tiện ích và chính sách' : 'Facilities & Policy'}
              </p>
              {property.amenities?.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {FACILITY_OPTIONS.filter((opt) => property.amenities?.includes(opt.id)).map((opt) => {
                    const Icon = opt.icon;
                    const label = (opt.label as Record<string, string>)[currentLanguage] || opt.label.en;
                    const isPet = opt.id === 'pet';
                    const isCleaning = opt.id === 'cleaning';
                    const petFee = isPet && property.petAllowed && property.petFee != null ? property.petFee : null;
                    const cleaningCount = isCleaning && (property.cleaningPerWeek ?? 0) > 0 ? property.cleaningPerWeek : null;
                    return (
                      <div
                        key={opt.id}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-blue-500 bg-blue-50"
                      >
                        <Icon className="w-5 h-5 text-blue-600" />
                        <span className="text-[10px] font-medium text-center text-blue-700 leading-tight">{label}</span>
                        {petFee != null && (
                          <span className="text-[10px] font-semibold text-blue-800">
                            {property.priceUnit === 'vnd' ? `${(petFee / 1_000_000).toFixed(1)}M VND` : `$${petFee}`}
                          </span>
                        )}
                        {cleaningCount != null && (
                          <span className="text-[10px] font-semibold text-blue-800">
                            {cleaningCount}
                            {currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : '/week'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  {currentLanguage === 'ko' ? '편의시설 정보가 없습니다' : currentLanguage === 'vi' ? 'Không có thông tin tiện ích' : 'No amenities information'}
                </p>
              )}
            </div>

            {property.original_description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">
                  {currentLanguage === 'ko' ? '매물 설명' : currentLanguage === 'vi' ? 'Mô tả bất động sản' : 'Property Description'}
                </p>
                <PropertyDescription
                  description={property.original_description}
                  sourceLanguage="vi"
                  targetLanguage={currentLanguage}
                  cacheKey={`property-detail-owner-${property.id}`}
                  className="mt-2"
                />
              </div>
            )}

            {(property.icalPlatform || property.icalCalendarName || property.icalUrl) && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {currentLanguage === 'ko' ? '외부 캘린더 가져오기' : currentLanguage === 'vi' ? 'Đồng bộ lịch ngoài' : 'Import External Calendar'}
                </p>
                <div className="space-y-1.5 text-sm text-gray-800">
                  {property.icalPlatform && (
                    <p>
                      <span className="text-gray-500">{currentLanguage === 'ko' ? '플랫폼: ' : currentLanguage === 'vi' ? 'Nền tảng: ' : 'Platform: '}</span>
                      <span className="font-medium capitalize">{property.icalPlatform}</span>
                    </p>
                  )}
                  {property.icalCalendarName && (
                    <p>
                      <span className="text-gray-500">{currentLanguage === 'ko' ? '캘린더 이름: ' : currentLanguage === 'vi' ? 'Tên lịch: ' : 'Calendar name: '}</span>
                      <span className="font-medium">{property.icalCalendarName}</span>
                    </p>
                  )}
                  {property.icalUrl && (
                    <p className="break-all">
                      <span className="text-gray-500">{currentLanguage === 'ko' ? 'iCal URL: ' : 'iCal URL: '}</span>
                      <span className="text-blue-600 font-medium">{property.icalUrl}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
