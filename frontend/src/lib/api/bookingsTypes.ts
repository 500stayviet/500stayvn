/**
 * 예약 DTO (클라이언트) — `bookings` API 모델 전용. 구현은 `bookingsClient`.
 */

/**
 * 예약 데이터 구조
 */
export interface BookingData {
  id?: string;
  propertyId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyImage?: string;

  guestId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestMessage?: string;

  ownerId: string;
  ownerName?: string;

  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;

  adults: number;
  children: number;
  petCount?: number;

  totalPrice: number;
  priceUnit: "vnd" | "usd";
  nights: number;
  accommodationTotal?: number;
  petTotal?: number;
  serviceFee?: number;
  serviceFeePercent?: number;

  paymentMethod?: "momo" | "zalopay" | "bank_transfer" | "pay_at_property";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentDate?: string;

  status: "pending" | "confirmed" | "cancelled" | "completed";

  chatRoomId?: string;

  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  completedAt?: string;

  refundAdminApproved?: boolean;
  refundAdminApprovedAt?: string;
  refundAdminApprovedBy?: string;
}

/**
 * 예약 생성 요청 데이터
 */
export interface CreateBookingRequest {
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestMessage?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  petCount?: number;
}
