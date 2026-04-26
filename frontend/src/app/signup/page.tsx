/**
 * Sign Up Page (회원가입 페이지 - 개편 버전)
 *
 * 로직: `useSignupPage` · UI: `SignupPageView`.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useSignupPage } from "./hooks/useSignupPage";
import { SignupPageView } from "./components/SignupPageView";

function SignupPageInner() {
  const vm = useSignupPage();
  return <SignupPageView vm={vm} />;
}

export default function SignUpPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">
            {getUIText("loading", currentLanguage)}
          </div>
        </div>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}
