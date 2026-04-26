import type { UserData } from '@/lib/api/auth';
import { unwrapAppApiData } from '@/lib/api/appApiEnvelope';

export function parseAppUsersListPayload(json: unknown): {
  users: UserData[];
  page?: { hasMore?: boolean; nextOffset?: number };
} {
  const root = unwrapAppApiData<{
    users?: UserData[];
    page?: { hasMore?: boolean; nextOffset?: number };
  }>(json);
  return {
    users: Array.isArray(root.users) ? root.users : [],
    page: root.page,
  };
}

/** `GET|PATCH|DELETE /api/app/users/[id]` · `POST /api/app/users` 성공 본문 — 봉투·레거시. */
export function parseAppUserPayload(json: unknown): UserData | null {
  if (!json || typeof json !== 'object') return null;
  const data = unwrapAppApiData<{ user?: UserData } | UserData>(json);
  if (!data || typeof data !== 'object') return null;
  if ('user' in data && data.user) return data.user;
  if ('uid' in data && 'email' in data) return data as UserData;
  return null;
}
