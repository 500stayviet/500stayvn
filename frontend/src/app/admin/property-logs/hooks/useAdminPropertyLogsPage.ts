"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import {
  ensureAdminPropertyActionLogsLoaded,
  getAdminPropertyActionLogsCached,
  invalidateAdminPropertyActionLogsCache,
} from "@/lib/api/adminPropertyActionLogs";
import type { PropertyActionType } from "@/lib/api/adminPropertyActionLogs";

/**
 * 관리자 매물 삭제/취소 로그: 캐시 로드, 탭 필터, 도메인 갱신 시 재동기화.
 */
export function useAdminPropertyLogsPage() {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<PropertyActionType | "ALL">("ALL");

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    void ensureAdminPropertyActionLogsLoaded().then(() => {
      if (alive) bump();
    });
    return () => {
      alive = false;
    };
  }, [bump]);

  useAdminDomainRefresh(["property"], () => {
    invalidateAdminPropertyActionLogsCache();
    void ensureAdminPropertyActionLogsLoaded().then(() => bump());
  });

  const rows = useMemo(() => {
    void tick;
    const all = getAdminPropertyActionLogsCached();
    if (tab === "ALL") return all;
    return all.filter((r) => r.actionType === tab);
  }, [tick, tab]);

  const refresh = useCallback(() => {
    invalidateAdminPropertyActionLogsCache();
    void ensureAdminPropertyActionLogsLoaded().then(() => bump());
  }, [bump]);

  return {
    tab,
    setTab,
    rows,
    refresh,
  };
}

export type AdminPropertyLogsPageViewModel = ReturnType<typeof useAdminPropertyLogsPage>;
