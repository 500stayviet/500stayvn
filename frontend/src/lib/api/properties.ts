/**
 * Properties API Service (LocalStorage 버전)
 * 
 * 브라우저 LocalStorage에 매물 데이터를 저장하고 관리하는 서비스
 * (Firebase DB 미사용 — Postgres·로컬 저장소 우선)
 */

import { PropertyData } from '@/types/property';
import {
  getReservationsByOwner,
  ReservationData,
} from './reservations';
import { parseDate, toISODateString } from '@/lib/utils/dateUtils';
import {
  isDateRangeBooked,
  getAllBookings,
  BookingData,
  readBookingsArray,
  writeBookingsArray,
} from './bookings';
import { hasAvailableBookingPeriod, isParentPropertyRecord } from '@/lib/utils/propertyUtils';
import {
  markLedgerBootstrapDone,
} from '@/lib/runtime/localBootstrapMarkers';
import {
  emitUserFacingSyncError,
  fetchWithRetry,
} from '@/lib/runtime/networkResilience';
import { withAppActor } from '@/lib/api/withAppActor';
import {
  postAppPropertyActionLog,
} from '@/lib/api/adminPropertyActionLogs';
import {
  serializeDate,
  toDate,
} from './propertiesHelpers';
import {
  clearPropertiesClientCache,
  ensurePropertiesLoadedForApp,
  getPropertySyncErrorMessage,
  hydratePropertiesMemoryIfLoggedIn,
  hydratePropertyAndBookingMemoryIfLoggedIn,
  readPropertiesArray,
  refreshPropertiesFromServer,
  writePropertiesArray,
} from './propertiesStore';
import {
  handleCancellationRelistLifecycle,
  recalculateAndSplitPropertyLifecycle,
} from './propertiesLifecycle';

/**
 * 날짜 중복 체크 (엄격한 ISO 날짜 기준)
 */
export function isDateOverlap(range1: {start: Date | string, end: Date | string}, range2: {start: Date | string, end: Date | string}): boolean {
  const s1 = toISODateString(range1.start);
  const e1 = toISODateString(range1.end);
  const s2 = toISODateString(range2.start);
  const e2 = toISODateString(range2.end);
  
  return s1 < e2 && s2 < e1;
}

export interface PropertyDateRange {
  checkIn: Date;
  checkOut: Date;
}

export type PropertiesByOwnerResult = {
  properties: PropertyData[];
  bookedDateRanges: Map<string, PropertyDateRange[]>;
};

async function syncPropertiesNow(snapshot: PropertyData[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetchWithRetry(
      '/api/app/properties',
      withAppActor({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 }
    );
    if (!res.ok) throw new Error(String(res.status));
  } catch (e) {
    const code = e instanceof Error ? Number(e.message) : NaN;
    const status = Number.isFinite(code) ? code : null;
    console.warn('[properties] immediate PUT sync failed', e);
    emitUserFacingSyncError({
      area: 'properties',
      action: 'sync',
      message: getPropertySyncErrorMessage(status),
    });
    throw e;
  }
}

/** 부모 매물 + 동일 주소·호실 예약 구간 (pending/confirmed) — getAvailableProperties / 호스트·관리자 동기 기준 */
export function buildBookedRangesForParentListing(
  property: PropertyData,
  allProps: PropertyData[],
  reservations: ReservationData[]
): PropertyDateRange[] {
  const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const targetAddress = normalize(property.address);
  const targetTitle = normalize(property.title);
  const targetUnit = normalize(property.unitNumber);

  return reservations
    .filter((r) => {
      if (r.status !== 'pending' && r.status !== 'confirmed') return false;
      const targetProp = allProps.find((p) => p.id === r.propertyId);
      if (targetProp) {
        const bookedAddress = normalize(targetProp.address);
        const bookedTitle = normalize(targetProp.title);
        const bookedUnit = normalize(targetProp.unitNumber);

        return (
          ((targetAddress !== '' && bookedAddress !== '' && targetAddress === bookedAddress) ||
            (targetTitle !== '' && bookedTitle !== '' && targetTitle === bookedTitle)) &&
          targetUnit === bookedUnit
        );
      }
      return false;
    })
    .map((r) => {
      const checkIn = parseDate(r.checkInDate);
      const checkOut = parseDate(r.checkOutDate);
      return checkIn && checkOut ? { checkIn, checkOut } : null;
    })
    .filter((r): r is PropertyDateRange => r != null);
}

/**
 * 비즈니스 원천은 서버 DB(`/api/app/properties`) — LS는 UI 편의 전용으로만 사용합니다.
 */
const PROPS_BOOTSTRAP_KEY = 'stayviet-properties-bootstrap-v1';
const PROPS_BOOTSTRAP_SESSION_KEY = 'stayviet-properties-bootstrap-session-v1';

/** 앱 로그인 직후: 폴백 off 면 LS 없이 서버만, readwrite 면 1회 import 후 서버와 맞춤 */
export async function bootstrapPropertiesFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  // 4단계: 비즈니스 매물 데이터는 LS를 bootstrap 소스로 쓰지 않습니다.
  // 비로그인도 공개 API를 통해 마스킹 데이터가 내려오므로 항상 서버에서 동기화합니다.
  await ensurePropertiesLoadedForApp();
  markLedgerBootstrapDone(PROPS_BOOTSTRAP_KEY, PROPS_BOOTSTRAP_SESSION_KEY);
}

