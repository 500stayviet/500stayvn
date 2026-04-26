import { adminPropertyLastActivityMs } from "@/lib/adminNewUtils";
import type { PropertyData } from "@/types/property";

export type AdminInventoryFilter =
  | "all"
  | "new"
  | "listed"
  | "paused"
  | "hidden";

export function toDate(
  dateInput: string | Date | undefined | null,
): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === "string") {
    const date = new Date(dateInput);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function serializeDate(date: unknown): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof date === "string") {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
}

export function sortPropsNewestFirst(arr: PropertyData[]): PropertyData[] {
  return [...arr].sort((a, b) => {
    const at = adminPropertyLastActivityMs(a);
    const bt = adminPropertyLastActivityMs(b);
    return bt - at;
  });
}

export function matchesAdminInventoryKeyword(
  p: PropertyData,
  keyword: string,
  ownerEmailByUid: Map<string, string>,
): boolean {
  if (!keyword) return true;
  const oid = (p.ownerId || "").toLowerCase();
  if (oid.includes(keyword)) return true;
  const em = ownerEmailByUid.get(p.ownerId || "");
  if (em && em.includes(keyword)) return true;
  if ((p.id || "").toLowerCase().includes(keyword)) return true;
  if ((p.title || "").toLowerCase().includes(keyword)) return true;
  if ((p.address || "").toLowerCase().includes(keyword)) return true;
  return false;
}

export function propertyMatchesAdminTab(
  p: PropertyData,
  status: AdminInventoryFilter,
  isPropertyNew: (x: PropertyData) => boolean,
): boolean {
  switch (status) {
    case "all":
      return true;
    case "new":
      return isPropertyNew(p);
    case "listed":
      return !p.hidden && p.status === "active";
    case "paused":
      return !p.hidden && p.status === "INACTIVE_SHORT_TERM";
    case "hidden":
      return !!p.hidden;
    default:
      return true;
  }
}
