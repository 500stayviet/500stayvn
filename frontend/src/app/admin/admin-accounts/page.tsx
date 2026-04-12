'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';
import {
  emptyPermissionMap,
  normalizePermissionMap,
  type AdminPermissionMap,
} from '@/lib/adminPermissions';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

type AccountRow = {
  id: string;
  username: string;
  nickname: string;
  isSuperAdmin: boolean;
  permissions: AdminPermissionMap;
  createdAt: string;
  updatedAt?: string;
};

export default function AdminAccountsPage() {
  const { me, refresh } = useAdminMe();
  const [list, setList] = useState<AccountRow[]>([]);
  const [loadErr, setLoadErr] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftPerms, setDraftPerms] = useState<AdminPermissionMap>(emptyPermissionMap());
  const [showCreate, setShowCreate] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createNickname, setCreateNickname] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSuper, setCreateSuper] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadErr('');
    const r = await fetch('/api/admin/accounts', { credentials: 'include' });
    if (!r.ok) {
      setLoadErr('목록을 불러오지 못했습니다.');
      return;
    }
    const j = (await r.json()) as { accounts: AccountRow[] };
    setList(
      j.accounts.map((a) => ({
        ...a,
        nickname: typeof a.nickname === 'string' ? a.nickname : '',
        permissions: normalizePermissionMap(a.permissions),
      }))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(['admin_account'], () => {
    void load();
  });

  const selected = useMemo(
    () => (selectedId ? list.find((a) => a.id === selectedId) ?? null : null),
    [list, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setEditUsername('');
      setEditNickname('');
      setEditNewPassword('');
      setEditCurrentPassword('');
      setDraftPerms(emptyPermissionMap());
      return;
    }
    setEditUsername(selected.username);
    setEditNickname(selected.nickname ?? '');
    setEditNewPassword('');
    setEditCurrentPassword('');
    setProfileOpen(false);
    if (selected.isSuperAdmin) {
      setDraftPerms(emptyPermissionMap());
    } else {
      setDraftPerms({ ...normalizePermissionMap(selected.permissions) });
    }
  }, [selected]);

  const saveProfile = async () => {
    if (!selected) return;
    const body: Record<string, string> = {
      username: editUsername.trim(),
      nickname: editNickname.trim().slice(0, 64),
    };
    if (editNewPassword.length > 0) {
      body.newPassword = editNewPassword;
      if (selected.id === me?.id) {
        body.currentPassword = editCurrentPassword;
      }
    }
    setSaving(true);
    setLoadErr('');
    try {
      const r = await fetch(`/api/admin/accounts/${selected.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setLoadErr((e as { error?: string }).error || '저장 실패');
        return;
      }
      setEditNewPassword('');
      setEditCurrentPassword('');
      await load();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async () => {
    if (!selected || selected.isSuperAdmin || me?.id === selected.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/accounts/${selected.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: draftPerms }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setLoadErr((e as { error?: string }).error || '저장 실패');
        return;
      }
      await load();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadErr('');
    const perms = emptyPermissionMap();
    const r = await fetch('/api/admin/accounts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: createUsername.trim(),
        nickname: createNickname.trim().slice(0, 64),
        password: createPassword,
        isSuperAdmin: createSuper,
        permissions: perms,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setLoadErr((err as { error?: string }).error || '생성 실패');
      return;
    }
    setShowCreate(false);
    setCreateUsername('');
    setCreateNickname('');
    setCreatePassword('');
    setCreateSuper(false);
    await load();
  };

  const toggleSuper = async (row: AccountRow, next: boolean) => {
    if (row.id === me?.id && !next) return;
    setSaving(true);
    setLoadErr('');
    try {
      const r = await fetch(`/api/admin/accounts/${row.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: next }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setLoadErr((err as { error?: string }).error || '변경 실패');
        return;
      }
      await load();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const displayLabel = (row: AccountRow) => {
    const nick = (row.nickname ?? '').trim();
    return nick ? nick : row.username;
  };

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">관리자 계정</h1>
            <p className="text-sm text-slate-500">
              슈퍼만 접근 · 계정 클릭 후 아이디·닉네임·비밀번호·권한 수정
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            새 관리자
          </button>
        </div>

        {loadErr ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadErr}
          </p>
        ) : null}

        {showCreate ? (
          <form
            onSubmit={createAccount}
            className="mb-6 rounded-lg border border-slate-200 bg-slate-50/80 p-4"
          >
            <h2 className="mb-3 text-sm font-bold text-slate-800">새 계정</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">아이디</label>
                <input
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  required
                  minLength={3}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">닉네임</label>
                <input
                  value={createNickname}
                  onChange={(e) => setCreateNickname(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  maxLength={64}
                  placeholder="표시 이름"
                  autoComplete="off"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  비밀번호 (8자 이상)
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={createSuper}
                onChange={(e) => setCreateSuper(e.target.checked)}
              />
              슈퍼 관리자로 생성
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                생성
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                취소
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">계정 목록</h2>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {list.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                      selectedId === row.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <span className="font-medium text-slate-900">
                      {displayLabel(row)}{' '}
                      <span className="font-normal text-slate-500">
                        ({row.username})
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {row.isSuperAdmin ? '슈퍼' : '일반'} · {row.id.slice(0, 8)}…
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            {!selected ? (
              <p className="text-sm text-slate-500">왼쪽에서 계정을 클릭하세요.</p>
            ) : (
              <>
                <div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800"
                  >
                    <span>계정 정보</span>
                    <span className="text-xs text-slate-500">{profileOpen ? '접기' : '펼치기'}</span>
                  </button>
                  {profileOpen ? (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        아이디·닉네임·비밀번호는 슈퍼만 이 화면에서 수정합니다.
                      </p>
                      <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            닉네임
                          </label>
                          <input
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            maxLength={64}
                            disabled={saving}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            아이디
                          </label>
                          <input
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            disabled={saving}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            새 비밀번호 (비우면 유지)
                          </label>
                          <input
                            type="password"
                            value={editNewPassword}
                            onChange={(e) => setEditNewPassword(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            minLength={8}
                            disabled={saving}
                            autoComplete="new-password"
                          />
                        </div>
                        {selected.id === me?.id && editNewPassword.length > 0 ? (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              현재 비밀번호
                            </label>
                            <input
                              type="password"
                              value={editCurrentPassword}
                              onChange={(e) => setEditCurrentPassword(e.target.value)}
                              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                              disabled={saving}
                              autoComplete="current-password"
                            />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void saveProfile()}
                          className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {saving ? '저장 중…' : '계정 정보 저장'}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-slate-800">역할·권한</h2>
                  {selected.isSuperAdmin ? (
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      슈퍼는 모든 메뉴에 접근합니다.
                      {selected.id !== me?.id ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void toggleSuper(selected, false)}
                          className="mt-3 block w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                        >
                          일반 관리자로 변경
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <label className="mb-3 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.isSuperAdmin}
                          onChange={(e) => void toggleSuper(selected, e.target.checked)}
                          disabled={saving || selected.id === me?.id}
                        />
                        슈퍼 관리자
                      </label>
                      <p className="mb-2 text-xs text-slate-500">
                        체크된 메뉴만 상단 내비에 표시됩니다.
                      </p>
                      <ul className="space-y-2 rounded-lg border border-slate-200 p-3">
                        {ADMIN_NAV_ITEMS.map((item) => (
                          <li key={item.permissionId}>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                              <input
                                type="checkbox"
                                checked={!!draftPerms[item.permissionId]}
                                onChange={(e) =>
                                  setDraftPerms((p) => ({
                                    ...p,
                                    [item.permissionId]: e.target.checked,
                                  }))
                                }
                                disabled={saving || selected.id === me?.id}
                              />
                              {item.label}{' '}
                              <span className="text-xs text-slate-400">
                                ({item.permissionId})
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      {selected.id !== me?.id ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void savePermissions()}
                          className="mt-3 w-full rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
                        >
                          {saving ? '저장 중…' : '권한만 저장'}
                        </button>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">
                          본인 계정의 메뉴 권한은 여기서 수정하지 않습니다.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
