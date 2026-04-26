/**
 * 예약 — 조회(Read): 서버에서 캐시로, 캐시에서 읽기. in-flight 합류.
 */

import { markLedgerBootstrapDone } from "@/lib/runtime/localBootstrapMarkers";
import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from "@/lib/runtime/networkResilience";
import { withAppActor } from "@/lib/api/withAppActor";
import { getCurrentUserId } from "@/lib/api/auth";
import { parseAppBookingsListPayload } from "@/lib/api/appBookingsApiParse";
import { readResponseJsonOrMarker } from "@/lib/api/appResponseRead";
import { toISODateString } from "../utils/dateUtils";
import type { BookingData } from "./bookingsTypes";
import {
  BOOKINGS_BOOTSTRAP_KEY,
  BOOKINGS_BOOTSTRAP_SESSION_KEY,
  getOrStartSharedAppBookingsRefresh,
  readBookingsArray,
  setBookingsServerMemory,
  writeBookingsArray,
} from "./bookingsState";

function getSharedAppBookingsRefresh(): Promise<boolean> {
  return getOrStartSharedAppBookingsRefresh(() => refreshBookingsFromServer());
}

/** 앱 액터 기준으로 DB 예약만 페이지네이션 조회해 `bookingsCache`에 반영합니다. */
export async function refreshBookingsFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getCurrentUserId()) {
    setBookingsServerMemory([]);
    return true;
  }
  try {
    const list: BookingData[] = [];
    let offset = 0;
    const limit = 200;
    for (let i = 0; i < 200; i += 1) {
      const res = await fetchWithRetry(
        `/api/app/bookings?limit=${limit}&offset=${offset}`,
        withAppActor({ cache: "no-store" }),
        { retries: 2, baseDelayMs: 300 },
      );
      const json = await readResponseJsonOrMarker(res);
      if (json && typeof json === "object" && "__jsonParseError" in json) {
        throw new Error("invalid_json");
      }
      if (!res.ok) {
        if (isClientAuthErrorStatus(res.status)) {
          emitUserFacingSyncError({
            area: "bookings",
            action: "refresh",
            message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
          });
          return false;
        }
        throw new Error(String(res.status));
      }
      const data = parseAppBookingsListPayload(json);
      const chunk = data.bookings;
      list.push(...chunk);
      const hasMore = Boolean(data.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(data.page?.nextOffset ?? offset + chunk.length);
    }
    setBookingsServerMemory(list);
    window.dispatchEvent(new CustomEvent("bookingsUpdated"));
    return true;
  } catch (e) {
    setBookingsServerMemory(null);
    const code = e instanceof Error ? Number(e.message) : NaN;
    if (Number.isFinite(code) && isClientAuthErrorStatus(code)) {
      emitUserFacingSyncError({
        area: "bookings",
        action: "refresh",
        message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      });
      return false;
    }
    console.warn("[bookings] refreshBookingsFromServer failed", e);
    emitUserFacingSyncError({
      area: "bookings",
      action: "refresh",
      message: "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    });
    return false;
  }
}

async function fetchAllBookingsByEndpoint(
  endpoint: string,
  init: RequestInit,
): Promise<BookingData[]> {
  const list: BookingData[] = [];
  let offset = 0;
  const limit = 200;
  for (let i = 0; i < 200; i += 1) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await fetchWithRetry(
      `${endpoint}${sep}limit=${limit}&offset=${offset}`,
      init,
      { retries: 2, baseDelayMs: 300 },
    );
    const json = await readResponseJsonOrMarker(res);
    if (json && typeof json === "object" && "__jsonParseError" in json) {
      throw new Error("invalid_json");
    }
    if (!res.ok) throw new Error(String(res.status));
    const data = parseAppBookingsListPayload(json);
    const chunk = data.bookings;
    list.push(...chunk);
    if (!data.page?.hasMore || chunk.length === 0) break;
    offset = Number(data.page?.nextOffset ?? offset + chunk.length);
  }
  return list;
}

/** 관리자 세션에서 전체 예약 목록 조회 (`/api/admin/bookings`) */
export async function getAllBookingsForAdmin(): Promise<BookingData[]> {
  if (typeof window === "undefined") return [];
  try {
    return await fetchAllBookingsByEndpoint("/api/admin/bookings", {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    console.error("admin bookings load failed:", error);
    return [];
  }
}

/** 관리자 세션으로 전체 예약을 메모리에 반영합니다. */
export async function refreshBookingsCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const rows = await getAllBookingsForAdmin();
    setBookingsServerMemory(rows);
    window.dispatchEvent(new CustomEvent("bookingsUpdated"));
    return true;
  } catch {
    return false;
  }
}

let bookingsAdminLoadInFlight: Promise<boolean> | null = null;

/** 관리자 화면용: 전체 예약 캐시를 서버에서 채웁니다. 동시 호출을 한 번의 로드로 합칩니다. */
export async function ensureBookingsCacheForAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (bookingsAdminLoadInFlight) return bookingsAdminLoadInFlight;
  bookingsAdminLoadInFlight = refreshBookingsCacheForAdmin().finally(() => {
    bookingsAdminLoadInFlight = null;
  });
  return bookingsAdminLoadInFlight;
}

