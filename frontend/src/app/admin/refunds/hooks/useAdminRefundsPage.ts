"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterBookingsBySearch, useOwnerEmailMap } from "@/lib/adminSearchHelpers";
import { ADMIN_NEW_MS } from "@/lib/adminNewUtils";
import {
  isRefundBeforeRental,
  isRefundDuringOrAfterRental,
} from "@/lib/adminBookingFilters";
import type { BookingData } from "@/lib/api/bookings";
import { approveRefundBooking, getAllBookingsForAdmin } from "@/lib/api/bookings";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { acknowledgeCurrentNewRefunds, getUnseenNewRefundCount } from "@/lib/adminAckState";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";

export type RefundTab = "all" | "new" | "pre" | "during";

/**
 * 관리자 환불 뷰: 예약 로드, 환불 대기 탭(전체·신규·계약전·진행중)·검색, 신규 탭 열람 시 ack, 환불 승인.
 */
export function useAdminRefundsPage() {
  const { currentLanguage } = useLanguage();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<RefundTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unseenNew, setUnseenNew] = useState(0);
  const { me: admin } = useAdminMe();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllBookingsForAdmin();
      setBookings(rows);
      setUnseenNew(await getUnseenNewRefundCount());
    } finally {
      setLoading(false);
    }
    refreshAdminBadges();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(["booking", "payment", "adminFinanceLedger"], () => {
    void load();
  });

  const preList = useMemo(() => bookings.filter(isRefundBeforeRental), [bookings]);
  const duringList = useMemo(() => bookings.filter(isRefundDuringOrAfterRental), [bookings]);
  const allList = useMemo(() => [...preList, ...duringList], [preList, duringList]);
  const newList = useMemo(() => {
    const now = Date.now();
    return allList.filter((b) => {
      const t = new Date(b.updatedAt || b.cancelledAt || b.createdAt || 0).getTime();
      return Number.isFinite(t) && now - t < ADMIN_NEW_MS;
    });
  }, [allList]);

  const activeList = tab === "all" ? allList : tab === "new" ? newList : tab === "pre" ? preList : duringList;

  const emailMap = useOwnerEmailMap(bookings);

  const filteredList = useMemo(
    () => filterBookingsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap],
  );

  const emptyMsg = useMemo(() => {
    const lang = currentLanguage;
    if (tab === "all") return getUIText("adminRefundsEmptyAll", lang);
    if (tab === "new") return getUIText("adminRefundsEmptyNew", lang);
    if (tab === "pre") return getUIText("adminRefundsEmptyPre", lang);
    return getUIText("adminRefundsEmptyDuring", lang);
  }, [tab, currentLanguage]);

  useEffect(() => {
    const resetToAll = () => setTab("all");
    window.addEventListener("admin-refunds-reset-tab", resetToAll);
    return () => {
      window.removeEventListener("admin-refunds-reset-tab", resetToAll);
    };
  }, []);

  useEffect(() => {
    if (tab !== "new") return;
    void (async () => {
      await acknowledgeCurrentNewRefunds();
      refreshAdminBadges();
      setUnseenNew(0);
    })();
  }, [tab]);

  const approveRefund = useCallback(
    async (bookingId: string) => {
      if (!admin?.username || !bookingId) return;
      await approveRefundBooking(bookingId, admin.username);
      await load();
    },
    [admin?.username, load],
  );

  return {
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    unseenNew,
    preList,
    duringList,
    allList,
    newList,
    filteredList,
    emailMap,
    emptyMsg,
    approveRefund,
  };
}

export type AdminRefundsPageViewModel = ReturnType<typeof useAdminRefundsPage>;
