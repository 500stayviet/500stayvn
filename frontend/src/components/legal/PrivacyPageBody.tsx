"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  OPERATOR_ADDRESS,
  OPERATOR_LEGAL_NAME,
  SUPPORT_EMAIL,
} from "@/constants/operator-contact";
import { STAYVIET_PRODUCTION_ORIGIN } from "@/constants/production-host";
import { useLanguage } from "@/contexts/LanguageContext";
import { applyOperatorTemplate, applyOriginTemplate, getPrivacyCopy } from "@/content/legalPages";

export function PrivacyPageBody() {
  const { currentLanguage } = useLanguage();
  const copy = getPrivacyCopy(currentLanguage);

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
          {copy.sections1to4.map((sec) => (
            <div key={sec.heading}>
              <h2 className="text-base font-semibold text-zinc-900">{sec.heading}</h2>
              {sec.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-2">
                  {applyOperatorTemplate(p, op)}
                </p>
              ))}
            </div>
          ))}

          <h2 className="text-base font-semibold text-zinc-900">{copy.section5Heading}</h2>
          <p className="mt-2">
            {copy.section5.beforeDelete}
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              {copy.section5.deleteLinkLabel}
            </Link>
            {copy.section5.afterDelete}
          </p>

          <h2 className="text-base font-semibold text-zinc-900">{copy.section6Heading}</h2>
          <p className="mt-2">{copy.section6Intro}</p>
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

        <p className="mt-8 border-t border-zinc-200 pt-4 text-xs leading-relaxed text-zinc-500">
          {applyOriginTemplate(copy.publicationFootnote, STAYVIET_PRODUCTION_ORIGIN)}
        </p>

        <p className="mt-10 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            {copy.homeLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
