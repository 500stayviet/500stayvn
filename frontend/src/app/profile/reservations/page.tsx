/**
 * 예약된 매물 관리 페이지
 * 
 * - 임차인이 예약한 매물 목록 표시
 * - 예약된 매물 / 예약완료된 매물 탭
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getReservationsByOwner, updateReservationStatus, deleteReservation } from '@/lib/api/reservations';
import { getProperty, updateProperty, logCancelledProperty, handleCancellationRelist } from '@/lib/api/properties';
import { getCurrentUserData } from '@/lib/api/auth';
import { ReservationData } from '@/lib/api/reservations';
import { PropertyData } from '@/types/property';
import { markAllMessagesInRoomAsRead, findChatRoom } from '@/lib/api/chat';
import { ArrowLeft, Calendar, User, Mail, Phone, CheckCircle2, XCircle, MapPin, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import Image from 'next/image';

interface ReservationWithProperty extends ReservationData {
  property?: PropertyData;
}

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'completed' ? 'completed' : 'active';
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [allStepsCompleted, setAllStepsCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const fetchData = async () => {
        try {
          setLoading(true);
          
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

          // 예약 데이터 가져오기
          const reservationData = await getReservationsByOwner(
            user.uid,
            activeTab === 'completed' ? 'completed' : 'active'
          );
          
          // 각 예약에 매물 정보 추가
          const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
            reservationData.map(async (reservation) => {
              try {
                const property = await getProperty(reservation.propertyId);
                return { ...reservation, property: property || undefined };
              } catch (error) {
                return { ...reservation, property: undefined };
              }
            })
          );
          
          setReservations(reservationsWithProperties);
        } catch (error) {
          console.error('Error fetching reservations:', error);
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
    if (tab === 'completed') {
      setActiveTab('completed');
    } else if (tab === null) {
      setActiveTab('active');
    }
  }, [searchParams]);

  // 탭 변경 시 데이터 새로고침 및 URL 업데이트
  useEffect(() => {
    if (user && !authLoading) {
      const fetchReservations = async () => {
        try {
          const reservationData = await getReservationsByOwner(
            user.uid,
            activeTab === 'completed' ? 'completed' : 'active'
          );
          
          const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
            reservationData.map(async (reservation) => {
              try {
                const property = await getProperty(reservation.propertyId);
                return { ...reservation, property: property || undefined };
              } catch (error) {
                return { ...reservation, property: undefined };
              }
            })
          );
          
          setReservations(reservationsWithProperties);
        } catch (error) {
          console.error('Error fetching reservations:', error);
        }
      };
      fetchReservations();
      
      // URL 업데이트 (뒤로가기 지원)
      const newUrl = activeTab === 'completed' 
        ? '/profile/reservations?tab=completed'
        : '/profile/reservations';
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, user, authLoading]);

  // 예약 상태 업데이트 핸들러
  const handleUpdateStatus = async (reservationId: string, newStatus: ReservationData['status']) => {
    if (!reservationId) return;
    
    setUpdatingId(reservationId);
    try {
      await updateReservationStatus(reservationId, newStatus);
      
      // 예약 취소 시 매물 상태 변경 및 기록 남기기 (Rule 1, 2, 3)
      if (newStatus === 'cancelled') {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
          // 1. 취소 기록 남기기
          await logCancelledProperty({
            propertyId: reservation.propertyId,
            reservationId: reservation.id,
            ownerId: user!.uid
          });

          // 1-1. 관련 채팅방의 모든 메시지를 읽음 처리 (알림 제거용)
          try {
            const chatRoom = await findChatRoom(reservation.propertyId, user!.uid, reservation.tenantId);
            if (chatRoom) {
              await markAllMessagesInRoomAsRead(chatRoom.id);
            }
          } catch (chatError) {
            console.error('Failed to mark messages as read on cancellation:', chatError);
          }
          
          // 2. 통합 로직 실행 (병합 체크 -> 한도 체크 -> 광고 재개)
          const result = await handleCancellationRelist(reservation.propertyId, user!.uid);
          
          // 3. 결과에 따른 알림 및 이동 처리
          let message = '';
          let targetTab = 'active';

          switch (result.type) {
            case 'merged':
              message = currentLanguage === 'ko' 
                ? '취소된 기간이 기존 광고 중인 매물과 병합되었습니다. 매물 개수가 유지됩니다.'
                : 'The cancelled period has been merged with an existing ad.';
              break;
            case 'relisted':
              message = currentLanguage === 'ko' 
                ? '예약이 취소되어 매물이 다시 광고 중입니다.'
                : 'Reservation cancelled. Property is back in advertising.';
              break;
            case 'limit_exceeded':
              message = currentLanguage === 'ko' 
                ? '광고 가능한 매물 한도(5개) 초과로 인해 해당 매물은 광고종료 탭으로 이동되었습니다.'
                : 'Moved to Expired Listings due to ad limit (5 properties).';
              targetTab = 'deleted';
              break;
            case 'short_term':
              message = currentLanguage === 'ko' 
                ? '남은 가용 기간이 7일 미만이라 광고종료 탭으로 이동되었습니다.'
                : 'Moved to Expired Listings as the available period is less than 7 days.';
              targetTab = 'deleted';
              break;
          }

          alert(message);
          router.push(`/profile/my-properties?tab=${targetTab}`);
        }
      }
      
      // 데이터 새로고침
      const reservationData = await getReservationsByOwner(
        user!.uid,
        activeTab === 'completed' ? 'completed' : 'active'
      );
      
      const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
        reservationData.map(async (reservation) => {
          try {
            const property = await getProperty(reservation.propertyId);
            return { ...reservation, property: property || undefined };
          } catch (error) {
            return { ...reservation, property: undefined };
          }
        })
      );
      
      setReservations(reservationsWithProperties);
    } catch (error) {
      alert(
        currentLanguage === 'ko' 
          ? '예약 상태 업데이트 중 오류가 발생했습니다.'
          : currentLanguage === 'vi'
          ? 'Đã xảy ra lỗi khi cập nhật trạng thái đặt phòng.'
          : 'An error occurred while updating reservation status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // 예약 삭제 핸들러
  const handleDeleteReservation = async (reservationId: string) => {
    if (!reservationId || !confirm(currentLanguage === 'ko' ? '기록을 영구적으로 삭제하시겠습니까?' : 'Do you want to permanently delete the record?')) return;
    
    setUpdatingId(reservationId);
    try {
      await deleteReservation(reservationId);
      
      // 데이터 새로고침
      const reservationData = await getReservationsByOwner(
        user!.uid,
        activeTab === 'completed' ? 'completed' : 'active'
      );
      
      const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
        reservationData.map(async (reservation) => {
          try {
            const property = await getProperty(reservation.propertyId);
            return { ...reservation, property: property || undefined };
          } catch (error) {
            return { ...reservation, property: undefined };
          }
        })
      );
      
      setReservations(reservationsWithProperties);
    } catch (error) {
      alert(currentLanguage === 'ko' ? '기록 삭제 중 오류가 발생했습니다.' : 'Error deleting record.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    if (currentLanguage === 'ko') {
      return `${year}년 ${month}월 ${day}일`;
    } else if (currentLanguage === 'vi') {
      return `${day}/${month}/${year}`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // 예약 상태 텍스트
  const getStatusText = (status: ReservationData['status']) => {
    if (status === 'pending') {
      return currentLanguage === 'ko' ? '예약 대기' : 
             currentLanguage === 'vi' ? 'Chờ xác nhận' : 
             'Pending';
    } else if (status === 'confirmed') {
      return currentLanguage === 'ko' ? '예약 확정' : 
             currentLanguage === 'vi' ? 'Đã xác nhận' : 
             'Confirmed';
    } else if (status === 'completed') {
      return currentLanguage === 'ko' ? '예약 완료' : 
             currentLanguage === 'vi' ? 'Hoàn thành' : 
             'Completed';
    }
    return currentLanguage === 'ko' ? '취소됨' : 
           currentLanguage === 'vi' ? 'Đã hủy' : 
           'Cancelled';
  };

  // 예약 상태 색상
  const getStatusColor = (status: ReservationData['status']) => {
    if (status === 'pending') return 'bg-yellow-500';
    if (status === 'confirmed') return 'bg-blue-500';
    if (status === 'completed') return 'bg-green-500';
    return 'bg-red-500';
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

  const activeCount = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length;
  const completedCount = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled').length;

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
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">
                {currentLanguage === 'ko' ? '뒤로가기' : 
                 currentLanguage === 'vi' ? 'Quay lại' : 
                 'Back'}
              </span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLanguage === 'ko' ? '예약된 매물 관리' : 
               currentLanguage === 'vi' ? 'Quản lý đặt phòng' : 
               'Reservation Management'}
            </h1>
          </div>

          {/* 탭 */}
          <div className="mb-6 flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentLanguage === 'ko' ? '예약된 매물' : 
               currentLanguage === 'vi' ? 'Đặt phòng' : 
               'Active Reservations'}
              {activeCount > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'completed'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentLanguage === 'ko' ? '예약완료된 매물' : 
               currentLanguage === 'vi' ? 'Hoàn thành' : 
               'Completed Reservations'}
              {completedCount > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  {completedCount}
                </span>
              )}
            </button>
          </div>

          {/* 예약 목록 */}
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {activeTab === 'active'
                  ? (currentLanguage === 'ko' ? '예약된 매물이 없습니다.' : 
                     currentLanguage === 'vi' ? 'Không có đặt phòng nào.' : 
                     'No active reservations.')
                  : (currentLanguage === 'ko' ? '예약완료된 매물이 없습니다.' : 
                     currentLanguage === 'vi' ? 'Không có đặt phòng hoàn thành nào.' : 
                     'No completed reservations.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const property = reservation.property;
                const imageUrl = property?.images && property.images.length > 0
                  ? property.images[0]
                  : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
                  >
                    {/* 매물 이미지 */}
                    <div className="relative h-48 w-full">
                      <Image
                        src={imageUrl}
                        alt={property?.title || 'Property'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 430px) 100vw, 430px"
                      />
                      {/* 상태 배지 */}
                      <div className="absolute top-4 left-4">
                        <span className={`${getStatusColor(reservation.status)} text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                    </div>

                    {/* 매물 정보 */}
                    <div className="p-4 space-y-4">
                      {/* 매물 제목 */}
                      {property && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {property.title}
                          </h3>
                          {property.address && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {property.address}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 예약 날짜 */}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {formatDate(reservation.checkInDate)} ~ {formatDate(reservation.checkOutDate)}
                        </span>
                      </div>

                      {/* 임차인 정보 */}
                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {currentLanguage === 'ko' ? '임차인 정보' : 
                           currentLanguage === 'vi' ? 'Thông tin người thuê' : 
                           'Tenant Information'}
                        </p>
                        {reservation.tenantName && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantName}</span>
                          </div>
                        )}
                        {reservation.tenantEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantEmail}</span>
                          </div>
                        )}
                        {reservation.tenantPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 (예약된 매물 탭에서만) */}
                      {activeTab === 'active' && reservation.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleUpdateStatus(reservation.id!, 'confirmed')}
                            disabled={updatingId === reservation.id}
                            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updatingId === reservation.id
                              ? (currentLanguage === 'ko' ? '처리 중...' : 
                                 currentLanguage === 'vi' ? 'Đang xử lý...' : 
                                 'Processing...')
                              : (currentLanguage === 'ko' ? '예약 확정' : 
                                 currentLanguage === 'vi' ? 'Xác nhận đặt phòng' : 
                                 'Confirm Reservation')}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reservation.id!, 'cancelled')}
                            disabled={updatingId === reservation.id}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {activeTab === 'active' && reservation.status === 'confirmed' && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleUpdateStatus(reservation.id!, 'completed')}
                            disabled={updatingId === reservation.id}
                            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updatingId === reservation.id
                              ? (currentLanguage === 'ko' ? '처리 중...' : 
                                 currentLanguage === 'vi' ? 'Đang xử lý...' : 
                                 'Processing...')
                              : (currentLanguage === 'ko' ? '예약 완료 처리' : 
                                 currentLanguage === 'vi' ? 'Hoàn thành đặt phòng' : 
                                 'Mark as Completed')}
                          </button>
                        </div>
                      )}

                      {/* 삭제 버튼 (취소된 경우에만 표시) */}
                      {reservation.status === 'cancelled' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleDeleteReservation(reservation.id!)}
                            disabled={updatingId === reservation.id}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={currentLanguage === 'ko' ? '기록 삭제' : 'Delete record'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
