"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAddPropertyPageState } from "./hooks/useAddPropertyPageState";
import { AddPropertyPageView } from "./components/AddPropertyPageView";

/**
 * 새 매물 등록 — 로직은 `useAddPropertyPageState`, UI는 `AddPropertyPageView`.
 */
export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const vm = useAddPropertyPageState({
    user: user ? { uid: user.uid } : null,
    authLoading,
    currentLanguage,
    onPush: (path) => router.push(path),
  });

  return (
    <AddPropertyPageView
      router={router}
      currentLanguage={currentLanguage}
      authLoading={authLoading}
      vm={vm}
    />
  );
}
