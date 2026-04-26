"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeNewProperty, countUnseenNewProperties, isAdminPropertyNewUnseen } from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminAckHydrationTick } from "@/hooks/useAdminAckHydration";
import { isPropertyNew, localCalendarDayStartMs } from "@/lib/adminNewUtils";
import { useAdminMe } from "@/contexts/AdminMeContext";
import type { AdminInventoryFilter } from "@/lib/api/properties";
import { loadAdminInventoryPage, ensurePropertiesCacheForAdmin } from "@/lib/api/properties";
import { ensureUsersCacheForAdmin } from "@/lib/api/auth";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { setPropertyHidden } from "@/lib/api/adminModeration";
import type { PropertyData } from "@/types/property";

export const ADMIN_PROPERTIES_PAGE_SIZE = 20;

export const PROPERTY_HIDDEN_REASON = "법규를 위반했으니 관리자에게 문의 하시기 바랍니다";
export const OWNER_BLOCKED_RESTORE_MESSAGE = "계정이 차단되어 있어 매물 숨김을 해제할 수 없습니다.";

/**
 * 관리자 매물 목록: `loadAdminInventoryPage`, 필터·검색, 페이징, 숨김/복구.
 */
export function useAdminPropertiesPage() {
  const router = useRouter();
  const { me: admin } = useAdminMe();
  const ackTick = useAdminAckHydrationTick();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminInventoryFilter>("all");
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PropertyData[]>([]);
  const [nAll, setNAll] = useState(0);
  const [nNew, setNNew] = useState(0);
  const [nListed, setNListed] = useState(0);
  const [nPaused, setNPaused] = useState(0);
  const [nHidden, setNHidden] = useState(0);
  const [loading, setLoading] = useState(true);
  const [propertyAckAt, setPropertyAckAt] = useState<Map<string, Date> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await loadAdminInventoryPage(query, filter);
        if (cancelled) return;
        setRows(res.rows);
        setNAll(res.nAll);
        setNNew(res.nNew);
        setNListed(res.nListed);
        setNPaused(res.nPaused);
        setNHidden(res.nHidden);
        setPropertyAckAt(res.propertyAckAt);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, filter, tick]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_PROPERTIES_PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * ADMIN_PROPERTIES_PAGE_SIZE, page * ADMIN_PROPERTIES_PAGE_SIZE),
    [rows, page],
  );

  const unseenNew = useMemo(
    () => countUnseenNewProperties(propertyAckAt),
    [tick, filter, ackTick, propertyAckAt],
  );

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  useAdminDomainRefresh(["property", "user"], () => {
    void Promise.all([ensureUsersCacheForAdmin(), ensurePropertiesCacheForAdmin()]).then(() =>
      setTick((t) => t + 1),
    );
  });

  useEffect(() => {
    let dayMs = localCalendarDayStartMs(new Date());
    const id = window.setInterval(() => {
      const next = localCalendarDayStartMs(new Date());
      if (next !== dayMs) {
        dayMs = next;
        setTick((t) => t + 1);
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const onRowClick = useCallback(
    (p: PropertyData) => {
      if (!p.id) return;
      if (isPropertyNew(p)) {
        acknowledgeNewProperty(p.id);
        refreshAdminBadges();
      }
      router.push(`/admin/properties/${encodeURIComponent(p.id)}`);
    },
    [router],
  );

  const unhideProperty = useCallback(
    (p: PropertyData) => {
      if (!admin?.username || !p.id) return;
      const ok = setPropertyHidden(p.id, false, admin.username);
      if (!ok) {
        window.alert(OWNER_BLOCKED_RESTORE_MESSAGE);
        return;
      }
      setTick((v) => v + 1);
      refreshAdminBadges();
    },
    [admin?.username],
  );

  const hideProperty = useCallback(
    (p: PropertyData) => {
      if (!admin?.username || !p.id) return;
      setPropertyHidden(p.id, true, admin.username, PROPERTY_HIDDEN_REASON);
      setTick((v) => v + 1);
      refreshAdminBadges();
    },
    [admin?.username],
  );

  return {
    query,
    setQuery,
    filter,
    setFilter,
    page,
    setPage,
    rows,
    loading,
    nAll,
    nNew,
    nListed,
    nPaused,
    nHidden,
    totalPages,
    pagedRows,
    propertyAckAt,
    unseenNew,
    onRowClick,
    unhideProperty,
    hideProperty,
  };
}

export type AdminPropertiesPageViewModel = ReturnType<typeof useAdminPropertiesPage>;
