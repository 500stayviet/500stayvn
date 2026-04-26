# App API security and error contract

## AppApi envelope (JSON responses under `/api/app/*`)

**운영 로그 및 모든 `/api/app/*` JSON API는 표준 봉투 규격을 준수한다:** 성공 `{ "ok": true, "data": … }` (`appApiOk`), 실패 `{ "ok": false, "error": { "code", "message" } }` (`appApiError`). 클라이언트는 가능하면 `unwrapAppApiData`로 성공 본문을 읽는다.

**예외 (비-JSON):** `GET /api/app/chat/rooms/[id]/events` 는 SSE용으로 `ReadableStream` 기반 `Response`를 반환하며, JSON 봉투를 쓰지 않는다. 사전 검증 실패 시에만 `appApiError` JSON이 반환될 수 있다.

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

## Listing boundary (updated)

- `/api/app/users`, `/api/app/properties`, `/api/app/bookings`
  - 사용자 컨텍스트 기준으로 동작하며 `limit/offset/cursor` 페이지네이션을 지원합니다.
  - 일반 앱 actor는 자기 스코프 데이터로 제한됩니다.
- `/api/admin/users`, `/api/admin/properties`, `/api/admin/bookings`
  - 관리자 목록 조회 전용입니다.
  - admin session cookie 기반으로만 접근 가능합니다.

## Lint guardrail (P3)

- **CI / Amplify (빌드 전):** **`npm run lint:p3-tier3`** = `lint:p3-tier2` (`lint:api` + `lint:server`) + `lint:p3-lib` (`src/lib/**`, server 제외) + `lint:p3-components`, 모두 `--max-warnings 0`.
- **전역 앱·페이지:** **`npm run lint`** = `eslint . --max-warnings 0` (`frontend` 루트).
- 빠른 로컬만: **`npm run lint:api-app`** (앱 BFF `/api/app` 한정).
- 상세 원칙·파이프라인 순서: `docs/qa/pipeline-principles.md`.

## 상용 오픈 전 필수 체크리스트 (웹훅 · 멱등 · 대외 연동)

상용 트래픽 전에 아래를 **문서·코드·운영 설정** 기준으로 점검한다. 미적용 항목은 “의도적 제외”와 담당·일정을 남긴다.

| 구분 | 점검 항목 | 메모 |
|------|-----------|------|
| 웹훅 수신 | 결제/정산/은행·PG 등 **외부 웹훅** 수신 라우트가 있는가 | Raw body 보존, 공급자 문서의 **서명 검증**(HMAC, 타임스탬프, replay window) 구현 여부 |
| 웹훅 발신 | 우리가 외부로 보내는 콜백이 있는가 | 재시도 시 **중복 처리** 방지, 타임아웃·서명(필요 시) |
| 멱등성 | 동일 요청 재전송 시 이중 과금·이중 환불이 가능한가 | **`Idempotency-Key`**(또는 동등 키) 저장·TTL·중복 거부 정책 |
| 결제/환불 | 부분 성공·네트워크 재시도 | 트랜잭션 경계, 상태 머신, 감사 로그 |
| 시크릿 | 웹훅·API 키 | 환경 변수·로테이션, 저장소/로그 유출 금지 |
| 감사 | 분쟁·규제 대응 | 요청/응답 요약 로그(민감값 마스킹), 보관 기간 |

## Rollout notes

1. Deploy client changes that call `withAppActor()` before or with the server changes.
2. Keep `APP_SYNC_ENFORCE_WRITE` off until the BFF sends `x-app-sync-secret` for import/PUT sync.
3. No `APP_API_ENFORCE_ACTOR` flag is required anymore for owner checks — those routes always enforce `x-app-actor-id` where documented above.
