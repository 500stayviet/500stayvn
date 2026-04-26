import { describe, expect, it } from "vitest";
import { parseAppPaymentResponse, parsePaymentPatchData } from "./appPaymentResponse";

describe("parseAppPaymentResponse", () => {
  it("returns data on ok: true", async () => {
    const res = {
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({ ok: true, data: { payment: { id: "p1" } } })),
    } as unknown as Response;
    const p = await parseAppPaymentResponse(res);
    expect(p).toEqual({ ok: true, data: { payment: { id: "p1" } } });
  });

  it("handles middleware 401 unauthorized", async () => {
    const res = {
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: "unauthorized" })),
    } as unknown as Response;
    const p = await parseAppPaymentResponse(res);
    expect(p.ok).toBe(false);
    if (!p.ok) {
      expect(p.code).toBe("unauthorized");
      expect(p.errorMessage).toMatch(/로그인|다시/);
    }
  });

  it("handles appApiError body", async () => {
    const res = {
      ok: false,
      status: 404,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            ok: false,
            error: { code: "not_found", message: "Resource was not found." },
          }),
        ),
    } as unknown as Response;
    const p = await parseAppPaymentResponse(res);
    expect(p).toEqual(
      expect.objectContaining({
        ok: false,
        code: "not_found",
        errorMessage: "Resource was not found.",
        status: 404,
      }),
    );
  });

  it("returns generic message for non-json error body", async () => {
    const res = {
      ok: false,
      status: 500,
      text: () => Promise.resolve("not json"),
    } as unknown as Response;
    const p = await parseAppPaymentResponse(res);
    expect(p.ok).toBe(false);
    if (!p.ok) {
      expect(p.errorMessage).toMatch(/해석/);
    }
  });
});

describe("parsePaymentPatchData", () => {
  it("reads transition from PATCH body", () => {
    const t = parsePaymentPatchData({
      payment: { id: "p1" },
      transition: { bookingConfirmed: true, bookingCancelled: false },
    });
    expect(t.transition).toEqual({ bookingConfirmed: true, bookingCancelled: false });
  });

  it("defaults when transition missing", () => {
    const t = parsePaymentPatchData({ payment: null });
    expect(t.transition).toEqual({ bookingConfirmed: false, bookingCancelled: false });
  });
});
