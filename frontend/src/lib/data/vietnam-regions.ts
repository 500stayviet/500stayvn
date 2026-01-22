/**
 * 베트남 행정 구역 기준 데이터 (0순위)
 * 
 * 이 데이터는 변하지 않는 행정 구역 정보로, 검색 시 API 결과보다 우선합니다.
 * center: [경도(lng), 위도(lat)] 순서 (GeoJSON 표준)
 */

// 검색 결과 타입
export type RegionType = 'city' | 'district';

export interface VietnamRegion {
  id: string;
  name: string;           // 영어 이름
  nameVi: string;         // 베트남어 이름
  nameKo: string;         // 한국어 이름
  keywords: string[];     // 검색 키워드 (다양한 변형)
  center: [number, number]; // [경도, 위도]
  type: RegionType;
  parentCity?: string;    // 구/군의 경우 상위 도시 ID
  zoom: number;           // 선택 시 줌 레벨
}

// ============================================================================
// 베트남 주요 도시 (City) - 직할시 및 주요 관광도시
// ============================================================================
export const VIETNAM_CITIES: VietnamRegion[] = [
  // 5대 직할시
  {
    id: 'hanoi',
    name: 'Ha Noi',
    nameVi: 'Hà Nội',
    nameKo: '하노이',
    keywords: ['hanoi', 'ha noi', 'hn', 'hà nội', '하노이'],
    center: [105.8542, 21.0285],
    type: 'city',
    zoom: 12,
  },
  {
    id: 'hcmc',
    name: 'Ho Chi Minh City',
    nameVi: 'TP. Hồ Chí Minh',
    nameKo: '호치민',
    keywords: ['ho chi minh', 'hcm', 'hcmc', 'saigon', 'sài gòn', 'tp hcm', 'tphcm', '호치민', '사이공'],
    center: [106.7009, 10.7769],
    type: 'city',
    zoom: 12,
  },
  {
    id: 'danang',
    name: 'Da Nang',
    nameVi: 'Đà Nẵng',
    nameKo: '다낭',
    keywords: ['da nang', 'danang', 'đà nẵng', '다낭'],
    center: [108.2022, 16.0544],
    type: 'city',
    zoom: 12,
  },
  {
    id: 'haiphong',
    name: 'Hai Phong',
    nameVi: 'Hải Phòng',
    nameKo: '하이퐁',
    keywords: ['hai phong', 'haiphong', 'hải phòng', '하이퐁'],
    center: [106.6881, 20.8449],
    type: 'city',
    zoom: 12,
  },
  {
    id: 'cantho',
    name: 'Can Tho',
    nameVi: 'Cần Thơ',
    nameKo: '껀터',
    keywords: ['can tho', 'cantho', 'cần thơ', '껀터'],
    center: [105.7882, 10.0371],
    type: 'city',
    zoom: 12,
  },
  // 주요 관광도시
  {
    id: 'nhatrang',
    name: 'Nha Trang',
    nameVi: 'Nha Trang',
    nameKo: '나짱',
    keywords: ['nha trang', 'nhatrang', '나짱', '냐짱'],
    center: [109.1943, 12.2451],
    type: 'city',
    zoom: 13,
  },
  {
    id: 'vungtau',
    name: 'Vung Tau',
    nameVi: 'Vũng Tàu',
    nameKo: '붕따우',
    keywords: ['vung tau', 'vungtau', 'vũng tàu', '붕따우', '봉타우'],
    center: [107.0843, 10.3460],
    type: 'city',
    zoom: 13,
  },
  {
    id: 'dalat',
    name: 'Da Lat',
    nameVi: 'Đà Lạt',
    nameKo: '달랏',
    keywords: ['da lat', 'dalat', 'đà lạt', '달랏'],
    center: [108.4583, 11.9404],
    type: 'city',
    zoom: 13,
  },
  {
    id: 'hue',
    name: 'Hue',
    nameVi: 'Huế',
    nameKo: '후에',
    keywords: ['hue', 'huế', '후에'],
    center: [107.5909, 16.4637],
    type: 'city',
    zoom: 13,
  },
  {
    id: 'hoian',
    name: 'Hoi An',
    nameVi: 'Hội An',
    nameKo: '호이안',
    keywords: ['hoi an', 'hoian', 'hội an', '호이안'],
    center: [108.3380, 15.8801],
    type: 'city',
    zoom: 14,
  },
  {
    id: 'phuquoc',
    name: 'Phu Quoc',
    nameVi: 'Phú Quốc',
    nameKo: '푸꾸옥',
    keywords: ['phu quoc', 'phuquoc', 'phú quốc', '푸꾸옥'],
    center: [103.9840, 10.2899],
    type: 'city',
    zoom: 12,
  },
  {
    id: 'halong',
    name: 'Ha Long',
    nameVi: 'Hạ Long',
    nameKo: '하롱',
    keywords: ['ha long', 'halong', 'hạ long', '하롱'],
    center: [107.1839, 20.9101],
    type: 'city',
    zoom: 13,
  },
  {
    id: 'sapa',
    name: 'Sa Pa',
    nameVi: 'Sa Pa',
    nameKo: '사파',
    keywords: ['sa pa', 'sapa', '사파'],
    center: [103.8437, 22.3364],
    type: 'city',
    zoom: 14,
  },
];

