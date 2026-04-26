import type { RentalIncomeStatus } from '@/lib/utils/rentalIncome';

export type TabType = 'revenue' | 'withdrawal' | 'bank';

/** 수익 내역 한 건 (booking 기반, 조회 시점 상태) */
export interface RevenueEntry {
  bookingId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  amount: number;
  status: RentalIncomeStatus;
  settlementHeld: boolean;
  settlementApproved: boolean;
  settlementInAdminQueue: boolean;
  afterCheckOut: boolean;
}
