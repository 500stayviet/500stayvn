# Refactor Backlog (Code-First)

**Last synced:** 2026-04-27 — **P3 린트 가드레일 전역 적용 완료 (졸업):** `npm run lint` = `eslint . --max-warnings 0`; CI `lint:p3-tier3`(API·server·lib·components). Gate: `tsc`·`build`·`lint`·mock E2E.

## Objective

Complete the pre-corporation engineering goal first:

- release-ready web/app skeleton
- stable operations and regression safety
- minimal blast radius for future feature and provider changes

This backlog intentionally prioritizes **code hardening** over app-store packaging and commercial API onboarding.

---

## 1-1) 리팩터 잔여 맵 (타깃 10~15 + 분해 4축)

**1-1 완료 기준:** 아래 **§ 잔여 타깃** 표에 **최소 10행**이 `상태 / 액션 / 표현(UI) / API·서버` 네 축으로 **옮길 위치**가 **문장**으로 구체적이면 충족.  
(이 문서는 **실제 진행**과 동기화한다 — 완료 시 표의 “현황” 열을 갱신.)

### A. 이미 “조합 전용 page + 훅 + 뷰(±Suspense)” 패턴 적용된 항목 (요약)

| 구분 | 경로(대표) | 비고 |
| --- | --- | --- |
| 예약/결제 흐름 | `app/booking/`, `app/booking-success/` | `useBookingPage` / `BookingPageView` 등 |
| 호스트 | `app/host/bookings/` | `useHostBookingsPage` + `HostBookingsPageView` + Suspense |
| 마이/프로필 | `app/my-bookings/`, `app/profile/edit/`, `app/profile/reservations/`, `app/profile/settlement/`, `app/profile/my-properties/`, `app/profile/my-properties/[id]/*` | 훅+뷰+Suspense(해당 시) — 마일스톤·코드베이스 기준 |
| 추가 매물 | `app/add-property/` | `useAddPropertyPageState` + `AddPropertyPageView` |
| KYC(라우트) | `app/kyc/` | `useKycPageState` + `KycPageView` |
| 검색/지도(라우트) | `app/search/`, `app/map/` | 콘텐츠는 컴포넌트·훅으로 분리됨 (맵 `MapPageContent` 동적) |
| 어드민(대다수) | `app/admin/users/`, `app/admin/users/[uid]/`, `app/admin/withdrawals/`, `app/admin/settlements/`, `app/admin/kyc/`, `app/admin/system-log/`, `app/admin/properties/`, `app/admin/properties/[id]/`, `app/admin/admin-accounts/` 등 | 훅+뷰+Suspense(해당 시) — 세션에서 정리 |
| 루트 홈 | `app/page.tsx` | 이미 얇은 조합 (컴포넌트 위임) |

### B. 1-1 **잔여** 타깃 — 분해 계획 (우선순위 P1=높음)

`상태` = `useXxxState` / 로컬 state·`useEffect` / 도메인 틱.  
`액션` = `useXxxActions` 또는 훅 내 `*Handler` (사용자·관리자 제스처).  
`표현` = `*PageView` / `*Section` / 프레젠테이션 전용.  
`API` = `fetch`/Route Handler/서버 모듈 호출(한 파일에 몰지 않기).

