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

export function isUserNew(u: Pick<UserData, 'createdAt' | 'deleted'>): boolean {
  if (u.deleted) return false;
  const t = parseAnyDate(u.createdAt);
  if (t <= 0) return false;
  return Date.now() - t < ADMIN_NEW_MS;
}

export function isPropertyNew(p: PropertyData): boolean {
  if (p.deleted) return false;
  const c = parseAnyDate(p.createdAt);
  if (c > 0 && Date.now() - c < ADMIN_NEW_MS) return true;
  const u = parseAnyDate(p.updatedAt);
  if (c <= 0 && u > 0 && Date.now() - u < ADMIN_NEW_MS) return true;
  return false;
}
