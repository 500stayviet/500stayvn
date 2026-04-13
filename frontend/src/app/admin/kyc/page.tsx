/**
 * 관리자 KYC — PC 레이아웃(상단 AdminChrome), CSV 다운로드
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupportedLanguage } from '@/lib/api/translation';
import { getAllKYCUsers, downloadAllKYCData, KYCUserData } from '@/lib/api/admin';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { acknowledgeCurrentNewKyc, getUnseenNewKycCount } from '@/lib/adminAckState';
import { ADMIN_NEW_MS } from '@/lib/adminNewUtils';
import { logAdminSystemEvent } from '@/lib/adminSystemLog';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

const LANG_OPTIONS = [
  { code: 'ko', label: 'KO' },
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
] as const;

function kycStatusBadgeClass(status?: string): string {
  if (status === 'verified') return 'bg-green-100 text-green-800';
  if (status === 'pending') return 'bg-amber-100 text-amber-900';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function kycStatusLabel(status: string | undefined, language: SupportedLanguage): string {
  const ko = language === 'ko';
  if (status === 'verified') return ko ? '인증완료' : 'verified';
  if (status === 'pending') return ko ? '심사중' : 'pending';
  if (status === 'rejected') return ko ? '거부' : 'rejected';
  return ko ? '미인증' : status ?? '—';
}

export default function AdminKYCPage() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [kycUsers, setKycUsers] = useState<KYCUserData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tab, setTab] = useState<'new' | 'all' | 'verified' | 'unverified'>('all');
  const [unseenNew, setUnseenNew] = useState(0);

  const t = useMemo(() => {
    const ko = currentLanguage === 'ko';
    const vi = currentLanguage === 'vi';
    const ja = currentLanguage === 'ja';
    const zh = currentLanguage === 'zh';
    return {
      title: ko
        ? 'KYC 데이터'
        : vi
          ? 'Dữ liệu KYC'
          : ja
            ? 'KYCデータ'
            : zh
              ? 'KYC 数据'
              : 'KYC data',
      total: (n: number) =>
        ko
          ? `총 ${n}명`
          : vi
            ? `${n} người`
            : ja
              ? `${n} 件`
              : zh
                ? `共 ${n} 人`
                : `${n} records`,
      refresh: ko ? '새로고침' : vi ? 'Làm mới' : ja ? '更新' : zh ? '刷新' : 'Refresh',
      csv: ko ? 'CSV' : vi ? 'CSV' : ja ? 'CSV' : zh ? 'CSV' : 'CSV',
      loading: ko ? '로딩 중...' : vi ? 'Đang tải...' : ja ? '読み込み...' : zh ? '加载中...' : 'Loading...',
      empty: ko
        ? '데이터 없음'
        : vi
          ? 'Không có dữ liệu'
          : ja
            ? 'データなし'
            : zh
              ? '无数据'
              : 'No data',
      noName: ko ? '이름 없음' : vi ? 'Không tên' : ja ? '名前なし' : zh ? '无姓名' : 'No name',
    };
  }, [currentLanguage]);

  /** silent: 도메인 이벤트(SSE)로 갱신할 때 스피너 없이 목록만 교체 */
  const loadKYCData = useCallback(async (isRefresh = false, silent = false) => {
    if (!silent) {
      if (isRefresh) setRefreshing(true);
      else setInitialLoading(true);
    }
    setError('');
    try {
      const users = await getAllKYCUsers();
      setKycUsers(users);
      setUnseenNew(getUnseenNewKycCount());
    } catch (err: unknown) {
      console.error('Error loading KYC data:', err);
      if (!silent) {
        logAdminSystemEvent({
          severity: 'error',
          category: 'kyc',
          message: err instanceof Error ? err.message : '관리자 KYC 목록 로드 실패',
          snapshot: { function: 'AdminKYCPage.loadKYCData' },
        });
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setRefreshing(false);
      }
      refreshAdminBadges();
    }
  }, []);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadAllKYCData();
    } catch (err: unknown) {
      console.error('Error downloading CSV:', err);
      logAdminSystemEvent({
        severity: 'warning',
        category: 'kyc',
        message: err instanceof Error ? err.message : 'KYC CSV 다운로드 실패',
        snapshot: { function: 'AdminKYCPage.handleDownloadCSV' },
      });
      setError(err instanceof Error ? err.message : 'CSV failed');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    void loadKYCData(false);
  }, [loadKYCData]);

  useAdminDomainRefresh(['user', 'lessor_profile'], () => {
    void loadKYCData(true, true);
  });

  useEffect(() => {
    if (tab !== 'new') return;
    acknowledgeCurrentNewKyc();
    refreshAdminBadges();
    setUnseenNew(0);
  }, [tab]);

  useEffect(() => {
    const resetToAll = () => setTab('all');
    window.addEventListener('admin-kyc-reset-tab', resetToAll);
    return () => {
      window.removeEventListener('admin-kyc-reset-tab', resetToAll);
    };
  }, []);

  const newRows = useMemo(() => {
    const now = Date.now();
    return kycUsers.filter((u) => {
      const t = new Date(u.createdAt || '').getTime();
      return Number.isFinite(t) && now - t < ADMIN_NEW_MS;
    });
  }, [kycUsers]);

  const verifiedRows = useMemo(
    () => kycUsers.filter((u) => u.verificationStatus === 'verified'),
    [kycUsers]
  );
  const unverifiedRows = useMemo(
    () => kycUsers.filter((u) => u.verificationStatus !== 'verified'),
    [kycUsers]
  );

  const shownRows = useMemo(() => {
    if (tab === 'new') return newRows;
    if (tab === 'verified') return verifiedRows;
    if (tab === 'unverified') return unverifiedRows;
    return kycUsers;
  }, [tab, newRows, verifiedRows, unverifiedRows, kycUsers]);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-500">
              {tab === 'new'
                ? `신규 ${newRows.length}명`
                : tab === 'verified'
                  ? `인증 ${verifiedRows.length}명`
                  : tab === 'unverified'
                    ? `미인증 ${unverifiedRows.length}명`
                    : t.total(kycUsers.length)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only">언어</label>
            <select
              value={currentLanguage}
              onChange={(e) => void setCurrentLanguage(e.target.value as SupportedLanguage)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadKYCData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={downloading || kycUsers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${downloading ? 'animate-spin' : ''}`} />
              {t.csv}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('new')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'new' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            신규
            <span className="ml-1 tabular-nums opacity-80">({newRows.length})</span>
            {unseenNew > 0 ? (
              <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                {unseenNew > 99 ? '99+' : unseenNew}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            전체
            <span className="ml-1 tabular-nums opacity-80">({kycUsers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('verified')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'verified' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            인증
            <span className="ml-1 tabular-nums opacity-80">
              ({verifiedRows.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('unverified')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'unverified' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            미인증
            <span className="ml-1 tabular-nums opacity-80">
              ({unverifiedRows.length})
            </span>
          </button>
        </div>

        {initialLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-slate-500">{t.loading}</div>
        ) : (
          <>
            {error ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {shownRows.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-500">{t.empty}</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <th className="px-3 py-2">이름</th>
                        <th className="px-3 py-2">이메일</th>
                        <th className="px-3 py-2">연락처</th>
                        <th className="px-3 py-2">인증상태</th>
                        <th className="px-3 py-2">신분증</th>
                        <th className="px-3 py-2">생년월일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownRows.map((user) => (
                        <tr
                          key={user.uid}
                          className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/80"
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(user.uid)}`)}
                        >
                          <td className="max-w-[180px] truncate px-3 py-2 font-medium text-slate-900">
                            {user.fullName || t.noName}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2 text-slate-700">{user.email || '—'}</td>
                          <td className="max-w-[140px] truncate px-3 py-2 text-slate-700">{user.phoneNumber || '—'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${kycStatusBadgeClass(user.verificationStatus)}`}
                            >
                              {kycStatusLabel(user.verificationStatus, currentLanguage)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {user.idType === 'passport' ? 'passport' : user.idType === 'id_card' ? 'id_card' : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{user.dateOfBirth || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 md:hidden">
                  {shownRows.map((user) => (
                    <div
                      key={user.uid}
                      className="cursor-pointer rounded-md border border-slate-200 bg-slate-50/40 p-3 text-sm"
                      onClick={() => router.push(`/admin/users/${encodeURIComponent(user.uid)}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{user.fullName || t.noName}</p>
                          <p className="truncate text-xs text-slate-600">{user.email}</p>
                          <p className="text-xs text-slate-600">{user.phoneNumber || '—'}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${kycStatusBadgeClass(user.verificationStatus)}`}
                        >
                          {kycStatusLabel(user.verificationStatus, currentLanguage)}
                        </span>
                      </div>
                      <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                        <p>
                          ID: {user.idType === 'passport' ? 'passport' : user.idType === 'id_card' ? 'id_card' : '—'} · DOB:{' '}
                          {user.dateOfBirth || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
