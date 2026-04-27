/**
 * Trust badges / stats for the home experience.
 */

'use client';

import { Shield, Globe, Clock, CheckCircle } from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText, type UITextKey } from '@/utils/i18n';

interface TrustSignalsProps {
  currentLanguage: SupportedLanguage;
}

const BRAND = {
  primary: '#E63946',
  text: '#1F2937',
  muted: '#6B7280',
  bgWarm: '#FFF8F6',
};

type TrustIcon = typeof Shield;

interface TrustItemConfig {
  icon: TrustIcon;
  titleKey: UITextKey;
  descKey: UITextKey;
  color: string;
  bgColor: string;
}

const trustItems: TrustItemConfig[] = [
  {
    icon: Shield,
    titleKey: 'trustSignalKycTitle',
    descKey: 'trustSignalKycDesc',
    color: '#E63946',
    bgColor: '#E6394610',
  },
  {
    icon: Globe,
    titleKey: 'trustSignalLanguagesTitle',
    descKey: 'trustSignalLanguagesDesc',
    color: '#2563EB',
    bgColor: '#2563EB10',
  },
  {
    icon: Clock,
    titleKey: 'trustSignalChatTitle',
    descKey: 'trustSignalChatDesc',
    color: '#059669',
    bgColor: '#05966910',
  },
  {
    icon: CheckCircle,
    titleKey: 'trustSignalBookingTitle',
    descKey: 'trustSignalBookingDesc',
    color: '#D97706',
    bgColor: '#D9770610',
  },
];

export default function TrustSignals({ currentLanguage }: TrustSignalsProps) {
  return (
    <section className="py-5 px-4" style={{ backgroundColor: BRAND.bgWarm }}>
      <div className="grid grid-cols-2 gap-3">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-white"
              style={{ border: '1px solid #F3F4F6' }}
            >
              <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.bgColor }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight" style={{ color: BRAND.text }}>
                  {getUIText(item.titleKey, currentLanguage)}
                </p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: BRAND.muted }}>
                  {getUIText(item.descKey, currentLanguage)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
