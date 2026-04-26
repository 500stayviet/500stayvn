"use client";

import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { isAdminPropertyNewUnseen } from "@/lib/adminAckState";
import { isPropertyNew } from "@/lib/adminNewUtils";
import type { AdminInventoryFilter } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";
import {
  PROPERTY_HIDDEN_REASON,
  type AdminPropertiesPageViewModel,
} from "../hooks/useAdminPropertiesPage";

const FILTER_TABS: { id: AdminInventoryFilter; label: string }[] = [
  { id: "new", label: "신규" },
  { id: "all", label: "전체" },
  { id: "listed", label: "노출" },
  { id: "paused", label: "광고종료" },
  { id: "hidden", label: "숨김" },
];

function listingStatusLabel(p: PropertyData): { text: string; className: string } {
  if (p.hidden) {
    return { text: "숨김", className: "bg-amber-100 text-amber-800" };
  }
  if (p.status === "INACTIVE_SHORT_TERM") {
    return { text: "광고종료", className: "bg-orange-100 text-orange-900" };
  }
  if (p.status === "active") {
    return { text: "고객 노출", className: "bg-emerald-100 text-emerald-800" };
  }
  return { text: p.status || "—", className: "bg-slate-100 text-slate-700" };
}

type Props = { vm: AdminPropertiesPageViewModel };

export function AdminPropertiesPageView({ vm }: Props) {
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

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">매물 관리</h1>
            <p className="text-sm text-slate-500">
              부모 매물만 표시 · 신규 = 미확인은 확인 전까지 유지(수정 후에도 동일) · 확인한 뒤엔 그날만 목록(자정 이후 제외) · 최신순 · 전체{" "}
              {nAll} · 신규 {nNew} · 노출(고객) {nListed} · 광고종료 {nPaused} · 숨김 {nHidden}
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
            placeholder="id / 제목 / owner(UID·이메일) / 주소 검색"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">선택한 탭 안에서 검색됩니다. 노출 = 7일 예약 가능·고객 화면과 동일.</p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">조회 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {filter === "new" ? (
                    <th className="w-10 px-2 py-2 text-center" title="미확인 알림">
                      알림
                    </th>
                  ) : null}
                  <th className="px-3 py-2">제목</th>
                  <th className="px-3 py-2">주소</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="w-28 px-3 py-2">상태</th>
                  <th className="w-36 px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((p) => {
                  const st = listingStatusLabel(p);
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
                                title="미확인"
                                aria-label="미확인 신규 매물"
                              />
                            ) : (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300"
                                title="확인함"
                                aria-label="확인한 신규 매물"
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
                            복구
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
                            숨김
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

        <p className="mt-4 text-xs text-slate-400">숨김 사유(고정): {PROPERTY_HIDDEN_REASON}</p>
      </div>
    </AdminRouteGuard>
  );
}
