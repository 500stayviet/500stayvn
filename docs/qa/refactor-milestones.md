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
- CI install stability hardening applied for GitHub Actions
  - `frontend-quality` workflow now logs latest npm debug tail and falls back to `npm install` when `npm ci` fails (`ef0eedc`)
- Amplify deploy pipeline stabilized and recovered
  - Buildspec parsing fixes + bounded npm debug logs + deploy recovery (`dc12cfb`, `25abc24`, `5f94251`)
  - Current production deploy resumed successfully (`Deploy 90`)

## Next Sequence

1. Finalize remaining large-page refactor targets (composition-first)
2. Keep `my-properties` regression E2E green while adding 1-2 edge cases
3. Track npm lockfile drift cause and return CI/Amp install step to strict `npm ci`-only after root cause is closed

## Completion Gate

For declaring a phase complete:

1. `npm run build` passes on latest `main`
2. Latest CI run is green
3. New lint/type warnings are not introduced in changed files
