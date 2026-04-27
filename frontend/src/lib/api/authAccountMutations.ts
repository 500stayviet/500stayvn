/**
 * 인증 — 쓰기(Write): 가입·로그인·프로필·탈퇴
 */

import { getLocalFallbackMode } from "@/lib/runtime/localFallbackPolicy";
import { withAppActor } from "@/lib/api/withAppActor";
import { parseAppUserPayload } from "@/lib/api/appUserApiParse";
import { readResponseJsonOrMarker } from "@/lib/api/appResponseRead";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { UserData, SignUpData, OwnerVerificationData } from "./authTypes";
import { getSharedAppUsersRefresh } from "./authUserSyncQuery";
import {
  getUsers,
  mergeAuthenticatedUserIntoCache,
  saveUsers,
  setAppSessionUserId,
} from "./authState";

function isLocalFallbackDisabled(): boolean {
  return getLocalFallbackMode() === "off";
}

type AuthErrorShape = { code: string; message: string };

type SignUpSuccessUser = {
  uid: string;
  email: string;
  displayName: string | null;
  updateProfile: (profile: { displayName?: string }) => Promise<void>;
};

export type SignUpWithEmailResult =
  | { user: SignUpSuccessUser }
  | { error: AuthErrorShape };

export type SignInWithEmailResult =
  | {
      user: {
        uid: string;
        email: string;
        displayName: string | null;
      };
    }
  | { error: AuthErrorShape };

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i += 1) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
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
  setAppSessionUserId(uid);
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

export async function signUpWithEmail(
  data: SignUpData,
): Promise<SignUpWithEmailResult> {
  try {
    const res = await fetch("/api/app/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await readResponseJsonOrMarker(res);
    if (json && typeof json === "object" && "__jsonParseError" in json) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "network/error",
            message: "",
          },
        };
      }
      return signUpLocalFallback(data);
    }

    if (res.status === 503) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "server/unavailable",
            message: "",
          },
        };
      }
      return signUpLocalFallback(data);
    }

    if (!res.ok) {
      const err = json as { error?: { code?: string; message?: string } };
      if (err?.error?.code) {
        return {
          error: {
            code: err.error.code,
            message: err.error.message ?? "",
          },
        };
      }
      return {
        error: {
          code: "auth/unknown",
          message:
            typeof err?.error === "object" && err.error && "message" in err.error
              ? String((err.error as { message?: string }).message)
              : "Signup failed",
        },
      };
    }

    const user = parseAppUserPayload(json);
    if (!user) {
      return {
        error: { code: "auth/unknown", message: "Invalid signup response" },
      };
    }
    setAppSessionUserId(user.uid);
    mergeAuthenticatedUserIntoCache(user);
    await getSharedAppUsersRefresh();

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
  } catch (error: unknown) {
    console.error("Sign up error:", error);
    if (isLocalFallbackDisabled()) {
      return {
        error: {
          code: "network/error",
          message: "",
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
  setAppSessionUserId(userByEmail.uid);
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
): Promise<SignInWithEmailResult> {
  try {
    const res = await fetch("/api/app/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await readResponseJsonOrMarker(res);
    if (json && typeof json === "object" && "__jsonParseError" in json) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "network/error",
            message: "",
          },
        };
      }
      return signInLocalFallback(email, password);
    }

    if (res.status === 503) {
      if (isLocalFallbackDisabled()) {
        return {
          error: {
            code: "server/unavailable",
            message: "",
          },
        };
      }
      return signInLocalFallback(email, password);
    }

    if (!res.ok) {
      const err = json as { error?: { code?: string; message?: string } };
      if (err?.error?.code) {
        return {
          error: {
            code: err.error.code,
            message: err.error.message ?? "",
          },
        };
      }
      return {
        error: {
          code: "auth/unknown",
          message: err?.error?.message || "Login failed",
        },
      };
    }

    const user =
      parseAppUserPayload(json) ||
      (json && typeof json === "object" && "user" in json
        ? ((json as { user: UserData }).user as UserData)
        : null);
    if (!user?.uid) {
      return {
        error: { code: "auth/unknown", message: "Invalid login response" },
      };
    }
    setAppSessionUserId(user.uid);
    mergeAuthenticatedUserIntoCache(user);
    await getSharedAppUsersRefresh();

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
      },
    };
  } catch (error: unknown) {
    console.error("Sign in error:", error);
    if (isLocalFallbackDisabled()) {
      return {
        error: {
          code: "network/error",
          message: "",
        },
      };
    }
    return signInLocalFallback(email, password);
  }
}

export async function signInWithGoogle(): Promise<unknown> {
  throw new Error("Google sign-in is not available. Use email and password.");
}

export async function signInWithFacebook(): Promise<never> {
  throw new Error("Facebook sign-in is not available. Use email and password.");
}

export async function signOut(): Promise<void> {
  setAppSessionUserId(null);
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
      await getSharedAppUsersRefresh();
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
      await getSharedAppUsersRefresh();
      setAppSessionUserId(null);
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
  setAppSessionUserId(null);
}
