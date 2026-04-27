/**
 * scan:ui-ko 정책 (요약)
 * - 목적: 사용자에게 노출될 수 있는 .ts/.tsx 코드 경로에서 한글 리터럴을 찾는다.
 * - 제외: i18n 원본(i18n.ts), API 에러 사전, 테스트 파일, 정적 데이터/법률 콘텐츠/시설 상수 등
 * - 전처리: JSX 블록 주석·C 스타일 블록 주석을 제거한 뒤 줄 단위로 검사
 *   (줄 끝 line comment는 별도 제거). 주석·문서에만 있는 한글은 히트에서 제외된다.
 */

import path from "path";

/** @param {string} absPath normalized with path.sep */
export function shouldSkipScanFile(absPath) {
  const n = absPath.replace(/\//g, path.sep);
  return SKIP_PATH_SUBSTRINGS.some((s) => n.includes(s));
}

export const SKIP_PATH_SUBSTRINGS = [
  `${path.sep}utils${path.sep}i18n.ts`,
  `${path.sep}i18nAppApiErrors`,
  `${path.sep}i18nListing`,
  ".test.ts",
  ".spec.ts",
  // 정적 데이터 · 법률 텍스트 · 시설/편의시설 카탈로그 (다국어는 객체 필드로 보관)
  `${path.sep}lib${path.sep}data${path.sep}`,
  `${path.sep}content${path.sep}legalPages.ts`,
  `${path.sep}lib${path.sep}constants${path.sep}facilities.ts`,
  `${path.sep}lib${path.sep}constants${path.sep}amenities.ts`,
];

/**
 * JSX 블록 주석 (여러 줄 포함)
 * @param {string} text
 */
export function stripJsxBlockComments(text) {
  return text.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

/**
 * / ** … * / 및 / * … * / (비탐욕). TS/TSX 공통.
 * JSX 주석 제거 후 호출하는 것을 권장.
 * @param {string} text
 */
export function stripCStyleBlockComments(text) {
  return text
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * @param {string} text
 * @param {string} ext .ts | .tsx
 */
export function preprocessSourceForScan(text, ext) {
  let t = text;
  if (ext === ".tsx") {
    t = stripJsxBlockComments(t);
  }
  t = stripCStyleBlockComments(t);
  return t;
}

/** 줄 끝 // 주석 제거 */
export function stripLineEndComment(line) {
  const idx = line.indexOf("//");
  if (idx < 0) return line;
  return line.slice(0, idx);
}
