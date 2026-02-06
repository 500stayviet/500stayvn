/**
 * Reservations API Service (LocalStorage 버전)
 * 
 * 브라우저 LocalStorage에 예약 데이터를 저장하고 관리하는 서비스
 */

/**
 * 예약 데이터 구조
 */
export interface ReservationData {
  id?: string; // 예약 ID
  propertyId: string; // 매물 ID
  tenantId: string; // 임차인 사용자 ID
  ownerId: string; // 임대인 사용자 ID
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; // 예약 상태
  checkInDate: string | Date; // 체크인 날짜 (ISO 문자열 또는 Date 객체)
  checkOutDate: string | Date; // 체크아웃 날짜 (ISO 문자열 또는 Date 객체)
  createdAt?: string; // 예약 생성일 (ISO 문자열)
  confirmedAt?: string; // 예약 확정일 (ISO 문자열)
  completedAt?: string; // 예약 완료일 (ISO 문자열)
  cancelledAt?: string; // 예약 취소일 (ISO 문자열)
  tenantName?: string; // 임차인 이름
  tenantEmail?: string; // 임차인 이메일
  tenantPhone?: string; // 임차인 전화번호
  notes?: string; // 메모
}

/**
 * LocalStorage 키
 */
const STORAGE_KEY = 'reservations';

/**
 * 모든 예약 조회
 */
export async function getAllReservations(): Promise<ReservationData[]> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored) as ReservationData[];
  } catch (error) {
    console.error('Error getting reservations:', error);
    return [];
  }
}

/**
 * 임대인의 예약 목록 조회
 * 
 * @param ownerId - 임대인 사용자 ID
 * @param filterType - 필터 타입: 'active' (pending/confirmed), 'completed' (completed/cancelled), 'all' (모두)
 */
export async function getReservationsByOwner(
  ownerId: string,
  filterType: 'active' | 'completed' | 'all' = 'active'
): Promise<ReservationData[]> {
  try {
    const allReservations = await getAllReservations();
    
    let filtered = allReservations.filter((r) => r.ownerId === ownerId);
    
    if (filterType === 'active') {
      // 예약된 매물: pending, confirmed 상태만
      filtered = filtered.filter((r) => 
        r.status === 'pending' || r.status === 'confirmed'
      );
    } else if (filterType === 'completed') {
      // 예약완료/취소된 매물: completed, cancelled 상태만
      filtered = filtered.filter((r) => r.status === 'completed' || r.status === 'cancelled');
    } else if (filterType === 'all') {
      // 모든 상태 포함 (취소된 것 제외하고 싶다면 여기서 추가 필터링 가능)
      // Gaps Logic에서는 pending, confirmed가 필요하므로 보통 'all'을 부르고 나중에 필터링함
    }
    
    // 최신순 정렬
    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting reservations by owner:', error);
    return [];
  }
}

/**
 * 예약 생성
 */
export async function createReservation(
  reservation: Omit<ReservationData, 'id' | 'createdAt'>
): Promise<ReservationData> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    
    const allReservations = await getAllReservations();
    
    const { toISODateString } = await import('./bookings');
    const newReservation: ReservationData = {
      ...reservation,
      id: `reservation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      checkInDate: toISODateString(reservation.checkInDate),
      checkOutDate: toISODateString(reservation.checkOutDate),
      createdAt: new Date().toISOString(),
    };
    
    allReservations.push(newReservation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReservations));
    
    return newReservation;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

/**
 * 예약 상태 업데이트
 */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationData['status']
): Promise<ReservationData | null> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    
    const allReservations = await getAllReservations();
    const index = allReservations.findIndex((r) => r.id === reservationId);
    
    if (index === -1) {
      return null;
    }
    
    const updatedReservation: ReservationData = {
      ...allReservations[index],
      status,
    };
    
    // 상태에 따른 날짜 설정
    const now = new Date().toISOString();
    if (status === 'confirmed' && !updatedReservation.confirmedAt) {
      updatedReservation.confirmedAt = now;
    } else if (status === 'completed' && !updatedReservation.completedAt) {
      updatedReservation.completedAt = now;
    } else if (status === 'cancelled' && !updatedReservation.cancelledAt) {
      updatedReservation.cancelledAt = now;
    }
    
    allReservations[index] = updatedReservation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReservations));
    
    return updatedReservation;
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
}

/**
 * 예약 삭제 (영구 삭제)
 */
export async function deleteReservation(reservationId: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    
    const allReservations = await getAllReservations();
    const filtered = allReservations.filter((r) => r.id !== reservationId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

/**
 * 예약 조회 (ID로)
 */
export async function getReservationById(reservationId: string): Promise<ReservationData | null> {
  try {
    const allReservations = await getAllReservations();
    return allReservations.find((r) => r.id === reservationId) || null;
  } catch (error) {
    console.error('Error getting reservation by id:', error);
    return null;
  }
}
