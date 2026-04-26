'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getReservationsByOwner, updateReservationStatus, deleteReservation } from '@/lib/api/reservations';
import { getProperty, logCancelledProperty, handleCancellationRelist } from '@/lib/api/properties';
import { getCurrentUserData } from '@/lib/api/auth';
import type { ReservationData } from '@/lib/api/reservations';
import { markAllMessagesInRoomAsRead, findChatRoom } from '@/lib/api/chat';
import { getOwnerBookings } from '@/lib/api/bookings';
import { getServerTime, ServerTimeSyncError } from '@/lib/api/serverTime';
import { getCheckInMoment } from '@/lib/utils/rentalIncome';
import { toISODateString } from '@/lib/utils/dateUtils';
import { getUIText } from '@/utils/i18n';
import type { ReservationWithProperty } from '../types';

/**
 * 임대인 예약 관리: KYC·예약 목록·서버시간·상태 변경·취소 후 재리스트 흐름을 묶는다.
 */
export function useReservationsPage() {
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
  const [ownerBookings, setOwnerBookings] = useState<Awaited<ReturnType<typeof getOwnerBookings>>>([]);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [serverTimeError, setServerTimeError] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      void (async () => {
        try {
          setLoading(true);

          const userData = await getCurrentUserData(user.uid);
          const kycSteps = userData?.kyc_steps || {};
          const completed = (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;

          if (!completed) {
            router.push('/profile');
            return;
          }

          const reservationData = await getReservationsByOwner(
            user.uid,
            activeTab === 'completed' ? 'completed' : 'active'
          );

          const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
            reservationData.map(async (reservation) => {
              try {
                const property = await getProperty(reservation.propertyId);
                return { ...reservation, property: property || undefined };
              } catch {
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
      })();
    }
  }, [user, authLoading, router, activeTab]);

  useEffect(() => {
    if (!user?.uid) {
      setOwnerBookings([]);
      setServerTime(null);
      setServerTimeError(false);
      return;
    }
    void Promise.all([getOwnerBookings(user.uid), getServerTime()])
      .then(([bookings, now]) => {
        setOwnerBookings(bookings);
        setServerTime(now);
        setServerTimeError(false);
      })
      .catch((err) => {
        if (err instanceof ServerTimeSyncError) {
          setServerTimeError(true);
          setServerTime(null);
          setOwnerBookings([]);
        }
      });
  }, [user?.uid]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'completed') {
      setActiveTab('completed');
    } else if (tab === null) {
      setActiveTab('active');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      void (async () => {
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
              } catch {
                return { ...reservation, property: undefined };
              }
            })
          );

          setReservations(reservationsWithProperties);
        } catch (error) {
          console.error('Error fetching reservations:', error);
        }
      })();

      const newUrl =
        activeTab === 'completed' ? '/profile/reservations?tab=completed' : '/profile/reservations';
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, user, authLoading]);

  const reloadReservations = async () => {
    if (!user) return;
    const reservationData = await getReservationsByOwner(
      user.uid,
      activeTab === 'completed' ? 'completed' : 'active'
    );
    const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
      reservationData.map(async (reservation) => {
        try {
          const property = await getProperty(reservation.propertyId);
          return { ...reservation, property: property || undefined };
        } catch {
          return { ...reservation, property: undefined };
        }
      })
    );
    setReservations(reservationsWithProperties);
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: ReservationData['status']) => {
    if (!reservationId || !user) return;

    setUpdatingId(reservationId);
    try {
      await updateReservationStatus(reservationId, newStatus);

      if (newStatus === 'cancelled') {
        const reservation = reservations.find((r) => r.id === reservationId);
        if (reservation) {
          await logCancelledProperty({
            propertyId: reservation.propertyId,
            reservationId: reservation.id,
            ownerId: user.uid,
          });

          try {
            const chatRoom = await findChatRoom(reservation.propertyId, user.uid, reservation.tenantId);
            if (chatRoom) {
              await markAllMessagesInRoomAsRead(chatRoom.id);
            }
          } catch (chatError) {
            console.error('Failed to mark messages as read on cancellation:', chatError);
          }

          const result = await handleCancellationRelist(reservation.propertyId, user.uid);

          let message = '';
          let targetTab = 'active';

          switch (result.type) {
            case 'merged':
              message =
                currentLanguage === 'ko'
                  ? '취소된 기간이 기존 광고 중인 매물과 병합되었습니다. 매물 개수가 유지됩니다.'
                  : 'The cancelled period has been merged with an existing ad.';
              break;
            case 'relisted':
              message =
                currentLanguage === 'ko'
                  ? '예약이 취소되어 매물이 다시 광고 중입니다.'
                  : 'Reservation cancelled. Property is back in advertising.';
              break;
            case 'limit_exceeded':
              message =
                currentLanguage === 'ko'
                  ? '예약이 취소되어 광고대기 탭에서 다시 등록해 주세요.'
                  : 'Reservation cancelled — open Waiting to relist and re-submit.';
              targetTab = 'pending';
              break;
            case 'short_term':
              message =
                currentLanguage === 'ko'
                  ? '예약이 취소되어 광고대기 탭으로 이동되었습니다. 펜(수정)으로 기간을 맞춘 뒤 다시 올리세요.'
                  : 'Reservation cancelled — moved to waiting. Edit dates then relist.';
              targetTab = 'pending';
              break;
          }

          alert(message);
          router.push(`/profile/my-properties?tab=${targetTab}`);
        }
      }

      await reloadReservations();
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

  const handleDeleteReservation = async (reservationId: string) => {
    if (!reservationId || !user) return;
    if (
      !confirm(
        currentLanguage === 'ko' ? '기록을 영구적으로 삭제하시겠습니까?' : 'Do you want to permanently delete the record?'
      )
    )
      return;

    setUpdatingId(reservationId);
    try {
      await deleteReservation(reservationId);
      await reloadReservations();
    } catch (error) {
      alert(currentLanguage === 'ko' ? '기록 삭제 중 오류가 발생했습니다.' : 'Error deleting record.');
    } finally {
      setUpdatingId(null);
    }
  };

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

  const isReservationInStay = (reservation: ReservationWithProperty): boolean => {
    if (reservation.status !== 'confirmed') return false;
    const checkInDateStr = toISODateString(reservation.checkInDate);
    if (!checkInDateStr) return false;
    const matching = ownerBookings.find(
      (b) =>
        b.propertyId === reservation.propertyId &&
        b.checkInDate === checkInDateStr &&
        b.guestId === reservation.tenantId
    );
    if (!matching) return false;
    if (serverTime === null) return false;
    const checkInMoment = getCheckInMoment(matching.checkInDate, matching.checkInTime ?? '14:00');
    return serverTime.getTime() >= checkInMoment.getTime();
  };

  const getStatusText = (status: ReservationData['status'], reservation?: ReservationWithProperty) => {
    if (status === 'pending') {
      return currentLanguage === 'ko' ? '예약 대기' : currentLanguage === 'vi' ? 'Chờ xác nhận' : 'Pending';
    } else if (status === 'confirmed') {
      if (reservation && isReservationInStay(reservation)) {
        return getUIText('rentingInProgress', currentLanguage);
      }
      return currentLanguage === 'ko' ? '예약 확정' : currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed';
    } else if (status === 'completed') {
      return currentLanguage === 'ko' ? '예약 완료' : currentLanguage === 'vi' ? 'Hoàn thành' : 'Completed';
    }
    return currentLanguage === 'ko' ? '취소됨' : currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled';
  };

  const getStatusColor = (status: ReservationData['status'], reservation?: ReservationWithProperty) => {
    if (status === 'pending') return 'bg-yellow-500';
    if (status === 'confirmed' && reservation && isReservationInStay(reservation)) return 'bg-purple-500';
    if (status === 'confirmed') return 'bg-blue-500';
    if (status === 'completed') return 'bg-green-500';
    return 'bg-red-500';
  };

  const activeCount = reservations.filter((r) => r.status === 'pending' || r.status === 'confirmed').length;
  const completedCount = reservations.filter((r) => r.status === 'completed' || r.status === 'cancelled').length;

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    reservations,
    loading,
    activeTab,
    setActiveTab,
    updatingId,
    serverTimeError,
    handleUpdateStatus,
    handleDeleteReservation,
    formatDate,
    getStatusText,
    getStatusColor,
    activeCount,
    completedCount,
  };
}

export type ReservationsPageViewModel = ReturnType<typeof useReservationsPage>;
