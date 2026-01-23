/**
 * KYC Step 1: 전화번호 인증 컴포넌트
 * 
 * Firebase Phone Auth 기반 UI
 */

'use client';

import { useState } from 'react';
import { Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneVerificationData } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';

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
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  // 인증번호 발송 (UI만 구현, 실제 API 연동은 추후)
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(
        currentLanguage === 'ko' ? '올바른 전화번호를 입력해주세요' : 
        currentLanguage === 'vi' ? 'Vui lòng nhập số điện thoại hợp lệ' : 
        currentLanguage === 'ja' ? '有効な電話番号を入力してください' : 
        currentLanguage === 'zh' ? '请输入有效的电话号码' : 
        'Please enter a valid phone number'
      );
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Firebase Phone Auth API 연동
    // const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
    // verificationId = confirmationResult.verificationId;

    // 시뮬레이션: 2초 후 인증번호 입력 단계로 이동
    setTimeout(() => {
      setStep('verify');
      setLoading(false);
    }, 2000);
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError(
        currentLanguage === 'ko' ? '6자리 인증번호를 입력해주세요' : 
        currentLanguage === 'vi' ? 'Vui lòng nhập mã xác thực 6 chữ số' : 
        currentLanguage === 'ja' ? '6桁の認証コードを入力してください' : 
        currentLanguage === 'zh' ? '请输入6位验证码' : 
        'Please enter 6-digit verification code'
      );
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Firebase Phone Auth 인증번호 확인
    // await confirmPhoneVerification(verificationCode);

    // 시뮬레이션: 인증 완료
    setTimeout(() => {
      onComplete({
        phoneNumber,
        verificationCode,
        verificationId: 'simulated_verification_id', // 실제로는 Firebase에서 받아옴
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 'input' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* 헤더 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
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
                  ? 'ホスト認証のために電話번호を認証してください'
                  : currentLanguage === 'zh'
                  ? '请验证手机号以进行房东认证'
                  : 'Please verify your phone number for host verification'}
              </p>
            </div>

            {/* 전화번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko' ? '전화번호' : 
                 currentLanguage === 'vi' ? 'Số điện thoại' : 
                 currentLanguage === 'ja' ? '電話番号' : 
                 currentLanguage === 'zh' ? '手机号' : 
                 'Phone Number'}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setPhoneNumber(formatted);
                    setError('');
                  }}
                  placeholder="+84..."
                  className="w-full pl-12 pr-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!phoneNumber || phoneNumber.length < 10) {
                  setError(
                    currentLanguage === 'ko' ? '올바른 전화번호를 입력해주세요' : 
                    currentLanguage === 'vi' ? 'Vui lòng nhập số điện thoại hợp lệ' : 
                    currentLanguage === 'ja' ? '有効な電話番号を入力してください' : 
                    currentLanguage === 'zh' ? '请输入有效的电话号码' : 
                    'Please enter a valid phone number'
                  );
                  return;
                }
                // 테스트용: 전화번호만 입력하면 완료
                onComplete({
                  phoneNumber,
                  verificationCode: 'test_code',
                  verificationId: 'test_verification_id',
                });
              }}
              disabled={!phoneNumber}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{currentLanguage === 'ko' ? '다음' : 
                     currentLanguage === 'vi' ? 'Tiếp theo' : 
                     currentLanguage === 'ja' ? '次へ' : 
                     currentLanguage === 'zh' ? '下一步' : 
                     'Next'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* 헤더 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '인증번호 입력' : 
                 currentLanguage === 'vi' ? 'Nhập mã xác thực' : 
                 currentLanguage === 'ja' ? '認証コード入力' : 
                 currentLanguage === 'zh' ? '输入验证码' : 
                 'Enter Verification Code'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' 
                  ? `${phoneNumber}로 발송된 인증번호를 입력해주세요`
                  : currentLanguage === 'vi'
                  ? `Vui lòng nhập mã xác thực đã gửi đến ${phoneNumber}`
                  : currentLanguage === 'ja'
                  ? `${phoneNumber}に送信された認証コードを入力してください`
                  : currentLanguage === 'zh'
                  ? `请输入发送到 ${phoneNumber} 的验证码`
                  : `Please enter the verification code sent to ${phoneNumber}`}
              </p>
            </div>

            {/* 인증번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko' ? '인증번호 (6자리)' : 
                 currentLanguage === 'vi' ? 'Mã xác thực (6 chữ số)' : 
                 currentLanguage === 'ja' ? '認証コード (6桁)' : 
                 currentLanguage === 'zh' ? '验证码 (6位)' : 
                 'Verification Code (6 digits)'}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                maxLength={6}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 인증번호 확인 버튼 */}
            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {currentLanguage === 'ko' ? '인증 중...' : 
                   currentLanguage === 'vi' ? 'Đang xác thực...' : 
                   currentLanguage === 'ja' ? '認証中...' : 
                   currentLanguage === 'zh' ? '验证中...' : 
                   'Verifying...'}
                </>
              ) : (
                <>
                  <span>{currentLanguage === 'ko' ? '인증하기' : 
                         currentLanguage === 'vi' ? 'Xác thực' : 
                         currentLanguage === 'ja' ? '認証する' : 
                         currentLanguage === 'zh' ? '立即验证' : 
                         'Verify'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={() => {
                setStep('input');
                setVerificationCode('');
                setError('');
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {currentLanguage === 'ko' ? '인증번호 다시 받기' : 
               currentLanguage === 'vi' ? 'Gửi lại mã xác thực' : 
               currentLanguage === 'ja' ? '認証コードを再送' : 
               currentLanguage === 'zh' ? '重新发送验证码' : 
               'Resend Code'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
