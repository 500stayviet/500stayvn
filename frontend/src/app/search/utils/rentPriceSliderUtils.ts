/**
 * Search rent range: 10 equally-spaced UI stops (indices 0–9).
 * Values: [0, 2M, 4M, 6M, 8M, 10M, 15M, 20M, 30M, priceCap].
 */

export const RENT_SLIDER_LAST_INDEX = 9;

/** Fixed knots (index 0..8). Index 9 is always `priceCap`. */
export const RENT_SLIDER_FIXED_VALUES = [
  0, 2_000_000, 4_000_000, 6_000_000, 8_000_000, 10_000_000, 15_000_000,
  20_000_000, 30_000_000,
] as const;

export function getRentSliderValueAtIndex(
  index: number,
  priceCap: number,
): number {
  const cap = Math.max(0, priceCap);
  if (index >= RENT_SLIDER_LAST_INDEX) return cap;
  if (index <= 0) return 0;
  return Math.min(RENT_SLIDER_FIXED_VALUES[index], cap);
}

export function getRentSliderIndexForValue(
  value: number,
  priceCap: number,
): number {
  const cap = Math.max(0, priceCap);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i <= RENT_SLIDER_LAST_INDEX; i++) {
    const v = getRentSliderValueAtIndex(i, cap);
    const d = Math.abs(v - value);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function snapRentSliderPrice(value: number, priceCap: number): number {
  const cap = Math.max(0, priceCap);
  const idx = getRentSliderIndexForValue(value, cap);
  return getRentSliderValueAtIndex(idx, cap);
}

/** Position on track: 0..1 for index */
export function rentSliderIndexToPct(index: number): number {
  if (RENT_SLIDER_LAST_INDEX <= 0) return 0;
  return Math.max(0, Math.min(1, index / RENT_SLIDER_LAST_INDEX));
}

/** Pointer x / width -> nearest index 0..9 */
export function rentSliderPctToIndex(pct: number): number {
  const p = Math.max(0, Math.min(1, pct));
  return Math.round(p * RENT_SLIDER_LAST_INDEX);
}
