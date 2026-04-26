"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import {
  signInWithEmail,
} from "@/lib/api/auth";
import { signIn } from "next-auth/react";

/**
 * 이메일·소셜 로그인 폼 상태와 제출 핸들러를 묶는다.
 */
export function useLoginPage() {
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmail(formData.email, formData.password);
      if ("error" in result) {
        const errorCode = result.error.code;
        setError(
          errorCode === "auth/account-deleted"
            ? getUIText("accountDeletedDesc", currentLanguage)
            : errorCode === "auth/user-not-found"
              ? getUIText("emailNotRegistered", currentLanguage)
              : getUIText("loginFailed", currentLanguage),
        );
        setLoading(false);
        return;
      }
      router.push(returnUrl);
    } catch {
      setError(getUIText("errorOccurred", currentLanguage));
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
        alert("Zalo login is coming soon!");
      }
    } catch {
      setError(getUIText("loginFailed", currentLanguage));
      setLoading(false);
    }
  };

  return {
    returnUrl,
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
  };
}

export type LoginPageViewModel = ReturnType<typeof useLoginPage>;
