"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "@/lib/api/auth";
import { getOtpProvider } from "@/lib/providers/currentProviders";

/**
 * 프로필 수정 — 인증·유저 로드·폼/모달 UI 상태 (데이터 레이어).
 */
export function useEditProfilePageData() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoConsentModal, setShowPhotoConsentModal] = useState(false);
  const [showPhotoSourceMenu, setShowPhotoSourceMenu] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const profileCameraInputRef = useRef<HTMLInputElement>(null);

  const requirePhoneVerification =
    process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === "true";
  const otpProvider = getOtpProvider();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      void (async () => {
        try {
          const { getCurrentUserData } = await import("@/lib/api/auth");
          const data = await getCurrentUserData(user.uid);
          setUserData(data);
        } catch {
          /* Silent fail */
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    userData,
    setUserData,
    loading,
    isEditingEmail,
    setIsEditingEmail,
    isEditingPhone,
    setIsEditingPhone,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    isPhoneComplete,
    setIsPhoneComplete,
    otpSent,
    setOtpSent,
    otpCode,
    setOtpCode,
    isPhoneVerified,
    setIsPhoneVerified,
    isVerifyingOtp,
    setIsVerifyingOtp,
    otpError,
    setOtpError,
    updatingEmail,
    setUpdatingEmail,
    updatingPhone,
    setUpdatingPhone,
    updateError,
    setUpdateError,
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
    languageMenuRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showDeleteSuccess,
    setShowDeleteSuccess,
    deleting,
    setDeleting,
    uploadingPhoto,
    setUploadingPhoto,
    showPhotoConsentModal,
    setShowPhotoConsentModal,
    showPhotoSourceMenu,
    setShowPhotoSourceMenu,
    profilePhotoInputRef,
    profileCameraInputRef,
    requirePhoneVerification,
    otpProvider,
  };
}

export type EditProfilePageData = ReturnType<typeof useEditProfilePageData>;
