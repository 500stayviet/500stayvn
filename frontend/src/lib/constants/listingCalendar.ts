/** 최소 연박(주 단위 요금 정합) */
export const LISTING_MIN_STAY_DAYS = 7;

/** 호스트 공급 기간 최대: 약 3개월(13주) */
export const LISTING_MAX_SUPPLY_DAYS = 91;

/** 게스트 달력에서 maxDate 없을 때 체크인 기준 상한(여유) */
export const LISTING_MAX_GUEST_SPAN_FALLBACK_DAYS = 91;

export function isOwnerSupplyLengthDays(diffDays: number): boolean {
  return (
    diffDays >= LISTING_MIN_STAY_DAYS &&
    diffDays <= LISTING_MAX_SUPPLY_DAYS &&
    diffDays % 7 === 0
  );
}
