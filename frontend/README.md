# 500StayViet Frontend

베트남 부동산 플랫폼 프론트엔드 애플리케이션

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Maps**: Google Maps JavaScript API (@react-google-maps/api)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google Maps API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=your_geocoding_api_key_here
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_places_api_key_here

# Firebase Functions URLs
NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-stayviet-26ae4.cloudfunctions.net
```

구글 맵 API 키 발급 방법은 `GOOGLE_MAPS_API_SETUP.md` 파일을 참고하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 기능

### 1. 메인 화면 (`/`)
- **Split View 레이아웃**: 왼쪽 매물 리스트 + 오른쪽 구글 맵
- 매물 클릭 시 지도에서 해당 위치로 이동
- 매물 정보 표시 (가격, 면적, 방 개수 등)
- 에어비앤비 스타일의 깔끔한 UI

### 2. 관리자 페이지 (`/admin`)
- Firebase Functions 번역 API 테스트
- 단일 번역, 배치 번역, 언어 감지 기능
- 실시간 번역 결과 확인

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── page.tsx      # 메인 화면
│   │   ├── admin/        # 관리자 페이지
│   │   └── layout.tsx    # 레이아웃
│   ├── lib/              # 유틸리티 및 설정
│   │   ├── firebase-config.ts  # Firebase 설정
│   │   └── api/          # API 서비스
│   │       └── translation.ts  # 번역 API
│   └── types/            # TypeScript 타입 정의
│       └── property.ts   # 부동산 타입
├── .env.local            # 환경 변수 (gitignore)
├── GOOGLE_MAPS_API_SETUP.md  # 구글 맵 API 설정 가이드
└── package.json
```

## API 엔드포인트

### Firebase Functions
- `translate`: 단일 텍스트 번역
- `translateBatch`: 여러 텍스트 동시 번역
- `detectLanguage`: 언어 자동 감지
- `getSupportedLanguages`: 지원 언어 목록 조회

## 디자인 시스템

- **색상**: 화이트와 블루 톤
- **아이콘**: Lucide React
- **레이아웃**: 반응형 디자인 (모바일/태블릿/데스크톱)

## 배포

### Vercel 배포 (권장)

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정
4. 배포 완료!

### 수동 빌드

```bash
npm run build
npm start
```

## 문제 해결

### 구글 맵이 표시되지 않을 때
- `.env.local` 파일에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 올바르게 설정되었는지 확인
- Google Cloud Console에서 Maps JavaScript API가 활성화되었는지 확인
- API 키 제한 설정 확인 (HTTP 리퍼러 제한)

### 번역 API가 작동하지 않을 때
- Firebase Functions가 정상적으로 배포되었는지 확인
- CORS 설정 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 라이선스

Private
