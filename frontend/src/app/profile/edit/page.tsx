/**
 * 개인정보 수정 페이지
 * 
 * 사용자 개인정보를 표시하고 수정할 수 있는 페이지
 * - 이메일, 전화번호, 언어, 성별 등 개인정보 표시 및 수정
 * - 하단에 회원탈퇴 버튼
 */

'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, CheckCircle2, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData, updateUserEmail, updateUserPhoneNumber, deleteAccount, UserData } from '@/lib/api/auth';
import { SupportedLanguage } from '@/lib/api/translation';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 편집 상태
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');
  
  // 언어 메뉴
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  // 회원탈퇴 모달
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 조건부 인증 설정
  const requirePhoneVerification = process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const fetchUserData = async () => {
        try {
          const data = await getCurrentUserData(user.uid);
          setUserData(data);
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, authLoading, router]);

  // 전화번호 편집 시작
  const handleStartEditPhone = () => {
    setEditPhone(userData?.phoneNumber || '');
    setIsEditingPhone(true);
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpCode('');
    setUpdateError('');
  };

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setEditPhone(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userData?.phoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setUpdatingPhone(true);
    setUpdateError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });
      
      if (response.ok) {
        setOtpSent(true);
        setOtpError('');
        return true;
      } else {
        const data = await response.json();
        setUpdateError(data.error || 'Failed to send OTP');
        return false;
      }
    } catch (err) {
      setUpdateError('System error occurred');
      return false;
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: editPhone, code: otpCode }),
      });
      if (response.ok) {
        setIsPhoneVerified(true);
        setOtpError('');
      } else {
        const data = await response.json();
        setOtpError(data.error || 'Invalid code');
      }
    } catch (err) {
      setOtpError('Verification error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!user) return;
    
    // 조건부 인증 체크
    if (requirePhoneVerification && !isPhoneVerified) {
      setUpdateError(currentLanguage === 'ko' ? '전화번호 인증이 필요합니다' : 'Vui lòng xác thực số điện thoại');
      return;
    }

    setUpdatingPhone(true);
    setUpdateError('');
    try {
      await updateUserPhoneNumber(user.uid, editPhone);
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingPhone(false);
      setEditPhone('');
      setIsPhoneVerified(false);
    } catch (error: any) {
      setUpdateError(error.message || getUIText('errorOccurred', currentLanguage));
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user || !editEmail.trim()) return;
    setUpdatingEmail(true);
    setUpdateError('');
    try {
      await updateUserEmail(user.uid, editEmail.trim());
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingEmail(false);
      setEditEmail('');
    } catch (error: any) {
      setUpdateError(error.message || getUIText('errorOccurred', currentLanguage));
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setCurrentLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageMenuOpen]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

        <div className="px-6 py-6">
          {/* 헤더 */}
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{getUIText('editProfile', currentLanguage)}</h1>
          </div>

          {/* 사용자 기본 정보 */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{userData?.displayName || user?.displayName || getUIText('notRegistered', currentLanguage)}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`px-2 py-0.5 text-xs rounded-full ${userData?.role === 'owner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {userData?.role === 'owner' ? getUIText('verified', currentLanguage) : getUIText('guest', currentLanguage)}
                  </div>
                  {userData?.phoneNumber && (
                    <div className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {userData.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 개인정보 수정 폼 */}
            {updateError && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{updateError}</div>}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-6">
              {/* 이메일 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Mail className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{getUIText('email', currentLanguage)}</p>
                    {isEditingEmail ? (
                      <input 
                        type="email" 
                        value={editEmail} 
                        onChange={(e) => setEditEmail(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border-2 border-blue-500 rounded-lg focus:outline-none" 
                        placeholder={getUIText('emailPlaceholder', currentLanguage)} 
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    )}
                  </div>
                  {!isEditingEmail ? (
                    <button 
                      onClick={() => { setEditEmail(user.email || ''); setIsEditingEmail(true); }} 
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                    >
                      {getUIText('change', currentLanguage)}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleEmailChange} 
                        disabled={updatingEmail || !editEmail.trim()} 
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg"
                      >
                        {updatingEmail ? '...' : getUIText('confirm', currentLanguage)}
                      </button>
                      <button 
                        onClick={() => setIsEditingEmail(false)} 
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
                      >
                        {getUIText('cancel', currentLanguage)}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 전화번호 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Phone className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{getUIText('phoneNumber', currentLanguage)}</p>
                    <p className="text-sm font-medium text-gray-900">{userData?.phoneNumber || getUIText('notRegistered', currentLanguage)}</p>
                  </div>
                  {!isEditingPhone && (
                    <button 
                      onClick={handleStartEditPhone} 
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                    >
                      {getUIText('change', currentLanguage)}
                    </button>
                  )}
                </div>

                {isEditingPhone && (
                  <div className="pl-11 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <InternationalPhoneInput 
                      currentLanguage={currentLanguage}
                      onPhoneChange={handlePhoneChange}
                      onSendOtp={handleSendOTP}
                      isLoading={updatingPhone}
                      disabled={isPhoneVerified}
                    />
                    
                    {otpSent && !isPhoneVerified && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input 
                              type="text" 
                              maxLength={6} 
                              value={otpCode} 
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                              placeholder="6-digit code" 
                              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleVerifyOTP} 
                            disabled={otpCode.length !== 6 || isVerifyingOtp} 
                            className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {isVerifyingOtp ? '...' : getUIText('confirm', currentLanguage)}
                          </button>
                        </div>
                        {otpError && <p className="text-xs text-red-500 pl-1">{otpError}</p>}
                      </div>
                    )}

                    {(isPhoneVerified || (!requirePhoneVerification && isPhoneComplete)) && (
                      <div className="space-y-3">
                        {isPhoneVerified && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{currentLanguage === 'ko' ? '인증 완료' : 'Đã xác minh'}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={handlePhoneSubmit} 
                            disabled={updatingPhone} 
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"
                          >
                            {updatingPhone ? '...' : getUIText('save', currentLanguage)}
                          </button>
                          <button 
                            onClick={() => setIsEditingPhone(false)} 
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm"
                          >
                            {getUIText('cancel', currentLanguage)}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!isPhoneVerified && !(!requirePhoneVerification && isPhoneComplete) && (
                      <button 
                        onClick={() => setIsEditingPhone(false)} 
                        className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {getUIText('cancel', currentLanguage)}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 언어 변경 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Globe className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{getUIText('preferredLanguage', currentLanguage)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {currentLanguage === 'ko' ? '🇰🇷' : 
                         currentLanguage === 'vi' ? '🇻🇳' : 
                         currentLanguage === 'ja' ? '🇯🇵' : 
                         currentLanguage === 'zh' ? '🇨🇳' : 
                         '🇺🇸'}
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {currentLanguage === 'ko' ? '한국어' : 
                         currentLanguage === 'vi' ? 'Tiếng Việt' : 
                         currentLanguage === 'ja' ? '日本語' : 
                         currentLanguage === 'zh' ? '中文' : 
                         'English'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)} 
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
                  >
                    {getUIText('change', currentLanguage)}
                  </button>
                </div>
                
                {/* 언어 선택 메뉴 */}
                {isLanguageMenuOpen && (
                  <div className="relative" ref={languageMenuRef}>
                    <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      {[
                        { code: 'ko', name: '한국어', flag: '🇰🇷' },
                        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
                        { code: 'en', name: 'English', flag: '🇺🇸' },
                        { code: 'ja', name: '日本語', flag: '🇯🇵' },
                        { code: 'zh', name: '中文', flag: '🇨🇳' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                            currentLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-xs text-gray-500">
                              {lang.code === 'ko' ? 'Korean' : 
                               lang.code === 'vi' ? 'Vietnamese' : 
                               lang.code === 'ja' ? 'Japanese' : 
                               lang.code === 'zh' ? 'Chinese' : 
                               'English'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 성별 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{getUIText('gender', currentLanguage)}</p>
                    <p className="text-sm font-medium text-gray-900">{userData?.gender || getUIText('notRegistered', currentLanguage)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼들 */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            {/* 회원탈퇴 버튼 */}
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full py-3 px-6 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100"
            >
              {currentLanguage === 'ko' ? '회원탈퇴' : 
               currentLanguage === 'vi' ? 'Rút tài khoản' : 
               currentLanguage === 'ja' ? 'アカウント退会' : 
               currentLanguage === 'zh' ? '账户注销' : 
               'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{getUIText('confirmDeletion', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-4">{getUIText('deleteAccountDesc', currentLanguage)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium">{getUIText('cancel', currentLanguage)}</button>
              <button onClick={async () => { if (!user) return; setDeleting(true); try { await deleteAccount(user.uid); setShowDeleteConfirm(false); setShowDeleteSuccess(true); } catch (error) { console.error(error); alert(getUIText('errorOccurred', currentLanguage)); setDeleting(false); } }} disabled={deleting} className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium">
                {deleting ? 
                  (currentLanguage === 'ko' ? '처리 중...' : 
                   currentLanguage === 'vi' ? 'Đang xử lý...' : 
                   currentLanguage === 'ja' ? '処理中...' : 
                   currentLanguage === 'zh' ? '处理中...' : 
                   'Processing...') : 
                  (currentLanguage === 'ko' ? '회원탈퇴' : 
                   currentLanguage === 'vi' ? 'Xóa tài khoản' : 
                   currentLanguage === 'ja' ? 'アカウント削除' : 
                   currentLanguage === 'zh' ? '删除账户' : 
                   'Delete Account')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 회원탈퇴 성공 모달 */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{getUIText('deleteAccountSuccess', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-6">{getUIText('deleteAccountSuccessDesc', currentLanguage)}</p>
            <button onClick={() => { setShowDeleteSuccess(false); router.push('/'); }} className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold">{getUIText('confirm', currentLanguage)}</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
