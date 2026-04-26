"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  acknowledgeCurrentNewSystemLogs,
  getUnseenNewSystemLogCount,
} from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import {
  ADMIN_SYSTEM_LOG_EVENT,
  clearEphemeralAdminLogs,
  clearPersistentAdminLogs,
  ensureAdminSystemLogsLoaded,
  exportAdminLogsAsCsv,
  forceReloadAdminSystemLogsFromServer,
  getMergedAdminLogsForView,
  type AdminSystemLogEntry,
} from "@/lib/adminSystemLog";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

export const ADMIN_SYSTEM_LOG_PAGE_SIZE = 50;

export type AdminSystemLogFilter = "new" | "all" | "error" | "warning" | "info";

/**
 * 시스템 로그: 병합 목록, 필터(신규/심각도), 페이징, CSV, 클리어, 도메인 갱신.
 */
export function useAdminSystemLogPage() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<AdminSystemLogFilter>("all");
  const [page, setPage] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useAdminDomainRefresh(["system_log"], () => {
    void forceReloadAdminSystemLogsFromServer().then(() => bump());
  });

  useEffect(() => {
    let alive = true;
    void ensureAdminSystemLogsLoaded().then(() => {
      if (alive) bump();
    });
    const onEvt = () => bump();
    window.addEventListener(ADMIN_SYSTEM_LOG_EVENT, onEvt);
    return () => {
      alive = false;
      window.removeEventListener(ADMIN_SYSTEM_LOG_EVENT, onEvt);
    };
  }, [bump]);

  const merged = useMemo(() => {
    void tick;
    return getMergedAdminLogsForView();
  }, [tick]);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const newRows = useMemo(
    () => merged.filter((e) => Number.isFinite(e.ts) && e.ts >= dayAgo),
    [merged, dayAgo],
  );
  const unseenNew = useMemo(() => {
    void tick;
    void filter;
    return getUnseenNewSystemLogCount();
  }, [tick, filter]);

  const filtered = useMemo(() => {
    if (filter === "new") return newRows;
    if (filter === "all") return merged;
    return merged.filter((e) => e.severity === filter);
  }, [merged, newRows, filter]);

  useEffect(() => {
    if (filter !== "new") return;
    acknowledgeCurrentNewSystemLogs();
    refreshAdminBadges();
    setTick((t) => t + 1);
  }, [filter]);

  useEffect(() => {
    setPage(0);
  }, [filter, merged.length]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ADMIN_SYSTEM_LOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * ADMIN_SYSTEM_LOG_PAGE_SIZE,
    safePage * ADMIN_SYSTEM_LOG_PAGE_SIZE + ADMIN_SYSTEM_LOG_PAGE_SIZE,
  );

  const downloadCsv = useCallback(() => {
    const blob = new Blob([exportAdminLogsAsCsv(filtered)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-system-log_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const copyRow = useCallback(async (row: AdminSystemLogEntry) => {
    const text = [
      new Date(row.ts).toISOString(),
      row.severity,
      row.category ?? "",
      row.message,
      row.bookingId ?? "",
      row.ownerId ?? "",
      row.snapshot ? JSON.stringify(row.snapshot) : "",
    ].join("\t");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, []);

  const clearEphemeral = useCallback(() => {
    if (!window.confirm("휘발 로그(정보 등 메모리만 있는 항목)를 비울까요?")) return;
    clearEphemeralAdminLogs();
    bump();
  }, [bump]);

  const clearPersistent = useCallback(() => {
    if (!window.confirm("영구 저장된 로그(오류·경고)를 모두 삭제할까요?")) return;
    clearPersistentAdminLogs();
    bump();
  }, [bump]);

  return {
    filter,
    setFilter,
    page,
    setPage,
    filtered,
    pageRows,
    pageCount,
    safePage,
    unseenNew,
    downloadCsv,
    copyRow,
    clearEphemeral,
    clearPersistent,
  };
}

export type AdminSystemLogPageViewModel = ReturnType<typeof useAdminSystemLogPage>;
