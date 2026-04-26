"use client";

import { type ReactNode } from "react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import AdminSettlementStyleCard from "@/components/admin/AdminSettlementStyleCard";
import type { BookingData } from "@/lib/api/bookings";
import type { AdminContractsPageViewModel, ContractTab } from "../hooks/useAdminContractsPage";

const TABS: { id: ContractTab; label: string }[] = [
  { id: "new", label: "신규" },
  { id: "sealed", label: "계약체결" },
  { id: "inProgress", label: "계약시작" },
  { id: "completed", label: "계약종료" },
];

type Props = { vm: AdminContractsPageViewModel };

export function AdminContractsPageView({ vm }: Props) {
  const {
    loading,
    load,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    unseenNew,
    sealedList,
    inProgressList,
    completedList,
    newList,
    filteredList,
    emailMap,
    emptyMsg,
  } = vm;

  const column = (list: BookingData[], body: ReactNode) => (
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

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">계약</h1>
            <p className="text-sm text-slate-500">
              체결 → 시작(숙박 중) → 종료(체크아웃 이후) · 체결 {sealedList.length} · 시작 {inProgressList.length} · 종료{" "}
              {completedList.length}
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
                {t.id === "new"
                  ? newList.length
                  : t.id === "sealed"
                    ? sealedList.length
                    : t.id === "inProgress"
                      ? inProgressList.length
                      : completedList.length}
                )
              </span>
              {t.id === "new" && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? "99+" : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="contract-search" className="sr-only">
            검색
          </label>
          <input
            id="contract-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 예약·매물명, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">선택한 탭(신규·계약체결·계약시작·계약종료) 안에서만 검색됩니다.</p>
        </div>

        {column(
          filteredList,
          filteredList.map((b) => {
            const email = emailMap.get(b.ownerId) || "—";
            const addressLine = (b.propertyAddress || "").trim() || b.propertyTitle || "—";
            const id = b.id ?? "";
            return (
              <AdminSettlementStyleCard
                key={id}
                checkInDate={b.checkInDate}
                checkOutDate={b.checkOutDate}
                addressLine={addressLine}
                email={email}
                ownerUid={b.ownerId}
                amount={b.totalPrice}
                amountClassName="text-slate-900"
              />
            );
          }),
        )}
      </div>
    </AdminRouteGuard>
  );
}
