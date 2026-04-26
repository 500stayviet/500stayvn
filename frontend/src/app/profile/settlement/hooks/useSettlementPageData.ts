"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOwnerBookings } from "@/lib/api/bookings";
import { getProperty } from "@/lib/api/properties";
import { getServerTime, ServerTimeSyncError } from "@/lib/api/serverTime";
import {
  toISO8601ForAudit,
  getCheckInMoment,
  getCheckOutMoment,
  getPayableAfterMoment,
  getRentalIncomeStatus,
  getRentalIncomeAmount,
  isEligibleForRentalIncome,
  aggregateRentalIncome,
} from "@/lib/utils/rentalIncome";
import { recordSettlementAudit } from "@/lib/utils/settlementAuditLog";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { getAppSettlementOverlay } from "@/lib/api/financeServer";
import type {
  ServerOwnerBalances,
  ServerBankAccount as BankAccount,
  ServerWithdrawalRequest as WithdrawalRequest,
} from "@/lib/api/financeServer";
import { getBankProvider } from "@/lib/providers/currentProviders";
import type { TabType, RevenueEntry } from "../types";

/**
 * 정산·지갑 — 수익 행·금융 패널 상태 (데이터 레이어).
 * `getAppSettlementOverlay`·`getOwnerBookings` 하이드레이션은 기존 `unwrapAppApiData` 경로 유지.
 */
export function useSettlementPageData() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("revenue");
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [serverTimeError, setServerTimeError] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [ownerBalances, setOwnerBalances] = useState<ServerOwnerBalances>({
    totalApprovedRevenue: 0,
    pendingWithdrawal: 0,
    availableBalance: 0,
  });
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState("");
  const [setAsPrimaryOnCreate, setSetAsPrimaryOnCreate] = useState(true);
  const [revenueTick, setRevenueTick] = useState(0);
  const bankProvider = getBankProvider();

  useAdminDomainRefresh(["booking"], () => {
    setRevenueTick((t) => t + 1);
  });

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setRevenueTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setRevenueEntries([]);
      setRevenueLoading(false);
      setServerTimeError(false);
      return;
    }
    let cancelled = false;
    setRevenueLoading(true);
    setServerTimeError(false);
    void (async () => {
      try {
        const [bookings, now, settlementOverlay] = await Promise.all([
          getOwnerBookings(user.uid),
          getServerTime(),
          getAppSettlementOverlay(),
        ]);
        if (cancelled) return;
        const serverTimeISO = toISO8601ForAudit(now);
        const serverTimeMs = now.getTime();
        const overlayByBookingId = new Map(
          settlementOverlay.map((o) => [o.bookingId, o] as const),
        );

        const eligible = bookings.filter((b) =>
          isEligibleForRentalIncome({
            paymentStatus: b.paymentStatus ?? "pending",
            status: b.status ?? "pending",
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            checkInTime: b.checkInTime ?? "14:00",
            checkOutTime: b.checkOutTime ?? "12:00",
            now,
          }),
        );
        const entries: RevenueEntry[] = [];
        for (const b of eligible) {
          const status = getRentalIncomeStatus(
            b.checkInDate,
            b.checkOutDate,
            b.checkInTime ?? "14:00",
            b.checkOutTime ?? "12:00",
            now,
          );
          if (status === null) continue;
          const checkIn = getCheckInMoment(b.checkInDate, b.checkInTime ?? "14:00");
          const checkOut = getCheckOutMoment(b.checkOutDate, b.checkOutTime ?? "12:00");
          const payableAfter = getPayableAfterMoment(b.checkOutDate, b.checkOutTime ?? "12:00");
          recordSettlementAudit({
            serverTimeISO,
            serverTimeMs,
            bookingId: b.id ?? "",
            status,
            checkInISO: toISO8601ForAudit(checkIn),
            checkOutISO: toISO8601ForAudit(checkOut),
            payableAfterISO: toISO8601ForAudit(payableAfter),
          });
          let propertyName = b.propertyTitle ?? "";
          try {
            const prop = await getProperty(b.propertyId);
            if (prop?.title) propertyName = prop.title;
          } catch {
            /* propertyTitle 폴백 유지 */
          }
          const bid = b.id ?? "";
          const ov = overlayByBookingId.get(bid);
          const st = ov?.approvalStatus as "approved" | "held" | undefined;
          const settlementHeld = st === "held";
          const settlementApproved = st === "approved";
          const settlementInAdminQueue =
            !settlementHeld && !settlementApproved && Boolean(ov?.inPendingQueue);
          const checkOutMoment = getCheckOutMoment(b.checkOutDate, b.checkOutTime ?? "12:00");
          const cot = checkOutMoment.getTime();
          const afterCheckOut =
            Number.isFinite(cot) && Number.isFinite(now.getTime()) && now.getTime() >= cot;

          entries.push({
            bookingId: bid,
            propertyName,
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            checkInTime: b.checkInTime ?? "14:00",
            checkOutTime: b.checkOutTime ?? "12:00",
            amount: getRentalIncomeAmount(b),
            status,
            settlementHeld,
            settlementApproved,
            settlementInAdminQueue,
            afterCheckOut,
          });
        }
        if (!cancelled) setRevenueEntries(entries);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ServerTimeSyncError) {
          setServerTimeError(true);
          setRevenueEntries([]);
        }
      } finally {
        if (!cancelled) setRevenueLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, revenueTick]);

  const { totalRevenue } = useMemo(() => aggregateRentalIncome(revenueEntries), [revenueEntries]);
  const availableBalance = ownerBalances.availableBalance;
  const withdrawalPendingAmount = ownerBalances.pendingWithdrawal;

  const refreshFinanceData = async () => {
    if (!user?.uid) return;
    const accounts = await bankProvider.getBankAccounts();
    const withdrawals = (await bankProvider.getWithdrawalRequests()).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
    const balances = await bankProvider.getOwnerBalances();
    setBankAccounts(accounts);
    setWithdrawalHistory(withdrawals);
    setOwnerBalances(balances);
    setSelectedBankId((prev) => {
      if (prev) return prev;
      const primary = accounts.find((a) => a.isPrimary);
      return primary ? primary.id : "";
    });
  };

  useEffect(() => {
    void refreshFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    activeTab,
    setActiveTab,
    revenueEntries,
    revenueLoading,
    serverTimeError,
    totalRevenue,
    availableBalance,
    withdrawalPendingAmount,
    withdrawalAmount,
    setWithdrawalAmount,
    selectedBankId,
    setSelectedBankId,
    bankAccounts,
    withdrawalHistory,
    newBankName,
    setNewBankName,
    newAccountNumber,
    setNewAccountNumber,
    newAccountHolder,
    setNewAccountHolder,
    setAsPrimaryOnCreate,
    setSetAsPrimaryOnCreate,
    bankProvider,
    refreshFinanceData,
  };
}

export type SettlementPageData = ReturnType<typeof useSettlementPageData>;
