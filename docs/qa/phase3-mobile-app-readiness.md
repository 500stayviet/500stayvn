# Phase 3: 모바일 앱 전환 준비 (실행 순서)

웹 앱은 **`frontend/`** Next.js + 프로덕션 **PWA**(`next-pwa`, `public/manifest.json`) 기준이다.  
법인·스토어 계정·실제 도메인이 정해지면 아래 플레이스홀더를 치환한다.

## Android Studio 없이 TWA 로컬 빌드 (Windows)

1. **JDK 17** 설치 후 `JAVA_HOME` 설정.
2. **Android SDK**만 설치 (Android Studio 전체 대신 [command-line tools](https://developer.android.com/studio#command-line-tools-only) 로 충분). 환경 변수 예: `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`.
3. SDK 라이선스: `%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager --licenses` 후 모두 수락.
4. 저장소 루트에서:
   - `cd mobile\android-twa`
   - (최초 1회) `local.properties` 에 `sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` 형태로 경로 기입 (Windows는 `\\` 이스케이프).
5. **디버그 APK:** `.\gradlew.bat :app:assembleDebug` — 산출물은 `app\build\outputs\apk\debug\`.
6. **릴리스 AAB (서명 필요):** `keystore` 로 `app/build.gradle.kts` 서명 설정 후 `.\gradlew.bat :app:bundleRelease` — 또는 CI/내부 러너에서 서명.

`gradle.properties` 의 `twaHostname` 이 웹 호스트와 다르면 TWA 기본 URL·인텐트 필터가 어긋나므로, **항상 `production-host.ts` 와 동일 호스트**를 유지한다.

## 맥 없을 때 권장 실행 순서 (Windows 우선)

1. **Android TWA** — `mobile/android-twa/gradle.properties` 의 **`twaHostname`** 이 프로덕션과 일치하는지 확인 → (선택) Android Studio **Sync** 또는 위 **Gradle만**으로 빌드. 상세: `mobile/android-twa/README.md`.
2. **Digital Asset Links** — Play Console **앱 서명** SHA-256 → `frontend/public/.well-known/assetlinks.json` 반영 → 웹 배포 후 `/.well-known/assetlinks.json` 공개 확인·[검증 도구](https://developers.google.com/digital-asset-links/tools/generator).
3. **스토어·정책 URL** — `docs/qa/store-listing-draft.md` 의 URL 표를 실제 호스트로 치환, 법무·운영과 문구 확정 (`/privacy`, `/delete-account` 와 스토어 기재 일치).
4. **iOS** — 맥·Apple Developer·Team ID 준비 후 `docs/qa/phase3-capacitor-ios.md` (`CAPACITOR_SERVER_URL`, Xcode).

## 실행 단계 진행 기록 (3-1 & 3-2 실체화)

| 항목 | 상태 | 날짜 | 비고 |
|------|------|------|------|
| **TWA 방식 확정** | **완료** | **2026-04-27** | Capacitor는 네이티브 SDK 필수 시 2안으로 유보 |
| Android TWA 프로젝트 골격 | 완료 | 2026-04-27 | `mobile/android-twa/` — **`gradle.properties` → `twaHostname` 단일 설정** |
| `assetlinks.json` 웹 배포용 초안 | 완료 | 2026-04-27 | `frontend/public/.well-known/assetlinks.json` — SHA-256 치환 필요 |
| 스토어 문구 초안 (KO/EN/VI) | 완료 | 2026-04-27 | `docs/qa/store-listing-draft.md` |

---

## 3-1 패키징 1안 확정 (권한 · 딥링크)

### 권장 방향 (결정 기록)

| 옵션 | 적합한 경우 | 이 프로젝트 메모 |
|------|-------------|------------------|
| **TWA (Trusted Web Activity)** | 웹이 단일 소스, PWA 이미 있음, 네이티브 플러그인 최소 | **1순위 후보.** Chrome/Android에서 웹을 풀스크린 셸로 감싼다. [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) 또는 Android Studio TWA 템플릿 + Play Console. |
| **PWA만 (설치 프롬프트)** | 스토어 없이 배포 | 이미 가능. 스토어 노출은 아님. |
| **Capacitor** | 네이티브 SDK(푸시·결제 SDK·복잡한 파일/백그라운드) 필수 | 웹과 **별도** 네이티브 프로젝트 유지 비용 증가. 필요해질 때 2안으로 검토. |

**실행:** 팀 회의에서 위 표로 **TWA vs Capacitor**를 한 줄 결정하고, 결정일을 이 문서 상단에 적는다.

### 권한 vs 기능 (점검표)

앱 매니페스트/스토어 선언과 실제 사용을 맞춘다.

| 기능 | 웹/PWA 현황 | Android (TWA) | iOS (향후 WebView/래퍼 시) |
|------|-------------|----------------|---------------------------|
| 지도/검색 | `map`, AWS Location | 위치 권한은 **요청 시만** 필요할 수 있음 | 동일 |
| KYC 카메라 | `kyc/upload` 등 | 브라우저 권한 → 스토어 **사진/카메라** 정책 문구 준비 | 동일 |
| 알림 | Web Push(설정 시) | 선택 | APNs는 네이티브/서비스 별도 |
| 로그인 | OAuth / 앱 세션 | 딥링크 콜백 URL 확보 | Universal Links |

### 딥링크 · 도메인

- **프로덕션 호스트 (Phase 3):** `https://main.dn98z8m9jfvd5.amplifyapp.com` — 코드·TWA·문서 단일 기준은 `frontend/src/constants/production-host.ts` 및 `mobile/android-twa/gradle.properties` 의 `twaHostname`.
- **스코프:** `manifest.json`의 `"scope": "/"`와 일치시킨다.
- **권장 경로 패턴:** 예약 `/booking`, `/booking-success`, 채팅 `/chat/*`, 프로필 `/profile/*` — 외부에서 열 때 동일 URL로 열리게 하면 TWA/브라우저 모두 동작한다.
- **Android App Links:** 배포 후 `/.well-known/assetlinks.json`에 **패키지명 + SHA-256 인증서 지문**을 넣는다 (Play App Signing 지문은 Play Console에서 확인).
- **iOS Universal Links:** `apple-app-site-association` (도메인 루트 또는 `.well-known`) — 번들 ID 확정 후 Apple Developer에서 설정.

**템플릿 (값 치환 후 서빙):**

`assetlinks.json` 예:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.stay500vn.app",
      "sha256_cert_fingerprints": ["REPLACE_SHA256_FROM_PLAY_APP_SIGNING"]
    }
  }
]
```

---

## 3-2 앱 ID · 서명 · 릴리스 파이프라인 골격

### 식별자 (플레이스홀더 — 확정 후 수정 불가 항목 주의)

| 항목 | Android | iOS |
|------|---------|-----|
| 앱 이름 (스토어 표시) | `500 STAY VN` (manifest와 통일 가능) | 동일 권장 |
| 패키지명 / Bundle ID | **`com.stay500vn.app`** (Android TWA·`assetlinks.json` 확정, 2026-04-27) | iOS·Capacitor 동일 권장 |
| 버전 정책 | `versionCode` 정수 증가(필수), `versionName` 사용자 표시 | `CFBundleShortVersionString` / `CFBundleVersion` |

### 서명 · 비밀 관리

- **Android:** Play App Signing 사용 권장. 업로드 키는 팀 비밀 저장소(1Password 등)에만 보관. **저장소에 keystore 커밋 금지.**
- **iOS:** Apple Distribution 인증서 + 프로비저닝 — 법인 Apple Developer 계정 후 진행.
- **CI:** 초기에는 **로컬 또는 내부 러너**에서 서명하는 것이 일반적. GitHub Actions에 키를 넣을 경우 **Encrypted secrets**만 사용.

### 릴리스 파이프라인 (골격 체크리스트)

1. 웹이 **프로덕션**에서 PWA·HTTPS·리다이렉트 정상인지 확인 (`manifest.json`, `sw.js`).
2. TWA: Bubblewrap로 프로젝트 생성 → `twa-manifest.json`에 `host`, `packageId` 반영 → 로컬 `./gradlew bundleRelease` 또는 Android Studio로 **AAB** 빌드.
3. Play Console: 내부 테스트 트랙에 AAB 업로드 → 테스터 초대.
4. (선택) 태그 기반 버전: Git tag `app-android-v1.0.0` ↔ `versionName` 기록을 문서로만 맞춰도 됨.

---

## 3-3 스토어 제출물 초안

### 에셋

| 항목 | 스펙 메모 | 상태 |
|------|-----------|------|
| 아이콘 | 512×512 (이미 `icon-512x512.png` 존재) | 스토어 전용 마스킹 규칙 확인 |
| 스크린샷 | 휴대폰 세로, 필수 해상도는 스토어별 가이드 따름 | 촬영 예: 홈, 검색, 예약, 프로필 |
| 짧은 설명 / 전체 설명 | KO/VI/EN 중 출시 언어 결정 | 초안 작성 |
| 그래픽 기능 이미지 | Play 선택 | 선택 |

### 정책 URL (법인 도메인 확정 후 연결)

| 항목 | URL / 경로 |
|------|------------|
| 개인정보처리방침 | `https://main.dn98z8m9jfvd5.amplifyapp.com/privacy` |
| 이용약관 | `https://main.dn98z8m9jfvd5.amplifyapp.com/terms` |
| 계정 삭제 | 웹: `/delete-account` 라우트 존재 — 스토어에 **동일 절차 안내** 문구·링크 명시 |
| 고객 지원 이메일 | `support@...` (실제 수신함) |
| 신고/안전 | 연락 채널 또는 인앱 경로 + 정책 링크 |

