'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserData } from '@/lib/api/auth';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';
import { getOtpProvider } from '@/lib/providers/currentProviders';

/**
 * 프로필 수정: 인증·유저 데이터 로드, 이메일/전화/언어/사진/탈퇴 상태를 한 훅에서 관리한다.
 */
export function useEditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateError, setUpdateError] = useState('');

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

  const requirePhoneVerification = process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true';
  const otpProvider = getOtpProvider();

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const [{ uploadToS3 }, authApi] = await Promise.all([
        import('@/lib/s3-client'),
        import('@/lib/api/auth'),
      ]);
      const imageUrl = await uploadToS3(file, 'profile-pics');
      await authApi.updateUserData(user.uid, { photoURL: imageUrl });
      const updated = await authApi.getCurrentUserData(user.uid);
      setUserData(updated);
      alert(getUIText('profileImageUpdated', currentLanguage));
    } catch (err) {
      console.error(err);
      alert(getUIText('uploadFailed', currentLanguage));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      void (async () => {
        try {
          const { getCurrentUserData } = await import('@/lib/api/auth');
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

  const handleStartEditPhone = () => {
    setEditPhone(userData?.phoneNumber || '');
    setIsEditingPhone(true);
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpCode('');
    setUpdateError('');
  };

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setEditPhone(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userData?.phoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setUpdatingPhone(true);
    setUpdateError('');
    try {
      const result = await otpProvider.sendOtp(normalizedPhone);
      if (result.ok) {
        setOtpSent(true);
        setOtpError('');
        return true;
      }
      setUpdateError(result.error || 'Failed to send OTP');
      return false;
    } catch {
      setUpdateError('System error occurred');
      return false;
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const result = await otpProvider.verifyOtp(editPhone, otpCode);
      if (result.ok) {
        setIsPhoneVerified(true);
        setOtpError('');
      } else {
        setOtpError(result.error || 'Invalid code');
      }
    } catch {
      setOtpError('Verification error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!user) return;
    if (requirePhoneVerification && !isPhoneVerified) {
      setUpdateError(currentLanguage === 'ko' ? '전화번호 인증이 필요합니다' : 'Vui lòng xác thực số điện thoại');
      return;
    }
    setUpdatingPhone(true);
    setUpdateError('');
    try {
      const { updateUserPhoneNumber, getCurrentUserData } = await import('@/lib/api/auth');
      await updateUserPhoneNumber(user.uid, editPhone);
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingPhone(false);
      setEditPhone('');
      setIsPhoneVerified(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : getUIText('errorOccurred', currentLanguage);
      setUpdateError(msg);
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user || !editEmail.trim()) return;
    setUpdatingEmail(true);
    setUpdateError('');
    try {
      const { updateUserEmail, getCurrentUserData } = await import('@/lib/api/auth');
      await updateUserEmail(user.uid, editEmail.trim());
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingEmail(false);
      setEditEmail('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : getUIText('errorOccurred', currentLanguage);
      setUpdateError(msg);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setCurrentLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { deleteAccount } = await import('@/lib/api/auth');
      await deleteAccount(user.uid);
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error(error);
      alert(getUIText('errorOccurred', currentLanguage));
      setDeleting(false);
    }
  };

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    userData,
    loading,
    isEditingEmail,
    setIsEditingEmail,
    isEditingPhone,
    setIsEditingPhone,
    editEmail,
    setEditEmail,
    editPhone,
    isPhoneComplete,
    otpSent,
    otpCode,
    setOtpCode,
    isPhoneVerified,
    isVerifyingOtp,
    otpError,
    updatingEmail,
    updatingPhone,
    updateError,
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
    languageMenuRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showDeleteSuccess,
    setShowDeleteSuccess,
    deleting,
    uploadingPhoto,
    showPhotoConsentModal,
    setShowPhotoConsentModal,
    showPhotoSourceMenu,
    setShowPhotoSourceMenu,
    profilePhotoInputRef,
    profileCameraInputRef,
    requirePhoneVerification,
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

export type EditProfilePageViewModel = ReturnType<typeof useEditProfilePage>;
