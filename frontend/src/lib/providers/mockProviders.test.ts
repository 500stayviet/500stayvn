import { describe, expect, it } from "vitest";
import {
  getMockBankProvider,
  getMockKycProvider,
  getMockOtpProvider,
  getMockPaymentProvider,
  resolveMockScenario,
} from "./mockProviders";

describe("resolveMockScenario", () => {
  it("returns success by default", () => {
    expect(resolveMockScenario(undefined)).toBe("success");
    expect(resolveMockScenario(null)).toBe("success");
    expect(resolveMockScenario("unknown")).toBe("success");
  });

  it("returns fail and partial for supported values", () => {
    expect(resolveMockScenario("fail")).toBe("fail");
    expect(resolveMockScenario("partial")).toBe("partial");
  });
});

describe("mock payment provider", () => {
  const bookingInput = {
    propertyId: "p1",
    guestName: "Guest",
    guestEmail: "guest@test.com",
    guestPhone: "01012341234",
    guestMessage: "hello",
    checkInDate: "2026-05-01",
    checkOutDate: "2026-05-08",
    adults: 1,
    children: 0,
  };
  const propertySnapshot = {
    title: "Mock Property",
    address: "Mock Address",
    image: "/mock.jpg",
    ownerId: "owner-1",
    ownerName: "Owner",
    price: 1000000,
    priceUnit: "vnd" as const,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    petFee: 100000,
  };

  it("throws in fail scenario", async () => {
    const provider = getMockPaymentProvider("fail");
    await expect(provider.createBooking(bookingInput, propertySnapshot, "guest-1")).rejects.toThrow(
      "mock_payment_create_failed",
    );
  });

  it("returns failed payment status in partial scenario", async () => {
    const provider = getMockPaymentProvider("partial");
    const booking = await provider.createBooking(bookingInput, propertySnapshot, "guest-1");
    const completed = await provider.completePayment(booking.id!, "momo");
    expect(completed?.paymentStatus).toBe("failed");
  });
});

describe("mock kyc provider", () => {
  it("fails id step in partial scenario", async () => {
    const provider = getMockKycProvider("partial");
    await expect(
      provider.saveIdDocument(
        "u1",
        {
          type: "id_card",
          idNumber: "123",
          fullName: "Tester",
          dateOfBirth: "1990-01-01",
        },
        new File([new Blob(["x"], { type: "image/jpeg" })], "front.jpg"),
      ),
    ).rejects.toThrow("mock_kyc_id_failed");
  });
});

describe("mock bank and otp providers", () => {
  it("rejects withdrawal request in partial scenario", async () => {
    const provider = getMockBankProvider("partial");
    const result = await provider.createWithdrawalRequest({
      amount: 100000,
      bankAccountId: "mock-bank-1",
    });
    expect(result.ok).toBe(false);
  });

  it("fails otp send in fail scenario", async () => {
    const provider = getMockOtpProvider("fail");
    const result = await provider.sendOtp("01012341234");
    expect(result.ok).toBe(false);
  });
});

