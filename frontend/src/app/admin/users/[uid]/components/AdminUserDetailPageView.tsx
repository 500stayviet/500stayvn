"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "@/lib/api/auth";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import type { AdminUserDetailPageViewModel } from "../hooks/useAdminUserDetailPage";

function verificationLabel(
  v: UserData["verification_status"],
  lang: SupportedLanguage,
): {
  text: string;
  className: string;
} {
  switch (v) {
    case "verified":
      return { text: getUIText("adminKycStatusVerified", lang), className: "bg-emerald-100 text-emerald-800" };
    case "pending":
      return { text: getUIText("adminKycStatusPending", lang), className: "bg-amber-100 text-amber-800" };
    case "rejected":
      return { text: getUIText("adminKycStatusRejected", lang), className: "bg-red-100 text-red-800" };
    default:
      return { text: getUIText("adminKycStatusUnverified", lang), className: "bg-slate-100 text-slate-700" };
  }
}

function formatMoney(n: number, unit: string) {
  const u = unit === "usd" ? "USD" : "₫";
  return `${n.toLocaleString()} ${u}`;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">{children}</h2>
  );
}

type Props = { vm: AdminUserDetailPageViewModel };

export function AdminUserDetailPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const {
    phase,
    router,
    admin,
    user,
    hostMemos,
    guestMemos,
    hostMemoInput,
    setHostMemoInput,
    guestMemoInput,
    setGuestMemoInput,
    data,
    formatMemoDate,
    saveHost,
    saveGuest,
    deleteHostMemo,
    deleteGuestMemo,
    unblockUser,
    blockUser,
  } = vm;

  if (phase === "no-uid") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">{getUIText("adminUiBadPath", currentLanguage)}</p>
      </AdminRouteGuard>
    );
  }

  if (phase === "loading") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">{getUIText("adminUiLoadingEllipsis", currentLanguage)}</p>
      </AdminRouteGuard>
    );
  }

  if (phase === "not-found") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-red-600">{getUIText("adminNotFoundUser", currentLanguage)}</p>
        <Link href="/admin/users" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          {getUIText("adminBackToUsersList", currentLanguage)}
        </Link>
      </AdminRouteGuard>
    );
  }

  if (!user) {
    return null;
  }

  const vLabel = verificationLabel(user.verification_status, currentLanguage);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:w-[320px]">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push("/admin/users");
              }}
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {getUIText("adminUserDetailBack", currentLanguage)}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {user.displayName || getUIText("adminNoDisplayName", currentLanguage)}
              </h1>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.blocked ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {user.blocked
                  ? getUIText("adminUserBadgeSuspended", currentLanguage)
                  : getUIText("adminUserBadgeActive", currentLanguage)}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">{user.uid}</p>
          </div>
          <div className="w-full rounded-lg border border-slate-200 bg-white p-3 lg:mx-4 lg:flex-1">
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <label htmlFor="host-memo" className="text-xs font-semibold text-slate-700">
                  {getUIText("adminLabelHostMemo", currentLanguage)}
                </label>
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
                  {hostMemos.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-slate-500">{getUIText("adminMemoEmpty", currentLanguage)}</p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {hostMemos.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {formatMemoDate(m.createdAt)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                            {m.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteHostMemo(m.id)}
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                          >
                            {getUIText("delete", currentLanguage)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <textarea
                  id="host-memo"
                  value={hostMemoInput}
                  onChange={(e) => setHostMemoInput(e.target.value)}
                  rows={2}
                  placeholder={getUIText("adminMemoPlaceholderHost", currentLanguage)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveHost}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {getUIText("save", currentLanguage)}
                  </button>
                  <span className="text-xs text-slate-500">{getUIText("adminMemoNewestFirst", currentLanguage)}</span>
                </div>
              </div>
              <div>
                <label htmlFor="guest-memo" className="text-xs font-semibold text-slate-700">
                  {getUIText("adminLabelGuestMemo", currentLanguage)}
                </label>
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
                  {guestMemos.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-slate-500">{getUIText("adminMemoEmpty", currentLanguage)}</p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {guestMemos.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {formatMemoDate(m.createdAt)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                            {m.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteGuestMemo(m.id)}
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                          >
                            {getUIText("delete", currentLanguage)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <textarea
                  id="guest-memo"
                  value={guestMemoInput}
                  onChange={(e) => setGuestMemoInput(e.target.value)}
                  rows={2}
                  placeholder={getUIText("adminMemoPlaceholderGuest", currentLanguage)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveGuest}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {getUIText("save", currentLanguage)}
                  </button>
                  <span className="text-xs text-slate-500">{getUIText("adminMemoNewestFirst", currentLanguage)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:gap-2">
            {user.blocked ? (
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  unblockUser(user.uid);
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {getUIText("adminUserUnblock", currentLanguage)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  blockUser(user.uid);
                }}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                {getUIText("adminUserBlockAccount", currentLanguage)}
              </button>
            )}
          </div>
        </div>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle>{getUIText("adminSectionProfileStatus", currentLanguage)}</SectionTitle>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("fullName", currentLanguage)}</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{user.displayName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("email", currentLanguage)}</dt>
              <dd className="mt-0.5 break-all text-slate-900">{user.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("phoneNumber", currentLanguage)}</dt>
              <dd className="mt-0.5 text-slate-900">{user.phoneNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("gender", currentLanguage)}</dt>
              <dd className="mt-0.5 text-slate-900">
                {user.gender === "male"
                  ? getUIText("male", currentLanguage)
                  : user.gender === "female"
                    ? getUIText("female", currentLanguage)
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("preferredLanguage", currentLanguage)}</dt>
              <dd className="mt-0.5 text-slate-900">{user.preferredLanguage || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("adminUserJoinedAt", currentLanguage)}</dt>
              <dd className="mt-0.5 text-slate-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{getUIText("adminLabelKyc", currentLanguage)}</dt>
              <dd className="mt-0.5">
                {vLabel ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${vLabel.className}`}
                  >
                    {vLabel.text}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
          <SectionTitle>{getUIText("adminSectionHost", currentLanguage)}</SectionTitle>
          {data ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard
                  label={getUIText("adminUserStatHostBookingsTotal", currentLanguage)}
                  value={data.host.total}
                />
                <StatCard label={getUIText("adminUserStatInProgress", currentLanguage)} value={data.host.inProgress} />
                <StatCard label={getUIText("adminUserStatCompleted", currentLanguage)} value={data.host.completed} />
                <StatCard label={getUIText("adminUserStatCancelled", currentLanguage)} value={data.host.cancelled} />
              </div>
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {getUIText("adminUserBalanceTitle", currentLanguage)}
                </p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-slate-600">{getUIText("adminUserBalanceAvailable", currentLanguage)}</span>
                    <p className="font-bold tabular-nums text-emerald-800">
                      {data.bal.availableBalance.toLocaleString()} ₫
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">
                      {getUIText("adminUserBalanceApprovedRevenue", currentLanguage)}
                    </span>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {data.bal.totalApprovedRevenue.toLocaleString()} ₫
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">
                      {getUIText("adminUserBalancePendingWithdraw", currentLanguage)}
                    </span>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {data.bal.pendingWithdrawal.toLocaleString()} ₫
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">{getUIText("adminUiLoadingEllipsis", currentLanguage)}</p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle>{getUIText("adminSectionGuest", currentLanguage)}</SectionTitle>
          {data ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatCard
                  label={getUIText("adminUserGuestCurrentRes", currentLanguage)}
                  value={data.guest.currentReservations}
                />
                <StatCard
                  label={getUIText("adminUserGuestDepositPending", currentLanguage)}
                  value={data.guest.depositPending}
                />
                <StatCard
                  label={getUIText("adminUserGuestContractDone", currentLanguage)}
                  value={data.guest.contractCompleted}
                />
                <StatCard label={getUIText("adminUserStatCancelled", currentLanguage)} value={data.guest.cancelled} />
              </div>
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {getUIText("adminUserRefundsHeading", currentLanguage)}
                </h3>
                {data.refunds.length === 0 ? (
                  <p className="text-sm text-slate-500">{getUIText("adminUserRefundsEmpty", currentLanguage)}</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                          <th className="px-2 py-2">{getUIText("adminUserRefundsColBookingId", currentLanguage)}</th>
                          <th className="px-2 py-2">{getUIText("adminUserRefundsColProperty", currentLanguage)}</th>
                          <th className="px-2 py-2">{getUIText("adminUserRefundsColAmount", currentLanguage)}</th>
                          <th className="px-2 py-2">{getUIText("adminUserRefundsColPayment", currentLanguage)}</th>
                          <th className="px-2 py-2">{getUIText("adminUserRefundsColRefund", currentLanguage)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.refunds.map((r) => (
                          <tr key={r.bookingId} className="border-b border-slate-100">
                            <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs">{r.bookingId}</td>
                            <td className="max-w-[180px] truncate px-2 py-1.5">{r.propertyTitle}</td>
                            <td className="whitespace-nowrap px-2 py-1.5 tabular-nums">
                              {formatMoney(r.totalPrice, r.priceUnit)}
                            </td>
                            <td className="px-2 py-1.5">{r.paymentStatus}</td>
                            <td className="px-2 py-1.5">
                              {r.paymentStatus === "refunded" ? (
                                <span className="text-emerald-700">
                                  {getUIText("adminRefundStatusDone", currentLanguage)}
                                </span>
                              ) : r.refundAdminApproved ? (
                                <span className="text-emerald-700">
                                  {getUIText("adminRefundStatusAdminOk", currentLanguage)}
                                </span>
                              ) : (
                                <span className="text-amber-700">
                                  {getUIText("adminRefundStatusPending", currentLanguage)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">{getUIText("adminUiLoadingEllipsis", currentLanguage)}</p>
          )}
        </section>
      </div>
    </AdminRouteGuard>
  );
}
