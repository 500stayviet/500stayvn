/**
 * TrustSignals 컴포넌트
 * 
 * 플랫폼 신뢰도를 높이는 배지/통계 섹션
 * - KYC 인증 시스템
 * - 안전한 결제
 * - 다국어 지원
 */

'use client';

import { Shield, Globe, Clock, CheckCircle } from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';

interface TrustSignalsProps {
  currentLanguage: SupportedLanguage;
}

const BRAND = {
  text: '#111827',
  muted: '#9CA3AF',
  border: '#E5E7EB',
};

interface TrustItem {
  icon: typeof Shield;
  labelKey: Record<SupportedLanguage, string>;
}

const trustItems: TrustItem[] = [
  {
    icon: Shield,
    labelKey: {
      ko: 'KYC 인증',
      vi: 'Xac thuc KYC',
      en: 'KYC Verified',
      ja: 'KYC認証',
      zh: 'KYC认证',
    },
  },
  {
    icon: Globe,
    labelKey: {
      ko: '5개국어',
      vi: '5 ngon ngu',
      en: '5 Languages',
      ja: '5か国語',
      zh: '5种语言',
    },
  },
  {
    icon: Clock,
    labelKey: {
      ko: '실시간 채팅',
      vi: 'Chat truc tiep',
      en: 'Live Chat',
      ja: 'ライブチャット',
      zh: '实时聊天',
    },
  },
  {
    icon: CheckCircle,
    labelKey: {
      ko: '즉시 확인',
      vi: 'Xac nhan ngay',
      en: 'Instant OK',
      ja: '即時確認',
      zh: '即时确认',
    },
  },
];

export default function TrustSignals({ currentLanguage }: TrustSignalsProps) {
  return (
    <section className="py-5 px-5 bg-white">
      {/* 구분선 */}
      <div className="h-px mb-5" style={{ backgroundColor: '#F3F4F6' }} />

      <div className="flex items-center justify-between">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Icon className="w-4 h-4" style={{ color: BRAND.text }} />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight" style={{ color: BRAND.muted }}>
                {item.labelKey[currentLanguage]}
              </span>
            </div>
          );
        })}
      </div>

      {/* 하단 안전 영역 (바텀 네비게이션 대응) */}
      <div className="h-20" />
    </section>
  );
}
