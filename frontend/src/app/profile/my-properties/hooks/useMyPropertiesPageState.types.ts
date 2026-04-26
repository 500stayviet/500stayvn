export type HostInventoryTab = "live" | "pending" | "ended";

export type LiveExistsConfirmState = {
  activeId: string;
  shadowId: string;
  activeLabel: string;
  activeAddress: string;
  activeUnit?: string;
  returnTab: HostInventoryTab;
};

export type InventoryBuckets = {
  liveList: import("@/types/property").PropertyData[];
  pendingList: import("@/types/property").PropertyData[];
  endedList: import("@/types/property").PropertyData[];
};

export function parseHostTab(s: string | null): HostInventoryTab {
  if (s === "pending" || s === "ended") return s;
  if (s === "hidden") return "ended";
  return "live";
}
