/**
 * Settlement & Wallet Page (정산 및 지갑 페이지)
 *
 * 임대수익: 체크인 경과~체크아웃 전 뱃지「수익확정됨」, 체크아웃 이후「승인 요청 중」→
 * 관리자가 대기로 보내면「승인 대기 중」→ 승인 시「정산됨」.
 * 출금가능액은 관리자 승인·출금 요청만 반영(+24h 자동 정산 없음).
 */

'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CreditCard, TrendingUp, ArrowUpRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import { getOwnerBookings } from '@/lib/api/bookings';
import { getProperty } from '@/lib/api/properties';
import { getServerTime, ServerTimeSyncError } from '@/lib/api/serverTime';
import {
  toISO8601ForAudit,
  getCheckInMoment,
  getCheckOutMoment,
  getPayableAfterMoment,
} from '@/lib/utils/rentalIncome';
import { recordSettlementAudit } from '@/lib/utils/settlementAuditLog';
import type { RentalIncomeStatus } from '@/lib/utils/rentalIncome';
import {
  getRentalIncomeStatus,
  getRentalIncomeAmount,
  isEligibleForRentalIncome,
  aggregateRentalIncome,
} from '@/lib/utils/rentalIncome';
import { formatDate } from '@/lib/utils/dateUtils';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';
import {
  getAppSettlementOverlay,
  type ServerOwnerBalances,
  type ServerBankAccount as BankAccount,
  type ServerWithdrawalRequest as WithdrawalRequest,
} from '@/lib/api/financeServer';
import { getBankProvider } from '@/lib/providers/currentProviders';

type TabType = 'revenue' | 'withdrawal' | 'bank';

/** 수익 내역 한 건 (booking 기반, 조회 시점 상태) */
interface RevenueEntry {
  bookingId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  amount: number;
  status: RentalIncomeStatus;
  /** 관리자 정산이 보류(held)인 경우 임대인에게 보류 표시 */
  settlementHeld: boolean;
  /** 관리자 정산 승인(approved) — 출금 가능 잔액에 반영되는 건 */
  settlementApproved: boolean;
  /** 관리자가 승인 대기 큐로 보낸 예약(승인 전) */
  settlementInAdminQueue: boolean;
  /** 체크아웃 시각 경과 */
  afterCheckOut: boolean;
}

