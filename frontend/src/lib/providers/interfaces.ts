import type { BookingData, CreateBookingRequest } from "@/lib/api/bookings";
import type {
  IdDocumentData,
  PhoneVerificationData,
} from "@/types/kyc.types";
import type {
  ServerBankAccount,
  ServerOwnerBalances,
  ServerWithdrawalRequest,
} from "@/lib/api/financeServer";

export type BookingPropertySnapshot = {
  title: string;
  address?: string;
  image?: string;
  ownerId: string;
  ownerName?: string;
  price: number;
  priceUnit: "vnd" | "usd";
  checkInTime?: string;
  checkOutTime?: string;
  petFee?: number;
};

export interface PaymentProvider {
  createBooking(
    data: CreateBookingRequest,
    propertyData: BookingPropertySnapshot,
    guestId: string,
  ): Promise<BookingData>;
  completePayment(
    bookingId: string,
    paymentMethod: BookingData["paymentMethod"],
  ): Promise<BookingData | null>;
}

export interface BankProvider {
  getBankAccounts(): Promise<ServerBankAccount[]>;
  addBankAccount(input: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isPrimary: boolean;
  }): Promise<boolean>;
  setPrimaryBankAccount(id: string): Promise<boolean>;
  removeBankAccount(id: string): Promise<boolean>;
  getWithdrawalRequests(): Promise<ServerWithdrawalRequest[]>;
  createWithdrawalRequest(input: {
    amount: number;
    bankAccountId: string;
  }): Promise<{ ok: boolean; message?: string }>;
  getOwnerBalances(): Promise<ServerOwnerBalances>;
}

export interface OtpProvider {
  sendOtp(phoneNumber: string): Promise<{ ok: boolean; error?: string }>;
  verifyOtp(
    phoneNumber: string,
    code: string,
  ): Promise<{ ok: boolean; error?: string }>;
}

export interface KycProvider {
  savePhoneVerification(uid: string, data: PhoneVerificationData): Promise<void>;
  saveIdDocument(
    uid: string,
    idData: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ): Promise<void>;
  saveFaceVerification(
    uid: string,
    images: { direction: string; file: File }[],
  ): Promise<void>;
  completeKYCVerification(uid: string): Promise<void>;
}

