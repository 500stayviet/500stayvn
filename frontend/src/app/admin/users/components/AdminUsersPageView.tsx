"use client";

import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import {
  isAdminUserNewUnseen,
} from "@/lib/adminAckState";
import { isUserNew } from "@/lib/adminNewUtils";
import type { AdminUserFilter } from "@/lib/api/adminModeration";
import type { AdminUsersPageViewModel } from "../hooks/useAdminUsersPage";

const FILTER_TABS: { id: AdminUserFilter; label: string }[] = [
  { id: "new", label: "신규" },
  { id: "all", label: "전체" },
  { id: "active", label: "정상" },
  { id: "blocked", label: "차단" },
];

type Props = { vm: AdminUsersPageViewModel };

export function AdminUsersPageView({ vm }: Props) {
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

  const tabCount = (id: AdminUserFilter) =>
    id === "all" ? nAll : id === "new" ? nNew : id === "active" ? nActive : nBlocked;

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">계정 관리</h1>
            <p className="text-sm text-slate-500">
              신규 = 가입 24h 이내(행 클릭 시 확인 · 확인 당일만 목록 유지, 자정 이후 제외) · 신규 {nNew} · 전체 {nAll} · 정상{" "}
              {nActive} · 차단 {nBlocked}
            </p>
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
              {t.label}
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
            placeholder="uid / email / 이름 검색"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">선택한 탭(신규·전체·정상·차단) 안에서만 검색됩니다.</p>
        </div>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">조회 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {filter === "new" ? (
                    <th className="w-10 px-2 py-2 text-center" title="미확인 알림">
                      알림
                    </th>
                  ) : null}
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">전화번호</th>
                  <th className="px-3 py-2">UID</th>
                  <th className="w-24 px-3 py-2">상태</th>
                  <th className="w-48 px-3 py-2 text-right">작업</th>
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
                              title="미확인"
                              aria-label="미확인 신규 계정"
                            />
                          ) : (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300"
                              title="확인함"
                              aria-label="확인한 신규 계정"
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
                        {u.blocked ? "차단" : "정상"}
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
                            복구
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
                            차단
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
              이전
            </button>
            <p className="font-mono text-xs text-slate-600">
              {page} / {totalPages} · {rows.length}건
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </AdminRouteGuard>
  );
}