export interface CancelledPropertyLog {
  id: string;
  propertyId: string;
  reservationId?: string;
  cancelledAt: string;
  ownerId: string;
}

/**
 * 취소된 매물 기록 저장
 */
export async function logCancelledProperty(log: Omit<CancelledPropertyLog, 'id' | 'cancelledAt'>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await postAppPropertyActionLog({
      propertyId: log.propertyId,
      actionType: 'CANCELLED',
      reservationId: log.reservationId,
      ownerId: log.ownerId,
    });
  } catch (error) {
    console.error('Error logging cancelled property:', error);
  }
}

/**
 * 매물 재등록 (Expired -> Active)
 */
export async function reRegisterProperty(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const property = await getProperty(id);
    if (!property) throw new Error('Property not found');

    // 재등록 전 중복 체크
    const isBooked = await isDateRangeBooked(id, property.checkInDate!, property.checkOutDate!);
    if (isBooked) {
      throw new Error('AlreadyBookedInPeriod');
    }

    await updateProperty(id, {
      status: 'active',
      deleted: false,
      deletedAt: undefined
    });
    
    console.log('[reRegisterProperty] Property re-registered:', id);
  } catch (error) {
    console.error('Error re-registering property:', error);
    throw error;
  }
}

/**
 * 예약 취소 시 병합 및 재등록 로직 처리 (Gaps Logic 대응)
 */
export async function handleCancellationRelist(propertyId: string, ownerId: string): Promise<{
  type: 'merged' | 'relisted' | 'limit_exceeded' | 'short_term';
  targetId?: string;
}> {
  return handleCancellationRelistLifecycle(propertyId, ownerId, {
    getProperty,
    readPropertiesArray,
    writePropertiesArray,
    getReservationsByOwner,
    toISODateString,
    isParentPropertyRecord,
    isDateOverlap,
    isDateRangeBooked,
    updateProperty,
  });
}

/**
 * 예약 확정/결제 시 가용 기간을 재계산하고 세그먼트를 분리 (Gaps Logic)
 */
export async function recalculateAndSplitProperty(propertyId: string, bookingId?: string): Promise<void> {
  const { getBooking } = await import('./bookings');
  return recalculateAndSplitPropertyLifecycle(propertyId, bookingId, {
    getProperty,
    getBooking,
    getAllBookings,
    readPropertiesArray,
    writePropertiesArray,
    readBookingsArray,
    writeBookingsArray,
    updateProperty,
    toISODateString,
  });
}

/**
 * 모든 매물 조회(서버 원천) — 비로그인도 공개 API로 마스킹 목록을 가져옵니다.
 */
