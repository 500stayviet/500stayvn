/**
 * 베트남 63개 성/시 주소 상수
 * Vietnam 63 Provinces and Cities Constants
 */

import { Province, District, Ward } from '../types/address.types';

/**
 * 베트남 주요 성/시 목록 (63개 전체)
 * 주요 도시 위주로 먼저 구현, 나머지는 확장 가능
 */
export const VIETNAM_PROVINCES: Province[] = [
  // 직할시 (5개)
  {
    code: '01',
    name: 'Thành phố Hà Nội',
    nameEn: 'Hanoi City',
    type: 'city',
  },
  {
    code: '79',
    name: 'Thành phố Hồ Chí Minh',
    nameEn: 'Ho Chi Minh City',
    type: 'city',
  },
  {
    code: '48',
    name: 'Thành phố Đà Nẵng',
    nameEn: 'Da Nang City',
    type: 'city',
  },
  {
    code: '92',
    name: 'Thành phố Cần Thơ',
    nameEn: 'Can Tho City',
    type: 'city',
  },
  {
    code: '31',
    name: 'Thành phố Hải Phòng',
    nameEn: 'Hai Phong City',
    type: 'city',
  },
  
  // 주요 성 (Tỉnh) - 주요 부동산 시장 위주
  {
    code: '75',
    name: 'Tỉnh Đồng Nai',
    nameEn: 'Dong Nai Province',
    type: 'province',
  },
  {
    code: '74',
    name: 'Tỉnh Bình Dương',
    nameEn: 'Binh Duong Province',
    type: 'province',
  },
  {
    code: '77',
    name: 'Tỉnh Bà Rịa - Vũng Tàu',
    nameEn: 'Ba Ria - Vung Tau Province',
    type: 'province',
  },
  {
    code: '72',
    name: 'Tỉnh Tây Ninh',
    nameEn: 'Tay Ninh Province',
    type: 'province',
  },
  {
    code: '73',
    name: 'Tỉnh Bình Phước',
    nameEn: 'Binh Phuoc Province',
    type: 'province',
  },
  {
    code: '76',
    name: 'Tỉnh Long An',
    nameEn: 'Long An Province',
    type: 'province',
  },
  {
    code: '80',
    name: 'Tỉnh Tiền Giang',
    nameEn: 'Tien Giang Province',
    type: 'province',
  },
  {
    code: '82',
    name: 'Tỉnh Bến Tre',
    nameEn: 'Ben Tre Province',
    type: 'province',
  },
  {
    code: '83',
    name: 'Tỉnh Trà Vinh',
    nameEn: 'Tra Vinh Province',
    type: 'province',
  },
  {
    code: '84',
    name: 'Tỉnh Vĩnh Long',
    nameEn: 'Vinh Long Province',
    type: 'province',
  },
  {
    code: '86',
    name: 'Tỉnh Đồng Tháp',
    nameEn: 'Dong Thap Province',
    type: 'province',
  },
  {
    code: '87',
    name: 'Tỉnh An Giang',
    nameEn: 'An Giang Province',
    type: 'province',
  },
  {
    code: '89',
    name: 'Tỉnh Kiên Giang',
    nameEn: 'Kien Giang Province',
    type: 'province',
  },
  {
    code: '91',
    name: 'Tỉnh Cà Mau',
    nameEn: 'Ca Mau Province',
    type: 'province',
  },
  {
    code: '58',
    name: 'Tỉnh Khánh Hòa',
    nameEn: 'Khanh Hoa Province',
    type: 'province',
  },
  {
    code: '56',
    name: 'Tỉnh Bình Thuận',
    nameEn: 'Binh Thuan Province',
    type: 'province',
  },
  {
    code: '36',
    name: 'Tỉnh Thái Nguyên',
    nameEn: 'Thai Nguyen Province',
    type: 'province',
  },
  {
    code: '35',
    name: 'Tỉnh Hà Nam',
    nameEn: 'Ha Nam Province',
    type: 'province',
  },
  {
    code: '34',
    name: 'Tỉnh Hải Dương',
    nameEn: 'Hai Duong Province',
    type: 'province',
  },
  {
    code: '33',
    name: 'Tỉnh Hưng Yên',
    nameEn: 'Hung Yen Province',
    type: 'province',
  },
  {
    code: '30',
    name: 'Tỉnh Hải Dương',
    nameEn: 'Hai Duong Province',
    type: 'province',
  },
  {
    code: '96',
    name: 'Tỉnh Bạc Liêu',
    nameEn: 'Bac Lieu Province',
    type: 'province',
  },
  {
    code: '95',
    name: 'Tỉnh Cà Mau',
    nameEn: 'Ca Mau Province',
    type: 'province',
  },
  {
    code: '94',
    name: 'Tỉnh Sóc Trăng',
    nameEn: 'Soc Trang Province',
    type: 'province',
  },
  {
    code: '93',
    name: 'Tỉnh Hậu Giang',
    nameEn: 'Hau Giang Province',
    type: 'province',
  },
  {
    code: '17',
    name: 'Tỉnh Hoà Bình',
    nameEn: 'Hoa Binh Province',
    type: 'province',
  },
  {
    code: '19',
    name: 'Tỉnh Thái Bình',
    nameEn: 'Thai Binh Province',
    type: 'province',
  },
  {
    code: '20',
    name: 'Tỉnh Lạng Sơn',
    nameEn: 'Lang Son Province',
    type: 'province',
  },
  {
    code: '22',
    name: 'Tỉnh Quảng Ninh',
    nameEn: 'Quang Ninh Province',
    type: 'province',
  },
  {
    code: '25',
    name: 'Tỉnh Bắc Giang',
    nameEn: 'Bac Giang Province',
    type: 'province',
  },
  {
    code: '26',
    name: 'Tỉnh Phú Thọ',
    nameEn: 'Phu Tho Province',
    type: 'province',
  },
  {
    code: '27',
    name: 'Tỉnh Vĩnh Phúc',
    nameEn: 'Vinh Phuc Province',
    type: 'province',
  },
  {
    code: '10',
    name: 'Tỉnh Lào Cai',
    nameEn: 'Lao Cai Province',
    type: 'province',
  },
  {
    code: '11',
    name: 'Tỉnh Điện Biên',
    nameEn: 'Dien Bien Province',
    type: 'province',
  },
  {
    code: '12',
    name: 'Tỉnh Lai Châu',
    nameEn: 'Lai Chau Province',
    type: 'province',
  },
  {
    code: '14',
    name: 'Tỉnh Sơn La',
    nameEn: 'Son La Province',
    type: 'province',
  },
  {
    code: '15',
    name: 'Tỉnh Yên Bái',
    nameEn: 'Yen Bai Province',
    type: 'province',
  },
  {
    code: '08',
    name: 'Tỉnh Tuyên Quang',
    nameEn: 'Tuyen Quang Province',
    type: 'province',
  },
  {
    code: '06',
    name: 'Tỉnh Bắc Kạn',
    nameEn: 'Bac Kan Province',
    type: 'province',
  },
  {
    code: '04',
    name: 'Tỉnh Cao Bằng',
    nameEn: 'Cao Bang Province',
    type: 'province',
  },
  {
    code: '02',
    name: 'Tỉnh Hà Giang',
    nameEn: 'Ha Giang Province',
    type: 'province',
  },
  {
    code: '24',
    name: 'Tỉnh Bắc Ninh',
    nameEn: 'Bac Ninh Province',
    type: 'province',
  },
  {
    code: '18',
    name: 'Tỉnh Ninh Bình',
    nameEn: 'Ninh Binh Province',
    type: 'province',
  },
  {
    code: '40',
    name: 'Tỉnh Nghệ An',
    nameEn: 'Nghe An Province',
    type: 'province',
  },
  {
    code: '42',
    name: 'Tỉnh Hà Tĩnh',
    nameEn: 'Ha Tinh Province',
    type: 'province',
  },
  {
    code: '44',
    name: 'Tỉnh Quảng Bình',
    nameEn: 'Quang Binh Province',
    type: 'province',
  },
  {
    code: '45',
    name: 'Tỉnh Quảng Trị',
    nameEn: 'Quang Tri Province',
    type: 'province',
  },
  {
    code: '46',
    name: 'Tỉnh Thừa Thiên Huế',
    nameEn: 'Thua Thien Hue Province',
    type: 'province',
  },
  {
    code: '49',
    name: 'Tỉnh Quảng Nam',
    nameEn: 'Quang Nam Province',
    type: 'province',
  },
  {
    code: '51',
    name: 'Tỉnh Quảng Ngãi',
    nameEn: 'Quang Ngai Province',
    type: 'province',
  },
  {
    code: '52',
    name: 'Tỉnh Bình Định',
    nameEn: 'Binh Dinh Province',
    type: 'province',
  },
  {
    code: '54',
    name: 'Tỉnh Phú Yên',
    nameEn: 'Phu Yen Province',
    type: 'province',
  },
  {
    code: '60',
    name: 'Tỉnh Ninh Thuận',
    nameEn: 'Ninh Thuan Province',
    type: 'province',
  },
  {
    code: '62',
    name: 'Tỉnh Kon Tum',
    nameEn: 'Kon Tum Province',
    type: 'province',
  },
  {
    code: '64',
    name: 'Tỉnh Gia Lai',
    nameEn: 'Gia Lai Province',
    type: 'province',
  },
  {
    code: '66',
    name: 'Tỉnh Đắk Lắk',
    nameEn: 'Dak Lak Province',
    type: 'province',
  },
  {
    code: '67',
    name: 'Tỉnh Đắk Nông',
    nameEn: 'Dak Nong Province',
    type: 'province',
  },
  {
    code: '68',
    name: 'Tỉnh Lâm Đồng',
    nameEn: 'Lam Dong Province',
    type: 'province',
  },
  {
    code: '70',
    name: 'Tỉnh Bình Phước',
    nameEn: 'Binh Phuoc Province',
    type: 'province',
  },
  {
    code: '71',
    name: 'Tỉnh Tây Ninh',
    nameEn: 'Tay Ninh Province',
    type: 'province',
  },
];

