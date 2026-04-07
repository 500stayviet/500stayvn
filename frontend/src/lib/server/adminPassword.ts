import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;

/** 서버 전용 — 관리자 비밀번호 단방향 저장 */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const key = scryptSync(password, salt, KEY_LEN);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyAdminPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const key = scryptSync(password, salt, expected.length);
    return expected.length === key.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