/** 앱 로그인 직후: 서버에서 최신 예약 스냅샷만 동기화합니다. */
export async function bootstrapBookingsFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  await getSharedAppBookingsRefresh();
  markLedgerBootstrapDone(BOOKINGS_BOOTSTRAP_KEY, BOOKINGS_BOOTSTRAP_SESSION_KEY);
}

function generateId(): string {
  return (
    "booking_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  );
}

/**
 * 호스트/게스트 화면 진입 전에 호출: 서버에서 내 예약 목록을 메모리에 채웁니다.
 * `bootstrapBookingsFromServer`·`getAllBookings`와 동일한 in-flight 를 공유합니다.
 */
export async function ensureBookingsLoadedForApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getCurrentUserId()) return false;
  return getSharedAppBookingsRefresh();
}

/**
 * 모든 예약 가져오기 (서버 원천)
 */
export async function getAllBookings(): Promise<BookingData[]> {
  if (typeof window === "undefined") return [];

  try {
    await getSharedAppBookingsRefresh();

    const bookings = readBookingsArray();
    let changed = false;
    for (const b of bookings) {
      if (!b.id || !String(b.id).trim()) {
        b.id = generateId();
        changed = true;
      }
    }
    if (changed) {
      writeBookingsArray(bookings);
    }
    return bookings;
  } catch (error) {
    console.error("예약 데이터 로드 실패:", error);
    return [];
  }
}

/**
 * 특정 예약 가져오기
 */
export async function getBooking(bookingId: string): Promise<BookingData | null> {
  const bookings = await getAllBookings();
  return bookings.find((b) => b.id === bookingId) || null;
}

/**
 * 사용자의 예약 목록 가져오기 (임차인)
 */
export async function getGuestBookings(guestId: string): Promise<BookingData[]> {
  const bookings = await getAllBookings();
  return bookings.filter((b) => b.guestId === guestId);
}

/**
 * 임대인의 예약 목록 가져오기
 */
export async function getOwnerBookings(ownerId: string): Promise<BookingData[]> {
  const bookings = await getAllBookings();
  return bookings.filter((b) => b.ownerId === ownerId);
}

/**
 * 매물의 특정 날짜 범위에 예약이 있는지 확인 (엄격한 물리적 중복 체크)
 */
export async function isDateRangeBooked(
  propertyId: string,
  checkIn: Date | string,
  checkOut: Date | string,
): Promise<boolean> {
  const bookings = await getPropertyBookings(propertyId);

  const targetStart = toISODateString(checkIn);
  const targetEnd = toISODateString(checkOut);

  if (!targetStart || !targetEnd) return false;

  return bookings.some((booking) => {
    const bookedStart = toISODateString(booking.checkInDate);
    const bookedEnd = toISODateString(booking.checkOutDate);

    if (!bookedStart || !bookedEnd) return false;

    const hasOverlap = targetStart < bookedEnd && targetEnd > bookedStart;
    if (hasOverlap) {
      console.log(
        `[isDateRangeBooked] Overlap detected (Stay-over Logic): ${targetStart}~${targetEnd} overlaps with existing ${bookedStart}~${bookedEnd}`,
      );
    }
    return hasOverlap;
  });
}

/**
 * 매물의 예약 목록 가져오기 (Gaps Logic: 물리적 매물 기준 통합)
 */
export async function getPropertyBookings(propertyId: string): Promise<BookingData[]> {
  try {
    const { getProperty, getAllProperties } = await import("./properties");
    const targetProp = await getProperty(propertyId);
    if (!targetProp) return [];

    const allBookings = await getAllBookings();
    const allProps = await getAllProperties();

    const normalize = (s: string | undefined) =>
      (s || "").trim().replace(/\s+/g, " ").toLowerCase();
    const targetAddress = normalize(targetProp.address);
    const targetTitle = normalize(targetProp.title);
    const targetUnit = normalize(targetProp.unitNumber);

    return allBookings.filter((booking) => {
      if (booking.status === "cancelled") return false;

      if (booking.propertyId === propertyId) return true;

      const bookedProp = allProps.find((p) => p.id === booking.propertyId);

      if (bookedProp) {
        const bookedAddress = normalize(bookedProp.address);
        const bookedTitle = normalize(bookedProp.title);
        const bookedUnit = normalize(bookedProp.unitNumber);

        const isSamePhysicalUnit =
          ((targetAddress !== "" &&
            bookedAddress !== "" &&
            targetAddress === bookedAddress) ||
            (targetTitle !== "" &&
              bookedTitle !== "" &&
              targetTitle === bookedTitle)) &&
          targetUnit === bookedUnit;

        return isSamePhysicalUnit;
      }

      const cachedAddress = normalize(booking.propertyAddress);
      const cachedTitle = normalize(booking.propertyTitle);

      return (
        (targetAddress !== "" &&
          cachedAddress !== "" &&
          targetAddress === cachedAddress) ||
        (targetTitle !== "" && cachedTitle !== "" && targetTitle === cachedTitle)
      );
    });
  } catch (error) {
    console.error("getPropertyBookings failed:", error);
    return [];
  }
}