| 우선 | 파일/범위 | 상태 (어디로) | 액션 (어디로) | 표현 (어디로) | API·서버 (어디로) | 현황·TODO |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | `frontend/src/app/admin/contracts/page.tsx` | `useAdminContractsPage` — 탭·로드·선택·페이지 틱 | `approve`/`void` 등은 훅 `contractsActions` (향후; 현재는 조회+신규 ack) | `AdminContractsPageView` + 카드 리스트 섹션 | `lib/api` 계약/예약 래퍼·기존 `AdminSettlementStyleCard` 유지 | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P1 | `frontend/src/app/admin/refunds/page.tsx` | `useAdminRefundsPage` — 필터·목록·로딩 | 환불 승인 → 훅 `approveRefund` (보류/거절 UI 없음) | `AdminRefundsPageView` + 카드 리스트 | admin finance·환불 API — `approveRefundBooking` 등 | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P1 | `frontend/src/app/admin/audit/page.tsx` | `useAdminAuditPage` — 탭(범주·24h 신규)·검색·원장/모더레이션 로드 | 신규 탭 ack·새로고침 `refresh` (CSV export는 미구현) | `AdminAuditPageView` (테이블·모바일 카드) | `getAdminFinanceLedgerEntries`·`adminModeration`·`admin/accounts/directory` | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P1 | `frontend/src/components/PropertyDetailView.tsx` | `usePropertyDetailImageSlider`·`usePropertyDetailBooking` | 예약 CTA `bookNow` (훅) | `PropertyDetailImageHero` / `PropertyDetailOwnerImageOverlay` / `PropertyDetailTenantContent` / `PropertyDetailOwnerContent` / `PropertyDetailFacilitiesSection` | `getBookedRangesForProperty`·iCal·`/booking` — 기존 경로 유지 | **완료** (2026-04-26, `npx tsc --noEmit` OK; 맵/TopBar는 별행) |
| P1 | `frontend/src/lib/api/bookings.ts` | `bookingsState`·`bookingsQueries` / `bookingsMutations`·`bookingsPaymentMeta` + 얇은 `bookings` | (동일) | — (비 UI) | `@/lib/api/bookings` re-export·**시그니처·경로 유지** | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P1 | `frontend/src/lib/api/auth.ts` | `authState` / `authUserSyncQuery` (조회·부트스트랩) | `authAccountMutations` (가입·로그인·PATCH·탈퇴) | — | `appUserApiParse`·`readResponseJsonOrMarker`·`@/lib/api/auth` re-export | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P2 | `frontend/src/components/TopBar.tsx` | `useTopBarState` (언어·드로어·알림 카운트) | 메뉴·로그아웃 | `TopBarView` + 작은 하위 | 배지/세션 fetch — 훅 | **완료** (2026-04-26, `npx tsc --noEmit` OK; `topbar/useTopBarState`·`TopBarView`) |
| P2 | `frontend/src/components/AddressVerificationModal.tsx` | `useAddressVerificationModalState` | 확인·취소·제출 | `AddressVerificationModalView` | `addressTextFormatters`+지도·API | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P2 | `frontend/src/components/kyc/IdDocumentStep.tsx` | `useIdDocumentStepState` | 촬영·폼 | `idDocument/IdDocumentStepView` | `kyc` Provider | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P2 | `frontend/src/components/kyc/PhoneVerificationStep.tsx` | `usePhoneVerificationStepState` | send/verify | `PhoneVerificationStepView` | OTP Provider | **완료** (2026-04-26, `kyc/phone/*`) |
| P2 | `frontend/src/components/kyc/FaceVerificationStep.tsx` | `useFaceVerificationStepState` | 촬영·스킵 | `face/FaceVerificationStepView` | KYC Provider | **완료** (2026-04-26, `kyc/face/*`) |
| P2 | `frontend/src/app/kyc/hooks/useKycPageState.ts` | `loadKycProgressFromUser` | 단계 전환 | `KycPageView` 유지 | mock/real Provider | **부분** — 진행 로드 모듈 분리; 액션 파일 추가 분리는 선택 |
| P3 | `frontend/src/app/admin/property-logs/page.tsx` | `useAdminPropertyLogsPage` — 탭·캐시 `tick` | 새로고침 `refresh` | `AdminPropertyLogsPageView` (테이블) | `adminPropertyActionLogs` 캐시 | **완료** (2026-04-26, `npx tsc --noEmit` OK) |
| P3 | `frontend/src/hooks/map/useMapPageState.ts` + `MapPageContent.tsx` | `useMapUrlLocation` (쿼리) + `useMapPropertySelection` (목록·선택) | `useMapPageState`가 조합 | `MapPageContent` 얇게 유지 | Geocode/Grab | **완료** (2026-04-26, `mapTypes`·子 훅) — 마커 내부는 `useGrabMapMarkers` |

