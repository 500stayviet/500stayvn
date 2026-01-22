/**
 * Properties API Service (LocalStorage 버전)
 * 
 * 브라우저 LocalStorage에 매물 데이터를 저장하고 관리하는 서비스
 * Firebase가 정지된 상태에서 UI/로직 테스트를 위한 임시 구현
 */

/**
 * LocalStorage 매물 데이터 구조
 */
export interface PropertyData {
  id?: string; // 매물 ID
  title: string; // 베트남어 제목
  original_description: string; // 베트남어 원문 설명
  translated_description: string; // 번역된 설명 (한국어)
  price: number; // 가격 (1주일 임대료)
  priceUnit: 'vnd' | 'usd'; // 통화 단위
  area: number; // 면적 (m²)
  bedrooms?: number; // 침실 수
  bathrooms?: number; // 욕실 수
  coordinates: {
    lat: number; // 위도
    lng: number; // 경도
  };
  address?: string; // 주소 문자열
  unitNumber?: string; // 동호수 (예약 완료 후 임차인에게만 표시)
  images?: string[]; // 이미지 URL 배열 (최대 5장)
  amenities?: string[]; // 편의시설 배열 (침대, 에어컨, 소파, 주방, 세탁기, 냉장고, 식탁, 옷장, 와이파이)
  maxAdults?: number; // 최대 성인 수
  maxChildren?: number; // 최대 어린이 수
  ownerId?: string; // 임대인 사용자 ID
  checkInDate?: string | Date; // 임대 희망 시작일 (ISO 문자열 또는 Date 객체)
  checkOutDate?: string | Date; // 임대 희대 희망 종료일 (ISO 문자열 또는 Date 객체)
  checkInTime?: string; // 체크인 가능 시간 (예: "14:00")
  checkOutTime?: string; // 체크아웃 시간 (예: "12:00")
  createdAt?: any; // 생성 시간 (Date 또는 Timestamp-like 객체)
  updatedAt?: any; // 수정 시간 (Date 또는 Timestamp-like 객체)
  status?: 'active' | 'pending' | 'sold' | 'rented' | 'inactive' | 'INACTIVE_SHORT_TERM' | 'closed'; // 상태
  deleted?: boolean; // 삭제 여부
  deletedAt?: string; // 삭제 시간 (ISO 문자열)
  history?: {
    action: string;
    timestamp: string;
    details: string;
  }[]; // 변경 이력
}

/**
 * 사용자의 동적 광고 한도 조회 (유료화 대비)
 */
export async function getUserAdLimit(userId: string): Promise<number> {
  // TODO: 나중에 DB의 user_settings 또는 plan_type에 따라 다른 한도 반환
  // const userData = await getUserData(userId);
  // return userData.plan === 'premium' ? 20 : 5;
  return 5; // 현재 기본 한도는 5개
}

/**
 * 현재 광고 중인 매물 개수 실시간 조회 (status: 'active'만 카운트)
 */
export async function getActiveAdCount(userId: string): Promise<number> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;
  const properties = JSON.parse(stored) as PropertyData[];
  
  return properties.filter(p => 
    !p.deleted && 
    p.ownerId === userId && 
    p.status === 'active'
  ).length;
}

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

import { getReservationsByOwner, ReservationData } from './reservations';
import { parseDate, toISODateString } from '@/lib/utils/dateUtils';
import { isDateRangeBooked, getAllBookings } from './bookings';

/**
 * LocalStorage 키
 */
