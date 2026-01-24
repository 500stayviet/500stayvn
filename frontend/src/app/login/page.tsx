/**
 * Login Page (로그인 페이지 - Suspense 적용 버전)
 */

"use client";

import { useState, Suspense } from "react"; // Suspense 추가
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithFacebook,
} from "@/lib/api/auth";

// 1. 실제 로그인 폼과 로직을 담당하는 컴포넌트 (useSearchParams 포함)
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 빌드 에러의 원인이었던 훅
  const returnUrl = searchParams.get("returnUrl") || "/";
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmail(formData.email, formData.password);
      if (result.error) {
        const errorCode = result.error.code;
        setError(
          errorCode === "auth/account-deleted"
            ? currentLanguage === "ko"
              ? "탈퇴한 계정입니다. 재가입이 필요합니다."
              : "Tài khoản đã bị xóa."
            : errorCode === "auth/user-not-found"
              ? currentLanguage === "ko"
                ? "등록되지 않은 이메일입니다"
                : "Email chưa được đăng ký"
              : currentLanguage === "ko"
                ? "로그인 실패"
                : "Đăng nhập thất bại",
        );
        setLoading(false);
        return;
      }
      router.push(returnUrl);
    } catch (error: any) {
      setError(currentLanguage === "ko" ? "오류 발생" : "Lỗi");
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    const signupUrl =
      returnUrl !== "/"
        ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/signup";
    router.push(signupUrl);
  };

  const handleSocialLogin = async (
    provider: "google" | "facebook" | "zalo",
  ) => {
    setLoading(true);
    setError("");
    try {
      if (provider === "google") await signInWithGoogle();
      else if (provider === "facebook") await signInWithFacebook();
      router.push(returnUrl);
    } catch (error: any) {
      setError(currentLanguage === "ko" ? "로그인 실패" : "Đăng nhập thất bại");
      setLoading(false);
    }
  };

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
          className="px-6 py-6"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText("login", currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {currentLanguage === "ko" ? "환영합니다!" : "Chào mừng trở lại!"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText("email", currentLanguage)}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText("password", currentLanguage)}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              {loading ? "..." : getUIText("login", currentLanguage)}{" "}
              <ArrowRight size={18} />
            </button>

            <div className="relative my-4 text-center text-xs text-gray-400">
              <span className="bg-white px-2">OR</span>
              <div className="absolute top-1/2 w-full border-t border-gray-100 -z-10"></div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="w-full border-2 border-gray-200 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>Google로 계속하기</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                className="w-full bg-[#1877F2] text-white py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>Facebook으로 계속하기</span>
              </button>
            </div>

            <div className="text-center mt-4 text-xs">
              <span className="text-gray-500">계정이 없으신가요? </span>
              <button
                type="button"
                onClick={handleSignUp}
                className="text-blue-600 font-bold ml-1"
              >
                회원가입
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// 2. 외부에서 불러오는 메인 LoginPage 컴포넌트
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
