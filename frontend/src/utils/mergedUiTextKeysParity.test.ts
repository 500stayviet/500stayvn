import { describe, expect, it } from "vitest";

import { getMergedUiTextKeyParityMismatches } from "@/utils/i18n";

describe("mergedUiTexts locale parity", () => {
  it("ko, vi, en, ja, zh share the same key set", () => {
    const mismatches = getMergedUiTextKeyParityMismatches();
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
});
