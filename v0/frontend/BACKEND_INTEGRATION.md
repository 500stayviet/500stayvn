# Firebase 백엔드 중심 아키텍처 통합 가이드

## 🎯 완료된 작업

### 1. Gemini 번역 API 연동 ✅

**구현 내용:**
- `useTranslation` Hook 생성: 언어 선택 시 자동으로 Firebase Functions의 translate API 호출
- `PropertyCard` 컴포넌트에 실시간 번역 통합
- 언어 변경 시 즉시 번역 결과 표시

**동작 흐름:**
```
사용자 언어 선택 변경
  ↓
useTranslation Hook 감지
  ↓
Firebase Functions translate API 호출
  ↓
Gemini AI 번역 수행
  ↓
UI에 번역 결과 표시
```

**파일:**
- `src/hooks/useTranslation.ts` - 번역 Hook
- `src/components/PropertyCard.tsx` - 번역 통합된 카드 컴포넌트

### 2. Firestore 데이터 구조화 ✅

**데이터 구조:**
```typescript
{
  title: string;                    // 베트남어 제목
  original_description: string;     // 베트남어 원문
  translated_description: string;   // 번역된 설명 (한국어)
  coordinates: {
    lat: number;                    // 위도
    lng: number;                    // 경도
  };
  price: number;
  priceUnit: 'vnd' | 'usd';
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  images?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'pending' | 'sold' | 'rented' | 'inactive';
}
```

**구현 내용:**
- `src/lib/api/properties.ts` - Firestore CRUD 서비스
- `src/hooks/useProperties.ts` - 실시간 데이터 가져오기 Hook
- `scripts/seed-firestore.ts` - 샘플 데이터 업로드 스크립트

**실시간 동기화:**
- Firestore의 `onSnapshot`을 사용하여 데이터 변경 시 자동 업데이트
- 새 매물 추가/수정/삭제 시 UI가 즉시 반영

### 3. 주소-좌표 자동화 연결 ✅

**구현 내용:**
- `src/lib/api/geocoding.ts` - Google Geocoding API 서비스
- `src/app/properties/new/page.tsx` - 새 매물 등록 페이지

**동작 흐름:**
```
사용자가 베트남 주소 입력
  ↓
주소 길이 10자 이상 감지
  ↓
Google Geocoding API 호출
  ↓
위도/경도 자동 생성
  ↓
지도에 마커 표시
```

**특징:**
- 주소 입력 중 자동으로 Geocoding 실행
- 좌표 생성 완료 시 시각적 피드백 제공
- 좌표가 생성되어야만 매물 등록 가능

### 4. 백엔드 중심 상태 관리 ✅

**구현 내용:**
- **Firestore 실시간 리스너**: `useProperties` Hook
- **Skeleton UI**: 로딩 중 깔끔한 UI 표시
- **에러 처리**: 사용자 친화적인 에러 메시지

**파일:**
- `src/hooks/useProperties.ts` - Firestore 실시간 데이터 Hook
- `src/components/Skeleton.tsx` - 로딩 스켈레톤 UI
- `src/app/page.tsx` - 메인 페이지 (실시간 데이터 통합)

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 페이지 (Firestore + 번역 통합)
│   │   ├── properties/
│   │   │   └── new/
│   │   │       └── page.tsx      # 새 매물 등록 (Geocoding 통합)
│   │   └── admin/
│   │       └── page.tsx          # 관리자 페이지
│   ├── components/
│   │   ├── Header.tsx            # 헤더 (언어 선택)
│   │   ├── PropertyCard.tsx      # 매물 카드 (실시간 번역)
│   │   └── Skeleton.tsx          # 로딩 스켈레톤
│   ├── hooks/
│   │   ├── useProperties.ts      # Firestore 실시간 데이터
│   │   └── useTranslation.ts     # 실시간 번역
│   ├── lib/
│   │   ├── firebase.ts           # Firebase 초기화
│   │   ├── firebase-config.ts    # Firebase 설정
│   │   └── api/
│   │       ├── translation.ts   # 번역 API
│   │       ├── properties.ts     # Firestore 서비스
│   │       └── geocoding.ts      # Geocoding API
│   └── utils/
│       └── mapMarker.ts          # 커스텀 마커
├── scripts/
│   └── seed-firestore.ts         # 샘플 데이터 업로드
└── .env.local                    # 환경 변수
```

## 🚀 사용 방법

### 1. Firebase 설정

1. Firebase Console에서 Firestore 데이터베이스 생성
2. `.env.local`에 Firebase 설정 추가 (자세한 내용은 `FIREBASE_SETUP.md` 참고)

### 2. 샘플 데이터 업로드

```bash
cd frontend
npm run seed
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 새 매물 등록

1. `/properties/new` 페이지 접속
2. 베트남 주소 입력 (자동으로 좌표 생성)
3. 매물 정보 입력
4. 등록 버튼 클릭

## 🔄 데이터 흐름

### 실시간 번역 흐름

```
사용자 언어 선택 (ko/vi/en)
  ↓
Header 컴포넌트 → handleLanguageChange
  ↓
HomePage → currentLanguage 상태 업데이트
  ↓
PropertyCard → useTranslation Hook
  ↓
Firebase Functions translate API 호출
  ↓
Gemini AI 번역
  ↓
번역 결과 UI에 표시
```

### Firestore 실시간 동기화

```
Firestore 데이터 변경
  ↓
onSnapshot 리스너 감지
  ↓
useProperties Hook 상태 업데이트
  ↓
HomePage 자동 리렌더링
  ↓
새로운 데이터 UI에 표시
```

### Geocoding 흐름

```
사용자 주소 입력
  ↓
handleAddressChange 실행
  ↓
Google Geocoding API 호출
  ↓
좌표 생성
  ↓
상태 업데이트
  ↓
지도에 마커 표시
```

## 🎨 UI/UX 특징

1. **Skeleton UI**: 데이터 로딩 중 깔끔한 로딩 상태 표시
2. **실시간 업데이트**: Firestore 변경 시 즉시 반영
3. **부드러운 전환**: 번역 로딩 중에도 자연스러운 UI
4. **에러 처리**: 사용자 친화적인 에러 메시지

## 📝 주요 Hook 설명

### useProperties
```typescript
const { properties, loading, error } = useProperties();
```
- Firestore에서 매물 데이터를 실시간으로 가져옴
- 데이터 변경 시 자동 업데이트
- 로딩 및 에러 상태 관리

### useTranslation
```typescript
const { translated, loading, error } = useTranslation(
  text,
  targetLanguage,
  sourceLanguage
);
```
- 텍스트를 실시간으로 번역
- 언어 변경 시 자동 재번역
- 로딩 및 에러 상태 관리

## 🔐 보안 고려사항

1. **Firestore 보안 규칙**: 읽기는 모두 허용, 쓰기는 인증 필요
2. **API 키 관리**: `.env.local`에 저장, Git에 커밋하지 않음
3. **CORS 설정**: Firebase Functions에서 CORS 허용 필요

## 🐛 문제 해결

### 번역이 작동하지 않을 때
- Firebase Functions가 정상 배포되었는지 확인
- `.env.local`에 `NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL` 확인

### Firestore 데이터가 안 보일 때
- Firebase Console에서 Firestore 데이터베이스 생성 확인
- 보안 규칙이 읽기를 허용하는지 확인
- `npm run seed`로 샘플 데이터 업로드

### Geocoding이 작동하지 않을 때
- `.env.local`에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 확인
- Google Cloud Console에서 Geocoding API 활성화 확인
