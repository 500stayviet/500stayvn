"use client";

import { useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface UseProfileDialogStateParams {
  user: { uid: string } | null;
  logout: () => Promise<void>;
  router: AppRouterInstance;
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (langCode: SupportedLanguage) => void;
}

export function useProfileDialogState({
  user,
  logout,
  router,
  currentLanguage,
  setCurrentLanguage,
}: UseProfileDialogStateParams) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setCurrentLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { deleteAccount } = await import("@/lib/api/auth");
      await deleteAccount(user.uid);
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error(error);
      alert(getUIText("errorOccurred", currentLanguage));
      setDeleting(false);
    }
  };

  const handleConfirmLogout = async () => {
    if (!user) return;
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert(getUIText("errorOccurred", currentLanguage));
      setLoggingOut(false);
    }
  };

  return {
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
  };
}
