# Local Fallback Inventory

This file tracks where browser `localStorage` fallback is used and how to retire it safely.

## Current fallback-heavy modules

- `src/lib/api/auth.ts`
- `src/lib/api/properties.ts`
- `src/lib/api/bookings.ts`
- `src/lib/api/adminModeration.ts`
- `src/lib/adminAckState.ts`
- `src/lib/adminSystemLog.ts`
- `src/lib/api/adminFinance.ts`
- `src/lib/api/reservations.ts`

## Runtime fallback mode

Use `NEXT_PUBLIC_LOCAL_FALLBACK_MODE`:

- `readwrite` (default): read/write local fallback enabled
- `readonly`: read local fallback, block local writes
- `off`: disable local fallback reads and writes (server/API only)

Implemented in `src/lib/runtime/localFallbackPolicy.ts`.

## Standard UX policy on API failure

- Show user-facing toast/error summary
- Keep unsynced change in memory queue where possible
- Retry with exponential backoff
- Provide manual retry button for critical actions

### Implemented baseline

- `src/lib/runtime/networkResilience.ts` adds shared `fetchWithRetry` (exponential backoff).
- Sync/refresh/bootstrap paths in `auth/properties/bookings` now use retry policy.
- Standard client event `stayviet-api-sync-error` is emitted for unified toast/retry UX wiring.

## Retirement steps

1. Set staging to `readonly`; validate no critical regressions.
2. Fix modules still requiring local writes.
3. Set staging to `off`; verify all key flows.
4. Roll out production in phases with monitoring.
