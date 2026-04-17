"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import {
  ADMIN_DOMAIN_EVENT,
  type AdminDomainEventDetail,
} from "@/lib/adminDomainEventsClient";

/**
 * 관리자 레이아웃에서 SSE 구독 — 도메인 변경 시 브라우저 커스텀 이벤트로 전파 + 배지 갱신
 */
export default function AdminDomainEventBridge() {
  const pathname = usePathname();
  const esRef = useRef<EventSource | null>(null);
  const badgeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") {
      esRef.current?.close();
      esRef.current = null;
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      const es = new EventSource("/api/admin/domain-events/stream", {
        withCredentials: true,
      });
      esRef.current = es;

      es.onmessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data as string) as AdminDomainEventDetail;
          if (data.type === "event" && data.resource) {
            window.dispatchEvent(
              new CustomEvent(ADMIN_DOMAIN_EVENT, { detail: data }),
            );
            if (badgeRefreshTimerRef.current) {
              clearTimeout(badgeRefreshTimerRef.current);
            }
            badgeRefreshTimerRef.current = setTimeout(() => {
              refreshAdminBadges();
              badgeRefreshTimerRef.current = null;
            }, 250);
          }
        } catch {
          /* ignore */
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (cancelled) return;
        retryTimer = setTimeout(connect, 4000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (badgeRefreshTimerRef.current) {
        clearTimeout(badgeRefreshTimerRef.current);
        badgeRefreshTimerRef.current = null;
      }
      esRef.current?.close();
      esRef.current = null;
    };
  }, [pathname]);

  return null;
}