### 앱 내 경로와 스토어 문구 정합

- **문의:** 프로필/설정에 지원 링크가 있으면 스토어 설명과 동일 URL·이메일을 적는다.
- **신고:** 숙소·채팅 관련 신고 정책이 있으면 URL 또는 앱 내 메뉴를 스토어 심사용으로 정리한다.

---

## 진행 상태 (팀에서 갱신)

| 단계 | 상태 | 날짜 | 비고 |
|------|------|------|------|
| 3-1 패키징 결정 (TWA/Capacitor) | ☐ | | |
| 3-2 패키지명·번들 ID 확정 | ☐ | | |
| 3-2 첫 AAB 내부 테스트 | ☐ | | |
| 3-3 스토어 카피·정책 URL | ☐ | | |
| assetlinks / iOS association 배포 | ☐ | | |

---

## 내가 직접 테스트할 목록 (운영자 기록)

**용도:** 배포 후 브라우저·폰으로 직접 확인하고, 체크·확인일·이슈를 여기만 적어도 됩니다. (자동 테스트·CI와 별개)

**프로덕션 호스트 (현재):** `https://main.dn98z8m9jfvd5.amplifyapp.com` — 바뀌면 아래 URL도 같이 바꿉니다.

| ☐ | 항목 | 확인 방법 | 확인일 | 비고 |
|---|------|-----------|--------|------|
| ☐ | **개인정보처리방침** | 브라우저에서 `/privacy` — 200·본문 표시 | | |
| ☐ | **이용약관** | `/terms` — 200·본문 표시 | | |
| ☐ | **계정 삭제 안내** | `/delete-account` — 200·절차 문구가 스토어 초안·앱 안내와 같은 호스트인지 | | [store-listing-draft.md](./store-listing-draft.md) 와 대조 |
| ☐ | **지원 연락처 일치** | 앱/웹에 보이는 이메일·문의 경로가 `operator-contact.ts`·스토어 초안과 같은지 | | |
| ☐ | **Digital Asset Links 파일 노출** | `/.well-known/assetlinks.json` — JSON이 열리는지 (지문은 나중에 Play SHA-256으로 치환) | | |
| ☐ | **PWA·홈 화면 추가** | Chrome 모바일에서 사이트 열기 → “홈 화면에 추가” 또는 설치 프롬프트 동작 | | |
| ☐ | **언어 전환** | EN / KO / VI 등 전환 후 홈·예약·프로필 한 화면씩 한글·영어 섞임 없는지 | | |
| ☐ | **핵심 동선 (로그인 가능 시)** | 로그인 → 검색/목록 → 예약 또는 결제 **모의**까지 한 번 | | 실결제는 Phase 4 전까지 하지 않기 |
| ☐ | **모바일 뷰포트** | 실제 폰 또는 DevTools 기기 모드에서 하단 메뉴·폼이 가려지지 않는지 | | |

