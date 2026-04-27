"use client";

import Link from "next/link";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

/** 로그인·가입 화면 하단 — 스토어 정책·cursorrules(개인정보·계정삭제 링크 상시 노출) */
type Props = { currentLanguage: SupportedLanguage };

export default function LegalFooterLinks({ currentLanguage }: Props) {
  const terms = getUIText("legalFooterTerms", currentLanguage);
  const privacy = getUIText("legalFooterPrivacy", currentLanguage);
  const deleteAccount = getUIText("legalFooterDeleteAccount", currentLanguage);
  const navAria = getUIText("legalFooterNavAriaLabel", currentLanguage);

  return (
    <nav
      className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-500"
      aria-label={navAria}
    >
      <Link
        href="/terms"
        className="font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
      >
        {terms}
      </Link>
      <span className="mx-2 text-gray-300" aria-hidden>
        |
      </span>
      <Link
        href="/privacy"
        className="font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
      >
        {privacy}
      </Link>
      <span className="mx-2 text-gray-300" aria-hidden>
        |
      </span>
      <Link
        href="/delete-account"
        className="font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
      >
        {deleteAccount}
      </Link>
    </nav>
  );
}
