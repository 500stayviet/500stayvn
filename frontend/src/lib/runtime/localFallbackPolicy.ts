/**
 * 운영 모드에서 LocalStorage fallback 제어:
 * - default/undefined: readwrite
 * - readonly: 읽기만 허용, 쓰기는 차단
 * - off: 읽기/쓰기 모두 차단 (서버 API 원장만 사용)
 */
export type LocalFallbackMode = 'readwrite' | 'readonly' | 'off';

export function getLocalFallbackMode(): LocalFallbackMode {
  const raw = (process.env.NEXT_PUBLIC_LOCAL_FALLBACK_MODE || '').trim().toLowerCase();
  if (raw === 'off') return 'off';
  if (raw === 'readonly') return 'readonly';
  return 'readwrite';
}

export function canReadLocalFallback(): boolean {
  return getLocalFallbackMode() !== 'off';
}

export function canWriteLocalFallback(): boolean {
  return getLocalFallbackMode() === 'readwrite';
}
