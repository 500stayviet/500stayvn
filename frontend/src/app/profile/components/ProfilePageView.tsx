"use client";

import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import ProfileDialogs from "./ProfileDialogs";
import ProfileMainSections from "./ProfileMainSections";
import ProfileHeaderCard from "./ProfileHeaderCard";
import type { ProfilePageViewModel } from "../hooks/useProfilePage";

type Props = { vm: ProfilePageViewModel };

export function ProfilePageView({ vm }: Props) {
  const {
    router,
    user,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    userData,
    verificationStatus,
    showSuccessPopup,
    setShowSuccessPopup,
    kycSteps,
    allStepsCompleted,
    effectiveIsOwner,
    buttonConfig,
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
  } = vm;

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
