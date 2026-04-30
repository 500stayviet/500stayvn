'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';
import {
  ADMIN_NAV_HREF_TO_CARD_DESC_KEY,
  ADMIN_NAV_HREF_TO_LABEL_KEY,
} from '@/lib/adminNavI18nMaps';
import { adminHasPermission } from '@/lib/adminPermissions';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

/** 홈 그리드에 표시할 바로가기 카드 뷰모델(권한·i18n 반영 후). */
export type AdminDashboardCardVm = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type AdminDashboardCardsVm = {
  currentLanguage: SupportedLanguage;
  cards: AdminDashboardCardVm[];
};

/**
 * `/admin` 대시보드 상단 카드 목록: 내비 항목 필터 + 라벨/설명 키 해석.
 */
export function useAdminDashboardCards(): AdminDashboardCardsVm {
  const { me } = useAdminMe();
  const { currentLanguage } = useLanguage();

  const cards = useMemo((): AdminDashboardCardVm[] => {
    if (!me) return [];

    return ADMIN_NAV_ITEMS.filter(
      (item) =>
        item.href !== '/admin' &&
        adminHasPermission(me.isSuperAdmin, me.permissions, item.permissionId),
    ).map((item) => {
      const labelKey = ADMIN_NAV_HREF_TO_LABEL_KEY[item.href];
      const descKey = ADMIN_NAV_HREF_TO_CARD_DESC_KEY[item.href];
      return {
        href: item.href,
        label: labelKey ? getUIText(labelKey, currentLanguage) : item.label,
        description: descKey ? getUIText(descKey, currentLanguage) : item.description,
        icon: item.icon,
      };
    });
  }, [me, currentLanguage]);

  return { currentLanguage, cards };
}
