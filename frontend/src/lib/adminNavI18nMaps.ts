import type { UITextKey } from '@/utils/i18n';

/** 관리자 상단 탭: href → 메뉴 라벨 키 */
export const ADMIN_NAV_HREF_TO_LABEL_KEY: Partial<Record<string, UITextKey>> = {
  '/admin': 'adminNavDashboard',
  '/admin/users': 'adminNavUsers',
  '/admin/properties': 'adminNavProperties',
  '/admin/property-logs': 'adminNavPropertyLogs',
  '/admin/contracts': 'adminNavContracts',
  '/admin/settlements': 'adminNavSettlements',
  '/admin/refunds': 'adminNavRefunds',
  '/admin/withdrawals': 'adminNavWithdrawals',
  '/admin/audit': 'adminNavAudit',
  '/admin/kyc': 'adminNavKyc',
  '/admin/system-log': 'adminNavSystemLog',
};

/** 대시보드 카드( /admin 제외 ): href → 카드 설명 키 */
export const ADMIN_NAV_HREF_TO_CARD_DESC_KEY: Partial<Record<string, UITextKey>> = {
  '/admin/users': 'adminNavDescUsers',
  '/admin/properties': 'adminNavDescProperties',
  '/admin/property-logs': 'adminNavDescPropertyLogs',
  '/admin/contracts': 'adminNavDescContracts',
  '/admin/settlements': 'adminNavDescSettlements',
  '/admin/refunds': 'adminNavDescRefunds',
  '/admin/withdrawals': 'adminNavDescWithdrawals',
  '/admin/audit': 'adminNavDescAudit',
  '/admin/kyc': 'adminNavDescKyc',
  '/admin/system-log': 'adminNavDescSystemLog',
};
