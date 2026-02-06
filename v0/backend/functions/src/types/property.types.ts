/**
 * 부동산 관련 타입 정의
 * Property Types
 */

import { VietnamAddress } from './address.types';

/**
 * 부동산 유형
 */
export enum PropertyType {
  APARTMENT = 'apartment', // Căn hộ / Chung cư
  TOWNHOUSE = 'townhouse', // Nhà phố
  VILLA = 'villa', // Biệt thự
  SHOPHOUSE = 'shophouse', // Nhà mặt tiền
  LAND = 'land', // Đất
  OFFICE = 'office', // Văn phòng
  WAREHOUSE = 'warehouse', // Kho bãi
}

/**
 * 거래 유형
 */
export enum TransactionType {
  RENT = 'rent', // Cho thuê (임대)
  SALE = 'sale', // Bán (매매)
  BOTH = 'both', // Cả hai (둘 다)
}

/**
 * 가구 옵션 (Nội thất)
 */
export enum FurnitureOption {
  FULLY_FURNISHED = 'fully_furnished', // Đầy đủ nội thất
  PARTIALLY_FURNISHED = 'partially_furnished', // Một phần nội thất
  UNFURNISHED = 'unfurnished', // Không nội thất
}

/**
 * 방향 (Hướng)
 */
export enum Direction {
  EAST = 'east', // Đông
  WEST = 'west', // Tây
  SOUTH = 'south', // Nam
  NORTH = 'north', // Bắc
  SOUTHEAST = 'southeast', // Đông Nam
  SOUTHWEST = 'southwest', // Tây Nam
  NORTHEAST = 'northeast', // Đông Bắc
  NORTHWEST = 'northwest', // Tây Bắc
}

/**
 * 베트남 부동산 특화 옵션
 */
export interface VietnamPropertyOptions {
  // 오토바이 주차
  motorcycleParking: boolean; // Bãi đậu xe máy
  
  // 핑크북 (소유권 증서)
  pinkBook: boolean; // Sổ hồng
  pinkBookStatus?: 'available' | 'pending' | 'not_available'; // 핑크북 상태
  
  // 가구 옵션
  furniture: FurnitureOption; // Nội thất
  
  // 추가 베트남 특화 옵션
  balcony?: boolean; // Ban công
  security?: boolean; // Bảo vệ / An ninh
  elevator?: boolean; // Thang máy
  swimmingPool?: boolean; // Hồ bơi
  gym?: boolean; // Phòng gym
  parking?: boolean; // Bãi đỗ xe (자동차)
  
  // 관리비 관련
  managementFeeIncluded?: boolean; // Miễn phí quản lý
  managementFee?: number; // Phí quản lý
  
  // 보증금 관련
  depositRequired?: boolean; // Cần đặt cọc
  depositAmount?: number; // Tiền cọc
}

/**
 * 부동산 기본 정보
 */
export interface Property {
  id: string;
  
  // 기본 정보
  type: PropertyType;
  transactionType: TransactionType;
  title: string; // 제목
  description: string; // 설명
  
  // 주소
  address: VietnamAddress;
  
  // 가격 정보
  price: number; // Giá thuê / Giá bán
  priceUnit: 'vnd' | 'usd'; // 통화 단위
  pricePerSquareMeter?: number; // m²당 가격
  
  // 면적
  area: number; // Diện tích (m²)
  usableArea?: number; // Diện tích sử dụng
  landArea?: number; // Diện tích đất (토지 면적)
  
  // 방 정보
  bedrooms?: number; // Phòng ngủ (PN)
  bathrooms?: number; // Phòng tắm
  livingRooms?: number; // Phòng khách
  kitchens?: number; // Phòng bếp
  
  // 층수
  floor?: number; // Tầng
  totalFloors?: number; // Tổng số tầng
  
  // 방향
  direction?: Direction;
  
  // 베트남 특화 옵션
  vietnamOptions: VietnamPropertyOptions;
  
  // 이미지
  images: string[]; // URL 목록
  
  // 연락처
  contactPhone?: string;
  contactEmail?: string;
  contactName?: string;
  
  // 상태
  status: 'active' | 'pending' | 'sold' | 'rented' | 'inactive';
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // 사용자 ID
  views?: number; // 조회수
}

/**
 * 부동산 생성 요청 (베트남어 입력 가능)
 */
export interface CreatePropertyRequest {
  // 베트남어로 입력 가능한 필드들
  vietnameseInput?: string; // 자유 텍스트 입력 (AI가 추출)
  
  // 또는 구조화된 입력
  type?: PropertyType;
  transactionType?: TransactionType;
  title?: string;
  description?: string;
  address?: Partial<VietnamAddress>;
  price?: number;
  priceUnit?: 'vnd' | 'usd';
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  vietnamOptions?: Partial<VietnamPropertyOptions>;
  images?: string[];
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * 부동산 검색 필터
 */
export interface PropertySearchFilter {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  type?: PropertyType[];
  transactionType?: TransactionType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  furniture?: FurnitureOption;
  pinkBook?: boolean;
  motorcycleParking?: boolean;
  direction?: Direction;
}
