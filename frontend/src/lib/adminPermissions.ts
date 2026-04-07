import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';

export type AdminPermissionMap = Record<string, boolean>;

export const ADMIN_PERMISSION_IDS: string[] = ADMIN_NAV_ITEMS.map((i) => i.permissionId);

export function emptyPermissionMap(): AdminPermissionMap {
  const m: AdminPermissionMap = {};
  for (const id of ADMIN_PERMISSION_IDS) m[id] = false;
  return m;
}

export function normalizePermissionMap(raw: unknown): AdminPermissionMap {
  const base = emptyPermissionMap();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  for (const id of ADMIN_PERMISSION_IDS) {
    if (id in raw && typeof (raw as AdminPermissionMap)[id] === 'boolean') {
      base[id] = (raw as AdminPermissionMap)[id];
    }
  }
  return base;
}

export function adminHasPermission(
  isSuperAdmin: boolean,
  permissions: AdminPermissionMap,
  permissionId: string
): boolean {
  if (isSuperAdmin) return true;
  return !!permissions[permissionId];
}

/** 로그인만 있으면 되는 경로 (권한 매핑 없음) */
export function isAdminAuthOnlyPath(pathname: string): boolean {
  return pathname.startsWith('/admin/no-access');
}

/** pathname → 필요 권한 id (로그인만 필요하면 null) */
export function requiredPermissionForPathname(pathname: string): string | 'super' | null {
  if (pathname === '/admin/login') return null;
  if (isAdminAuthOnlyPath(pathname)) return null;
  if (pathname.startsWith('/admin/admin-accounts')) return 'super';
  if (pathname === '/admin' || pathname.startsWith('/admin/dashboard')) return 'dashboard';
  for (const item of ADMIN_NAV_ITEMS) {
    if (item.href === '/admin') continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.permissionId;
    }
  }
  return 'dashboard';
}

/** 대시보드 권한이 없을 때 /admin 리다이렉트 대신 사용 */
export function firstNavHrefForAdmin(
  isSuperAdmin: boolean,
  permissions: AdminPermissionMap
): string {
  if (isSuperAdmin) return '/admin';
  for (const item of ADMIN_NAV_ITEMS) {
    if (adminHasPermission(isSuperAdmin, permissions, item.permissionId)) {
      return item.href;
    }
  }
  return '/admin/no-access';
}
