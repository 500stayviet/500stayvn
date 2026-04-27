"use client";

import Link from "next/link";
import type { SupportedLanguage } from "@/lib/api/translation";

/** 로그인·가입 화면 하단 — 스토어 정책·cursorrules(개인정보·계정삭제 링크 상시 노출) */
const LABELS: Record<
  SupportedLanguage,
  { privacy: string; deleteAccount: string; nav: string }
> = {
  ko: {
    privacy: "개인정보처리방침",
    deleteAccount: "계정 삭제",
    nav: "약관 및 정책",
  },
  en: {
    privacy: "Privacy Policy",
    deleteAccount: "Delete account",
    nav: "Legal",
  },
  vi: {
    privacy: "Chính sách bảo mật",
    deleteAccount: "Xóa tài khoản",
    nav: "Pháp lý",
  },
  ja: {
    privacy: "プライバシーポリシー",
    deleteAccount: "アカウント削除",
    nav: "法的情報",
  },
  zh: {
    privacy: "隐私政策",
    deleteAccount: "删除账户",
    nav: "法律信息",
  },
};

type Props = { currentLanguage: SupportedLanguage };

export default function LegalFooterLinks({ currentLanguage }: Props) {
  const t = LABELS[currentLanguage] ?? LABELS.en;

  return (
    <nav
      className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-500"
      aria-label={t.nav}
    >
      <Link
        href="/privacy"
        className="font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
      >
        {t.privacy}
      </Link>
      <span className="mx-2 text-gray-300" aria-hidden>
        |
      </span>
      <Link
        href="/delete-account"
        className="font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
      >
        {t.deleteAccount}
      </Link>
    </nav>
  );
}
