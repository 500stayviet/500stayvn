/**
 * 베트남 유명 명소 (도시·구와 별도 보관)
 * 카테고리: 랜드마크, 생활/쇼핑몰, 거주타운, 관광/문화
 * 5개국어 하드코딩, 검색 키워드 배열, 위경도, 소속 구(District) ID
 */

export type LandmarkCategory = 'landmark' | 'shopping' | 'residential' | 'tourism';

export interface VietnamLandmark {
  id: string;
  category: LandmarkCategory;
  name: string;      // 영어
  nameVi: string;
  nameKo: string;
  nameJa: string;
  nameZh: string;
  searchKeywords: string[];
  lat: number;
  lng: number;
  districtId: string; // 소속 구 ID (vietnam-regions의 district id)
}

// ============================================================================
// 호치민 (HCMC) ~10
// ============================================================================
const HCMC_LANDMARKS: VietnamLandmark[] = [
  { id: 'hcmc-landmark81', category: 'landmark', name: 'Landmark 81', nameVi: 'Landmark 81', nameKo: '랜드마크 81', nameJa: 'ランドマーク81', nameZh: '地标81', searchKeywords: ['landmark 81', 'landmark81', '랜드마크 81', '랜드마크81', 'ランドマーク81', '地标81'], lat: 10.7945, lng: 106.7219, districtId: 'hcmc-binhthanh' },
  { id: 'hcmc-bitexco', category: 'landmark', name: 'Bitexco Financial Tower', nameVi: 'Tháp Bitexco', nameKo: '비텍스코 타워', nameJa: 'ビテックスコ・タワー', nameZh: '西贡贸易中心', searchKeywords: ['bitexco', 'bitexco tower', '비텍스코', 'ビテックスコ', '西贡贸易中心'], lat: 10.7716, lng: 106.7043, districtId: 'hcmc-d1' },
  { id: 'hcmc-ben-thanh', category: 'shopping', name: 'Ben Thanh Market', nameVi: 'Chợ Bến Thành', nameKo: '벤탄 시장', nameJa: 'ベンタン市場', nameZh: '滨城市场', searchKeywords: ['ben thanh', 'ben thanh market', '벤탄', '벤탄시장', 'ベンタン', '滨城'], lat: 10.7725, lng: 106.6980, districtId: 'hcmc-d1' },
  { id: 'hcmc-vincom-center', category: 'shopping', name: 'Vincom Center', nameVi: 'Vincom Center', nameKo: '빈콤 센터', nameJa: 'ビンコムセンター', nameZh: 'Vincom中心', searchKeywords: ['vincom', 'vincom center', '빈콤', 'ビンコム', 'vincom中心'], lat: 10.7780, lng: 106.7010, districtId: 'hcmc-d1' },
  { id: 'hcmc-saigon-center', category: 'shopping', name: 'Saigon Centre', nameVi: 'Saigon Centre', nameKo: '사이공 센터', nameJa: 'サイゴンセンター', nameZh: '西贡中心', searchKeywords: ['saigon centre', 'saigon center', '사이공센터', 'サイゴンセンター', '西贡中心'], lat: 10.7765, lng: 106.7020, districtId: 'hcmc-d1' },
  { id: 'hcmc-thao-dien', category: 'residential', name: 'Thao Dien', nameVi: 'Thảo Điền', nameKo: '타오디엔', nameJa: 'タオディエン', nameZh: '草田', searchKeywords: ['thao dien', 'thaodien', 'thảo điền', '타오디엔', '타오디앤', 'タオディエン', '草田'], lat: 10.8010, lng: 106.7420, districtId: 'hcmc-d2' },
  { id: 'hcmc-phu-my-hung', category: 'residential', name: 'Phu My Hung', nameVi: 'Phú Mỹ Hưng', nameKo: '푸미흥', nameJa: 'フーミーホン', nameZh: '富美兴', searchKeywords: ['phu my hung', 'phumyhung', 'phú mỹ hưng', '푸미흥', 'フーミーホン', '富美兴'], lat: 10.7280, lng: 106.7180, districtId: 'hcmc-d7' },
  { id: 'hcmc-independence-palace', category: 'tourism', name: 'Independence Palace', nameVi: 'Dinh Độc Lập', nameKo: '통일궁', nameJa: '独立宮殿', nameZh: '独立宫', searchKeywords: ['independence palace', 'dinh doc lap', '통일궁', '独立宮殿', '独立宫'], lat: 10.7770, lng: 106.6950, districtId: 'hcmc-d1' },
  { id: 'hcmc-notre-dame', category: 'tourism', name: 'Notre-Dame Cathedral', nameVi: 'Nhà thờ Đức Bà', nameKo: '노트르담 대성당', nameJa: 'ノートルダム大聖堂', nameZh: '圣母教堂', searchKeywords: ['notre dame', 'notre dame cathedral', '노트르담', 'ノートルダム', '圣母教堂'], lat: 10.7797, lng: 106.6991, districtId: 'hcmc-d1' },
  { id: 'hcmc-bui-vien', category: 'tourism', name: 'Bui Vien Street', nameVi: 'Phố Bùi Viện', nameKo: '부이비엔 거리', nameJa: 'ブイヴィエン通り', nameZh: '范五老街', searchKeywords: ['bui vien', 'buivien', 'bùi viện', '부이비엔', 'ブイヴィエン', '范五老'], lat: 10.7670, lng: 106.6930, districtId: 'hcmc-d1' },
];

