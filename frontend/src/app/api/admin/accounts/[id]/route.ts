import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest, hashAdminPassword, verifyAdminPassword } from '@/lib/server/adminAuthServer';
import { ADMIN_PERMISSION_IDS, normalizePermissionMap } from '@/lib/adminPermissions';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getAdminFromRequest(request);
  if (!me?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const row = await prisma.adminAccount.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      isSuperAdmin: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    account: { ...row, permissions: normalizePermissionMap(row.permissions) },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const me = await getAdminFromRequest(request);
  if (!me?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;

  let body: {
    permissions?: Record<string, boolean>;
    isSuperAdmin?: boolean;
    newPassword?: string;
    currentPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const target = await prisma.adminAccount.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: {
    isSuperAdmin?: boolean;
    permissions?: object;
    passwordHash?: string;
  } = {};

  if (body.newPassword !== undefined) {
    const next = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (next.length < 8) {
      return NextResponse.json({ error: 'newPassword는 8자 이상' }, { status: 400 });
    }
    if (target.id === me.id) {
      const cur = typeof body.currentPassword === 'string' ? body.currentPassword : '';
      if (!verifyAdminPassword(cur, target.passwordHash)) {
        return NextResponse.json({ error: 'currentPassword가 올바르지 않습니다' }, { status: 400 });
      }
    }
    updates.passwordHash = hashAdminPassword(next);
  }

  if (body.isSuperAdmin !== undefined && typeof body.isSuperAdmin === 'boolean') {
    if (target.id === me.id && body.isSuperAdmin === false) {
      return NextResponse.json({ error: '본인 슈퍼 권한은 여기서 해제할 수 없습니다' }, { status: 400 });
    }
    if (body.isSuperAdmin === false && target.isSuperAdmin) {
      const otherSupers = await prisma.adminAccount.count({
        where: { isSuperAdmin: true, id: { not: target.id } },
      });
      if (otherSupers < 1) {
        return NextResponse.json({ error: '마지막 슈퍼 관리자는 승격 해제할 수 없습니다' }, { status: 400 });
      }
    }
    updates.isSuperAdmin = body.isSuperAdmin;
  }

  if (body.permissions !== undefined && typeof body.permissions === 'object' && body.permissions) {
    if (target.isSuperAdmin) {
      // 슈퍼는 영역 권한 맵 무시 — 저장만 허용하지 않음
    } else {
      const current = normalizePermissionMap(target.permissions);
      for (const key of ADMIN_PERMISSION_IDS) {
        if (key in body.permissions && typeof body.permissions[key] === 'boolean') {
          current[key] = body.permissions[key];
        }
      }
      updates.permissions = current;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const row = await prisma.adminAccount.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      username: true,
      isSuperAdmin: true,
      permissions: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    account: { ...row, permissions: normalizePermissionMap(row.permissions) },
  });
}
