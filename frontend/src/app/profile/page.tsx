/**
 * Profile Page (개인정보 페이지)
 * 
 * 사용자 개인정보 및 설정 페이지
 * - 우리집 내놓기 버튼 (인증 상태에 따라 동작)
 * - 임대인 인증 폼
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, Home, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData, verifyOwner, OwnerVerificationData, UserData, updateUserEmail, updateUserPhoneNumber, deleteAccount } from '@/lib/api/auth';
import { getVerificationStatus } from '@/lib/api/kyc';
import { VerificationStatus } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';
import TopBar from '@/components/TopBar';

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
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 모달 표시 여부 추적 (컴포넌트 내부에서만 사용)
  const popupShownRef = useRef(false);
  
  const [verificationData, setVerificationData] = useState<OwnerVerificationData>({
    fullName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Firestore에서 사용자 정보 가져오기
      const fetchUserData = async () => {
        try {
          const data = await getCurrentUserData(user.uid);
          setUserData(data);
          
          // KYC 단계 확인
          const kycSteps = data?.kyc_steps || {};
          const completed = (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;
          
          // 인증 상태 가져오기
          const status = await getVerificationStatus(user.uid);
          setVerificationStatus(status);
          
          // KYC 인증이 완료된 경우 (3단계 통과 + 코인 3개 받은 후) 성공 모달 표시
          if (status === 'verified' && completed && !popupShownRef.current) {
            // 이미 이 사용자에게 모달을 표시했는지 확인 (사용자별로 저장)
            const popupKey = `kyc_success_modal_${user.uid}`;
            const hasShown = localStorage.getItem(popupKey);
            
            // 아직 표시하지 않았으면 표시
            if (!hasShown) {
              popupShownRef.current = true;
              setShowSuccessPopup(true);
              localStorage.setItem(popupKey, 'true');
            }
          }
          
          // 기존 정보가 있으면 폼에 채우기
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

  // 페이지 포커스 시 데이터 다시 로드 (KYC 완료 후 돌아왔을 때)
  useEffect(() => {
    if (!user) return;

    const handleFocus = async () => {
      try {
        const data = await getCurrentUserData(user.uid);
        setUserData(data);
        
        const status = await getVerificationStatus(user.uid);
        setVerificationStatus(status);
      } catch (error) {
        // Silent fail
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // 전화번호 포맷팅 (베트남 형식)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('84')) {
      return `+${numbers}`;
    } else if (numbers.startsWith('0')) {
      return `+84${numbers.substring(1)}`;
    } else if (numbers) {
      return `+84${numbers}`;
    }
    return '';
  };

  // 인증 폼 입력 핸들러
  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const formatted = formatPhoneNumber(value);
      setVerificationData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setVerificationData((prev) => ({ ...prev, [name]: value }));
    }
    setVerificationError('');
  };

  // 임대인 인증 제출
  const handleVerifyOwner = async () => {
    if (!user) return;

    setVerificationError('');

    // 유효성 검사
    if (!verificationData.fullName.trim()) {
      setVerificationError(currentLanguage === 'ko' ? '이름을 입력해주세요' : 'Vui lòng nhập họ tên');
      return;
    }

    if (!verificationData.phoneNumber || verificationData.phoneNumber.length < 10) {
      setVerificationError(
        currentLanguage === 'ko' ? '올바른 전화번호를 입력해주세요' : 
        currentLanguage === 'vi' ? 'Vui lòng nhập số điện thoại hợp lệ' : 
        'Please enter a valid phone number'
      );
      return;
    }

    setVerifying(true);

    try {
      await verifyOwner(user.uid, verificationData);
      
      // 사용자 데이터 새로고침
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      
      setShowVerificationForm(false);
    } catch (error: any) {
      setVerificationError(
        error.message || (
          currentLanguage === 'ko' ? '인증에 실패했습니다' : 
          currentLanguage === 'vi' ? 'Xác thực thất bại' : 
          'Verification failed'
        )
      );
    } finally {
      setVerifying(false);
    }
  };

  // 매물 등록 페이지로 이동
  const handleRegisterProperty = () => {
    router.push('/add-property');
  };

  // KYC 인증 페이지로 이동
  const handleStartKYC = () => {
    router.push('/kyc');
  };

  // 언어 변경 핸들러 (Context가 자동으로 Firestore에 저장)
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setCurrentLanguage(lang);
    setIsLanguageMenuOpen(false);
  };

  // 이메일 편집 시작
  const handleStartEditEmail = () => {
    setEditEmail(userData?.email || user?.email || '');
    setIsEditingEmail(true);
    setUpdateError('');
  };

  // 전화번호 편집 시작
  const handleStartEditPhone = () => {
    setEditPhone(userData?.phoneNumber || '');
    setIsEditingPhone(true);
    setUpdateError('');
  };

  // 이메일 변경 핸들러
  const handleEmailChange = async () => {
    if (!user || !editEmail.trim()) return;

    setUpdatingEmail(true);
    setUpdateError('');

    try {
      await updateUserEmail(user.uid, editEmail.trim());
      // 사용자 데이터 다시 로드
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingEmail(false);
      setEditEmail('');
    } catch (error: any) {
      setUpdateError(error.message || (currentLanguage === 'ko' ? '이메일 변경에 실패했습니다' : 'Cập nhật email thất bại'));
    } finally {
      setUpdatingEmail(false);
    }
  };

  // 전화번호 변경 핸들러
  const handlePhoneChange = async () => {
    if (!user || !editPhone.trim()) return;

    setUpdatingPhone(true);
    setUpdateError('');

    try {
      const formattedPhone = formatPhoneNumber(editPhone);
      await updateUserPhoneNumber(user.uid, formattedPhone);
      // 사용자 데이터 다시 로드
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingPhone(false);
      setEditPhone('');
    } catch (error: any) {
      setUpdateError(error.message || (currentLanguage === 'ko' ? '전화번호 변경에 실패했습니다' : 'Cập nhật số điện thoại thất bại'));
    } finally {
      setUpdatingPhone(false);
    }
  };

  // 외부 클릭 시 언어 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isOwner = userData?.is_owner || false;
  const kycSteps = userData?.kyc_steps || {};
  
  // KYC 단계 완료 여부 확인
  const completedSteps = {
    step1: kycSteps.step1 || false,
    step2: kycSteps.step2 || false,
    step3: kycSteps.step3 || false,
  };
  const allStepsCompleted = completedSteps.step1 && completedSteps.step2 && completedSteps.step3;
  
  // 버튼 텍스트 및 동작 결정
  const getButtonConfig = () => {
    // 3단계 모두 완료되고 verified 상태인 경우
    if (verificationStatus === 'verified' && isOwner && allStepsCompleted) {
      return {
        text: currentLanguage === 'ko' ? '우리집 등록하기(후)' : 
              currentLanguage === 'vi' ? 'Đăng ký nhà (sau)' : 
              'Register Property (After)',
        disabled: false,
        onClick: handleRegisterProperty,
        className: 'w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
      };
    }
    
    // 3단계 모두 완료되었지만 아직 심사 중인 경우
    if (allStepsCompleted && verificationStatus === 'pending') {
      return {
        text: currentLanguage === 'ko' ? '인증 심사 중' : 
              currentLanguage === 'vi' ? 'Đang xét duyệt' : 
              'Verification Pending',
        disabled: true,
        onClick: () => {},
        className: 'w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-4 px-6 rounded-2xl font-semibold text-base cursor-not-allowed opacity-75 flex items-center justify-center gap-3',
      };
    }
    
    if (verificationStatus === 'rejected') {
      return {
        text: currentLanguage === 'ko' ? '인증 재신청' : 
              currentLanguage === 'vi' ? 'Xác thực lại' : 
              'Re-apply Verification',
        disabled: false,
        onClick: handleStartKYC,
        className: 'w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
      };
    }
    
    // verification_status: 'none' 또는 기본 상태
    return {
      text: currentLanguage === 'ko' ? '우리집 내놓기(전)' : 
            currentLanguage === 'vi' ? 'Cho thuê nhà (trước)' : 
            'List Your Property (Before)',
      disabled: false,
      onClick: handleStartKYC,
      className: 'w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3',
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
        {/* 상단 바 */}
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={true}
        />

        {/* 콘텐츠 */}
        <div className="px-6 py-6">


          {/* 헤더 */}
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLanguage === 'ko' ? '개인정보' : 
               currentLanguage === 'vi' ? 'Thông tin cá nhân' : 
               'Profile'}
            </h1>
            {/* 임대인 인증 배지 */}
            {isOwner && allStepsCompleted && (
              <span className="px-3 py-1 bg-white border-2 border-green-500 text-green-600 text-xs font-semibold rounded-full">
                {currentLanguage === 'ko' ? '임대인 인증' : 
                 currentLanguage === 'vi' ? 'Xác thực chủ nhà' : 
                 'Owner Verified'}
              </span>
            )}
          </div>

          {/* 우리집 내놓기 / 인증 심사 중 / 내집 등록하기 버튼 */}
          <div className="mb-4">
            <button
              onClick={buttonConfig.onClick}
              disabled={buttonConfig.disabled}
              className={buttonConfig.className}
            >
              <Home className="w-5 h-5" />
              <span>{buttonConfig.text}</span>
            </button>
            
            {/* 인증 심사 중 안내 */}
            {verificationStatus === 'pending' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800 text-center">
                  {currentLanguage === 'ko' 
                    ? '인증 심사가 진행 중입니다. 완료되면 알림을 드리겠습니다.'
                    : currentLanguage === 'vi'
                    ? 'Đang xét duyệt xác thực. Chúng tôi sẽ thông báo khi hoàn thành.'
                    : 'Verification is in progress. We will notify you when completed.'}
                </p>
              </div>
            )}
          </div>

          {/* 임대인 인증 폼 */}
          {showVerificationForm && !isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {currentLanguage === 'ko' ? '임대인 인증' : 
                   currentLanguage === 'vi' ? 'Xác thực chủ nhà' : 
                   'Owner Verification'}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'ko' 
                    ? '임대인 인증을 위해 이름과 전화번호 인증이 필요합니다'
                    : currentLanguage === 'vi'
                    ? 'Cần xác thực tên và số điện thoại để xác nhận chủ nhà'
                    : 'Name and phone number verification is required for owner verification'}
                </p>
              </div>

              <div className="space-y-4">
                {/* 이름 입력 */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {currentLanguage === 'ko' ? '이름' : 
                     currentLanguage === 'vi' ? 'Họ tên' : 
                     'Full Name'}
                    <span className="text-red-500 text-xs ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={verificationData.fullName}
                      onChange={handleVerificationChange}
                      placeholder={currentLanguage === 'ko' ? '이름을 입력하세요' : 
                                   currentLanguage === 'vi' ? 'Nhập họ tên' : 
                                   'Enter your name'}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* 전화번호 입력 */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {currentLanguage === 'ko' ? '전화번호' : 
                     currentLanguage === 'vi' ? 'Số điện thoại' : 
                     'Phone Number'}
                    <span className="text-red-500 text-xs ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={verificationData.phoneNumber}
                      onChange={handleVerificationChange}
                      placeholder="+84..."
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* 에러 메시지 */}
                {verificationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {verificationError}
                  </div>
                )}

                {/* 버튼들 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowVerificationForm(false);
                      setVerificationError('');
                    }}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
                  >
                    {currentLanguage === 'ko' ? '취소' : 
                     currentLanguage === 'vi' ? 'Hủy' : 
                     'Cancel'}
                  </button>
                  <button
                    onClick={handleVerifyOwner}
                    disabled={verifying}
                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {currentLanguage === 'ko' ? '인증 중...' : 
                         currentLanguage === 'vi' ? 'Đang xác thực...' : 
                         'Verifying...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {currentLanguage === 'ko' ? '인증하기' : 
                         currentLanguage === 'vi' ? 'Xác thực' : 
                         'Verify'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}


          {/* 내 매물 관리 버튼 (인증 3단계 완료 시에만 활성화) */}
          {isOwner && allStepsCompleted && (
            <div className="mb-4">
              <button
                onClick={() => router.push('/profile/my-properties')}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-semibold text-base hover:from-purple-700 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 mb-4"
              >
                <Building2 className="w-5 h-5" />
                <span>
                  {currentLanguage === 'ko' ? '내 매물 관리' : 
                   currentLanguage === 'vi' ? 'Quản lý bất động sản' : 
                   'My Properties'}
                </span>
              </button>
              
              {/* 예약된 매물 관리 버튼 (인증 3단계 완료 시에만 활성화) */}
              <button
                onClick={() => router.push('/profile/reservations')}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-semibold text-base hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5" />
                <span>
                  {currentLanguage === 'ko' ? '예약된 매물 관리' : 
                   currentLanguage === 'vi' ? 'Quản lý đặt phòng' : 
                   'Reservation Management'}
                </span>
              </button>
            </div>
          )}

          {/* 인증 미완료 안내 */}
          {isOwner && !allStepsCompleted && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 text-center">
                {currentLanguage === 'ko' 
                  ? '내 매물 관리와 예약된 매물 관리를 사용하려면 KYC 인증 3단계를 모두 완료해야 합니다.'
                  : currentLanguage === 'vi'
                  ? 'Để sử dụng quản lý bất động sản và quản lý đặt phòng, bạn cần hoàn thành tất cả 3 bước xác thực KYC.'
                  : 'To use property management and reservation management, you need to complete all 3 KYC verification steps.'}
              </p>
            </div>
          )}

          {/* 에러 메시지 (이메일/전화번호 변경) */}
          {updateError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {updateError}
            </div>
          )}

          {/* 사용자 정보 카드 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            {/* 이메일 */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '이메일' : 
                     currentLanguage === 'vi' ? 'Email' : 
                     'Email'}
                  </p>
                  {isEditingEmail ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={currentLanguage === 'ko' ? '이메일을 입력하세요' : 'Nhập email'}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  )}
                </div>
                {!isEditingEmail ? (
                  <button
                    onClick={handleStartEditEmail}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                    {currentLanguage === 'ko' ? '변경하기' : 
                     currentLanguage === 'vi' ? 'Thay đổi' : 
                     'Change'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEmailChange}
                      disabled={updatingEmail || !editEmail.trim()}
                      className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingEmail 
                        ? (currentLanguage === 'ko' ? '저장 중...' : 'Đang lưu...')
                        : (currentLanguage === 'ko' ? '확인' : 'Xác nhận')
                      }
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setEditEmail('');
                        setUpdateError('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-all active:scale-95"
                    >
                      {currentLanguage === 'ko' ? '취소' : 'Hủy'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 이름 */}
            {userData?.displayName && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '이름' : 
                     currentLanguage === 'vi' ? 'Họ tên' : 
                     'Name'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{userData.displayName}</p>
                </div>
              </div>
            )}

            {/* 전화번호 */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '전화번호' : 
                     currentLanguage === 'vi' ? 'Số điện thoại' : 
                     'Phone Number'}
                  </p>
                  {isEditingPhone ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setEditPhone(formatted);
                        setUpdateError('');
                      }}
                      className="w-full px-3 py-1.5 text-sm border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+84..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.phoneNumber || (currentLanguage === 'ko' ? '등록되지 않음' : 'Chưa đăng ký')}
                    </p>
                  )}
                </div>
                {!isEditingPhone ? (
                  <button
                    onClick={handleStartEditPhone}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                    {currentLanguage === 'ko' ? '변경하기' : 
                     currentLanguage === 'vi' ? 'Thay đổi' : 
                     'Change'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handlePhoneChange}
                      disabled={updatingPhone || !editPhone.trim()}
                      className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingPhone 
                        ? (currentLanguage === 'ko' ? '저장 중...' : 'Đang lưu...')
                        : (currentLanguage === 'ko' ? '확인' : 'Xác nhận')
                      }
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhone(false);
                        setEditPhone('');
                        setUpdateError('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-all active:scale-95"
                    >
                      {currentLanguage === 'ko' ? '취소' : 'Hủy'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 선호 언어 */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {currentLanguage === 'ko' ? '선호 언어' : 
                     currentLanguage === 'vi' ? 'Ngôn ngữ ưa thích' : 
                     'Preferred Language'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {currentLanguage === 'ko' ? '한국어' : 
                     currentLanguage === 'vi' ? 'Tiếng Việt' : 
                     'English'}
                  </p>
                </div>
                <button
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                  {currentLanguage === 'ko' ? '변경하기' : 
                   currentLanguage === 'vi' ? 'Thay đổi' : 
                   'Change'}
                </button>
              </div>

              {/* 언어 선택 드롭다운 (홈 화면과 동일한 스타일) */}
              {isLanguageMenuOpen && (
                <div className="absolute left-0 right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  {[
                    { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
                    { code: 'vi' as SupportedLanguage, name: 'Tiếng Việt', flag: '🇻🇳' },
                    { code: 'ko' as SupportedLanguage, name: '한국어', flag: '🇰🇷' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                        currentLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 회원탈퇴 버튼 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 px-6 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-all"
            >
              {currentLanguage === 'ko' ? '회원탈퇴' : 
               currentLanguage === 'vi' ? 'Xóa tài khoản' : 
               'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {currentLanguage === 'ko' ? '회원탈퇴 확인' : 
               currentLanguage === 'vi' ? 'Xác nhận xóa tài khoản' : 
               'Confirm Account Deletion'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {currentLanguage === 'ko' 
                ? '정말 회원탈퇴를 하시겠습니까? 탈퇴 후 30일 이내에 재가입이 가능하며, 동일한 이메일로 가입할 수 있습니다.'
                : currentLanguage === 'vi'
                ? 'Bạn có chắc chắn muốn xóa tài khoản? Bạn có thể đăng ký lại trong vòng 30 ngày với cùng email.'
                : 'Are you sure you want to delete your account? You can re-register within 30 days with the same email.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {currentLanguage === 'ko' ? '취소' : 
                 currentLanguage === 'vi' ? 'Hủy' : 
                 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  
                  setDeleting(true);
                  try {
                    await deleteAccount(user.uid);
                    setShowDeleteConfirm(false);
                    setShowDeleteSuccess(true);
                  } catch (error: any) {
                    console.error('Delete account error:', error);
                    alert(
                      currentLanguage === 'ko' 
                        ? '회원탈퇴 중 오류가 발생했습니다.'
                        : currentLanguage === 'vi'
                        ? 'Đã xảy ra lỗi khi xóa tài khoản.'
                        : 'An error occurred while deleting the account.'
                    );
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting 
                  ? (currentLanguage === 'ko' ? '처리 중...' : 
                     currentLanguage === 'vi' ? 'Đang xử lý...' : 
                     'Processing...')
                  : (currentLanguage === 'ko' ? '탈퇴하기' : 
                     currentLanguage === 'vi' ? 'Xóa tài khoản' : 
                     'Delete Account')
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 회원탈퇴 성공 모달 */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '회원탈퇴 완료' : 
                 currentLanguage === 'vi' ? 'Xóa tài khoản thành công' : 
                 'Account Deleted'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {currentLanguage === 'ko' 
                  ? '회원탈퇴가 완료되었습니다. 30일 이내에 재가입이 가능하며, 동일한 이메일로 가입할 수 있습니다.'
                  : currentLanguage === 'vi'
                  ? 'Tài khoản đã được xóa thành công. Bạn có thể đăng ký lại trong vòng 30 ngày với cùng email.'
                  : 'Your account has been deleted. You can re-register within 30 days with the same email.'}
              </p>
              <button
                onClick={() => {
                  setShowDeleteSuccess(false);
                  router.push('/');
                }}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                {currentLanguage === 'ko' ? '확인' : 
                 currentLanguage === 'vi' ? 'Xác nhận' : 
                 'OK'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* KYC 인증 완료 모달 */}
      {showSuccessPopup && verificationStatus === 'verified' && allStepsCompleted && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'ko' ? '축하합니다!' : 
                 currentLanguage === 'vi' ? 'Chúc mừng!' : 
                 'Congratulations!'}
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {currentLanguage === 'ko' 
                  ? '이제 임대인이 되었습니다. 정상적으로 매물 등록이 가능합니다.'
                  : currentLanguage === 'vi'
                  ? 'Bây giờ bạn đã trở thành chủ nhà. Bạn có thể đăng ký bất động sản bình thường.'
                  : 'You are now an owner. You can register properties normally.'}
              </p>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  popupShownRef.current = false;
                }}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                {currentLanguage === 'ko' ? '확인' : 
                 currentLanguage === 'vi' ? 'Xác nhận' : 
                 'OK'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
