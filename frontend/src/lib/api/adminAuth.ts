'use client';

/** @deprecated 쿠키 세션 사용 — {@link useAdminMe} / {@link fetchAdminMe} 참고 */
export interface AdminSession {
  username: string;
  loggedInAt: string;
}

export type AdminMeResponse = {
  id: string;
  username: string;
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
};

export async function fetchAdminMe(): Promise<AdminMeResponse | null> {
  const r = await fetch('/api/admin/me', { credentials: 'include' });
  if (!r.ok) return null;
  return (await r.json()) as AdminMeResponse;
}

export async function loginAdmin(username: string, password: string): Promise<boolean> {
  const r = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: username.trim(), password }),
  });
  return r.ok;
}

export async function logoutAdmin(): Promise<void> {
  await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
}
