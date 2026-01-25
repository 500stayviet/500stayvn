/**
 * Login Page (로그인 페이지 - 이메일 전용)
 */

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import {
  signInWithEmail,
  signInWithGoogle as customSignInWithGoogle,
  signInWithFacebook as customSignInWithFacebook,
} from "@/lib/api/auth";
import { signIn } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
            ? getUIText('accountDeletedDesc', currentLanguage)
            : errorCode === "auth/user-not-found"
              ? getUIText('emailNotRegistered', currentLanguage)
              : getUIText('loginFailed', currentLanguage),
        );
        setLoading(false);
        return;
      }
      router.push(returnUrl);
    } catch (error: any) {
      setError(getUIText('errorOccurred', currentLanguage));
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
      if (provider === "google") {
        await signIn("google", { callbackUrl: returnUrl });
      } else if (provider === "facebook") {
        await signIn("facebook", { callbackUrl: returnUrl });
      } else if (provider === "zalo") {
        // Zalo is not yet integrated with next-auth in this setup
        alert("Zalo login is coming soon!");
      }
    } catch (error: any) {
      setError(getUIText('loginFailed', currentLanguage));
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText("login", currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {getUIText('welcomeBack', currentLanguage)}
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
                  placeholder={getUIText('emailPlaceholder', currentLanguage)}
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
                  placeholder={getUIText('passwordPlaceholder', currentLanguage)}
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
              onClick={() => handleSocialLogin("google")}
              className="w-full border-2 border-gray-200 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              <span>{getUIText('googleContinue', currentLanguage)}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("facebook")}
              className="w-full bg-[#1877F2] text-white py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" className="w-5 h-5" alt="Facebook" />
              <span>{getUIText('facebookContinue', currentLanguage)}</span>
            </button>
          </div>

          <div className="text-center mt-8 text-sm">
            <span className="text-gray-500">{getUIText('noAccount', currentLanguage)} </span>
            <button
              type="button"
              onClick={handleSignUp}
              className="text-blue-600 font-extrabold ml-1 hover:underline"
            >
              {getUIText('signup', currentLanguage)}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          {getUIText('loading', currentLanguage)}
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
