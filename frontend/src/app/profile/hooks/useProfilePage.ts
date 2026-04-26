"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileCoreState } from "./useProfileCoreState";
import { useProfileButtonConfig } from "./useProfileButtonConfig";
import { useProfileDialogState } from "./useProfileDialogState";

/**
 * 프로필 라우트: 코어·버튼 설정·다이얼로그 훅을 한 뷰모델로 묶는다.
 */
export function useProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const core = useProfileCoreState({
    user,
    authLoading,
    router,
  });
  const buttonConfig = useProfileButtonConfig();
  const dialog = useProfileDialogState({
    user,
    logout,
    router,
    currentLanguage,
    setCurrentLanguage,
  });

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    ...core,
    buttonConfig,
    ...dialog,
  };
}

export type ProfilePageViewModel = ReturnType<typeof useProfilePage>;
