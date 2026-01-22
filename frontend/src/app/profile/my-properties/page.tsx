/**
 * 내 매물 관리 페이지
 * 
 * - 등록한 매물 목록 표시
 * - 매물 상태에 따른 테두리 색상 (빨강: 계약 전, 초록: 계약 완료)
 * - 가로 긴 사진 레이아웃
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPropertiesByOwner, deleteProperty, permanentlyDeleteProperty, PropertiesByOwnerResult } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import { getCurrentUserData } from '@/lib/api/auth';
import { getVerificationStatus } from '@/lib/api/kyc';
import { ArrowLeft, MapPin, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import Image from 'next/image';
import { 
  formatPrice, 
  getCityName, 
  hasAvailableBookingPeriod, 
  isAdvertisingProperty, 
  PropertyDateRange,
} from '@/lib/utils/propertyUtils';
import { 
  parseDate, 
  isAvailableNow, 
  formatDateForBadge 
} from '@/lib/utils/dateUtils';

type PropertyFetchResult = {
  activeData: PropertyData[];
  deletedData: PropertyData[];
  visibleActiveData: PropertyData[];
  // 매물 ID별 예약된 날짜 범위 (Map<propertyId, [{checkIn, checkOut}, ...]>
  bookedDateRanges: Map<string, PropertyDateRange[]>;
  // 광고 탭에서 제외할 매물 ID (예약은 있지만, 광고 가능한 남은 기간이 없는 매물)
  excludedFromAdvertising: Set<string>;
  reservedIds: Set<string>;
};

export default function MyPropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'deleted' ? 'deleted' : 'active';
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<string | null>(null);
  const [allStepsCompleted, setAllStepsCompleted] = useState(false);
  const [reservedPropertyIds, setReservedPropertyIds] = useState<Set<string>>(new Set());

  const shouldShowPropertyInActiveTab = (
    property: PropertyData,
    bookedDateRanges: Map<string, PropertyDateRange[]>
  ) => {
    if (!isAdvertisingProperty(property)) {
      return false;
    }
    if (!property.id) {
      return true;
    }
    // 예약이 없는 매물은 항상 표시
    const bookedRanges = bookedDateRanges.get(property.id) || [];
    if (bookedRanges.length === 0) {
      return true;
    }
    
    // 예약은 있지만, 예약 가능한 기간이 남아있는지 확인
    return hasAvailableBookingPeriod(property, bookedRanges);
  };

  const fetchAndFilterPropertyData = async (): Promise<PropertyFetchResult> => {
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // getPropertiesByOwner가 이미 예약 정보를 포함한 결과 객체를 반환하도록 수정되었음
    const [activeResult, deletedResult] = await Promise.all([
      getPropertiesByOwner(user!.uid, false), // includeDeleted: false (삭제되지 않은 매물)
      getPropertiesByOwner(user!.uid, true),  // includeDeleted: true (삭제된 매물)
    ]);

    const excludedFromAdvertising = new Set<string>();

    // 예약 정보는 getPropertiesByOwner에서 가져온 bookedDateRanges 사용
    const bookedDateRanges = activeResult.bookedDateRanges;

    // activeResult.properties에 있는 매물 중 광고할 수 없는 매물 ID를 excludedFromAdvertising에 추가
    activeResult.properties.forEach(property => {
      // isAdvertisingProperty는 property.status가 'active'인지 확인
      // hasAvailableBookingPeriod는 예약 가능한 7일 이상 연속 기간이 있는지 확인
      if (
        !isAdvertisingProperty(property) ||
        !hasAvailableBookingPeriod(property, bookedDateRanges.get(property.id!) || [])
      ) {
        if (property.id) {
          excludedFromAdvertising.add(property.id);
        }
      }
    });

    const visibleActiveData = activeResult.properties.filter(property => {
      const isAvailableForAdvertising = shouldShowPropertyInActiveTab(property, bookedDateRanges);
      return isAvailableForAdvertising;
    });

    return {
      activeData: activeResult.properties,
      deletedData: deletedResult.properties,
      visibleActiveData,
      bookedDateRanges,
      excludedFromAdvertising,
      reservedIds: excludedFromAdvertising,
    };
  };

  const [advertisingCount, setAdvertisingCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  const applyPropertyResult = (result: PropertyFetchResult, tab: 'active' | 'deleted') => {
    setReservedPropertyIds(result.excludedFromAdvertising);
    setAllProperties([...result.activeData, ...result.deletedData]);
    
    // 광고 종료된 매물: 진짜 삭제된 매물 + 광고에서 제외된 매물
    const excludedProperties = result.activeData.filter(p => 
      result.excludedFromAdvertising.has(p.id!)
    );

    if (tab === 'active') {
      setProperties(result.visibleActiveData);
    } else {
      // 삭제된 매물 탭에서는 진짜 삭제된 것과 광고 종료된 것을 함께 표시
      setProperties([...result.deletedData, ...excludedProperties]);
    }
    
    setAdvertisingCount(result.visibleActiveData.length);
    setDeletedCount(result.deletedData.length + excludedProperties.length);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const fetchData = async () => {
        try {
          // 사용자 데이터 및 인증 상태 확인
          const userData = await getCurrentUserData(user.uid);
          const kycSteps = userData?.kyc_steps || {};
          const completed = (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;
          setAllStepsCompleted(completed);

          // 인증 3단계가 완료되지 않았으면 프로필 페이지로 리다이렉트
          if (!completed) {
            router.push('/profile');
            return;
          }

          // 매물 데이터 가져오기
          const result = await fetchAndFilterPropertyData();
          applyPropertyResult(result, activeTab);
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user, authLoading, router, activeTab]);

  // URL 쿼리 파라미터에서 탭 정보 읽기
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'deleted') {
      setActiveTab('deleted');
    } else if (tab === null) {
      setActiveTab('active');
    }
  }, [searchParams]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = async () => {
      if (user && !authLoading) {
        try {
          const result = await fetchAndFilterPropertyData();
          applyPropertyResult(result, activeTab);
        } catch (error) {
          // Silent fail
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, authLoading, activeTab]);

  // 탭 변경 시 매물 목록 새로고침 및 URL 업데이트
  useEffect(() => {
    if (user && !authLoading) {
      const fetchProperties = async () => {
        try {
          const result = await fetchAndFilterPropertyData();
          applyPropertyResult(result, activeTab);
        } catch (error) {
          // Silent fail
        }
      };
      fetchProperties();
      
      // URL 업데이트 (뒤로가기 지원)
      const newUrl = activeTab === 'deleted' 
        ? '/profile/my-properties?tab=deleted'
        : '/profile/my-properties';
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, user, authLoading]);

  // 매물 삭제 핸들러 (Soft Delete)
  const handleDelete = async (propertyId: string) => {
    if (!propertyId) return;
    
    setDeletingId(propertyId);
    try {
      await deleteProperty(propertyId);
      
      const result = await fetchAndFilterPropertyData();
      applyPropertyResult(result, activeTab); // 현재 탭 유지
      setShowDeleteConfirm(null);
    } catch (error) {
      alert(currentLanguage === 'ko' 
        ? '매물 삭제 중 오류가 발생했습니다.'
        : currentLanguage === 'vi'
        ? 'Đã xảy ra lỗi khi xóa bất động sản.'
        : 'An error occurred while deleting the property.');
    } finally {
      setDeletingId(null);
    }
  };

  // 매물 영구 삭제 핸들러
  const handlePermanentDelete = async (propertyId: string) => {
    if (!propertyId) return;
    
    setDeletingId(propertyId);
    try {
      // 삭제 기록에 사용자 ID 포함
      await permanentlyDeleteProperty(propertyId, user!.uid);
      
      const result = await fetchAndFilterPropertyData();
      applyPropertyResult(result, activeTab); // 현재 탭 유지
      setShowPermanentDeleteConfirm(null);
    } catch (error) {
      alert(currentLanguage === 'ko' 
        ? '매물 영구 삭제 중 오류가 발생했습니다.'
        : currentLanguage === 'vi'
        ? 'Đã xảy ra lỗi khi xóa vĩnh viễn bất động sản.'
        : 'An error occurred while permanently deleting the property.');
    } finally {
      setDeletingId(null);
    }
  };

  // 매물 상태에 따른 테두리 색상
  const getBorderColor = (status?: string) => {
    // 계약 완료 상태 (rented)면 초록색, 그 외는 빨간색
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
    return currentLanguage === 'ko' ? '등록됨' : 
           currentLanguage === 'vi' ? 'Đã đăng' : 
           'Active';
  };

  if (authLoading || loading) {
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

  if (!user) {
    return null;
  }

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
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {currentLanguage === 'ko' ? '뒤로' : 
                 currentLanguage === 'vi' ? 'Quay lại' : 
                 'Back'}
              </span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLanguage === 'ko' ? '내 매물 관리' : 
               currentLanguage === 'vi' ? 'Quản lý bất động sản' : 
               'My Properties'}
            </h1>
            
            {/* 카테고리 탭 */}
            <div className="flex gap-2 mt-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentLanguage === 'ko' ? '등록된 매물' : 
                 currentLanguage === 'vi' ? 'Bất động sản đã đăng' : 
                 'Active Properties'}
                <span className="ml-2 text-xs">
                  ({advertisingCount})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'deleted'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentLanguage === 'ko' ? '광고종료된 매물' : 
                 currentLanguage === 'vi' ? 'Quảng cáo đã kết thúc' : 
                 'Expired Listings'}
                <span className="ml-2 text-xs">
                  ({deletedCount})
                </span>
              </button>
            </div>
          </div>

          {/* 매물 목록 */}
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {currentLanguage === 'ko' ? '등록한 매물이 없습니다.' : 
                 currentLanguage === 'vi' ? 'Chưa có bất động sản nào.' : 
                 'No properties registered.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                const mainImage = property.images && property.images.length > 0 
                  ? property.images[0] 
                  : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop';
                
                const isRented = property.status === 'rented';

                return (
                  <div
                    key={property.id}
                    className={`relative rounded-xl overflow-hidden ${getBorderColor(property.status)} hover:opacity-90 transition-opacity`}
                  >
                    {/* 가로 긴 사진 */}
                    <div className="relative w-full h-48">
                      <Image
                        src={mainImage}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 430px) 100vw, 430px"
                      />
                      
                      {/* 좌측 상단: 즉시 입주 가능 또는 날짜 */}
                      <div className="absolute top-3 left-3">
                        {isAvailableNow(property.checkInDate) ? (
                          <div className="flex items-center gap-1.5 bg-green-500 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span className="text-xs font-semibold">
                              {currentLanguage === 'ko' ? '즉시 입주 가능' : 
                               currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
                               'Available Now'}
                            </span>
                          </div>
                        ) : property.checkInDate ? (
                          <div className="bg-blue-500 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                            <span className="text-xs font-semibold">
                              {formatDateForBadge(property.checkInDate, currentLanguage, property.checkOutDate)}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-gray-500 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                            <span className="text-xs font-semibold">
                              {currentLanguage === 'ko' ? '날짜 미정' : 
                               currentLanguage === 'vi' ? 'Chưa xác định' : 
                               'Date TBD'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 우측 상단: 가격 */}
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        <p className="text-sm font-bold">
                          {formatPrice(property.price, property.priceUnit)}
                        </p>
                        <p className="text-xs text-gray-300">
                          {currentLanguage === 'ko' ? '/주' : 
                           currentLanguage === 'vi' ? '/tuần' : 
                           '/week'}
                        </p>
                      </div>

                      {/* 좌측 하단: 도로명과 동호수 */}
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm max-w-[80%]">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {property.address || property.title}
                            </p>
                            {property.unitNumber && (
                              <p className="text-xs text-gray-300 mt-0.5">
                                {property.unitNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 우측 하단: 버튼들 */}
                      <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                        {activeTab === 'active' ? (
                          isRented ? (
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                              {getStatusText(property.status)}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(property.id || null);
                              }}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          <div className="flex gap-2">
                            {/* 영구 삭제 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPermanentDeleteConfirm(property.id || null);
                              }}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                              aria-label="Permanent Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 클릭 영역 */}
                    <div
                      onClick={() => {
                        if (activeTab === 'deleted') {
                          // 삭제된 매물: 사진 클릭 시 재등록(수정) 페이지로 이동 (탭 정보 포함)
                          router.push(`/profile/my-properties/${property.id}/edit?tab=deleted`);
                        } else {
                          // 등록된 매물: 상세 페이지로 이동
                          router.push(`/profile/my-properties/${property.id}`);
                        }
                      }}
                      className="absolute inset-0 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 영구 삭제 확인 모달 */}
          {showPermanentDeleteConfirm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {currentLanguage === 'ko' ? '매물 영구 삭제' : 
                   currentLanguage === 'vi' ? 'Xóa vĩnh viễn bất động sản' : 
                   'Permanently Delete Property'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {currentLanguage === 'ko' 
                    ? '이 매물을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                    : currentLanguage === 'vi'
                    ? 'Bạn có chắc chắn muốn xóa vĩnh viễn bất động sản này? Hành động này không thể hoàn tác.'
                    : 'Are you sure you want to permanently delete this property? This action cannot be undone.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPermanentDeleteConfirm(null)}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    {currentLanguage === 'ko' ? '취소' : 
                     currentLanguage === 'vi' ? 'Hủy' : 
                     'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (showPermanentDeleteConfirm) {
                        handlePermanentDelete(showPermanentDeleteConfirm);
                      }
                    }}
                    disabled={deletingId === showPermanentDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === showPermanentDeleteConfirm
                      ? (currentLanguage === 'ko' ? '삭제 중...' : 
                         currentLanguage === 'vi' ? 'Đang xóa...' : 
                         'Deleting...')
                      : (currentLanguage === 'ko' ? '영구 삭제' : 
                         currentLanguage === 'vi' ? 'Xóa vĩnh viễn' : 
                         'Permanently Delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* 삭제 확인 모달 */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {currentLanguage === 'ko' ? '매물 삭제' : 
                   currentLanguage === 'vi' ? 'Xóa bất động sản' : 
                   'Delete Property'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {currentLanguage === 'ko' 
                    ? '이 매물을 삭제하시겠습니까? 삭제된 매물은 나중에 재등록할 수 있습니다.'
                    : currentLanguage === 'vi'
                    ? 'Bạn có chắc chắn muốn xóa bất động sản này? Bất động sản đã xóa có thể được đăng lại sau.'
                    : 'Are you sure you want to delete this property? Deleted properties can be re-registered later.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    {currentLanguage === 'ko' ? '취소' : 
                     currentLanguage === 'vi' ? 'Hủy' : 
                     'Cancel'}
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deletingId === showDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === showDeleteConfirm
                      ? (currentLanguage === 'ko' ? '삭제 중...' : 
                         currentLanguage === 'vi' ? 'Đang xóa...' : 
                         'Deleting...')
                      : (currentLanguage === 'ko' ? '삭제' : 
                         currentLanguage === 'vi' ? 'Xóa' : 
                         'Delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
