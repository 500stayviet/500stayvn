import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { normalizePermissionMap } from '@/lib/adminPermissions';

export const dynamic = 'force-dynamic';

/**
 * 로컬/도구에서 세션·권한 확인: curl -s -b "admin_session_v2=..." http://localhost:3000/api/admin/me
 * 브라우저에서는 로그인 후 같은 출처 쿠키가 자동 전송됩니다.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    id: admin.id,
    username: admin.username,
    isSuperAdmin: admin.isSuperAdmin,
    permissions: normalizePermissionMap(admin.permissions),
  });
}
