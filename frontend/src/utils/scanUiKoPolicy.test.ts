import path from "path";
import { describe, expect, it } from "vitest";
import {
  preprocessSourceForScan,
  shouldSkipScanFile,
  stripLineEndComment,
} from "../../scripts/scan-ui-korean-literals-lib.mjs";

describe("scan-ui-korean-literals policy (scripts/scan-ui-korean-literals-lib.mjs)", () => {
  it("removes Hangul inside JSX and block comments but keeps string literals", () => {
    const src = `{/* 주석 한글 */}\nconst x = 1;\n/** 문서\n * 줄\n */\nexport const msg = "화면 한글";\n`;
    const t = preprocessSourceForScan(src, ".tsx");
    expect(t).toContain("화면 한글");
    expect(t).not.toContain("주석 한글");
    expect(t).not.toContain("문서");
  });

  it("stripLineEndComment removes // line suffix (naive; URLs with // are not handled)", () => {
    expect(stripLineEndComment(`code // 노트`)).toBe("code ");
    expect(stripLineEndComment(`const n = 1`)).toBe(`const n = 1`);
  });

  it("shouldSkipScanFile skips data and i18n paths", () => {
    const root = path.join("frontend", "src");
    expect(
      shouldSkipScanFile(path.join(root, "lib", "data", "vietnam-regions.ts")),
    ).toBe(true);
    expect(shouldSkipScanFile(path.join(root, "utils", "i18n.ts"))).toBe(true);
    expect(
      shouldSkipScanFile(path.join(root, "components", "Header.tsx")),
    ).toBe(false);
  });
});
