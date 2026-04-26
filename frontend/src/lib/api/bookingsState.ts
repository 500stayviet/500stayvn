/**
 * 예약 클라이언트 캐시(메모리) + debounce PUT — Read/Write 구현과 공유.
 */

import {
  emitUserFacingSyncError,
  fetchWithRetry,
} from "@/lib/runtime/networkResilience";
import { withAppActor } from "@/lib/api/withAppActor";
import type { BookingData } from "./bookingsTypes";

export const BOOKINGS_BOOTSTRAP_KEY = "stayviet-bookings-bootstrap-v1";
export const BOOKINGS_BOOTSTRAP_SESSION_KEY = "stayviet-bookings-bootstrap-session-v1";

/** 서버 GET으로 채운 예약 스냅샷(탭 단위). off 모드에서는 LS와 무관하게 이 값만 신뢰합니다. */
let bookingsCache: BookingData[] | null = null;

let bookingsFlushTimer: ReturnType<typeof setTimeout> | null = null;

/** `getAllBookings`·`refreshBookingsFromServer` 동시 호출 합류 */
export let sharedAppBookingsRefresh: Promise<boolean> | null = null;

/**
 * `refreshBookingsFromServer` 등을 한 in-flight로 합침 (다른 모듈에서 `shared`에 직접 대입하지 않음)
 */
export function getOrStartSharedAppBookingsRefresh(
  start: () => Promise<boolean>,
): Promise<boolean> {
  if (!sharedAppBookingsRefresh) {
    sharedAppBookingsRefresh = start().finally(() => {
      sharedAppBookingsRefresh = null;
    });
  }
  return sharedAppBookingsRefresh;
}

/** `refresh` / 관리자 로드 — 메모리만 갱신(이벤트는 refresh 쪽에서 dispatch). */
export function setBookingsServerMemory(list: BookingData[] | null): void {
  bookingsCache = list;
}

/** 동기 스냅샷: 메모리 우선. */
export function readBookingsArray(): BookingData[] {
  const base = bookingsCache !== null ? bookingsCache : [];
  return JSON.parse(JSON.stringify(base)) as BookingData[];
}

/**
 * 로그아웃·계정 전환 시 예약 메모리·진행 중 동기화 타이머를 비웁니다.
 * (다른 사용자 예약이 잠깐 보이는 것을 방지)
 */
export function clearBookingsClientCache(): void {
  bookingsCache = null;
  sharedAppBookingsRefresh = null;
  if (bookingsFlushTimer) {
    clearTimeout(bookingsFlushTimer);
    bookingsFlushTimer = null;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bookingsUpdated"));
  }
}

/** 메모리에 서버 스냅샷을 반영합니다. */
export function writeBookingsArray(all: BookingData[]): void {
  bookingsCache = all;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bookingsUpdated"));
  }
  if (typeof window === "undefined") return;
  if (bookingsFlushTimer) clearTimeout(bookingsFlushTimer);
  bookingsFlushTimer = setTimeout(() => {
    bookingsFlushTimer = null;
    const snapshot = bookingsCache;
    if (!snapshot) return;
    void fetchWithRetry(
      "/api/app/bookings",
      withAppActor({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 },
    ).catch((e) => {
      console.warn("[bookings] PUT sync failed", e);
      emitUserFacingSyncError({
        area: "bookings",
        action: "sync",
        message:
          "예약 데이터 동기화가 지연되고 있습니다. 네트워크 상태를 확인해주세요.",
      });
    });
  }, 500);
}