const STORAGE_KEY = 'properties';
const DELETED_PROPERTIES_LOG_KEY = 'deleted_properties_log';
const CANCELLED_PROPERTIES_LOG_KEY = 'cancelled_properties_log';

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
  try {
    const stored = localStorage.getItem(CANCELLED_PROPERTIES_LOG_KEY);
    const logs = stored ? JSON.parse(stored) : [];
    const newLog: CancelledPropertyLog = {
      ...log,
      id: `can_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      cancelledAt: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem(CANCELLED_PROPERTIES_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error logging cancelled property:', error);
  }
}

/**
 * 매물 재등록 (Expired -> Active)
 */
export async function reRegisterProperty(id: string): Promise<void> {
  try {
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
  const property = await getProperty(propertyId);
  if (!property) throw new Error('PropertyNotFound');

  const { toISODateString } = await import('./bookings');
  const stored = localStorage.getItem(STORAGE_KEY);
  let allProperties: PropertyData[] = stored ? JSON.parse(stored) : [];

  // [Gaps Logic] 자식 매물(rented) 취소 시: 자식 레코드만 삭제하면 부모의 Gap이 자동으로 회복됨
  if (propertyId.includes('_child_')) {
    console.log('[handleCancellationRelist] Child property cancelled, deleting child record:', propertyId);
    const finalProperties = allProperties.filter(p => p.id !== propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProperties));
    window.dispatchEvent(new CustomEvent('propertiesUpdated'));
    return { type: 'merged' }; // 부모에게 자동으로 가용 기간이 돌아가므로 '병합'과 유사함
  }

  // 2. 부모/독립 매물 취소 처리: 병합 대상 확인 (기존 로직 유지)
  const mergeTargetIndex = allProperties.findIndex(p => 
    !p.deleted && 
    p.id !== propertyId &&
    p.ownerId === ownerId &&
    p.status === 'active' &&
    (p.address === property.address || p.title === property.title) &&
    p.unitNumber === property.unitNumber
  );

  if (mergeTargetIndex !== -1) {
    const target = allProperties[mergeTargetIndex];
    const range1 = { start: toISODateString(property.checkInDate!), end: toISODateString(property.checkOutDate!) };
    const range2 = { start: toISODateString(target.checkInDate!), end: toISODateString(target.checkOutDate!) };

    if (!isDateOverlap(range1, range2)) {
      const isBooked = await isDateRangeBooked(propertyId, range1.start, range1.end);
      
      if (!isBooked) {
        // 2-1. 최신 정보 우선 정책 (Rule 4)
        const propUpdateDate = new Date(property.updatedAt || property.createdAt).getTime();
        const targetUpdateDate = new Date(target.updatedAt || target.createdAt).getTime();

        if (propUpdateDate > targetUpdateDate) {
          target.price = property.price;
          target.amenities = property.amenities;
          target.images = property.images;
          target.title = property.title;
          target.updatedAt = property.updatedAt;
        }

        // 2-2. 기간 병합
        const newStart = range1.start < range2.start ? range1.start : range2.start;
        const newEnd = range1.end > range2.end ? range1.end : range2.end;
        target.checkInDate = newStart;
        target.checkOutDate = newEnd;

        target.history = [
          ...(target.history || []),
          {
            action: 'MERGE_FROM_CANCELLED',
            timestamp: new Date().toISOString(),
            details: `Merged with cancelled property. New range: ${newStart}~${newEnd}`
          }
        ];

        const finalProperties = allProperties.filter(p => p.id !== propertyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProperties));
        window.dispatchEvent(new CustomEvent('propertiesUpdated'));
        return { type: 'merged', targetId: target.id };
      }
    }
  }

  // 3. 병합 불가 시 단독 재등록 검토
  const { getReservationsByOwner } = await import('./reservations');
  const { hasAvailableBookingPeriod } = await import('@/lib/utils/propertyUtils');
  const reservations = await getReservationsByOwner(ownerId, 'all');
  
  const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const targetAddress = normalize(property.address);
  const targetTitle = normalize(property.title);
  const targetUnit = normalize(property.unitNumber);

  const bookedRanges = reservations
    .filter(r => {
      if (r.status !== 'pending' && r.status !== 'confirmed') return false;
      
      // 직접 ID 매칭 또는 물리적 매칭
      if (r.propertyId === propertyId) return true;
      
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
    })
    .map(r => ({ checkIn: new Date(toISODateString(r.checkInDate)), checkOut: new Date(toISODateString(r.checkOutDate)) }));

  if (!hasAvailableBookingPeriod(property, bookedRanges)) {
    await updateProperty(propertyId, { 
      status: 'closed',
      history: [...(property.history || []), { action: 'AUTO_CLOSE_SHORT', timestamp: new Date().toISOString(), details: 'Available period < 7 days' }]
    });
    return { type: 'short_term' };
  }

  const [activeCount, adLimit] = await Promise.all([
    getActiveAdCount(ownerId),
    getUserAdLimit(ownerId)
  ]);

  if (activeCount >= adLimit) {
    await updateProperty(propertyId, { 
      status: 'closed',
      history: [...(property.history || []), { action: 'AUTO_CLOSE_LIMIT', timestamp: new Date().toISOString(), details: `Ad limit exceeded (${adLimit})` }]
    });
    return { type: 'limit_exceeded' };
  }

  await updateProperty(propertyId, { status: 'active' });
  return { type: 'relisted' };
}

/**
 * 예약 확정/결제 시 가용 기간을 재계산하고 세그먼트를 분리 (Gaps Logic)
 */
export async function recalculateAndSplitProperty(propertyId: string): Promise<void> {
  const property = await getProperty(propertyId);
  if (!property || property.deleted) return;
  if (propertyId.includes('_child_')) return;

  const bookedStart = toISODateString(booking.checkInDate);
  const bookedEnd = toISODateString(booking.checkOutDate);

  // 자식 매물(rented) 생성
  const childId = `prop_child_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const { id: _, history: __, status: ___, checkInDate: ____, checkOutDate: _____, ...baseData } = property;
  
  const childProp: PropertyData = {
    ...baseData,
    id: childId,
    checkInDate: bookedStart,
    checkOutDate: bookedEnd,
    status: 'rented',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [{
      action: 'CHILD_CREATED_RENTED',
      timestamp: new Date().toISOString(),
      details: `Created from parent ${propertyId} for period ${bookedStart}~${bookedEnd}`
    }]
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const allProps: PropertyData[] = stored ? JSON.parse(stored) : [];
  allProps.push(childProp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProps));

  // 참조 업데이트
  const bookingsStored = localStorage.getItem('bookings');
  if (bookingsStored) {
    const bookings = JSON.parse(bookingsStored);
    const bIndex = bookings.findIndex((b: any) => b.id === booking.id);
    if (bIndex !== -1) {
      bookings[bIndex].propertyId = childId;
      localStorage.setItem('bookings', JSON.stringify(bookings));
    }
  }

  const resStored = localStorage.getItem('reservations');
  if (resStored) {
    const reservations = JSON.parse(resStored);
    const rIndex = reservations.findIndex((r: any) => 
      r.propertyId === propertyId && 
      toISODateString(r.checkInDate) === bookedStart && 
      toISODateString(r.checkOutDate) === bookedEnd
    );
    if (rIndex !== -1) {
      reservations[rIndex].propertyId = childId;
      localStorage.setItem('reservations', JSON.stringify(reservations));
    }
  }

  await updateProperty(propertyId, {
    history: [
      ...(property.history || []),
      {
        action: 'PARENT_PARTIAL_RENTED',
        timestamp: new Date().toISOString(),
        details: `Partially rented (${bookedStart}~${bookedEnd}). Child: ${childId}`
      }
    ]
  });

  window.dispatchEvent(new CustomEvent('propertiesUpdated'));
}

/**
 * Date를 ISO 문자열로 변환 (저장용)
 */
function toISOString(date: any): string | null {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof date === 'string') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

/**
 * ISO 문자열을 Date로 변환
 */
function fromISOString(iso: string | null): Date | null {
  if (!iso) return null;
  return new Date(iso);
}

/**
 * 날짜를 ISO 문자열로 변환 (저장용)
 */
function serializeDate(date: any): string | undefined {
  return toISOString(date) || undefined;
}

/**
 * ISO 문자열을 Date 객체로 변환 (로드용)
 */
function deserializeDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const date = fromISOString(iso);
  if (!date || isNaN(date.getTime())) return undefined;
  return date;
}

