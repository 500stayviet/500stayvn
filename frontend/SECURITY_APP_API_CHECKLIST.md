# App API Write Security Checklist

This document defines the intended authorization policy for mutating `app` APIs.

## Enforcement switches

- `APP_SYNC_ENFORCE_WRITE=true` + `APP_SYNC_SECRET`: protect bulk/import sync endpoints with `x-app-sync-secret`
- `APP_API_ENFORCE_ACTOR=true`: enforce actor ownership checks with `x-app-actor-id`

## Public-by-design endpoints (no actor guard)

- `POST /api/app/auth/login`
- `POST /api/app/users` (signup)

## Sync-secret protected endpoints

- `PUT /api/app/properties`
- `POST /api/app/properties/import`
- `PUT /api/app/bookings`
- `POST /api/app/bookings/import`
- `POST /api/app/users/import`

## Actor/ownership protected endpoints

- `PATCH /api/app/users/[id]` (actor must match `[id]`)
- `DELETE /api/app/users/[id]` (actor must match `[id]`)
- `DELETE /api/app/properties/[id]` (actor must be property owner)
- `POST /api/app/chat/rooms` (actor must be booking guest or property owner)
- `POST /api/app/chat/rooms/[id]/messages` (actor must be sender and room participant)
- `PATCH /api/app/chat/rooms/[id]/read` (actor must be room participant)
- `POST /api/app/payments` (actor must be booking guest or property owner)
- `PATCH /api/app/payments/[bookingId]` (actor must be booking guest or property owner)

## Operational rollout

1. Deploy with `APP_API_ENFORCE_ACTOR=false` (observe logs).
2. Ensure client/BFF attaches `x-app-actor-id`.
3. Turn `APP_API_ENFORCE_ACTOR=true` in staging.
4. Promote to production after smoke tests.
