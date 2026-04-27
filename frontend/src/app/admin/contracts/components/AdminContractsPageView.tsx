"use client";

import { type ReactNode, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import AdminSettlementStyleCard from "@/components/admin/AdminSettlementStyleCard";
import type { BookingData } from "@/lib/api/bookings";
import type { AdminContractsPageViewModel, ContractTab } from "../hooks/useAdminContractsPage";

type Props = { vm: AdminContractsPageViewModel };

export function AdminContractsPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
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

  const TABS: { id: ContractTab; label: string }[] = useMemo(
    () => [
      { id: "new", label: getUIText("adminContractsTabNew", currentLanguage) },
      { id: "sealed", label: getUIText("adminContractsTabSealed", currentLanguage) },
      { id: "inProgress", label: getUIText("adminContractsTabInProgress", currentLanguage) },
      { id: "completed", label: getUIText("adminContractsTabCompleted", currentLanguage) },
    ],
    [currentLanguage],
  );

  const introLine = useMemo(
    () =>
      getUIText("adminContractsIntroLine", currentLanguage)
        .replace("{{sealed}}", String(sealedList.length))
        .replace("{{inProgress}}", String(inProgressList.length))
        .replace("{{completed}}", String(completedList.length)),
    [currentLanguage, sealedList.length, inProgressList.length, completedList.length],
  );

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
            <h1 className="text-lg font-bold text-slate-900">
              {getUIText("adminContractsPageTitle", currentLanguage)}
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
            {getUIText("search", currentLanguage)}
          </label>
          <input
            id="contract-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getUIText("adminContractsSearchPlaceholder", currentLanguage)}
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            {getUIText("adminContractsSearchHint", currentLanguage)}
          </p>
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
