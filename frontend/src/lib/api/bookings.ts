/**
 * Bookings API — 퍼블릭 진입점. 모델 `bookingsTypes` · 구현 `bookingsClient` (P1.1 경계, 외부 import 경로는 `@/lib/api/bookings` 유지)
 */
export type { BookingData, CreateBookingRequest } from './bookingsTypes';
export * from './bookingsClient';
