'use client';

import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';
import type { usePhoneVerificationStepState } from './usePhoneVerificationStepState';

type Vm = ReturnType<typeof usePhoneVerificationStepState>;

export function PhoneVerificationStepView(vm: Vm) {
  if (vm.checkingUser) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-gray-500">
          {vm.currentLanguage === 'ko'
            ? '로딩 중...'
            : vm.currentLanguage === 'vi'
              ? 'Đang tải...'
              : vm.currentLanguage === 'ja'
                ? '読み込み中...'
                : vm.currentLanguage === 'zh'
                  ? '加载中...'
                  : 'Loading...'}
        </div>
      </div>
    );
  }

  const {
    currentLanguage,
    initialPhoneNumber,
    userPhoneNumber,
    isPhoneVerified,
    otpSent,
    otpCode,
    setOtpCode,
    isVerifyingOtp,
    otpError,
    loading,
    error,
    recaptchaContainerId,
    handlePhoneChange,
    handleSendOTP,
    handleVerifyOTP,
    handleNext,
  } = vm;

  return (
    <div className="w-full space-y-6">
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

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {currentLanguage === 'ko'
            ? '전화번호 인증'
            : currentLanguage === 'vi'
              ? 'Xác thực số điện thoại'
              : currentLanguage === 'ja'
                ? '電話番号認証'
                : currentLanguage === 'zh'
                  ? '手机号验证'
                  : 'Phone Verification'}
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
              {currentLanguage === 'ko'
                ? '✅ 전화번호 인증이 완료되었습니다.'
                : currentLanguage === 'vi'
                  ? '✅ Xác thực số điện thoại đã hoàn tất.'
                  : currentLanguage === 'ja'
                    ? '✅ 電話番号認証が完了しました。'
                    : currentLanguage === 'zh'
                      ? '✅ 手机号验证已完成。'
                      : '✅ Phone number verification completed.'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <span>
              {currentLanguage === 'ko'
                ? '다음 단계로'
                : currentLanguage === 'vi'
                  ? 'Tiếp theo'
                  : currentLanguage === 'ja'
                    ? '次へ'
                    : currentLanguage === 'zh'
                      ? '下一步'
                      : 'Next Step'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
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
                    {isVerifyingOtp ? '...' : currentLanguage === 'ko' ? '인증' : 'Xác minh'}
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
                {currentLanguage === 'ko'
                  ? '전화번호 인증 완료'
                  : currentLanguage === 'vi'
                    ? 'Đã xác minh số điện thoại'
                    : currentLanguage === 'ja'
                      ? '電話番号認証完了'
                      : currentLanguage === 'zh'
                        ? '手机号验证完成'
                        : 'Phone verification completed'}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          <div id={recaptchaContainerId} style={{ display: 'none' }} />

          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 px-4 bg-yellow-500 text-white rounded-xl font-semibold text-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
            >
              {currentLanguage === 'ko'
                ? '테스트 모드로 진행'
                : currentLanguage === 'vi'
                  ? 'Tiếp theo (chế độ thử nghiệm)'
                  : currentLanguage === 'ja'
                    ? 'テストモードで進む'
                    : currentLanguage === 'zh'
                      ? '测试模式进行'
                      : 'Proceed in Test Mode'}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
