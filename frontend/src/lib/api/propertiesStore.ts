import type { PropertyData } from "@/types/property";
import { ensureBookingsLoadedForApp } from "./bookings";
import { getCurrentUserId } from "@/lib/api/auth";
import { withAppActor } from "@/lib/api/withAppActor";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";

let propertiesCache: PropertyData[] | null = null;
let serverFlushTimer: ReturnType<typeof setTimeout> | null = null;
let sharedAppPropertiesRefresh: Promise<boolean> | null = null;

type PropertiesListPage = {
  hasMore?: boolean;
  nextOffset?: number;
  limit?: number;
  offset?: number;
  nextCursor?: string | null;
};

/** `GET /api/app/properties` — supports `{ ok, data }` and legacy flat JSON (tests/mocks). */
function parsePropertiesListPayload(raw: unknown): {
  properties: PropertyData[];
  page?: PropertiesListPage;
} {
  if (raw && typeof raw === "object" && "ok" in raw) {
    const envelope = raw as { ok?: boolean; data?: unknown };
    if (envelope.ok === true && envelope.data && typeof envelope.data === "object") {
      const data = envelope.data as {
        properties?: PropertyData[];
        page?: PropertiesListPage;
      };
      return {
        properties: Array.isArray(data.properties) ? data.properties : [],
        page: data.page,
      };
    }
  }
  const legacy = raw as { properties?: PropertyData[]; page?: PropertiesListPage };
  return {
    properties: Array.isArray(legacy.properties) ? legacy.properties : [],
    page: legacy.page,
  };
}

export function getPropertySyncErrorMessage(status: number | null): string {
  if (status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  if (status === 503)
    return "서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.";
  if (status === 404) return "조건에 맞는 매물이 아직 없습니다.";
  return "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

function dispatchPropertiesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("propertiesUpdated"));
  }
}

function getSharedAppPropertiesRefresh(): Promise<boolean> {
  if (!sharedAppPropertiesRefresh) {
    sharedAppPropertiesRefresh = refreshPropertiesFromServer().finally(() => {
      sharedAppPropertiesRefresh = null;
    });
  }
  return sharedAppPropertiesRefresh;
}

export function readPropertiesArray(): PropertyData[] {
  const base = propertiesCache !== null ? propertiesCache : [];
  return JSON.parse(JSON.stringify(base)) as PropertyData[];
}

export function replacePropertiesCache(all: PropertyData[]): void {
  propertiesCache = all;
  dispatchPropertiesUpdated();
}

export function clearPropertiesClientCache(): void {
  propertiesCache = null;
  sharedAppPropertiesRefresh = null;
  if (serverFlushTimer) {
    clearTimeout(serverFlushTimer);
    serverFlushTimer = null;
  }
  dispatchPropertiesUpdated();
}

export async function ensurePropertiesLoadedForApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getCurrentUserId()) return false;
  return getSharedAppPropertiesRefresh();
}

export async function hydratePropertiesMemoryIfLoggedIn(): Promise<void> {
  if (!getCurrentUserId()) return;
  try {
    await ensurePropertiesLoadedForApp();
  } catch {
    // Keep existing cache when network is unstable.
  }
}

export async function hydratePropertyAndBookingMemoryIfLoggedIn(): Promise<void> {
  if (!getCurrentUserId()) return;
  try {
    await ensurePropertiesLoadedForApp();
    await ensureBookingsLoadedForApp();
  } catch {
    // Ignore and continue with current cache snapshot.
  }
}

export function writePropertiesArray(all: PropertyData[]): void {
  propertiesCache = all;
  dispatchPropertiesUpdated();

  if (typeof window === "undefined") return;
  if (serverFlushTimer) clearTimeout(serverFlushTimer);

  serverFlushTimer = setTimeout(() => {
    serverFlushTimer = null;
    const snapshot = propertiesCache;
    if (!snapshot) return;

    void fetchWithRetry(
      "/api/app/properties",
      withAppActor({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 },
    ).catch((e) => {
      console.warn("[properties] PUT sync failed", e);
      emitUserFacingSyncError({
        area: "properties",
        action: "sync",
        message:
          "매물 데이터 동기화가 지연되고 있습니다. 잠시 후 다시 확인해주세요.",
      });
    });
  }, 500);
}

export async function refreshPropertiesFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const list: PropertyData[] = [];
    let offset = 0;
    const limit = 200;

    for (let i = 0; i < 200; i += 1) {
      const res = await fetchWithRetry(
        `/api/app/properties?limit=${limit}&offset=${offset}`,
        withAppActor({ cache: "no-store" }),
        { retries: 2, baseDelayMs: 300 },
      );

      if (!res.ok) {
        if (isClientAuthErrorStatus(res.status)) {
          emitUserFacingSyncError({
            area: "properties",
            action: "refresh",
            message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
          });
          return false;
        }
        if (res.status === 404) {
          propertiesCache = [];
          dispatchPropertiesUpdated();
          return true;
        }
        throw new Error(String(res.status));
      }

      const parsed = parsePropertiesListPayload(await res.json());
      const chunk = parsed.properties;
      list.push(...chunk);
      const hasMore = Boolean(parsed.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(parsed.page?.nextOffset ?? offset + chunk.length);
    }

    propertiesCache = list;
    dispatchPropertiesUpdated();
    return true;
  } catch (e) {
    propertiesCache = null;
    const code = e instanceof Error ? Number(e.message) : Number.NaN;
    if (Number.isFinite(code) && isClientAuthErrorStatus(code)) {
      emitUserFacingSyncError({
        area: "properties",
        action: "refresh",
        message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      });
      return false;
    }
    console.warn("[properties] refreshPropertiesFromServer failed", e);
    emitUserFacingSyncError({
      area: "properties",
      action: "refresh",
      message: getPropertySyncErrorMessage(Number.isFinite(code) ? code : null),
    });
    return false;
  }
}
