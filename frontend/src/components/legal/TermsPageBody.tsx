"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  OPERATOR_ADDRESS,
  OPERATOR_LEGAL_NAME,
  SUPPORT_EMAIL,
} from "@/constants/operator-contact";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyOperatorTemplate, getTermsCopy } from "@/content/legalPages";

export function TermsPageBody() {
  const { currentLanguage } = useLanguage();
  const copy = getTermsCopy(currentLanguage);

  useEffect(() => {
    document.title = copy.metaTitle;
  }, [copy.metaTitle]);

  const op = OPERATOR_LEGAL_NAME;
  const effective = applyOperatorTemplate(copy.effectiveLine, op);

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-zinc-800">
      <div className="mx-auto max-w-2xl px-4 py-10 pb-16">
        <h1 className="text-2xl font-bold text-zinc-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{effective}</p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          {copy.sections1to6.map((sec) => (
            <div key={sec.heading}>
              <h2 className="text-base font-semibold text-zinc-900">{sec.heading}</h2>
              {sec.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-2">
                  {applyOperatorTemplate(p, op)}
                </p>
              ))}
            </div>
          ))}

          <h2 className="text-base font-semibold text-zinc-900">{copy.section7Heading}</h2>
          <p className="mt-2">
            {copy.section7.beforePrivacy}
            <Link href="/privacy" className="text-red-600 underline underline-offset-2">
              {copy.section7.privacyLinkLabel}
            </Link>
            {copy.section7.afterPrivacy}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {copy.listOperatorLabel}: <strong>{op}</strong>
            </li>
            <li>
              {copy.listAddressLabel}: {OPERATOR_ADDRESS}
            </li>
            <li>
              {copy.listEmailLabel}:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-red-600 underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-10 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            {copy.homeLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
