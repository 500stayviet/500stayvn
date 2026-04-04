'use client';

import type { ReactNode } from 'react';

type Props = {
  checkInDate: string;
  checkOutDate: string;
  addressLine: string;
  email: string;
  ownerUid: string;
  amount: number;
  amountClassName?: string;
  /** 카드 상단 배지 (예: 계약종료 후 유입) */
  headerBadge?: ReactNode;
  footer?: ReactNode;
};

/**
 * 정산·계약·환불 관리자 카드 공통 레이아웃 (날짜 강조 → 주소 → 이메일 → UID → 금액)
 */
export default function AdminSettlementStyleCard({
  checkInDate,
  checkOutDate,
  addressLine,
  email,
  ownerUid,
  amount,
  amountClassName = 'text-emerald-600',
  headerBadge,
  footer,
}: Props) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      {headerBadge ? (
        <div className="mb-2 flex flex-wrap items-center gap-1">{headerBadge}</div>
      ) : null}
      <p className="text-xl font-bold leading-snug tracking-tight text-slate-900">
        {checkInDate}
        <span className="mx-1.5 font-normal text-slate-400">~</span>
        {checkOutDate}
      </p>
      <p className="mt-2 text-sm text-slate-700 break-words">{addressLine}</p>
      <p className="mt-2 text-xs text-slate-800 break-all">{email}</p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-600 break-all">UID: {ownerUid}</p>
      <p className={`mt-2 text-lg font-bold tabular-nums ${amountClassName}`}>
        {amount.toLocaleString()} ₫
      </p>
      {footer}
    </div>
  );
}
