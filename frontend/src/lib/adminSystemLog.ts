import { canWriteLocalFallback } from '@/lib/runtime/localFallbackPolicy';

/**
 * 관리자 시스템 로그
 * - info: 기본적으로 메모리만(새로고침 시 소실)
 * - error / warning / persistInfo: 서버 DB 저장 후 메모리 캐시에 반영(상한 FIFO)
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

/** 예전 LS 키 — 성공적으로 서버에서 불러온 뒤 한 번 비웁니다(용량·혼선 방지). */
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
/** 서버에서 받은 최근 목록(최신이 앞). null = 아직 로드 전 */
let persistentLogsCache: AdminSystemLogEntry[] | null = null;
let systemLogsLoadInFlight: Promise<void> | null = null;

function dispatchLogNotify(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMIN_SYSTEM_LOG_EVENT));
    }
  } catch {
    /* ignore */
  }
}

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

function parseSnapshotJson(raw: unknown): Record<string, string> | undefined {
  let o: Record<string, unknown> | null = null;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) o = raw as Record<string, unknown>;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (p && typeof p === 'object' && !Array.isArray(p)) o = p as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  if (!o) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') out[k] = v.slice(0, 240);
    else out[k] = JSON.stringify(v).slice(0, 240);
  }
  return Object.keys(out).length ? out : undefined;
}

function mapServerRowToEntry(raw: unknown): AdminSystemLogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  if (!id) return null;
  let ts: number;
  if (typeof r.ts === 'number') ts = r.ts;
  else if (typeof r.ts === 'string') ts = new Date(r.ts).getTime();
  else if (r.ts instanceof Date) ts = r.ts.getTime();
  else return null;
  if (!Number.isFinite(ts)) return null;
  const sev = r.severity;
  if (sev !== 'info' && sev !== 'warning' && sev !== 'error') return null;
  const message = typeof r.message === 'string' ? r.message : '';
  if (!message) return null;
  return {
    id,
    ts,
    severity: sev,
    message,
    category: typeof r.category === 'string' ? r.category : undefined,
    bookingId: typeof r.bookingId === 'string' ? r.bookingId : undefined,
    ownerId: typeof r.ownerId === 'string' ? r.ownerId : undefined,
    snapshot: parseSnapshotJson(r.snapshotJson),
  };
}

function stripLegacyLocalStorageLogs(): void {
  if (typeof window === 'undefined' || !canWriteLocalFallback()) return;
  try {
    localStorage.removeItem(ADMIN_SYSTEM_LOG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function fetchSystemLogsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const r = await fetch('/api/admin/system-logs?limit=1000', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!r.ok) return;
    const j = (await r.json()) as { rows?: unknown[] };
    const rows = Array.isArray(j.rows) ? j.rows : [];
    const mapped = rows
      .map(mapServerRowToEntry)
      .filter((x): x is AdminSystemLogEntry => x != null);
    persistentLogsCache = mapped;
    stripLegacyLocalStorageLogs();
    dispatchLogNotify();
  } catch {
    /* ignore */
  }
}

/** 서버에서 영구 로그를 불러와 캐시합니다. 동시 호출은 한 요청으로 합칩니다. */
export async function ensureAdminSystemLogsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (systemLogsLoadInFlight) return systemLogsLoadInFlight;
  systemLogsLoadInFlight = fetchSystemLogsFromServer().finally(() => {
    systemLogsLoadInFlight = null;
  });
  return systemLogsLoadInFlight;
}

/** 서버에 새 로그가 생긴 뒤 목록을 다시 맞출 때 (SSE 도메인 이벤트 등) */
export async function forceReloadAdminSystemLogsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  persistentLogsCache = null;
  if (systemLogsLoadInFlight) await systemLogsLoadInFlight;
  systemLogsLoadInFlight = null;
  await fetchSystemLogsFromServer();
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

export function logAdminSystemEvent(input: LogAdminSystemEventInput): void {
  try {
    if (typeof window === 'undefined') return;

    const persist =
      input.severity === 'error' ||
      input.severity === 'warning' ||
      (input.severity === 'info' && input.persistInfo === true);

    const baseMessage = String(input.message).slice(0, MAX_MESSAGE_LEN);
    const snapshot = sanitizeAdminLogSnapshot(input.snapshot);

    if (persist) {
      void (async () => {
        const fallbackEntry: AdminSystemLogEntry = {
          id: `lg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          ts: Date.now(),
          severity: input.severity,
          message: baseMessage,
          category: input.category?.slice(0, 64),
          bookingId: input.bookingId?.slice(0, 128),
          ownerId: input.ownerId?.slice(0, 128),
          snapshot,
        };
        try {
          const res = await fetch('/api/admin/system-logs', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              severity: input.severity,
              message: baseMessage,
              category: input.category?.slice(0, 64),
              bookingId: input.bookingId?.slice(0, 128),
              ownerId: input.ownerId?.slice(0, 128),
              snapshot,
            }),
          });
          if (!res.ok) throw new Error('post_failed');
          const mapped = mapServerRowToEntry(await res.json());
          if (!mapped) throw new Error('invalid_row');
          persistentLogsCache = [mapped, ...(persistentLogsCache ?? [])].slice(0, MAX_PERSIST);
          dispatchLogNotify();
        } catch {
          ephemeralLogs = [fallbackEntry, ...ephemeralLogs].slice(0, MAX_EPHEMERAL);
          dispatchLogNotify();
        }
      })();
      return;
    }

    const entry: AdminSystemLogEntry = {
      id: `lg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      ts: Date.now(),
      severity: input.severity,
      message: baseMessage,
      category: input.category?.slice(0, 64),
      bookingId: input.bookingId?.slice(0, 128),
      ownerId: input.ownerId?.slice(0, 128),
      snapshot,
    };
    ephemeralLogs = [entry, ...ephemeralLogs].slice(0, MAX_EPHEMERAL);
    dispatchLogNotify();
  } catch {
    /* ignore */
  }
}

export function getEphemeralAdminLogs(): AdminSystemLogEntry[] {
  return [...ephemeralLogs];
}

export function getPersistentAdminLogs(): AdminSystemLogEntry[] {
  return persistentLogsCache ?? [];
}

/** 화면용: 영구(서버 캐시) + 휘발 병합, 최신순 */
export function getMergedAdminLogsForView(): AdminSystemLogEntry[] {
  const p = persistentLogsCache ?? [];
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
    persistentLogsCache = [];
    stripLegacyLocalStorageLogs();
    dispatchLogNotify();
    void fetch('/api/admin/system-logs', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}

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
