import type { SupportedLanguage } from "@/lib/api/translation";

const COMPACT_LOCALE: Record<SupportedLanguage, string> = {
  ko: "ko-KR",
  vi: "vi-VN",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
};

/**
 * Compact VND display (local app style): k below 1M, M from 1M.
 * Examples: 500_000 -> "500k", 1_000_000 -> "1M", 7_500_000 -> "7.5M"
 */
export function formatCurrency(vnd: number): string {
  if (!Number.isFinite(vnd) || vnd <= 0) {
    return "0";
  }
  if (vnd < 1_000_000) {
    const k = vnd / 1000;
    if (Number.isInteger(k)) return `${k}k`;
    const rounded = parseFloat(k.toFixed(1));
    return `${rounded}k`;
  }
  const m = vnd / 1_000_000;
  if (Number.isInteger(m)) return `${m}M`;
  return `${parseFloat(m.toFixed(1))}M`;
}

/**
 * Locale-aware compact amount for search sliders and similar (VND, no currency symbol).
 * Uses Intl compact notation so Korean/Japanese/Chinese/Vietnamese read naturally.
 */
export function formatCompactVnd(
  vnd: number,
  language: SupportedLanguage,
): string {
  if (!Number.isFinite(vnd) || vnd <= 0) {
    return "0";
  }
  const loc = COMPACT_LOCALE[language] ?? "en-US";
  try {
    return new Intl.NumberFormat(loc, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(vnd);
  } catch {
    return formatCurrency(vnd);
  }
}
