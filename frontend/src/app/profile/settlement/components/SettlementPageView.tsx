'use client';

import { Wallet, CreditCard, TrendingUp, ArrowUpRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import type { SupportedLanguage } from '@/lib/api/translation';
import { formatDate } from '@/lib/utils/dateUtils';
import type { SettlementPageViewModel } from '../hooks/useSettlementPage';

type Props = { vm: SettlementPageViewModel };

/** 정산 페이지 UI — 데이터·핸들러는 `useSettlementPage` 에서만 조립한다. */
export function SettlementPageView({ vm }: Props) {
  const {
    router,
    user,
    authLoading,
    currentLanguage,
    activeTab,
    setActiveTab,
    revenueEntries,
    revenueLoading,
    serverTimeError,
    totalRevenue,
    availableBalance,
    withdrawalPendingAmount,
    withdrawalAmount,
    setWithdrawalAmount,
    selectedBankId,
    setSelectedBankId,
    bankAccounts,
    withdrawalHistory,
    newBankName,
    setNewBankName,
    newAccountNumber,
    setNewAccountNumber,
    newAccountHolder,
    setNewAccountHolder,
    setAsPrimaryOnCreate,
    setSetAsPrimaryOnCreate,
    bankProvider,
    refreshFinanceData,
    handleSubmitWithdrawal,
    handleAddBankAccount,
  } = vm;

  const lang = currentLanguage as SupportedLanguage;
  const formatVndAmount = (amount: number) =>
    `${amount.toLocaleString('vi-VN')} ${getUIText('curVnd', lang)}`;

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
              {getUIText('settlementProcessHaltedDetail', lang)}
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

        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">{getUIText('settlementAccount', currentLanguage)}</h1>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm opacity-90">{getUIText('availableBalance', currentLanguage)}</p>
                <p className="text-3xl font-bold mt-1">{formatVndAmount(availableBalance)}</p>
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
                <p className="font-semibold">{formatVndAmount(withdrawalPendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              type="button"
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
              type="button"
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
              type="button"
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

        <div className="flex-1 px-6 py-6">
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{getUIText('recentRevenue', currentLanguage)}</h2>
              </div>
              {revenueLoading ? (
                <p className="text-gray-500 py-4">{getUIText('loading', currentLanguage)}</p>
              ) : revenueEntries.length === 0 ? (
                <p className="text-gray-500 py-4">
                  {getUIText('settlementEmptyRevenueList', lang)}
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
                          <p className="font-bold">{formatVndAmount(entry.amount)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{getUIText('rentalIncome', currentLanguage)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'withdrawal' && (
            <div className="space-y-6">
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
                        <span className="text-gray-500">{getUIText('curVnd', lang)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {getUIText('availableForWithdrawal', currentLanguage)}:{' '}
                      <span className="font-semibold">{formatVndAmount(availableBalance)}</span>
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
                          {account.bankName} - {account.accountNumber}{' '}
                          {account.isPrimary && `(${getUIText('primary', currentLanguage)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSubmitWithdrawal()}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {getUIText('submitWithdrawalRequest', currentLanguage)}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{getUIText('withdrawalHistory', currentLanguage)}</h3>
                {withdrawalHistory.length === 0 ? (
                  <p className="text-gray-500 py-4 text-sm">
                    {getUIText('settlementNoWithdrawalHistory', lang)}
                  </p>
                ) : (
                  withdrawalHistory.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{formatVndAmount(item.amount)}</p>
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
                                ? getUIText('completed', lang)
                                : item.status === 'pending'
                                  ? getUIText('pending', lang)
                                  : item.status === 'processing' || item.status === 'approved'
                                    ? getUIText('processing', lang)
                                    : item.status === 'held'
                                      ? getUIText('withdrawalStatusHeld', lang)
                                      : getUIText('withdrawalStatusRejected', lang)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{new Date(item.requestedAt).toLocaleString()}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.bankLabel}</p>
                        </div>
                        {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{getUIText('registeredAccounts', currentLanguage)}</h3>
                  <button type="button" className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
                    {getUIText('addNewAccount', currentLanguage)}
                  </button>
                </div>
                {bankAccounts.length === 0 && (
                  <p className="text-gray-500 py-2 text-sm mb-2">
                    {getUIText('settlementNoBankAccounts', lang)}
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
                            type="button"
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
                          type="button"
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
                    type="button"
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
