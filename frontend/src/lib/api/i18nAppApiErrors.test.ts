import { describe, expect, it } from "vitest";

import { getAppApiErrorI18nParityMismatches } from "@/lib/api/i18nAppApiErrors";

describe("i18nAppApiErrors parity", () => {
  it("5 locales share the same keys", () => {
    const m = getAppApiErrorI18nParityMismatches();
    expect(m, m.join("\n")).toEqual([]);
  });
});
