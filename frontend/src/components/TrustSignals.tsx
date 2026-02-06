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
  primary: '#E63946',
  text: '#1F2937',
  muted: '#6B7280',
  bgWarm: '#FFF8F6',
};

interface TrustItem {
  icon: typeof Shield;
  titleKey: Record<SupportedLanguage, string>;
  descKey: Record<SupportedLanguage, string>;
  color: string;
  bgColor: string;
}

const trustItems: TrustItem[] = [
  {
    icon: Shield,
    titleKey: {
      ko: 'KYC 인증 호스트',
      vi: 'Chủ nhà xác thực',
      en: 'Verified Hosts',
      ja: '認証ホスト',
      zh: '认证房东',
    },
    descKey: {
      ko: '신원 확인된 호스트',
      vi: 'Đã xác minh danh tính',
      en: 'Identity verified hosts',
      ja: '本人確認済み',
      zh: '身份验证房东',
    },
    color: '#E63946',
    bgColor: '#E6394610',
  },
  {
    icon: Globe,
    titleKey: {
      ko: '5개국어 지원',
      vi: '5 ngôn ngữ',
      en: '5 Languages',
      ja: '5か国語対応',
      zh: '5种语言',
    },
    descKey: {
      ko: 'KO/VI/EN/JA/ZH',
      vi: 'KO/VI/EN/JA/ZH',
      en: 'KO/VI/EN/JA/ZH',
      ja: 'KO/VI/EN/JA/ZH',
      zh: 'KO/VI/EN/JA/ZH',
    },
    color: '#2563EB',
    bgColor: '#2563EB10',
  },
  {
    icon: Clock,
    titleKey: {
      ko: '실시간 채팅',
      vi: 'Chat trực tiếp',
      en: 'Real-time Chat',
      ja: 'リアルタイムチャット',
      zh: '实时聊天',
    },
    descKey: {
      ko: '호스트와 바로 대화',
      vi: 'Chat ngay với chủ nhà',
      en: 'Chat with hosts directly',
      ja: 'ホストと直接チャット',
      zh: '直接与房东聊天',
    },
    color: '#059669',
    bgColor: '#05966910',
  },
  {
    icon: CheckCircle,
    titleKey: {
      ko: '즉시 예약 확인',
      vi: 'Xác nhận ngay',
      en: 'Instant Confirm',
      ja: '即時確認',
      zh: '即时确认',
    },
    descKey: {
      ko: '빠른 예약 승인',
      vi: 'Phê duyệt nhanh chóng',
      en: 'Fast booking approval',
      ja: '迅速な予約承認',
      zh: '快速预订审批',
    },
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
                  {item.titleKey[currentLanguage]}
                </p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: BRAND.muted }}>
                  {item.descKey[currentLanguage]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}