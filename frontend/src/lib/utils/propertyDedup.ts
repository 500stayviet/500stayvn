/**
 * "같은 매물" 판정을 위한 정규화 유틸.
 * - 주소: 공백 정리 + 소문자 + 악센트(베트남어 등) 제거 + 비문자/숫자 제거
 * - 호실(unitNumber): 숫자만 추출(예: 101호 / 0101호 -> "101")
 *
 * 주의: 삭제/비활성화 같은 파괴적 처리는 재검증 단계에서 이 로직을 재사용해야 합니다.
 */

export function normalizeAddressPart(value?: string | null): string {
  if (!value) return "";
  // 대소문자/공백 정리
  const trimmed = value.trim().replace(/\s+/g, " ").toLowerCase();
  if (!trimmed) return "";

  // 악센트 제거 (NFD decomposed -> combining marks 제거)
  const noDiacritics = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 알파벳/숫자/유니코드 문자만 남기기 (구분자/기호 제거)
  // eslint-disable-next-line no-control-regex
  return noDiacritics.replace(/[^\p{L}\p{N}]+/gu, "");
}

export function normalizeUnitNumberPart(value?: string | null): string {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";

  // "0001호" / "101" / "101호" -> "101"
  const digits = str.match(/\d+/g)?.join("") ?? "";
  return digits;
}

export function areSamePropertyValues(
  a: { address?: string | null; unitNumber?: string | null },
  b: { address?: string | null; unitNumber?: string | null },
): boolean {
  const aAddr = normalizeAddressPart(a.address);
  const bAddr = normalizeAddressPart(b.address);
  if (!aAddr || !bAddr) return false;

  const aUnit = normalizeUnitNumberPart(a.unitNumber);
  const bUnit = normalizeUnitNumberPart(b.unitNumber);

  // 호실이 둘 다 없으면(정규화 후 빈 문자열) 주소만으로 비교
  if (!aUnit && !bUnit) return aAddr === bAddr;

  // 하나라도 있으면 둘 다 있어야 정확히 동일로 인정
  if (!aUnit || !bUnit) return false;
  return aAddr === bAddr && aUnit === bUnit;
}

