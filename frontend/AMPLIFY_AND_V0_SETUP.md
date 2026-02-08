# AWS Amplify 배포 및 v0 디자인 환경 점검

## next.config.ts 변경 사항

### 이미지 (images)
- **unoptimized: true** 유지  
  Amplify에서 별도 이미지 최적화 서버를 쓰지 않을 때 권장. 외부 URL(Unsplash, S3 등)이 그대로 사용됩니다.
- **remotePatterns**  
  나중에 `unoptimized`를 끄고 최적화를 켤 때를 위해 `images.unsplash.com`을 등록해 두었습니다.
- **S3/CloudFront**  
  최적화를 켤 경우, 사용하는 버킷/도메인을 `remotePatterns`에 추가하세요.
  - 예: `hostname: "your-bucket.s3.ap-northeast-2.amazonaws.com"` 또는 CloudFront 도메인

### 기타
- **reactStrictMode: true**  
  React 권장 사용 방식으로, v0 컴포넌트와의 호환에도 유리합니다.
- **typescript / eslint**  
  빌드 시 타입·린트 검사가 실행되도록 설정되어 있습니다. 필요 시 `ignoreDuringBuilds: true`로 완화할 수 있습니다.

## Amplify 배포 시 참고

- **amplify.yml**  
  `appRoot: frontend` 기준으로 `npm ci` → `prisma generate` → `npm run build`가 실행됩니다.
- **환경 변수**  
  Amplify 콘솔에서 `NEXT_PUBLIC_*`, `DATABASE_URL`, Auth 관련 변수 등을 반드시 설정하세요.
  - **DATABASE_URL**: 런타임에서도 필요합니다. Amplify 콘솔 → 앱 → Environment variables에서 **빌드 시**와 **실행 시** 모두 사용되도록 설정되어 있는지 확인하세요. (Supabase 연결 문자열, 예: `postgresql://USER:PASSWORD@HOST:5432/postgres`)
  - NextAuth + Prisma 어댑터 사용 시, 로그인 시 User/Account가 Supabase에 저장되므로 `DATABASE_URL`이 배포 환경에서 유효해야 합니다.
- **Node 버전**  
  `nvm use 20`으로 20 사용 중이므로, Amplify 빌드 이미지에서도 Node 18+가 지원되는지 확인하세요.
- **아티팩트**  
  `baseDirectory: .next`, `files: '**/*'`로 Next 빌드 결과물이 배포됩니다. SSR 사용 시 Amplify가 자동으로 Next 앱을 인식하도록 되어 있는지 문서/버전을 확인하는 것이 좋습니다.

## v0 디자인 코드 호환

### Tailwind content
- `tailwind.config.js`의 `content`에 아래 경로가 포함되어 있어, v0에서 가져온 컴포넌트가 있는 폴더의 클래스도 스캔됩니다.
  - `src/app/**`
  - `src/components/**`
  - `src/lib/**`
  - `src/contexts/**`
  - `src/hooks/**`
  - `src/utils/**`
  - `src/types/**`
- v0 컴포넌트를 새 폴더에 둘 경우, 해당 경로를 `content`에 추가하면 Tailwind가 적용됩니다.

### Tailwind v4
- 프로젝트는 `@tailwindcss/postcss` + Tailwind v4를 사용합니다.
- v0가 v3 문법으로 코드를 주면, 대부분의 유틸리티 클래스는 그대로 동작합니다. `@theme` 등 v4 전용 문법은 `globals.css`의 기존 설정을 참고해 맞추면 됩니다.

### 폰트·색상
- `layout.tsx`에서 Be Vietnam Pro, Noto Sans KR/JP를 CSS 변수로 로드하고, `tailwind.config.js`의 `fontFamily.sans`와 `colors`(brand-deep, brand-emerald)가 설정되어 있어, v0 컴포넌트에서 `font-sans`, `text-brand-deep` 등을 그대로 사용할 수 있습니다.

## NextAuth + Supabase DB 연동 확인 (배포 후)

1. **환경 변수 점검**
   - Amplify 콘솔 → 해당 앱 → Environment variables
   - `DATABASE_URL`이 Supabase PostgreSQL 연결 문자열로 설정되어 있는지 확인.
   - 변경 후 재배포: **Redeploy this version** 또는 새 커밋으로 배포.

2. **배포 후 페이스북(또는 구글) 로그인 테스트**
   - 배포된 앱에서 로그인 페이지로 이동 후 Facebook(또는 Google)으로 로그인.

3. **Supabase에서 데이터 생성 여부 확인**
   - Supabase 대시보드 → Table Editor
   - **User** 테이블: 방금 로그인한 사용자의 `id`, `email`, `name`, `image` 등이 들어와 있는지 확인.
   - **Account** 테이블: 해당 사용자의 `userId`, `provider`(facebook 또는 google), `providerAccountId` 등이 생성되었는지 확인.
   - 로그인 시도 시 에러가 나면 Amplify → Monitor → Logs에서 런타임 로그를 확인 (NextAuth `debug: true` 시 인증 관련 로그 출력).