export default function SettlementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [serverTimeError, setServerTimeError] = useState<boolean>(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [ownerBalances, setOwnerBalances] = useState<ServerOwnerBalances>({
    totalApprovedRevenue: 0,
    pendingWithdrawal: 0,
    availableBalance: 0,
  });
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountHolder, setNewAccountHolder] = useState('');
  const [setAsPrimaryOnCreate, setSetAsPrimaryOnCreate] = useState(true);
  const [revenueTick, setRevenueTick] = useState(0);
  const bankProvider = getBankProvider();

  useAdminDomainRefresh(['booking'], () => {
    setRevenueTick((t) => t + 1);
  });

  /** 임대인 탭은 관리자 SSE가 없을 수 있어, 탭이 다시 보일 때 서버 정산 오버레이를 한 번 당김 */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setRevenueTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setRevenueEntries([]);
      setRevenueLoading(false);
      setServerTimeError(false);
      return;
    }
    let cancelled = false;
    setRevenueLoading(true);
    setServerTimeError(false);
    (async () => {
      try {
        const [bookings, now, settlementOverlay] = await Promise.all([
          getOwnerBookings(user.uid),
          getServerTime(),
          getAppSettlementOverlay(),
        ]);
        if (cancelled) return;
        const serverTimeISO = toISO8601ForAudit(now);
        const serverTimeMs = now.getTime();
        const overlayByBookingId = new Map(
          settlementOverlay.map((o) => [o.bookingId, o] as const)
        );

        const eligible = bookings.filter((b) =>
          isEligibleForRentalIncome({
            paymentStatus: b.paymentStatus ?? 'pending',
            status: b.status ?? 'pending',
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            checkInTime: b.checkInTime ?? '14:00',
            checkOutTime: b.checkOutTime ?? '12:00',
            now,
          })
        );
        const entries: RevenueEntry[] = [];
        for (const b of eligible) {
          const status = getRentalIncomeStatus(
            b.checkInDate,
            b.checkOutDate,
            b.checkInTime ?? '14:00',
            b.checkOutTime ?? '12:00',
            now
          );
          if (status === null) continue;
          const checkIn = getCheckInMoment(b.checkInDate, b.checkInTime ?? '14:00');
          const checkOut = getCheckOutMoment(b.checkOutDate, b.checkOutTime ?? '12:00');
          const payableAfter = getPayableAfterMoment(b.checkOutDate, b.checkOutTime ?? '12:00');
          recordSettlementAudit({
            serverTimeISO,
            serverTimeMs,
            bookingId: b.id ?? '',
            status,
            checkInISO: toISO8601ForAudit(checkIn),
            checkOutISO: toISO8601ForAudit(checkOut),
            payableAfterISO: toISO8601ForAudit(payableAfter),
          });
          let propertyName = b.propertyTitle ?? '';
          try {
            const prop = await getProperty(b.propertyId);
            if (prop?.title) propertyName = prop.title;
          } catch {
            // keep propertyTitle fallback
          }
          const bid = b.id ?? '';
          const ov = overlayByBookingId.get(bid);
          const st = ov?.approvalStatus as 'approved' | 'held' | undefined;
          const settlementHeld = st === 'held';
          const settlementApproved = st === 'approved';
          const settlementInAdminQueue =
            !settlementHeld && !settlementApproved && Boolean(ov?.inPendingQueue);
          const checkOutMoment = getCheckOutMoment(b.checkOutDate, b.checkOutTime ?? '12:00');
          const cot = checkOutMoment.getTime();
          const afterCheckOut =
            Number.isFinite(cot) && Number.isFinite(now.getTime()) && now.getTime() >= cot;

          entries.push({
            bookingId: bid,
            propertyName,
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            checkInTime: b.checkInTime ?? '14:00',
            checkOutTime: b.checkOutTime ?? '12:00',
            amount: getRentalIncomeAmount(b),
            status,
            settlementHeld,
            settlementApproved,
            settlementInAdminQueue,
            afterCheckOut,
          });
        }
        if (!cancelled) {
          setRevenueEntries(entries);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ServerTimeSyncError) {
          setServerTimeError(true);
          setRevenueEntries([]);
        }
      } finally {
        if (!cancelled) {
          setRevenueLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, revenueTick]);

  const { totalRevenue } = useMemo(() => {
    return aggregateRentalIncome(revenueEntries);
  }, [revenueEntries]);
  const availableBalance = ownerBalances.availableBalance;
  const withdrawalPendingAmount = ownerBalances.pendingWithdrawal;

  const refreshFinanceData = async () => {
    if (!user?.uid) return;
    const accounts = await bankProvider.getBankAccounts();
    const withdrawals = (await bankProvider.getWithdrawalRequests()).sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    const balances = await bankProvider.getOwnerBalances();
    setBankAccounts(accounts);
    setWithdrawalHistory(withdrawals);
    setOwnerBalances(balances);
    if (!selectedBankId) {
      const primary = accounts.find((a) => a.isPrimary);
      if (primary) setSelectedBankId(primary.id);
    }
  };

  useEffect(() => {
    void refreshFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSubmitWithdrawal = async () => {
    if (!user?.uid) return;
    const amount = parseInt(withdrawalAmount.replace(/\D/g, ''), 10) || 0;
    if (amount <= 0) {
      alert(currentLanguage === 'ko' ? '출금 금액을 입력해주세요.' : 'Vui lòng nhập số tiền rút.');
      return;
    }
    if (!selectedBankId) {
      alert(currentLanguage === 'ko' ? '계좌를 선택해주세요.' : 'Vui lòng chọn tài khoản.');
      return;
    }
    const result = await bankProvider.createWithdrawalRequest({ amount, bankAccountId: selectedBankId });
    if (!result.ok) {
      alert(result.message || 'Withdrawal request failed');
      return;
    }
    setWithdrawalAmount('');
    await refreshFinanceData();
    alert(currentLanguage === 'ko' ? '출금 신청이 접수되었습니다.' : 'Yêu cầu rút tiền đã được gửi.');
  };

  const handleAddBankAccount = async () => {
    if (!user?.uid) return;
    if (!newBankName.trim() || !newAccountNumber.trim() || !newAccountHolder.trim()) {
      alert(currentLanguage === 'ko' ? '계좌 정보를 모두 입력해주세요.' : 'Vui lòng nhập đầy đủ thông tin tài khoản.');
      return;
    }
    const ok = await bankProvider.addBankAccount({
      bankName: newBankName.trim(),
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim(),
      isPrimary: setAsPrimaryOnCreate,
    });
    if (!ok) {
      alert(currentLanguage === 'ko' ? '계좌 등록에 실패했습니다.' : 'Đăng ký tài khoản thất bại.');
      return;
    }
    setNewBankName('');
    setNewAccountNumber('');
    setNewAccountHolder('');
    setSetAsPrimaryOnCreate(false);
    await refreshFinanceData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
      </div>
    );
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  if (serverTimeError) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} />
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <p className="text-lg font-semibold text-red-600 text-center mb-2">
              {getUIText('serverTimeSyncError', currentLanguage)}
            </p>
            <p className="text-sm text-gray-600 text-center mb-6">
              {getUIText('systemMaintenance', currentLanguage)}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {currentLanguage === 'ko'
                ? '정산 프로세스를 중단했습니다. 잠시 후 다시 시도해 주세요.'
                : currentLanguage === 'vi'
                ? 'Đã tạm dừng quy trình thanh toán. Vui lòng thử lại sau.'
                : 'Settlement process halted. Please try again later.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} />
        
        {/* 헤더 */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">{getUIText('settlementAccount', currentLanguage)}</h1>
            </div>
          </div>
          
          {/* 잔액 카드 */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm opacity-90">{getUIText('availableBalance', currentLanguage)}</p>
                <p className="text-3xl font-bold mt-1">{availableBalance.toLocaleString()} ₫</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="flex justify-between text-sm mt-4">
              <div>
                <p className="opacity-80">{getUIText('totalRevenue', currentLanguage)}</p>
                <p className="font-semibold">{totalRevenue.toLocaleString()} ₫</p>
              </div>
              <div>
                <p className="opacity-80">{getUIText('pendingWithdrawal', currentLanguage)}</p>
                <p className="font-semibold">{withdrawalPendingAmount.toLocaleString()} ₫</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'revenue'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getUIText('revenueHistory', currentLanguage)}
            </button>
            <button
              onClick={() => setActiveTab('withdrawal')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'withdrawal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getUIText('withdrawalRequest', currentLanguage)}
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'bank'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getUIText('bankAccountSetup', currentLanguage)}
            </button>
          </div>
        </div>
        
        {/* 탭 컨텐츠 */}
        <div className="flex-1 px-6 py-6">
          {/* 수익 내역 탭 (bookings 기반, 베트남 시간 기준 상태) */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{getUIText('recentRevenue', currentLanguage)}</h2>
              </div>
              {revenueLoading ? (
                <p className="text-gray-500 py-4">{getUIText('loading', currentLanguage)}</p>
              ) : revenueEntries.length === 0 ? (
                <p className="text-gray-500 py-4">
                  {currentLanguage === 'ko'
                    ? '체크인 시각이 지난 결제 완료 예약이 없습니다.'
                    : currentLanguage === 'vi'
                    ? 'Chưa có đặt phòng đã thanh toán sau thời gian nhận phòng.'
                    : 'No paid bookings past check-in time yet.'}
                </p>
              ) : (
                revenueEntries.map((entry) => (
                  <div key={entry.bookingId} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{entry.propertyName || getUIText('title', currentLanguage)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(entry.checkInDate, currentLanguage)} ~ {formatDate(entry.checkOutDate, currentLanguage)}
                        </p>
                        <span
                          className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                            entry.settlementHeld
                              ? 'bg-slate-200 text-slate-800'
                              : entry.settlementApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.afterCheckOut && entry.settlementInAdminQueue
                                  ? 'bg-blue-100 text-blue-800'
                                  : entry.afterCheckOut
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-violet-100 text-violet-900'
                          }`}
                        >
                          {entry.settlementHeld
                            ? getUIText('incomeStatusSettlementHeld', currentLanguage)
                            : entry.settlementApproved
                              ? getUIText('incomeStatusSettlementApproved', currentLanguage)
                              : entry.afterCheckOut && entry.settlementInAdminQueue
                                ? getUIText('incomeStatusSettlementPending', currentLanguage)
                                : entry.afterCheckOut
                                  ? getUIText('incomeStatusSettlementRequest', currentLanguage)
                                  : getUIText('incomeStatusRevenueConfirmed', currentLanguage)}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          <p className="font-bold">{entry.amount.toLocaleString()} ₫</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{getUIText('rentalIncome', currentLanguage)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* 출금 신청 탭 */}
          {activeTab === 'withdrawal' && (
            <div className="space-y-6">
              {/* 출금 신청 폼 */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{getUIText('requestWithdrawal', currentLanguage)}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getUIText('withdrawalAmount', currentLanguage)}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-3">
                        <span className="text-gray-500">₫</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {getUIText('availableForWithdrawal', currentLanguage)}: <span className="font-semibold">{availableBalance.toLocaleString()} ₫</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getUIText('selectBankAccount', currentLanguage)}
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">{getUIText('selectAccount', currentLanguage)}</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber} {account.isPrimary && `(${getUIText('primary', currentLanguage)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => void handleSubmitWithdrawal()}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {getUIText('submitWithdrawalRequest', currentLanguage)}
                  </button>
                </div>
              </div>
              
              {/* 출금 내역 (API 연동 전 플레이스홀더) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{getUIText('withdrawalHistory', currentLanguage)}</h3>
                {withdrawalHistory.length === 0 ? (
                  <p className="text-gray-500 py-4 text-sm">
                    {currentLanguage === 'ko' ? '출금 내역이 없습니다.' : currentLanguage === 'vi' ? 'Chưa có lịch sử rút tiền.' : 'No withdrawal history yet.'}
                  </p>
                ) : (
                withdrawalHistory.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{item.amount.toLocaleString()} ₫</p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : item.status === 'held'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.status === 'completed'
                              ? getUIText('completed', currentLanguage)
                              : item.status === 'pending'
                              ? getUIText('pending', currentLanguage)
                              : item.status === 'processing' || item.status === 'approved'
                              ? currentLanguage === 'ko'
                                ? '처리중'
                                : currentLanguage === 'vi'
                                ? 'Đang xử lý'
                                : 'Processing'
                              : item.status === 'held'
                              ? currentLanguage === 'ko'
                                ? '보류'
                                : currentLanguage === 'vi'
                                ? 'Tạm giữ'
                                : 'On hold'
                              : currentLanguage === 'ko'
                              ? '반려'
                              : 'Rejected'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{new Date(item.requestedAt).toLocaleString()}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.bankLabel}</p>
                      </div>
                      {item.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          )}
          
          {/* 은행 계좌 설정 탭 */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* 계좌 목록 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{getUIText('registeredAccounts', currentLanguage)}</h3>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
                    {getUIText('addNewAccount', currentLanguage)}
                  </button>
                </div>
                {bankAccounts.length === 0 && (
                  <p className="text-gray-500 py-2 text-sm mb-2">
                    {currentLanguage === 'ko' ? '등록된 계좌가 없습니다.' : currentLanguage === 'vi' ? 'Chưa có tài khoản đăng ký.' : 'No accounts registered.'}
                  </p>
                )}
                {bankAccounts.map((account) => (
                  <div key={account.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-900">{account.bankName}</p>
                          {account.isPrimary && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {getUIText('primary', currentLanguage)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{account.accountNumber}</p>
                        <p className="text-sm text-gray-500 mt-1">{account.accountHolder}</p>
                      </div>
                      <div className="flex gap-2">
                        {!account.isPrimary && (
                          <button
                            onClick={() => {
                              if (!user?.uid) return;
                              void (async () => {
                                await bankProvider.setPrimaryBankAccount(account.id);
                                await refreshFinanceData();
                              })();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg"
                          >
                            {getUIText('setAsPrimary', currentLanguage)}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!user?.uid) return;
                            void (async () => {
                              await bankProvider.removeBankAccount(account.id);
                              await refreshFinanceData();
                            })();
                          }}
                          className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg"
                        >
                          {getUIText('delete', currentLanguage)}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 새 계좌 등록 폼 */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{getUIText('registerNewAccount', currentLanguage)}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getUIText('bankName', currentLanguage)}
                    </label>
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder={getUIText('enterBankName', currentLanguage)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getUIText('accountNumber', currentLanguage)}
                    </label>
                    <input
                      type="text"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder={getUIText('enterAccountNumber', currentLanguage)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getUIText('accountHolder', currentLanguage)}
                    </label>
                    <input
                      type="text"
                      value={newAccountHolder}
                      onChange={(e) => setNewAccountHolder(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder={getUIText('enterAccountHolder', currentLanguage)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="setAsPrimary"
                      checked={setAsPrimaryOnCreate}
                      onChange={(e) => setSetAsPrimaryOnCreate(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="setAsPrimary" className="text-sm text-gray-700">
                      {getUIText('setAsPrimaryAccount', currentLanguage)}
                    </label>
                  </div>
                  
                  <button
                    onClick={() => void handleAddBankAccount()}
                    className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    {getUIText('registerAccount', currentLanguage)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
