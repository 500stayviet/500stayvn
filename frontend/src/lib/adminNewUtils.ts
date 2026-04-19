import type { UserData } from '@/lib/api/auth';
import type { PropertyData } from '@/types/property';

/** 신규 구간: 가입·등록 후 24시간 (지나면 신규 탭에서 자연히 제외) */
export const ADMIN_NEW_MS = 24 * 60 * 60 * 1000;

function parseAnyDate(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'string' || typeof v === 'number') {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().getTime();
  }
  try {
    const t = new Date(String(v)).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

/** 가입·프로필 수정 등 마지막 활동 시각(ms) */
export function adminUserLastActivityMs(u: Pick<UserData, 'createdAt' | 'updatedAt' | 'deleted'>): number {
  if (u.deleted) return 0;
  return Math.max(parseAnyDate(u.createdAt), parseAnyDate(u.updatedAt));
}

export function isUserNew(u: Pick<UserData, 'createdAt' | 'updatedAt' | 'deleted'>): boolean {
  if (u.deleted) return false;
  const t = adminUserLastActivityMs(u);
  if (t <= 0) return false;
  return Date.now() - t < ADMIN_NEW_MS;
}

/** 등록·수정 등 마지막 활동 시각(ms) — 수정 후에도 신규 탭 후보가 되도록 */
export function adminPropertyLastActivityMs(p: PropertyData): number {
  if (p.deleted) return 0;
  return Math.max(parseAnyDate(p.createdAt), parseAnyDate(p.updatedAt));
}

export function isPropertyNew(p: PropertyData): boolean {
  if (p.deleted) return false;
  const t = adminPropertyLastActivityMs(p);
  if (t <= 0) return false;
  return Date.now() - t < ADMIN_NEW_MS;
}

/** 브라우저 로컬 자정(00:00) 기준 캘린더 일의 시작 시각(ms) */
export function localCalendarDayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * 관리자 매물「신규」탭
 * - 미확인(마지막 활동이 마지막 확인보다 최신): 확인할 때까지 탭에 유지(등록만·수정 후에도 동일).
 * - 확인했고 그 이후 수정 없음: 확인한 로컬 당일만 탭에 두고, 다음 자정 이후 제외.
 */
export function shouldShowPropertyInAdminNewTab(
  p: PropertyData,
  ackAtByPropertyId: Map<string, Date>
): boolean {
  const id = p.id;
  if (!id || p.deleted) return false;
  const activity = adminPropertyLastActivityMs(p);
  if (activity <= 0) return false;

  const ackedAt = ackAtByPropertyId.get(id);
  if (!ackedAt) return true;

  if (activity > ackedAt.getTime()) {
    return true;
  }
  return localCalendarDayStartMs(ackedAt) >= localCalendarDayStartMs(new Date());
}

/**
 * 관리자 계정「신규」탭: 가입 24h 이내면 후보.
 * 확인한 계정은 확인한 당일만 탭에 남고, 다음 로컬 자정 이후 목록에서 제외.
 */
export function shouldShowUserInAdminNewTab(
  u: Pick<UserData, 'uid' | 'createdAt' | 'updatedAt' | 'deleted'>,
  ackAtByUid: Map<string, Date>
): boolean {
  if (!isUserNew(u)) return false;
  const id = u.uid;
  if (!id) return false;
  const ackedAt = ackAtByUid.get(id);
  if (!ackedAt) return true;
  const activity = adminUserLastActivityMs(u);
  if (activity > ackedAt.getTime()) return true;
  return localCalendarDayStartMs(ackedAt) >= localCalendarDayStartMs(new Date());
}
