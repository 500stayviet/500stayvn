import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'admin_session_v2';

export { COOKIE_NAME as ADMIN_SESSION_COOKIE_NAME };

type Payload = { adminId: string; exp: number };

function hmac(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function encodeAdminSessionToken(adminId: string, expMs: number, secret: string): string {
  const payload: Payload = { adminId, exp: expMs };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const mac = hmac(body, secret);
  return `${body}.${mac}`;
}

export function decodeAdminSessionToken(token: string, secret: string): Payload | null {
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return null;
  const body = token.slice(0, lastDot);
  const mac = token.slice(lastDot + 1);
  const expected = hmac(body, secret);
  try {
    const a = Buffer.from(mac, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let parsed: Payload;
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8');
    parsed = JSON.parse(json) as Payload;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.adminId !== 'string' || typeof parsed.exp !== 'number') return null;
  if (Date.now() > parsed.exp) return null;
  return parsed;
}

export function getAdminSessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SESSION_SECRET must be set (min 16 chars) in production');
  }
  return 'dev-admin-session-secret-change-me';
}
