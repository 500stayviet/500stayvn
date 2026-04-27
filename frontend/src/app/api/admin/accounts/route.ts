import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest, hashAdminPassword } from '@/lib/server/adminAuthServer';
import { ADMIN_PERMISSION_IDS, emptyPermissionMap, normalizePermissionMap } from '@/lib/adminPermissions';

export const dynamic = 'force-dynamic';

function isValidUsername(s: string): boolean {
  return /^[a-zA-Z0-9._-]{3,64}$/.test(s);
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.adminAccount.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      nickname: true,
      isSuperAdmin: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({
    accounts: rows.map((r) => ({
      ...r,
      permissions: normalizePermissionMap(r.permissions),
    })),
  });
}

export async function POST(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    username?: string;
    nickname?: string;
    password?: string;
    isSuperAdmin?: boolean;
    permissions?: Record<string, boolean>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const nickname =
    typeof body.nickname === 'string' ? body.nickname.trim().slice(0, 64) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidUsername(username) || password.length < 8) {
    return NextResponse.json({ error: 'admin_account_invalid_input' }, { status: 400 });
  }

  const isSuperAdmin = body.isSuperAdmin === true;
  const base = emptyPermissionMap();
  if (body.permissions && typeof body.permissions === 'object') {
    for (const id of ADMIN_PERMISSION_IDS) {
      if (id in body.permissions && typeof body.permissions[id] === 'boolean') {
        base[id] = body.permissions[id];
      }
    }
  }

  try {
    const created = await prisma.adminAccount.create({
      data: {
        username,
        nickname,
        passwordHash: hashAdminPassword(password),
        isSuperAdmin,
        permissions: isSuperAdmin ? {} : base,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        isSuperAdmin: true,
        permissions: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      account: {
        ...created,
        permissions: normalizePermissionMap(created.permissions),
      },
    });
  } catch {
    return NextResponse.json({ error: 'admin_username_taken' }, { status: 409 });
  }
}
