"use client";

import { useCallback } from "react";
import { getUIText } from "@/utils/i18n";
import { SupportedLanguage } from "@/lib/api/translation";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { EditProfilePageData } from "./useEditProfilePageData";

/**
 * 프로필 수정 — 이메일·전화·언어·사진·탈퇴 액션.
 */
export function useEditProfilePageActions(data: EditProfilePageData) {
  const {
    user,
    currentLanguage,
    userData,
    setUserData,
    setIsEditingPhone,
    setEditPhone,
    setIsPhoneComplete,
    setIsPhoneVerified,
    setOtpSent,
    setOtpCode,
    setUpdateError,
    setUpdatingPhone,
    otpProvider,
    otpCode,
    editPhone,
    editEmail,
    requirePhoneVerification,
    isPhoneVerified,
    setIsVerifyingOtp,
    setOtpError,
    setUpdatingEmail,
    setIsEditingEmail,
    setEditEmail,
    setCurrentLanguage,
    setIsLanguageMenuOpen,
    setDeleting,
    setShowDeleteConfirm,
    setShowDeleteSuccess,
    setUploadingPhoto,
  } = data;

  const handleProfileImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      setUploadingPhoto(true);
      try {
        const [{ uploadToS3 }, authApi] = await Promise.all([
          import("@/lib/s3-client"),
          import("@/lib/api/auth"),
        ]);
        const imageUrl = await uploadToS3(file, "profile-pics");
        await authApi.updateUserData(user.uid, { photoURL: imageUrl });
        const updated = await authApi.getCurrentUserData(user.uid);
        setUserData(updated);
        emitUserFacingAppToast({
          tone: "success",
          area: "generic",
          action: "profile_photo",
          message: getUIText("profileImageUpdated", currentLanguage),
        });
      } catch (err) {
        console.error(err);
        emitUserFacingSyncError({
          area: "users",
          action: "upload_photo",
          message: getUIText("uploadFailed", currentLanguage),
        });
      } finally {
        setUploadingPhoto(false);
        e.target.value = "";
      }
    },
    [user, currentLanguage, setUserData, setUploadingPhoto],
  );

  const handleStartEditPhone = useCallback(() => {
    setEditPhone(userData?.phoneNumber || "");
    setIsEditingPhone(true);
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setUpdateError("");
  }, [
    userData?.phoneNumber,
    setEditPhone,
    setIsEditingPhone,
    setIsPhoneVerified,
    setOtpSent,
    setOtpCode,
    setUpdateError,
  ]);

  const handlePhoneChange = useCallback(
    (normalizedPhone: string, isComplete: boolean) => {
      setEditPhone(normalizedPhone);
      setIsPhoneComplete(isComplete);
      if (normalizedPhone !== userData?.phoneNumber) {
        setIsPhoneVerified(false);
        setOtpSent(false);
        setOtpCode("");
      }
    },
    [
      userData?.phoneNumber,
      setEditPhone,
      setIsPhoneComplete,
      setIsPhoneVerified,
      setOtpSent,
      setOtpCode,
    ],
  );

  const handleSendOTP = useCallback(
    async (normalizedPhone: string): Promise<boolean> => {
      setUpdatingPhone(true);
      setUpdateError("");
      try {
        const result = await otpProvider.sendOtp(normalizedPhone);
        if (result.ok) {
          setOtpSent(true);
          setOtpError("");
          return true;
        }
        setUpdateError(result.error || "Failed to send OTP");
        return false;
      } catch {
        setUpdateError("System error occurred");
        return false;
      } finally {
        setUpdatingPhone(false);
      }
    },
    [
      otpProvider,
      setUpdatingPhone,
      setUpdateError,
      setOtpSent,
      setOtpError,
    ],
  );

  const handleVerifyOTP = useCallback(async () => {
    if (otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const result = await otpProvider.verifyOtp(editPhone, otpCode);
      if (result.ok) {
        setIsPhoneVerified(true);
        setOtpError("");
      } else {
        setOtpError(result.error || "Invalid code");
      }
    } catch {
      setOtpError("Verification error");
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [
    otpCode,
    editPhone,
    otpProvider,
    setIsVerifyingOtp,
    setOtpError,
    setIsPhoneVerified,
  ]);

  const handlePhoneSubmit = useCallback(async () => {
    if (!user) return;
    if (requirePhoneVerification && !isPhoneVerified) {
      setUpdateError(getUIText("phoneVerificationRequired", currentLanguage));
      return;
    }
    setUpdatingPhone(true);
    setUpdateError("");
    try {
      const { updateUserPhoneNumber, getCurrentUserData } = await import(
        "@/lib/api/auth"
      );
      await updateUserPhoneNumber(user.uid, editPhone);
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingPhone(false);
      setEditPhone("");
      setIsPhoneVerified(false);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : getUIText("errorOccurred", currentLanguage);
      setUpdateError(msg);
    } finally {
      setUpdatingPhone(false);
    }
  }, [
    user,
    requirePhoneVerification,
    isPhoneVerified,
    currentLanguage,
    editPhone,
    setUpdateError,
    setUpdatingPhone,
    setUserData,
    setIsEditingPhone,
    setEditPhone,
    setIsPhoneVerified,
  ]);

  const handleEmailChange = useCallback(async () => {
    if (!user || !editEmail.trim()) return;
    setUpdatingEmail(true);
    setUpdateError("");
    try {
      const { updateUserEmail, getCurrentUserData } = await import(
        "@/lib/api/auth"
      );
      await updateUserEmail(user.uid, editEmail.trim());
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingEmail(false);
      setEditEmail("");
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : getUIText("errorOccurred", currentLanguage);
      setUpdateError(msg);
    } finally {
      setUpdatingEmail(false);
    }
  }, [
    user,
    editEmail,
    currentLanguage,
    setUpdatingEmail,
    setUpdateError,
    setUserData,
    setIsEditingEmail,
    setEditEmail,
  ]);

  const handleLanguageChange = useCallback(
    (langCode: SupportedLanguage) => {
      setCurrentLanguage(langCode);
      setIsLanguageMenuOpen(false);
    },
    [setCurrentLanguage, setIsLanguageMenuOpen],
  );

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { deleteAccount } = await import("@/lib/api/auth");
      await deleteAccount(user.uid);
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error(error);
      emitUserFacingSyncError({
        area: "users",
        action: "delete_account",
        message: getUIText("errorOccurred", currentLanguage),
      });
      setDeleting(false);
    }
  }, [
    user,
    currentLanguage,
    setDeleting,
    setShowDeleteConfirm,
    setShowDeleteSuccess,
  ]);

  return {
    handleProfileImageUpload,
    handleStartEditPhone,
    handlePhoneChange,
    handleSendOTP,
    handleVerifyOTP,
    handlePhoneSubmit,
    handleEmailChange,
    handleLanguageChange,
    handleDeleteAccount,
  };
}