export async function getAllProperties(): Promise<PropertyData[]> {
  try {
    if (typeof window === 'undefined') return [];
    await refreshPropertiesFromServer();

    const properties = readPropertiesArray();
    // 삭제/숨김 매물 제외
    const activeProperties = properties.filter((p) => !p.deleted && !p.hidden);

    return activeProperties.map((prop) => ({
      ...prop,
      checkInDate: prop.checkInDate,
      checkOutDate: prop.checkOutDate,
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting properties:', error);
    return [];
  }
}

/**
 * 예약 가능한 매물만 조회.
 * 비로그인은 공개 API가 이미 마스킹/노출 기준을 반영하므로 추가 LS 결합 없이 필터만 적용합니다.
 */
export async function getAvailableProperties(): Promise<PropertyData[]> {
  try {
    if (typeof window === 'undefined') return [];
    const allProps = await getAllProperties();
    return allProps.filter((p) => isParentPropertyRecord(p) && p.status === 'active');
  } catch (error) {
    console.error('Error getting available properties:', error);
    return [];
  }
}

export {
  clearPropertiesClientCache,
  ensurePropertiesLoadedForApp,
  readPropertiesArray,
  writePropertiesArray,
} from './propertiesStore';
export type { AdminInventoryFilter } from './propertiesHelpers';
export {
  ensurePropertiesCacheForAdmin,
  exportDeletedPropertiesToCSV,
  getAllPropertiesForAdmin,
  getDeletedPropertyLogs,
  getPropertyForAdmin,
  loadAdminInventoryPage,
  refreshPropertiesCacheForAdmin,
  type DeletedPropertyLog,
} from './propertiesAdmin';

/**
 * 실시간 매물 리스너 (서버 폴링 + 커스텀 이벤트)
 *
 * @param callback - 데이터 변경 시 호출되는 콜백 함수
 * @returns 구독 해제 함수
 */
export function subscribeToProperties(
  callback: (properties: PropertyData[]) => void
): () => void {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  // 초기 데이터 로드 (비로그인 포함 서버 기준)
  getAvailableProperties().then(callback);

  // 커스텀 이벤트 리스너 (같은 탭 변경 시 즉시 반영)
  const handlePropertiesUpdated = () => {
    console.log('[subscribeToProperties] propertiesUpdated event received, refreshing...');
    getAvailableProperties().then((data) => {
      console.log('[subscribeToProperties] Refreshed, available properties:', data.length);
      callback(data);
    });
  };

  window.addEventListener('propertiesUpdated', handlePropertiesUpdated);

  // 폴링 폴백
  const interval = setInterval(() => {
    getAvailableProperties().then(callback);
  }, 10000);

  return () => {
    window.removeEventListener('propertiesUpdated', handlePropertiesUpdated);
    clearInterval(interval);
  };
}

/**
 * 특정 매물에 대한 예약된 날짜 구간 조회 (상세페이지 가용 구간 계산용)
 *
 * @param propertyId - 매물 ID
 * @returns 예약된 구간 배열 (checkIn/checkOut은 Date)
 */
export async function getBookedRangesForProperty(
  propertyId: string
): Promise<PropertyDateRange[]> {
  const property = await getProperty(propertyId);
  if (!property || !property.ownerId) return [];

  const allReservations = await getReservationsByOwner(property.ownerId, 'all');
  await hydratePropertiesMemoryIfLoggedIn();
  const allProps = readPropertiesArray();
  const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const targetAddress = normalize(property.address);
  const targetTitle = normalize(property.title);
  const targetUnit = normalize(property.unitNumber);

  const related = allReservations.filter((r) => {
    if (r.status !== 'pending' && r.status !== 'confirmed') return false;
    if (r.propertyId === propertyId) return true;
    const reservedProp = allProps.find((p) => p.id === r.propertyId);
    if (!reservedProp) return false;
    const bookedAddress = normalize(reservedProp.address);
    const bookedTitle = normalize(reservedProp.title);
    const bookedUnit = normalize(reservedProp.unitNumber);
    return (
      (targetAddress && bookedAddress && targetAddress === bookedAddress) ||
      (targetTitle && bookedTitle && targetTitle === bookedTitle)
    ) && targetUnit === bookedUnit;
  });

  return related
    .map((r) => {
      const checkIn = parseDate(r.checkInDate);
      const checkOut = parseDate(r.checkOutDate);
      return checkIn && checkOut ? { checkIn, checkOut } : null;
    })
    .filter((r): r is PropertyDateRange => r != null);
}

/**
 * 자식 매물인 경우 부모 매물 ID 반환 (예약 상세에서 동일한 상세 페이지로 열기 위해)
 */
export async function getParentPropertyId(propertyId: string): Promise<string> {
  const property = await getProperty(propertyId);
  if (!property?.id || !String(property.id).startsWith('prop_child_') || !property.history?.length) {
    return propertyId;
  }
  const entry = property.history.find((h) => h.action === 'CHILD_CREATED_RENTED' && h.details?.includes('Created from parent '));
  if (!entry?.details) return propertyId;
  const match = entry.details.match(/Created from parent ([^\s]+) for/);
  return match?.[1] ?? propertyId;
}

/**
 * 단일 매물 조회 (삭제된 매물 포함)
 * 
 * @param id - 매물 ID
 * @returns 매물 데이터
 */
export async function getProperty(id: string): Promise<PropertyData | null> {
  try {
    if (typeof window === 'undefined' || !id) return null;
    /**
     * 4단계: 상세도 로컬 원천 대신 서버 API 사용.
     * - 비로그인: 마스킹된 공개 DTO
     * - 로그인: 액터 헤더로 소유/참여 범위의 원본 DTO
     */
    const res = await fetchWithRetry(
      `/api/app/properties/${encodeURIComponent(id)}`,
      withAppActor({ cache: 'no-store' }),
      { retries: 2, baseDelayMs: 300 }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { property?: PropertyData };
    return data?.property ?? null;
  } catch (error) {
    console.error('Error getting property:', error);
    return null;
  }
}

/**
 * 사용자가 등록한 매물 수 조회
 * 
 * @param ownerId - 임대인 사용자 ID
 * @returns 매물 수 (삭제되지 않은 매물만)
 */
export async function getPropertyCountByOwner(ownerId: string): Promise<number> {
  // PropertyData, PropertyDateRange를 가져와야 함
  try {
    const { properties, bookedDateRanges } = await getPropertiesByOwner(ownerId, false); // 삭제되지 않은 매물만 가져옴
    console.log('[getPropertyCountByOwner] properties:', properties);
    console.log('[getPropertyCountByOwner] bookedDateRanges:', bookedDateRanges);

    let count = 0;
    for (const property of properties) {
      if (!property.id || !isParentPropertyRecord(property)) continue;
      if (
        property.status === 'active' &&
        hasAvailableBookingPeriod(property, bookedDateRanges.get(property.id!) || [])
      ) {
        count++;
      }
    }
    console.log(`[getPropertyCountByOwner] Owner ${ownerId} has ${count} available properties.`);
    return count;
  } catch (error) {
    console.error('Error getting property count:', error);
    return 0; // 에러 발생 시 0 반환
  }
}

/**
 * 사용자가 등록한 매물 목록 조회
 * 
 * @param ownerId - 임대인 사용자 ID
 * @param includeDeleted - 삭제된 매물 포함 여부 (기본값: false)
 * @returns 매물 배열
 */
export async function getPropertiesByOwner(ownerId: string, includeDeleted: boolean = false): Promise<PropertiesByOwnerResult> {
  try {
    // 브라우저 환경 확인
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { properties: [], bookedDateRanges: new Map() };
    }

    await hydratePropertiesMemoryIfLoggedIn();
    const allProperties = readPropertiesArray();

    // 필터링: ownerId 일치 + deleted 상태에 따라
    let filtered = allProperties.filter((p) => {
      // ownerId가 일치하지 않으면 제외
      if (p.ownerId !== ownerId) return false;
      
      // deleted 필드가 undefined이면 false로 간주 (삭제되지 않음)
      const isDeleted = p.deleted === true;
      
      // includeDeleted가 false면 삭제된 매물 제외
      if (!includeDeleted && isDeleted) return false;
      
      // includeDeleted가 true면 삭제되지 않은 매물 제외
      if (includeDeleted && !isDeleted) return false;
      
      return true;
    });

    // 예약 분리 자식(prop_child_)은 호스트 '내 매물'에서 제외 — 부모만 관리
    filtered = filtered.filter((p) => isParentPropertyRecord(p));
    
    // 클라이언트 측에서 정렬 (updatedAt 우선, 없으면 createdAt 기준)
    filtered.sort((a, b) => {
      // updatedAt 기준으로 정렬 (재등록 시 최신순으로 정렬)
      const aUpdatedTime = toDate(a.updatedAt)?.getTime() || toDate(a.createdAt)?.getTime() || 0;
      const bUpdatedTime = toDate(b.updatedAt)?.getTime() || toDate(b.createdAt)?.getTime() || 0;
      return bUpdatedTime - aUpdatedTime; // 내림차순 (최신순)
    });
    
    // 예약 정보 가져오기 및 bookedDateRanges 생성 (Gaps Logic: 물리적 매물 기준 통합)
    const allReservations: ReservationData[] = await getReservationsByOwner(ownerId, 'all');
    const bookedDateRanges = new Map<string, PropertyDateRange[]>();

    filtered.forEach(property => {
      // 각 매물(부모)에 대해, 동일한 집과 관련된 모든 예약을 합산하여 Gap 계산에 반영
      const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const targetAddress = normalize(property.address);
      const targetTitle = normalize(property.title);
      const targetUnit = normalize(property.unitNumber);

      const relatedReservations = allReservations.filter(r => {
        if (r.status !== 'pending' && r.status !== 'confirmed') return false;
        const reservedProp = allProperties.find(p => p.id === r.propertyId);
        if (reservedProp) {
          const bookedAddress = normalize(reservedProp.address);
          const bookedTitle = normalize(reservedProp.title);
          const bookedUnit = normalize(reservedProp.unitNumber);

          return (
            (targetAddress !== '' && bookedAddress !== '' && targetAddress === bookedAddress) || 
            (targetTitle !== '' && bookedTitle !== '' && targetTitle === bookedTitle)
          ) && (targetUnit === bookedUnit);
        }
        return false;
      });

      const ranges: PropertyDateRange[] = [];
      relatedReservations.forEach(r => {
        const checkIn = parseDate(r.checkInDate);
        const checkOut = parseDate(r.checkOutDate);
        if (checkIn && checkOut) {
          ranges.push({ checkIn, checkOut });
        }
      });
      bookedDateRanges.set(property.id!, ranges);
    });

    return {
      properties: filtered,
      bookedDateRanges,
    };
  } catch (error) {
    console.error('Error getting properties by owner:', error);
    return { properties: [], bookedDateRanges: new Map() };
  }
}

/**
 * 새 매물 추가 (동일 매물 존재 시 병합)
 * 
 * @param property - 매물 데이터
 * @returns 생성된 또는 업데이트된 매물 ID
 */
export async function addProperty(
  property: Omit<PropertyData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // 브라우저 환경 확인
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return '';
    }
    
    const payload = { ...property }; // title = 매물명 (임차인 비공개)

    // 필수 필드 검증
    if (!payload.ownerId) {
      throw new Error('ownerId is required');
    }
    if (!property.coordinates || !property.coordinates.lat || !property.coordinates.lng) {
      throw new Error('coordinates are required');
    }

    await hydratePropertiesMemoryIfLoggedIn();
    let properties = readPropertiesArray();

    // 동일 매물 확인 (임대인 ID, 주소, 호수 일치 여부)
    // 요구사항: "동일 주소 + 호수" 기준 중복 등록 방지
    const normalize = (s?: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const existingIndex = properties.findIndex(
      (p) =>
        !p.deleted &&
        p.ownerId === payload.ownerId &&
        normalize(p.address) === normalize(payload.address) &&
        normalize(p.unitNumber) === normalize(payload.unitNumber)
    );

    const now = new Date();
    const nowISO = now.toISOString();
    
    if (existingIndex !== -1) {
      const existingProp = properties[existingIndex];
      
      // 1. 날짜 중복 체크 (Overlap Check)
      const newRange = {
        start: toISODateString(payload.checkInDate!),
        end: toISODateString(payload.checkOutDate!)
      };
      const existingRange = {
        start: toISODateString(existingProp.checkInDate!),
        end: toISODateString(existingProp.checkOutDate!)
      };

      if (isDateOverlap(newRange, existingRange)) {
        throw new Error('OverlapDetected'); // 중복 발생 시 에러 발생
      }

      // 1-1. 신규 추가하려는 기간이 이미 해당 매물의 '확정된 예약'과 겹치는지 체크
      const isBooked = await isDateRangeBooked(existingProp.id!, newRange.start, newRange.end);
      if (isBooked) {
        throw new Error('AlreadyBooked');
      }

      // 2. 병합 (Merge) - 최신 정보 우선 및 가용 기간 확장
      console.log('[addProperty] Existing property found, merging data...', existingProp.id);
      
      // 가용 기간 확장 (원본 기간과 새 기간을 모두 포함하도록)
      const mergedStart = newRange.start < existingRange.start ? newRange.start : existingRange.start;
      const mergedEnd = newRange.end > existingRange.end ? newRange.end : existingRange.end;

      const updatedProp: PropertyData = {
        ...existingProp, // 기존 정보 기반
        ...payload,      // 새 정보로 덮어쓰기 (최신화)
        id: existingProp.id,
        checkInDate: mergedStart,
        checkOutDate: mergedEnd,
        updatedAt: nowISO,
        status: 'active',
        deleted: false,
        history: [
          ...(existingProp.history || []),
          {
            action: 'MERGE_UPDATE',
            timestamp: nowISO,
            details: `Property range expanded: ${mergedStart} ~ ${mergedEnd} (Added: ${newRange.start} ~ ${newRange.end})`
          }
        ]
      };
      
      properties[existingIndex] = updatedProp;
      writePropertiesArray(properties);
      await syncPropertiesNow(properties);
      return existingProp.id!;
    }

    // 신규 등록 로직 (히스토리 추가)
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProperty: PropertyData = {
      ...payload,
      id,
      checkInDate: serializeDate(payload.checkInDate),
      checkOutDate: serializeDate(payload.checkOutDate),
      createdAt: serializeDate(now),
      updatedAt: serializeDate(now),
      status: payload.status || 'active',
      deleted: false,
      history: [{
        action: 'CREATE',
        timestamp: nowISO,
        details: 'Initial property registration'
      }]
    };

    console.log('[addProperty] New property object before saving:', newProperty);

    properties.push(newProperty);

    writePropertiesArray(properties);
    await syncPropertiesNow(properties);

    return id;
  } catch (error) {
    console.error('Error adding property:', error);
    throw error;
  }
}

/**
 * 매물 업데이트
 * 
 * @param id - 매물 ID
 * @param updates - 업데이트할 데이터
 */
export async function updateProperty(
  id: string,
  updates: Partial<PropertyData>
): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    await hydratePropertiesMemoryIfLoggedIn();
    const properties = readPropertiesArray();
    const index = properties.findIndex((p) => p.id === id);
    
    if (index === -1) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const now = new Date();
    
    // 날짜 처리: Date 객체를 ISO 문자열로 변환하여 저장
    let checkInDateValue = properties[index].checkInDate;
    if ('checkInDate' in updates) {
      if (updates.checkInDate === undefined || updates.checkInDate === null) {
        checkInDateValue = undefined;
      } else {
        checkInDateValue = serializeDate(updates.checkInDate);
      }
    }
    
    let checkOutDateValue = properties[index].checkOutDate;
    if ('checkOutDate' in updates) {
      if (updates.checkOutDate === undefined || updates.checkOutDate === null) {
        checkOutDateValue = undefined;
      } else {
        checkOutDateValue = serializeDate(updates.checkOutDate);
      }
    }
    
    // updates에서 날짜 필드를 제거 (별도로 처리했으므로)
    const { checkInDate: _, checkOutDate: __, ...otherUpdates } = updates;
    
    const updatedProperty: PropertyData = {
      ...properties[index],
      ...otherUpdates,
      id,
      checkInDate: checkInDateValue,
      checkOutDate: checkOutDateValue,
      updatedAt: serializeDate(now),
    };
    
    properties[index] = updatedProperty;
    writePropertiesArray(properties);
    await syncPropertiesNow(properties);

    console.log('[updateProperty] Property updated:', id, 'status:', updatedProperty.status);
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

/**
 * 매물 자동 광고종료 (임대 기간 7일 미만 남은 경우)
 * 
 * @param id - 매물 ID
 */
async function autoExpireProperty(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    await hydratePropertiesMemoryIfLoggedIn();
    const properties = readPropertiesArray();
    const index = properties.findIndex((p) => p.id === id);
    
    if (index === -1) return;
    
    // 이미 삭제된 매물이면 스킵
    if (properties[index].deleted) return;
    
    const now = new Date();
    properties[index] = {
      ...properties[index],
      deleted: true,
      deletedAt: serializeDate(now),
      status: 'inactive',
    };

    writePropertiesArray(properties);
    await syncPropertiesNow(properties);
    console.log('[autoExpireProperty] Property auto-expired:', id);
  } catch (error) {
    console.error('Error auto-expiring property:', error);
  }
}

/**
 * 매물 삭제 (Soft Delete)
 * 
 * @param id - 매물 ID
 */
export async function deleteProperty(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    await hydratePropertiesMemoryIfLoggedIn();
    const properties = readPropertiesArray();
    const index = properties.findIndex((p) => p.id === id);
    
    if (index === -1) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const now = new Date();
    properties[index] = {
      ...properties[index],
      deleted: true,
      deletedAt: serializeDate(now),
      status: 'inactive',
    };

    writePropertiesArray(properties);
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

/**
 * 호스트: 광고 종료(고객 노출 중단) — 데이터는 유지
 * 관리자 감사 로그에도 남김.
 */
export async function hostEndAdvertisingProperty(
  propertyId: string,
  ownerId: string,
  reason?: string
): Promise<void> {
  const property = await getProperty(propertyId);
  if (!property) throw new Error('PropertyNotFound');
  if (property.deleted) return;

  const nowISO = new Date().toISOString();
  const history = property.history || [];

  await updateProperty(propertyId, {
    status: 'INACTIVE_SHORT_TERM',
    hidden: false,
    history: [
      ...history,
      {
        action: 'HOST_MANUAL_END_AD',
        timestamp: nowISO,
        details: reason ? `Host ended: ${reason}` : 'Host ended advertisement',
      },
    ],
  });

  try {
    await fetchWithRetry(
      '/api/app/moderation-audit',
      withAppActor({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'property_ad_ended_by_host',
          targetType: 'property',
          targetId: propertyId,
          reason: reason ?? undefined,
        }),
      }),
      { retries: 1, baseDelayMs: 400 }
    );
  } catch {
    /* 감사 기록 실패는 광고종료 흐름을 막지 않음 */
  }
}

