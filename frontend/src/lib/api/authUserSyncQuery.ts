/**
 * 인증 — 조회(Read): 서버에서 users 캐시로, in-flight 합류, bootstrap
 */

import {
  isLedgerBootstrapDone,
  markLedgerBootstrapDone,
} from "@/lib/runtime/localBootstrapMarkers";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  syncUiMessage,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";
import { canReadLocalFallback } from "@/lib/runtime/localFallbackPolicy";
import { withAppActor } from "@/lib/api/withAppActor";
import { parseAppUsersListPayload } from "@/lib/api/appUserApiParse";
import { readResponseJsonOrMarker } from "@/lib/api/appResponseRead";
import type { UserData } from "./authTypes";
import {
  BOOTSTRAP_KEY,
  BOOTSTRAP_SESSION_KEY,
  getCurrentUserId,
  getOrStartSharedUsersRefresh,
  getUsers,
  invalidateUsersMemoryAfterFailedRefresh,
  setUsersCacheAndStorage,
  USERS_STORAGE_KEY,
} from "./authState";

/**
 * 서버에서 회원 목록 갱신. 성공 시 true
 */
export async function refreshUsersFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getCurrentUserId()) return false;
  try {
    const users: UserData[] = [];
    let offset = 0;
    const limit = 200;
    for (let i = 0; i < 100; i += 1) {
      const res = await fetchWithRetry(
        `/api/app/users?limit=${limit}&offset=${offset}`,
        withAppActor({ cache: "no-store" }),
        { retries: 2, baseDelayMs: 300 },
      );
      const json = await readResponseJsonOrMarker(res);
      if (json && typeof json === "object" && "__jsonParseError" in json) {
        throw new Error("invalid_json");
      }
      if (!res.ok) {
        if (isClientAuthErrorStatus(res.status)) {
          return false;
        }
        throw new Error(String(res.status));
      }
      const data = parseAppUsersListPayload(json);
      const chunk = data.users;
      users.push(...chunk);
      const hasMore = Boolean(data.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(data.page?.nextOffset ?? offset + chunk.length);
    }
    setUsersCacheAndStorage(users);
    return true;
  } catch (e) {
    invalidateUsersMemoryAfterFailedRefresh();
    const code = e instanceof Error ? Number(e.message) : NaN;
    if (Number.isFinite(code) && isClientAuthErrorStatus(code)) {
      emitUserFacingSyncError({
        area: "users",
        action: "refresh",
        message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      });
      return false;
    }
    console.warn("[users] refreshUsersFromServer failed", e);
    emitUserFacingSyncError({
      area: "users",
      action: "refresh",
      message: syncUiMessage("apiSyncErrorTransient"),
    });
    return false;
  }
}

function getSharedAppUsersRefresh(): Promise<boolean> {
  return getOrStartSharedUsersRefresh(() => refreshUsersFromServer());
}

export { getSharedAppUsersRefresh };

/** 호스트/게스트: 회원 목록 메모리를 서버와 맞춤 */
export async function ensureUsersLoadedForApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getCurrentUserId()) return false;
  return getSharedAppUsersRefresh();
}

/** 관리자 세션으로 전체 회원 목록을 캐시에 올림 */
export async function refreshUsersCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const users: UserData[] = [];
    let offset = 0;
    const limit = 200;
    for (let i = 0; i < 200; i += 1) {
      const res = await fetchWithRetry(
        `/api/admin/users?limit=${limit}&offset=${offset}`,
        { cache: "no-store", credentials: "same-origin" },
        { retries: 1, baseDelayMs: 300 },
      );
      const json = await readResponseJsonOrMarker(res);
      if (json && typeof json === "object" && "__jsonParseError" in json) {
        return false;
      }
      if (!res.ok) return false;
      const data = parseAppUsersListPayload(json);
      const chunk = data.users;
      users.push(...chunk);
      const hasMore = Boolean(data.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(data.page?.nextOffset ?? offset + chunk.length);
    }
    setUsersCacheAndStorage(users);
    return true;
  } catch {
    return false;
  }
}

let usersAdminLoadInFlight: Promise<boolean> | null = null;

/** 관리자 화면용: 전체 회원 캐시 */
export async function ensureUsersCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (usersAdminLoadInFlight) return usersAdminLoadInFlight;
  usersAdminLoadInFlight = refreshUsersCacheForAdmin().finally(() => {
    usersAdminLoadInFlight = null;
  });
  return usersAdminLoadInFlight;
}

/** 최초 로드: DB가 비어 있고 로컬에만 users가 있으면 import 후 다시 동기화 */
export async function bootstrapUsersFromServer(): Promise<void> {
  if (typeof window === "undefined") return;

  const ok = await getSharedAppUsersRefresh();
  if (!ok) return;

  if (isLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY)) return;

  if (getUsers().length > 0) {
    markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
    return;
  }

  if (!canReadLocalFallback()) {
    markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
    return;
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
    return;
  }

  let local: UserData[] = [];
  try {
    local = JSON.parse(raw);
  } catch {
    markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
    return;
  }

  if (!Array.isArray(local) || local.length === 0) {
    markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
    return;
  }

  try {
    const res = await fetchWithRetry(
      "/api/app/users/import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: local }),
      },
      { retries: 2, baseDelayMs: 300 },
    );
    if (res.ok) {
      markLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY);
      await getSharedAppUsersRefresh();
    }
  } catch (e) {
    console.warn("[users] bootstrap import failed", e);
    emitUserFacingSyncError({
      area: "users",
      action: "bootstrap",
      message: syncUiMessage("usersBootstrapSyncFailed"),
    });
  }
}
