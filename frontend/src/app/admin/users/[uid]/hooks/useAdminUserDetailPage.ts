"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  computeGuestBookingStats,
  computeHostBookingStats,
  getGuestRefundRelatedBookings,
} from "@/lib/adminUserAccountDetail";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { getAdminOwnerBalances, type ServerOwnerBalances } from "@/lib/api/financeServer";
import { getAllBookingsForAdmin } from "@/lib/api/bookings";
import { addSharedMemo, deleteSharedMemo, getSharedMemos } from "@/lib/api/adminMemos";
import type { UserData } from "@/lib/api/auth";
import { parseAppUserPayload } from "@/lib/api/appUserApiParse";
import { setUserBlocked } from "@/lib/api/adminModeration";
import { refreshAdminBadges } from "@/lib/adminBadgeCounts";
import { acknowledgeNewUser } from "@/lib/adminAckState";
import { isUserNew } from "@/lib/adminNewUtils";
import { useAdminDomainRefresh } from "@/lib/adminDomainEventsClient";

type MemoRow = { id: string; text: string; createdAt: string };

type DataBundle = {
  host: ReturnType<typeof computeHostBookingStats>;
  guest: ReturnType<typeof computeGuestBookingStats>;
  refunds: ReturnType<typeof getGuestRefundRelatedBookings>;
  bal: ServerOwnerBalances;
};

export type AdminUserDetailPagePhase = "no-uid" | "loading" | "not-found" | "ready";

/**
 * 관리자·회원 상세: 프로필/메모/통계/잔고 로드 및 메모·차단 처리.
 */
export function useAdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uid = typeof params?.uid === "string" ? params.uid : "";
  const { me: admin } = useAdminMe();

  const [user, setUser] = useState<UserData | null | undefined>(undefined);
  const [hostMemos, setHostMemos] = useState<MemoRow[]>([]);
  const [guestMemos, setGuestMemos] = useState<MemoRow[]>([]);
  const [hostMemoInput, setHostMemoInput] = useState("");
  const [guestMemoInput, setGuestMemoInput] = useState("");
  const [data, setData] = useState<DataBundle | null>(null);
  const [dataTick, setDataTick] = useState(0);

  const loadUserAndMemos = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`/api/app/users/${encodeURIComponent(uid)}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        const u = parseAppUserPayload(await res.json());
        setUser(u && !u.deleted ? u : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    const [hostRows, guestRows] = await Promise.all([
      getSharedMemos("user", uid, "host"),
      getSharedMemos("user", uid, "guest"),
    ]);
    setHostMemos(hostRows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    setGuestMemos(guestRows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
  }, [uid]);

  useEffect(() => {
    void loadUserAndMemos();
  }, [loadUserAndMemos]);

  useEffect(() => {
    if (!user || user === undefined) return;
    if (!isUserNew(user)) return;
    acknowledgeNewUser(user.uid);
    refreshAdminBadges();
  }, [user]);

  useAdminDomainRefresh(
    ["user", "booking", "payment", "admin_memo", "admin_bank_account", "adminFinanceLedger"],
    () => {
      void loadUserAndMemos();
      setDataTick((t) => t + 1);
    },
  );

  useEffect(() => {
    if (!uid) {
      setData(null);
      return;
    }
    let cancelled = false;
    setData(null);
    void (async () => {
      const bookings = await getAllBookingsForAdmin();
      const now = new Date();
      const host = computeHostBookingStats(bookings, uid, now);
      const guest = computeGuestBookingStats(bookings, uid, now);
      const refunds = getGuestRefundRelatedBookings(bookings, uid);
      const bal = await getAdminOwnerBalances(uid);
      if (!cancelled) {
        setData({ host, guest, refunds, bal });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, dataTick]);

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

  const saveHost = () => {
    if (!uid) return;
    if (!hostMemoInput.trim()) return;
    void (async () => {
      await addSharedMemo("user", uid, "host", hostMemoInput);
      setHostMemoInput("");
      const next = await getSharedMemos("user", uid, "host");
      setHostMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const saveGuest = () => {
    if (!uid) return;
    if (!guestMemoInput.trim()) return;
    void (async () => {
      await addSharedMemo("user", uid, "guest", guestMemoInput);
      setGuestMemoInput("");
      const next = await getSharedMemos("user", uid, "guest");
      setGuestMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const deleteHostMemo = (memoId: string) => {
    if (!uid) return;
    void (async () => {
      await deleteSharedMemo(memoId);
      const next = await getSharedMemos("user", uid, "host");
      setHostMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const deleteGuestMemo = (memoId: string) => {
    if (!uid) return;
    void (async () => {
      await deleteSharedMemo(memoId);
      const next = await getSharedMemos("user", uid, "guest");
      setGuestMemos(next.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
    })();
  };

  const unblockUser = (targetUid: string) => {
    if (!admin?.username) return;
    void (async () => {
      await setUserBlocked(targetUid, false, admin!.username);
      refreshAdminBadges();
      void loadUserAndMemos();
    })();
  };

  const blockUser = (targetUid: string) => {
    if (!admin?.username) return;
    const reason = window.prompt("차단 사유를 입력하세요.", "관리자 차단") || "관리자 차단";
    void (async () => {
      await setUserBlocked(targetUid, true, admin!.username, reason);
      refreshAdminBadges();
      void loadUserAndMemos();
    })();
  };

  const phase: AdminUserDetailPagePhase = !uid
    ? "no-uid"
    : user === undefined
      ? "loading"
      : !user
        ? "not-found"
        : "ready";

  return {
    phase,
    uid,
    router,
    admin,
    user: user as UserData | null | undefined,
    hostMemos,
    guestMemos,
    hostMemoInput,
    setHostMemoInput,
    guestMemoInput,
    setGuestMemoInput,
    data,
    formatMemoDate,
    saveHost,
    saveGuest,
    deleteHostMemo,
    deleteGuestMemo,
    unblockUser,
    blockUser,
  };
}

export type AdminUserDetailPageViewModel = ReturnType<typeof useAdminUserDetailPage>;
