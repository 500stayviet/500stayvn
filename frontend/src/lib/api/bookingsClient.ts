/**
 * Bookings API 구현(캐시·동기·변경) — 모델은 `bookingsTypes`, 진입은 `bookings` (re-export)
 *
 * - 원장: 서버 DB (`/api/app/bookings` GET/PUT, 관리자는 `/api/admin/bookings`).
 * - 비즈니스 원천 데이터는 서버 DB(`/api/app/bookings`)입니다.
 * - localStorage는 UI 편의 데이터에만 사용하고, 예약 원천은 저장/복원하지 않습니다.
 */

import { toISODateString } from '../utils/dateUtils';
import { markLedgerBootstrapDone } from '@/lib/runtime/localBootstrapMarkers';
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from '@/lib/runtime/networkResilience';
import { withAppActor } from '@/lib/api/withAppActor';
import { getCurrentUserId } from '@/lib/api/auth';
import {
  parseAppPaymentResponse,
  parsePaymentPatchData,
  type PaymentServerTransition,
} from '@/lib/api/appPaymentResponse';
import type { BookingData, CreateBookingRequest } from './bookingsTypes';

const PAYMENT_DEFAULT_ERROR =
  '결제 정보를 서버에 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.';

const PAYMENT_CREATE_ERROR =
  '결제(메타)를 등록하지 못했습니다. 예약은 생성되었으나 결제 직전에 새로고침하거나 고객센터에 문의해 주세요.';

type PatchPaymentMetaResult =
  | { ok: false }
  | { ok: true; transition: PaymentServerTransition };

function emitPayCompleteTransitionToast(t: PaymentServerTransition) {
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: 'info',
      area: 'bookings',
      action: 'payment',
      message:
        '결제(환불) 반영에 따라 예약이 취소 처리되었습니다. 내 예약에서 상태를 확인해 주세요.',
    });
    return;
  }
  if (t.bookingConfirmed) {
    emitUserFacingAppToast({
      tone: 'success',
      area: 'bookings',
      action: 'payment',
      message: '결제가 완료되어 예약이 확정되었습니다.',
    });
    return;
  }
  emitUserFacingAppToast({
    tone: 'info',
    area: 'bookings',
    action: 'payment',
    message:
      '결제 정보가 서버에 반영되었습니다. 최신 예약 상태는 내 예약에서 확인해 주세요.',
  });
}

function emitRefundAdminTransitionToast(t: PaymentServerTransition) {
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: 'success',
      area: 'bookings',
      action: 'refund',
      message: '환불이 반영되어 예약이 취소(환불) 처리되었습니다.',
    });
    return;
  }
  emitUserFacingAppToast({
    tone: 'info',
    area: 'bookings',
    action: 'refund',
    message: '환불 결제 정보가 서버에 반영되었습니다.',
  });
}

export { toISODateString };

const BOOKINGS_BOOTSTRAP_KEY = 'stayviet-bookings-bootstrap-v1';
const BOOKINGS_BOOTSTRAP_SESSION_KEY = 'stayviet-bookings-bootstrap-session-v1';

/** 서버 GET으로 채운 예약 스냅샷(탭 단위). off 모드에서는 LS와 무관하게 이 값만 신뢰합니다. */
let bookingsCache: BookingData[] | null = null;

/** 동기 스냅샷: 메모리 우선. */
export function readBookingsArray(): BookingData[] {
  const base = bookingsCache !== null ? bookingsCache : [];
  return JSON.parse(JSON.stringify(base)) as BookingData[];
}

let bookingsFlushTimer: ReturnType<typeof setTimeout> | null = null;

/** 앱 액터용 GET 예약: 동시 호출을 한 번의 네트워크 요청으로 합칩니다. */
let sharedAppBookingsRefresh: Promise<boolean> | null = null;

function getSharedAppBookingsRefresh(): Promise<boolean> {
  if (!sharedAppBookingsRefresh) {
    sharedAppBookingsRefresh = refreshBookingsFromServer().finally(() => {
      sharedAppBookingsRefresh = null;
    });
  }
  return sharedAppBookingsRefresh;
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bookingsUpdated'));
  }
}

/**
 * 호스트/게스트 화면 진입 전에 호출: 서버에서 내 예약 목록을 메모리에 채웁니다.
 * `bootstrapBookingsFromServer`·`getAllBookings`와 동일한 in-flight 를 공유합니다.
 */
export async function ensureBookingsLoadedForApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!getCurrentUserId()) return false;
  return getSharedAppBookingsRefresh();
}

/** 메모리에 서버 스냅샷을 반영합니다. */
export function writeBookingsArray(all: BookingData[]): void {
  bookingsCache = all;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bookingsUpdated'));
  }
  if (typeof window === 'undefined') return;
  if (bookingsFlushTimer) clearTimeout(bookingsFlushTimer);
  // debounce: 연속 수정 시 PUT 횟수를 줄임 (off 에서도 서버가 유일 원장이므로 PUT 는 유지)
  bookingsFlushTimer = setTimeout(() => {
    bookingsFlushTimer = null;
    const snapshot = bookingsCache;
    if (!snapshot) return;
    void fetchWithRetry(
      '/api/app/bookings',
      withAppActor({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 }
    ).catch((e) => {
      console.warn('[bookings] PUT sync failed', e);
      emitUserFacingSyncError({
        area: 'bookings',
        action: 'sync',
        message: '예약 데이터 동기화가 지연되고 있습니다. 네트워크 상태를 확인해주세요.',
      });
    });
  }, 500);
}

/** 즉시 PUT: 결제·확정·취소 등 사용자 액션 직후 서버 원장과 맞출 때 사용 (debounce 없음) */
export async function syncBookingsNow(snapshot: BookingData[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetchWithRetry(
      '/api/app/bookings',
      withAppActor({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 }
    );
  } catch (e) {
    console.warn('[bookings] immediate PUT sync failed', e);
    emitUserFacingSyncError({
      area: 'bookings',
      action: 'sync',
      message: '예약 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
}

/** @returns false when HTTP/body says failure; 이미 emit. */
async function createPaymentMetaForBooking(booking: BookingData): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(
      '/api/app/payments',
      withAppActor({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: booking.guestId,
          amount: booking.totalPrice,
          currency: booking.priceUnit,
          status: booking.paymentStatus || 'pending',
          metaJson: {
            propertyId: booking.propertyId,
            ownerId: booking.ownerId,
            nights: booking.nights,
          },
        }),
      }),
    );
    const parsed = await parseAppPaymentResponse(res);
    if (!parsed.ok) {
      console.warn('[payments] create meta failed', parsed);
      emitUserFacingSyncError({
        area: 'bookings',
        action: 'payment_create',
        message: parsed.errorMessage || PAYMENT_CREATE_ERROR,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[payments] create meta failed', e);
    emitUserFacingSyncError({
      area: 'bookings',
      action: 'payment_create',
      message: PAYMENT_DEFAULT_ERROR,
    });
    return false;
  }
}

/** PATCH `data.transition` 를 반환; 실패 시 `ok: false` (emit 은 여기서 처리). */
async function patchPaymentMetaByBooking(
  bookingId: string,
  patch: Record<string, unknown>
): Promise<PatchPaymentMetaResult> {
  if (typeof window === 'undefined') return { ok: false };
  try {
    const res = await fetch(
      `/api/app/payments/${encodeURIComponent(bookingId)}`,
      withAppActor({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }),
    );
    const parsed = await parseAppPaymentResponse(res);
    if (!parsed.ok) {
      console.warn('[payments] patch meta failed', parsed);
      emitUserFacingSyncError({
        area: 'bookings',
        action: 'payment_patch',
        message: parsed.errorMessage || PAYMENT_DEFAULT_ERROR,
      });
      return { ok: false };
    }
    const { transition } = parsePaymentPatchData(parsed.data);
    return { ok: true, transition };
  } catch (e) {
    console.warn('[payments] patch meta failed', e);
    emitUserFacingSyncError({
      area: 'bookings',
      action: 'payment_patch',
      message: PAYMENT_DEFAULT_ERROR,
    });
    return { ok: false };
  }
}

/** 앱 액터 기준으로 DB 예약만 페이지네이션 조회해 `bookingsCache`에 반영합니다. */
export async function refreshBookingsFromServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!getCurrentUserId()) {
    bookingsCache = [];
    return true;
  }
  try {
    const list: BookingData[] = [];
    let offset = 0;
    const limit = 200;
    for (let i = 0; i < 200; i += 1) {
      const res = await fetchWithRetry(
        `/api/app/bookings?limit=${limit}&offset=${offset}`,
        withAppActor({ cache: 'no-store' }),
        { retries: 2, baseDelayMs: 300 }
      );
      if (!res.ok) {
        if (isClientAuthErrorStatus(res.status)) {
          emitUserFacingSyncError({
            area: 'bookings',
            action: 'refresh',
            message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
          });
          return false;
        }
        throw new Error(String(res.status));
      }
      const data = (await res.json()) as {
        bookings?: BookingData[];
        page?: { hasMore?: boolean; nextOffset?: number };
      };
      const chunk = Array.isArray(data.bookings) ? data.bookings : [];
      list.push(...chunk);
      const hasMore = Boolean(data.page?.hasMore);
      if (!hasMore || chunk.length === 0) break;
      offset = Number(data.page?.nextOffset ?? offset + chunk.length);
    }
    bookingsCache = list;
    window.dispatchEvent(new CustomEvent('bookingsUpdated'));
    return true;
  } catch (e) {
    bookingsCache = null;
    const code = e instanceof Error ? Number(e.message) : NaN;
    if (Number.isFinite(code) && isClientAuthErrorStatus(code)) {
      emitUserFacingSyncError({
        area: 'bookings',
        action: 'refresh',
        message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
      });
      return false;
    }
    console.warn('[bookings] refreshBookingsFromServer failed', e);
    emitUserFacingSyncError({
      area: 'bookings',
      action: 'refresh',
      message: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
    return false;
  }
}

async function fetchAllBookingsByEndpoint(
  endpoint: string,
  init: RequestInit
): Promise<BookingData[]> {
  const list: BookingData[] = [];
  let offset = 0;
  const limit = 200;
  for (let i = 0; i < 200; i += 1) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const res = await fetchWithRetry(
      `${endpoint}${sep}limit=${limit}&offset=${offset}`,
      init,
      { retries: 2, baseDelayMs: 300 }
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      bookings?: BookingData[];
      page?: { hasMore?: boolean; nextOffset?: number };
    };
    const chunk = Array.isArray(data.bookings) ? data.bookings : [];
    list.push(...chunk);
    if (!data.page?.hasMore || chunk.length === 0) break;
    offset = Number(data.page?.nextOffset ?? offset + chunk.length);
  }
  return list;
}

/** 관리자 세션에서 전체 예약 목록 조회 (`/api/admin/bookings`) */
export async function getAllBookingsForAdmin(): Promise<BookingData[]> {
  if (typeof window === 'undefined') return [];
  try {
    return await fetchAllBookingsByEndpoint('/api/admin/bookings', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch (error) {
    console.error('admin bookings load failed:', error);
    return [];
  }
}

/** 관리자 세션으로 전체 예약을 메모리에 반영합니다. */
export async function refreshBookingsCacheForAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const rows = await getAllBookingsForAdmin();
    bookingsCache = rows;
    window.dispatchEvent(new CustomEvent('bookingsUpdated'));
    return true;
  } catch {
    return false;
  }
}

let bookingsAdminLoadInFlight: Promise<boolean> | null = null;

/** 관리자 화면용: 전체 예약 캐시를 서버에서 채웁니다. 동시 호출은 한 번의 로드로 합칩니다. */
export async function ensureBookingsCacheForAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (bookingsAdminLoadInFlight) return bookingsAdminLoadInFlight;
  bookingsAdminLoadInFlight = refreshBookingsCacheForAdmin().finally(() => {
    bookingsAdminLoadInFlight = null;
  });
  return bookingsAdminLoadInFlight;
}

/** 앱 로그인 직후: 서버에서 최신 예약 스냅샷만 동기화합니다. */
export async function bootstrapBookingsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  await getSharedAppBookingsRefresh();
  markLedgerBootstrapDone(BOOKINGS_BOOTSTRAP_KEY, BOOKINGS_BOOTSTRAP_SESSION_KEY);
}