// ============================================================================
// 호치민시 구/군 (District/Quan)
// ============================================================================
export const HCMC_DISTRICTS: VietnamRegion[] = [
  {
    id: 'hcmc-d1',
    name: 'District 1',
    nameVi: 'Quận 1',
    nameKo: '1군',
    keywords: ['district 1', 'quan 1', 'quận 1', 'd1', 'q1', '1군'],
    center: [106.7019, 10.7756],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d2',
    name: 'District 2',
    nameVi: 'Quận 2',
    nameKo: '2군',
    keywords: ['district 2', 'quan 2', 'quận 2', 'd2', 'q2', '2군', 'thu duc city'],
    center: [106.7507, 10.7867],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d3',
    name: 'District 3',
    nameVi: 'Quận 3',
    nameKo: '3군',
    keywords: ['district 3', 'quan 3', 'quận 3', 'd3', 'q3', '3군'],
    center: [106.6833, 10.7833],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d4',
    name: 'District 4',
    nameVi: 'Quận 4',
    nameKo: '4군',
    keywords: ['district 4', 'quan 4', 'quận 4', 'd4', 'q4', '4군'],
    center: [106.7050, 10.7583],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d5',
    name: 'District 5',
    nameVi: 'Quận 5',
    nameKo: '5군',
    keywords: ['district 5', 'quan 5', 'quận 5', 'd5', 'q5', '5군', 'cho lon', 'cholon'],
    center: [106.6667, 10.7583],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d6',
    name: 'District 6',
    nameVi: 'Quận 6',
    nameKo: '6군',
    keywords: ['district 6', 'quan 6', 'quận 6', 'd6', 'q6', '6군'],
    center: [106.6333, 10.7500],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d7',
    name: 'District 7',
    nameVi: 'Quận 7',
    nameKo: '7군',
    keywords: ['district 7', 'quan 7', 'quận 7', 'd7', 'q7', '7군', 'phu my hung', 'phú mỹ hưng'],
    center: [106.7157, 10.7324],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d8',
    name: 'District 8',
    nameVi: 'Quận 8',
    nameKo: '8군',
    keywords: ['district 8', 'quan 8', 'quận 8', 'd8', 'q8', '8군'],
    center: [106.6333, 10.7250],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d9',
    name: 'District 9',
    nameVi: 'Quận 9',
    nameKo: '9군',
    keywords: ['district 9', 'quan 9', 'quận 9', 'd9', 'q9', '9군'],
    center: [106.8333, 10.8500],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d10',
    name: 'District 10',
    nameVi: 'Quận 10',
    nameKo: '10군',
    keywords: ['district 10', 'quan 10', 'quận 10', 'd10', 'q10', '10군'],
    center: [106.6667, 10.7750],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d11',
    name: 'District 11',
    nameVi: 'Quận 11',
    nameKo: '11군',
    keywords: ['district 11', 'quan 11', 'quận 11', 'd11', 'q11', '11군'],
    center: [106.6500, 10.7667],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-d12',
    name: 'District 12',
    nameVi: 'Quận 12',
    nameKo: '12군',
    keywords: ['district 12', 'quan 12', 'quận 12', 'd12', 'q12', '12군'],
    center: [106.6500, 10.8667],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-binhthanh',
    name: 'Binh Thanh',
    nameVi: 'Bình Thạnh',
    nameKo: '빈탄',
    keywords: ['binh thanh', 'binhthanh', 'bình thạnh', '빈탄'],
    center: [106.7100, 10.8032],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-tanbinh',
    name: 'Tan Binh',
    nameVi: 'Tân Bình',
    nameKo: '떤빈',
    keywords: ['tan binh', 'tanbinh', 'tân bình', '떤빈', 'tan son nhat', 'airport'],
    center: [106.6522, 10.8017],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-tanphu',
    name: 'Tan Phu',
    nameVi: 'Tân Phú',
    nameKo: '떤푸',
    keywords: ['tan phu', 'tanphu', 'tân phú', '떤푸'],
    center: [106.6333, 10.8000],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-govap',
    name: 'Go Vap',
    nameVi: 'Gò Vấp',
    nameKo: '고밥',
    keywords: ['go vap', 'govap', 'gò vấp', '고밥'],
    center: [106.6667, 10.8333],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-phunhuan',
    name: 'Phu Nhuan',
    nameVi: 'Phú Nhuận',
    nameKo: '푸년',
    keywords: ['phu nhuan', 'phunhuan', 'phú nhuận', '푸년', '푸누언'],
    center: [106.6833, 10.8000],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 14,
  },
  {
    id: 'hcmc-thuduc',
    name: 'Thu Duc City',
    nameVi: 'TP. Thủ Đức',
    nameKo: '투득시',
    keywords: ['thu duc', 'thuduc', 'thủ đức', '투득', 'tp thu duc'],
    center: [106.7600, 10.8500],
    type: 'district',
    parentCity: 'hcmc',
    zoom: 13,
  },
];