/**
 * 호치민시 주요 구 (Quận)
 */
export const HCMC_DISTRICTS: District[] = [
  { code: '760', name: 'Quận 1', nameEn: 'District 1', type: 'urban', provinceCode: '79' },
  { code: '761', name: 'Quận 2', nameEn: 'District 2', type: 'urban', provinceCode: '79' },
  { code: '762', name: 'Quận 3', nameEn: 'District 3', type: 'urban', provinceCode: '79' },
  { code: '763', name: 'Quận 4', nameEn: 'District 4', type: 'urban', provinceCode: '79' },
  { code: '764', name: 'Quận 5', nameEn: 'District 5', type: 'urban', provinceCode: '79' },
  { code: '765', name: 'Quận 6', nameEn: 'District 6', type: 'urban', provinceCode: '79' },
  { code: '766', name: 'Quận 7', nameEn: 'District 7', type: 'urban', provinceCode: '79' },
  { code: '767', name: 'Quận 8', nameEn: 'District 8', type: 'urban', provinceCode: '79' },
  { code: '768', name: 'Quận 9', nameEn: 'District 9', type: 'urban', provinceCode: '79' },
  { code: '769', name: 'Quận 10', nameEn: 'District 10', type: 'urban', provinceCode: '79' },
  { code: '770', name: 'Quận 11', nameEn: 'District 11', type: 'urban', provinceCode: '79' },
  { code: '771', name: 'Quận 12', nameEn: 'District 12', type: 'urban', provinceCode: '79' },
  { code: '772', name: 'Quận Bình Thạnh', nameEn: 'Binh Thanh District', type: 'urban', provinceCode: '79' },
  { code: '773', name: 'Quận Tân Bình', nameEn: 'Tan Binh District', type: 'urban', provinceCode: '79' },
  { code: '774', name: 'Quận Tân Phú', nameEn: 'Tan Phu District', type: 'urban', provinceCode: '79' },
  { code: '775', name: 'Quận Phú Nhuận', nameEn: 'Phu Nhuan District', type: 'urban', provinceCode: '79' },
  { code: '776', name: 'Quận Gò Vấp', nameEn: 'Go Vap District', type: 'urban', provinceCode: '79' },
  { code: '777', name: 'Quận Bình Tân', nameEn: 'Binh Tan District', type: 'urban', provinceCode: '79' },
  { code: '778', name: 'Quận Thủ Đức', nameEn: 'Thu Duc District', type: 'urban', provinceCode: '79' },
];

/**
 * Province 코드로 Province 찾기
 */
export function getProvinceByCode(code: string): Province | undefined {
  return VIETNAM_PROVINCES.find(p => p.code === code);
}

/**
 * District 코드로 District 찾기
 */
export function getDistrictByCode(code: string, provinceCode?: string): District | undefined {
  if (provinceCode) {
    return HCMC_DISTRICTS.find(d => d.code === code && d.provinceCode === provinceCode);
  }
  return HCMC_DISTRICTS.find(d => d.code === code);
}

/**
 * Province 코드로 Districts 찾기
 */
export function getDistrictsByProvince(provinceCode: string): District[] {
  return HCMC_DISTRICTS.filter(d => d.provinceCode === provinceCode);
}
