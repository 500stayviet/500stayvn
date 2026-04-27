import type { Metadata } from "next";

import { PrivacyPageBody } from "@/components/legal/PrivacyPageBody";

export const metadata: Metadata = {
  title: "Privacy Policy | 500 STAY VN",
  description:
    "Privacy policy for 500 STAY VN (KO/VI/EN/JA/ZH full text in app by language).",
};

/**
 * 개인정보처리방침 상시 URL. 본문은 `PrivacyPageBody` + `legalPages`에서 현재 언어로 표시.
 */
export default function PrivacyPolicyPage() {
  return <PrivacyPageBody />;
}
