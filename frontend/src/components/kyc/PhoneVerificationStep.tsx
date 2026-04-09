/**
 * KYC Step 1: 전화번호 인증
 *
 * Firebase **Authentication** 클라이언트 SDK만 사용 (`signInWithPhoneNumber`).
 * Firestore / Storage 등 Firebase DB는 사용하지 않음.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneVerificationData } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserData } from '@/lib/api/auth';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';
import { 
  auth, 
  createRecaptchaVerifier, 
  sendPhoneVerificationCode,
  verifyPhoneCode 
} from '@/lib/firebase/firebase';

interface PhoneVerificationStepProps {
  currentLanguage: SupportedLanguage;
  onComplete: (data: PhoneVerificationData) => void;
  initialPhoneNumber?: string;
}

export default function PhoneVerificationStep({
  currentLanguage,
  onComplete,
  initialPhoneNumber = '',
}: PhoneVerificationStepProps) {
  const { user } = useAuth();
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  const recaptchaContainerId = 'recaptcha-container';

  // 사용자 인증 정보 확인
  useEffect(() => {
    const checkUserVerification = async () => {
      if (!user) {
        setCheckingUser(false);
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);
        if (userData?.phoneNumber) {
          setUserPhoneNumber(userData.phoneNumber);
          // 회원가입 시 전화번호 인증을 완료했다고 가정
          setIsPhoneVerified(true);
          setPhoneNumber(userData.phoneNumber);
        }
      } catch (error) {
        console.error('Error checking user verification:', error);
      } finally {
        setCheckingUser(false);
      }
    };

    checkUserVerification();
  }, [user]);

  // reCAPTCHA 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // reCAPTCHA 컨테이너 생성 (invisible)
      const container = document.getElementById(recaptchaContainerId);
      if (!container) {
        const div = document.createElement('div');
        div.id = recaptchaContainerId;
        div.style.display = 'none';
        document.body.appendChild(div);
      }

      // reCAPTCHA verifier 초기화
      try {
        recaptchaVerifierRef.current = createRecaptchaVerifier(recaptchaContainerId);
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setPhoneNumber(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userPhoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setConfirmationResult(null);
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    setOtpError('');
    
    try {
      // reCAPTCHA 확인
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Firebase 전화번호 인증 요청
      const result = await sendPhoneVerificationCode(
        normalizedPhone,
        recaptchaVerifierRef.current
      );
      
      setConfirmationResult(result);
      setOtpSent(true);
      setOtpError('');
      
      // 성공 메시지
      console.log('Verification code sent via Firebase');
      return true;
    } catch (err: any) {
      console.error('Firebase phone auth error:', err);
      
      // 에러 메시지 처리
      let errorMessage = 'Failed to send verification code';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later';
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = 'reCAPTCHA verification failed. Please refresh the page';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6 || !confirmationResult) return;
    
    setIsVerifyingOtp(true);
    setOtpError('');
    
    try {
      // Firebase 인증 코드 확인
      const result = await verifyPhoneCode(confirmationResult, otpCode);
      
      // 인증 성공
      setIsPhoneVerified(true);
      setOtpError('');
      
      // 인증된 전화번호 추출
      const verifiedPhoneNumber = result.user?.phoneNumber || phoneNumber;
      
      // Supabase에 저장할 데이터 준비
      const verificationData: PhoneVerificationData = {
        phoneNumber: verifiedPhoneNumber,
        verificationCode: otpCode,
        verificationId: result.user?.uid || 'firebase_verified',
      };
      
      // 부모 컴포넌트에 완료 알림 (Supabase 저장은 부모에서 처리)
      onComplete(verificationData);
      
      console.log('Phone verification successful:', verifiedPhoneNumber);
    } catch (err: any) {
      console.error('Firebase verification error:', err);
      
      // 에러 메시지 처리
      let errorMessage = 'Invalid verification code';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid code. Please check and try again';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'Code expired. Please request a new code';
      }
      
      setOtpError(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleNext = () => {
    // 테스트 모드: 실제 인증 없이 다음 단계로 진행
    const testPhoneNumber = phoneNumber || '01012345678';
    console.log('Phone verification step completed (test mode)');
    
    // 테스트 데이터로 완료 처리
    onComplete({
      phoneNumber: testPhoneNumber,
      verificationCode: 'test_mode',
      verificationId: 'test_mode_id',
    });
  };

  if (checkingUser) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-gray-500">
          {currentLanguage === 'ko' ? '로딩 중...' : 
           currentLanguage === 'vi' ? 'Đang tải...' : 
           currentLanguage === 'ja' ? '読み込み中...' : 
           currentLanguage === 'zh' ? '加载中...' : 
           'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Firebase 전화번호 인증 안내 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📱</span>
          <div>
            <p className="font-medium">
              {currentLanguage === 'ko' 
                ? 'Firebase 전화번호 인증'
                : currentLanguage === 'vi'
                ? 'Xác thực số điện thoại bằng Firebase'
                : currentLanguage === 'ja'
                ? 'Firebase電話番号認証'
                : currentLanguage === 'zh'
                ? 'Firebase手机号验证'
                : 'Firebase Phone Authentication'}
            </p>
            <p className="text-xs mt-1">
              {currentLanguage === 'ko' 
                ? 'Google Firebase를 통한 안전한 전화번호 인증'
                : currentLanguage === 'vi'
                ? 'Xác thực số điện thoại an toàn qua Google Firebase'
                : currentLanguage === 'ja'
                ? 'Google Firebaseによる安全な電話番号認証'
                : currentLanguage === 'zh'
                ? '通过Google Firebase进行安全的手机号验证'
                : 'Secure phone verification via Google Firebase'}
            </p>
          </div>
        </div>
      </div>

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {currentLanguage === 'ko' ? '전화번호 인증' : 
           currentLanguage === 'vi' ? 'Xác thực số điện thoại' : 
           currentLanguage === 'ja' ? '電話番号認証' : 
           currentLanguage === 'zh' ? '手机号验证' : 
           'Phone Verification'}
        </h2>
        <p className="text-sm text-gray-600">
          {currentLanguage === 'ko' 
            ? '임대인 인증을 위해 전화번호를 인증해주세요'
            : currentLanguage === 'vi'
            ? 'Vui lòng xác thực số điện thoại để xác nhận chủ nhà'
            : currentLanguage === 'ja'
            ? 'ホスト認証のために電話番号を認証してください'
            : currentLanguage === 'zh'
            ? '请验证手机号以进行房东认证'
            : 'Please verify your phone number for host verification'}
        </p>
      </div>

      {/* 인증된 유저: 읽기 전용 표시 */}
      {isPhoneVerified && userPhoneNumber ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <InternationalPhoneInput
            currentLanguage={currentLanguage}
            onPhoneChange={() => {}}
            initialValue={userPhoneNumber}
            disabled={true}
          />
          
          <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {currentLanguage === 'ko' ? '✅ 전화번호 인증이 완료되었습니다.' : 
               currentLanguage === 'vi' ? '✅ Xác thực số điện thoại đã hoàn tất.' : 
               currentLanguage === 'ja' ? '✅ 電話番号認証が完了しました。' : 
               currentLanguage === 'zh' ? '✅ 手机号验证已完成。' : 
               '✅ Phone number verification completed.'}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <span>
              {currentLanguage === 'ko' ? '다음 단계로' : 
               currentLanguage === 'vi' ? 'Tiếp theo' : 
               currentLanguage === 'ja' ? '次へ' : 
               currentLanguage === 'zh' ? '下一步' : 
               'Next Step'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        /* 미인증 유저: Firebase 전화번호 인증 */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <InternationalPhoneInput
            currentLanguage={currentLanguage}
            onPhoneChange={handlePhoneChange}
            onSendOtp={handleSendOTP}
            isLoading={loading}
            disabled={isPhoneVerified}
            initialValue={initialPhoneNumber}
          />

          {/* OTP 입력창 (발송된 경우에만 표시) */}
          <AnimatePresence>
            {otpSent && !isPhoneVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                    {isVerifyingOtp ? '...' : (currentLanguage === 'ko' ? '인증' : 'Xác minh')}
                  </button>
                </div>
                {otpError && <p className="text-xs text-red-500 pl-1">{otpError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {isPhoneVerified && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {currentLanguage === 'ko' ? '전화번호 인증 완료' : 
                 currentLanguage === 'vi' ? 'Đã xác minh số điện thoại' : 
                 currentLanguage === 'ja' ? '電話番号認証完了' : 
                 currentLanguage === 'zh' ? '手机号验证完成' : 
                 'Phone verification completed'}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* reCAPTCHA 컨테이너 (invisible) */}
          <div id={recaptchaContainerId} style={{ display: 'none' }} />

          {/* 테스트 모드 버튼 (개발용) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 bg-yellow-500 text-white rounded-xl font-semibold text-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
            >
              {currentLanguage === 'ko' ? '테스트 모드로 진행' : 
               currentLanguage === 'vi' ? 'Tiếp theo (chế độ thử nghiệm)' : 
               currentLanguage === 'ja' ? 'テストモードで進む' : 
               currentLanguage === 'zh' ? '测试模式进行' : 
               'Proceed in Test Mode'}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}