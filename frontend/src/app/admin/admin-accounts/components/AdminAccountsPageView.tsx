"use client";

import { Plus } from "lucide-react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { ADMIN_NAV_ITEMS, type AdminNavItem } from "@/lib/adminNav";
import { ADMIN_NAV_HREF_TO_LABEL_KEY } from "@/lib/adminNavI18nMaps";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import type { AdminAccountRow, AdminAccountsPageViewModel } from "../hooks/useAdminAccountsPage";

function navItemLabel(item: AdminNavItem, lang: SupportedLanguage): string {
  const k = ADMIN_NAV_HREF_TO_LABEL_KEY[item.href];
  return k ? getUIText(k, lang) : item.label;
}

type Props = { vm: AdminAccountsPageViewModel };

function displayLabel(row: AdminAccountRow) {
  const nick = (row.nickname ?? "").trim();
  return nick ? nick : row.username;
}

export function AdminAccountsPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
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
  } = vm;

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {getUIText("adminAccountsTitle", currentLanguage)}
            </h1>
            <p className="text-sm text-slate-500">{getUIText("adminAccountsIntro", currentLanguage)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {getUIText("adminAccountsNewButton", currentLanguage)}
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
            <h2 className="mb-3 text-sm font-bold text-slate-800">
              {getUIText("adminAccountsFormNewTitle", currentLanguage)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {getUIText("adminAccountsLabelUsername", currentLanguage)}
                </label>
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
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {getUIText("adminAccountsLabelNickname", currentLanguage)}
                </label>
                <input
                  value={createNickname}
                  onChange={(e) => setCreateNickname(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  maxLength={64}
                  placeholder={getUIText("adminAccountsNicknamePlaceholder", currentLanguage)}
                  autoComplete="off"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {getUIText("adminAccountsPasswordMin", currentLanguage)}
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
              {getUIText("adminAccountsCreateSuper", currentLanguage)}
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                {getUIText("adminAccountsCreateSubmit", currentLanguage)}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                {getUIText("cancel", currentLanguage)}
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              {getUIText("adminAccountsListTitle", currentLanguage)}
            </h2>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {list.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                      selectedId === row.id ? "bg-slate-100" : ""
                    }`}
                  >
                    <span className="font-medium text-slate-900">
                      {displayLabel(row)}{" "}
                      <span className="font-normal text-slate-500">({row.username})</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {row.isSuperAdmin
                        ? getUIText("adminAccountsRoleSuper", currentLanguage)
                        : getUIText("adminAccountsRoleNormal", currentLanguage)}{" "}
                      · {row.id.slice(0, 8)}…
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            {!selected ? (
              <p className="text-sm text-slate-500">{getUIText("adminAccountsSelectPrompt", currentLanguage)}</p>
            ) : (
              <>
                <div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800"
                  >
                    <span>{getUIText("adminAccountsProfileToggle", currentLanguage)}</span>
                    <span className="text-xs text-slate-500">
                      {profileOpen
                        ? getUIText("adminAccountsProfileCollapse", currentLanguage)
                        : getUIText("adminAccountsProfileExpand", currentLanguage)}
                    </span>
                  </button>
                  {profileOpen ? (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        {getUIText("adminAccountsProfileNote", currentLanguage)}
                      </p>
                      <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            {getUIText("adminAccountsEditNickname", currentLanguage)}
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
                            {getUIText("adminAccountsEditUsername", currentLanguage)}
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
                            {getUIText("adminAccountsEditNewPassword", currentLanguage)}
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
                              {getUIText("adminAccountsEditCurrentPassword", currentLanguage)}
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
                          {saving
                            ? getUIText("adminAccountsSaving", currentLanguage)
                            : getUIText("adminAccountsSaveProfile", currentLanguage)}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-slate-800">
                    {getUIText("adminAccountsRolesHeading", currentLanguage)}
                  </h2>
                  {selected.isSuperAdmin ? (
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      {getUIText("adminAccountsSuperAllMenus", currentLanguage)}
                      {selected.id !== me?.id ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void toggleSuper(selected, false)}
                          className="mt-3 block w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                        >
                          {getUIText("adminAccountsDemoteSuper", currentLanguage)}
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
                        {getUIText("adminAccountsSuperCheckbox", currentLanguage)}
                      </label>
                      <p className="mb-2 text-xs text-slate-500">
                        {getUIText("adminAccountsPermHint", currentLanguage)}
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
                              {navItemLabel(item, currentLanguage)}{" "}
                              <span className="text-xs text-slate-400">({item.permissionId})</span>
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
                          {saving
                            ? getUIText("adminAccountsSaving", currentLanguage)
                            : getUIText("adminAccountsSavePerms", currentLanguage)}
                        </button>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">
                          {getUIText("adminAccountsSelfPermNote", currentLanguage)}
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
