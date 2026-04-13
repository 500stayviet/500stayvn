/**
 * 인증·사용자 API — PostgreSQL 원장 우선, DB 불가 시 LocalStorage 폴백
 *
 * KYC 1단계 전화 인증에만 Firebase **Authentication** 클라이언트 SDK를 사용합니다.
 */

import { VerificationStatus, PrivateData } from "@/types/kyc.types";
import { SupportedLanguage } from "@/lib/api/translation";
import {
  canReadLocalFallback,
  canWriteLocalFallback,
  getLocalFallbackMode,
} from "@/lib/runtime/localFallbackPolicy";
import {
  isLedgerBootstrapDone,
  markLedgerBootstrapDone,
} from "@/lib/runtime/localBootstrapMarkers";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";
import { withAppActor } from "@/lib/api/withAppActor";

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  gender?: "male" | "female";
  preferredLanguage?: SupportedLanguage;
  role?: "user" | "admin" | "owner";
  is_owner?: boolean;
  verification_status?: VerificationStatus;
  private_data?: PrivateData;
  kyc_steps?: {
    step1?: boolean;
    step2?: boolean;
    step3?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  /** 폴백(로컬) 경로에서만 존재 — 서버 응답에는 포함되지 않음 */
  password?: string;
  deleted?: boolean;
  deletedAt?: string;
  blocked?: boolean;
  blockedAt?: string;
  blockedReason?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: "male" | "female";
  preferredLanguage?: SupportedLanguage;
}

export interface OwnerVerificationData {
  fullName: string;
  phoneNumber: string;
}

const USERS_STORAGE_KEY = "users";
const CURRENT_USER_KEY = "currentUser";
const BOOTSTRAP_KEY = "stayviet-user-bootstrap-v1";
const BOOTSTRAP_SESSION_KEY = "stayviet-user-bootstrap-session-v1";

let usersCache: UserData[] | null = null;

function isLocalFallbackDisabled(): boolean {
  return getLocalFallbackMode() === "off";
}

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
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

/**
 * 사용자 목록 — 서버 동기화 후에는 메모리 캐시, 그 전에는 LocalStorage
 */
export function getUsers(): UserData[] {
  if (usersCache !== null) return usersCache;
  return readLocalStorageUsersFallback();
}

/**
 * 캐시 + LocalStorage 미러(레거시·폴백용)
 */
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

/** 서버에서 받은 `UserData`로 로컬 users 캐시 한 건을 갱신 (KYC·프로필 PATCH 직후 즉시 UI 반영용) */
export function mergeAuthenticatedUserIntoCache(user: UserData): void {
  const list = getUsers();
  const idx = list.findIndex((u) => u.uid === user.uid);
  const next =
    idx === -1 ? [...list, user] : list.map((u, i) => (i === idx ? user : u));
  setUsersCacheAndStorage(next);
}

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
      if (!res.ok) {
        if (isClientAuthErrorStatus(res.status)) {
          return false;
        }
        throw new Error(String(res.status));
      }
      const data = (await res.json()) as {
        users?: UserData[];
        page?: { hasMore?: boolean; nextOffset?: number };
      };
      const chunk = Array.isArray(data.users) ? data.users : [];
      users.push(...chunk);
      const hasMore = Boolean(data.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(data.page?.nextOffset ?? offset + chunk.length);
    }
    setUsersCacheAndStorage(users);
    return true;
  } catch (e) {
    usersCache = null;
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
      message: "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    });
    return false;
  }
}

/**
 * 관리자 세션으로 전체 회원 목록을 캐시에 올림 (`getUsers()`·배지 등)
 */
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
      if (!res.ok) return false;
      const data = (await res.json()) as {
        users?: UserData[];
        page?: { hasMore?: boolean; nextOffset?: number };
      };
      const chunk = Array.isArray(data.users) ? data.users : [];
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

/**
 * 최초 로드: DB가 비어 있고 로컬에만 users가 있으면 import 후 다시 동기화
 */
export async function bootstrapUsersFromServer(): Promise<void> {
  if (typeof window === "undefined") return;

  const ok = await refreshUsersFromServer();
  if (!ok) return;

  if (isLedgerBootstrapDone(BOOTSTRAP_KEY, BOOTSTRAP_SESSION_KEY)) return;

  if (getUsers().length > 0) {
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
      await refreshUsersFromServer();
    }
  } catch (e) {
    /* 네트워크 오류 시 BOOTSTRAP_KEY 미설정 → 이후 재시도 */
    console.warn("[users] bootstrap import failed", e);
    emitUserFacingSyncError({
      area: "users",
      action: "bootstrap",
      message: "사용자 초기 동기화에 실패했습니다. 네트워크를 확인 후 다시 시도해주세요.",
    });
  }
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
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(uid: string | null): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  if (uid) localStorage.setItem(CURRENT_USER_KEY, uid);
  else localStorage.removeItem(CURRENT_USER_KEY);
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
    // 목록 동기화 직전·실패 등으로 캐시에 아직 없을 수 있음 — 여기서 세션을 지우면 가입 직후 홈에서 로그아웃처럼 보임
    return null;
  }
  if (current.blocked) {
    setCurrentUser(null);
    return null;
  }
  return current;
}

function signUpLocalFallback(data: SignUpData) {
  const users = getUsers();
  if (users.find((u) => u.email === data.email)) {
    return {
      error: {
        code: "auth/email-already-in-use",
        message: "Email already in use",
      },
    };
  }
  const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const userData: UserData = {
    uid,
    email: data.email,
    password: simpleHash(data.password),
    ...(data.fullName && { displayName: data.fullName }),
    ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    ...(data.gender && { gender: data.gender }),
    ...(data.preferredLanguage && { preferredLanguage: data.preferredLanguage }),
    role: "user",
    is_owner: false,
    verification_status: "none",
    createdAt: now,
    updatedAt: now,
  };
  users.push(userData);
  saveUsers(users);
  setCurrentUser(uid);
  return {
    user: {
      uid,
      email: data.email,
      displayName: data.fullName || null,
      updateProfile: async (profile: { displayName?: string }) => {
        await updateUserData(uid, { displayName: profile.displayName });
      },
    },
  };
}

