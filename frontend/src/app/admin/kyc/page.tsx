/**
 * 관리자 KYC — PC 레이아웃(상단 AdminChrome), CSV 다운로드
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, RefreshCw, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupportedLanguage } from '@/lib/api/translation';
import { getAllKYCUsers, downloadAllKYCData, KYCUserData } from '@/lib/api/admin';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';

const LANG_OPTIONS = [
  { code: 'ko', label: 'KO' },
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
] as const;

export default function AdminKYCPage() {
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [kycUsers, setKycUsers] = useState<KYCUserData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');

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

  const loadKYCData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);
    setError('');
    try {
      const users = await getAllKYCUsers();
      setKycUsers(users);
    } catch (err: unknown) {
      console.error('Error loading KYC data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      refreshAdminBadges();
    }
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadAllKYCData();
    } catch (err: unknown) {
      console.error('Error downloading CSV:', err);
      setError(err instanceof Error ? err.message : 'CSV failed');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    loadKYCData(false);
  }, []);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-500">{t.total(kycUsers.length)}</p>
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

        {initialLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-slate-500">{t.loading}</div>
        ) : (
          <>
            {error ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {kycUsers.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-500">{t.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {kycUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="rounded-md border border-slate-200 bg-slate-50/40 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{user.fullName || t.noName}</p>
                        <p className="truncate text-xs text-slate-600">{user.email}</p>
                        <p className="text-xs text-slate-600">{user.phoneNumber || '—'}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                          user.verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : user.verificationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-900'
                              : user.verificationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {(() => {
                          const s = user.verificationStatus;
                          const ko = currentLanguage === 'ko';
                          if (s === 'verified') return ko ? '인증완료' : 'verified';
                          if (s === 'pending') return ko ? '심사중' : 'pending';
                          if (s === 'rejected') return ko ? '거부' : 'rejected';
                          return ko ? '미인증' : s ?? '—';
                        })()}
                      </span>
                    </div>
                    <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      <p>
                        ID: {user.idType === 'passport' ? 'passport' : user.idType === 'id_card' ? 'id_card' : '—'}{' '}
                        · DOB: {user.dateOfBirth || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
