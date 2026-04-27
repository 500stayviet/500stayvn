# 미룬 작업 · 재점검 메모 (팀 핸드오프용)

**목적:** 출시 전에 일부러 보류했거나, **법인·구글 개발자 계정·실결제 계약** 등이 갖춰져야 끝낼 수 있는 일을 한 곳에 모은다.  
**사용법:** 표의 ☐를 ✅로 바꾸고, **담당·날짜·증거(스크린샷·PR 링크)** 를 옆에 적어 간다. 상세 규격은 링크된 문서가 단일 출처(SoT)다.

**관련:** [pre-launch-closure.md](./pre-launch-closure.md) · [phase3-mobile-app-readiness.md](./phase3-mobile-app-readiness.md) · **미룬 작업 표(검수 제외):** [refactor-backlog.md](./refactor-backlog.md) **§ B. 미룬 작업 할일 리스트**

**Phase 3 현재:** 웹은 AWS Amplify 기본 도메인(`main.dn98z8m9jfvd5.amplifyapp.com`)을 프로덕션 호스트로 쓰도록 코드·문서를 맞춰 둔 상태다. 아래 **「나중에 할 일」** 은 그 다음 단계다.

---

## 쉬운 말로 정리 (나중에 할 일)

### 1) 도메인을 나중에 바꿀 때

**무슨 말:** 지금은 Amplify가 준 주소로 서비스하지만, 나중에 **자기 도메인**(예: `www.우리회사.com`)으로 바꿀 수 있다.

**행동:** 도메인이 정해지면 **한 번에** 다음을 같은 호스트로 맞춘다.

- `frontend/src/constants/production-host.ts` 기본값(또는 Amplify 환경 변수 `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST`)
- `mobile/android-twa/gradle.properties` 의 `twaHostname`
- 스토어·개인정보 안내에 적는 URL([store-listing-draft.md](./store-listing-draft.md))
- DNS / Amplify 커스텀 도메인 설정

---

### 2) Digital Asset Links (구글에 “웹과 앱이 한 몸”이라고 신고하는 서류)

**무슨 말:** “**이 웹사이트와 이 안드로이드 앱은 같은 서비스다**”라고 **구글에 제출하는 설정 파일**이다. Play 스토어에서 앱을 열었을 때 주소창 없이 우리 웹을 띄우려면(Trusted Web Activity) 이 연결이 맞아야 한다.

**행동:** **지금 당장은 필수는 아니다.** 나중에 **구글 개발자(Play) 계정**을 만들고 앱을 등록하면, 콘솔에 **앱 서명 인증서의 SHA-256 지문**이 나온다. 그 값을 복사해서 `frontend/public/.well-known/assetlinks.json` 의 `sha256_cert_fingerprints` 자리에 **붙여넣고**, 웹에서 `https://(실제 호스트)/.well-known/assetlinks.json` 이 열리는지 확인하면 된다. (지금 파일에는 아직 `REPLACE_...` 플레이스홀더가 들어 있다.)

