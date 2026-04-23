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
