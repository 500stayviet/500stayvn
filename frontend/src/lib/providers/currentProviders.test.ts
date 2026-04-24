import { afterEach, describe, expect, it } from "vitest";
import { getOtpProvider } from "./currentProviders";

function setMockWindowSearch(search: string) {
  Object.defineProperty(globalThis, "window", {
    value: { location: { search } },
    writable: true,
    configurable: true,
  });
}

describe("currentProviders scenario resolution", () => {
  const originalUseMock = process.env.NEXT_PUBLIC_USE_MOCK;
  const originalScenario = process.env.NEXT_PUBLIC_MOCK_SCENARIO;
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalUseMock;
    process.env.NEXT_PUBLIC_MOCK_SCENARIO = originalScenario;
    if (typeof originalWindow === "undefined") {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it("uses env scenario when query is absent", async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
    process.env.NEXT_PUBLIC_MOCK_SCENARIO = "fail";
    delete (globalThis as any).window;

    const otpProvider = getOtpProvider();
    const result = await otpProvider.sendOtp("01012341234");
    expect(result.ok).toBe(false);
  });

  it("query scenario overrides env scenario", async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
    process.env.NEXT_PUBLIC_MOCK_SCENARIO = "fail";
    setMockWindowSearch("?mockScenario=success");

    const otpProvider = getOtpProvider();
    const result = await otpProvider.sendOtp("01012341234");
    expect(result.ok).toBe(true);
  });
});