**검증 도구:** [Digital Asset Links API](https://developers.google.com/digital-asset-links/tools/generator)

---

### 3) TWA — 안드로이드에 올릴 **진짜 앱 파일(AAB)** 굽기

**무슨 말:** 스토어에 올리는 건 웹 페이지가 아니라 **안드로이드 설치 파일**이다. 우리 프로젝트는 그 껍데기 안에 **이미 배포된 웹(HTTPS)** 을 띄우는 방식(TWA)이다.

**행동:** **Android Studio를 나중에 설치한 뒤**, 저장소에 적어 둔 매뉴얼대로 하면 된다.

- 전체 순서·명령어: [phase3-mobile-app-readiness.md](./phase3-mobile-app-readiness.md) — 특히 **「Android Studio 없이 TWA 로컬 빌드」** (JDK + SDK만으로 `gradlew` 한 줄) 또는 Studio에서 Sync 후 빌드
- 호스트는 항상 **`gradle.properties` 의 `twaHostname`** 과 실제 웹 주소가 같아야 한다.

---

### 4) MoMo Phase 4 — 법인·계약 후 “결제 단말기 개통”

**무슨 말:** 지금은 **연습용·골격**만 있고, **진짜 돈**이 들어오는 결제는 MoMo(또는 계약한 PG)와 **상용 계약·비밀키**가 있어야 켠다. 서버가 MoMo에서 보내는 알림(IPN)을 **위조가 아닌지 검사**하고, 예약·원장을 맞추는 단계다.

**행동:** 법인 설립 등으로 **MoMo에서 파트너 비밀키**를 받으면, 배포 환경에 **`MOMO_PARTNER_SECRET_KEY`** 만 넣고(코드에 하드코딩 금지), 실제 알림 몇 건으로 동작을 확인한다. 이미 만들어 둔 경로: `frontend/src/app/api/webhook/momo/route.ts` + `momoIpnSignature.ts`.

**멱등성:** 어려운 말로 “**같은 결제 알림이 두 번 와도 돈이 두 번 들어가지 않게 하는 장치**”다. 설계는 [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) 에 맞추고, Phase 4에서 원장 반영까지 이어 붙이면 된다.

---

### 5) KYC · 본인확인 API (상용 전환)

**무슨 말:** 앱 안에서 사진·문서·전화 인증 등 **본인확인(KYC)** 을 하고 있지만, **실제 상용 신원 확인 API·계약·개인정보 처리**는 법인·정책·벤더 선정 후에 “진짜 모드”로 바꾸는 경우가 많다.

**행동 (나중에 팀이 정한 범위에 맞춰):**

- 프로덕션용 **신원·문서 검증** 벤더(또는 국가별 규제에 맞는 방식) 확정
- **Firebase 전화 인증** 등: 지금은 개발용 플레이스홀더가 있을 수 있으므로, 상용 프로젝트·키·도메인 허용 목록을 Amplify/콘솔에 맞출 것
- 개인정보처리방침에 **수탁사·보관** 문구가 실제와 일치하는지 법무 확인([pre-launch-closure.md](./pre-launch-closure.md) §1)

*(구체 API 이름은 계약 전까지 가변 — 이 문서에는 “상용 KYC/인증 스택 확정 후 연동” 수준으로 둔다.)*

---

## 기술 체크리스트 (표)

### A. 도메인 · 배포 · 정책 URL

| 상태 | 할 일 | 저장소 / 메모 | 재점검 |
|------|--------|----------------|--------|
| ✅ | Phase 3 Amplify 호스트 정렬 | `production-host.ts`, `gradle.properties`, `amplify.yml`, 스토어 초안 | 커스텀 도메인 시 일괄 치환 |
| ☐ | 커스텀 도메인 | DNS + Amplify + 위 파일 동기화 | 브라우저에서 `/privacy`, `/terms`, `/.well-known/assetlinks.json` |
| ☐ | Digital Asset Links 실지문 | `assetlinks.json` + Play SHA-256 | [검증 도구](https://developers.google.com/digital-asset-links/tools/generator) |
| ☐ | TWA AAB 빌드·스토어 업로드 | [phase3-mobile-app-readiness.md](./phase3-mobile-app-readiness.md) | 내부 테스트 트랙 등 |

### B. MoMo · 결제 (Phase 4)

| 상태 | 할 일 | 메모 |
|------|--------|------|
| ☐ | `MOMO_PARTNER_SECRET_KEY` 운영 주입 | 서버 env만 |
| ☐ | 실 IPN으로 서명 검증 확인 | `momoIpnSignature.ts` 필드 순서 |
| ☐ | 멱등 + 예약/결제 원장 연동 | `paymentPatchIdempotency` 등 |
| ☐ | 처리 후 HTTP **204**, 15초 이내 | MoMo 문서 |

### C. KYC · 외부 API (상용)

| 상태 | 할 일 | 메모 |
|------|--------|------|
| ☐ | 상용 KYC/신원 스택 확정 | 벤더·계약·법무 |
| ☐ | Firebase/OTP 등 프로덕션 프로젝트 정합 | Amplify·도메인·허용 URL |
| ☐ | 개인정보·수탁 문서 갱신 | `legalPages` / `operator-contact` / 스토어 |

### D. i18n · 품질 (선택)

| 상태 | 할 일 | 메모 |
|------|--------|------|
| ☐ | `scan:ui-ko:gate` CI 편입 | [pipeline-principles.md](./pipeline-principles.md) |
| ☐ | 채팅 레거시 → `__SV_CHAT:*` 코드 (선택) | `chatMessageDisplay.ts` |
| ☐ | 테스트·린트·빌드·E2E | `npm test`, `lint:p3-tier3`, `build`, Playwright |

---

## 환경 변수 치트시트 (나중에 실값)

| 변수 | 용도 | 비고 |
|------|------|------|
| `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST` | 공개 호스트(메타·법무 각주) | 기본: Amplify 도메인; 커스텀 전환 시 변경 |
| `MOMO_PARTNER_SECRET_KEY` | MoMo IPN 서명 검증 | 서버만 |
| `NEXT_PUBLIC_GEMINI_API_KEY` | 채팅 번역 등 | 선택 |
| `NEXT_PUBLIC_MY_S3_*` | 이미지 업로드 | [s3-client.ts](../../frontend/src/lib/s3-client.ts) |

*(그 외 `APP_SYNC_*`, DB, OAuth, Sentry 등은 [pre-launch-closure.md](./pre-launch-closure.md) 참고.)*

---

*갱신 팁: 위 표에서 끝낸 행은 ✅로 바꾸고, 날짜·담당·링크를 한 줄만 남겨도 추적에 충분하다.*
