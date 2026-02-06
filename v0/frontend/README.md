# 500StayViet Frontend

베트남 부동산 플랫폼 프론트엔드 애플리케이션

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Maps**: MapLibre GL (오픈소스 맵 라이브러리)
- **Database**: Prisma + PostgreSQL
- **Authentication**: NextAuth.js
- **Storage**: AWS S3

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 연결
DATABASE_URL="postgresql://..."

# NextAuth 설정
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS 설정
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="your-bucket-name"

# Gemini API (AI 번역)
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 기능

### 1. 메인 화면 (`/`)
- **Split View 레이아웃**: 왼쪽 매물 리스트 + 오른쪽 지도
- 매물 클릭 시 지도에서 해당 위치로 이동
- 매물 정보 표시 (가격, 면적, 방 개수 등)
- 에어비앤비 스타일의 깔끔한 UI

### 2. 매물 등록 (`/add-property`)
- 다국어 지원 매물 등록 폼
- 이미지 업로드 (AWS S3)
- 위치 선택 (지도 기반)

### 3. 사용자 프로필 (`/profile`)
- 개인 정보 관리
- 등록한 매물 관리
- 예약 내역 확인

### 4. KYC 인증 (`/kyc`)
- 신분증 업로드
- 얼굴 인증
- 전화번호 인증

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── page.tsx      # 메인 화면
│   │   ├── add-property/ # 매물 등록 페이지
│   │   ├── profile/      # 사용자 프로필
│   │   ├── kyc/          # KYC 인증
│   │   └── layout.tsx    # 레이아웃
│   ├── components/       # 재사용 컴포넌트
│   ├── lib/              # 유틸리티 및 설정
│   │   ├── api/          # API 서비스
│   │   ├── prisma.ts     # 데이터베이스 연결
│   │   └── s3-client.ts  # AWS S3 클라이언트
│   ├── contexts/         # React 컨텍스트
│   ├── hooks/            # 커스텀 훅
│   └── types/            # TypeScript 타입 정의
├── prisma/               # Prisma 스키마
├── .env.local            # 환경 변수 (gitignore)
└── package.json
```

## API 엔드포인트

### 내부 API
- `/api/auth/*`: 인증 관련 API
- `/api/kyc/*`: KYC 인증 API
- `/api/aws-location/*`: 위치 검색 API

### 외부 서비스
- **Gemini API**: AI 기반 번역 서비스
- **AWS Location Service**: 지도 및 위치 서비스
- **AWS S3**: 이미지 저장소

## 디자인 시스템

- **색상**: 브랜드 컬러 (brand-deep, brand-emerald)
- **폰트**: Be Vietnam Pro, Noto Sans
- **아이콘**: Lucide React
- **레이아웃**: 반응형 디자인 (모바일/태블릿/데스크톱)

## 배포

### AWS Amplify 배포

1. AWS Amplify 콘솔에서 프로젝트 연결
2. GitHub 리포지토리 선택
3. 빌드 설정 자동 감지
4. 환경 변수 설정
5. 배포 완료!

### 수동 빌드

```bash
npm run build
npm start
```

## 문제 해결

### 지도가 표시되지 않을 때
- AWS Location Service 설정 확인
- 지도 스타일 URL 확인

### 이미지 업로드 실패 시
- AWS S3 버킷 권한 확인
- AWS 자격 증명 확인

### 데이터베이스 연결 실패 시
- DATABASE_URL 환경 변수 확인
- Prisma 마이그레이션 실행

## 라이선스

Private
