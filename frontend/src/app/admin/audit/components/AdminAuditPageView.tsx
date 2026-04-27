"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { getAuditTabLabel, getUnifiedAuditRowLabel } from "@/lib/adminAuditView";
import { getUIText } from "@/utils/i18n";
import type { AdminAuditPageViewModel, AuditTabId } from "../hooks/useAdminAuditPage";

type Props = { vm: AdminAuditPageViewModel };

export function AdminAuditPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    unseenNew,
    displayedRows,
    countForTab,
    actorLabel,
    refresh,
    auditTabs,
  } = vm;

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {getUIText("adminAuditPageTitle", currentLanguage)}
            </h1>
            <p className="text-sm text-slate-500">{getUIText("adminAuditPageIntro", currentLanguage)}</p>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            {getUIText("adminCommonRefresh", currentLanguage)}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {auditTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {getAuditTabLabel(t.id, currentLanguage)}
              <span className="ml-1 tabular-nums opacity-80">({countForTab(t.id as AuditTabId)})</span>
              {t.id === "new" && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? "99+" : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="audit-search" className="sr-only">
            {getUIText("search", currentLanguage)}
          </label>
          <input
            id="audit-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getUIText("adminAuditSearchPlaceholder", currentLanguage)}
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">{getUIText("adminAuditSearchHint", currentLanguage)}</p>
        </div>

        {displayedRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {getUIText("adminAuditEmpty", currentLanguage)}
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-2 py-2">{getUIText("adminAuditColAction", currentLanguage)}</th>
                    <th className="px-2 py-2 text-right">{getUIText("adminAuditColAmount", currentLanguage)}</th>
                    <th className="px-2 py-2">{getUIText("adminAuditColOwnerTarget", currentLanguage)}</th>
                    <th className="px-2 py-2">{getUIText("adminAuditColRef", currentLanguage)}</th>
                    <th className="px-2 py-2">{getUIText("adminAuditColActor", currentLanguage)}</th>
                    <th className="px-2 py-2">{getUIText("adminAuditColNote", currentLanguage)}</th>
                    <th className="px-2 py-2">{getUIText("adminAuditColTime", currentLanguage)}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-2 py-1.5 font-medium text-slate-900">
                        {getUnifiedAuditRowLabel(r, currentLanguage)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono text-sm font-semibold ${
                          r.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {r.amount !== 0 ? (
                          <>
                            {r.amount >= 0 ? "+" : ""}
                            {r.amount.toLocaleString()} ₫
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.ownerId}
                      </td>
                      <td className="max-w-[100px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.refId || "-"}
                      </td>
                      <td className="max-w-[150px] truncate px-2 py-1.5 text-xs text-slate-600">
                        {actorLabel(r.createdBy)}
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-1.5 text-xs text-slate-500">{r.note || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 md:hidden">
              {displayedRows.map((r) => (
                <div key={r.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {getUnifiedAuditRowLabel(r, currentLanguage)}
                    </p>
                    {r.amount !== 0 ? (
                      <p className={`font-bold ${r.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.amount >= 0 ? "+" : ""}
                        {r.amount.toLocaleString()} ₫
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {getUIText("adminAuditAmountDash", currentLanguage)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {getUIText("adminAuditMobileTarget", currentLanguage)} {r.ownerId}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getUIText("adminAuditColRef", currentLanguage)}: {r.refId || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getUIText("adminAuditMobileActor", currentLanguage)} {actorLabel(r.createdBy)}
                  </p>
                  {r.note ? (
                    <p className="text-xs text-slate-500">
                      {getUIText("adminAuditColNote", currentLanguage)}: {r.note}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
