import { describe, expect, it } from "vitest";

import {
  getMergedUiTextEmptyTranslationMismatches,
  getMergedUiTextKeyParityMismatches,
} from "@/utils/i18n";

describe("mergedUiTexts locale parity", () => {
  it("ko, vi, en, ja, zh share the same key set", () => {
    const mismatches = getMergedUiTextKeyParityMismatches();
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("ko에 문구가 있는 키는 vi/en/ja/zh 에서 빈 문자열이 아니다 (MERGED_UI_TEXT_EMPTY_ALLOW 예외)", () => {
    const gaps = getMergedUiTextEmptyTranslationMismatches();
    expect(gaps, gaps.join("\n")).toEqual([]);
  });
});
