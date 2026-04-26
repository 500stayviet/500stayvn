# Refactor Backlog (Code-First)

## Objective

Complete the pre-corporation engineering goal first:

- release-ready web/app skeleton
- stable operations and regression safety
- minimal blast radius for future feature and provider changes

This backlog intentionally prioritizes **code hardening** over app-store packaging and commercial API onboarding.

---

## 1-1 완료 기준: 상위 타깃 파일 분해 계획

아래 **15개 파일**에 대해 `상태 · 액션 · 표현 · API/서버 연동` 네 축으로 무엇을 어디로 옮길지가 구체적으로 적혀 있으면 1-1을 만족한다.

우선순위는 **장애 영향도·변경 빈도·파일 크기**를 반영했다.

| 순위 | 파일 | 상태 (State / 훅) | 액션 (Handlers) | 표현 (UI) | API·서버 연동 | 현재 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `frontend/src/lib/api/auth.ts` | 세션·역할·리다이렉트용 `useAuth` 파생 훅으로 분리 | 로그인·로그아웃·역할 갱신을 `authActions.ts` 등 | (클라이언트 위주면 UI 없음) | Route Handler·`fetch` 래퍼·에러 매핑 일원화 | **미분해 대형** |
| 2 | `frontend/src/lib/api/bookings.ts` | 읽기/캐시/목록 상태를 `bookingsStore.ts` | 생성·취소·동기화를 `bookingsMutations.ts` | — | 서버 API·로컬 스토리지 경로 명시 | **미분해 대형** |
| 3 | `frontend/src/lib/api/properties.ts` | 이미 `propertiesStore` 등으로 분리됨 | `propertiesMutations`·`Lifecycle` | — | `sync`/bootstrap은 `propertiesRuntime` | **오케스트레이션·재 export 중심. 잔여 얇게 정리** |
| 4 | `frontend/src/components/PropertyDetailView.tsx` | `usePropertyDetailState` | `usePropertyDetailActions` | 섹션별 `components/property-detail/*` | `getProperty`·예약 구간 호출은 훅에서만 | **미분해 대형** |
| 5 | `frontend/src/app/profile/my-properties/page.tsx` | 기존 `useMyPropertiesPageState` 확장·정리 | 탭·삭제·광고종료·중복확인 → `useMyPropertiesActions` | 리스트/모달만 컴포넌트 | `properties` API 호출은 훅 | **부분 분해, 페이지 더 얇게** |
| 6 | `frontend/src/app/profile/edit/page.tsx` | `useProfileEditState` | OTP·저장·검증 → `useProfileEditActions` | 폼 섹션 컴포넌트 | `/api/app/users`·OTP 라우트 | **미분해 대형** |
| 7 | `frontend/src/app/profile/settlement/page.tsx` | `useSettlementPageState` | 정산·출금 액션 훅 | 카드/테이블 컴포넌트 | finance API 일원화 | **미분해 대형** |
| 8 | `frontend/src/components/TopBar.tsx` | 알림·역할·언어 상태 훅 | 메뉴·로그아웃 핸들러 분리 | `TopBar*` 프레젠테이션 | 배지·세션 fetch는 훅 | **미분해 대형** |
| 9 | `frontend/src/components/AddressVerificationModal.tsx` | 모달 열림·입력·지도 상태 훅 | 확인·취소·제출 액션 훅 | 스텝 UI만 컴포넌트 | 지오코딩·저장 API | **미분해 대형** |
| 10 | `frontend/src/app/add-property/page.tsx` | `useAddProperty*` 훅으로 이전 완료 목표 | 제출·이미지·시설은 액션 훅 | 섹션 컴포넌트만 | `addProperty` 등 | **진행 중·마감 점검** |
| 11 | `frontend/src/app/kyc/hooks/useKycPageState.ts` | 단계·에러·mock 분기 명시 | 단계별 `handle*`는 `kycActions.ts`로 | `page.tsx`는 조합만 | Provider만 주입 | **로직 집중, 단계별 분리 여지** |
| 12 | `frontend/src/components/kyc/IdDocumentStep.tsx` | 캡처 상태 머신 훅 | 업로드·다음 단계 액션 | 프레젠테이션만 | `kycProvider` | **미분해 대형** |
| 13 | `frontend/src/components/kyc/PhoneVerificationStep.tsx` | OTP 입력·타이머 상태 훅 | send/verify 액션 | UI만 | OTP Provider | **미분해 대형** |
| 14 | `frontend/src/components/kyc/FaceVerificationStep.tsx` | 촬영·재시도 상태 훅 | 완료/스킵 액션 | UI만 | KYC Provider | **미분해 대형** |
| 15 | `frontend/src/app/host/bookings/page.tsx` | 필터·탭·선택 행 상태 훅 | 확정·취소 등은 액션 훅 | 테이블·모달 분리 | 예약·결제 API | **미분해 대형** |

