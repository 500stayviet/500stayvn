'use client';

import dynamic from 'next/dynamic';
import { User, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Loader2, Camera, ChevronRight, Lock } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import { SupportedLanguage } from '@/lib/api/translation';
import type { EditProfilePageViewModel } from '../hooks/useEditProfilePage';

const InternationalPhoneInput = dynamic(
  () => import('@/components/auth/InternationalPhoneInput'),
  { ssr: false },
);

type Props = { vm: EditProfilePageViewModel };

/** 개인정보 수정 UI — 상태는 `useEditProfilePage` 에서만 만든다. */
export function EditProfilePageView({ vm }: Props) {
  const {
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
  } = vm;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

        <div className="px-5 py-4 flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{getUIText('editProfile', currentLanguage)}</h1>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-4 shadow-md rounded-none">
          <input ref={profilePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={uploadingPhoto} />
          <input ref={profileCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleProfileImageUpload} disabled={uploadingPhoto} />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPhotoConsentModal(true)}
              disabled={uploadingPhoto}
              className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-1 ring-white/30 cursor-pointer hover:bg-white/30 transition-colors disabled:opacity-70"
              aria-label={getUIText('profilePhoto', currentLanguage)}
            >
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : userData?.photoURL ? (
                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </button>
            <div className="min-w-0 flex-1 pl-3">
              <p className="text-base font-semibold text-white truncate pl-2.5">
                {userData?.displayName || user?.displayName || getUIText('notRegistered', currentLanguage)}
              </p>
              <div className="flex items-center gap-2 mt-1 pl-0">
                <span
                  className={`pl-2.5 pr-2.5 py-1 text-xs font-bold rounded-full ${
                    userData?.role === 'owner' ? 'bg-green-400/30 text-white' : 'bg-white/20 text-white'
                  }`}
                >
                  {userData?.role === 'owner' ? getUIText('verified', currentLanguage) : getUIText('guest', currentLanguage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {updateError && <div className="mb-3 px-4 py-2.5 bg-red-50 rounded-xl text-red-600 text-xs">{updateError}</div>}

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">{getUIText('profile', currentLanguage)}</h2>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl py-3 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100 transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg">
                    <Mail className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{getUIText('email', currentLanguage)}</p>
                    {isEditingEmail ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder={getUIText('emailPlaceholder', currentLanguage)}
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                    )}
                  </div>
                  {!isEditingEmail ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditEmail(user?.email || '');
                        setIsEditingEmail(true);
                      }}
                      className="flex-shrink-0 py-1.5 px-3 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                    >
                      {getUIText('change', currentLanguage)}
                    </button>
                  ) : (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleEmailChange()}
                        disabled={updatingEmail || !editEmail.trim()}
                        className="py-1.5 px-3 bg-indigo-600 text-white text-xs font-medium rounded-lg"
                      >
                        {updatingEmail ? '...' : getUIText('confirm', currentLanguage)}
                      </button>
                      <button type="button" onClick={() => setIsEditingEmail(false)} className="py-1.5 px-3 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                        {getUIText('cancel', currentLanguage)}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl py-3 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg">
                    <Phone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{getUIText('phoneNumber', currentLanguage)}</p>
                    <p className="text-sm font-semibold text-gray-900">{userData?.phoneNumber || getUIText('notRegistered', currentLanguage)}</p>
                  </div>
                  {!isEditingPhone && (
                    <button type="button" onClick={handleStartEditPhone} className="flex-shrink-0 py-1.5 px-3 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
                      {getUIText('change', currentLanguage)}
                    </button>
                  )}
                </div>
                {isEditingPhone && (
                  <div className="mt-3 pl-0 space-y-3">
                    <InternationalPhoneInput
                      currentLanguage={currentLanguage}
                      onPhoneChange={handlePhoneChange}
                      onSendOtp={handleSendOTP}
                      isLoading={updatingPhone}
                      disabled={isPhoneVerified}
                    />
                    {otpSent && !isPhoneVerified && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="6-digit code"
                              className="w-full pl-10 pr-4 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleVerifyOTP()}
                            disabled={otpCode.length !== 6 || isVerifyingOtp}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {isVerifyingOtp ? '...' : getUIText('confirm', currentLanguage)}
                          </button>
                        </div>
                        {otpError && <p className="text-xs text-red-500 pl-1">{otpError}</p>}
                      </div>
                    )}
                    {(isPhoneVerified || (!requirePhoneVerification && vm.isPhoneComplete)) && (
                      <div className="space-y-3">
                        {isPhoneVerified && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{currentLanguage === 'ko' ? '인증 완료' : 'Đã xác minh'}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void handlePhoneSubmit()} disabled={updatingPhone} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                            {updatingPhone ? '...' : getUIText('save', currentLanguage)}
                          </button>
                          <button type="button" onClick={() => setIsEditingPhone(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {getUIText('cancel', currentLanguage)}
                          </button>
                        </div>
                      </div>
                    )}
                    {!isPhoneVerified && !(!requirePhoneVerification && isPhoneComplete) && (
                      <button type="button" onClick={() => setIsEditingPhone(false)} className="text-xs text-gray-500 hover:text-gray-700">
                        {getUIText('cancel', currentLanguage)}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl py-3 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100 relative">
                <button
                  type="button"
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className="w-full flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg">
                      <Globe className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{getUIText('preferredLanguage', currentLanguage)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {currentLanguage === 'ko'
                          ? '한국어'
                          : currentLanguage === 'vi'
                            ? 'Tiếng Việt'
                            : currentLanguage === 'ja'
                              ? '日本語'
                              : currentLanguage === 'zh'
                                ? '中文'
                                : 'English'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                {isLanguageMenuOpen && (
                  <div className="relative mt-2" ref={languageMenuRef}>
                    <div className="rounded-xl bg-white shadow-lg border border-gray-100 py-2 z-10">
                      {[
                        { code: 'ko', name: '한국어', flag: '🇰🇷' },
                        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
                        { code: 'en', name: 'English', flag: '🇺🇸' },
                        { code: 'ja', name: '日本語', flag: '🇯🇵' },
                        { code: 'zh', name: '中文', flag: '🇨🇳' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                          className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 rounded-lg mx-1 ${
                            currentLanguage === lang.code ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl py-3 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{getUIText('gender', currentLanguage)}</p>
                    <p className="text-sm font-semibold text-gray-900">{userData?.gender || getUIText('notRegistered', currentLanguage)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-[#E63946] text-white hover:opacity-90 transition-opacity"
            >
              {currentLanguage === 'ko'
                ? '회원탈퇴'
                : currentLanguage === 'vi'
                  ? 'Rút tài khoản'
                  : currentLanguage === 'ja'
                    ? 'アカウント退会'
                    : currentLanguage === 'zh'
                      ? '账户注销'
                      : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {showPhotoConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{getUIText('photoSelectConsentTitle', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-4">{getUIText('photoSelectConsentDesc', currentLanguage)}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPhotoConsentModal(false)} className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium">
                {getUIText('cancel', currentLanguage)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoConsentModal(false);
                  setShowPhotoSourceMenu(true);
                }}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                {getUIText('agree', currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoSourceMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowPhotoSourceMenu(false)} role="presentation">
          <div className="w-full bg-white rounded-t-2xl p-6 max-w-[430px]" onClick={(e) => e.stopPropagation()} role="presentation">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{getUIText('photoSourceMenuTitle', currentLanguage)}</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSourceMenu(false);
                  profilePhotoInputRef.current?.click();
                }}
                className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>{getUIText('selectFromLibrary', currentLanguage)}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSourceMenu(false);
                  profileCameraInputRef.current?.click();
                }}
                className="w-full py-4 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>{getUIText('takePhoto', currentLanguage)}</span>
              </button>
              <button type="button" onClick={() => setShowPhotoSourceMenu(false)} className="w-full py-3 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                {getUIText('cancel', currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{getUIText('confirmDeletion', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-4">{getUIText('deleteAccountDesc', currentLanguage)}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium">
                {getUIText('cancel', currentLanguage)}
              </button>
              <button type="button" onClick={() => void handleDeleteAccount()} disabled={deleting} className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium">
                {deleting
                  ? currentLanguage === 'ko'
                    ? '처리 중...'
                    : currentLanguage === 'vi'
                      ? 'Đang xử lý...'
                      : currentLanguage === 'ja'
                        ? '処理中...'
                        : currentLanguage === 'zh'
                          ? '处理中...'
                          : 'Processing...'
                  : currentLanguage === 'ko'
                    ? '회원탈퇴'
                    : currentLanguage === 'vi'
                      ? 'Xóa tài khoản'
                      : currentLanguage === 'ja'
                        ? 'アカウント削除'
                        : currentLanguage === 'zh'
                          ? '删除账户'
                          : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{getUIText('deleteAccountSuccess', currentLanguage)}</h3>
            <p className="text-sm text-gray-600 mb-6">{getUIText('deleteAccountSuccessDesc', currentLanguage)}</p>
            <button
              type="button"
              onClick={() => {
                setShowDeleteSuccess(false);
                router.push('/');
              }}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold"
            >
              {getUIText('confirm', currentLanguage)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
