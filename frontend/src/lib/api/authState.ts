/**
 * 인증 — 캐시·세션·앱 액터 (Read: getUsers / Write: setAppSessionUserId 등)
 */

import {
  canReadLocalFallback,
  canWriteLocalFallback,
  getLocalFallbackMode,
} from "@/lib/runtime/localFallbackPolicy";
import { clearBookingsClientCache } from "@/lib/api/bookings";
import type { UserData } from "./authTypes";

export const USERS_STORAGE_KEY = "users";
const CURRENT_USER_KEY = "currentUser";

/**
 * 미들웨어가 `/booking*`·결제 API 접근 시 참고하는 앱 액터 쿠키(비 HttpOnly).
 * 로그인 세션은 LS `currentUser` 와 동기화됩니다.
 */
export const APP_ACTOR_UID_COOKIE = "stayviet_app_uid";

export const BOOTSTRAP_KEY = "stayviet-user-bootstrap-v1";
export const BOOTSTRAP_SESSION_KEY = "stayviet-user-bootstrap-session-v1";

function syncStayvietAppUidCookie(uid: string | null): void {
  if (typeof document === "undefined") return;
  try {
    if (uid) {
      document.cookie = `${APP_ACTOR_UID_COOKIE}=${encodeURIComponent(uid)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `${APP_ACTOR_UID_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {
    /* ignore */
  }
}

/** 새로고침 직후 LS 만 있고 쿠키가 비어 있을 때 미들웨어와 맞추기 위해 호출 */
export function syncAppActorUidCookieFromStorage(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  syncStayvietAppUidCookie(localStorage.getItem(CURRENT_USER_KEY));
}

let usersCache: UserData[] | null = null;

/** 앱 GET `/api/app/users` in-flight */
export let sharedAppUsersRefresh: Promise<boolean> | null = null;

export function getOrStartSharedUsersRefresh(
  start: () => Promise<boolean>,
): Promise<boolean> {
  if (!sharedAppUsersRefresh) {
    sharedAppUsersRefresh = start().finally(() => {
      sharedAppUsersRefresh = null;
    });
  }
  return sharedAppUsersRefresh;
}

let appActorIdMemory: string | null | undefined;
let appActorStorageListenerAttached = false;

function flushAppCachesOnActorChange(): void {
  clearUsersClientMemory();
  clearBookingsClientCache();
  const runSide = () => {
    void import("@/lib/api/properties")
      .then((m) => m.clearPropertiesClientCache())
      .catch(() => {});
    void import("@/lib/api/chat")
      .then((m) => m.notifyChatActorSessionReset())
      .catch(() => {});
  };
  if (typeof queueMicrotask === "function") queueMicrotask(runSide);
  else runSide();
}

function ensureAppActorCrossTabListener(): void {
  if (typeof window === "undefined" || appActorStorageListenerAttached) return;
  appActorStorageListenerAttached = true;
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== CURRENT_USER_KEY) return;
    const prev =
      appActorIdMemory !== undefined ? appActorIdMemory : e.oldValue ?? null;
    const next = e.newValue ?? null;
    if (prev === next) return;
    appActorIdMemory = next;
    flushAppCachesOnActorChange();
  });
}

export function isLocalFallbackDisabled(): boolean {
  return getLocalFallbackMode() === "off";
}

function readLocalStorageUsersFallback(): UserData[] {
  if (
    typeof window === "undefined" ||
    typeof localStorage === "undefined" ||
    !canReadLocalFallback()
  )
    return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** 사용자 목록 — 서버 동기화 후에는 메모리 캐시, 그 전에는 LocalStorage */
export function getUsers(): UserData[] {
  if (usersCache !== null) return usersCache;
  return readLocalStorageUsersFallback();
}

/** 캐시 + LocalStorage 미러(레거시·폴백용) */
export function setUsersCacheAndStorage(users: UserData[]): void {
  usersCache = users;
  if (
    typeof window !== "undefined" &&
    typeof localStorage !== "undefined" &&
    canWriteLocalFallback()
  ) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      /* ignore */
    }
  }
  notifyUsersStorageChanged();
}

/** 서버에서 받은 `UserData`로 로컬 users 캐시 한 건을 갱신 */
export function mergeAuthenticatedUserIntoCache(user: UserData): void {
  const list = getUsers();
  const idx = list.findIndex((u) => u.uid === user.uid);
  const next =
    idx === -1 ? [...list, user] : list.map((u, i) => (i === idx ? user : u));
  setUsersCacheAndStorage(next);
}

export function notifyUsersStorageChanged(): void {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stayviet-users-updated"));
    }
  } catch {
    /* ignore */
  }
}

/** @deprecated 서버 원장 사용 후 직접 호출 지양 — 캐시만 갱신할 때 */
export function saveUsers(users: UserData[]): void {
  setUsersCacheAndStorage(users);
}

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return null;
  ensureAppActorCrossTabListener();
  if (appActorIdMemory !== undefined) return appActorIdMemory;
  appActorIdMemory = localStorage.getItem(CURRENT_USER_KEY);
  return appActorIdMemory;
}

export function clearUsersClientMemory(): void {
  usersCache = null;
  sharedAppUsersRefresh = null;
  notifyUsersStorageChanged();
}

/**
 * `refreshUsersFromServer` 실패 시 원본과 동일: in-flight/알림 없이 메모리 캐시만 비움.
 */
export function invalidateUsersMemoryAfterFailedRefresh(): void {
  usersCache = null;
}

function setCurrentUser(uid: string | null): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  const prev = localStorage.getItem(CURRENT_USER_KEY);
  if (uid) localStorage.setItem(CURRENT_USER_KEY, uid);
  else localStorage.removeItem(CURRENT_USER_KEY);
  const next = localStorage.getItem(CURRENT_USER_KEY);
  appActorIdMemory = next;
  syncStayvietAppUidCookie(next);
  if (prev !== next) {
    flushAppCachesOnActorChange();
  }
}

/** NextAuth(OAuth) 세션과 동기화할 때 사용 */
export function setAppSessionUserId(uid: string | null): void {
  setCurrentUser(uid);
}

export function getCurrentUserData(): UserData | null;
export async function getCurrentUserData(uid: string): Promise<UserData | null>;
export function getCurrentUserData(
  uid?: string,
): UserData | null | Promise<UserData | null> {
  if (uid) {
    const users = getUsers();
    return Promise.resolve(users.find((u) => u.uid === uid) || null);
  }
  const userId = getCurrentUserId();
  if (!userId) return null;
  const users = getUsers();
  const current = users.find((u) => u.uid === userId) || null;
  if (!current) {
    return null;
  }
  if (current.blocked) {
    setCurrentUser(null);
    return null;
  }
  return current;
}
