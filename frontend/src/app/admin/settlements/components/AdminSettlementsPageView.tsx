"use client";

import { type ReactNode, useMemo } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import AdminSettlementStyleCard from "@/components/admin/AdminSettlementStyleCard";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { ADMIN_ACTION_REASON_SETTLEMENT_HOLD } from "@/lib/adminActionReasons";
import { patchSettlementServer } from "@/lib/api/settlementServer";
import type { SettlementCandidate } from "@/lib/api/adminFinance";
import type { AdminSettlementsPageViewModel, SettlementTab } from "../hooks/useAdminSettlementsPage";

type Props = { vm: AdminSettlementsPageViewModel };

export function AdminSettlementsPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const TABS: { id: SettlementTab; label: string }[] = useMemo(
    () => [
      { id: "request", label: getUIText("adminSettlementsTabRequest", currentLanguage) },
      { id: "pending", label: getUIText("adminSettlementsTabPending", currentLanguage) },
      { id: "approved", label: getUIText("adminSettlementsTabApproved", currentLanguage) },
      { id: "held", label: getUIText("adminSettlementsTabHeld", currentLanguage) },
    ],
    [currentLanguage],
  );

  const {
    admin,
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    listMode,
    setListMode,
    runBookingAction,
    bumpQueue,
    requestList,
    needApproval,
    approvedActive,
    heldRows,
    displayList,
    filteredList: _filteredList,
    emptyMsg,
    listEmptyMsg,
    emailMap,
    unseenRequest,
    unseenPending,
  } = vm;

  void _filteredList;

  const column = (list: SettlementCandidate[], body: ReactNode, emptyOverride?: string) => (
    <div className="flex min-h-0 max-h-[min(75vh,920px)] flex-col overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40">
      <div className="space-y-2 p-2">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{emptyOverride ?? emptyMsg}</p>
        ) : (
          body
        )}
      </div>
    </div>
  );

  const card = (
    row: SettlementCandidate,
    amountClass: string,
    actions: ReactNode,
    headerBadge?: ReactNode,
  ) => {
    const email = emailMap.get(row.ownerId) || "—";
    const addressLine = (row.propertyAddress || "").trim() || row.propertyTitle || "—";
    return (
      <AdminSettlementStyleCard
        key={row.bookingId}
        checkInDate={row.checkInDate}
        checkOutDate={row.checkOutDate}
        addressLine={addressLine}
        email={email}
        ownerUid={row.ownerId}
        amount={row.amount}
        amountClassName={amountClass}
        headerBadge={headerBadge}
        footer={actions}
      />
    );
  };

  const contractEndedBadge = (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      {getUIText("adminSettlementsBadgeContractEnded", currentLanguage)}
    </span>
  );

  const introLine = getUIText("adminSettlementsIntroLine", currentLanguage)
    .replace("{{req}}", String(requestList.length))
    .replace("{{pend}}", String(needApproval.length))
    .replace("{{appr}}", String(approvedActive.length))
    .replace("{{held}}", String(heldRows.length));

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {getUIText("adminSettlementsPageTitle", currentLanguage)}
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
                {t.id === "request"
                  ? requestList.length
                  : t.id === "pending"
                    ? needApproval.length
                    : t.id === "approved"
                      ? approvedActive.length
                      : heldRows.length}
                )
              </span>
              {t.id === "request" && unseenRequest > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenRequest > 99 ? "99+" : unseenRequest}
                </span>
              ) : null}
              {t.id === "pending" && unseenPending > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenPending > 99 ? "99+" : unseenPending}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="settlement-search" className="sr-only">
            {getUIText("search", currentLanguage)}
          </label>
          <input
            id="settlement-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getUIText("adminContractsSearchPlaceholder", currentLanguage)}
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            {getUIText("adminSettlementsSearchHint", currentLanguage)}
          </p>
        </div>

        {(tab === "request" || tab === "pending") && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2">
            <span
              className="text-xs font-semibold text-slate-700"
              title={getUIText("adminSettlementsFilterTitle24hBaseline", currentLanguage)}
            >
              {getUIText("adminSettlementsFilterLabel", currentLanguage)}
            </span>
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                title={getUIText("adminSettlementsSortRemainingAscTitle", currentLanguage)}
                onClick={() => setListMode("remaining-asc")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "remaining-asc"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {getUIText("adminSettlementsSortRemainingAsc", currentLanguage)}
              </button>
              <button
                type="button"
                title={getUIText("adminSettlementsSortRemainingDescTitle", currentLanguage)}
                onClick={() => setListMode("remaining-desc")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "remaining-desc"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {getUIText("adminSettlementsSortRemainingDesc", currentLanguage)}
              </button>
              <button
                type="button"
                title={getUIText("adminSettlementsFilterElapsed24hTitle", currentLanguage)}
                onClick={() => setListMode("elapsed-24h")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "elapsed-24h"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {getUIText("adminSettlementsFilterElapsed24h", currentLanguage)}
              </button>
            </div>
          </div>
        )}

        {column(
          displayList,
          displayList.map((row) => {
            if (tab === "request") {
              return card(
                row,
                "text-emerald-600",
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      runBookingAction(row.bookingId, async () => {
                        void patchSettlementServer({
                          action: "move_to_pending",
                          bookingId: row.bookingId,
                        }).then((ok) => {
                          if (!ok) return;
                          bumpQueue();
                          refreshAdminBadges();
                          void load();
                        });
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {getUIText("adminSettlementActionMoveToPending", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      runBookingAction(row.bookingId, async () => {
                        const ok = await patchSettlementServer({
                          action: "hold_pending",
                          bookingId: row.bookingId,
                          ownerId: row.ownerId,
                          amount: row.amount,
                          reason: ADMIN_ACTION_REASON_SETTLEMENT_HOLD,
                        });
                        if (!ok) return;
                        bumpQueue();
                        await load();
                      });
                    }}
                    className="rounded-md border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    {getUIText("adminWithdrawalHold", currentLanguage)}
                  </button>
                </div>,
                contractEndedBadge,
              );
            }
            if (tab === "pending") {
              return card(
                row,
                "text-emerald-600",
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      runBookingAction(row.bookingId, async () => {
                        const ok = await patchSettlementServer({
                          action: "approve",
                          bookingId: row.bookingId,
                          ownerId: row.ownerId,
                          amount: row.amount,
                        });
                        if (!ok) return;
                        bumpQueue();
                        await load();
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {getUIText("adminWithdrawalApprove", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      runBookingAction(row.bookingId, async () => {
                        const ok = await patchSettlementServer({
                          action: "hold_pending",
                          bookingId: row.bookingId,
                          ownerId: row.ownerId,
                          amount: row.amount,
                          reason: ADMIN_ACTION_REASON_SETTLEMENT_HOLD,
                        });
                        if (!ok) return;
                        bumpQueue();
                        await load();
                      });
                    }}
                    className="rounded-md border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    {getUIText("adminWithdrawalHold", currentLanguage)}
                  </button>
                </div>,
                contractEndedBadge,
              );
            }
            if (tab === "approved") {
              return card(
                row,
                "text-emerald-600",
                <button
                  type="button"
                  onClick={() => {
                    if (!admin?.username) return;
                    runBookingAction(row.bookingId, async () => {
                      void patchSettlementServer({
                        action: "hold_approved",
                        bookingId: row.bookingId,
                        reason: ADMIN_ACTION_REASON_SETTLEMENT_HOLD,
                      }).then((ok) => {
                        if (!ok) return;
                        void load();
                      });
                    });
                  }}
                  className="mt-2 w-full rounded-md bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {getUIText("adminWithdrawalHold", currentLanguage)}
                </button>,
              );
            }
            return card(
              row,
              "text-amber-600",
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!admin?.username) return;
                    runBookingAction(row.bookingId, async () => {
                      const ok = await patchSettlementServer({
                        action: "resume_request",
                        bookingId: row.bookingId,
                      });
                      if (!ok) return;
                      bumpQueue();
                      await load();
                    });
                  }}
                  className="rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {getUIText("adminSettlementResumeToRequest", currentLanguage)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!admin?.username) return;
                    runBookingAction(row.bookingId, async () => {
                      void patchSettlementServer({
                        action: "resume_pending",
                        bookingId: row.bookingId,
                      }).then((ok) => {
                        if (!ok) return;
                        bumpQueue();
                        void load();
                      });
                    });
                  }}
                  className="rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {getUIText("adminSettlementResumeToPending", currentLanguage)}
                </button>
              </div>,
            );
          }),
          listEmptyMsg,
        )}
      </div>
    </AdminRouteGuard>
  );
}