// ============================================================================
// 하노이 구/군 (District/Quan)
// ============================================================================
export const HANOI_DISTRICTS: VietnamRegion[] = [
  {
    id: 'hanoi-hoankiem',
    name: 'Hoan Kiem',
    nameVi: 'Hoàn Kiếm',
    nameKo: '호안끼엠',
    keywords: ['hoan kiem', 'hoankiem', 'hoàn kiếm', '호안끼엠', 'old quarter'],
    center: [105.8544, 21.0285],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-badinh',
    name: 'Ba Dinh',
    nameVi: 'Ba Đình',
    nameKo: '바딘',
    keywords: ['ba dinh', 'badinh', 'ba đình', '바딘'],
    center: [105.8180, 21.0360],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-dongda',
    name: 'Dong Da',
    nameVi: 'Đống Đa',
    nameKo: '동다',
    keywords: ['dong da', 'dongda', 'đống đa', '동다'],
    center: [105.8280, 21.0150],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-haibatrung',
    name: 'Hai Ba Trung',
    nameVi: 'Hai Bà Trưng',
    nameKo: '하이바쯩',
    keywords: ['hai ba trung', 'haibatrung', 'hai bà trưng', '하이바쯩'],
    center: [105.8600, 21.0000],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-caugiay',
    name: 'Cau Giay',
    nameVi: 'Cầu Giấy',
    nameKo: '꺼우저이',
    keywords: ['cau giay', 'caugiay', 'cầu giấy', '꺼우저이'],
    center: [105.7890, 21.0310],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-tayho',
    name: 'Tay Ho',
    nameVi: 'Tây Hồ',
    nameKo: '떠이호',
    keywords: ['tay ho', 'tayho', 'tây hồ', '떠이호', 'west lake'],
    center: [105.8230, 21.0670],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-longbien',
    name: 'Long Bien',
    nameVi: 'Long Biên',
    nameKo: '롱비엔',
    keywords: ['long bien', 'longbien', 'long biên', '롱비엔'],
    center: [105.8920, 21.0530],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-hoangmai',
    name: 'Hoang Mai',
    nameVi: 'Hoàng Mai',
    nameKo: '호앙마이',
    keywords: ['hoang mai', 'hoangmai', 'hoàng mai', '호앙마이'],
    center: [105.8660, 20.9780],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-thanhxuan',
    name: 'Thanh Xuan',
    nameVi: 'Thanh Xuân',
    nameKo: '탄쑤언',
    keywords: ['thanh xuan', 'thanhxuan', 'thanh xuân', '탄쑤언'],
    center: [105.8110, 20.9930],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-namtuliem',
    name: 'Nam Tu Liem',
    nameVi: 'Nam Từ Liêm',
    nameKo: '남뜨리엠',
    keywords: ['nam tu liem', 'namtuliem', 'nam từ liêm', '남뜨리엠'],
    center: [105.7650, 21.0180],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
  {
    id: 'hanoi-bactuliem',
    name: 'Bac Tu Liem',
    nameVi: 'Bắc Từ Liêm',
    nameKo: '박뜨리엠',
    keywords: ['bac tu liem', 'bactuliem', 'bắc từ liêm', '박뜨리엠'],
    center: [105.7670, 21.0520],
    type: 'district',
    parentCity: 'hanoi',
    zoom: 14,
  },
];

// ============================================================================
// 모든 행정 구역 통합 (검색용)
// ============================================================================
export const ALL_REGIONS: VietnamRegion[] = [
  ...VIETNAM_CITIES,
  ...HCMC_DISTRICTS,
  ...HANOI_DISTRICTS,
];

// ============================================================================
// 행정 구역 검색 함수 (부분 일치 지원)
// 1글자부터 검색 가능, 한글/영어/베트남어 모두 지원
// ============================================================================
export function searchRegions(query: string): VietnamRegion[] {
  if (!query || query.trim().length < 1) return [];
  
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/);
  
  // 매칭 점수 계산
  const scored = ALL_REGIONS.map(region => {
    let score = 0;
    
    // 모든 검색 대상 텍스트 (이름 + 키워드)
    const searchTargets = [
      region.name.toLowerCase(),
      region.nameVi.toLowerCase(),
      region.nameKo.toLowerCase(),
      ...region.keywords.map(k => k.toLowerCase()),
    ];
    
    for (const target of searchTargets) {
      // 정확 일치: 최고 점수
      if (queryLower === target) {
        score = Math.max(score, 1000);
        break;
      }
      
      // 대상이 검색어로 시작 (예: "ho" -> "ho chi minh")
      if (target.startsWith(queryLower)) {
        score = Math.max(score, 900);
      }
      
      // 검색어가 대상으로 시작 (예: "호치민시" -> "호치민")
      if (queryLower.startsWith(target)) {
        score = Math.max(score, 800);
      }
      
      // 단어 시작 부분 일치 (예: "chi" -> "ho chi minh")
      const targetWords = target.split(/\s+/);
      if (targetWords.some(word => word.startsWith(queryLower))) {
        score = Math.max(score, 700);
      }
      
      // 부분 일치 (예: "ano" -> "hanoi", "노이" -> "하노이")
      if (target.includes(queryLower)) {
        score = Math.max(score, 600);
      }
      
      // 모든 검색어 단어가 대상에 포함
      if (queryWords.length > 1 && queryWords.every(word => target.includes(word))) {
        score = Math.max(score, 500);
      }
      
      // 검색어 단어 중 일부가 대상의 단어 시작과 일치
      if (queryWords.some(qWord => targetWords.some(tWord => tWord.startsWith(qWord)))) {
        score = Math.max(score, 400);
      }
    }
    
    // 도시는 구보다 우선
    if (region.type === 'city' && score > 0) {
      score += 100;
    }
    
    return { region, score };
  });
  
  // 점수순 정렬, 0점 제외
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.region);
}

