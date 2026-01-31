/**
 * Settlement & Wallet Page (정산 및 지갑 페이지)
 * 
 * 임대인의 수익 관리, 출금 신청, 은행 계좌 설정을 위한 페이지
 * - 수익 내역 탭
 * - 출금 신청 탭
 * - 은행 계좌 설정 탭
 */

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';

type TabType = 'revenue' | 'withdrawal' | 'bank';

export default function SettlementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  
  // 더미 데이터 - 실제 구현 시 API에서 가져옴
  const revenueData = [
    { id: 1, date: '2026-01-30', property: '호치민 시내 아파트', amount: 5000000, type: 'rental' },
    { id: 2, date: '2026-01-28', property: '하노이 오피스텔', amount: 3200000, type: 'rental' },
    { id: 3, date: '2026-01-25', property: '다낭 바다뷰 빌라', amount: 7500000, type: 'rental' },
    { id: 4, date: '2026-01-20', property: '호치민 시내 아파트', amount: 5000000, type: 'rental' },
  ];
  
  const withdrawalHistory = [
    { id: 1, date: '2026-01-28', amount: 10000000, status: 'completed', bank: '국민은행 ****1234' },
    { id: 2, date: '2026-01-15', amount: 5000000, status: 'completed', bank: '신한은행 ****5678' },
    { id: 3, date: '2026-01-05', amount: 8000000, status: 'pending', bank: '국민은행 ****1234' },
  ];
  
  const bankAccounts = [
    { id: 1, bankName: '국민은행', accountNumber: '123-456-789012', accountHolder: '홍길동', isPrimary: true },
    { id: 2, bankName: '신한은행', accountNumber: '987-654-321098', accountHolder: '홍길동', isPrimary: false },
  ];
  
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const availableBalance = totalRevenue - withdrawalHistory
    .filter(item => item.status === 'completed')
    .reduce((sum, item) => sum + item.amount, 0);
  
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
                <p className="font-semibold">
                  {withdrawalHistory
                    .filter(item => item.status === 'pending')
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()} ₫
                </p>
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
          {/* 수익 내역 탭 */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{getUIText('recentRevenue', currentLanguage)}</h2>
                <button className="text-sm text-purple-600 font-medium">
                  {getUIText('viewAll', currentLanguage)}
                </button>
              </div>
              
              {revenueData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{item.property}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                        <p className="font-bold">{item.amount.toLocaleString()} ₫</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{getUIText('rentalIncome', currentLanguage)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-gray-50 rounded-xl p-4 mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">{getUIText('nextPayout', currentLanguage)}</p>
                    <p className="font-bold text-gray-900">2026-02-05</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{getUIText('estimatedAmount', currentLanguage)}</p>
                    <p className="font-bold text-purple-600">12,500,000 ₫</p>
                  </div>
                </div>
              </div>
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
                        type="number"
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
                    <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                      <option value="">{getUIText('selectAccount', currentLanguage)}</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber} {account.isPrimary && `(${getUIText('primary', currentLanguage)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    {getUIText('submitWithdrawalRequest', currentLanguage)}
                  </button>
                </div>
              </div>
              
              {/* 출금 내역 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{getUIText('withdrawalHistory', currentLanguage)}</h3>
                
                {withdrawalHistory.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{item.amount.toLocaleString()} ₫</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status === 'completed' 
                              ? getUIText('completed', currentLanguage) 
                              : getUIText('pending', currentLanguage)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.bank}</p>
                      </div>
                      {item.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
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
                          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">
                            {getUIText('setAsPrimary', currentLanguage)}
                          </button>
                        )}
                        <button className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder={getUIText('enterAccountHolder', currentLanguage)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="setAsPrimary" className="w-4 h-4" />
                    <label htmlFor="setAsPrimary" className="text-sm text-gray-700">
                      {getUIText('setAsPrimaryAccount', currentLanguage)}
                    </label>
                  </div>
                  
                  <button className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
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
