# App API security and error contract

## Error JSON (mutations and guarded reads)

Failures use a single shape when returned from hardened handlers:

```json
{
  "ok": false,
  "error": {
    "code": "actor_required",
    "message": "Human-readable detail."
  }
}
```

**Exceptions (auth compatibility):**

- `POST /api/app/auth/login` — may return `{ error: { code, message } }` without `ok` (legacy).
- `POST /api/app/users` (signup) — `409` may return `{ error: { code, message } }` (legacy).

## Client requirement: `x-app-actor-id`

Browser callers of **owner-scoped writes**, **bulk sync writes** (with sync secret), and **sensitive reads** must send:

```http
x-app-actor-id: <current app user id>
```

Implemented via `withAppActor()` in `@/lib/api/withAppActor` (merged into `fetch` / `fetchWithRetry` init from app client modules).

## Enforcement: sync secret (env-gated)

When `APP_SYNC_ENFORCE_WRITE=true` and `APP_SYNC_SECRET` is set, these endpoints require header `x-app-sync-secret`:

| Method | Path |
|--------|------|
| PUT | `/api/app/properties` |
| POST | `/api/app/properties/import` |
| PUT | `/api/app/bookings` |
| POST | `/api/app/bookings/import` |
| POST | `/api/app/users/import` |

## Actor and ownership (always on)

| Method | Path | Policy |
|--------|------|--------|
| PATCH | `/api/app/users/[id]` | Actor equals `[id]` **or** valid **admin session** (`getAdminFromRequest`). Admin may only set: `blocked`, `blockedAt`, `blockedReason`, `verification_status`, `role`, `deleted`, `deletedAt`. |
| DELETE | `/api/app/users/[id]` | Actor must equal `[id]`. |
| DELETE | `/api/app/properties/[id]` | Actor must be property `ownerId`. |
| POST | `/api/app/chat/rooms` | Actor must be booking guest or owner. |
| POST | `/api/app/chat/rooms/[id]/messages` | Actor must equal `senderId` and be a booking participant. |
| PATCH | `/api/app/chat/rooms/[id]/read` | Actor must be booking guest or owner. |
| POST | `/api/app/payments` | Actor must be booking guest or owner (`userId` in body must match participant). |
| PATCH | `/api/app/payments/[bookingId]` | Actor must be booking guest or owner. |

## Sensitive reads (scoped + actor)

| Method | Path | Policy |
|--------|------|--------|
| GET | `/api/app/chat/rooms` | Query must include `userId` and/or `bookingId`. If `userId` set: actor must match. If `bookingId` set: actor must be participant. |
| GET | `/api/app/chat/rooms/[id]/messages` | Actor must be participant in the room’s booking. |
| GET | `/api/app/chat/unread-counts` | Actor must match `userId` query param. |
| GET | `/api/app/payments` | Query must include `userId` and/or `bookingId`. Same actor rules as rooms. |

## Public-by-design (no actor)

| Method | Path |
|--------|------|
| POST | `/api/app/auth/login` |
| POST | `/api/app/users` |

## Admin-only (not under `/api/app/*`)

All `/api/admin/*` routes use **admin session cookie** (`getAdminFromRequest`). They are **not** covered by `x-app-actor-id`.

## Public listing (known limitation)

`GET /api/app/users`, `GET /api/app/properties`, `GET /api/app/bookings` return broad lists for the current app shell. Tightening these (pagination, actor, or admin-only) is a follow-up hardening step.

## Rollout notes

1. Deploy client changes that call `withAppActor()` before or with the server changes.
2. Keep `APP_SYNC_ENFORCE_WRITE` off until the BFF sends `x-app-sync-secret` for import/PUT sync.
3. No `APP_API_ENFORCE_ACTOR` flag is required anymore for owner checks — those routes always enforce `x-app-actor-id` where documented above.
