import type { ReservationData } from '@/lib/api/reservations';
import type { PropertyData } from '@/types/property';

/** 예약 행 + 상세에 쓸 매물 스냅샷 */
export interface ReservationWithProperty extends ReservationData {
  property?: PropertyData;
}
