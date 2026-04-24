"use client";

import type { BookingData } from "@/lib/api/bookings";
import type {
  BankProvider,
  KycProvider,
  OtpProvider,
  PaymentProvider,
} from "./interfaces";
import type {
  ServerBankAccount,
  ServerOwnerBalances,
  ServerWithdrawalRequest,
} from "@/lib/api/financeServer";

export type MockScenario = "success" | "fail" | "partial";

function shouldFail(scenario: MockScenario) {
  return scenario === "fail";
}

function isPartial(scenario: MockScenario) {
  return scenario === "partial";
}

const mockBookingStore = new Map<string, BookingData>();

function createMockBookingId() {
  return `mock_booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createMockPaymentProvider(scenario: MockScenario): PaymentProvider {
  return {
  async createBooking(data, propertyData, guestId) {
    if (shouldFail(scenario)) {
      throw new Error("mock_payment_create_failed");
    }
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const weeks = Math.ceil(nights / 7);
    const petCount = data.petCount ?? 0;
    const petFeePerWeek = propertyData.petFee ?? 0;
    const accommodationTotal = propertyData.price * weeks;
    const petTotal = petCount * petFeePerWeek * weeks;
    const serviceFeePercent = 10;
    const serviceFee = Math.round(
      (accommodationTotal + petTotal) * (serviceFeePercent / 100),
    );
    const totalPrice = accommodationTotal + petTotal + serviceFee;
    const nowIso = new Date().toISOString();
    const id = createMockBookingId();

    const booking: BookingData = {
      id,
      propertyId: data.propertyId,
      propertyTitle: propertyData.title,
      propertyAddress: propertyData.address,
      propertyImage: propertyData.image,
      guestId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      guestMessage: data.guestMessage,
      ownerId: propertyData.ownerId,
      ownerName: propertyData.ownerName,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      checkInTime: propertyData.checkInTime,
      checkOutTime: propertyData.checkOutTime,
      adults: data.adults,
      children: data.children,
      petCount,
      totalPrice,
      priceUnit: propertyData.priceUnit,
      nights,
      accommodationTotal,
      petTotal,
      serviceFee,
      serviceFeePercent,
      paymentStatus: "pending",
      status: "pending",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    mockBookingStore.set(id, {
      ...booking,
      ...(isPartial(scenario) ? { status: "pending" as const } : {}),
    });
    return booking;
  },
  async completePayment(bookingId, paymentMethod) {
    if (shouldFail(scenario)) {
      throw new Error("mock_payment_complete_failed");
    }
    const booking = mockBookingStore.get(bookingId);
    if (!booking) return null;
    const updated: BookingData = {
      ...booking,
      paymentMethod,
      paymentStatus: isPartial(scenario) ? "failed" : "paid",
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBookingStore.set(bookingId, updated);
    return updated;
  },
};
}

function createMockKycProvider(scenario: MockScenario): KycProvider {
  return {
  async savePhoneVerification() {
    if (shouldFail(scenario)) throw new Error("mock_kyc_phone_failed");
    return;
  },
  async saveIdDocument() {
    if (shouldFail(scenario) || isPartial(scenario)) {
      throw new Error("mock_kyc_id_failed");
    }
    return;
  },
  async saveFaceVerification() {
    if (shouldFail(scenario) || isPartial(scenario)) {
      throw new Error("mock_kyc_face_failed");
    }
    return;
  },
  async completeKYCVerification() {
    if (shouldFail(scenario)) throw new Error("mock_kyc_complete_failed");
    return;
  },
};
}

const mockBankAccounts: ServerBankAccount[] = [
  {
    id: "mock-bank-1",
    ownerId: "mock-owner",
    bankName: "Mock Bank",
    accountNumber: "123-456-7890",
    accountHolder: "Mock Owner",
    isPrimary: true,
    createdAt: new Date().toISOString(),
  },
];

const mockWithdrawalRequests: ServerWithdrawalRequest[] = [];

function createMockBankProvider(scenario: MockScenario): BankProvider {
  return {
  async getBankAccounts() {
    if (shouldFail(scenario)) return [];
    return [...mockBankAccounts];
  },
  async addBankAccount(input) {
    if (shouldFail(scenario)) return false;
    const next: ServerBankAccount = {
      id: `mock-bank-${Date.now()}`,
      ownerId: "mock-owner",
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountHolder: input.accountHolder,
      isPrimary: input.isPrimary,
      createdAt: new Date().toISOString(),
    };
    if (input.isPrimary) {
      mockBankAccounts.forEach((account) => {
        account.isPrimary = false;
      });
    }
    mockBankAccounts.push(next);
    return true;
  },
  async setPrimaryBankAccount(id) {
    if (shouldFail(scenario)) return false;
    let found = false;
    mockBankAccounts.forEach((account) => {
      const isTarget = account.id === id;
      account.isPrimary = isTarget;
      if (isTarget) found = true;
    });
    return found;
  },
  async removeBankAccount(id) {
    if (shouldFail(scenario)) return false;
    const index = mockBankAccounts.findIndex((account) => account.id === id);
    if (index < 0) return false;
    const wasPrimary = mockBankAccounts[index].isPrimary;
    mockBankAccounts.splice(index, 1);
    if (wasPrimary && mockBankAccounts.length > 0) {
      mockBankAccounts[0].isPrimary = true;
    }
    return true;
  },
  async getWithdrawalRequests() {
    if (shouldFail(scenario)) return [];
    return [...mockWithdrawalRequests];
  },
  async createWithdrawalRequest(input) {
    if (shouldFail(scenario) || isPartial(scenario)) {
      return { ok: false, message: "mock_withdrawal_rejected" };
    }
    mockWithdrawalRequests.unshift({
      id: `mock-withdrawal-${Date.now()}`,
      ownerId: "mock-owner",
      amount: input.amount,
      bankAccountId: input.bankAccountId,
      bankLabel: "Mock Bank / 123-456-7890",
      status: "pending",
      requestedAt: new Date().toISOString(),
    });
    return { ok: true };
  },
  async getOwnerBalances() {
    if (shouldFail(scenario)) {
      return { totalApprovedRevenue: 0, pendingWithdrawal: 0, availableBalance: 0 };
    }
    const pendingWithdrawal = mockWithdrawalRequests
      .filter((row) => row.status === "pending" || row.status === "processing")
      .reduce((sum, row) => sum + row.amount, 0);
    const balances: ServerOwnerBalances = {
      totalApprovedRevenue: 5000000,
      pendingWithdrawal,
      availableBalance: Math.max(0, 5000000 - pendingWithdrawal),
    };
    return balances;
  },
};
}

function createMockOtpProvider(scenario: MockScenario): OtpProvider {
  return {
  async sendOtp() {
    if (shouldFail(scenario)) {
      return { ok: false, error: "mock_otp_send_failed" };
    }
    return { ok: true };
  },
  async verifyOtp(_, code) {
    if (shouldFail(scenario) || isPartial(scenario) || code === "000000") {
      return { ok: false, error: "Invalid code" };
    }
    return { ok: true };
  },
};
}

export function getMockPaymentProvider(scenario: MockScenario): PaymentProvider {
  return createMockPaymentProvider(scenario);
}

export function getMockKycProvider(scenario: MockScenario): KycProvider {
  return createMockKycProvider(scenario);
}

export function getMockBankProvider(scenario: MockScenario): BankProvider {
  return createMockBankProvider(scenario);
}

export function getMockOtpProvider(scenario: MockScenario): OtpProvider {
  return createMockOtpProvider(scenario);
}

export function resolveMockScenario(
  raw: string | null | undefined,
): MockScenario {
  if (raw === "fail") return "fail";
  if (raw === "partial") return "partial";
  return "success";
}

