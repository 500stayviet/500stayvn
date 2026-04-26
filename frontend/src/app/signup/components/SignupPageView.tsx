"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import InternationalPhoneInput from "@/components/auth/InternationalPhoneInput";
import type { SignupPageViewModel } from "../hooks/useSignupPage";

type Props = { vm: SignupPageViewModel };

export function SignupPageView({ vm }: Props) {
  const {
    router,
    currentLanguage,
    setCurrentLanguage,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    error,
    otpSent,
    otpCode,
    setOtpCode,
    isPhoneVerified,
    isVerifyingOtp,
    otpError,
    formData,
    handleChange,
    handlePhoneChange,
    handleSendOTP,
    handleVerifyOTP,
    handleSubmit,
    handleSocialLogin,
    isSignupDisabled,
  } = vm;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-6 pb-20"
        >
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {getUIText("loginToSignup", currentLanguage)}
            </span>
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText("signupWelcome", currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {getUIText("signupSub", currentLanguage)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText("fullName", currentLanguage)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={
                    currentLanguage === "ko"
                      ? "실명을 입력하세요"
                      : "Nhập họ tên thật"
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <InternationalPhoneInput
                currentLanguage={currentLanguage}
                onPhoneChange={handlePhoneChange}
                onSendOtp={handleSendOTP}
                isLoading={loading}
                disabled={isPhoneVerified}
              />

              <AnimatePresence>
                {otpSent && !isPhoneVerified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
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
                          onChange={(e) =>
                            setOtpCode(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="6-digit code"
                          className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleVerifyOTP()}
                        disabled={otpCode.length !== 6 || isVerifyingOtp}
                        className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        {isVerifyingOtp
                          ? "..."
                          : currentLanguage === "ko"
                            ? "인증"
                            : "Xác minh"}
                      </button>
                    </div>
                    {otpError && (
                      <p className="text-xs text-red-500 pl-1">{otpError}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isPhoneVerified && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {currentLanguage === "ko"
                      ? "전화번호 인증 완료"
                      : "Đã xác minh số điện thoại"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText("email", currentLanguage)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText("emailPlaceholder", currentLanguage)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText("password", currentLanguage)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText("passwordPlaceholder", currentLanguage)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {currentLanguage === "ko"
                  ? "비밀번호 확인"
                  : "Xác nhận mật khẩu"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={
                    currentLanguage === "ko"
                      ? "비밀번호를 다시 입력하세요"
                      : "Nhập lại mật khẩu"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSignupDisabled}
              className={`w-full py-4 rounded-full font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                !isSignupDisabled
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {loading ? "..." : getUIText("signup", currentLanguage)}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="relative my-8 text-center text-xs text-gray-400 font-bold">
            <span className="bg-white px-4 relative z-10">OR</span>
            <div className="absolute top-1/2 w-full border-t border-gray-100"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleSocialLogin("google")}
              className="w-full border-2 border-gray-200 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 외부 정적 아이콘 */}
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt="Google"
              />
              <span>{getUIText("googleContinue", currentLanguage)}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSocialLogin("facebook")}
              className="w-full bg-[#1877F2] text-white py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 외부 정적 아이콘 */}
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"
                className="w-5 h-5"
                alt="Facebook"
              />
              <span>{getUIText("facebookContinue", currentLanguage)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
