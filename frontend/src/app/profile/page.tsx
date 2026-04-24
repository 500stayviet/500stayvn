/**
 * Profile Page (개인정보 페이지)
 *
 * 사용자 개인정보 및 설정 페이지
 * - 우리집 내놓기 버튼 (인증 상태에 따라 동작)
 * - 임대인 인증 폼
 */

"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import { useProfileCoreState } from "./hooks/useProfileCoreState";
import ProfileDialogs from "./components/ProfileDialogs";
import ProfileMainSections from "./components/ProfileMainSections";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import { useProfileButtonConfig } from "./hooks/useProfileButtonConfig";
import { useProfileDialogState } from "./hooks/useProfileDialogState";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const {
    userData,
    loading,
    verificationStatus,
    showSuccessPopup,
    setShowSuccessPopup,
    kycSteps,
    allStepsCompleted,
    effectiveIsOwner,
  } = useProfileCoreState({
    user,
    authLoading,
    router,
  });
  const buttonConfig = useProfileButtonConfig();
  const {
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showDeleteSuccess,
    setShowDeleteSuccess,
    showLogoutConfirm,
    setShowLogoutConfirm,
    deleting,
    loggingOut,
    handleLanguageChange,
    handleConfirmDelete,
    handleConfirmLogout,
  } = useProfileDialogState({
    user,
    logout,
    router,
    currentLanguage,
    setCurrentLanguage,
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {getUIText("loading", currentLanguage)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <ProfileHeaderCard
          currentLanguage={currentLanguage}
          displayName={userData?.displayName}
          email={userData?.email}
          fallbackEmail={user?.email}
          photoURL={userData?.photoURL}
          onClick={() => router.push("/profile/edit")}
        />

        <ProfileMainSections
          currentLanguage={currentLanguage}
          kycSteps={kycSteps}
          allStepsCompleted={allStepsCompleted}
          verificationStatus={verificationStatus}
          effectiveIsOwner={effectiveIsOwner}
          buttonConfig={buttonConfig}
          onOpenLanguageMenu={() => setIsLanguageMenuOpen(true)}
          onOpenLogoutConfirm={() => setShowLogoutConfirm(true)}
          onOpenMyProperties={() => router.push("/profile/my-properties")}
          onOpenHostBookings={() => router.push("/host/bookings")}
          onOpenSettlement={() => router.push("/profile/settlement")}
          onOpenMyBookings={() => router.push("/my-bookings")}
        />
      </div>

      <ProfileDialogs
        currentLanguage={currentLanguage}
        showDeleteConfirm={showDeleteConfirm}
        deleting={deleting}
        onCancelDelete={() => setShowDeleteConfirm(false)}
        onConfirmDelete={handleConfirmDelete}
        showDeleteSuccess={showDeleteSuccess}
        onCloseDeleteSuccess={() => {
          setShowDeleteSuccess(false);
          router.push("/");
        }}
        showSuccessPopup={showSuccessPopup}
        effectiveIsOwner={effectiveIsOwner}
        onCloseSuccessPopup={() => setShowSuccessPopup(false)}
        isLanguageMenuOpen={isLanguageMenuOpen}
        onCloseLanguageMenu={() => setIsLanguageMenuOpen(false)}
        onLanguageChange={handleLanguageChange}
        showLogoutConfirm={showLogoutConfirm}
        loggingOut={loggingOut}
        onCancelLogout={() => setShowLogoutConfirm(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
}