/**
 * Date 변환 헬퍼 함수 (ISO 문자열 또는 Date 객체를 Date로 변환)
 */
function toDate(dateInput: string | Date | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * 모든 매물 조회
 * 
 * @returns 매물 배열
 */
export async function getAllProperties(): Promise<PropertyData[]> {
  try {
    // 브라우저 환경 확인
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { properties: [], bookedDateRanges: new Map() };
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { properties: [], bookedDateRanges: new Map() };
    }
    
    const properties = JSON.parse(stored) as PropertyData[];
    
    // 삭제된 매물 제외
    const activeProperties = properties.filter((p) => !p.deleted);
    
    // 날짜는 ISO 문자열 그대로 반환 (필요시 컴포넌트에서 Date로 변환)
    return activeProperties.map((prop) => ({
      ...prop,
      // LocalStorage에는 ISO 문자열로 저장되어 있으므로 그대로 반환
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
 * 예약 가능한 매물만 조회 (Gaps Logic 적용)
 */
export async function getAvailableProperties(): Promise<PropertyData[]> {
  try {
    const allStored = localStorage.getItem(STORAGE_KEY);
    const allProps: PropertyData[] = allStored ? JSON.parse(allStored) : [];
    const { hasAvailableBookingPeriod } = await import('@/lib/utils/propertyUtils');
    const { getReservationsByOwner } = await import('./reservations');
    
    const availableProperties: PropertyData[] = [];
    
    // 1. 광고 후보(부모 매물) 필터링: 자식(_child_)은 제외
    const candidateProps = allProps.filter(p => 
      !p.deleted && !p.id?.includes('_child_') && (p.status === 'active' || p.status === 'INACTIVE_SHORT_TERM')
    );

    for (const property of candidateProps) {
      // 2. 해당 집(주소+호수)과 관련된 모든 예약(자식들의 예약 포함) 합산
      // 'all'을 사용하여 모든 예약 상태를 가져온 뒤 나중에 pending/confirmed만 필터링
      const reservations = await getReservationsByOwner(property.ownerId!, 'all');
      
      const normalize = (s: string | undefined) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const targetAddress = normalize(property.address);
      const targetTitle = normalize(property.title);
      const targetUnit = normalize(property.unitNumber);

      const bookedRanges: PropertyDateRange[] = reservations
        .filter(r => {
          if (r.status !== 'pending' && r.status !== 'confirmed') return false;
          
          // r.propertyId가 현재 property.id이거나, 동일한 물리적 주소/동호수를 가진 매물인 경우
          const targetProp = allProps.find(p => p.id === r.propertyId);
          if (targetProp) {
            const bookedAddress = normalize(targetProp.address);
            const bookedTitle = normalize(targetProp.title);
            const bookedUnit = normalize(targetProp.unitNumber);

            return (
              (targetAddress !== '' && bookedAddress !== '' && targetAddress === bookedAddress) || 
              (targetTitle !== '' && bookedTitle !== '' && targetTitle === bookedTitle)
            ) && (targetUnit === bookedUnit);
          }
          return false;
        })
        .map(r => ({ checkIn: parseDate(r.checkInDate)!, checkOut: parseDate(r.checkOutDate)! }));
      
      // 3. 7일 이상 연속 Gap이 있는지 확인
      if (hasAvailableBookingPeriod(property, bookedRanges)) {
        if (property.status !== 'active') {
          await updateProperty(property.id!, { 
            status: 'active',
            history: [...(property.history || []), { action: 'AUTO_RESUME_GAP', timestamp: new Date().toISOString(), details: 'Resumed: Gap >= 7d' }]
          });
        }
        availableProperties.push(property);
      } else {
        if (property.status !== 'INACTIVE_SHORT_TERM') {
          await updateProperty(property.id!, { 
            status: 'INACTIVE_SHORT_TERM',
            history: [...(property.history || []), { action: 'AUTO_SUSPEND_GAP', timestamp: new Date().toISOString(), details: 'Suspended: Gap < 7d' }]
          });
        }
      }
    }
    return availableProperties;
  } catch (error) {
    console.error('Error getting available properties:', error);
    return [];
  }
}

/**
 * 실시간 매물 리스너 (LocalStorage 버전)
 * 
 * @param callback - 데이터 변경 시 호출되는 콜백 함수
 * @returns 구독 해제 함수
 */
export function subscribeToProperties(
  callback: (properties: PropertyData[]) => void
): () => void {
  // 브라우저 환경 확인
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    callback([]);
    return () => {};
  }
  
  // 초기 데이터 로드 (예약 가능한 매물만)
  getAvailableProperties().then(callback);
  
  // storage 이벤트 리스너 등록 (다른 탭에서 변경 시)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      getAvailableProperties().then(callback);
    }
  };
  
  // 커스텀 이벤트 리스너 (같은 탭에서 매물 업데이트 시 즉시 반영)
  const handlePropertiesUpdated = () => {
    console.log('[subscribeToProperties] propertiesUpdated event received, refreshing...');
    getAvailableProperties().then((data) => {
      console.log('[subscribeToProperties] Refreshed, available properties:', data.length);
      callback(data);
    });
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('propertiesUpdated', handlePropertiesUpdated);
  
  // 주기적으로 확인 - 10초로 늘림 (커스텀 이벤트로 즉시 반영되므로)
  const interval = setInterval(() => {
    getAvailableProperties().then(callback);
  }, 10000);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('propertiesUpdated', handlePropertiesUpdated);
    clearInterval(interval);
  };
}

/**
 * 단일 매물 조회 (삭제된 매물 포함)
 * 
 * @param id - 매물 ID
 * @returns 매물 데이터
 */
export async function getProperty(id: string): Promise<PropertyData | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const properties = JSON.parse(stored) as PropertyData[];
    const property = properties.find((p) => p.id === id);
    
    if (!property) return null;
    
    // 날짜는 ISO 문자열 그대로 반환
    return {
      ...property,
      checkInDate: property.checkInDate,
      checkOutDate: property.checkOutDate,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
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
  const { hasAvailableBookingPeriod, isAdvertisingProperty } = await import('@/lib/utils/propertyUtils');
  try {
    const { properties, bookedDateRanges } = await getPropertiesByOwner(ownerId, false); // 삭제되지 않은 매물만 가져옴
    console.log('[getPropertyCountByOwner] properties:', properties);
    console.log('[getPropertyCountByOwner] bookedDateRanges:', bookedDateRanges);

    let count = 0;
    for (const property of properties) {
      // 매물이 광고 가능한 상태이고, 7일 이상 예약 가능 기간이 남아있는 경우에만 카운트
      // hasAvailableBookingPeriod는 PropertyData와 PropertyDateRange[]를 인자로 받음
      if (
        isAdvertisingProperty(property) &&
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
    
    // LocalStorage에서 직접 조회 (삭제된 매물 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { properties: [], bookedDateRanges: new Map() };
    }
    
    let allProperties: PropertyData[] = [];
    try {
      allProperties = JSON.parse(stored) as PropertyData[];
      if (!Array.isArray(allProperties)) {
        console.error('Invalid properties data format in localStorage');
        return { properties: [], bookedDateRanges: new Map() };
      }
    } catch (parseError) {
      console.error('Error parsing properties from localStorage:', parseError);
      return [];
    }
    
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
    
    // 클라이언트 측에서 정렬 (createdAt이 있는 경우)
    filtered.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = toDate(a.createdAt)?.getTime() || 0;
      const bTime = toDate(b.createdAt)?.getTime() || 0;
      return bTime - aTime; // 내림차순 (최신순)
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
      throw new Error('localStorage is not available');
    }
    
    // 필수 필드 검증
    if (!property.ownerId) {
      throw new Error('ownerId is required');
    }
    if (!property.title || property.title.trim() === '') {
      throw new Error('title is required');
    }
    if (!property.coordinates || !property.coordinates.lat || !property.coordinates.lng) {
      throw new Error('coordinates are required');
    }
    
    // LocalStorage에서 직접 가져오기 (삭제된 것 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    let properties: PropertyData[] = [];
    
    if (stored) {
      try {
        properties = JSON.parse(stored) as PropertyData[];
        if (!Array.isArray(properties)) {
          properties = [];
        }
      } catch (parseError) {
        console.error('Error parsing stored properties:', parseError);
        properties = [];
      }
    }
    
    // 동일 매물 확인 (임대인 ID, 주소, 호수 일치 여부)
    const existingIndex = properties.findIndex(p => 
      !p.deleted && 
      p.ownerId === property.ownerId && 
      (p.address === property.address || p.title === property.title) && 
      p.unitNumber === property.unitNumber
    );

    const now = new Date();
    const nowISO = now.toISOString();
    
    if (existingIndex !== -1) {
      const existingProp = properties[existingIndex];
      
      // 1. 날짜 중복 체크 (Overlap Check)
      const newRange = {
        start: toISODateString(property.checkInDate!),
        end: toISODateString(property.checkOutDate!)
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
        ...property,     // 새 정보로 덮어쓰기 (최신화)
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
      window.dispatchEvent(new CustomEvent('propertiesUpdated'));
      return existingProp.id!;
    }

    // 신규 등록 로직 (히스토리 추가)
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProperty: PropertyData = {
      ...property,
      id,
      checkInDate: serializeDate(property.checkInDate),
      checkOutDate: serializeDate(property.checkOutDate),
      createdAt: serializeDate(now),
      updatedAt: serializeDate(now),
      status: property.status || 'active',
      deleted: false,
      history: [{
        action: 'CREATE',
        timestamp: nowISO,
        details: 'Initial property registration'
      }]
    };

    console.log('[addProperty] New property object before saving:', newProperty);

    properties.push(newProperty);
    
    // LocalStorage에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    
    // 커스텀 이벤트 발생시켜 즉시 반영
    window.dispatchEvent(new CustomEvent('propertiesUpdated'));
    
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
    // LocalStorage에서 직접 조회 (삭제된 매물 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const properties = JSON.parse(stored) as PropertyData[];
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    
    console.log('[updateProperty] Property updated:', id, 'status:', updatedProperty.status);
    
    // 커스텀 이벤트 발생시켜 즉시 반영
    window.dispatchEvent(new CustomEvent('propertiesUpdated'));
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const properties = JSON.parse(stored) as PropertyData[];
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    console.log('[autoExpireProperty] Property auto-expired:', id);
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('propertiesUpdated'));
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
    // LocalStorage에서 직접 조회 (삭제된 매물 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const properties = JSON.parse(stored) as PropertyData[];
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

/**
 * 삭제된 매물 복구
 * 
 * @param id - 매물 ID
 */
export async function restoreProperty(id: string): Promise<void> {
  try {
    // LocalStorage에서 직접 조회 (삭제된 매물 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const properties = JSON.parse(stored) as PropertyData[];
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (error) {
    console.error('Error restoring property:', error);
    throw error;
  }
}

/**
 * 삭제 기록 인터페이스
 */
export interface DeletedPropertyLog {
  id: string;
  property: PropertyData;
  deletedAt: string; // 영구 삭제 시간 (ISO 문자열)
  deletedBy?: string; // 삭제한 사용자 ID
}

/**
 * 매물 영구 삭제 (완전 삭제 + 삭제 기록 저장)
 * 
 * @param id - 매물 ID
 * @param deletedBy - 삭제한 사용자 ID (선택)
 */
export async function permanentlyDeleteProperty(id: string, deletedBy?: string): Promise<void> {
  try {
    // LocalStorage에서 직접 조회 (삭제된 매물 포함)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    const properties = JSON.parse(stored) as PropertyData[];
    const propertyIndex = properties.findIndex((p) => p.id === id);
    
    if (propertyIndex === -1) {
      throw new Error(`Property with id ${id} not found`);
    }
    
    // 삭제할 매물 정보 저장
    const deletedProperty = properties[propertyIndex];
    
    // 삭제 기록에 추가
    const logStored = localStorage.getItem(DELETED_PROPERTIES_LOG_KEY);
    const deletedLogs: DeletedPropertyLog[] = logStored ? JSON.parse(logStored) : [];
    
    const deletedLog: DeletedPropertyLog = {
      id: `log_${Date.now()}_${id}`,
      property: deletedProperty,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy,
    };
    
    deletedLogs.push(deletedLog);
    localStorage.setItem(DELETED_PROPERTIES_LOG_KEY, JSON.stringify(deletedLogs));
    
    // 매물 목록에서 제거
    const filtered = properties.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error permanently deleting property:', error);
    throw error;
  }
}

/**
 * 삭제된 매물 기록 조회 (관리자용)
 * 
 * @returns 삭제된 매물 기록 배열
 */
export async function getDeletedPropertyLogs(): Promise<DeletedPropertyLog[]> {
  try {
    const logStored = localStorage.getItem(DELETED_PROPERTIES_LOG_KEY);
    if (!logStored) return [];
    
    const deletedLogs = JSON.parse(logStored) as DeletedPropertyLog[];
    // 최신순으로 정렬
    return deletedLogs.sort((a, b) => 
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting deleted property logs:', error);
    return [];
  }
}

/**
 * 삭제된 매물 기록을 CSV로 변환 (엑셀 다운로드용)
 * 
 * @returns CSV 문자열
 */
export async function exportDeletedPropertiesToCSV(): Promise<string> {
  try {
    const logs = await getDeletedPropertyLogs();
    
    if (logs.length === 0) {
      return 'No deleted properties found.';
    }
    
    // CSV 헤더
    const headers = [
      'ID',
      'Title',
      'Address',
      'Price (VND)',
      'Area (m²)',
      'Bedrooms',
      'Bathrooms',
      'Owner ID',
      'Deleted At',
      'Deleted By',
      'Status',
      'Created At',
    ];
    
    // CSV 데이터 행
    const rows = logs.map((log) => {
      const prop = log.property;
      return [
        prop.id || '',
        prop.title || '',
        prop.address || '',
        prop.price?.toString() || '',
        prop.area?.toString() || '',
        prop.bedrooms?.toString() || '',
        prop.bathrooms?.toString() || '',
        prop.ownerId || '',
        log.deletedAt,
        log.deletedBy || '',
        prop.status || '',
        prop.createdAt ? (typeof prop.createdAt === 'string' ? prop.createdAt : new Date(prop.createdAt).toISOString()) : '',
      ];
    });
    
    // CSV 생성 (BOM 추가로 한글 깨짐 방지)
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting deleted properties to CSV:', error);
    throw error;
  }
}
