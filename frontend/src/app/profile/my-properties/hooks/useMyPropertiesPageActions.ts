import { useCallback } from "react";
import { hostDeletePropertySoft, hostEndAdvertisingProperty } from "@/lib/api/properties";
import { areSamePropertyValues } from "@/lib/utils/propertyDedup";
import type { PropertyData } from "@/types/property";
import { emitUserFacingSyncError } from "@/lib/runtime/networkResilience";
import type { MyPropertiesPageData } from "./useMyPropertiesPageData";
import type { HostInventoryTab, LiveExistsConfirmState } from "./useMyPropertiesPageState.types";

/** 내 매물 목록 — 삭제·광고종료·편집 네비게이션 액션. */
export function useMyPropertiesPageActions(data: MyPropertiesPageData) {
  const {
    user,
    router,
    inventory,
    setInventory,
    fetchInventory,
    setActiveTab,
    setDeletingId,
    setShowDeleteConfirm,
    setShowEndAdFromPendingConfirm,
    setLiveExistsConfirm,
  } = data;

  const goTab = useCallback(
    (t: HostInventoryTab) => {
      setActiveTab(t);
      if (t === "live") router.push("/profile/my-properties");
      else router.push(`/profile/my-properties?tab=${t}`);
    },
    [router, setActiveTab],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) return;
      setDeletingId(id);
      try {
        await hostDeletePropertySoft(id, user.uid);
        setInventory(await fetchInventory());
        setShowDeleteConfirm(null);
      } catch {
        emitUserFacingSyncError({
          area: "properties",
          action: "host_delete",
          message: "Error deleting property",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [user, setDeletingId, fetchInventory, setInventory, setShowDeleteConfirm],
  );

  const handleEndAd = useCallback(
    async (propertyId: string) => {
      if (!user) return;
      await hostEndAdvertisingProperty(propertyId, user.uid);
      setActiveTab("ended");
      router.push("/profile/my-properties?tab=ended");
      setInventory(await fetchInventory());
    },
    [user, setActiveTab, router, fetchInventory, setInventory],
  );

  const findLiveSibling = useCallback(
    (property: PropertyData) =>
      inventory?.liveList.find(
        (p) =>
          user &&
          p.ownerId === user.uid &&
          areSamePropertyValues(
            { address: p.address, unitNumber: p.unitNumber },
            { address: property.address, unitNumber: property.unitNumber },
          ),
      ),
    [inventory?.liveList, user],
  );

  const openEditWithLiveDuplicateCheck = useCallback(
    (property: PropertyData, returnTab: HostInventoryTab) => {
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
    },
    [user, findLiveSibling, setLiveExistsConfirm, router],
  );

  const handleConfirmPendingEnd = useCallback(
    async (id: string) => {
      setShowEndAdFromPendingConfirm(null);
      await handleEndAd(id);
    },
    [setShowEndAdFromPendingConfirm, handleEndAd],
  );

  const handleConfirmLiveExists = useCallback(
    (value: LiveExistsConfirmState) => {
      setLiveExistsConfirm(null);
      const q = new URLSearchParams({
        extend: "1",
        returnTab: value.returnTab,
        dismissSiblingId: value.shadowId,
      });
      router.push(`/profile/my-properties/${value.activeId}/edit?${q.toString()}`);
    },
    [setLiveExistsConfirm, router],
  );

  return {
    goTab,
    handleDelete,
    handleEndAd,
    handleConfirmPendingEnd,
    handleConfirmLiveExists,
    openEditWithLiveDuplicateCheck,
  };
}
