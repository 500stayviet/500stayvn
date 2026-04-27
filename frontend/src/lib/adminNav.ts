import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Bug,
  ClipboardList,
  FileSignature,
  Home,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Undo2,
  Users,
  Wallet,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  /** 폴백(비표시 권장). 화면 라벨은 `getUIText` + `adminNavI18nMaps` 사용 */
  label: string;
  icon: LucideIcon;
  /** 폴백. 카드 설명은 `getUIText` + `ADMIN_NAV_HREF_TO_CARD_DESC_KEY` */
  description: string;
  /** 권한 체크 키 — 슈퍼는 전 메뉴 허용 */
  permissionId: string;
};

/** 관리자 상단 내비 + 대시보드 카드 공통 (라벨/설명은 영문 폴백 — 실제 UI는 i18n) */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Summary and shortcuts',
    permissionId: 'dashboard',
  },
  {
    href: '/admin/users',
    label: 'Accounts',
    icon: Users,
    description: 'Block, restore, search',
    permissionId: 'users',
  },
  {
    href: '/admin/properties',
    label: 'Listings',
    icon: Home,
    description: 'Hide and restore',
    permissionId: 'properties',
  },
  {
    href: '/admin/property-logs',
    label: 'Listing log',
    icon: Archive,
    description: 'Server log for deletes and cancels',
    permissionId: 'properties',
  },
  {
    href: '/admin/contracts',
    label: 'Contracts',
    icon: FileSignature,
    description: 'Contracts and rental start scheduling',
    permissionId: 'contracts',
  },
  {
    href: '/admin/settlements',
    label: 'Settlement',
    icon: Wallet,
    description: 'Approve withdrawable balances',
    permissionId: 'settlements',
  },
  {
    href: '/admin/refunds',
    label: 'Refunds',
    icon: Undo2,
    description: 'Approve cancellation refunds',
    permissionId: 'refunds',
  },
  {
    href: '/admin/withdrawals',
    label: 'Withdrawals',
    icon: ClipboardList,
    description: 'Process withdrawal requests',
    permissionId: 'withdrawals',
  },
  {
    href: '/admin/audit',
    label: 'Audit',
    icon: ScrollText,
    description: 'Financial and action logs',
    permissionId: 'audit',
  },
  {
    href: '/admin/kyc',
    label: 'KYC',
    icon: ShieldCheck,
    description: 'Identity verification review',
    permissionId: 'kyc',
  },
  {
    href: '/admin/system-log',
    label: 'System log',
    icon: Bug,
    description: 'Client errors, warnings, volatile info',
    permissionId: 'system-log',
  },
];
