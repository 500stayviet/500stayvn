import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  getAvailableProperties,
  getPropertiesByOwner,
} from "@/lib/api/properties";
import { getCurrentUserData } from "@/lib/api/auth";
import {
  parseHostTab,
  type HostInventoryTab,
  type InventoryBuckets,
  type LiveExistsConfirmState,
} from "./useMyPropertiesPageState.types";

interface UseMyPropertiesPageDataParams {
  user: { uid: string } | null;
  authLoading: boolean;
  router: { push: (path: string) => void; replace: (path: string) => void };
  searchParams: ReadonlyURLSearchParams;
}

/**
 * 내 매물 목록 — 인벤토리·탭·KYC 게이트 (데이터 레이어).
 * `getPropertiesByOwner` 등은 서버 하이드레이션·`unwrapAppApiData` 파싱 경로를 탄다.
 */
export function useMyPropertiesPageData({
  user,
  authLoading,
  router,
  searchParams,
}: UseMyPropertiesPageDataParams) {
  const [inventory, setInventory] = useState<InventoryBuckets | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HostInventoryTab>("live");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEndAdFromPendingConfirm, setShowEndAdFromPendingConfirm] = useState<string | null>(
    null,
  );
  const [liveExistsConfirm, setLiveExistsConfirm] = useState<LiveExistsConfirmState | null>(null);

  const fetchInventory = useCallback(async (): Promise<InventoryBuckets> => {
    if (!user) throw new Error("User is not authenticated");
    await getAvailableProperties();
    const [activeResult] = await Promise.all([getPropertiesByOwner(user.uid, false)]);
    const rows = activeResult.properties.filter((p) => !p.deleted);
    return {
      liveList: rows.filter((p) => !p.hidden && p.status === "active"),
      pendingList: rows.filter((p) => !p.hidden && p.status === "pending"),
      endedList: rows.filter(
        (p) => p.hidden || p.status === "closed" || p.status === "INACTIVE_SHORT_TERM",
      ),
    };
  }, [user]);

  const properties = useMemo(() => {
    if (!inventory) return [];
    switch (activeTab) {
      case "live":
        return inventory.liveList;
      case "pending":
        return inventory.pendingList;
      case "ended":
        return inventory.endedList;
      default:
        return [];
    }
  }, [inventory, activeTab]);

  useEffect(() => {
    setActiveTab(parseHostTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const init = async () => {
      if (!authLoading && user) {
        const userData = await getCurrentUserData(user.uid);
        if (!(userData?.kyc_steps?.step1 && userData?.kyc_steps?.step2 && userData?.kyc_steps?.step3)) {
          router.push("/profile");
          return;
        }
        const inv = await fetchInventory();
        setInventory(inv);
        setLoading(false);
      } else if (!authLoading && !user) {
        router.push("/login");
      }
    };
    void init();
  }, [user, authLoading, router, fetchInventory]);

  useEffect(() => {
    if (!user || authLoading) return;
    const onInventoryChange = () => {
      fetchInventory().then(setInventory).catch(() => {});
    };
    window.addEventListener("propertiesUpdated", onInventoryChange);
    return () => window.removeEventListener("propertiesUpdated", onInventoryChange);
  }, [user, authLoading, fetchInventory]);

  const openId = searchParams.get("open");
  useEffect(() => {
    if (!openId || !user || loading) return;
    router.replace(`/profile/my-properties/${openId}`);
  }, [openId, user, loading, router]);

  const tabCount = (t: HostInventoryTab) => {
    if (!inventory) return 0;
    switch (t) {
      case "live":
        return inventory.liveList.length;
      case "pending":
        return inventory.pendingList.length;
      case "ended":
        return inventory.endedList.length;
      default:
        return 0;
    }
  };

  return {
    user,
    authLoading,
    router,
    searchParams,
    inventory,
    setInventory,
    loading,
    activeTab,
    setActiveTab,
    properties,
    deletingId,
    setDeletingId,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showEndAdFromPendingConfirm,
    setShowEndAdFromPendingConfirm,
    liveExistsConfirm,
    setLiveExistsConfirm,
    fetchInventory,
    tabCount,
  };
}

export type MyPropertiesPageData = ReturnType<typeof useMyPropertiesPageData>;