/**
 * UUID 생성
 */
function generateId(): string {
  return 'booking_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 모든 예약 가져오기 (서버 원천)
 */
export async function getAllBookings(): Promise<BookingData[]> {
  if (typeof window === 'undefined') return [];

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
    console.error('예약 데이터 로드 실패:', error);
    return [];
  }
}

/**
 * 특정 예약 가져오기
 */
export async function getBooking(bookingId: string): Promise<BookingData | null> {
  const bookings = await getAllBookings();
  return bookings.find(b => b.id === bookingId) || null;
}

/**
 * 사용자의 예약 목록 가져오기 (임차인)
 */
export async function getGuestBookings(guestId: string): Promise<BookingData[]> {
  const bookings = await getAllBookings();
  return bookings.filter(b => b.guestId === guestId);
}

/**
 * 임대인의 예약 목록 가져오기
 */
export async function getOwnerBookings(ownerId: string): Promise<BookingData[]> {
  const bookings = await getAllBookings();
  return bookings.filter(b => b.ownerId === ownerId);
}

/**
 * 매물의 특정 날짜 범위에 예약이 있는지 확인 (엄격한 물리적 중복 체크)
 */
export async function isDateRangeBooked(
  propertyId: string,
  checkIn: Date | string,
  checkOut: Date | string
): Promise<boolean> {
  const bookings = await getPropertyBookings(propertyId);
  
  const targetStart = toISODateString(checkIn);
  const targetEnd = toISODateString(checkOut);
  
  if (!targetStart || !targetEnd) return false;

  return bookings.some(booking => {
    const bookedStart = toISODateString(booking.checkInDate);
    const bookedEnd = toISODateString(booking.checkOutDate);
    
    if (!bookedStart || !bookedEnd) return false;

    // 날짜 범위 겹침 확인 (ISO 문자열 비교)
    // Stay-over Logic: 기존 예약의 체크아웃 날짜와 새 예약의 체크인 날짜가 같은 것은 겹침이 아님.
    // 이는 체크인(14:00)과 체크아웃(12:00) 시간 차이가 존재하기 때문임.
    // 겹침 조건: (새 체크인 < 기존 체크아웃) AND (새 체크아웃 > 기존 체크인)
    const hasOverlap = targetStart < bookedEnd && targetEnd > bookedStart;
    
    if (hasOverlap) {
      console.log(`[isDateRangeBooked] Overlap detected (Stay-over Logic): ${targetStart}~${targetEnd} overlaps with existing ${bookedStart}~${bookedEnd}`);
    }
    
    return hasOverlap;
  });
}

