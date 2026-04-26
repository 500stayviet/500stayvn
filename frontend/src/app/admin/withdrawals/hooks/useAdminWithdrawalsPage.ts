"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminMe } from "@/contexts/AdminMeContext";
import {
  actAdminWithdrawal,
  getAdminWithdrawalRequests,
  type ServerWithdrawalRequest,
} from "@/lib/api/financeServer";
import { filterWithdrawalsBySearch, useOwnerEmailMap } from "@/lib/adminSearchHelpers";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

export type WithdrawalTab = "pending" | "processing" | "completed" | "rejected" | "held";

/** 서버 `approved` → UI 탭 `processing`과 동일 취급 */
function normalizeStatus(s: ServerWithdrawalRequest["status"]) {
  if (s === "approved") return "processing" as const;
  return s;
}

/**
 * 관리자 출금 요청: 목록 로드, 탭·검색, 승인·반려·보류·완료·재개.
 */
export function useAdminWithdrawalsPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ServerWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<WithdrawalTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const { me: admin } = useAdminMe();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getAdminWithdrawalRequests());
    } finally {
      setLoading(false);
      refreshAdminBadges();
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").trim();
    if (tabParam === "processing") {
      setTab("processing");
    } else if (tabParam === "pending") {
      setTab("pending");
    } else if (tabParam === "rejected") {
      setTab("rejected");
    } else if (tabParam === "completed") {
      setTab("completed");
    } else if (tabParam === "held") {
      setTab("held");
    }
  }, [searchParams]);

  useAdminDomainRefresh(
    ["booking", "payment", "adminWithdrawalRequest", "adminFinanceLedger", "admin_bank_account"],
    () => {
      void load();
    },
  );

  const pending = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "pending"),
    [rows],
  );
  const processing = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "processing"),
    [rows],
  );
  const held = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "held"),
    [rows],
  );
  const completed = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "completed"),
    [rows],
  );
  const rejected = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "rejected"),
    [rows],
  );

  const activeList = useMemo(() => {
    if (tab === "pending") return pending;
    if (tab === "processing") return processing;
    if (tab === "rejected") return rejected;
    if (tab === "completed") return completed;
    return held;
  }, [tab, pending, processing, rejected, completed, held]);

  const emailMap = useOwnerEmailMap(rows);

  const filteredList = useMemo(
    () => filterWithdrawalsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap],
  );

  const emptyMsg =
    tab === "pending"
      ? "승인 대기 건이 없습니다."
      : tab === "processing"
        ? "처리 중인 출금이 없습니다."
        : tab === "completed"
          ? "완료된 출금 내역이 없습니다."
          : tab === "rejected"
            ? "반려된 출금 내역이 없습니다."
            : "보류된 출금이 없습니다.";

  /**
   * 출금 상태 변경 후 성공 시에만 목록을 다시 불러온다.
   */
  const runWithdrawalAction = useCallback(
    async (fn: () => Promise<boolean>) => {
      const ok = await fn();
      if (ok) void load();
    },
    [load],
  );

  const patchWithdrawal = useCallback(
    (
      id: string,
      action: Parameters<typeof actAdminWithdrawal>[1],
      reason?: string,
    ) => {
      if (!admin?.username) {
        return Promise.resolve(false);
      }
      return actAdminWithdrawal(id, action, reason);
    },
    [admin?.username],
  );

  return {
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    pending,
    processing,
    held,
    completed,
    rejected,
    filteredList,
    emptyMsg,
    emailMap,
    normalizeStatus,
    runWithdrawalAction,
    patchWithdrawal,
  };
}

export type AdminWithdrawalsPageViewModel = ReturnType<typeof useAdminWithdrawalsPage>;