---

## Priority Policy

1. P0: reliability and domain correctness
2. P1: large mixed-responsibility files (page/hook/component split)
3. P2: shared API/error contract normalization
4. P3: lint debt cleanup for touched risk areas

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
- Done when:
  - transition tests pass for all critical status branches
  - UI reflects failure paths deterministically

### P0.2 Core mock regression set

- Scope:
  - `frontend/tests/e2e/mock-scenario-regression.spec.ts`
- Work:
  - keep `success|fail|partial` core flows green
  - prevent flake with robust selectors and stable seeded state
  - **CI PR smoke에 mock 시나리오 일부 편입** (현재 smoke 목록에 없음 → `frontend-quality.yml` 보강)
- Done when:
  - chromium run is consistently green locally and in CI

## P1 - High-Impact Refactor Targets (Largest mixed files)

### P1.1 API/service split targets

**`properties` 도메인 (진행됨 — 시그니처 유지)**

- `frontend/src/lib/api/properties.ts` — 퍼블릭 API·얇은 래퍼·re-export
- `frontend/src/lib/api/propertiesHelpers.ts` — 날짜·관리자 필터 유틸
- `frontend/src/lib/api/propertiesStore.ts` — 캐시·동기화·hydration
- `frontend/src/lib/api/propertiesAdmin.ts` — 관리자 인벤토리
- `frontend/src/lib/api/propertiesLifecycle.ts` — 취소/병합/분할 라이프사이클
- `frontend/src/lib/api/propertiesMutations.ts` — add/update/delete/호스트 액션
- `frontend/src/lib/api/propertiesQueries.ts` — 소유자 목록·예약 구간 집계
- `frontend/src/lib/api/propertiesRuntime.ts` — sync/bootstrap/취소 로그 등 런타임

**아직 대형**

- `frontend/src/lib/api/bookings.ts` (~2.7k lines)
- `frontend/src/lib/api/auth.ts` (~3.0k lines)

Goal:

- split by domain responsibility (read/write/transform/cache/bootstrap)
- keep external API signatures stable

### P1.2 UI domain split targets

- `frontend/src/components/PropertyDetailView.tsx`
- `frontend/src/components/AddressVerificationModal.tsx`
- `frontend/src/components/TopBar.tsx`
- `frontend/src/app/profile/settlement/page.tsx`
- `frontend/src/app/profile/edit/page.tsx`
- `frontend/src/app/profile/my-properties/page.tsx`
- `frontend/src/app/add-property/page.tsx`
- `frontend/src/app/host/bookings/page.tsx`
- Goal:
  - page/screen composition only
  - `hooks/` for state+effects, `components/` for presentation

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
  - changed routes emit uniform success/failure structure
  - client handlers no longer need per-route ad-hoc parsing

## P3 - Lint Debt Guardrail

- Scope:
  - files touched in P0/P1/P2
- Work:
  - remove warnings introduced or exposed by refactor
  - block warning growth in changed modules
- Done when:
  - no new lint/type warnings in modified files

## Phase 1 보완 (플랜 누락 방지)

- **Amplify + GitHub Actions**: 동일한 품질 게이트 원칙을 문서에 명시 (배포만 다른 파이프라인).
- **Prisma / DB 마이그레이션**: 로컬·CI·운영 DB 적용 규칙을 `docs/qa`에 추가 권장.
- **웹훅·idempotency·서명 검증**: 상용 전에 코드 “자리”와 정책 초안 점검 (Phase 4 전제).

---

## 권장 실행 순서 (총 플랜 반영)

1. **1-1** 본 문서 유지·타깃 표 갱신 (이 섹션)
2. **P2.1** API/에러 계약 통일 (트래픽 높은 `app` 라우트부터)
3. **P1.2** 페이지 조합화 (PropertyDetailView → settlement → edit → my-properties 등)
4. **P1.3** KYC 단계 컴포넌트·`useKycPageState` 분리
5. **P1.1** `bookings.ts` / `auth.ts` 모듈 분해
6. **P0.1** 상태전이·테스트 잔여 (결제 라우트·KYC 단위 테스트 등)
7. **P0.2** mock E2E smoke 편입 + flaky 기준 정리
8. **1-5 게이트** `npm run build`, `npx tsc --noEmit`, 핵심 E2E, CI·Amplify green
9. **2-1** `docs/qa/ci-runtime-policy.md` + workflow 버전 정책
10. **2-3** Sentry·알람·담당자 운영 점검
11. **Phase 3** 앱 패키징·스토어 제출물
12. **Phase 4** 상용 API·웹훅·실거래 검증

## Fixed Completion Gate

For each merged backlog slice:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx playwright test tests/e2e/mock-scenario-regression.spec.ts --project=chromium --workers=1` (또는 smoke에 편입된 동등 스펙)
4. CI green on GitHub Actions and Amplify
