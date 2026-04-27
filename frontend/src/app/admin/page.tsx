'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';
import {
  ADMIN_NAV_HREF_TO_CARD_DESC_KEY,
  ADMIN_NAV_HREF_TO_LABEL_KEY,
} from '@/lib/adminNavI18nMaps';
import { adminHasPermission } from '@/lib/adminPermissions';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';

export default function AdminPage() {
  const { me } = useAdminMe();
  const { currentLanguage } = useLanguage();
  const cards = ADMIN_NAV_ITEMS.filter(
    (item) =>
      item.href !== '/admin' &&
      me &&
      adminHasPermission(me.isSuperAdmin, me.permissions, item.permissionId)
  );

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-1 border-b border-slate-100 pb-4">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
            {getUIText('adminHomeTitle', currentLanguage)}
          </h1>
          <p className="text-sm text-slate-500">
            {getUIText('adminHomeSubtitle', currentLanguage)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;
            const labelKey = ADMIN_NAV_HREF_TO_LABEL_KEY[item.href];
            const descKey = ADMIN_NAV_HREF_TO_CARD_DESC_KEY[item.href];
            const cardLabel = labelKey ? getUIText(labelKey, currentLanguage) : item.label;
            const cardDesc = descKey ? getUIText(descKey, currentLanguage) : item.description;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
                    <Icon className="h-5 w-5 text-slate-700" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{cardLabel}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{cardDesc}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
