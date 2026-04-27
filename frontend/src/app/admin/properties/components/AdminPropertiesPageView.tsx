"use client";

import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { isAdminPropertyNewUnseen } from "@/lib/adminAckState";
import { isPropertyNew } from "@/lib/adminNewUtils";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { AdminInventoryFilter } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";
import { getUIText, type UITextKey } from "@/utils/i18n";
import type { AdminPropertiesPageViewModel } from "../hooks/useAdminPropertiesPage";

function listingStatusLabel(p: PropertyData, lang: SupportedLanguage): { text: string; className: string } {
  if (p.hidden) {
    return { text: getUIText("adminListingHidden", lang), className: "bg-amber-100 text-amber-800" };
  }
  if (p.status === "INACTIVE_SHORT_TERM") {
    return { text: getUIText("adminListingAdPaused", lang), className: "bg-orange-100 text-orange-900" };
  }
  if (p.status === "active") {
    return { text: getUIText("adminListingLive", lang), className: "bg-emerald-100 text-emerald-800" };
  }
  return { text: p.status || "—", className: "bg-slate-100 text-slate-700" };
}

type Props = { vm: AdminPropertiesPageViewModel };

export function AdminPropertiesPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
    query,
    setQuery,
    filter,
    setFilter,
    page,
    setPage,
    rows,
    loading,
    nAll,
    nNew,
    nListed,
    nPaused,
    nHidden,
    totalPages,
    pagedRows,
    propertyAckAt,
    unseenNew,
    onRowClick,
    unhideProperty,
    hideProperty,
  } = vm;

  const FILTER_TABS: { id: AdminInventoryFilter; labelKey: UITextKey }[] = [
    { id: "new", labelKey: "adminFilterNew" },
    { id: "all", labelKey: "adminFilterAll" },
    { id: "listed", labelKey: "adminPropFilterListed" },
    { id: "paused", labelKey: "adminPropFilterPaused" },
    { id: "hidden", labelKey: "adminPropFilterHidden" },
  ];

  const tabCount = (id: AdminInventoryFilter) =>
    id === "all"
      ? nAll
      : id === "new"
        ? nNew
        : id === "listed"
          ? nListed
          : id === "paused"
            ? nPaused
            : nHidden;

  const intro = getUIText("adminPropertiesIntroLine", currentLanguage)
    .replace("{{nAll}}", String(nAll))
    .replace("{{nNew}}", String(nNew))
    .replace("{{nListed}}", String(nListed))
    .replace("{{nPaused}}", String(nPaused))
    .replace("{{nHidden}}", String(nHidden));

  const pageLine = getUIText("adminPaginationLine", currentLanguage)
    .replace("{{page}}", String(page))
    .replace("{{total}}", String(totalPages))
    .replace("{{count}}", String(rows.length));

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {getUIText("adminPropertiesTitle", currentLanguage)}
            </h1>
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
            placeholder={getUIText("adminPropertiesSearchPlaceholder", currentLanguage)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">
            {getUIText("adminPropertiesSearchHint", currentLanguage)}
          </p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {getUIText("adminUiLoadingEllipsis", currentLanguage)}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {getUIText("adminUiNoQueryResults", currentLanguage)}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {filter === "new" ? (
                    <th className="w-10 px-2 py-2 text-center" title={getUIText("adminPingTitleUnseen", currentLanguage)}>
                      {getUIText("adminColAlert", currentLanguage)}
                    </th>
                  ) : null}
                  <th className="px-3 py-2">{getUIText("adminPropColTitle", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminPropColAddress", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminPropColOwner", currentLanguage)}</th>
                  <th className="px-3 py-2">{getUIText("adminPropColId", currentLanguage)}</th>
                  <th className="w-28 px-3 py-2">{getUIText("adminColStatus", currentLanguage)}</th>
                  <th className="w-36 px-3 py-2 text-right">{getUIText("adminColActions", currentLanguage)}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((p) => {
                  const st = listingStatusLabel(p, currentLanguage);
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/80"
                      onClick={() => onRowClick(p)}
                    >
                      {filter === "new" ? (
                        <td className="px-2 py-2 text-center align-middle">
                          {isPropertyNew(p) ? (
                            isAdminPropertyNewUnseen(p, propertyAckAt) ? (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500"
                                title={getUIText("adminDotUnseen", currentLanguage)}
                                aria-label={getUIText("adminAriaUnseenNewProperty", currentLanguage)}
                              />
                            ) : (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300"
                                title={getUIText("adminDotAcked", currentLanguage)}
                                aria-label={getUIText("adminAriaAckNewProperty", currentLanguage)}
                              />
                            )
                          ) : null}
                        </td>
                      ) : null}
                      <td className="max-w-[200px] truncate px-3 py-2 font-medium text-slate-900">
                        {p.title || "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-slate-700">{p.address || "—"}</td>
                      <td className="max-w-[140px] truncate font-mono text-xs text-slate-600">
                        {p.ownerId || "—"}
                      </td>
                      <td className="max-w-[120px] truncate font-mono text-xs text-slate-500">{p.id || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.hidden ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              unhideProperty(p);
                            }}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {getUIText("adminPropUnhide", currentLanguage)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              hideProperty(p);
                            }}
                            className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            {getUIText("adminPropHide", currentLanguage)}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 ? (
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

        <p className="mt-4 text-xs text-slate-400">
          {getUIText("adminPropertiesHiddenReasonLabel", currentLanguage)}{" "}
          {getUIText("adminPropertyHiddenComplianceReason", currentLanguage)}
        </p>
      </div>
    </AdminRouteGuard>
  );
}
