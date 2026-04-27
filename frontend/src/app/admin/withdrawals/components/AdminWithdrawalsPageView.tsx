"use client";

import { type ReactNode, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ADMIN_ACTION_REASON_WITHDRAWAL_HOLD,
  ADMIN_ACTION_REASON_WITHDRAWAL_REJECT,
} from "@/lib/adminActionReasons";
import { getUIText } from "@/utils/i18n";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import type { ServerWithdrawalRequest } from "@/lib/api/financeServer";
import type { AdminWithdrawalsPageViewModel, WithdrawalTab } from "../hooks/useAdminWithdrawalsPage";

type Props = { vm: AdminWithdrawalsPageViewModel };

export function AdminWithdrawalsPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    pending,
    processing,
    held,
    completed,
    rejected,
    filteredList,
    emptyMsg,
    emailMap,
    normalizeStatus,
    runWithdrawalAction,
    patchWithdrawal,
  } = vm;

  const TABS: { id: WithdrawalTab; label: string }[] = useMemo(
    () => [
      { id: "pending", label: getUIText("adminWithdrawalsTabPending", currentLanguage) },
      { id: "processing", label: getUIText("adminWithdrawalsTabProcessing", currentLanguage) },
      { id: "rejected", label: getUIText("adminWithdrawalsTabRejected", currentLanguage) },
      { id: "completed", label: getUIText("adminWithdrawalsTabCompleted", currentLanguage) },
      { id: "held", label: getUIText("adminWithdrawalsTabHeld", currentLanguage) },
    ],
    [currentLanguage],
  );

  const introLine = useMemo(
    () =>
      getUIText("adminWithdrawalsIntroLine", currentLanguage)
        .replace("{{pending}}", String(pending.length))
        .replace("{{processing}}", String(processing.length))
        .replace("{{rejected}}", String(rejected.length))
        .replace("{{completed}}", String(completed.length))
        .replace("{{held}}", String(held.length)),
    [currentLanguage, pending.length, processing.length, rejected.length, completed.length, held.length],
  );

  const column = (list: ServerWithdrawalRequest[], body: ReactNode) => (
    <div className="flex min-h-0 max-h-[min(75vh,920px)] flex-col overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40">
      <div className="space-y-2 p-2">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{emptyMsg}</p>
        ) : (
          body
        )}
      </div>
    </div>
  );

  const ownerBlock = (r: ServerWithdrawalRequest) => {
    const email = emailMap.get(r.ownerId) || "—";
    return (
      <>
        <p className="font-mono text-[11px] text-slate-800 break-all">UID: {r.ownerId}</p>
        <p className="text-xs text-slate-700 break-all">{email}</p>
      </>
    );
  };

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {getUIText("adminWithdrawalsPageTitle", currentLanguage)}
            </h1>
            <p className="text-sm text-slate-500">{introLine}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            {loading
              ? getUIText("adminCommonLoading", currentLanguage)
              : getUIText("adminCommonRefresh", currentLanguage)}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums opacity-80">
                (
                {t.id === "pending"
                  ? pending.length
                  : t.id === "processing"
                    ? processing.length
                    : t.id === "rejected"
                      ? rejected.length
                      : t.id === "completed"
                        ? completed.length
                        : held.length}
                )
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="withdrawal-search" className="sr-only">
            {getUIText("search", currentLanguage)}
          </label>
          <input
            id="withdrawal-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getUIText("adminWithdrawalsSearchPlaceholder", currentLanguage)}
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            {getUIText("adminWithdrawalsSearchHint", currentLanguage)}
          </p>
        </div>

        {column(
          filteredList,
          filteredList.map((r) => {
            if (tab === "pending") {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        void runWithdrawalAction(() => patchWithdrawal(r.id, "approve"))
                      }
                      className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      {getUIText("adminWithdrawalApprove", currentLanguage)}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runWithdrawalAction(() => patchWithdrawal(r.id, "reject", ADMIN_ACTION_REASON_WITHDRAWAL_REJECT))
                      }
                      className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      {getUIText("adminWithdrawalReject", currentLanguage)}
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === "processing") {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        void runWithdrawalAction(() => patchWithdrawal(r.id, "hold", ADMIN_ACTION_REASON_WITHDRAWAL_HOLD))
                      }
                      className="rounded-md bg-amber-50 py-1.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {getUIText("adminWithdrawalHold", currentLanguage)}
                    </button>
                    <button
                      type="button"
                      onClick={() => void runWithdrawalAction(() => patchWithdrawal(r.id, "complete"))}
                      className="rounded-md bg-green-600 py-1.5 text-[10px] font-semibold text-white hover:bg-green-700"
                    >
                      {getUIText("adminWithdrawalComplete", currentLanguage)}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runWithdrawalAction(() => patchWithdrawal(r.id, "reject", ADMIN_ACTION_REASON_WITHDRAWAL_REJECT))
                      }
                      className="rounded-md bg-red-50 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                    >
                      {getUIText("adminWithdrawalReject", currentLanguage)}
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === "held") {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => void runWithdrawalAction(() => patchWithdrawal(r.id, "resume"))}
                      className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      {getUIText("adminWithdrawalResume", currentLanguage)}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runWithdrawalAction(() => patchWithdrawal(r.id, "reject", ADMIN_ACTION_REASON_WITHDRAWAL_REJECT))
                      }
                      className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      {getUIText("adminWithdrawalReject", currentLanguage)}
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === "completed" || tab === "rejected") {
              const st = normalizeStatus(r.status);
              return (
                <div key={r.id} className="rounded-md border border-slate-100 bg-white p-2.5 text-sm">
                  {ownerBlock(r)}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        st === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {st === "completed"
                        ? getUIText("adminWithdrawalBadgeCompleted", currentLanguage)
                        : getUIText("adminWithdrawalBadgeRejected", currentLanguage)}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          }),
        )}
      </div>
    </AdminRouteGuard>
  );
}
