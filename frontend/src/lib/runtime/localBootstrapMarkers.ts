import { canWriteLocalFallback } from '@/lib/runtime/localFallbackPolicy';

/**
 * `NEXT_PUBLIC_LOCAL_FALLBACK_MODE=readonly|off` 일 때 localStorage 에 플래그를 못 쓰면
 * 동일 탭에서 중복 import/bootstrap 루프를 막기 위해 sessionStorage 를 사용합니다.
 * (세션 표식은 원장이 아니라 UX/플로우용입니다.)
 */
export function markLedgerBootstrapDone(localKey: string, sessionKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (canWriteLocalFallback()) {
      localStorage.setItem(localKey, '1');
    } else {
      sessionStorage.setItem(sessionKey, '1');
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function isLedgerBootstrapDone(localKey: string, sessionKey: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (localStorage.getItem(localKey)) return true;
    if (sessionStorage.getItem(sessionKey)) return true;
  } catch {
    /* ignore */
  }
  return false;
}
