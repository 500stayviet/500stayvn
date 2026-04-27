"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { acknowledgeNewProperty } from "@/lib/adminAckState";
import { isPropertyNew } from "@/lib/adminNewUtils";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";
import { ADMIN_PROPERTY_HIDE_AUDIT_REASON } from "@/constants/admin-property-moderation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { addSharedMemo, deleteSharedMemo, getSharedMemos } from "@/lib/api/adminMemos";
import { setPropertyHidden } from "@/lib/api/adminModeration";
import { getPropertyForAdmin } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";
import { getUIText } from "@/utils/i18n";

type MemoRow = { id: string; text: string; createdAt: string };

export type AdminPropertyDetailPhase = "no-id" | "loading" | "not-found" | "ready";

/**
 * 관리자 매물 상세: 데이터·메모 로드, 숨김 토글.
 */
export function useAdminPropertyDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const id = rawId ? decodeURIComponent(rawId) : "";
  const { currentLanguage } = useLanguage();
  const { me: admin } = useAdminMe();

  const [property, setProperty] = useState<PropertyData | null | undefined>(undefined);
  const [memoInput, setMemoInput] = useState("");
  const [memos, setMemos] = useState<MemoRow[]>([]);

  const reload = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      const signal = opts?.signal;
      if (!id) {
        setProperty(undefined);
        return;
      }
      const p = await getPropertyForAdmin(id);
      if (signal?.aborted) return;
      setProperty(p);
      const rows = await getSharedMemos("property", id, "property");
      if (signal?.aborted) return;
      setMemos(rows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    },
    [id],
  );

  useEffect(() => {
    const ac = new AbortController();
    if (!id) {
      setProperty(undefined);
      return;
    }
    setProperty(undefined);
    void reload({ signal: ac.signal });
    return () => ac.abort();
  }, [id, reload]);

  useAdminDomainRefresh(["property", "user", "admin_memo", "lessor_profile"], () => {
    void reload();
  });

  useEffect(() => {
    if (!property || !property.id) return;
    if (!isPropertyNew(property)) return;
    acknowledgeNewProperty(property.id);
    refreshAdminBadges();
  }, [property]);

  const formatMemoDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
  };

  const saveMemo = () => {
    if (!id || !memoInput.trim()) return;
    void (async () => {
      await addSharedMemo("property", id, "property", memoInput);
      setMemoInput("");
      const next = await getSharedMemos("property", id, "property");
      setMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
    })();
  };

  const deleteMemo = (memoId: string) => {
    if (!id) return;
    void (async () => {
      await deleteSharedMemo(memoId);
      const next = await getSharedMemos("property", id, "property");
      setMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
    })();
  };

  const unhideProperty = (prop: PropertyData) => {
    if (!admin?.username || !prop.id) return;
    const ok = setPropertyHidden(prop.id, false, admin.username);
    if (!ok) {
      window.alert(getUIText("adminOwnerBlockedCannotUnhide", currentLanguage));
      return;
    }
    refreshAdminBadges();
    void reload();
  };

  const hideProperty = (prop: PropertyData) => {
    if (!admin?.username || !prop.id) return;
    setPropertyHidden(prop.id, true, admin.username, ADMIN_PROPERTY_HIDE_AUDIT_REASON);
    refreshAdminBadges();
    void reload();
  };

  const phase: AdminPropertyDetailPhase = !id
    ? "no-id"
    : property === undefined
      ? "loading"
      : !property
        ? "not-found"
        : "ready";

  return {
    phase,
    id,
    admin,
    property: property as PropertyData | null | undefined,
    memos,
    memoInput,
    setMemoInput,
    formatMemoDate,
    saveMemo,
    deleteMemo,
    unhideProperty,
    hideProperty,
    reload,
  };
}

export type AdminPropertyDetailPageViewModel = ReturnType<typeof useAdminPropertyDetailPage>;
