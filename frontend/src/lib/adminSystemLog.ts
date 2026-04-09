/**
 * 관리자 시스템 로그 (클라이언트 전용)
 * - info: 기본적으로 메모리만(새로고침 시 소실)
 * - error / warning: localStorage 영구(상한 FIFO)
 */

export type AdminLogSeverity = 'info' | 'warning' | 'error';

export type AdminSystemLogEntry = {
  id: string;
  ts: number;
  severity: AdminLogSeverity;
  message: string;
  category?: string;
  bookingId?: string;
  ownerId?: string;
  /** PII 최소·허용 키만 통과한 요약 스냅샷 */
  snapshot?: Record<string, string>;
};

export const ADMIN_SYSTEM_LOG_STORAGE_KEY = 'stayviet-admin-system-logs-v1';
export const ADMIN_SYSTEM_LOG_EVENT = 'stayviet-admin-system-log';

const MAX_PERSIST = 1000;
const MAX_EPHEMERAL = 300;
const MAX_MESSAGE_LEN = 2000;

const ALLOWED_SNAPSHOT_KEYS = new Set([
  'bookingId',
  'ownerId',
  'checkInDate',
  'checkOutDate',
  'checkInTime',
  'checkOutTime',
  'function',
  'action',
  'httpStatus',
  'step',
]);

let ephemeralLogs: AdminSystemLogEntry[] = [];

function dispatchLogNotify(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMIN_SYSTEM_LOG_EVENT));
    }
  } catch {
    /* ignore */
  }
}

/**
 * 스냅샷에 허용된 키만 문자열로 잘라 넣습니다(PII·용량 최소화).
 */
export function sanitizeAdminLogSnapshot(
  raw: Record<string, unknown> | undefined
): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_SNAPSHOT_KEYS.has(k)) continue;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    out[k] = s.slice(0, 240);
  }
  return Object.keys(out).length ? out : undefined;
}

function readPersistent(): AdminSystemLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_SYSTEM_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is AdminSystemLogEntry =>
        e &&
        typeof e === 'object' &&
        typeof (e as AdminSystemLogEntry).id === 'string' &&
        typeof (e as AdminSystemLogEntry).ts === 'number' &&
        typeof (e as AdminSystemLogEntry).message === 'string'
    );
  } catch {
    return [];
  }
}

function writePersistent(entries: AdminSystemLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_SYSTEM_LOG_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota 등 — 로깅 실패는 무시 */
  }
}

export type LogAdminSystemEventInput = {
  severity: AdminLogSeverity;
  message: string;
  category?: string;
  bookingId?: string;
  ownerId?: string;
  snapshot?: Record<string, unknown>;
  /** info를 영구 저장소에도 남길지 (기본 false) */
  persistInfo?: boolean;
};

/**
 * 로그 기록. 내부에서 예외를 삼켜 호출부가 깨지지 않게 합니다.
 */
export function logAdminSystemEvent(input: LogAdminSystemEventInput): void {
  try {
    if (typeof window === 'undefined') return;

    const entry: AdminSystemLogEntry = {
      id: `lg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      ts: Date.now(),
      severity: input.severity,
      message: String(input.message).slice(0, MAX_MESSAGE_LEN),
      category: input.category?.slice(0, 64),
      bookingId: input.bookingId?.slice(0, 128),
      ownerId: input.ownerId?.slice(0, 128),
      snapshot: sanitizeAdminLogSnapshot(input.snapshot),
    };

    const persist =
      input.severity === 'error' ||
      input.severity === 'warning' ||
      (input.severity === 'info' && input.persistInfo === true);

    if (persist) {
      const next = [entry, ...readPersistent()].slice(0, MAX_PERSIST);
      writePersistent(next);
    } else {
      ephemeralLogs = [entry, ...ephemeralLogs].slice(0, MAX_EPHEMERAL);
    }

    dispatchLogNotify();
  } catch {
    /* ignore */
  }
}

export function getEphemeralAdminLogs(): AdminSystemLogEntry[] {
  return [...ephemeralLogs];
}

export function getPersistentAdminLogs(): AdminSystemLogEntry[] {
  return readPersistent();
}

/** 화면용: 영구 + 휘발 병합, 최신순 */
export function getMergedAdminLogsForView(): AdminSystemLogEntry[] {
  const p = readPersistent();
  const e = [...ephemeralLogs];
  return [...p, ...e].sort((a, b) => b.ts - a.ts);
}

export function clearEphemeralAdminLogs(): void {
  try {
    ephemeralLogs = [];
    dispatchLogNotify();
  } catch {
    /* ignore */
  }
}

export function clearPersistentAdminLogs(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_SYSTEM_LOG_STORAGE_KEY);
    dispatchLogNotify();
  } catch {
    /* ignore */
  }
}

/** RFC 4180 스타일 CSV 필드 이스케이프 */
export function escapeCsvField(value: string): string {
  const s = value == null ? '' : String(value);
  if (/[\r\n",]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportAdminLogsAsCsv(rows: AdminSystemLogEntry[]): string {
  const header = [
    'ts_iso',
    'severity',
    'category',
    'message',
    'bookingId',
    'ownerId',
    'snapshot_json',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    const snapshotJson = r.snapshot ? JSON.stringify(r.snapshot) : '';
    lines.push(
      [
        escapeCsvField(new Date(r.ts).toISOString()),
        escapeCsvField(r.severity),
        escapeCsvField(r.category ?? ''),
        escapeCsvField(r.message),
        escapeCsvField(r.bookingId ?? ''),
        escapeCsvField(r.ownerId ?? ''),
        escapeCsvField(snapshotJson),
      ].join(',')
    );
  }
  return '\uFEFF' + lines.join('\r\n');
}