// ============================================================================
// 하노이 (Hanoi) ~10
// ============================================================================
const HANOI_LANDMARKS: VietnamLandmark[] = [
  { id: 'hanoi-lotte-center', category: 'landmark', name: 'Lotte Center Hanoi', nameVi: 'Lotte Center Hà Nội', nameKo: '롯데 센터 하노이', nameJa: 'ロッテセンターハノイ', nameZh: '乐天中心河内', searchKeywords: ['lotte center', 'lotte hanoi', '롯데센터', 'ロッテセンター', '乐天中心'], lat: 21.0214, lng: 105.8175, districtId: 'hanoi-badinh' },
  { id: 'hanoi-hoan-kiem', category: 'tourism', name: 'Hoan Kiem Lake', nameVi: 'Hồ Hoàn Kiếm', nameKo: '호안끼엠 호수', nameJa: 'ホアンキエム湖', nameZh: '还剑湖', searchKeywords: ['hoan kiem', 'ho guom', 'hoàn kiếm', '호안끼엠', 'ホアンキエム', '还剑湖'], lat: 21.0285, lng: 105.8542, districtId: 'hanoi-hoankiem' },
  { id: 'hanoi-old-quarter', category: 'tourism', name: 'Old Quarter', nameVi: 'Phố cổ Hà Nội', nameKo: '올드쿼터', nameJa: 'ハノイ旧市街', nameZh: '河内老城', searchKeywords: ['old quarter', 'pho co', '올드쿼터', '旧市街', '老城'], lat: 21.0340, lng: 105.8490, districtId: 'hanoi-hoankiem' },
  { id: 'hanoi-temple-literature', category: 'tourism', name: 'Temple of Literature', nameVi: 'Văn Miếu', nameKo: '문묘', nameJa: '文廟', nameZh: '文庙', searchKeywords: ['temple of literature', 'van mieu', '문묘', '文廟', '文庙'], lat: 21.0294, lng: 105.8354, districtId: 'hanoi-dongda' },
  { id: 'hanoi-dong-xuan', category: 'shopping', name: 'Dong Xuan Market', nameVi: 'Chợ Đồng Xuân', nameKo: '동쑤언 시장', nameJa: 'ドンスアン市場', nameZh: '同春市场', searchKeywords: ['dong xuan', 'dongxuan', '동쑤언', 'ドンスアン', '同春'], lat: 21.0385, lng: 105.8480, districtId: 'hanoi-hoankiem' },
  { id: 'hanoi-vincom-mega-mall', category: 'shopping', name: 'Vincom Mega Mall', nameVi: 'Vincom Mega Mall', nameKo: '빈콤 메가몰', nameJa: 'ビンコムメガモール', nameZh: 'Vincom Mega Mall', searchKeywords: ['vincom mega', 'vincom mall', '빈콤메가', 'ビンコムメガ', 'vincom mega'], lat: 21.0130, lng: 105.7950, districtId: 'hanoi-namtuliem' },
  { id: 'hanoi-my-dinh', category: 'residential', name: 'My Dinh', nameVi: 'Mỹ Đình', nameKo: '미딩', nameJa: 'ミーディン', nameZh: '美亭', searchKeywords: ['my dinh', 'mydinh', 'mỹ đình', '미딩', 'ミーディン', '美亭'], lat: 21.0210, lng: 105.7820, districtId: 'hanoi-namtuliem' },
  { id: 'hanoi-west-lake', category: 'tourism', name: 'West Lake', nameVi: 'Hồ Tây', nameKo: '서호', nameJa: '西湖', nameZh: '西湖', searchKeywords: ['west lake', 'ho tay', 'hồ tây', '서호', '西湖'], lat: 21.0560, lng: 105.8200, districtId: 'hanoi-tayho' },
  { id: 'hanoi-one-pillar', category: 'tourism', name: 'One Pillar Pagoda', nameVi: 'Chùa Một Cột', nameKo: '일주사', nameJa: '一柱寺', nameZh: '独柱寺', searchKeywords: ['one pillar', 'mot cot', '일주사', '一柱寺', '独柱寺'], lat: 21.0364, lng: 105.8322, districtId: 'hanoi-badinh' },
  { id: 'hanoi-hoa-lo', category: 'tourism', name: 'Hoa Lo Prison', nameVi: 'Nhà tù Hỏa Lò', nameKo: '호아로 수용소', nameJa: 'ホアロー収容所', nameZh: '华卢监狱', searchKeywords: ['hoa lo', 'hoalo', 'hỏa lò', '호아로', 'ホアロー', '华卢'], lat: 21.0252, lng: 105.8490, districtId: 'hanoi-hoankiem' },
];

