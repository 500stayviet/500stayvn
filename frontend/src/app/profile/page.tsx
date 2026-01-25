/**
 * Profile Page (개인정보 페이지)
 * 
 * 사용자 개인정보 및 설정 페이지
 * - 우리집 내놓기 버튼 (인증 상태에 따라 동작)
 * - 임대인 인증 폼
 */

'use client';
import { uploadToS3 } from '@/lib/s3-client'; 
import { updateUserData } from '@/lib/api/auth'; 
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Globe, Home, CheckCircle2, Building2, Calendar, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData, verifyOwner, OwnerVerificationData, UserData, updateUserEmail, updateUserPhoneNumber, deleteAccount } from '@/lib/api/auth';
import { getVerificationStatus } from '@/lib/api/kyc';
import { VerificationStatus } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('none');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  // 이메일/전화번호 편집 상태
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 조건부 인증 설정
  const requirePhoneVerification = process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true';
  
  // 모달 표시 여부 추적 (컴포넌트 내부에서만 사용)
  const popupShownRef = useRef(false);
  
  const [verificationData, setVerificationData] = useState<OwnerVerificationData>({
    fullName: '',
    phoneNumber: '',
  });

  // 프로필 사진 업로드 및 DB 저장 핸들러
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const imageUrl = await uploadToS3(file, "profile-pics");
      await updateUserData(user.uid, { photoURL: imageUrl });
      setUserData(prev => prev ? { ...prev, photoURL: imageUrl } : null);
      alert(getUIText('profileImageUpdated', currentLanguage));
    } catch (error) {
      console.error("프로필 업로드 에러:", error);
      alert(getUIText('uploadFailed', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

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
          const kycSteps = data?.kyc_steps || {};
          const completed = (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;
          const status = await getVerificationStatus(user.uid);
          setVerificationStatus(status);
          
          if (status === 'verified' && completed && !popupShownRef.current) {
            const popupKey = `kyc_success_modal_${user.uid}`;
            const hasShown = localStorage.getItem(popupKey);
            if (!hasShown) {
              popupShownRef.current = true;
              setShowSuccessPopup(true);
              localStorage.setItem(popupKey, 'true');
            }
          }
          
          if (data) {
            setVerificationData({
              fullName: data.displayName || '',
              phoneNumber: data.phoneNumber || '',
            });
          }
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const handleFocus = async () => {
      try {
        const data = await getCurrentUserData(user.uid);
        setUserData(data);
        const status = await getVerificationStatus(user.uid);
        setVerificationStatus(status);
      } catch (error) {}
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

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

  const isOwner = userData?.is_owner || false;
  const kycSteps = userData?.kyc_steps || {};
  const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;
  
  const getButtonConfig = () => {
    if (verificationStatus === 'verified' && isOwner && allStepsCompleted) {
      return {
        text: getUIText('registerPropertyDesc', currentLanguage),
        disabled: false,
        onClick: () => router.push('/add-property'),
        className: 'w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
      };
    }
    if (allStepsCompleted && verificationStatus === 'pending') {
      return {
        text: getUIText('verificationPending', currentLanguage),
        disabled: true,
        onClick: () => {},
        className: 'w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-4 px-6 rounded-2xl font-semibold text-base cursor-not-allowed opacity-75 flex items-center justify-center gap-3',
      };
    }
    if (verificationStatus === 'rejected') {
      return {
        text: getUIText('retry', currentLanguage),
        disabled: false,
        onClick: () => router.push('/kyc'),
        className: 'w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
      };
    }
    return {
      text: getUIText('listYourProperty', currentLanguage),
      disabled: false,
      onClick: () => router.push('/kyc'),
      className: 'w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

        <div className="px-6 py-6">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{getUIText('myPage', currentLanguage)}</h1>
          </div>

          {/* 임대인 메뉴 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">{getUIText('hostMenu', currentLanguage)}</h2>
              </div>
              {isOwner && allStepsCompleted && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">{getUIText('verified', currentLanguage)}</span>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button onClick={buttonConfig.onClick} disabled={buttonConfig.disabled} className={`w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 ${buttonConfig.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${verificationStatus === 'verified' && isOwner && allStepsCompleted ? 'bg-green-100' : verificationStatus === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                    <Home className={`w-5 h-5 ${verificationStatus === 'verified' && isOwner && allStepsCompleted ? 'text-green-600' : verificationStatus === 'pending' ? 'text-yellow-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{getUIText('listYourProperty', currentLanguage)}</p>
                    <p className="text-xs text-gray-500">
                      {verificationStatus === 'verified' && isOwner && allStepsCompleted ? getUIText('registerPropertyDesc', currentLanguage) : verificationStatus === 'pending' ? getUIText('verificationPending', currentLanguage) : getUIText('kycRequired', currentLanguage)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {isOwner && allStepsCompleted && (
                <>
                  <button onClick={() => router.push('/profile/my-properties')} className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg"><Building2 className="w-5 h-5 text-purple-600" /></div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{getUIText('manageMyProperties', currentLanguage)}</p>
                        <p className="text-xs text-gray-500">{getUIText('manageMyPropertiesDesc', currentLanguage)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => router.push('/host/bookings')} className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg"><Calendar className="w-5 h-5 text-orange-600" /></div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{getUIText('bookingManagement', currentLanguage)}</p>
                        <p className="text-xs text-gray-500">{getUIText('bookingManagementDesc', currentLanguage)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </>
              )}
              {(!isOwner || !allStepsCompleted) && (
                <div className="px-5 py-3 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">{getUIText('hostFeaturesNotice', currentLanguage)}</p>
                </div>
              )}
            </div>
          </div>

          {/* 임차인 메뉴 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-900">{getUIText('guestMenu', currentLanguage)}</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button onClick={() => router.push('/my-bookings')} className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg"><Calendar className="w-5 h-5 text-teal-600" /></div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{getUIText('myBookings', currentLanguage)}</p>
                    <p className="text-xs text-gray-500">{getUIText('myBookingsDesc', currentLanguage)}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 개인정보 수정 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">{getUIText('editProfile', currentLanguage)}</h2>
            </div>
            {updateError && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{updateError}</div>}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4">
              {/* 이메일 */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Mail className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{getUIText('email', currentLanguage)}</p>
                  {isEditingEmail ? (
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-1.5 text-sm border-2 border-blue-500 rounded-lg focus:outline-none" placeholder={getUIText('emailPlaceholder', currentLanguage)} />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  )}
                </div>
                {!isEditingEmail ? (
                  <button onClick={() => { setEditEmail(user.email || ''); setIsEditingEmail(true); }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">{getUIText('change', currentLanguage)}</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleEmailChange} disabled={updatingEmail || !editEmail.trim()} className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg">{updatingEmail ? '...' : getUIText('confirm', currentLanguage)}</button>
                    <button onClick={() => setIsEditingEmail(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg">{getUIText('cancel', currentLanguage)}</button>
                  </div>
                )}
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
                    <button onClick={handleStartEditPhone} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">{getUIText('change', currentLanguage)}</button>
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
                    
                    <AnimatePresence>
                      {otpSent && !isPhoneVerified && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <button type="button" onClick={handleVerifyOTP} disabled={otpCode.length !== 6 || isVerifyingOtp} className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-gray-200 disabled:text-gray-400">
                              {isVerifyingOtp ? '...' : getUIText('confirm', currentLanguage)}
                            </button>
                          </div>
                          {otpError && <p className="text-xs text-red-500 pl-1">{otpError}</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(isPhoneVerified || (!requirePhoneVerification && isPhoneComplete)) && (
                      <div className="space-y-3">
                        {isPhoneVerified && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{currentLanguage === 'ko' ? '인증 완료' : 'Đã xác minh'}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={handlePhoneSubmit} disabled={updatingPhone} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">{updatingPhone ? '...' : getUIText('save', currentLanguage)}</button>
                          <button onClick={() => setIsEditingPhone(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm">{getUIText('cancel', currentLanguage)}</button>
                        </div>
                      </div>
                    )}
                    
                    {!isPhoneVerified && !(!requirePhoneVerification && isPhoneComplete) && (
                      <button onClick={() => setIsEditingPhone(false)} className="w-full py-2 text-xs text-gray-500 hover:text-gray-700">{getUIText('cancel', currentLanguage)}</button>
                    )}
                  </div>
                )}
              </div>

              {/* 선호 언어 */}
              <div className="relative" ref={languageMenuRef}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Globe className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{getUIText('preferredLanguage', currentLanguage)}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {currentLanguage === 'ko' ? '한국어' : currentLanguage === 'vi' ? 'Tiếng Việt' : currentLanguage === 'ja' ? '日本語' : currentLanguage === 'zh' ? '中文' : 'English'}
                    </p>
                  </div>
                  <button onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">{getUIText('change', currentLanguage)}</button>
                </div>
                {isLanguageMenuOpen && (
                  <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {[{ code: 'en', name: 'English', flag: '🇺🇸' }, { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }, { code: 'ko', name: '한국어', flag: '🇰🇷' }, { code: 'ja', name: '日本語', flag: '🇯🇵' }, { code: 'zh', name: '中文', flag: '🇨🇳' }].map((lang) => (
                      <button key={lang.code} onClick={() => handleLanguageChange(lang.code as SupportedLanguage)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${currentLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 px-6 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100">{getUIText('deleteAccount', currentLanguage)}</button>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{getUIText('confirmDeletion', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-4">{getUIText('deleteAccountDesc', currentLanguage)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium">{getUIText('cancel', currentLanguage)}</button>
              <button onClick={async () => { if (!user) return; setDeleting(true); try { await deleteAccount(user.uid); setShowDeleteConfirm(false); setShowDeleteSuccess(true); } catch (error) { console.error(error); alert(getUIText('errorOccurred', currentLanguage)); setDeleting(false); } }} disabled={deleting} className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium">{deleting ? getUIText('processing', currentLanguage) : getUIText('deleteAccount', currentLanguage)}</button>
            </div>
          </motion.div>
        </div>
      )}

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

      {showSuccessPopup && verificationStatus === 'verified' && allStepsCompleted && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{getUIText('congratulations', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{getUIText('nowOwnerDesc', currentLanguage)}</p>
            <button onClick={() => { setShowSuccessPopup(false); popupShownRef.current = false; }} className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold">{getUIText('confirm', currentLanguage)}</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