**총 15행(위 표):** P1~P3로 잔여 작업·계획이 한눈에 보이도록 고정. 완료 시 `현황`을 `완료`로 바꾸고, 필요하면 `refactor-milestones.md`에 커밋/날짜를 추가.

### C. 1-1에서 **제외(또는 사실상 완료)** — 예전 백로그 정정

- **`profile/edit`**, **`host/bookings`**, **`profile/settlement`**, **`my-bookings`**, **`profile/reservations`**, **`add-property` (라우트)**: 이미 page 조합 + 훅/뷰. 추가 분해는 *내부* 품질(액션 파일 분리)만 선택.
- **어드민 대시보드** `app/admin/page.tsx`: 짧은 조합; **1-2 “핵심” 대상 아님** (필요 시 `useAdminDashboardCards` 정도).

---

## Priority Policy

1. P0: reliability and domain correctness
2. P1: large mixed-responsibility files (page/hook/component split) **또는** 대형 `lib/api/*`
3. P2: shared API/error contract normalization
3. P3: lint debt cleanup for touched risk areas

## P0 - Reliability And Domain Safety

### P0.1 Booking/Payment/KYC transition reliability

- Scope:
  - `frontend/src/lib/server/bookingPaymentTransition.ts`
  - `frontend/src/app/api/app/payments/route.ts`
  - `frontend/src/app/api/app/payments/[bookingId]/route.ts`
  - `frontend/src/app/kyc/hooks/useKycPageState.ts`
- Work:
  - enforce explicit transition rules for success/fail/refund/cancel
  - keep partial/fail branches visible in UI (no silent continue)
  - add missing unit coverage for negative branches
- **완료 (2026-04-27):** 서버 `PATCH /api/app/payments/[bookingId]`의 `data.transition`(`bookingConfirmed` / `bookingCancelled`)를 `parsePaymentPatchData` + `bookingsClient.patchPaymentMetaByBooking`이 소비. 결제 완료 `completePayment`·관리자 환불 `approveRefundBooking` 직후 **`refreshBookingsFromServer`로 캐시=서버** 정렬, 전이에 맞는 **상단 토스트**(`emitUserFacingAppToast` + `AppToastBanner`). KYC/결제 API 실패 UX는 기존 P0.1 1~2차와 동일. (세부: `docs/qa/p0-1-*.md`)
- Done when (체크):
  - [x] `bookingPaymentTransition` 단위 테스트(기존)
  - [x] UI에서 결제 PATCH 전이·실패 경로(배너/토스트/동기화) 반영
  - [x] `parsePaymentPatchData` + 응답 파서 보조 테스트

### P0.2 Core mock regression set

- Scope:
  - `frontend/tests/e2e/mock-scenario-regression.spec.ts`
- Work:
  - keep `success|fail|partial` core flows green
  - prevent flake with robust selectors and stable seeded state
  - **CI PR smoke에 mock 시나리오 일부 편입** (현재 smoke 목록에 없음 → `frontend-quality.yml` 보강)
- **완료 (2026-04-27):** `success|fail|partial` 4 케이스·`/api/app/payments` route 모킹(`transition` 포함)·KYC partial 단계 이탈 방지(선택적 “Next Step” 클릭). `frontend-quality.yml` PR job `e2e-smoke`에 `mock-scenario-regression.spec.ts` 추가.
- Done when (체크):
  - [x] 로컬·CI(Windows PR `e2e-smoke`)에서 chromium 그린 유지(회귀 시 `mock-scenario-regression` 우선 점검)

## P1 - High-Impact Refactor Targets (Largest mixed files)

### P1.1 API/service split targets

**`properties` 도메인 (이미 다중 파일로 쪼개짐 — 시그니처 유지)**

