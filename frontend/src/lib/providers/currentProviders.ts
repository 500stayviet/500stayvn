"use client";

import {
  addAppBankAccount,
  createAppWithdrawalRequest,
  getAppBankAccounts,
  getAppOwnerBalances,
  getAppWithdrawalRequests,
  removeAppBankAccount,
  setAppPrimaryBankAccount,
} from "@/lib/api/financeServer";
import {
  completePayment,
  createBooking,
  type BookingData,
} from "@/lib/api/bookings";
import {
  completeKYCVerification,
  saveFaceVerification,
  saveIdDocument,
  savePhoneVerification,
} from "@/lib/api/kyc";
import type {
  BankProvider,
  KycProvider,
  OtpProvider,
  PaymentProvider,
} from "./interfaces";
import {
  getMockBankProvider,
  getMockKycProvider,
  getMockOtpProvider,
  getMockPaymentProvider,
  resolveMockScenario,
  type MockScenario,
} from "./mockProviders";

const currentPaymentProvider: PaymentProvider = {
  createBooking,
  completePayment,
};

const currentBankProvider: BankProvider = {
  getBankAccounts: getAppBankAccounts,
  addBankAccount: addAppBankAccount,
  setPrimaryBankAccount: setAppPrimaryBankAccount,
  removeBankAccount: removeAppBankAccount,
  getWithdrawalRequests: getAppWithdrawalRequests,
  createWithdrawalRequest: createAppWithdrawalRequest,
  getOwnerBalances: getAppOwnerBalances,
};

const currentOtpProvider: OtpProvider = {
  async sendOtp(phoneNumber: string) {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      if (response.ok) return { ok: true };
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return { ok: false, error: data.error || "Failed to send OTP" };
    } catch {
      return { ok: false, error: "System error occurred" };
    }
  },
  async verifyOtp(phoneNumber: string, code: string) {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      if (response.ok) return { ok: true };
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return { ok: false, error: data.error || "Invalid code" };
    } catch {
      return { ok: false, error: "Verification error" };
    }
  },
};

const currentKycProvider: KycProvider = {
  savePhoneVerification,
  saveIdDocument,
  saveFaceVerification,
  completeKYCVerification,
};

function useMockProviders() {
  const flag = process.env.NEXT_PUBLIC_USE_MOCK;
  return flag === "true" || flag === "1" || flag === "yes";
}

function getMockScenario(): MockScenario {
  const envScenario = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  let queryScenario: string | null = null;
  if (typeof window !== "undefined") {
    queryScenario = new URLSearchParams(window.location.search).get("mockScenario");
  }
  return resolveMockScenario(queryScenario ?? envScenario);
}

export function getPaymentProvider(): PaymentProvider {
  if (useMockProviders()) return getMockPaymentProvider(getMockScenario());
  return currentPaymentProvider;
}

export function getBankProvider(): BankProvider {
  if (useMockProviders()) return getMockBankProvider(getMockScenario());
  return currentBankProvider;
}

export function getOtpProvider(): OtpProvider {
  if (useMockProviders()) return getMockOtpProvider(getMockScenario());
  return currentOtpProvider;
}

export function getKycProvider(): KycProvider {
  if (useMockProviders()) return getMockKycProvider(getMockScenario());
  return currentKycProvider;
}

export type { BookingData };

