"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/lib/api/translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppApiErrorMessageForCode, isKnownAppApiErrorCode } from "@/lib/api/i18nAppApiErrors";
import { signUpWithEmail, type SignUpData } from "@/lib/api/auth";
import { signIn } from "next-auth/react";
import { getUIText } from "@/utils/i18n";

const EMAIL_FORMAT =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 회원가입 폼, 조건부 OTP, 소셜 가입 진입을 한 훅에 묶는다.
 */
export function useSignupPage() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  const requirePhoneVerification =
    process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === "true";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    isPhoneComplete: false,
    gender: "male" as "male" | "female",
    preferredLanguage: currentLanguage,
  });

  useEffect(() => {
    const lang = ["ko", "vi", "ja", "zh"].includes(currentLanguage)
      ? currentLanguage
      : "en";
    setFormData((prev) => ({ ...prev, preferredLanguage: lang }));
  }, [currentLanguage]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: normalizedPhone,
      isPhoneComplete: isComplete,
    }));
    if (normalizedPhone !== formData.phoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode("");
    }
  };

  const handleSendOTP = async (
    normalizedPhone: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

      if (response.ok) {
        setOtpSent(true);
        setOtpError("");
        return true;
      } else {
        const data = await response.json();
        setError(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : getUIText("signupErrorOtpSendFailed", currentLanguage),
        );
        return false;
      }
    } catch {
      setError(getUIText("signupErrorOtpSendSystem", currentLanguage));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          code: otpCode,
        }),
      });

      if (response.ok) {
        setIsPhoneVerified(true);
        setOtpError("");
      } else {
        const data = await response.json();
        setOtpError(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : getUIText("signupErrorOtpInvalidCode", currentLanguage),
        );
      }
    } catch {
      setOtpError(getUIText("signupErrorOtpVerifyFailed", currentLanguage));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.fullName) {
      setError(getUIText("signupErrorRequiredFields", currentLanguage));
      return;
    }

    if (!EMAIL_FORMAT.test(formData.email.trim())) {
      setError(getUIText("signupErrorInvalidEmailFormat", currentLanguage));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(getUIText("signupErrorPasswordMismatch", currentLanguage));
      return;
    }

    if (formData.password.length < 6) {
      setError(getUIText("signupErrorPasswordMinLength", currentLanguage));
      return;
    }

    if (requirePhoneVerification && !isPhoneVerified) {
      setError(
        getUIText("signupErrorPhoneVerificationRequired", currentLanguage),
      );
      return;
    }

    setLoading(true);

    try {
      const signUpData: SignUpData = {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || "",
        gender: formData.gender,
        preferredLanguage: formData.preferredLanguage as SupportedLanguage,
      };

      const result = await signUpWithEmail(signUpData);

      if ("error" in result) {
        const { code, message } = result.error;
        if (code && isKnownAppApiErrorCode(code)) {
          setError(getAppApiErrorMessageForCode(code, currentLanguage));
          return;
        }
        setError(
          message?.trim()
            ? message
            : getUIText("signupErrorFailedGeneric", currentLanguage),
        );
        return;
      }

      router.push("/");
    } catch {
      setError(getUIText("signupErrorUnexpected", currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      setError(getUIText("signupErrorSocialLoginFailed", currentLanguage));
      setLoading(false);
    }
  };

  const isSignupDisabled = Boolean(
    loading ||
      !formData.email ||
      !formData.password ||
      !formData.fullName ||
      (formData.phoneNumber && !formData.isPhoneComplete) ||
      (formData.phoneNumber &&
        requirePhoneVerification &&
        !isPhoneVerified),
  );

  return {
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
  };
}

export type SignupPageViewModel = ReturnType<typeof useSignupPage>;
