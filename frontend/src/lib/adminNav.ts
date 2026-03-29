import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

/** 관리자 상단 내비 + 대시보드 카드 공통 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, description: '업무 요약·바로가기' },
  { href: '/admin/settlements', label: '정산', icon: Wallet, description: '출금 가능 반영 승인' },
  { href: '/admin/withdrawals', label: '출금', icon: ClipboardList, description: '출금 요청 처리' },
  { href: '/admin/audit', label: '감사', icon: ScrollText, description: '금전·조치 로그' },
  { href: '/admin/users', label: '계정', icon: Users, description: '차단·복구' },
  { href: '/admin/properties', label: '매물', icon: Home, description: '숨김·복구' },
  { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, description: '본인확인 데이터' },
];
