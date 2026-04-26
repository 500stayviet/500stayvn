/**
 * Login Page (로그인 페이지 - 이메일 전용)
 *
 * 로직: `useLoginPage` · UI: `LoginPageView`.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useLoginPage } from "./hooks/useLoginPage";
import { LoginPageView } from "./components/LoginPageView";

function LoginPageInner() {
  const vm = useLoginPage();
  return <LoginPageView vm={vm} />;
}

export default function LoginPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          {getUIText("loading", currentLanguage)}
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
