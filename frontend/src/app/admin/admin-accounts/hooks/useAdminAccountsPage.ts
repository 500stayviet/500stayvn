"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyPermissionMap,
  normalizePermissionMap,
  type AdminPermissionMap,
} from "@/lib/adminPermissions";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

export type AdminAccountRow = {
  id: string;
  username: string;
  nickname: string;
  isSuperAdmin: boolean;
  permissions: AdminPermissionMap;
  createdAt: string;
  updatedAt?: string;
};

/**
 * 관리자 계정 목록/생성/프로필·권한 편집.
 */
export function useAdminAccountsPage() {
  const { me, refresh } = useAdminMe();
  const [list, setList] = useState<AdminAccountRow[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftPerms, setDraftPerms] = useState<AdminPermissionMap>(emptyPermissionMap());
  const [showCreate, setShowCreate] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createNickname, setCreateNickname] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createSuper, setCreateSuper] = useState(false);

  const [editUsername, setEditUsername] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editCurrentPassword, setEditCurrentPassword] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadErr("");
    const r = await fetch("/api/admin/accounts", { credentials: "include" });
    if (!r.ok) {
      setLoadErr("목록을 불러오지 못했습니다.");
      return;
    }
    const j = (await r.json()) as { accounts: AdminAccountRow[] };
    setList(
      j.accounts.map((a) => ({
        ...a,
        nickname: typeof a.nickname === "string" ? a.nickname : "",
        permissions: normalizePermissionMap(a.permissions),
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(["admin_account"], () => {
    void load();
  });

  const selected = useMemo(
    () => (selectedId ? list.find((a) => a.id === selectedId) ?? null : null),
    [list, selectedId],
  );

  useEffect(() => {
    if (!selected) {
      setEditUsername("");
      setEditNickname("");
      setEditNewPassword("");
      setEditCurrentPassword("");
      setDraftPerms(emptyPermissionMap());
      return;
    }
    setEditUsername(selected.username);
    setEditNickname(selected.nickname ?? "");
    setEditNewPassword("");
    setEditCurrentPassword("");
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
    setLoadErr("");
    try {
      const r = await fetch(`/api/admin/accounts/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setLoadErr((e as { error?: string }).error || "저장 실패");
        return;
      }
      setEditNewPassword("");
      setEditCurrentPassword("");
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
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: draftPerms }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setLoadErr((e as { error?: string }).error || "저장 실패");
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
    setLoadErr("");
    const perms = emptyPermissionMap();
    const r = await fetch("/api/admin/accounts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
      setLoadErr((err as { error?: string }).error || "생성 실패");
      return;
    }
    setShowCreate(false);
    setCreateUsername("");
    setCreateNickname("");
    setCreatePassword("");
    setCreateSuper(false);
    await load();
  };

  const toggleSuper = async (row: AdminAccountRow, next: boolean) => {
    if (row.id === me?.id && !next) return;
    setSaving(true);
    setLoadErr("");
    try {
      const r = await fetch(`/api/admin/accounts/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuperAdmin: next }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setLoadErr((err as { error?: string }).error || "변경 실패");
        return;
      }
      await load();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return {
    me,
    list,
    loadErr,
    selectedId,
    setSelectedId,
    saving,
    draftPerms,
    setDraftPerms,
    showCreate,
    setShowCreate,
    createUsername,
    setCreateUsername,
    createNickname,
    setCreateNickname,
    createPassword,
    setCreatePassword,
    createSuper,
    setCreateSuper,
    editUsername,
    setEditUsername,
    editNickname,
    setEditNickname,
    editNewPassword,
    setEditNewPassword,
    editCurrentPassword,
    setEditCurrentPassword,
    profileOpen,
    setProfileOpen,
    selected,
    saveProfile,
    savePermissions,
    createAccount,
    toggleSuper,
  };
}

export type AdminAccountsPageViewModel = ReturnType<typeof useAdminAccountsPage>;