export async function signUpWithEmail(data: SignUpData): Promise<any> {
  try {
    const res = await fetch("/api/app/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (res.status === 503) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "server/unavailable",
            message: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          },
        };
      }
      return signUpLocalFallback(data);
    }

    if (!res.ok) {
      if (json?.error?.code) return { error: json.error };
      return {
        error: {
          code: "auth/unknown",
          message: json?.error || "Signup failed",
        },
      };
    }

    const user = json as UserData;
    setCurrentUser(user.uid);
    mergeAuthenticatedUserIntoCache(user);
    await refreshUsersFromServer();

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        updateProfile: async (profile: { displayName?: string }) => {
          await updateUserData(user.uid, { displayName: profile.displayName });
        },
      },
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    if (isLocalFallbackDisabled()) {
      return {
        error: {
          code: "network/error",
          message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        },
      };
    }
    return signUpLocalFallback(data);
  }
}

function signInLocalFallback(email: string, password: string) {
  const users = getUsers();
  const hashedPassword = simpleHash(password);
  const userByEmail = users.find((u) => u.email === email);
  if (!userByEmail) {
    return { error: { code: "auth/user-not-found", message: "User not found" } };
  }
  if (userByEmail.blocked) {
    return {
      error: {
        code: "auth/user-blocked",
        message: "This account is blocked by admin",
      },
    };
  }
  if (userByEmail.password !== hashedPassword) {
    return { error: { code: "auth/wrong-password", message: "Wrong password" } };
  }
  setCurrentUser(userByEmail.uid);
  return {
    user: {
      uid: userByEmail.uid,
      email: userByEmail.email,
      displayName: userByEmail.displayName || null,
    },
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<any> {
  try {
    const res = await fetch("/api/app/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (res.status === 503) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "server/unavailable",
            message: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          },
        };
      }
      return signInLocalFallback(email, password);
    }

    if (!res.ok) {
      if (json?.error?.code) return { error: json.error };
      return {
        error: {
          code: "auth/unknown",
          message: json?.error?.message || "Login failed",
        },
      };
    }

    const user = json.user as UserData;
    setCurrentUser(user.uid);
    mergeAuthenticatedUserIntoCache(user);
    await refreshUsersFromServer();

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
      },
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    if (isLocalFallbackDisabled()) {
      return {
        error: {
          code: "network/error",
          message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        },
      };
    }
    return signInLocalFallback(email, password);
  }
}

export async function signInWithGoogle(): Promise<any> {
  throw new Error(
    "Google 로그인은 현재 사용할 수 없습니다. 이메일/비밀번호로 로그인해주세요.",
  );
}

export async function signInWithFacebook(): Promise<any> {
  throw new Error(
    "Facebook 로그인은 현재 사용할 수 없습니다. 이메일/비밀번호로 로그인해주세요.",
  );
}

export async function signOut(): Promise<void> {
  setCurrentUser(null);
}

async function updateUserLocal(
  uid: string,
  updates: Partial<UserData>,
): Promise<void> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.uid === uid);
  if (userIndex === -1) throw new Error("User not found");
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveUsers(users);
}

export async function updateUserData(
  uid: string,
  updates: Partial<UserData>,
): Promise<void> {
  try {
    const res = await fetch(
      `/api/app/users/${encodeURIComponent(uid)}`,
      withAppActor({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    );
    if (res.ok) {
      await refreshUsersFromServer();
      return;
    }
    if (res.status === 503 || res.status === 404) {
      if (isLocalFallbackDisabled()) {
        throw new Error("server_unavailable");
      }
      await updateUserLocal(uid, updates);
      return;
    }
    throw new Error("Update failed");
  } catch {
    if (isLocalFallbackDisabled()) {
      throw new Error("server_unavailable");
    }
    await updateUserLocal(uid, updates);
  }
}

export async function updateUserEmail(
  uid: string,
  newEmail: string,
): Promise<void> {
  await updateUserData(uid, { email: newEmail });
}

export async function updateUserPhoneNumber(
  uid: string,
  newPhoneNumber: string,
): Promise<void> {
  await updateUserData(uid, { phoneNumber: newPhoneNumber });
}

export async function updateUserLanguage(
  uid: string,
  language: SupportedLanguage,
): Promise<void> {
  await updateUserData(uid, { preferredLanguage: language });
}

export async function verifyOwner(
  uid: string,
  data: OwnerVerificationData,
): Promise<void> {
  await updateUserData(uid, {
    displayName: data.fullName,
    phoneNumber: data.phoneNumber,
    is_owner: true,
  });
}

export async function deleteAccount(uid: string): Promise<void> {
  try {
    const res = await fetch(
      `/api/app/users/${encodeURIComponent(uid)}`,
      withAppActor({ method: "DELETE" }),
    );
    if (res.ok) {
      await refreshUsersFromServer();
      setCurrentUser(null);
      return;
    }
    if (isLocalFallbackDisabled()) {
      throw new Error("server_unavailable");
    }
  } catch {
    if (isLocalFallbackDisabled()) {
      throw new Error("server_unavailable");
    }
    /* fall through */
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.uid === uid);
  if (userIndex === -1) throw new Error("User not found");
  users.splice(userIndex, 1);
  saveUsers(users);
  setCurrentUser(null);
}
