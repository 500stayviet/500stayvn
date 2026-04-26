"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  acknowledgeNewUser,
  countUnseenNewUsers,
  fetchUserAcknowledgedAtMap,
  isAdminUserNewUnseen,
} from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminAckHydrationTick } from "@/hooks/useAdminAckHydration";
import { isUserNew, localCalendarDayStartMs, shouldShowUserInAdminNewTab } from "@/lib/adminNewUtils";
import { useAdminMe } from "@/contexts/AdminMeContext";
import type { UserData } from "@/lib/api/auth";
import type { AdminUserFilter } from "@/lib/api/adminModeration";
import { getAdminUsers, setUserBlocked } from "@/lib/api/adminModeration";
import { ensureUsersCacheForAdmin } from "@/lib/api/auth";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

export const ADMIN_USERS_PAGE_SIZE = 20;

/**
 * 관리자 계정 목록: 캐시 기반 조회, 필터·검색, 페이지, 신규 배지, 차단/복구.
 */
export function useAdminUsersPage() {
  const router = useRouter();
  const { me: admin } = useAdminMe();
  const ackTick = useAdminAckHydrationTick();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminUserFilter>("all");
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const [userAckAt, setUserAckAt] = useState<Map<string, Date> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchUserAcknowledgedAtMap().then((m) => {
      if (!cancelled) setUserAckAt(m);
    });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const { rows, nAll, nNew, nActive, nBlocked } = useMemo(() => {
    const all = getAdminUsers(query, "all");
    const newRowsRaw = getAdminUsers(query, "new");
    const newRowsFiltered =
      userAckAt == null ? newRowsRaw : newRowsRaw.filter((u) => shouldShowUserInAdminNewTab(u, userAckAt));
    const activeRows = getAdminUsers(query, "active");
    const blockedRows = getAdminUsers(query, "blocked");
    const selected =
      filter === "new"
        ? newRowsFiltered
        : filter === "active"
          ? activeRows
          : filter === "blocked"
            ? blockedRows
            : all;
    return {
      rows: selected,
      nAll: all.length,
      nNew: newRowsFiltered.length,
      nActive: activeRows.length,
      nBlocked: blockedRows.length,
    };
  }, [query, filter, tick, userAckAt]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_USERS_PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * ADMIN_USERS_PAGE_SIZE, page * ADMIN_USERS_PAGE_SIZE),
    [rows, page],
  );

  const unseenNew = useMemo(
    () => countUnseenNewUsers(userAckAt),
    [tick, filter, ackTick, userAckAt],
  );

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  useAdminDomainRefresh(["user", "lessor_profile"], () => {
    void ensureUsersCacheForAdmin().then((ok) => {
      if (!ok) return;
      setTick((t) => t + 1);
    });
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

  const goToUserDetail = useCallback(
    (uid: string) => {
      router.push(`/admin/users/${encodeURIComponent(uid)}`);
    },
    [router],
  );

  const onRowClick = useCallback(
    (u: UserData) => {
      if (isUserNew(u)) {
        acknowledgeNewUser(u.uid);
        refreshAdminBadges();
      }
      goToUserDetail(u.uid);
    },
    [goToUserDetail],
  );

  const unblockUser = useCallback(
    async (uid: string) => {
      if (!admin?.username) return;
      await setUserBlocked(uid, false, admin.username);
      setTick((v) => v + 1);
      refreshAdminBadges();
    },
    [admin?.username],
  );

  const blockUser = useCallback(
    async (uid: string) => {
      if (!admin?.username) return;
      const reason = window.prompt("차단 사유를 입력하세요.", "관리자 차단") || "관리자 차단";
      await setUserBlocked(uid, true, admin.username, reason);
      setTick((v) => v + 1);
      refreshAdminBadges();
    },
    [admin?.username],
  );

  return {
    admin,
    query,
    setQuery,
    filter,
    setFilter,
    page,
    setPage,
    userAckAt,
    rows,
    pagedRows,
    nAll,
    nNew,
    nActive,
    nBlocked,
    totalPages,
    unseenNew,
    onRowClick,
    unblockUser,
    blockUser,
  };
}

export type AdminUsersPageViewModel = ReturnType<typeof useAdminUsersPage>;