**나중에 (Play 내부 테스트 AAB 설치 후):** 같은 URL이 TWA 안에서 열리는지, 로그인·딥링크(해당 시)만 추가로 한 번씩.

---

## 권장 다음 작업 (우선순위)

1. **위 표를 비우지 말고** 최신 배포 기준으로 하나씩 체크 → [pre-launch-closure.md](./pre-launch-closure.md) §1 증거 URL과 맞추면 “법무·정책 클로저” 진행이 빨라집니다.
2. **상용 일정 표 채우기:** [pre-launch-closure.md](./pre-launch-closure.md) §3 — KYC·은행·메일 등 비어 있는 행에 “모의/실”과 대략 시기만이라도 적기.
3. **3b를 할 때:** JDK 17 + Android SDK → `mobile/android-twa` 에서 릴리스 서명 설정 후 `bundleRelease` → Play **내부 테스트**에 첫 AAB. (상세: 위 문서 상단 “Android Studio 없이…” 절)
4. **Play 계정 생기면:** 콘솔의 **앱 서명 SHA-256** → `assetlinks.json` 치환 후 재배포 → [Digital Asset Links 검증 도구](https://developers.google.com/digital-asset-links/tools/generator)로 확인.

---

## 관련 파일

- `mobile/android-twa/` — TWA Android 프로젝트 초안 (`README.md` 참고)
- `docs/qa/phase3-capacitor-ios.md` — **iOS Capacitor** (`www` + `server.url`, 정적 `out/` 미사용 사유)
- `frontend/public/.well-known/assetlinks.json` — Digital Asset Links (SHA-256 치환 후 배포)
- `frontend/src/app/.well-known/apple-app-site-association/route.ts` — iOS Universal Links (`REPLACE_APPLE_TEAM_ID` 치환, `Content-Type: application/json`)
- `frontend/src/app/privacy/page.tsx` — 개인정보처리방침(다국어 요약, 스토어 URL로 사용)
- `docs/qa/store-listing-draft.md` — 스토어 짧은/긴 설명 KO·EN·VI
- `frontend/public/manifest.json` — 이름·`start_url`·아이콘·shortcuts
- `frontend/next.config.ts` — 프로덕션 PWA 래핑
- `docs/qa/pipeline-principles.md` — 웹 빌드 품질 게이트
- `amplify.yml` — 웹 배포 (앱 스토어는 별도 파이프라인)
