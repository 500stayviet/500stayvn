import type { PropertyData } from "@/types/property";
import {
  ensureAdminPropertyActionLogsLoaded,
  getAdminPropertyActionLogsCached,
} from "@/lib/api/adminPropertyActionLogs";
import { isParentPropertyRecord } from "@/lib/utils/propertyUtils";
import { fetchWithRetry } from "@/lib/runtime/networkResilience";
import {
  matchesAdminInventoryKeyword,
  propertyMatchesAdminTab,
  sortPropsNewestFirst,
  type AdminInventoryFilter,
} from "./propertiesHelpers";
import { replacePropertiesCache } from "./propertiesStore";

async function fetchAllPropertiesByEndpoint(
  endpoint: string,
  init: RequestInit,
): Promise<PropertyData[]> {
  const list: PropertyData[] = [];
  let offset = 0;
  const limit = 200;
  for (let i = 0; i < 200; i += 1) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await fetchWithRetry(
      `${endpoint}${sep}limit=${limit}&offset=${offset}`,
      init,
      { retries: 2, baseDelayMs: 300 },
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      properties?: PropertyData[];
      page?: { hasMore?: boolean; nextOffset?: number };
    };
    const chunk = Array.isArray(data.properties) ? data.properties : [];
    list.push(...chunk);
    if (!data.page?.hasMore || chunk.length === 0) break;
    offset = Number(data.page?.nextOffset ?? offset + chunk.length);
  }
  return list;
}

export async function getAllPropertiesForAdmin(): Promise<PropertyData[]> {
  if (typeof window === "undefined") return [];
  try {
    return await fetchAllPropertiesByEndpoint("/api/admin/properties", {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    console.error("admin properties load failed:", error);
    return [];
  }
}

export async function refreshPropertiesCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const rows = await getAllPropertiesForAdmin();
    replacePropertiesCache(rows);
    return true;
  } catch {
    return false;
  }
}

let propertiesAdminLoadInFlight: Promise<boolean> | null = null;

export async function ensurePropertiesCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (propertiesAdminLoadInFlight) return propertiesAdminLoadInFlight;
  propertiesAdminLoadInFlight = refreshPropertiesCacheForAdmin().finally(() => {
    propertiesAdminLoadInFlight = null;
  });
  return propertiesAdminLoadInFlight;
}

export async function getPropertyForAdmin(
  id: string,
): Promise<PropertyData | null> {
  if (typeof window === "undefined" || !id) return null;
  try {
    const res = await fetch(`/api/admin/properties/${encodeURIComponent(id)}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    return (await res.json()) as PropertyData;
  } catch {
    return null;
  }
}

export async function loadAdminInventoryPage(
  search = "",
  filter: AdminInventoryFilter = "all",
): Promise<{
  rows: PropertyData[];
  nAll: number;
  nNew: number;
  nListed: number;
  nPaused: number;
  nHidden: number;
  propertyAckAt: Map<string, Date>;
}> {
  if (typeof window === "undefined") {
    return {
      rows: [],
      nAll: 0,
      nNew: 0,
      nListed: 0,
      nPaused: 0,
      nHidden: 0,
      propertyAckAt: new Map(),
    };
  }
  const rows = await getAllPropertiesForAdmin();
  const { isPropertyNew, shouldShowPropertyInAdminNewTab } = await import(
    "@/lib/adminNewUtils"
  );
  const { fetchPropertyAcknowledgedAtMap } = await import(
    "@/lib/adminAckState"
  );
  const propertyAckAt = await fetchPropertyAcknowledgedAtMap();
  const matchesAdminNewTab = (p: PropertyData) =>
    shouldShowPropertyInAdminNewTab(p, propertyAckAt);

  const keyword = search.trim().toLowerCase();
  const ownerEmailByUid = new Map<string, string>();

  if (keyword) {
    const { getUsers } = await import("@/lib/api/auth");
    getUsers().forEach((u) => {
      if (u.uid && !u.deleted) ownerEmailByUid.set(u.uid, (u.email || "").toLowerCase());
    });
  }

  const base = rows.filter((p) => !p.deleted && isParentPropertyRecord(p));
  const keywordMatched = base.filter((p) =>
    matchesAdminInventoryKeyword(p, keyword, ownerEmailByUid),
  );

  const nAll = keywordMatched.length;
  const nNew = keywordMatched.filter((p) => matchesAdminNewTab(p)).length;
  const nListed = keywordMatched.filter((p) =>
    propertyMatchesAdminTab(p, "listed", isPropertyNew),
  ).length;
  const nPaused = keywordMatched.filter((p) =>
    propertyMatchesAdminTab(p, "paused", isPropertyNew),
  ).length;
  const nHidden = keywordMatched.filter((p) =>
    propertyMatchesAdminTab(p, "hidden", isPropertyNew),
  ).length;

  const tabRows = keywordMatched.filter((p) =>
    filter === "new"
      ? matchesAdminNewTab(p)
      : propertyMatchesAdminTab(p, filter, isPropertyNew),
  );

  return {
    rows: sortPropsNewestFirst(tabRows),
    nAll,
    nNew,
    nListed,
    nPaused,
    nHidden,
    propertyAckAt: new Map(propertyAckAt),
  };
}

export interface DeletedPropertyLog {
  id: string;
  property: PropertyData;
  deletedAt: string;
  deletedBy?: string;
}

export async function getDeletedPropertyLogs(): Promise<DeletedPropertyLog[]> {
  try {
    if (typeof window === "undefined") return [];
    await ensureAdminPropertyActionLogsLoaded();
    const rows = getAdminPropertyActionLogsCached().filter(
      (r) => r.actionType === "DELETED",
    );
    const out: DeletedPropertyLog[] = rows.map((r) => {
      const snap =
        r.snapshotJson && typeof r.snapshotJson === "object" && !Array.isArray(r.snapshotJson)
          ? (r.snapshotJson as PropertyData)
          : ({ id: r.propertyId } as PropertyData);
      return {
        id: r.id,
        property: snap,
        deletedAt:
          typeof r.createdAt === "string"
            ? r.createdAt
            : new Date(r.createdAt).toISOString(),
        deletedBy: r.adminId ?? undefined,
      };
    });
    return out.sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );
  } catch (error) {
    console.error("Error getting deleted property logs:", error);
    return [];
  }
}

export async function exportDeletedPropertiesToCSV(): Promise<string> {
  try {
    const logs = await getDeletedPropertyLogs();
    if (logs.length === 0) {
      return "No deleted properties found.";
    }

    const headers = [
      "ID",
      "Title",
      "Address",
      "Price (VND)",
      "Area (m²)",
      "Bedrooms",
      "Bathrooms",
      "Owner ID",
      "Deleted At",
      "Deleted By",
      "Status",
      "Created At",
    ];

    const rows = logs.map((log) => {
      const prop = log.property;
      return [
        prop.id || "",
        prop.title || "",
        prop.address || "",
        prop.price?.toString() || "",
        prop.area?.toString() || "",
        prop.bedrooms?.toString() || "",
        prop.bathrooms?.toString() || "",
        prop.ownerId || "",
        log.deletedAt,
        log.deletedBy || "",
        prop.status || "",
        prop.createdAt
          ? typeof prop.createdAt === "string"
            ? prop.createdAt
            : new Date(prop.createdAt).toISOString()
          : "",
      ];
    });

    return [
      "\uFEFF" + headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
  } catch (error) {
    console.error("Error exporting deleted properties to CSV:", error);
    throw error;
  }
}