/**
 * 호스트: 광고종료 상태에서 삭제(소프트 삭제) — 관리자 감사 로그에도 남김.
 */
export async function hostDeletePropertySoft(
  propertyId: string,
  ownerId: string,
  reason?: string
): Promise<void> {
  const property = await getProperty(propertyId);
  if (!property) throw new Error('PropertyNotFound');
  if (property.deleted) return;

  await deleteProperty(propertyId);
  // 다른 화면 즉시 반영용
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('propertiesUpdated'));
    }
  } catch {
    // ignore
  }
}

/**
 * 삭제된 매물 복구
 * 
 * @param id - 매물 ID
 */
export async function restoreProperty(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    await hydratePropertiesMemoryIfLoggedIn();
    const properties = readPropertiesArray();
    const index = properties.findIndex((p) => p.id === id);
    
    if (index === -1) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    properties[index] = {
      ...properties[index],
      deleted: false,
      deletedAt: undefined,
      status: 'active',
    };

    writePropertiesArray(properties);
  } catch (error) {
    console.error('Error restoring property:', error);
    throw error;
  }
}

/**
 * 매물 영구 삭제 (완전 삭제 + 삭제 기록 저장)
 * 
 * @param id - 매물 ID
 * @param deletedBy - 삭제한 사용자 ID (선택)
 */
export async function permanentlyDeleteProperty(id: string, deletedBy?: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    await hydratePropertiesMemoryIfLoggedIn();
    const properties = readPropertiesArray();
    const propertyIndex = properties.findIndex((p) => p.id === id);
    
    if (propertyIndex === -1) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const deletedProperty = properties[propertyIndex];

    const logged = await postAppPropertyActionLog({
      propertyId: id,
      actionType: 'DELETED',
      snapshot: deletedProperty,
      ownerId: deletedProperty.ownerId,
      reason: deletedBy ? `deletedBy:${deletedBy}` : undefined,
    });
    if (!logged) {
      console.warn('[permanentlyDeleteProperty] server action log failed; continuing delete');
    }
    
    const filtered = properties.filter((p) => p.id !== id);
    writePropertiesArray(filtered);
    void fetch(
      `/api/app/properties/${encodeURIComponent(id)}`,
      withAppActor({ method: 'DELETE' })
    ).catch(() => {});
  } catch (error) {
    console.error('Error permanently deleting property:', error);
    throw error;
  }
}