// ============================================================================
// 다낭 (Da Nang) ~10
// ============================================================================
const DANANG_LANDMARKS: VietnamLandmark[] = [
  { id: 'danang-dragon-bridge', category: 'landmark', name: 'Dragon Bridge', nameVi: 'Cầu Rồng', nameKo: '드래곤 브릿지', nameJa: 'ドラゴンブリッジ', nameZh: '龙桥', searchKeywords: ['dragon bridge', 'cau rong', '드래곤브릿지', 'ドラゴンブリッジ', '龙桥'], lat: 16.0614, lng: 108.2291, districtId: '' },
  { id: 'danang-my-khe', category: 'tourism', name: 'My Khe Beach', nameVi: 'Bãi biển Mỹ Khê', nameKo: '미케 비치', nameJa: 'ミーケビーチ', nameZh: '美溪海滩', searchKeywords: ['my khe', 'mykhe', 'mỹ khê', '미케', 'ミーケ', '美溪'], lat: 16.0580, lng: 108.2420, districtId: '' },
  { id: 'danang-marble-mountains', category: 'tourism', name: 'Marble Mountains', nameVi: 'Ngũ Hành Sơn', nameKo: '마블 마운틴', nameJa: '五行山', nameZh: '五行山', searchKeywords: ['marble mountains', 'ngu hanh son', '마블마운틴', '五行山'], lat: 16.0010, lng: 108.2680, districtId: '' },
  { id: 'danang-ba-na-hills', category: 'tourism', name: 'Ba Na Hills', nameVi: 'Bà Nà Hills', nameKo: '바나힐', nameJa: 'バナヒルズ', nameZh: '巴拿山', searchKeywords: ['ba na', 'bana', 'bà nà', '바나힐', 'バナ', '巴拿山'], lat: 15.9930, lng: 107.9950, districtId: '' },
  { id: 'danang-golden-bridge', category: 'landmark', name: 'Golden Bridge', nameVi: 'Cầu Vàng', nameKo: '골든 브릿지', nameJa: 'ゴールデンブリッジ', nameZh: '金桥', searchKeywords: ['golden bridge', 'cau vang', '골든브릿지', 'ゴールデンブリッジ', '金桥'], lat: 15.9910, lng: 107.9920, districtId: '' },
  { id: 'danang-vincom', category: 'shopping', name: 'Vincom Da Nang', nameVi: 'Vincom Đà Nẵng', nameKo: '빈콤 다낭', nameJa: 'ビンコムダナン', nameZh: 'Vincom岘港', searchKeywords: ['vincom danang', 'vincom da nang', '빈콤다낭', 'ビンコムダナン'], lat: 16.0670, lng: 108.2210, districtId: '' },
  { id: 'danang-han-market', category: 'shopping', name: 'Han Market', nameVi: 'Chợ Hàn', nameKo: '한 시장', nameJa: 'ハン市場', nameZh: '韩市场', searchKeywords: ['han market', 'cho han', '한시장', 'ハン市場', '韩市场'], lat: 16.0675, lng: 108.2200, districtId: '' },
  { id: 'danang-linh-ung', category: 'tourism', name: 'Linh Ung Pagoda', nameVi: 'Chùa Linh Ứng', nameKo: '린웅 사원', nameJa: 'リンウーン寺', nameZh: '灵应寺', searchKeywords: ['linh ung', 'linhung', '린웅', '灵应寺'], lat: 16.1020, lng: 108.2680, districtId: '' },
  { id: 'danang-sun-world', category: 'tourism', name: 'Sun World Da Nang', nameVi: 'Sun World Đà Nẵng', nameKo: '선 월드 다낭', nameJa: 'サンワールドダナン', nameZh: '太阳世界岘港', searchKeywords: ['sun world', 'sunworld danang', '선월드', 'サンワールド'], lat: 16.1000, lng: 108.2650, districtId: '' },
  { id: 'danang-love-bridge', category: 'landmark', name: 'Love Bridge', nameVi: 'Cầu Tình Yêu', nameKo: '러브 브릿지', nameJa: 'ラブブリッジ', nameZh: '爱情桥', searchKeywords: ['love bridge', 'cau tinh yeu', '러브브릿ジ', '爱情桥'], lat: 16.0620, lng: 108.2280, districtId: '' },
];

