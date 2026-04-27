"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllKYCUsers, downloadAllKYCData, type KYCUserData } from "@/lib/api/admin";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { acknowledgeCurrentNewKyc, getUnseenNewKycCount } from "@/lib/adminAckState";
import { ADMIN_NEW_MS } from "@/lib/adminNewUtils";
import { logAdminSystemEvent } from "@/lib/adminSystemLog";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { ensureUsersCacheForAdmin } from "@/lib/api/auth";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

export type AdminKycTab = "new" | "all" | "verified" | "unverified";

/**
 * 관리자 KYC 목록: 로드·탭·CSV·신규 배지.
 */
export function useAdminKycPage() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [kycUsers, setKycUsers] = useState<KYCUserData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<AdminKycTab>("all");
  const [unseenNew, setUnseenNew] = useState(0);

  const t = useMemo(() => {
    const lang = currentLanguage as SupportedLanguage;
    const tpl = getUIText("adminKycTotalRecordsTemplate", lang);
    return {
      title: getUIText("adminKycPageTitle", lang),
      total: (n: number) => tpl.replace(/\{\{count\}\}/g, String(n)),
      refresh: getUIText("adminKycRefreshButton", lang),
      csv: "CSV",
      loading: getUIText("adminKycLoadingLabel", lang),
      empty: getUIText("adminKycEmptyMessage", lang),
      noName: getUIText("adminKycNoNameFallback", lang),
    };
  }, [currentLanguage]);

  const loadKYCData = useCallback(async (isRefresh = false, silent = false) => {
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else setInitialLoading(true);
    }
    setError("");
    try {
      const users = await getAllKYCUsers();
      setKycUsers(users);
      setUnseenNew(getUnseenNewKycCount());
    } catch (err: unknown) {
      console.error("Error loading KYC data:", err);
      if (!silent) {
        logAdminSystemEvent({
          severity: "error",
          category: "kyc",
          message: err instanceof Error ? err.message : "관리자 KYC 목록 로드 실패",
          snapshot: { function: "useAdminKycPage.loadKYCData" },
        });
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setRefreshing(false);
      }
      refreshAdminBadges();
    }
  }, []);

  const handleDownloadCSV = async () => {
    const lang = currentLanguage as SupportedLanguage;
    setDownloading(true);
    setError("");
    try {
      await downloadAllKYCData(lang);
    } catch (err: unknown) {
      console.error("Error downloading CSV:", err);
      logAdminSystemEvent({
        severity: "warning",
        category: "kyc",
        message: err instanceof Error ? err.message : "KYC CSV 다운로드 실패",
        snapshot: { function: "useAdminKycPage.handleDownloadCSV" },
      });
      setError(
        err instanceof Error ? err.message : getUIText("adminKycCsvDownloadError", lang),
      );
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    void loadKYCData(false);
  }, [loadKYCData]);

  useAdminDomainRefresh(["user", "lessor_profile"], () => {
    void loadKYCData(true, true);
  });

  useEffect(() => {
    if (tab !== "new") return;
    let cancelled = false;
    void (async () => {
      await ensureUsersCacheForAdmin();
      if (cancelled) return;
      acknowledgeCurrentNewKyc();
      if (cancelled) return;
      setUnseenNew(getUnseenNewKycCount());
      refreshAdminBadges();
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    const resetToAll = () => setTab("all");
    window.addEventListener("admin-kyc-reset-tab", resetToAll);
    return () => {
      window.removeEventListener("admin-kyc-reset-tab", resetToAll);
    };
  }, []);

  const newRows = useMemo(() => {
    const now = Date.now();
    return kycUsers.filter((u) => {
      const created = new Date(u.createdAt || "").getTime();
      return Number.isFinite(created) && now - created < ADMIN_NEW_MS;
    });
  }, [kycUsers]);

  const verifiedRows = useMemo(
    () => kycUsers.filter((u) => u.verificationStatus === "verified"),
    [kycUsers],
  );
  const unverifiedRows = useMemo(
    () => kycUsers.filter((u) => u.verificationStatus !== "verified"),
    [kycUsers],
  );

  const shownRows = useMemo(() => {
    if (tab === "new") return newRows;
    if (tab === "verified") return verifiedRows;
    if (tab === "unverified") return unverifiedRows;
    return kycUsers;
  }, [tab, newRows, verifiedRows, unverifiedRows, kycUsers]);

  return {
    router,
    currentLanguage,
    setCurrentLanguage,
    kycUsers,
    initialLoading,
    refreshing,
    downloading,
    error,
    tab,
    setTab,
    unseenNew,
    t,
    loadKYCData,
    handleDownloadCSV,
    newRows,
    verifiedRows,
    unverifiedRows,
    shownRows,
  };
}

export type AdminKycPageViewModel = ReturnType<typeof useAdminKycPage>;
