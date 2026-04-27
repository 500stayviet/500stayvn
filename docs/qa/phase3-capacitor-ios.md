# Phase 3-iOS: Capacitor 셸 (시뮬레이터·실기기)

## 왜 `output: 'export'` + `webDir: out` 가 아닌가

Next.js **Static Export**는 **App Router의 Route Handler(`src/app/api/**`)** 를 지원하지 않는다.  
본 레포는 **BFF·Prisma·원장 API**가 같은 Next 앱에 있으므로 `out/` 정적 번들로는 **현재 구조를 유지할 수 없다**.

대신 **Zero Local Dependency(서버 단일 원정)** 를 지키기 위해 Capacitor WebView는 **`server.url`** 로 이미 배포된 **HTTPS Next**(예: Amplify)를 로드한다. 데이터·예약·결제는 전부 그 원격 BFF를 경유한다.

## 디렉터리

| 경로 | 역할 |
|------|------|
| `frontend/capacitor.config.ts` | `appId: com.stay500vn.app`, `webDir: www`, 선택적 `server.url` |
| `frontend/www/` | 오프라인 폴백 정적 파일(짧은 안내 HTML) |
| `frontend/ios/` | Xcode 프로젝트 (`npx cap add ios` 로 생성) |

## 시뮬레이터에서 첫 화면

1. **맥**에서 Xcode·CocoaPods 설치 후:
   ```bash
   cd frontend
   export CAPACITOR_SERVER_URL="https://<배포된-프로덕션-또는-스테이징-호스트>"
   npm run mobile:ios-sync
   npm run mobile:ios-open
   ```
2. Xcode에서 시뮬레이터 선택 후 Run(▶).

`CAPACITOR_SERVER_URL` 이 비어 있으면 **로컬 `www/index.html` 폴백**만 보인다.

로컬 Next 개발 서버를 붙이려면(같은 LAN):  
`CAPACITOR_SERVER_URL=http://192.168.x.x:3000` — iOS에서 **ATS·cleartext**(`cleartext: true`)는 `capacitor.config.ts`에서 http 스킴일 때 켜짐.

## 스크립트

- `npm run mobile:ios-sync` — `npx cap sync ios` (www → 네이티브 복사 + 설정 반영)
- `npm run mobile:ios-open` — Xcode 열기

**참고:** `next build && cap sync` 는 `out/`을 채우지 않으므로 본 레포 기본 워크플로에는 넣지 않았다. BFF 분리 후 정적 프론트가 생기면 그때 `webDir`·스크립트를 재정의한다.

## 정책·5개국어 UI

- `/privacy`, `LegalFooterLinks` 는 **원격 Next**에서 렌더되므로 시뮬레이터에서도 배포본과 동일하게 검증하면 된다.
- AASA의 `REPLACE_APPLE_TEAM_ID` 치환·연관 도메인은 **실기기·Universal Links** 단계에서 진행.

## 관련

- `frontend/next.config.ts` 상단 주석 — export 비호환 설명
- `docs/qa/phase3-mobile-app-readiness.md`