// ============================================================================
// 통합 목록 (지도 검색·필터용)
// ============================================================================
export const ALL_LANDMARKS: VietnamLandmark[] = [
  ...HCMC_LANDMARKS,
  ...HANOI_LANDMARKS,
  ...DANANG_LANDMARKS,
];

/** 언어별 명소 이름 반환 */
export function getLandmarkName(lm: VietnamLandmark, lang: string): string {
  const m: Record<string, string> = { ko: lm.nameKo, vi: lm.nameVi, en: lm.name, ja: lm.nameJa, zh: lm.nameZh };
  return m[lang] ?? lm.name;
}

/** 검색어와 일치하는지 (5개국어 이름 + searchKeywords, toLowerCase, 1글자 자동완성) */
function landmarkMatchesQuery(lm: VietnamLandmark, queryLower: string): boolean {
  if (!queryLower) return false;
  const targets = [
    lm.name.toLowerCase(),
    lm.nameVi.toLowerCase(),
    lm.nameKo.toLowerCase(),
    lm.nameJa.toLowerCase(),
    lm.nameZh.toLowerCase(),
    ...lm.searchKeywords.map(k => k.toLowerCase()),
  ];
  for (const t of targets) {
    if (t === queryLower) return true;
    if (t.startsWith(queryLower)) return true;
    if (queryLower.startsWith(t)) return true;
    if (t.includes(queryLower)) return true;
    if (queryLower.length >= 1 && t.includes(queryLower)) return true;
  }
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    const allMatch = queryWords.every(qw =>
      targets.some(t => t.includes(qw) || t.startsWith(qw))
    );
    if (allMatch) return true;
  }
  return false;
}

/** 명소 검색 (자동완성: 1글자부터, name·searchKeywords·toLowerCase) */
export function searchLandmarks(query: string): VietnamLandmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_LANDMARKS.filter(lm => landmarkMatchesQuery(lm, q));
}

/** 점수 기반 명소 검색 (정확/시작/포함 순) */
export function searchLandmarksScored(query: string): { landmark: VietnamLandmark; score: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { landmark: VietnamLandmark; score: number }[] = [];
  const targets = (lm: VietnamLandmark) => [
    lm.name.toLowerCase(), lm.nameVi.toLowerCase(), lm.nameKo.toLowerCase(),
    lm.nameJa.toLowerCase(), lm.nameZh.toLowerCase(),
    ...lm.searchKeywords.map(k => k.toLowerCase()),
  ];
  for (const lm of ALL_LANDMARKS) {
    let score = 0;
    for (const t of targets(lm)) {
      if (t === q) { score = Math.max(score, 1000); break; }
      if (t.startsWith(q)) score = Math.max(score, 900);
      if (q.startsWith(t)) score = Math.max(score, 800);
      if (t.includes(q)) score = Math.max(score, 600);
      if (q.split(/\s+/).every(w => t.includes(w))) score = Math.max(score, 500);
    }
    if (score > 0) results.push({ landmark: lm, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

/** 명소 → 지도 Suggestion 변환 (PlaceId, Text, Geometry, districtId, landmarkCategory) */
export function landmarkToSuggestion(lm: VietnamLandmark, language: string): {
  PlaceId: string;
  Text: string;
  Place: { Label: string; Geometry: { Point: number[] } };
  isLandmark: true;
  districtId: string;
  landmarkCategory: LandmarkCategory;
} {
  const label = getLandmarkName(lm, language);
  return {
    PlaceId: `landmark-${lm.id}`,
    Text: label,
    Place: {
      Label: label,
      Geometry: { Point: [lm.lng, lm.lat] },
    },
    isLandmark: true,
    districtId: lm.districtId,
    landmarkCategory: lm.category,
  };
}
