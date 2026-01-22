/**
 * Bookings API Service (LocalStorage 버전)
 * 
 * 예약 데이터를 관리하는 서비스
 */

import { toISODateString } from '../utils/dateUtils';

export { toISODateString };

/**
 * 예약 데이터 구조
 */
export interface BookingData {
  id?: string;
  propertyId: string; // 매물 ID
  propertyTitle?: string; // 매물 제목 (캐싱용)
  propertyAddress?: string; // 매물 주소 (캐싱용)
  propertyImage?: string; // 매물 대표 이미지 (캐싱용)
  
  // 예약자 정보
  guestId: string; // 예약자 사용자 ID
  guestName: string; // 예약자 이름
  guestEmail?: string; // 예약자 이메일
  guestPhone: string; // 예약자 전화번호
  guestMessage?: string; // 예약자 메시지/요청사항
  
  // 임대인 정보
  ownerId: string; // 임대인 사용자 ID
  ownerName?: string; // 임대인 이름
  
  // 예약 날짜
  checkInDate: string; // 체크인 날짜 (ISO 문자열)
  checkOutDate: string; // 체크아웃 날짜 (ISO 문자열)
  checkInTime?: string; // 체크인 시간 (예: "14:00")
  checkOutTime?: string; // 체크아웃 시간 (예: "12:00")
  
  // 인원
  adults: number; // 성인 수
  children: number; // 어린이 수
  
  // 가격
  totalPrice: number; // 총 가격
  priceUnit: 'vnd' | 'usd'; // 통화 단위
  nights: number; // 숙박 일수
  
  // 결제 정보
  paymentMethod?: 'momo' | 'zalopay' | 'bank_transfer' | 'pay_at_property'; // 결제 수단
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; // 결제 상태
  paymentDate?: string; // 결제 완료 시간 (ISO 문자열)
  
  // 예약 상태
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // 예약 상태
  
  // 채팅방 ID
  chatRoomId?: string;
  
  // 시간 정보
  createdAt?: string; // 생성 시간 (ISO 문자열)
  updatedAt?: string; // 수정 시간 (ISO 문자열)
  confirmedAt?: string; // 확정 시간 (ISO 문자열)
  cancelledAt?: string; // 취소 시간 (ISO 문자열)
  cancelReason?: string; // 취소 사유
}

/**
 * 예약 생성 요청 데이터
 */
export interface CreateBookingRequest {
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  guestMessage?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
}

/**
 * LocalStorage 키
 */
const BOOKINGS_STORAGE_KEY = 'bookings';

/**
 * UUID 생성
 */
function generateId(): string {
  return 'booking_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 모든 예약 가져오기
 */
export async function getAllBookings(): Promise<BookingData[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
  },
  guestId: string
): Promise<BookingData> {
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
  
  // 총 가격 계산 (주 단위 가격 * 주 수)
  const weeks = Math.ceil(nights / 7);
  const totalPrice = propertyData.price * weeks;
  
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
    
    totalPrice,
    priceUnit: propertyData.priceUnit,
    nights,
    
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
  
  // 3. Reservations API와 동기화 (Rule 1: 가용 기간 계산에 반영되도록)
  try {
    const { createReservation } = await import('./reservations');
    await createReservation({
      propertyId: newBooking.propertyId,
      tenantId: guestId,
      ownerId: newBooking.ownerId,
      status: 'pending',
      checkInDate: newBooking.checkInDate,
      checkOutDate: newBooking.checkOutDate,
      tenantName: newBooking.guestName,
      tenantEmail: newBooking.guestEmail,
      tenantPhone: newBooking.guestPhone,
      notes: newBooking.guestMessage
    });
  } catch (error) {
    console.error('Reservation sync failed:', error);
  }

  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  
  return newBooking;
}

/**
 * 결제 완료 처리
 */
export async function completePayment(
  bookingId: string,
  paymentMethod: BookingData['paymentMethod']
): Promise<BookingData | null> {
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
  
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  return bookings[index];
}

/**
 * 예약 확정 처리
 */
export async function confirmBooking(bookingId: string): Promise<BookingData | null> {
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

  // Reservations API와 동기화
  try {
    const { getAllReservations, updateReservationStatus } = await import('./reservations');
    const allRes = await getAllReservations();
    const res = allRes.find(r => r.propertyId === booking.propertyId && r.tenantId === booking.guestId && r.checkInDate === booking.checkInDate);
    if (res && res.id) {
      await updateReservationStatus(res.id, 'confirmed');
    }
  } catch (error) {
    console.error('Reservation confirm sync failed:', error);
  }
  
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  return bookings[index];
}

/**
 * 예약 취소 처리
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ booking: BookingData | null; relistResult?: any }> {
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

  // Reservations API와 동기화 (Rule: 매물 복구 로직이 정확한 가용 기간을 계산할 수 있도록 먼저 수행)
  try {
    const { getAllReservations, updateReservationStatus } = await import('./reservations');
    const allRes = await getAllReservations();
    const res = allRes.find(r => r.propertyId === booking.propertyId && r.tenantId === booking.guestId && r.checkInDate === booking.checkInDate);
    if (res && res.id) {
      await updateReservationStatus(res.id, 'cancelled');
    }
  } catch (error) {
    console.error('Reservation cancel sync failed:', error);
  }

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
  
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  return { booking: bookings[index], relistResult };
}

/**
 * 예약 데이터 영구 삭제
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const data = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!data) return;
    
    const bookings = JSON.parse(data) as BookingData[];
    const filtered = bookings.filter(b => b.id !== bookingId);
    
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('예약 삭제 실패:', error);
    throw error;
  }
}

/**
 * 채팅방 ID 설정
 */
export async function setChatRoomId(
  bookingId: string,
  chatRoomId: string
): Promise<BookingData | null> {
  const bookings = await getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) return null;
  
  bookings[index] = {
    ...bookings[index],
    chatRoomId,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  return bookings[index];
}
