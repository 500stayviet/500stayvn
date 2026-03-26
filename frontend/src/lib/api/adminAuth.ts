'use client';

const ADMIN_SESSION_KEY = 'admin_session_v1';

export interface AdminSession {
  username: string;
  loggedInAt: string;
}

function getConfiguredAdminCredential() {
  const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin1234';
  return { username, password };
}

export function loginAdmin(username: string, password: string): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  const cred = getConfiguredAdminCredential();
  if (username !== cred.username || password !== cred.password) {
    return false;
  }

  const session: AdminSession = {
    username,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return true;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminSession();
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

