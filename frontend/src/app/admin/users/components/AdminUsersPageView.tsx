"use client";

import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { isAdminUserNewUnseen } from "@/lib/adminAckState";
import { isUserNew } from "@/lib/adminNewUtils";
import type { AdminUserFilter } from "@/lib/api/adminModeration";
import { getUIText, type UITextKey } from "@/utils/i18n";
import type { AdminUsersPageViewModel } from "../hooks/useAdminUsersPage";

type Props = { vm: AdminUsersPageViewModel };

export function AdminUsersPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
    query,
    setQuery,
    filter,
    setFilter,
    page,
    setPage,
    userAckAt,
    rows,
    pagedRows,
    nAll,
    nNew,
    nActive,
    nBlocked,
    totalPages,
    unseenNew,
    onRowClick,
    unblockUser,
    blockUser,
  } = vm;

  const FILTER_TABS: { id: AdminUserFilter; labelKey: UITextKey }[] = [
    { id: "new", labelKey: "adminFilterNew" },
    { id: "all", labelKey: "adminFilterAll" },
    { id: "active", labelKey: "adminUserFilterActive" },
    { id: "blocked", labelKey: "adminUserFilterBlocked" },
  ];

  const tabCount = (id: AdminUserFilter) =>
    id === "all" ? nAll : id === "new" ? nNew : id === "active" ? nActive : nBlocked;

  const intro = getUIText("adminUsersIntroLine", currentLanguage)
    .replace("{{nNew}}", String(nNew))
    .replace("{{nAll}}", String(nAll))
    .replace("{{nActive}}", String(nActive))
    .replace("{{nBlocked}}", String(nBlocked));

  const pageLine = getUIText("adminPaginationLine", currentLanguage)
    .replace("{{page}}", String(page))
    .replace("{{total}}", String(totalPages))
    .replace("{{count}}", String(rows.length));

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{getUIText("adminUsersTitle", currentLanguage)}</h1>
            <p className="text-sm text-slate-500">{intro}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {getUIText(t.labelKey, currentLanguage)}
              <span className="ml-1 tabular-nums opacity-80">({tabCount(t.id)})</span>
              {t.id === "new" && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? "99+" : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4 max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getUIText("adminUsersSearchPlaceholder", currentLanguage)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">{getUIText("adminUsersSearchHint", currentLanguage)}</p>
        </div>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {getUIText("adminUiNoQueryResults", currentLanguage)}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {filter === "new" ? (
                    <th className="w-10 px-2 py-2 text-center" title={getUIText("adminPingTitleUnseen", currentLanguage)}>
                      {getUIText("adminColAlert", currentLanguage)}
                    </th>
                  ) : null}
                  <th className="px-3 py-2">{getUIText("adminColName", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminColEmail", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminColPhone", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminColUid", currentLanguage)}</th>
                  <th className="w-24 px-3 py-2">{getUIText("adminColStatus", currentLanguage)}</th>
                  <th className="w-48 px-3 py-2 text-right">{getUIText("adminColActions", currentLanguage)}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((u) => (
                  <tr
                    key={u.uid}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/80"
                    onClick={() => onRowClick(u)}
                  >
                    {filter === "new" ? (
                      <td className="px-2 py-2 text-center align-middle">
                        {isUserNew(u) ? (
                          isAdminUserNewUnseen(u, userAckAt) ? (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500"
                              title={getUIText("adminDotUnseen", currentLanguage)}
                              aria-label={getUIText("adminAriaUnseenNewUser", currentLanguage)}
                            />
                          ) : (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300"
                              title={getUIText("adminDotAcked", currentLanguage)}
                              aria-label={getUIText("adminAriaAckNewUser", currentLanguage)}
                            />
                          )
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 font-medium text-slate-900">{u.displayName || "—"}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">{u.email}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 text-slate-700">{u.phoneNumber || "—"}</td>
                    <td className="max-w-[180px] truncate font-mono text-xs text-slate-600">{u.uid}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.blocked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {u.blocked
                          ? getUIText("adminStatusBlocked", currentLanguage)
                          : getUIText("adminStatusNormal", currentLanguage)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {u.blocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void unblockUser(u.uid);
                            }}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {getUIText("adminActionRestore", currentLanguage)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void blockUser(u.uid);
                            }}
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            {getUIText("adminActionBlock", currentLanguage)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 ? (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {getUIText("adminPaginationPrev", currentLanguage)}
            </button>
            <p className="font-mono text-xs text-slate-600">{pageLine}</p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {getUIText("adminPaginationNext", currentLanguage)}
            </button>
          </div>
        ) : null}
      </div>
    </AdminRouteGuard>
  );
}
