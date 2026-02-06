/**
 * 서버 시각 조회 (정산/임대수익 등 금전 로직용)
 * - GET /api/now 로 서버 현재 시각을 가져와 클라이언트 시계 조작에 영향받지 않도록 함
 * - 실패 시 폴백 금지: 에러를 발생시키고 정산 프로세스 중단
 */

export class ServerTimeSyncError extends Error {
  constructor(message: string = 'Server time sync failed') {
    super(message);
    this.name = 'ServerTimeSyncError';
  }
}

let cached: { timestamp: number; fetchedAt: number } | null = null;
const CACHE_MS = 60 * 1000; // 1분

/**
 * 서버 현재 시각을 Date로 반환.
 * 실패 시 클라이언트 시각을 사용하지 않고 ServerTimeSyncError를 throw.
 */
export async function getServerTime(): Promise<Date> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_MS) {
    const elapsed = now - cached.fetchedAt;
    return new Date(cached.timestamp + elapsed);
  }
  const res = await fetch('/api/now', { cache: 'no-store' });
  if (!res.ok) {
    cached = null;
    throw new ServerTimeSyncError('Server time unavailable');
  }
  const data = await res.json();
  const timestamp = Number(data?.timestamp);
  if (!Number.isFinite(timestamp)) {
    cached = null;
    throw new ServerTimeSyncError('Invalid server timestamp');
  }
  cached = { timestamp, fetchedAt: now };
  return new Date(timestamp);
}

/**
 * 캐시 무시하고 서버 시각만 새로 조회 (실패 시 throw)
 */
export async function getServerTimeFresh(): Promise<Date> {
  cached = null;
  return getServerTime();
}
