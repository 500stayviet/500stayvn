import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  getAvailableProperties,
  getPropertiesByOwner,
  hostDeletePropertySoft,
  hostEndAdvertisingProperty,
} from "@/lib/api/properties";
import { getCurrentUserData } from "@/lib/api/auth";
import { areSamePropertyValues } from "@/lib/utils/propertyDedup";
import type { PropertyData } from "@/types/property";

export type HostInventoryTab = "live" | "pending" | "ended";
export type LiveExistsConfirmState = {
  activeId: string;
  shadowId: string;
  activeLabel: string;
  activeAddress: string;
  activeUnit?: string;
  returnTab: HostInventoryTab;
};

export function parseHostTab(s: string | null): HostInventoryTab {
  if (s === "pending" || s === "ended") return s;
  if (s === "hidden") return "ended";
  return "live";
}

type InventoryBuckets = {
  liveList: PropertyData[];
  pendingList: PropertyData[];
  endedList: PropertyData[];
};

interface UseMyPropertiesPageStateParams {
  user: { uid: string } | null;
  authLoading: boolean;
  router: { push: (path: string) => void; replace: (path: string) => void };
  searchParams: ReadonlyURLSearchParams;
}

export function useMyPropertiesPageState({
  user,
  authLoading,
  router,
  searchParams,
}: UseMyPropertiesPageStateParams) {
  const [inventory, setInventory] = useState<InventoryBuckets | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HostInventoryTab>("live");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEndAdFromPendingConfirm, setShowEndAdFromPendingConfirm] = useState<string | null>(null);
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

  const goTab = (t: HostInventoryTab) => {
    setActiveTab(t);
    if (t === "live") router.push("/profile/my-properties");
    else router.push(`/profile/my-properties?tab=${t}`);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await hostDeletePropertySoft(id, user.uid);
      setInventory(await fetchInventory());
      setShowDeleteConfirm(null);
    } catch {
      alert("Error deleting property");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEndAd = async (propertyId: string) => {
    if (!user) return;
    await hostEndAdvertisingProperty(propertyId, user.uid);
    setActiveTab("ended");
    router.push("/profile/my-properties?tab=ended");
    setInventory(await fetchInventory());
  };

  const findLiveSibling = (property: PropertyData) =>
    inventory?.liveList.find(
      (p) =>
        user &&
        p.ownerId === user.uid &&
        areSamePropertyValues(
          { address: p.address, unitNumber: p.unitNumber },
          { address: property.address, unitNumber: property.unitNumber },
        ),
    );

  const openEditWithLiveDuplicateCheck = (property: PropertyData, returnTab: HostInventoryTab) => {
    if (!property.id || !user) return;
    const activeMatch = findLiveSibling(property);
    if (activeMatch?.id) {
      setLiveExistsConfirm({
        activeId: activeMatch.id,
        shadowId: property.id,
        activeLabel: (activeMatch.title || activeMatch.address || "").trim(),
        activeAddress: (activeMatch.address || "").trim(),
        activeUnit: activeMatch.unitNumber,
        returnTab,
      });
      return;
    }
    const rt = returnTab === "pending" || returnTab === "ended" ? returnTab : "pending";
    router.push(`/profile/my-properties/${property.id}/edit?extend=1&returnTab=${rt}`);
  };

  const handleConfirmPendingEnd = async (id: string) => {
    setShowEndAdFromPendingConfirm(null);
    await handleEndAd(id);
  };

  const handleConfirmLiveExists = (value: LiveExistsConfirmState) => {
    setLiveExistsConfirm(null);
    const q = new URLSearchParams({
      extend: "1",
      returnTab: value.returnTab,
      dismissSiblingId: value.shadowId,
    });
    router.push(`/profile/my-properties/${value.activeId}/edit?${q.toString()}`);
  };

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
    loading,
    activeTab,
    properties,
    deletingId,
    showDeleteConfirm,
    showEndAdFromPendingConfirm,
    liveExistsConfirm,
    setShowDeleteConfirm,
    setShowEndAdFromPendingConfirm,
    setLiveExistsConfirm,
    goTab,
    tabCount,
    handleDelete,
    handleEndAd,
    handleConfirmPendingEnd,
    handleConfirmLiveExists,
    openEditWithLiveDuplicateCheck,
  };
}

