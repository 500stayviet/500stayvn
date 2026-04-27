import type { Metadata } from "next";

import { TermsPageBody } from "@/components/legal/TermsPageBody";

export const metadata: Metadata = {
  title: "Terms of Service | 500 STAY VN",
  description:
    "Terms for 500 STAY VN (KO/VI/EN/JA/ZH full text in app by language). Rental information platform; not a party to user agreements.",
};

/**
 * 이용약관 상시 URL. 본문은 `TermsPageBody` + `legalPages`에서 현재 언어로 표시.
 */
export default function TermsOfServicePage() {
  return <TermsPageBody />;
}
