import type { PropertyData } from "@/types/property";
import { ensureBookingsLoadedForApp } from "./bookings";
import { getCurrentUserId } from "@/lib/api/auth";
import { withAppActor } from "@/lib/api/withAppActor";
import { parseAppPropertiesListPayload } from "./appPropertyApiParse";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  syncUiMessage,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";

let propertiesCache: PropertyData[] | null = null;
let serverFlushTimer: ReturnType<typeof setTimeout> | null = null;
let sharedAppPropertiesRefresh: Promise<boolean> | null = null;

export function getPropertySyncErrorMessage(status: number | null): string {
  if (status === 429) return syncUiMessage("propertiesErrRateLimited");
  if (status === 503) return syncUiMessage("propertiesErrServerUnstable");
  if (status === 404) return syncUiMessage("propertiesErrNoMatch");
  return syncUiMessage("propertiesErrGeneric");
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
        message: syncUiMessage("propertiesSyncPutDelayed"),
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
          propertiesCache = null;
          dispatchPropertiesUpdated();
          return false;
        }
        // 404는 "목록 없음"으로 간주
        if (res.status === 404) {
          propertiesCache = [];
          dispatchPropertiesUpdated();
          return true;
        }
        // 공개 카탈로그 레이트리밋·일시 오류 등 — 전역 빨간 배너로는 알리지 않고 빈 목록으로 내려감
        // (실제 원인은 서버/Amplify 로그·Sentry에서 확인)
        console.warn(
          "[properties] GET /api/app/properties non-OK, degrading to empty list",
          res.status,
        );
        propertiesCache = [];
        dispatchPropertiesUpdated();
        return false;
      }

      const parsed = parseAppPropertiesListPayload(await res.json());
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
    const code = e instanceof Error ? Number(e.message) : Number.NaN;
    if (Number.isFinite(code) && isClientAuthErrorStatus(code)) {
      emitUserFacingSyncError({
        area: "properties",
        action: "refresh",
        message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      });
      propertiesCache = null;
      dispatchPropertiesUpdated();
      return false;
    }
    // 네트워크·파싱 등 — 매물 0건처럼 처리. 전역 배너로 `propertiesErrGeneric`을 띄우지 않음.
    console.warn("[properties] refreshPropertiesFromServer failed (empty list fallback)", e);
    propertiesCache = [];
    dispatchPropertiesUpdated();
    return false;
  }
}
