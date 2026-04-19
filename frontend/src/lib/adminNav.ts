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
  label: string;
  icon: LucideIcon;
  description: string;
  /** 권한 체크 키 — 슈퍼는 전 메뉴 허용 */
  permissionId: string;
};

/** 관리자 상단 내비 + 대시보드 카드 공통 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: '대시보드',
    icon: LayoutDashboard,
    description: '업무 요약·바로가기',
    permissionId: 'dashboard',
  },
  {
    href: '/admin/users',
    label: '계정',
    icon: Users,
    description: '차단·복구 및 검색',
    permissionId: 'users',
  },
  {
    href: '/admin/properties',
    label: '매물',
    icon: Home,
    description: '숨김·복구',
    permissionId: 'properties',
  },
  {
    href: '/admin/property-logs',
    label: '매물 이력',
    icon: Archive,
    description: '삭제·취소 서버 로그',
    permissionId: 'properties',
  },
  {
    href: '/admin/contracts',
    label: '계약',
    icon: FileSignature,
    description: '체결·임대 시작 예약',
    permissionId: 'contracts',
  },
  {
    href: '/admin/settlements',
    label: '정산',
    icon: Wallet,
    description: '출금 가능 반영 승인',
    permissionId: 'settlements',
  },
  {
    href: '/admin/refunds',
    label: '환불',
    icon: Undo2,
    description: '취소 환불 승인',
    permissionId: 'refunds',
  },
  {
    href: '/admin/withdrawals',
    label: '출금',
    icon: ClipboardList,
    description: '출금 요청 처리',
    permissionId: 'withdrawals',
  },
  {
    href: '/admin/audit',
    label: '감사',
    icon: ScrollText,
    description: '금전·조치 로그',
    permissionId: 'audit',
  },
  {
    href: '/admin/kyc',
    label: 'KYC',
    icon: ShieldCheck,
    description: '본인확인·검수',
    permissionId: 'kyc',
  },
  {
    href: '/admin/system-log',
    label: '시스템 로그',
    icon: Bug,
    description: '클라이언트 오류·경고·휘발 정보',
    permissionId: 'system-log',
  },
];
