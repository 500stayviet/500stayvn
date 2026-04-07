import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_SESSION_COOKIE_NAME,
  decodeAdminSessionToken,
  encodeAdminSessionToken,
  getAdminSessionSecret,
} from '@/lib/server/adminSessionToken';
import { normalizePermissionMap, type AdminPermissionMap } from '@/lib/adminPermissions';
import { hashAdminPassword, verifyAdminPassword } from '@/lib/server/adminPassword';

export { hashAdminPassword, verifyAdminPassword };

export type AdminAccountDTO = {
  id: string;
  username: string;
  isSuperAdmin: boolean;
  permissions: AdminPermissionMap;
};

const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;

function cookieHeaderValue(name: string, cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) return decodeURIComponent(p.slice(prefix.length));
  }
  return null;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (fromCookie) return fromCookie;
  return cookieHeaderValue(ADMIN_SESSION_COOKIE_NAME, request.headers.get('cookie'));
}

export async function getAdminFromRequest(request: NextRequest): Promise<AdminAccountDTO | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  let payload: { adminId: string; exp: number } | null;
  try {
    payload = decodeAdminSessionToken(token, getAdminSessionSecret());
  } catch {
    return null;
  }
  if (!payload) return null;
  const row = await prisma.adminAccount.findUnique({ where: { id: payload.adminId } });
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    isSuperAdmin: row.isSuperAdmin,
    permissions: normalizePermissionMap(row.permissions),
  };
}

export function adminSessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/' as const,
    maxAge: maxAgeSec,
  };
}

export function createSignedSessionValue(adminId: string): string {
  const exp = Date.now() + SESSION_MAX_MS;
  return encodeAdminSessionToken(adminId, exp, getAdminSessionSecret());
}
