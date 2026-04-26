"use client";

import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import type { LoginPageViewModel } from "../hooks/useLoginPage";

type Props = { vm: LoginPageViewModel };

export function LoginPageView({ vm }: Props) {
  const {
    currentLanguage,
    setCurrentLanguage,
    showPassword,
    setShowPassword,
    formData,
    loading,
    error,
    handleChange,
    handleSubmit,
    handleSignUp,
    handleSocialLogin,
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
          className="px-6 py-6"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText("login", currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {getUIText("welcomeBack", currentLanguage)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText("emailPlaceholder", currentLanguage)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText("passwordPlaceholder", currentLanguage)}
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
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "..." : getUIText("login", currentLanguage)}{" "}
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

          <div className="text-center mt-8 text-sm">
            <span className="text-gray-500">
              {getUIText("noAccount", currentLanguage)}{" "}
            </span>
            <button
              type="button"
              onClick={handleSignUp}
              className="text-blue-600 font-extrabold ml-1 hover:underline"
            >
              {getUIText("signup", currentLanguage)}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
