# Refactor Milestones

## 2026-04-23

- `add-property` 1st refactor complete (composition-oriented page + section split)
  - `ca26443`, `5b7b300`, `b4828db`
- `useAddPropertySubmit` 2nd cleanup complete (domain-based form state types)
  - `95256e7`
- `kyc/page.tsx` composition-first migration started and expanded
  - State/effect hook + progress/modal extraction: `55a3bc5`
  - Step content renderer extraction: `f68470d`
- `profile/my-properties/[id]/edit/page.tsx` composition-first refactor complete
  - State/submission orchestration hooks + section components: `3ae69e5`
- `profile/my-properties/page.tsx` 1st refactor complete
  - State hook + header/list/dialog section split: `a3eb9f9`
- `my-properties` regression E2E added and stabilized
  - Tab transitions + ended edit duplicate-live guard flow: `525f51a`
- `profile/my-properties/[id]/page.tsx` 1st refactor complete
  - Detail page state hook extraction + composition cleanup: `8f77589`
- Frontend route performance optimization completed (1st wave)
  - `/map` first-load JS: `497k -> 143k` (`1a65663`)
  - `/add-property` first-load JS: `590k -> 253k` (`1a65663`)
  - `/profile/my-properties/[id]/edit` first-load JS: `541k -> 109k` (`1a65663`)
  - `/profile/edit` first-load JS: `273k -> 155k` (`884571a`)
  - `/kyc` first-load JS: `247k -> 193k` (`884571a`)

## 2026-04-24

- `my-properties` regression E2E expanded
  - Duplicate-live modal cancel branch (`No`) coverage added
  - Existing flow retained: tab transitions + ended edit + duplicate-live confirm (`Yes`)
- `add-property/page.tsx` decomposition follow-up completed
  - Page-level state/handler orchestration moved into `useAddPropertyPageState`
  - `page.tsx` now focuses on composition wiring of section components
- `profile/my-properties/page.tsx` decomposition phase 2 completed
  - Dialog confirm action logic moved from page into `useMyPropertiesPageState`
  - Added state action handlers: pending->ended confirm + duplicate-live confirm navigation
- Provider slot switching introduced with env toggle
  - Added `NEXT_PUBLIC_USE_MOCK` based switch in provider resolver
  - Added `Payment`/`KYC`/`Bank`/`Otp` mock providers (`mockProviders.ts`) and connected to provider getters
- Mock provider scenario flags expanded
  - `success | fail | partial` can now be selected by env/query (`NEXT_PUBLIC_MOCK_SCENARIO`, `?mockScenario=`) for QA/E2E replay
- CI install policy restored to strict `npm ci` only
  - Removed `npm install` fallback in GitHub Actions and Amplify install phases (`4b46f60`)
  - Aligned `frontend/package-lock.json` with npm `10.8.2` used in CI to prevent `npm ci` EUSAGE mismatch (`8e695ea`)
- Amplify deploy pipeline stabilized and recovered
  - Buildspec parsing fixes + bounded npm debug logs + deploy recovery (`dc12cfb`, `25abc24`, `5f94251`)
  - Current production deploy resumed successfully (`Deploy 90`)
- Performance re-measurement snapshot (post-provider/refactor updates)
  - `/map` first-load JS: `143 kB` (stable)
  - `/add-property` first-load JS: `254 kB`
  - `/profile/my-properties` first-load JS: `215 kB`
  - `/profile/my-properties/[id]/edit` first-load JS: `109 kB` (stable)
  - `/profile/edit` first-load JS: `160 kB`
  - `/kyc` first-load JS: `198 kB`
  - `/booking` first-load JS: `179 kB`

## Next Sequence

1. Keep strict `npm ci` green on both GitHub Actions and Amplify (monitor next deploy cycle)
2. Add E2E cases for `mockScenario=fail|partial` critical flows
3. Plan Node 20 deprecation 대응 for Actions runtime/tooling

## Completion Gate

For declaring a phase complete:

1. `npm run build` passes on latest `main`
2. Latest CI run is green
3. New lint/type warnings are not introduced in changed files