/**
 * 매물의 예약 목록 가져오기 (Gaps Logic: 물리적 매물 기준 통합)
 */
export async function getPropertyBookings(propertyId: string): Promise<BookingData[]> {
  try {
    const { getProperty, getAllProperties } = await import('./properties');
    const targetProp = await getProperty(propertyId);
    if (!targetProp) return [];

    const allBookings = await getAllBookings();
    const allProps = await getAllProperties();

    // 정규화를 통한 정확한 비교
    const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const targetAddress = normalize(targetProp.address);
    const targetTitle = normalize(targetProp.title);
    const targetUnit = normalize(targetProp.unitNumber);

    return allBookings.filter(booking => {
      // 1. 이미 취소된 예약은 제외
      if (booking.status === 'cancelled') return false;
      
      // 2. 직접적인 ID 매칭 (기본)
      if (booking.propertyId === propertyId) return true;

      // 3. 물리적 동일 매물 확인 (Gaps Logic 대응)
      const bookedProp = allProps.find(p => p.id === booking.propertyId);
      
      if (bookedProp) {
        const bookedAddress = normalize(bookedProp.address);
        const bookedTitle = normalize(bookedProp.title);
        const bookedUnit = normalize(bookedProp.unitNumber);

        // 주소나 제목 중 하나가 일치하고, 동호수가 정확히 일치해야 함
        // 주소/제목이 비어있지 않은 경우에만 비교
        const isSamePhysicalUnit = (
          (targetAddress !== '' && bookedAddress !== '' && targetAddress === bookedAddress) || 
          (targetTitle !== '' && bookedTitle !== '' && targetTitle === bookedTitle)
        ) && (targetUnit === bookedUnit);

        return isSamePhysicalUnit;
      }

      // 매물 레코드가 삭제되었거나 찾을 수 없는 경우에도 예약에 캐싱된 정보로 확인
      const cachedAddress = normalize(booking.propertyAddress);
      const cachedTitle = normalize(booking.propertyTitle);
      
      // 예약 시점의 캐싱된 정보와 현재 매물의 정보 비교
      return (
        (targetAddress !== '' && cachedAddress !== '' && targetAddress === cachedAddress) || 
        (targetTitle !== '' && cachedTitle !== '' && targetTitle === cachedTitle)
      );
    });
  } catch (error) {
    console.error('getPropertyBookings failed:', error);
    return [];
  }
}

