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
import { toISODateString } from '@/lib/utils/dateUtils';
import {
  isDateRangeBooked,
  getAllBookings,
  readBookingsArray,
  writeBookingsArray,
} from './bookings';
import { isParentPropertyRecord } from '@/lib/utils/propertyUtils';
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
  ensurePropertiesLoadedForApp,
  getPropertySyncErrorMessage,
  hydratePropertiesMemoryIfLoggedIn,
  readPropertiesArray,
  refreshPropertiesFromServer,
  writePropertiesArray,
} from './propertiesStore';
import {
  handleCancellationRelistLifecycle,
  recalculateAndSplitPropertyLifecycle,
} from './propertiesLifecycle';
import { putAppPropertyById } from './appPropertyApiClient';
import { parseAppPropertyDetailPayload } from './appPropertyApiParse';
import {
  addPropertyMutation,
  deletePropertyMutation,
  hostDeletePropertySoftMutation,
  hostEndAdvertisingPropertyMutation,
  permanentlyDeletePropertyMutation,
  restorePropertyMutation,
  updatePropertyMutation,
} from './propertiesMutations';
import {
  bootstrapPropertiesFromServerRuntime,
  logCancelledPropertyRuntime,
  reRegisterPropertyRuntime,
  syncPropertiesNowRuntime,
  type CancelledPropertyLog,
} from './propertiesRuntime';
import {
  buildBookedRangesForParentListingQuery,
  getBookedRangesForPropertyQuery,
  getPropertiesByOwnerQuery,
  getPropertyCountByOwnerQuery,
  isDateOverlapQuery,
  type PropertiesByOwnerResult,
  type PropertyDateRange,
} from './propertiesQueries';

/**
 * 날짜 중복 체크 (엄격한 ISO 날짜 기준)
 */
export function isDateOverlap(range1: {start: Date | string, end: Date | string}, range2: {start: Date | string, end: Date | string}): boolean {
  return isDateOverlapQuery(range1, range2);
}

async function syncPropertiesNow(snapshot: PropertyData[]): Promise<void> {
  return syncPropertiesNowRuntime(snapshot, {
    fetchWithRetry,
    withAppActor,
    emitUserFacingSyncError,
    getPropertySyncErrorMessage,
  });
}

/** 부모 매물 + 동일 주소·호실 예약 구간 (pending/confirmed) — getAvailableProperties / 호스트·관리자 동기 기준 */
export function buildBookedRangesForParentListing(
  property: PropertyData,
  allProps: PropertyData[],
  reservations: ReservationData[]
): PropertyDateRange[] {
  return buildBookedRangesForParentListingQuery(property, allProps, reservations);
}

/**
 * 비즈니스 원천은 서버 DB(`/api/app/properties`) — LS는 UI 편의 전용으로만 사용합니다.
 */
/** 앱 로그인 직후: 폴백 off 면 LS 없이 서버만, readwrite 면 1회 import 후 서버와 맞춤 */
export async function bootstrapPropertiesFromServer(): Promise<void> {
  return bootstrapPropertiesFromServerRuntime({
    ensurePropertiesLoadedForApp,
    markLedgerBootstrapDone,
  });
}

/**
 * 취소된 매물 기록 저장
 */
export async function logCancelledProperty(log: Omit<CancelledPropertyLog, 'id' | 'cancelledAt'>): Promise<void> {
  return logCancelledPropertyRuntime(log, { postAppPropertyActionLog });
}

/**
 * 매물 재등록 (Expired -> Active)
 */
export async function reRegisterProperty(id: string): Promise<void> {
  try {
    await reRegisterPropertyRuntime(id, {
      getProperty,
      isDateRangeBooked,
      updateProperty,
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
export type {
  PropertiesByOwnerResult,
  PropertyDateRange,
} from './propertiesQueries';
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
  return getBookedRangesForPropertyQuery(propertyId, {
    getProperty,
    hydratePropertiesMemoryIfLoggedIn,
    readPropertiesArray,
    getReservationsByOwner,
  });
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
    return parseAppPropertyDetailPayload(await res.json());
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
  try {
    return await getPropertyCountByOwnerQuery(ownerId, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      getReservationsByOwner,
      toDate,
    });
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
    return await getPropertiesByOwnerQuery(ownerId, includeDeleted, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      getReservationsByOwner,
      toDate,
    });
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
    return addPropertyMutation(property, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      writePropertiesArray,
      syncPropertiesNow,
      serializeDate,
      toISODateString,
      isDateOverlap,
      isDateRangeBooked,
      getProperty,
      updateProperty,
      fetchWithRetry,
      withAppActor,
      postAppPropertyActionLog,
    });
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
    await updatePropertyMutation(id, updates, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      writePropertiesArray,
      putAppPropertyById,
      serializeDate,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

/**
 * 매물 삭제 (Soft Delete)
 * 
 * @param id - 매물 ID
 */
export async function deleteProperty(id: string): Promise<void> {
  try {
    await deletePropertyMutation(id, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      writePropertiesArray,
      serializeDate,
    });
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
  void ownerId;
  return hostEndAdvertisingPropertyMutation(propertyId, reason, {
    getProperty,
    updateProperty,
    fetchWithRetry,
    withAppActor,
  });
}

/**
 * 호스트: 광고종료 상태에서 삭제(소프트 삭제) — 관리자 감사 로그에도 남김.
 */
export async function hostDeletePropertySoft(
  propertyId: string,
  ownerId: string,
  reason?: string
): Promise<void> {
  void ownerId;
  void reason;
  return hostDeletePropertySoftMutation(propertyId, {
    getProperty,
    deleteProperty,
  });
}

/**
 * 삭제된 매물 복구
 * 
 * @param id - 매물 ID
 */
export async function restoreProperty(id: string): Promise<void> {
  try {
    await restorePropertyMutation(id, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      writePropertiesArray,
    });
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
    await permanentlyDeletePropertyMutation(id, deletedBy, {
      hydratePropertiesMemoryIfLoggedIn,
      readPropertiesArray,
      writePropertiesArray,
      postAppPropertyActionLog,
      withAppActor,
    });
  } catch (error) {
    console.error('Error permanently deleting property:', error);
    throw error;
  }
}
