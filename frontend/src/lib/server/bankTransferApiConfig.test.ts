import { afterEach, describe, expect, it } from "vitest";
import {
  getBankTransferApiConfig,
  getBankTransferWebhookSecret,
  isBankTransferApiConfigured,
} from "./bankTransferApiConfig";

const KEYS = [
  "BANK_TRANSFER_API_BASE_URL",
  "BANK_TRANSFER_API_CLIENT_ID",
  "BANK_TRANSFER_API_SECRET",
  "BANK_TRANSFER_WEBHOOK_SECRET",
] as const;

describe("bankTransferApiConfig", () => {
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it("설정 미비 시 null 및 비활성(credentials 일부만 있어도 null)", () => {
    process.env.BANK_TRANSFER_API_BASE_URL = "https://sandbox.bank.example/api";
    expect(getBankTransferApiConfig()).toBeNull();
    expect(isBankTransferApiConfigured()).toBe(false);
  });

  it("세 값이 모두 있으면 baseUrl 트레일링 슬래시 제거 후 반환", () => {
    process.env.BANK_TRANSFER_API_BASE_URL = " https://sandbox.bank.example/v2/ ";
    process.env.BANK_TRANSFER_API_CLIENT_ID = "partner_1";
    process.env.BANK_TRANSFER_API_SECRET = "secret_only_in_env";
    const c = getBankTransferApiConfig();
    expect(c).not.toBeNull();
    expect(c!.baseUrl).toBe("https://sandbox.bank.example/v2");

    expect(isBankTransferApiConfigured()).toBe(true);

    delete process.env.BANK_TRANSFER_API_SECRET;
    expect(getBankTransferApiConfig()).toBeNull();
  });

  it("웹훅 시크릿은 단독 변수", () => {
    expect(getBankTransferWebhookSecret()).toBeNull();
    process.env.BANK_TRANSFER_WEBHOOK_SECRET = "  whsec_x  ";
    expect(getBankTransferWebhookSecret()).toBe("whsec_x");
  });
});
