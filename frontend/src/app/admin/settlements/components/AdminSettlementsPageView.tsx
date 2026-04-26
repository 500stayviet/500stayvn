"use client";

import { type ReactNode } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import AdminSettlementStyleCard from "@/components/admin/AdminSettlementStyleCard";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { patchSettlementServer } from "@/lib/api/settlementServer";
import type { SettlementCandidate } from "@/lib/api/adminFinance";
import type { AdminSettlementsPageViewModel, SettlementTab } from "../hooks/useAdminSettlementsPage";

const TABS: { id: SettlementTab; label: string }[] = [
  { id: "request", label: "승인 요청" },
  { id: "pending", label: "승인 대기" },
  { id: "approved", label: "승인 완료" },
  { id: "held", label: "보류" },
];

type Props = { vm: AdminSettlementsPageViewModel };

export function AdminSettlementsPageView({ vm }: Props) {
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
      계약종료 후 유입
    </span>
  );

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">정산 승인</h1>
            <p className="text-sm text-slate-500">
              승인 요청은 체크아웃 이후(계약종료)에만 생성됩니다. 확인 후 승인 대기로 넘긴 뒤 정산 승인·보류를
              처리하세요. 체크아웃+24시간 후 승인 시 출금 가능 금액에 반영됩니다. · 요청 {requestList.length} ·
              대기 {needApproval.length} · 완료 {approvedActive.length} · 보류 {heldRows.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            {loading ? "불러오는 중..." : "새로고침"}
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
            검색
          </label>
          <input
            id="settlement-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 예약·매물명, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(승인 요청·승인 대기·승인 완료·보류) 안에서만 검색됩니다.
          </p>
        </div>

        {(tab === "request" || tab === "pending") && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2">
            <span
              className="text-xs font-semibold text-slate-700"
              title="기준 시점: 체크아웃 종료 후 24시간. 세 탭 중 하나만 선택됩니다."
            >
              필터
            </span>
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                title="마감이 빠른 순(남은 시간 오름차순·초과 건 우선)"
                onClick={() => setListMode("remaining-asc")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "remaining-asc"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                남은 시간 ↑
              </button>
              <button
                type="button"
                title="마감이 늦은 순(남은 시간 내림차순)"
                onClick={() => setListMode("remaining-desc")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "remaining-desc"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                남은 시간 ↓
              </button>
              <button
                type="button"
                title="체크아웃 종료+24시간이 지난 건만 보기(남은 시간 ↑·↓와 동시 선택 불가)"
                onClick={() => setListMode("elapsed-24h")}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  listMode === "elapsed-24h"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                24시 경과
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
                    승인 대기로
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
                          reason: "관리자 보류",
                        });
                        if (!ok) return;
                        bumpQueue();
                        await load();
                      });
                    }}
                    className="rounded-md border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    보류
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
                    승인
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
                          reason: "관리자 보류",
                        });
                        if (!ok) return;
                        bumpQueue();
                        await load();
                      });
                    }}
                    className="rounded-md border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    보류
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
                        reason: "관리자 보류",
                      }).then((ok) => {
                        if (!ok) return;
                        void load();
                      });
                    });
                  }}
                  className="mt-2 w-full rounded-md bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  보류
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
                  복구(승인요청)
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
                  복구(승인대기)
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