// ============================================================================
// 행정 구역을 Suggestion 형식으로 변환
// ============================================================================
export function regionToSuggestion(region: VietnamRegion, language: string = 'en'): {
  PlaceId: string;
  Text: string;
  Place: {
    Label: string;
    Geometry: { Point: number[] };
    Municipality: string;
    Region: string;
  };
  isRegion: true;
  regionType: RegionType;
  zoom: number;
} {
  // 언어에 따른 이름 선택
  let displayName: string;
  if (language === 'ko') {
    displayName = region.nameKo;
  } else if (language === 'vi') {
    displayName = region.nameVi;
  } else {
    displayName = region.name;
  }
  
  // 상위 도시 정보 추가 (구/군인 경우)
  let fullLabel = displayName;
  if (region.parentCity) {
    const parentCity = VIETNAM_CITIES.find(c => c.id === region.parentCity);
    if (parentCity) {
      const parentName = language === 'ko' ? parentCity.nameKo : 
                        language === 'vi' ? parentCity.nameVi : parentCity.name;
      fullLabel = `${displayName}, ${parentName}`;
    }
  } else if (region.type === 'city') {
    fullLabel = language === 'ko' ? `${displayName}, 베트남` : `${displayName}, Vietnam`;
  }
  
  return {
    PlaceId: `region-${region.id}`,
    Text: fullLabel,
    Place: {
      Label: fullLabel,
      Geometry: { Point: region.center },
      Municipality: region.name,
      Region: 'Vietnam',
    },
    isRegion: true,
    regionType: region.type,
    zoom: region.zoom,
  };
}
