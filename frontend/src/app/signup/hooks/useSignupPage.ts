"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/lib/api/translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { signUpWithEmail, type SignUpData } from "@/lib/api/auth";
import { signIn } from "next-auth/react";

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
        setError(data.error || "Failed to send OTP");
        return false;
      }
    } catch {
      setError("System error occurred while sending OTP");
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
        setOtpError(data.error || "Invalid code");
      }
    } catch {
      setOtpError("Verification error");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.fullName) {
      setError(
        currentLanguage === "ko"
          ? "모든 필수 필드를 입력해주세요"
          : "Vui lòng điền đầy đủ thông tin",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(
        currentLanguage === "ko"
          ? "비밀번호가 일치하지 않습니다"
          : "Mật khẩu không khớp",
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(
        currentLanguage === "ko"
          ? "비밀번호는 최소 6자 이상이어야 합니다"
          : "Mật khẩu phải có ít nhất 6 ký tự",
      );
      return;
    }

    if (requirePhoneVerification && !isPhoneVerified) {
      setError(
        currentLanguage === "ko"
          ? "전화번호 인증이 필요합니다"
          : "Vui lòng xác thực số điện thoại",
      );
      return;
    }

    setLoading(true);

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || "",
        gender: formData.gender,
        preferredLanguage: formData.preferredLanguage as SupportedLanguage,
      };

      const result = await signUpWithEmail(signUpData);

      if (result.error) {
        setError(result.error.message || "Signup failed");
        return;
      }

      router.push("/");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      setError("Social login failed");
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
