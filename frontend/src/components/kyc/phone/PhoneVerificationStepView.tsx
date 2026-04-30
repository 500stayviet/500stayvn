'use client';

import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';
import { getUIText } from '@/utils/i18n';
import type { usePhoneVerificationStepState } from './usePhoneVerificationStepState';

type Vm = ReturnType<typeof usePhoneVerificationStepState>;

export function PhoneVerificationStepView(vm: Vm) {
  if (vm.phase === 'loading_profile') {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-gray-500">
          {getUIText('loading', vm.currentLanguage)}
        </div>
      </div>
    );
  }

  const {
    currentLanguage,
    phase,
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
              {getUIText('kycFirebasePhoneTitle', currentLanguage)}
            </p>
            <p className="text-xs mt-1">
              {getUIText('kycFirebasePhoneSubtitle', currentLanguage)}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getUIText('kycPhoneVerificationHeading', currentLanguage)}
        </h2>
        <p className="text-sm text-gray-600">
          {getUIText('kycPhoneVerificationForHostDesc', currentLanguage)}
        </p>
      </div>

      {phase === 'verified_readonly' ? (
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
            <span>{getUIText('kycPhoneVerifiedLong', currentLanguage)}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <span>
              {getUIText('kycNextStep', currentLanguage)}
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
                      placeholder={getUIText('otpCodePlaceholder', currentLanguage)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpCode.length !== 6 || isVerifyingOtp}
                    className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {isVerifyingOtp ? '...' : getUIText('signupOtpVerify', currentLanguage)}
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
                {getUIText('phoneVerificationComplete', currentLanguage)}
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
              {getUIText('kycTestModeProceed', currentLanguage)}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
