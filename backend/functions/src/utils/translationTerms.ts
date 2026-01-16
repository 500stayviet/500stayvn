/**
 * 부동산 전용 용어 사전
 * Real Estate Translation Terms Dictionary
 */

export interface TranslationTerm {
  vi: string; // Vietnamese
  ko: string; // Korean
  en?: string; // English (optional)
}

/**
 * 베트남어 -> 한국어 부동산 용어 사전
 */
export const REAL_ESTATE_TERMS: TranslationTerm[] = [
  // 방/침실 관련
  { vi: '2PN', ko: '2베드룸', en: '2 Bedrooms' },
  { vi: 'Phòng ngủ', ko: '침실', en: 'Bedroom' },
  { vi: 'Phòng khách', ko: '거실', en: 'Living Room' },
  { vi: 'Phòng bếp', ko: '주방', en: 'Kitchen' },
  { vi: 'Phòng tắm', ko: '욕실', en: 'Bathroom' },
  
  // 지역/구 관련
  { vi: 'Quận 7', ko: '7구', en: 'District 7' },
  { vi: 'Quận 1', ko: '1구', en: 'District 1' },
  { vi: 'Quận 2', ko: '2구', en: 'District 2' },
  { vi: 'Quận 3', ko: '3구', en: 'District 3' },
  { vi: 'Quận 4', ko: '4구', en: 'District 4' },
  { vi: 'Quận 5', ko: '5구', en: 'District 5' },
  
  // 아파트/주거 관련
  { vi: 'Căn hộ', ko: '아파트', en: 'Apartment' },
  { vi: 'Chung cư', ko: '아파트', en: 'Condominium' },
  { vi: 'Nhà phố', ko: '타운하우스', en: 'Townhouse' },
  { vi: 'Biệt thự', ko: '빌라', en: 'Villa' },
  
  // 비용 관련
  { vi: 'Miễn phí quản lý', ko: '관리비 포함', en: 'Management fee included' },
  { vi: 'Phí quản lý', ko: '관리비', en: 'Management fee' },
  { vi: 'Không cần đặt cọc', ko: '보증금 없음', en: 'No deposit required' },
  { vi: 'Đặt cọc', ko: '보증금', en: 'Deposit' },
  { vi: 'Tiền cọc', ko: '보증금', en: 'Deposit' },
  { vi: 'Tiền thuê', ko: '임대료', en: 'Rent' },
  { vi: 'Giá thuê', ko: '임대 가격', en: 'Rental price' },
  
  // 시설/편의시설 관련
  { vi: 'Hồ bơi', ko: '수영장', en: 'Swimming pool' },
  { vi: 'Phòng gym', ko: '헬스장', en: 'Gym' },
  { vi: 'Bãi đỗ xe', ko: '주차장', en: 'Parking' },
  { vi: 'Thang máy', ko: '엘리베이터', en: 'Elevator' },
  { vi: 'Bảo vệ', ko: '경비', en: 'Security' },
  { vi: 'An ninh', ko: '보안', en: 'Security' },
  
  // 상태/조건 관련
  { vi: 'Mới', ko: '신규', en: 'New' },
  { vi: 'Đã sử dụng', ko: '중고', en: 'Used' },
  { vi: 'Nội thất', ko: '인테리어', en: 'Furnished' },
  { vi: 'Không nội thất', ko: '인테리어 없음', en: 'Unfurnished' },
  { vi: 'Đầy đủ tiện nghi', ko: '완비된 편의시설', en: 'Fully equipped' },
  
  // 방향/위치 관련
  { vi: 'Hướng Đông', ko: '동향', en: 'East facing' },
  { vi: 'Hướng Tây', ko: '서향', en: 'West facing' },
  { vi: 'Hướng Nam', ko: '남향', en: 'South facing' },
  { vi: 'Hướng Bắc', ko: '북향', en: 'North facing' },
  { vi: 'Gần trung tâm', ko: '중심가 근처', en: 'Near city center' },
  
  // 면적 관련
  { vi: 'm²', ko: '㎡', en: 'sqm' },
  { vi: 'Diện tích', ko: '면적', en: 'Area' },
];

/**
 * 베트남어 용어를 한국어로 변환
 */
export function translateRealEstateTerm(viTerm: string): string | null {
  const term = REAL_ESTATE_TERMS.find(t => 
    t.vi.toLowerCase() === viTerm.toLowerCase() ||
    viTerm.toLowerCase().includes(t.vi.toLowerCase())
  );
  return term ? term.ko : null;
}

/**
 * 텍스트에서 부동산 용어를 찾아서 한국어로 변환
 */
export function applyRealEstateTerms(text: string, targetLanguage: 'ko' | 'en' = 'ko'): string {
  let translatedText = text;
  
  // 우선순위가 높은 긴 용어부터 매칭
  const sortedTerms = [...REAL_ESTATE_TERMS].sort((a, b) => b.vi.length - a.vi.length);
  
  for (const term of sortedTerms) {
    const regex = new RegExp(term.vi, 'gi');
    const replacement = targetLanguage === 'ko' ? term.ko : (term.en || term.ko);
    translatedText = translatedText.replace(regex, replacement);
  }
  
  return translatedText;
}

/**
 * Gemini API에 전달할 부동산 용어 사전 프롬프트 생성
 */
export function getRealEstateTermsPrompt(): string {
  const termsList = REAL_ESTATE_TERMS.map(term => 
    `- "${term.vi}" → "${term.ko}"${term.en ? ` (${term.en})` : ''}`
  ).join('\n');
  
  return `다음 부동산 용어 사전을 반드시 사용하여 번역하세요:\n\n${termsList}\n\n중요: 위 용어들은 정확히 표시된 한국어로 번역해야 합니다.`;
}
