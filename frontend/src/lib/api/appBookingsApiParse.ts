import type { BookingData } from "./bookingsTypes";
import { unwrapAppApiData } from "./appApiEnvelope";

export type AppBookingsListPayload = {
  bookings: BookingData[];
  page?: { hasMore?: boolean; nextOffset?: number };
};

/**
 * `GET /api/app/bookings` (및 admin 평면 응답) JSON → `unwrapAppApiData` + 방어
 */
export function parseAppBookingsListPayload(json: unknown): AppBookingsListPayload {
  const root = unwrapAppApiData<{
    bookings?: BookingData[];
    page?: { hasMore?: boolean; nextOffset?: number };
  }>(json);
  return {
    bookings: Array.isArray(root?.bookings) ? root.bookings : [],
    page: root?.page,
  };
}