/**
 * 예약 생성
 */
export async function createBooking(
  data: CreateBookingRequest,
  propertyData: {
    title: string;
    address?: string;
    image?: string;
    ownerId: string;
    ownerName?: string;
    price: number;
    priceUnit: 'vnd' | 'usd';
    checkInTime?: string;
    checkOutTime?: string;
    petFee?: number;
  },
  guestId: string
): Promise<BookingData> {
  if (typeof window === 'undefined') {
    throw new Error('Not supported in SSR');
  }
  // 1. 중복 예약 체크 (Strict Overlap Check)
  const isBooked = await isDateRangeBooked(data.propertyId, data.checkInDate, data.checkOutDate);
  if (isBooked) {
    throw new Error('AlreadyBooked');
  }

  const bookings = await getAllBookings();
  
  // 숙박 일수 계산 (ISO 날짜 기준)
  const checkIn = new Date(toISODateString(data.checkInDate));
  const checkOut = new Date(toISODateString(data.checkOutDate));
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  // 요금 계산: 숙박 + 애완동물 + 예약수수료(10%)
  const weeks = Math.ceil(nights / 7);
  const accommodationTotal = propertyData.price * weeks;
  const petCount = data.petCount ?? 0;
  const petFeePerWeek = propertyData.petFee ?? 0;
  const petTotal = petCount * petFeePerWeek * weeks;
  const serviceFeePercent = 10;
  const serviceFee = Math.round((accommodationTotal + petTotal) * (serviceFeePercent / 100));
  const totalPrice = accommodationTotal + petTotal + serviceFee;
  
  const newBooking: BookingData = {
    id: generateId(),
    propertyId: data.propertyId,
    propertyTitle: propertyData.title,
    propertyAddress: propertyData.address,
    propertyImage: propertyData.image,
    
    guestId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    guestMessage: data.guestMessage,
    
    ownerId: propertyData.ownerId,
    ownerName: propertyData.ownerName,
    
    checkInDate: toISODateString(data.checkInDate),
    checkOutDate: toISODateString(data.checkOutDate),
    checkInTime: propertyData.checkInTime || '14:00',
    checkOutTime: propertyData.checkOutTime || '12:00',
    
    adults: data.adults,
    children: data.children,
    petCount: petCount || undefined,
    
    totalPrice,
    priceUnit: propertyData.priceUnit,
    nights,
    accommodationTotal,
    petTotal: petTotal || undefined,
    serviceFee,
    serviceFeePercent,
    
    paymentStatus: 'pending',
    status: 'pending',
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 채팅방 생성 (동적 import로 순환 참조 방지)
  const { createChatRoom } = await import('./chat');
  const chatRoom = await createChatRoom({
    bookingId: newBooking.id!,
    propertyId: newBooking.propertyId,
    propertyTitle: newBooking.propertyTitle,
    propertyImage: newBooking.propertyImage,
    ownerId: newBooking.ownerId,
    ownerName: newBooking.ownerName,
    guestId: newBooking.guestId,
    guestName: newBooking.guestName,
  });
  
  newBooking.chatRoomId = chatRoom.id;

  bookings.push(newBooking);
  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  await createPaymentMetaForBooking(newBooking);

  return newBooking;
}

/**
 * 결제 완료 처리
 */
export async function completePayment(
  bookingId: string,
  paymentMethod: BookingData['paymentMethod']
): Promise<BookingData | null> {
  if (typeof window === 'undefined') return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return null;
  
  bookings[index] = {
    ...bookings[index],
    paymentMethod,
    paymentStatus: 'paid',
    paymentDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  const paymentOk = await patchPaymentMetaByBooking(bookingId, {
    status: 'paid',
    provider: paymentMethod || null,
  });
  if (!paymentOk) {
    await refreshBookingsFromServer();
    throw new Error('payment_server_sync_failed');
  }
  return bookings[index];
}

/**
 * 예약 확정 처리
 */
export async function confirmBooking(bookingId: string): Promise<BookingData | null> {
  if (typeof window === 'undefined') return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return null;
  
  // 결제가 완료되지 않았으면 확정 불가
  if (bookings[index].paymentStatus !== 'paid') {
    throw new Error('결제가 완료되지 않았습니다.');
  }
  
  const booking = bookings[index];
  
  // 매물 상태를 'rented'로 업데이트하지 않음 (7주일 단위 계약 여유가 있을 수 있으므로 광고 중 유지)
  
  bookings[index] = {
    ...bookings[index],
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return bookings[index];
}

/**
 * 예약 취소 처리
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ booking: BookingData | null; relistResult?: any }> {
  if (typeof window === 'undefined') return { booking: null };
  const bookings = await getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return { booking: null };
  
  const booking = bookings[index];
  bookings[index] = {
    ...bookings[index],
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
    updatedAt: new Date().toISOString(),
  };

  // 매물 상태 자동 복구 로직 실행 (Rule 1, 2, 3, 5)
  let relistResult;
  try {
    const { handleCancellationRelist } = await import('./properties');
    relistResult = await handleCancellationRelist(booking.propertyId, booking.ownerId);
  } catch (error) {
    console.error('매물 자동 복구 처리 실패:', error);
  }

  // 취소 시 관련 채팅방의 모든 메시지를 읽음 처리 (알림 제거용)
  const chatRoomId = booking.chatRoomId;
  try {
    const { markAllMessagesInRoomAsRead, getChatRoomByBookingId } = await import('./chat');
    if (chatRoomId) {
      await markAllMessagesInRoomAsRead(chatRoomId);
    } else {
      // chatRoomId가 없으면 bookingId로 조회 시도
      const room = await getChatRoomByBookingId(booking.id!);
      if (room) {
        await markAllMessagesInRoomAsRead(room.id);
      }
    }
  } catch (error) {
    console.error('Failed to mark messages as read on cancellation:', error);
  }

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return { booking: bookings[index], relistResult };
}

/**
 * 예약 데이터 영구 삭제
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const bookings = await getAllBookings();
    if (bookings.length === 0) return;
    const filtered = bookings.filter((b) => b.id !== bookingId);
    if (filtered.length === bookings.length) return;

    writeBookingsArray(filtered);
    await syncBookingsNow(filtered);

    try {
      const { purgeSettlementStateForDeletedBooking } = await import('./adminFinance');
      await purgeSettlementStateForDeletedBooking(bookingId);
    } catch (e) {
      console.error('정산 큐/승인 정리 실패:', e);
    }
  } catch (error) {
    console.error('예약 삭제 실패:', error);
    throw error;
  }
}

/**
 * 취소되었고 결제는 완료됐으나 관리자 환불 승인 전인 건에 대해 환불 처리(상태 반영).
 */
export async function approveRefundBooking(bookingId: string, adminId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return false;
  const b = bookings[index];
  if (b.status !== 'cancelled' || b.paymentStatus !== 'paid' || b.refundAdminApproved) return false;

  bookings[index] = {
    ...b,
    paymentStatus: 'refunded',
    refundAdminApproved: true,
    refundAdminApprovedAt: new Date().toISOString(),
    refundAdminApprovedBy: adminId,
    updatedAt: new Date().toISOString(),
  };
  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  const refundPatch = await patchPaymentMetaByBooking(bookingId, {
    status: 'refunded',
    refundStatus: 'approved',
    refundAmount: b.totalPrice,
  });
  if (!refundPatch.ok) {
    await refreshBookingsFromServer();
    return false;
  }
  await refreshBookingsFromServer();
  emitRefundAdminTransitionToast(refundPatch.transition);

  const { appendRefundLedgerEntry } = await import('@/lib/api/adminFinance');
  await appendRefundLedgerEntry({
    ownerId: b.ownerId,
    amount: b.totalPrice,
    bookingId: b.id!,
    adminId,
  });
  return true;
}

/**
 * 채팅방 ID 설정
 */
export async function setChatRoomId(
  bookingId: string,
  chatRoomId: string
): Promise<BookingData | null> {
  if (typeof window === 'undefined') return null;
  const bookings = await getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return null;
  
  bookings[index] = {
    ...bookings[index],
    chatRoomId,
    updatedAt: new Date().toISOString(),
  };

  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);
  return bookings[index];
}
