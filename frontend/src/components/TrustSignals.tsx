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

const VN = {
  green: '#2D6A4F',
  greenDark: '#1B4332',
  gold: '#D4A017',
  goldLight: '#D4A01720',
  terracotta: '#C2703E',
  text: '#1A2E1A',
  textSub: '#3D5C3D',
  muted: '#8A9E8A',
  cream: '#FBF8F3',
  border: '#E8E0D4',
  inputBg: '#F5F0E8',
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
    <section className="px-5 pt-4 pb-2" style={{ backgroundColor: VN.cream }}>
      {/* 골드 구분선 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ backgroundColor: VN.border }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VN.gold }} />
        <div className="flex-1 h-px" style={{ backgroundColor: VN.border }} />
      </div>

      <div className="flex items-start justify-between px-1">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center gap-2 w-[72px]">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: VN.inputBg, border: `1px solid ${VN.border}` }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: VN.green }} />
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: VN.textSub }}>
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
