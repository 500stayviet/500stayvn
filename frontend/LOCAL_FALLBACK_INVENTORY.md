# Local Fallback Inventory

This file tracks where browser `localStorage` fallback is used and how to retire it safely.

## Status (core “2번” work)

**Considered done for app ledger / policy:**

- Auth, properties, bookings, reservations: `canReadLocalFallback` / `canWriteLocalFallback`, bootstrap markers, cross-ledger writes via shared helpers where needed.
- Admin finance ledger keys: `readLS` / `writeLS` respect policy.
- Sync UX: `networkResilience` + `stayviet-api-sync-error` + `ApiSyncErrorBanner` queue.

**Optional follow-ups (non-ledger or UI prefs — not blocking “2”):**

- `adminModeration`, `adminAckState`, `adminSystemLog`, `settlementAuditLog`, language/notifications (`LanguageContext`, `TopBar`, etc.): still use `localStorage` for admin UX or preferences; can add the same policy helpers later if these must honor `readonly`/`off`.

## Current fallback-heavy modules

### Core ledger / cache (policy-aware)

- `src/lib/api/auth.ts` — user cache, bootstrap flags (`localStorage` + `sessionStorage` markers via `localBootstrapMarkers`)
- `src/lib/api/properties.ts` — properties cache, bootstrap markers; uses `readBookingsArray` / `writeBookingsArray`, `getAllReservations` / `saveReservationsSnapshot` where cross-ledger writes happen
- `src/lib/api/bookings.ts` — bookings cache + hydration from `/api/app/bookings`; writes gated by policy
- `src/lib/api/reservations.ts` — reservations cache + `saveReservationsSnapshot` (memory always updated; `localStorage` only in `readwrite`)

### Admin / ops (mostly UI + local admin queues)

- `src/lib/api/adminModeration.ts`
- `src/lib/api/adminFinance.ts` — settlement approvals, ledger, bank accounts, withdrawals (`readLS` / `writeLS` respect policy)
- `src/lib/adminAckState.ts`
- `src/lib/adminSystemLog.ts`

### Other UI / i18n (non-ledger but still local)

- Any module still using `localStorage` for preferences (e.g. language) should be listed here as you discover them (`LanguageContext`, nav state, etc.).

## Runtime fallback mode

Use `NEXT_PUBLIC_LOCAL_FALLBACK_MODE`:

- `readwrite` (default): read/write local fallback enabled
- `readonly`: read local fallback, block local writes
- `off`: disable local fallback reads and writes (server/API only)

Implemented in `src/lib/runtime/localFallbackPolicy.ts`.

### Bootstrap markers (session vs durable)

- `src/lib/runtime/localBootstrapMarkers.ts` — for `readonly` / `off`, one-time “ledger import done” flags avoid living only in `localStorage` by also using `sessionStorage`, so duplicate bootstrap loops are reduced without treating browser storage as source-of-truth.

## Standard UX policy on API failure

- Show user-facing toast/error summary
- Keep unsynced change in memory queue where possible
- Retry with exponential backoff
- Provide manual retry button for critical actions

### Implemented baseline

- `src/lib/runtime/networkResilience.ts` adds shared `fetchWithRetry` (exponential backoff).
- Sync/refresh/bootstrap paths in `auth/properties/bookings` now use retry policy.
- Standard client event `stayviet-api-sync-error` is emitted for unified toast/retry UX wiring.
- `src/components/ApiSyncErrorBanner.tsx` listens for that event and shows a small stack (up to 4) of banners with per-item retry/dismiss.

## Retirement steps

1. Set staging to `readonly`; validate no critical regressions.
2. Fix modules still requiring local writes.
3. Set staging to `off`; verify all key flows.
4. Roll out production in phases with monitoring.
