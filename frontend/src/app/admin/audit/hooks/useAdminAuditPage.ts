"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AUDIT_TAB_ORDER,
  buildUnifiedAuditRows,
  getUnifiedAuditRowLabel,
  type AuditTabId,
} from "@/lib/adminAuditView";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LedgerEntry } from "@/lib/api/adminFinance";
import type { ModerationAuditEntry } from "@/lib/api/adminModeration";
import { ensureModerationAuditsLoaded, getModerationAudits } from "@/lib/api/adminModeration";
import { acknowledgeCurrentRecentAudit, getUnseenRecentAuditCountAsync } from "@/lib/adminAckState";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { getAdminFinanceLedgerEntries } from "@/lib/api/financeServer";

/** 신규 탭: 최근 24시간 이내 생성된 로그만 */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * 관리자 감사 로그: 원장·모더레이션 캐시 로드, 탭(범주·신규), 텍스트 검색, 신규 탭 열람 시 ack.
 */
export function useAdminAuditPage() {
  const { currentLanguage } = useLanguage();
  const [tab, setTab] = useState<AuditTabId>("all");
  const [tick, setTick] = useState(0);
  const [moderationRows, setModerationRows] = useState<ModerationAuditEntry[]>([]);
  const [ledgerRows, setLedgerRows] = useState<LedgerEntry[]>([]);
  const [nameByUsername, setNameByUsername] = useState<Record<string, string>>({});
  const [unseenNew, setUnseenNew] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(() => buildUnifiedAuditRows(ledgerRows, moderationRows), [ledgerRows, moderationRows]);

  // 모더레이션 감사 스토어를 서버와 동기화한 뒤 메모리 스냅샷 반영
  useEffect(() => {
    let alive = true;
    void (async () => {
      await ensureModerationAuditsLoaded();
      if (!alive) return;
      setModerationRows(getModerationAudits());
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  // 금융 원장(서버) — 감사 테이블과 동일 스키마로 정규화
  useEffect(() => {
    let alive = true;
    const loadLedger = async () => {
      const serverRows = await getAdminFinanceLedgerEntries();
      if (!alive) return;
      setLedgerRows(
        serverRows.map((r) => ({
          id: r.id,
          ownerId: r.ownerId,
          amount: r.amount,
          type: r.type as LedgerEntry["type"],
          refId: r.refId,
          note: r.note,
          createdBy: r.createdBy,
          createdAt: r.createdAt,
        })),
      );
    };
    void loadLedger();
    return () => {
      alive = false;
    };
  }, [tick]);

  // 탭별: 전체 / 24h 신규 / 범주
  const tabFiltered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "new") {
      const now = Date.now();
      return rows.filter((r) => now - new Date(r.createdAt).getTime() < NEW_WINDOW_MS);
    }
    return rows.filter((r) => r.category === tab);
  }, [rows, tab]);

  const actorLabel = useCallback(
    (raw: string) => {
      const v = (raw || "").trim();
      if (!v || v === "-") return "-";
      return nameByUsername[v] || v;
    },
    [nameByUsername],
  );

  // 현재 탭 안에서 키워드 검색(조치·UID·ref·비고·처리자)
  const displayedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((r) => {
      const actor = actorLabel(r.createdBy);
      const label = getUnifiedAuditRowLabel(r, currentLanguage);
      const hay = [label, r.ownerId, r.refId, r.note, r.createdBy, actor].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [tabFiltered, searchQuery, actorLabel, currentLanguage]);

  useEffect(() => {
    if (tab !== "new") return;
    void acknowledgeCurrentRecentAudit().then(() => refreshAdminBadges());
    setUnseenNew(0);
  }, [tab]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const n = await getUnseenRecentAuditCountAsync();
      if (alive) setUnseenNew(n);
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  useAdminDomainRefresh(
    ["audit", "booking", "payment", "user", "property", "adminFinanceLedger", "adminWithdrawalRequest"],
    () => setTick((t) => t + 1),
  );

  useEffect(() => {
    const resetToAll = () => setTab("all");
    window.addEventListener("admin-audit-reset-tab", resetToAll);
    return () => {
      window.removeEventListener("admin-audit-reset-tab", resetToAll);
    };
  }, []);

  // 어드민 닉네임 디렉터리 — 처리자 컬럼 표시에 사용
  useEffect(() => {
    let alive = true;
    const loadDirectory = async () => {
      const r = await fetch("/api/admin/accounts/directory", { credentials: "include" });
      if (!r.ok) return;
      const j = (await r.json()) as { admins: Array<{ username: string; nickname: string }> };
      const map: Record<string, string> = {};
      for (const a of j.admins) {
        const username = (a.username || "").trim();
        if (!username) continue;
        const nick = (a.nickname || "").trim();
        map[username] = nick ? `${nick} (${username})` : username;
      }
      if (alive) setNameByUsername(map);
    };
    void loadDirectory();
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  /** 탭 버튼 옆 개수(전체 `rows` 기준) */
  const countForTab = useCallback(
    (id: AuditTabId) => {
      if (id === "all") return rows.length;
      if (id === "new") {
        const now = Date.now();
        return rows.filter((r) => now - new Date(r.createdAt).getTime() < NEW_WINDOW_MS).length;
      }
      return rows.filter((r) => r.category === id).length;
    },
    [rows],
  );

  return {
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    unseenNew,
    displayedRows,
    countForTab,
    actorLabel,
    refresh,
    auditTabs: AUDIT_TAB_ORDER.map((id) => ({ id })),
  };
}

export type AdminAuditPageViewModel = ReturnType<typeof useAdminAuditPage>;
export type { AuditTabId, UnifiedAuditRow } from "@/lib/adminAuditView";
