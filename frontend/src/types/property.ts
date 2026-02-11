/**
 * 부동산 매물 타입 정의
 */

export interface PropertyData {
  id?: string; // 매물 ID
  title: string; // 매물명. 임차인 비공개, 나중에 공개 가능
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

  /** 외부 캘린더(iCal) 연동 */
  icalPlatform?: string; // 플랫폼 (airbnb, agoda, booking_com, other)
  icalCalendarName?: string; // 캘린더 이름
  icalUrl?: string; // iCal URL (.ics)

  /** 매물 종류: studio | one_room | two_room | three_plus | detached */
  propertyType?: string;
  /** 주당 청소 횟수 (1~7) */
  cleaningPerWeek?: number;
  /** 애완동물 가능 여부 */
  petAllowed?: boolean;
  /** 애완동물 추가 요금 (VND, 마리당) */
  petFee?: number;
  /** 애완동물 최대 마리수 */
  maxPets?: number;
  
  /** 도시 ID (베트남 도시) */
  cityId?: string;
  /** 구 ID (베트남 구) */
  districtId?: string;
}

export interface PropertyFilter {
  provinceCode?: string;
  districtCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  transactionType?: 'rent' | 'sale' | 'both';
}
