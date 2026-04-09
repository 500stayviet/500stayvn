'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ClipboardCopy, Download, Info, Trash2 } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import {
  ADMIN_SYSTEM_LOG_EVENT,
  ADMIN_SYSTEM_LOG_STORAGE_KEY,
  clearEphemeralAdminLogs,
  clearPersistentAdminLogs,
  exportAdminLogsAsCsv,
  getMergedAdminLogsForView,
  type AdminLogSeverity,
  type AdminSystemLogEntry,
} from '@/lib/adminSystemLog';

type LogFilter = 'all' | AdminLogSeverity;

const PAGE_SIZE = 50;

function severityStyle(s: AdminLogSeverity): string {
  switch (s) {
    case 'error':
      return 'text-red-700 bg-red-50';
    case 'warning':
      return 'text-amber-800 bg-amber-50';
    default:
      return 'text-slate-700 bg-slate-100';
  }
}

function formatTime(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

export default function AdminSystemLogPage() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [page, setPage] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onEvt = () => bump();
    window.addEventListener(ADMIN_SYSTEM_LOG_EVENT, onEvt);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_SYSTEM_LOG_STORAGE_KEY) bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_SYSTEM_LOG_EVENT, onEvt);
      window.removeEventListener('storage', onStorage);
    };
  }, [bump]);

  const merged = useMemo(() => getMergedAdminLogsForView(), [tick]);

  const filtered = useMemo(() => {
    if (filter === 'all') return merged;
    return merged.filter((e) => e.severity === filter);
  }, [merged, filter]);

  useEffect(() => {
    setPage(0);
  }, [filter, merged.length]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const downloadCsv = () => {
    const blob = new Blob([exportAdminLogsAsCsv(filtered)], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-system-log_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyRow = async (row: AdminSystemLogEntry) => {
    const text = [
      new Date(row.ts).toISOString(),
      row.severity,
      row.category ?? '',
      row.message,
      row.bookingId ?? '',
      row.ownerId ?? '',
      row.snapshot ? JSON.stringify(row.snapshot) : '',
    ].join('\t');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminRouteGuard>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">시스템 로그</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            브라우저에 기록되는 <strong className="font-medium">클라이언트</strong> 오류·경고입니다.{' '}
            <strong className="font-medium">정보</strong>는 새로고침 시 사라질 수 있습니다. 실제 서버 장애
            모니터링을 대체하지 않습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'error', 'warning', 'info'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'error' ? '오류' : f === 'warning' ? '경고' : '정보'}
            </button>
          ))}
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV 내보내기
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('휘발 로그(정보 등 메모리만 있는 항목)를 비울까요?')) return;
                clearEphemeralAdminLogs();
                bump();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              휘발 로그 비우기
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('영구 저장된 로그(오류·경고)를 모두 삭제할까요?')) return;
                clearPersistentAdminLogs();
                bump();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
              영구 로그 초기화
            </button>
          </span>
        </div>

        <p className="text-xs text-slate-500">
          표시 {filtered.length}건 · 페이지 {safePage + 1}/{pageCount}
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-700">시간</th>
                <th className="px-3 py-2 font-semibold text-slate-700">심각도</th>
                <th className="px-3 py-2 font-semibold text-slate-700">분류</th>
                <th className="px-3 py-2 font-semibold text-slate-700">메시지</th>
                <th className="px-3 py-2 font-semibold text-slate-700">bookingId</th>
                <th className="px-3 py-2 font-semibold text-slate-700">ownerId</th>
                <th className="px-3 py-2 font-semibold text-slate-700">스냅샷</th>
                <th className="px-3 py-2 font-semibold text-slate-700">복사</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    표시할 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600 tabular-nums">
                      {formatTime(row.ts)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${severityStyle(row.severity)}`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td className="max-w-[100px] truncate px-3 py-2 text-slate-700">
                      {row.category ?? '—'}
                    </td>
                    <td className="max-w-md px-3 py-2 text-slate-800">{row.message}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs">
                      {row.bookingId ? (
                        <span className="flex flex-col gap-0.5">
                          <span title={row.bookingId}>{row.bookingId}</span>
                          <Link
                            href="/admin/settlements"
                            className="text-blue-600 hover:underline"
                            title="정산 화면에서 검색창에 ID를 붙여 넣어 검색하세요"
                          >
                            정산
                          </Link>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-slate-600">
                      {row.ownerId ? (
                        <Link
                          href={`/admin/users/${encodeURIComponent(row.ownerId)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.ownerId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-[11px] text-slate-600">
                      {row.snapshot ? JSON.stringify(row.snapshot) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void copyRow(row)}
                        className="inline-flex rounded p-1 text-slate-600 hover:bg-slate-200"
                        title="행 복사"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          예약 ID는 정산·계약 등 화면 상단 검색에 붙여 넣어 찾을 수 있습니다. 분석이 필요하면 CSV를 복사해 AI에
          질문하세요(민감 정보는 넣지 마세요).
        </p>
      </div>
    </AdminRouteGuard>
  );
}
