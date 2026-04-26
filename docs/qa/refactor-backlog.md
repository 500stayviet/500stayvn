# Refactor Backlog (Code-First)

## Objective

Complete the pre-corporation engineering goal first:

- release-ready web/app skeleton
- stable operations and regression safety
- minimal blast radius for future feature and provider changes

This backlog intentionally prioritizes **code hardening** over app-store packaging and commercial API onboarding.

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
- Done when:
  - chromium run is consistently green locally and in CI

## P1 - High-Impact Refactor Targets (Largest mixed files)

### P1.1 API/service split targets

- `frontend/src/lib/api/properties.ts` (~58 KB)
- `frontend/src/lib/api/bookings.ts` (~28 KB)
- `frontend/src/lib/api/auth.ts` (~23 KB)
- Goal:
  - split by domain responsibility (read/write/transform/cache/bootstrap)
  - keep external API signatures stable

### P1.2 UI domain split targets

- `frontend/src/components/PropertyDetailView.tsx` (~75 KB)
- `frontend/src/components/AddressVerificationModal.tsx` (~57 KB)
- `frontend/src/components/TopBar.tsx` (~35 KB)
- `frontend/src/app/profile/settlement/page.tsx` (~33 KB)
- `frontend/src/app/profile/edit/page.tsx` (~29 KB)
- Goal:
  - page/screen composition only
  - `hooks/` for state+effects, `components/` for presentation

### P1.3 KYC component decomposition follow-up

- `frontend/src/components/kyc/IdDocumentStep.tsx` (~28 KB)
- `frontend/src/components/kyc/FaceVerificationStep.tsx` (~25 KB)
- `frontend/src/components/kyc/PhoneVerificationStep.tsx` (~17 KB)
- Goal:
  - isolate capture state machine from render layer
  - keep test-mode and mock-mode behavior explicit and traceable

## P2 - API/Error Contract Normalization

### P2.1 Contract baseline

- Scope:
  - app API routes that still mix custom error shapes
- Work:
  - align to shared `AppApi` success/failure envelope
  - centralize error mapping and user-safe messages
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

## Execution Order (Next 2 Sprints)

### Sprint A (stability first)

1. P0.1 transition hardening + tests
2. P0.2 mock scenario regression stabilization
3. P2.1 shared API/error alignment (high-traffic routes first)

### Sprint B (structural split)

1. P1.1 `properties.ts` split
2. P1.2 `PropertyDetailView.tsx` and `profile/settlement/page.tsx` split
3. P1.3 KYC step component decomposition follow-up

## Fixed Completion Gate

For each merged backlog slice:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx playwright test tests/e2e/mock-scenario-regression.spec.ts --project=chromium --workers=1`
4. CI green on GitHub Actions and Amplify
