"use client";

import { useEffect, useRef } from "react";

export const ADMIN_DOMAIN_EVENT = "admin-domain-event";

export type AdminDomainEventDetail = {
  type: "connected" | "event";
  seq?: number;
  resource?: string;
  action?: string;
  resourceId?: string | null;
  createdAt?: string;
  afterSeq?: number;
};

/**
 * DB 도메인 이벤트(`AdminDomainEvent`)가 SSE로 브로드캐스트될 때,
 * `resource`가 목록에 포함되면 `onRefresh` 실행.
 * `'*'` 이면 모든 리소스에서 호출.
 */
export function useAdminDomainRefresh(
  resources: string[],
  onRefresh: () => void,
): void {
  const cb = useRef(onRefresh);
  cb.current = onRefresh;
  const key = resources.join("\0");

  useEffect(() => {
    const allow = new Set(resources);
    const handler = (e: Event) => {
      const d = (e as CustomEvent<AdminDomainEventDetail>).detail;
      if (!d || d.type !== "event" || !d.resource) return;
      if (allow.has("*") || allow.has(d.resource)) cb.current();
    };
    window.addEventListener(ADMIN_DOMAIN_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(ADMIN_DOMAIN_EVENT, handler as EventListener);
  }, [key]);
}
