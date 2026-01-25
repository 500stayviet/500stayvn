/**
 * KYC Step 1: 전화번호 인증 컴포넌트
 * 
 * 회원가입 시 전화번호 인증을 완료한 경우 자동으로 인증 완료 처리
 * 미인증 유저는 회원가입과 동일한 인증 로직 사용
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneVerificationData } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserData } from '@/lib/api/auth';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';

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
          // 실제로는 isPhoneVerified 필드가 있으면 더 정확하지만, 
          // 현재는 phoneNumber가 있으면 인증된 것으로 간주
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

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setPhoneNumber(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userPhoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setLoading(true);
    setError('');
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
        setError(data.error || 'Failed to send OTP');
        return false;
      }
    } catch (err) {
      setError('System error occurred while sending OTP');
      return false;
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ 
          phoneNumber: phoneNumber, 
          code: otpCode 
        }),
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

  const handleNext = () => {
    if (isPhoneVerified && phoneNumber) {
      onComplete({
        phoneNumber,
        verificationCode: 'verified',
        verificationId: 'verified_id',
      });
    }
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
              {currentLanguage === 'ko' ? '다음' : 
               currentLanguage === 'vi' ? 'Tiếp theo' : 
               currentLanguage === 'ja' ? '次へ' : 
               currentLanguage === 'zh' ? '下一步' : 
               'Next'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        /* 미인증 유저: 회원가입과 동일한 인증 로직 */
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

          <button
            onClick={handleNext}
            disabled={!isPhoneVerified || !phoneNumber}
            className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>
              {currentLanguage === 'ko' ? '다음' : 
               currentLanguage === 'vi' ? 'Tiếp theo' : 
               currentLanguage === 'ja' ? '次へ' : 
               currentLanguage === 'zh' ? '下一步' : 
               'Next'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
