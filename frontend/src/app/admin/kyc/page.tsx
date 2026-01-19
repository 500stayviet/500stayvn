/**
 * 관리자 KYC 데이터 관리 페이지
 * 
 * 모든 KYC 데이터를 조회하고 CSV로 다운로드
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllKYCUsers, downloadAllKYCData, KYCUserData } from '@/lib/api/admin';
import TopBar from '@/components/TopBar';

export default function AdminKYCPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [kycUsers, setKycUsers] = useState<KYCUserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');

  // KYC 데이터 로드
  const loadKYCData = async () => {
    setLoading(true);
    setError('');
    try {
      const users = await getAllKYCUsers();
      setKycUsers(users);
    } catch (err: any) {
      console.error('Error loading KYC data:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // CSV 다운로드
  const handleDownloadCSV = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadAllKYCData();
    } catch (err: any) {
      console.error('Error downloading CSV:', err);
      setError(err.message || 'CSV 다운로드에 실패했습니다');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadKYCData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{currentLanguage === 'ko' ? '로딩 중...' : 'Đang tải...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
        {/* 상단 바 */}
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />

        {/* 콘텐츠 */}
        <div className="px-6 py-6">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentLanguage === 'ko' ? 'KYC 데이터 관리' : 'Quản lý dữ liệu KYC'}
            </h1>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'ko' 
                ? `총 ${kycUsers.length}명의 인증 데이터`
                : `Tổng ${kycUsers.length} dữ liệu xác thực`}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={loadKYCData}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{currentLanguage === 'ko' ? '새로고침' : 'Làm mới'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={downloading || kycUsers.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-spin' : ''}`} />
              <span>{currentLanguage === 'ko' ? 'CSV 다운로드' : 'Tải CSV'}</span>
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 데이터 목록 */}
          {kycUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentLanguage === 'ko' ? 'KYC 데이터가 없습니다' : 'Không có dữ liệu KYC'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {kycUsers.map((user) => (
                <div
                  key={user.uid}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.fullName || '이름 없음'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-600">{user.phoneNumber || '-'}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.verificationStatus === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : user.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : user.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.verificationStatus === 'verified'
                        ? '인증완료'
                        : user.verificationStatus === 'pending'
                        ? '심사중'
                        : user.verificationStatus === 'rejected'
                        ? '거부'
                        : '미인증'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      {currentLanguage === 'ko' ? '신분증' : 'Giấy tờ'}:{' '}
                      {user.idType === 'passport' ? '여권' : user.idType === 'id_card' ? '신분증' : '-'}
                    </p>
                    {user.dateOfBirth && (
                      <p>
                        {currentLanguage === 'ko' ? '생년월일' : 'Ngày sinh'}: {user.dateOfBirth}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
