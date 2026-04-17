'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import {
  computeGuestBookingStats,
  computeHostBookingStats,
  getGuestRefundRelatedBookings,
} from '@/lib/adminUserAccountDetail';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { getAdminOwnerBalances, type ServerOwnerBalances } from '@/lib/api/financeServer';
import { getAllBookingsForAdmin } from '@/lib/api/bookings';
import { addSharedMemo, deleteSharedMemo, getSharedMemos } from '@/lib/api/adminMemos';
import type { UserData } from '@/lib/api/auth';
import { setUserBlocked } from '@/lib/api/adminModeration';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

function verificationLabel(v: UserData['verification_status']): { text: string; className: string } {
  switch (v) {
    case 'verified':
      return { text: '인증 완료', className: 'bg-emerald-100 text-emerald-800' };
    case 'pending':
      return { text: '검수 중', className: 'bg-amber-100 text-amber-800' };
    case 'rejected':
      return { text: '반려', className: 'bg-red-100 text-red-800' };
    default:
      return { text: '미인증', className: 'bg-slate-100 text-slate-700' };
  }
}

function formatMoney(n: number, unit: string) {
  const u = unit === 'usd' ? 'USD' : '₫';
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

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : '';
  const { me: admin } = useAdminMe();

  const [user, setUser] = useState<UserData | null | undefined>(undefined);
  const [hostMemos, setHostMemos] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);
  const [guestMemos, setGuestMemos] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);
  const [hostMemoInput, setHostMemoInput] = useState('');
  const [guestMemoInput, setGuestMemoInput] = useState('');
  const [data, setData] = useState<{
    host: ReturnType<typeof computeHostBookingStats>;
    guest: ReturnType<typeof computeGuestBookingStats>;
    refunds: ReturnType<typeof getGuestRefundRelatedBookings>;
    bal: ServerOwnerBalances;
  } | null>(null);
  const [dataTick, setDataTick] = useState(0);

  const loadUserAndMemos = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`/api/app/users/${encodeURIComponent(uid)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (res.ok) {
        const u = (await res.json()) as UserData;
        setUser(u.deleted ? null : u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    const [hostRows, guestRows] = await Promise.all([
      getSharedMemos('user', uid, 'host'),
      getSharedMemos('user', uid, 'guest'),
    ]);
    setHostMemos(hostRows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    setGuestMemos(guestRows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
  }, [uid]);

  useEffect(() => {
    loadUserAndMemos();
  }, [loadUserAndMemos]);

  useAdminDomainRefresh(['user', 'booking', 'payment', 'admin_memo'], () => {
    void loadUserAndMemos();
    setDataTick((t) => t + 1);
  });

  useEffect(() => {
    if (!uid) {
      setData(null);
      return;
    }
    let cancelled = false;
    setData(null);
    (async () => {
      const bookings = await getAllBookingsForAdmin();
      const now = new Date();
      const host = computeHostBookingStats(bookings, uid, now);
      const guest = computeGuestBookingStats(bookings, uid, now);
      const refunds = getGuestRefundRelatedBookings(bookings, uid);
      const bal = await getAdminOwnerBalances(uid);
      if (!cancelled) {
        setData({ host, guest, refunds, bal });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, dataTick]);

  const vLabel = user ? verificationLabel(user.verification_status) : null;

  const saveHost = () => {
    if (!uid) return;
    if (!hostMemoInput.trim()) return;
    void (async () => {
      await addSharedMemo('user', uid, 'host', hostMemoInput);
      setHostMemoInput('');
      const next = await getSharedMemos('user', uid, 'host');
      setHostMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const saveGuest = () => {
    if (!uid) return;
    if (!guestMemoInput.trim()) return;
    void (async () => {
      await addSharedMemo('user', uid, 'guest', guestMemoInput);
      setGuestMemoInput('');
      const next = await getSharedMemos('user', uid, 'guest');
      setGuestMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const formatMemoDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
  };

  if (!uid) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">잘못된 경로입니다.</p>
      </AdminRouteGuard>
    );
  }

  if (user === undefined) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">불러오는 중…</p>
      </AdminRouteGuard>
    );
  }

  if (!user) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-red-600">계정을 찾을 수 없습니다.</p>
        <Link href="/admin/users" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          계정 목록으로
        </Link>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:w-[320px]">
            <button
              type="button"
              onClick={() => {
                // “호스트 계정 보기”처럼 상세에서 넘어온 경우: 전 화면으로 복귀
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push('/admin/users');
              }}
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              뒤로가기
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{user.displayName || '이름 없음'}</h1>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.blocked ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {user.blocked ? '일시 정지(차단)' : '활성'}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">{user.uid}</p>
          </div>
          <div className="w-full rounded-lg border border-slate-200 bg-white p-3 lg:mx-4 lg:flex-1">
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <label htmlFor="host-memo" className="text-xs font-semibold text-slate-700">
                  호스트용 메모
                </label>
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
                  {hostMemos.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-slate-500">메모 없음</p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {hostMemos.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">{formatMemoDate(m.createdAt)}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                            {m.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                await deleteSharedMemo(m.id);
                                const next = await getSharedMemos('user', uid, 'host');
                                setHostMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
                              })();
                            }}
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                          >
                            삭제
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
                  placeholder="호스트 상담·처리 메모"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveHost}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Save className="h-3.5 w-3.5" />
                    저장
                  </button>
                  <span className="text-xs text-slate-500">최신 메모가 맨 앞에 표시됩니다.</span>
                </div>
              </div>
              <div>
                <label htmlFor="guest-memo" className="text-xs font-semibold text-slate-700">
                  게스트용 메모
                </label>
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
                  {guestMemos.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-slate-500">메모 없음</p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {guestMemos.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">{formatMemoDate(m.createdAt)}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                            {m.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                await deleteSharedMemo(m.id);
                                const next = await getSharedMemos('user', uid, 'guest');
                                setGuestMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
                              })();
                            }}
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                          >
                            삭제
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
                  placeholder="게스트 상담·처리 메모"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveGuest}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Save className="h-3.5 w-3.5" />
                    저장
                  </button>
                  <span className="text-xs text-slate-500">최신 메모가 맨 앞에 표시됩니다.</span>
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
                  void (async () => {
                    await setUserBlocked(user.uid, false, admin!.username);
                    refreshAdminBadges();
                    loadUserAndMemos();
                  })();
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                차단 해제
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  const reason = window.prompt('차단 사유를 입력하세요.', '관리자 차단') || '관리자 차단';
                  void (async () => {
                    await setUserBlocked(user.uid, true, admin!.username, reason);
                    refreshAdminBadges();
                    loadUserAndMemos();
                  })();
                }}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                계정 차단
              </button>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle>가입 정보 · 상태</SectionTitle>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">이름</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{user.displayName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">이메일</dt>
              <dd className="mt-0.5 break-all text-slate-900">{user.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">전화번호</dt>
              <dd className="mt-0.5 text-slate-900">{user.phoneNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">성별</dt>
              <dd className="mt-0.5 text-slate-900">
                {user.gender === 'male' ? '남' : user.gender === 'female' ? '여' : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">선호 언어</dt>
              <dd className="mt-0.5 text-slate-900">{user.preferredLanguage || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">가입일</dt>
              <dd className="mt-0.5 text-slate-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">본인 인증(KYC)</dt>
              <dd className="mt-0.5">
                {vLabel ? (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${vLabel.className}`}>
                    {vLabel.text}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* 호스트 */}
        <section className="mb-8 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
          <SectionTitle>호스트 (임대인)</SectionTitle>
          {data ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="예약 건수(전체)" value={data.host.total} />
                <StatCard label="진행 중" value={data.host.inProgress} />
                <StatCard label="완료" value={data.host.completed} />
                <StatCard label="취소" value={data.host.cancelled} />
              </div>
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">현재 잔고 현황</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-slate-600">출금 가능</span>
                    <p className="font-bold tabular-nums text-emerald-800">
                      {data.bal.availableBalance.toLocaleString()} ₫
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">승인 매출 합계</span>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {data.bal.totalApprovedRevenue.toLocaleString()} ₫
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">출금 처리 중·보류</span>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {data.bal.pendingWithdrawal.toLocaleString()} ₫
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">불러오는 중…</p>
          )}
        </section>

        {/* 게스트 */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle>게스트 (임차인)</SectionTitle>
          {data ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatCard label="현재 예약" value={data.guest.currentReservations} />
                <StatCard label="입금 대기" value={data.guest.depositPending} />
                <StatCard label="계약 완료" value={data.guest.contractCompleted} />
                <StatCard label="취소" value={data.guest.cancelled} />
              </div>
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  환불 관련 예약
                </h3>
                {data.refunds.length === 0 ? (
                  <p className="text-sm text-slate-500">해당 내역이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                          <th className="px-2 py-2">예약 ID</th>
                          <th className="px-2 py-2">매물</th>
                          <th className="px-2 py-2">금액</th>
                          <th className="px-2 py-2">결제</th>
                          <th className="px-2 py-2">환불 처리</th>
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
                              {r.paymentStatus === 'refunded' ? (
                                <span className="text-emerald-700">환불 완료</span>
                              ) : r.refundAdminApproved ? (
                                <span className="text-emerald-700">관리자 승인됨</span>
                              ) : (
                                <span className="text-amber-700">승인 대기</span>
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
            <p className="text-sm text-slate-500">불러오는 중…</p>
          )}
        </section>
      </div>
    </AdminRouteGuard>
  );
}
