/**
 * 베트남 주소 체계 타입 정의
 * Vietnam Address System Types
 */

/**
 * 베트남 행정 구역 레벨
 */
export enum AdministrativeLevel {
  PROVINCE = 'province', // Tỉnh/Thành phố (성/시)
  DISTRICT = 'district', // Quận/Huyện (군/현)
  WARD = 'ward', // Phường/Xã (동/읍)
}

/**
 * Province (성/시) - 63개
 */
export interface Province {
  code: string; // 행정 코드
  name: string; // 베트남어 이름
  nameEn: string; // 영어 이름
  type: 'province' | 'city'; // Tỉnh (성) 또는 Thành phố (시)
  districts?: District[]; // 하위 District 목록
}

/**
 * District (군/현)
 */
export interface District {
  code: string; // 행정 코드
  name: string; // 베트남어 이름
  nameEn: string; // 영어 이름
  type: 'urban' | 'rural'; // Quận (도시군) 또는 Huyện (농촌현)
  provinceCode: string; // 상위 Province 코드
  wards?: Ward[]; // 하위 Ward 목록
}

/**
 * Ward (동/읍)
 */
export interface Ward {
  code: string; // 행정 코드
  name: string; // 베트남어 이름
  nameEn: string; // 영어 이름
  type: 'urban' | 'rural'; // Phường (도시동) 또는 Xã (농촌읍)
  districtCode: string; // 상위 District 코드
  provinceCode: string; // 상위 Province 코드
}

/**
 * 완전한 주소 정보
 */
export interface VietnamAddress {
  province: Province;
  district: District;
  ward: Ward;
  street?: string; // Đường (도로명)
  houseNumber?: string; // Số nhà (집 번호)
  fullAddress?: string; // 전체 주소 문자열
  // 편의를 위한 코드 필드 (province.code, district.code와 동일)
  provinceCode?: string; // Province 코드 (province.code와 동일)
  districtCode?: string; // District 코드 (district.code와 동일)
  wardCode?: string; // Ward 코드 (ward.code와 동일)
}

/**
 * 주소 선택 옵션
 */
export interface AddressSelection {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  street?: string;
  houseNumber?: string;
}

/**
 * 주소 검색 결과
 */
export interface AddressSearchResult {
  provinces: Province[];
  districts?: District[];
  wards?: Ward[];
}
