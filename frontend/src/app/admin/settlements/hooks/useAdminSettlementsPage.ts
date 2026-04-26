"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  acknowledgeCurrentSettlementPending,
  acknowledgeCurrentSettlementRequest,
  getUnseenSettlementPendingCount,
  getUnseenSettlementRequestCount,
} from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { getSettlementCandidates, type SettlementCandidate } from "@/lib/api/adminFinance";
import { logAdminSystemEvent } from "@/lib/adminSystemLog";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { filterSettlementsBySearch, useOwnerEmailMap } from "@/lib/adminSearchHelpers";
import { getPayableAfterMoment } from "@/lib/utils/rentalIncome";

export type SettlementTab = "request" | "pending" | "approved" | "held";
export type SettlementListMode = "remaining-asc" | "remaining-desc" | "elapsed-24h";

/** 체크아웃+24h(=지급 가능 시각)까지 남은 ms (음수 = 이미 경과). 날짜/시각 무효 시 NaN */
function remainingMsUntilPayableAfter(row: SettlementCandidate, now: Date): number {
  const payableAfter = getPayableAfterMoment(
    row.checkOutDate,
    (row.checkOutTime ?? "12:00").trim() || "12:00",
  );
  const t = payableAfter.getTime();
  const n = now.getTime();
  if (!Number.isFinite(t) || !Number.isFinite(n)) return Number.NaN;
  return t - n;
}

/**
 * 관리자 정산 승인: 후보 로드, 탭·검색·정렬, 배지(미열람) 처리.
 */
export function useAdminSettlementsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<SettlementCandidate[]>([]);
  const [queueVersion, setQueueVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<SettlementTab>("request");
  const [searchQuery, setSearchQuery] = useState("");
  const [listMode, setListMode] = useState<SettlementListMode>("remaining-asc");
  const [unseenRequest, setUnseenRequest] = useState(0);
  const [unseenPending, setUnseenPending] = useState(0);
  const { me: admin } = useAdminMe();
  const actionGuardRef = useRef<Set<string>>(new Set());

  const runBookingAction = useCallback((bookingId: string, fn: () => Promise<void> | void) => {
    if (actionGuardRef.current.has(bookingId)) return;
    actionGuardRef.current.add(bookingId);
    void Promise.resolve(fn()).finally(() => {
      actionGuardRef.current.delete(bookingId);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getSettlementCandidates();
      setItems(rows);
      setUnseenRequest(await getUnseenSettlementRequestCount());
      setUnseenPending(await getUnseenSettlementPendingCount());
    } catch (e) {
      logAdminSystemEvent({
        severity: "error",
        category: "settlement",
        message: e instanceof Error ? e.message : "정산 후보 목록을 불러오지 못했습니다.",
        snapshot: { function: "useAdminSettlementsPage.load" },
      });
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
    if (tabParam === "request") {
      setTab("request");
    } else if (tabParam === "pending") {
      setTab("pending");
    } else if (tabParam === "approved") {
      setTab("approved");
    } else if (tabParam === "held") {
      setTab("held");
    }
  }, [searchParams]);

  useAdminDomainRefresh(["booking", "payment", "adminFinanceLedger"], () => {
    void load();
  });

  const [urgencyTick, setUrgencyTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setUrgencyTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (tab !== "request") return;
    void acknowledgeCurrentSettlementRequest().then(() => {
      setUnseenRequest(0);
      refreshAdminBadges();
    });
  }, [tab]);

  useEffect(() => {
    if (tab !== "pending") return;
    void acknowledgeCurrentSettlementPending().then(() => {
      setUnseenPending(0);
      refreshAdminBadges();
    });
  }, [tab]);

  const { requestList, needApproval } = useMemo(() => {
    const request: SettlementCandidate[] = [];
    const pending: SettlementCandidate[] = [];
    for (const i of items) {
      if (i.approvalStatus !== null) continue;
      if ((i as SettlementCandidate & { inPendingQueue?: boolean }).inPendingQueue) pending.push(i);
      else request.push(i);
    }
    void queueVersion;
    return { requestList: request, needApproval: pending };
  }, [items, queueVersion]);

  const approvedActive = useMemo(
    () => items.filter((i) => i.approvalStatus === "approved"),
    [items],
  );
  const heldRows = useMemo(() => items.filter((i) => i.approvalStatus === "held"), [items]);

  const activeList = useMemo(() => {
    if (tab === "request") return requestList;
    if (tab === "pending") return needApproval;
    if (tab === "approved") return approvedActive;
    return heldRows;
  }, [tab, requestList, needApproval, approvedActive, heldRows]);

  const emailMap = useOwnerEmailMap(items);

  const filteredList = useMemo(
    () => filterSettlementsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap],
  );

  const nowForUrgency = useMemo(() => {
    void items;
    void urgencyTick;
    return new Date();
  }, [items, urgencyTick]);

  const displayList = useMemo(() => {
    if (tab !== "request" && tab !== "pending") return filteredList;
    const only24Plus = listMode === "elapsed-24h";
    const remainingSort = listMode === "remaining-desc" ? "desc" : "asc";
    const decorated = filteredList.map((row) => ({
      row,
      remaining: remainingMsUntilPayableAfter(row, nowForUrgency),
    }));
    const work = only24Plus
      ? decorated.filter((d) => Number.isFinite(d.remaining) && d.remaining <= 0)
      : decorated;
    work.sort((a, b) => {
      const af = Number.isFinite(a.remaining);
      const bf = Number.isFinite(b.remaining);
      if (!af && !bf) return 0;
      if (!af) return 1;
      if (!bf) return -1;
      return remainingSort === "asc" ? a.remaining - b.remaining : b.remaining - a.remaining;
    });
    return work.map((d) => d.row);
  }, [filteredList, tab, listMode, nowForUrgency]);

  const emptyMsg =
    tab === "request"
      ? "승인 요청 정산 건이 없습니다. (체크아웃 이후·계약종료와 동일 시점에 표시됩니다.)"
      : tab === "pending"
        ? "승인 대기 정산 건이 없습니다."
        : tab === "approved"
          ? "승인 완료(활성) 건이 없습니다."
          : "보류 중인 정산 건이 없습니다.";

  const listEmptyMsg =
    displayList.length === 0 && (tab === "request" || tab === "pending") && filteredList.length > 0
      ? "검색·정렬·필터 조건에 맞는 건이 없습니다."
      : emptyMsg;

  const bumpQueue = () => setQueueVersion((v) => v + 1);

  return {
    admin,
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    listMode,
    setListMode,
    runBookingAction,
    bumpQueue,
    requestList,
    needApproval,
    approvedActive,
    heldRows,
    displayList,
    filteredList,
    emptyMsg,
    listEmptyMsg,
    emailMap,
    unseenRequest,
    unseenPending,
  };
}

export type AdminSettlementsPageViewModel = ReturnType<typeof useAdminSettlementsPage>;