- `frontend/src/lib/api/properties.ts` — 퍼블릭 API·얇한 래퍼·re-export
- `frontend/src/lib/api/propertiesHelpers.ts` — 날짜·관리자 필터 유틸
- `frontend/src/lib/api/propertiesStore.ts` — 캐시·동기화·hydration
- `frontend/src/lib/api/propertiesAdmin.ts` — 관리자 인벤토리
- `frontend/src/lib/api/propertiesLifecycle.ts` — 취소/병합/분할 라이프사이클
- `frontend/src/lib/api/propertiesMutations.ts` — add/update/delete/호스트 액션
- `frontend/src/lib/api/propertiesQueries.ts` — 소유자 목록·예약 구간 집계
- `frontend/src/lib/api/propertiesRuntime.ts` — sync/bootstrap/취소 로그 등 런타임

**1차 분리 (2026-04-26):** `bookingsTypes`+`bookingsClient`(`bookingsState`/`Queries`/`Mutations`)+얇은 `bookings.ts`; `authTypes`+얇은 `auth.ts`(`authState`·`authUserSyncQuery`·`authAccountMutations`). `withAppActor`는 순환 방지로 `getCurrentUserId`→`authState` 직접 참조. 추가 쪼개기는 선택.

Goal:

- domain responsibility (모델 vs 구현) — `properties*` 다파일과 동일한 방향
- keep external import paths/signature stable (`@/lib/api/bookings` / `auth`)

### P1.2 UI domain split targets (1-1 표 B절 **잔여**와 정렬)

- **1-1 B P2~P3 (표 기준) 주요 UI 분해:** KYC 3스텝·주소/TopBar·맵 `useMapPageState` 세분화 등 반영됨. 추가로 손댈 만한 곳: `GrabMap` 내부·E2E만 점검. (`PropertyDetailView`·`admin/property-logs`·어드민 — **완료**.)
- **완료(추가 작업은 선택):** add-property, profile/edit, my-properties·settlement, host/bookings, booking 등 (§ A 참고).
- Goal: page/screen composition only; `hooks/` for state+effects, `components/` for presentation.

### P1.3 KYC component decomposition follow-up

- `frontend/src/components/kyc/IdDocumentStep.tsx`
- `frontend/src/components/kyc/FaceVerificationStep.tsx`
- `frontend/src/components/kyc/PhoneVerificationStep.tsx`
- `frontend/src/app/kyc/hooks/useKycPageState.ts`
- Goal:
  - isolate capture state machine from render layer
  - keep test-mode and mock-mode behavior explicit and traceable

## P2 - API/Error Contract Normalization

### P2.1 Contract baseline

- Scope:
  - app API routes that still mix custom error shapes (`NextResponse.json` 등)
- Work:
  - align to shared `AppApi` success/failure envelope (`appApiOk` / `appApiError`)
  - centralize error mapping and user-safe messages
- Priority routes:
  - bookings, payments, properties, users, finance, auth-adjacent app routes
- Done when:
  - [x] `/api/app/*` JSON 핸들러가 통일된 success/failure 구조를 반환한다 (`NextResponse.json` 직접 사용 없음; SSE 등 비-JSON 스트림은 예외).
  - [x] 우선순위 라우트·운영 로그(`property-action-logs`, `moderation-audit`)·finance·auth 인접 경로 반영.
  - [x] 문서(`SECURITY_APP_API_CHECKLIST.md`)에 봉투 기준 및 SSE 예외 명시.
- **졸업 직전 완료 (2026-04-27):** 전수 검색으로 잔여 `NextResponse.json` 없음 확인; `payments/[bookingId]` 미사용 import 정리. 다음 스프린트는 P2.1을 **완료 처리**하고 P3·P0 후속만 트래킹하면 된다.

## P3 - Lint Debt Guardrail

- Scope:
  - files touched in P0/P1/P2
- Work:
  - remove warnings introduced or exposed by refactor
  - block warning growth in changed modules
- Done when:
  - no new lint/type warnings in modified files
- **1차 (2026-04-27):**
  - `eslint.config.mjs`: PWA 산출물(`public/sw.js`, `workbox-*.js`)·`scripts/**` 무시 — 생성물/유지보수 스크립트가 전체 `eslint .` 실패를 유발하지 않도록.
  - `next.config.ts`: `createRequire`로 `next-pwa` 로드(`no-require-imports` 제거).
  - `npm run lint:api-app`: `src/app/api/app/**/*.ts` 만 `--max-warnings 0` (P2.1 계약과 동일 슬라이스).
  - CI `frontend-quality.yml`: ESLint 스텝 추가(1차 `lint:api-app` → 2차 `lint:p3-tier2` → 3차 `lint:p3-tier3`).
  - ~~**잔여:** 전체 `npm run lint` 그린~~ → **졸업(3차)에서 해소.**
