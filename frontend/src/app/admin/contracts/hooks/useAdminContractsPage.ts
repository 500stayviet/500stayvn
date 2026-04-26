"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterBookingsBySearch, useOwnerEmailMap } from "@/lib/adminSearchHelpers";
import { ADMIN_NEW_MS } from "@/lib/adminNewUtils";
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
} from "@/lib/adminBookingFilters";
import type { BookingData } from "@/lib/api/bookings";
import { getAllBookingsForAdmin } from "@/lib/api/bookings";
import { acknowledgeCurrentNewContracts, getUnseenNewContractCount } from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

export type ContractTab = "new" | "sealed" | "inProgress" | "completed";

/**
 * 관리자 계약 뷰: 전체 예약 로드, 계약 단계 탭(체결/진행/종료)·신규(24h)·검색, 신규 탭 열람 시 ack.
 */
export function useAdminContractsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ContractTab>("sealed");
  const [searchQuery, setSearchQuery] = useState("");
  const [unseenNew, setUnseenNew] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllBookingsForAdmin();
      setBookings(rows);
      setUnseenNew(await getUnseenNewContractCount());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(["booking", "payment", "adminFinanceLedger"], () => {
    void load();
  });

  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") setNowTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const now = useMemo(() => new Date(), [bookings, nowTick]);

  const sealedList = useMemo(
    () => bookings.filter((b) => isContractSealedTab(b, now)),
    [bookings, now],
  );
  const inProgressList = useMemo(
    () => bookings.filter((b) => isContractInProgressTab(b, now)),
    [bookings, now],
  );
  const completedList = useMemo(
    () => bookings.filter((b) => isContractCompletedTab(b, now)),
    [bookings, now],
  );
  const allContractList = useMemo(
    () => [...sealedList, ...inProgressList, ...completedList],
    [sealedList, inProgressList, completedList],
  );
  const newList = useMemo(() => {
    const nowMs = Date.now();
    return allContractList.filter((b) => {
      const t = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return Number.isFinite(t) && nowMs - t < ADMIN_NEW_MS;
    });
  }, [allContractList]);

  const activeList =
    tab === "new"
      ? newList
      : tab === "sealed"
        ? sealedList
        : tab === "inProgress"
          ? inProgressList
          : completedList;

  const emailMap = useOwnerEmailMap(bookings);

  const filteredList = useMemo(
    () => filterBookingsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap],
  );

  const emptyMsg =
    tab === "new"
      ? "신규 계약 건이 없습니다."
      : tab === "sealed"
        ? "계약체결(결제·확정, 숙박 전) 예약이 없습니다."
        : tab === "inProgress"
          ? "계약시작(체크인~체크아웃 진행 중) 예약이 없습니다."
          : "계약종료(체크아웃 이후·이용완료) 예약이 없습니다.";

  useEffect(() => {
    if (tab !== "new") return;
    void (async () => {
      await acknowledgeCurrentNewContracts();
      refreshAdminBadges();
      setUnseenNew(0);
    })();
  }, [tab]);

  return {
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    unseenNew,
    sealedList,
    inProgressList,
    completedList,
    newList,
    filteredList,
    emailMap,
    emptyMsg,
  };
}

export type AdminContractsPageViewModel = ReturnType<typeof useAdminContractsPage>;
