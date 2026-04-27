"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardCopy, Download, Info, Trash2 } from "lucide-react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AdminLogSeverity } from "@/lib/adminSystemLog";
import { getDateLocaleForLanguage, getUIText, type UITextKey } from "@/utils/i18n";
import type { AdminSystemLogPageViewModel, AdminSystemLogFilter } from "../hooks/useAdminSystemLogPage";

const FILTER_ORDER: AdminSystemLogFilter[] = ["new", "all", "error", "warning", "info"];

const FILTER_KEY: Record<AdminSystemLogFilter, UITextKey> = {
  new: "adminSystemLogFilterNew",
  all: "adminSystemLogFilterAll",
  error: "adminSystemLogFilterError",
  warning: "adminSystemLogFilterWarning",
  info: "adminSystemLogFilterInfo",
};

function severityStyle(s: AdminLogSeverity): string {
  switch (s) {
    case "error":
      return "text-red-700 bg-red-50";
    case "warning":
      return "text-amber-800 bg-amber-50";
    default:
      return "text-slate-700 bg-slate-100";
  }
}

function formatTime(ts: number, locale: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

type Props = { vm: AdminSystemLogPageViewModel };

export function AdminSystemLogPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const locale = getDateLocaleForLanguage(currentLanguage);
  const {
    filter,
    setFilter,
    page: _page,
    setPage,
    filtered,
    pageRows,
    pageCount,
    safePage,
    unseenNew,
    downloadCsv,
    copyRow,
    clearEphemeral,
    clearPersistent,
  } = vm;

  void _page;

  const countLine = getUIText("adminSystemLogCountLine", currentLanguage)
    .replace("{{shown}}", String(filtered.length))
    .replace("{{page}}", String(safePage + 1))
    .replace("{{pages}}", String(pageCount));

  return (
    <AdminRouteGuard>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {getUIText("adminSystemLogTitle", currentLanguage)}
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
            {getUIText("adminSystemLogChecklist", currentLanguage)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {getUIText(FILTER_KEY[f], currentLanguage)}
              {f === "new" && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? "99+" : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              {getUIText("adminSystemLogExportCsv", currentLanguage)}
            </button>
            <button
              type="button"
              onClick={clearEphemeral}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {getUIText("adminSystemLogClearEphemeral", currentLanguage)}
            </button>
            <button
              type="button"
              onClick={clearPersistent}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {getUIText("adminSystemLogClearPersistent", currentLanguage)}
            </button>
          </span>
        </div>

        <p className="text-xs text-slate-500">{countLine}</p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColTime", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColSeverity", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColCategory", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColMessage", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColBookingId", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColOwnerId", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColSnapshot", currentLanguage)}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {getUIText("adminSystemLogColCopy", currentLanguage)}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    {getUIText("adminSystemLogEmpty", currentLanguage)}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600 tabular-nums">
                      {formatTime(row.ts, locale)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${severityStyle(row.severity)}`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td className="max-w-[100px] truncate px-3 py-2 text-slate-700">
                      {row.category ?? "—"}
                    </td>
                    <td className="max-w-md px-3 py-2 text-slate-800">{row.message}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs">
                      {row.bookingId ? (
                        <span className="flex flex-col gap-0.5">
                          <span title={row.bookingId}>{row.bookingId}</span>
                          <Link
                            href="/admin/settlements"
                            className="text-blue-600 hover:underline"
                            title={getUIText("adminSystemLogSettlementsSearchHint", currentLanguage)}
                          >
                            {getUIText("adminSystemLogLinkSettlements", currentLanguage)}
                          </Link>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-slate-600">
                      {row.ownerId ? (
                        <Link
                          href={`/admin/users/${encodeURIComponent(row.ownerId)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.ownerId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-[11px] text-slate-600">
                      {row.snapshot ? JSON.stringify(row.snapshot) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void copyRow(row)}
                        className="inline-flex rounded p-1 text-slate-600 hover:bg-slate-200"
                        title={getUIText("adminSystemLogCopyRowTitle", currentLanguage)}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-40"
            >
              {getUIText("adminPaginationPrev", currentLanguage)}
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-40"
            >
              {getUIText("adminPaginationNext", currentLanguage)}
            </button>
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {getUIText("adminSystemLogFooterNote", currentLanguage)}
        </p>
      </div>
    </AdminRouteGuard>
  );
}