- **2차 (2026-04-27):**
  - `lint:api`·`lint:server`·`lint:p3-tier2` 추가; 이후 CI는 `lint:p3-tier3`로 강화.
  - `/api/auth/*`, `aws-location`, `ical/parse`, `kyc/upload` 및 `bookingPaymentTransition.test.ts`의 `any`/미사용 변수 정리; `prisma.ts`에 `AppPrismaClient` export.
- **3차 — 졸업 (2026-04-27):**
  - **`P3 린트 가드레일 전역 적용 완료 (졸업).** `package.json`의 `lint`를 `eslint . --max-warnings 0`로 고정; `src/app`(페이지)·공유 훅/컨텍스트 등 잔여 경고 0. CI ESLint 스텝은 `npm run lint:p3-tier3`로 서버·공통 모듈·컴포넌트 슬라이스를 게이트.

## Phase 1 보완 (플랜 누락 방지)

- **Amplify + GitHub Actions**: 동일한 품질 게이트 원칙 — **`docs/qa/pipeline-principles.md`** (Lint 0 · 타입 · 단테 · `lint:p3-tier3` · 빌드 · PR E2E). `amplify.yml` 빌드 단계 정렬 반영.
- **Prisma / DB 마이그레이션**: 로컬·CI·운영 DB 적용 규칙을 `docs/qa`에 추가 권장.
- **웹훅·idempotency·서명 검증**: 상용 전에 코드 “자리”와 정책 초안 점검 (Phase 4 전제).

---

## 권장 실행 순서 (총 플랜 반영)

1. **1-1** 본 문서 유지·**§ 1-1 B 표** `현황` 갱신 (PR마다)
2. **P2 UI** (§B 표) — `TopBar` → `AddressVerificationModal` → KYC 스텝 3종 → (선택) `useKycPageState` 내부 정리. **P1.1** `bookings`/`auth` 1차 분리는 **완료**; 심화 분할은 선택.
3. **P2.1** API/에러 계약 통일 — **완료 (2026-04-27)**; `/api/app/*` JSON 봉투·문서·전수 grep 게이트 반영.
4. **P0.1** 상태전이·테스트 (결제 라우트·KYC 단위 테스트 등)
5. **P0.2** mock E2E smoke 편입 + flaky 기준 정리
6. **1-5 게이트** `npm run build`, `npx tsc --noEmit`, 핵심 E2E, CI·Amplify green
7. **2-1** `docs/qa/pipeline-principles.md`(완료) · `docs/qa/ci-runtime-policy.md` + workflow 버전 정책
8. **2-3** Sentry·알람·담당자 운영 점검
9. **Phase 3** 앱 패키징·스토어 제출물
10. **Phase 4** 상용 API·웹훅·실거래 검증

## Fixed Completion Gate

For each merged backlog slice:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npm run lint` (`eslint . --max-warnings 0`; `frontend` 디렉터리). CI 동등 슬라이스: `npm run lint:p3-tier3`.
4. `npx playwright test tests/e2e/mock-scenario-regression.spec.ts --project=chromium --workers=1` (또는 smoke에 편입된 동등 스펙)
5. CI green on GitHub Actions and Amplify

**로컬 게이트 — 완료 (2026-04-27, P3 린트 졸업 검증):**

- [x] **`npm run build`** — 통과
- [x] **`npx tsc --noEmit`** — 통과
- [x] **`npm run lint`** — 통과 (`--max-warnings 0`)
- [x] **`npx playwright test tests/e2e/mock-scenario-regression.spec.ts --project=chromium --workers=1`** — 4/4 tests passed
- [ ] **GitHub Actions / Amplify** — 이 문서는 로컬만 검증; 머지·배포 파이프라인은 별도 확인
