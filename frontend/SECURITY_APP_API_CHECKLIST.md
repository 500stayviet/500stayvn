# App API security and error contract

**진입 전 전역 클로저(법무·Sentry·일정·신뢰 구간):** [`docs/qa/pre-launch-closure.md`](../docs/qa/pre-launch-closure.md)

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

## 중요 쓰기(POST/PATCH) API의 멱등성 설계 원칙

**목표:** 네트워크 재시도·더블 탭·프록시 중복으로 **같은 의도의 요청이 두 번 이상** 도착해도 **돈·재고·원장이 한 번만** 바뀐다.

1. **키 계약**  
   - 클라이언트(또는 웹훅 게이트웨이)는 **의미 있는 범위**마다 고정 키를 쓴다. (예: “이 예약의 결제 확정 시도”당 하나의 UUID를 `sessionStorage` 등에 보존해 재시도 시 재사용.)  
   - 서버는 키를 **원장에 저장**하고, 동일 키·동일 리소스에 대한 **재요청은 이전 성공 결과와 동등한 응답**을 돌려준다.  
   - **같은 키로 상충하는 본문**(이미 성공한 상태를 실패로 덮으려 함 등)은 **409** 등으로 거절한다.

2. **저장 위치**  
   - `POST /api/app/payments`: 본문 `idempotencyKey` — `PaymentRecord`에 유니크 저장, 중복 생성 방지.  
   - `PATCH /api/app/payments/[bookingId]`: 본문 `idempotencyKey` — 해당 예약의 최신 `PaymentRecord` 행에 기록되며, **이미 paid이고 키가 일치**하면 결제 UPDATE를 생략하고 **예약 전이만 멱등 재실행**하거나(복구), 이미 **confirmed**이면 **동일 성공 의미의 `transition`**만 반환한다. 구현: `paymentPatchIdempotency.ts` + 라우트 트랜잭션.

3. **클라이언트 가이드 (결제 확정)**  
   - 앱 예약 결제 완료 시 `completePayment` → `patchPaymentMetaByBooking`에 **`idempotencyKey`**를 포함한다.  
   - 키는 예약 ID별로 **탭 세션 동안 불변**(`stayviet:payConfirmIdem:<bookingId>` in `sessionStorage`)으로 두어, 실패 후 재시도 시 **같은 키**가 서버에 전달되게 한다.

4. **운영**  
   - 로그/알람에 민감정보와 키 전체를 남기지 말 것(필요 시 해시·마스킹).  
   - 신규 중요 POST/PATCH 추가 시 본 절을 따라 **키 스코프·충돌 코드·DB 유니크**를 설계한다.

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

## 결제 웹훅 연동 시: 서명 검증 (설계 예약)

실제 PG·지갑(MoMo 등) 웹훅을 붙일 때 **요청 신원·무결성**을 검증하지 않으면 위조 콜백으로 예약·환불 상태가 오염될 수 있다. 아래는 **구현 위치 가이드**이며, 구체 알고리즘은 PG 문서를 따른다.

### 권장 배치

| 항목 | 내용 |
|------|------|
| **수신 라우트** | `frontend/src/app/api/...` 하위 전용 경로. **골격:** `app/api/webhook/momo/route.ts` (Phase 4에서 서명·멱등·전이 연결). BFF와 동일 프로세스에서 Prisma 트랜잭션까지 이어질 수 있게 둔다. |
| **검증 레이어** | 라우트 핸들러 **최상단**: raw body 확보 → 서명 헤더·타임스탬프 추출 → **본문 파싱 전**에 검증 실패 시 `401`/`403` 및 짧은 응답. |
| **비즈니스 반영** | 검증 성공 후에만 JSON 파싱 → 내부적으로 기존 **`PATCH /api/app/payments/[bookingId]`** 와 동일한 규칙(멱등 키·`paymentPatchIdempotency`·`transitionBookingOnPaymentUpdate`)을 호출하는 **서버 전용 헬퍼**로 모은다. 웹훅 핸들러에 도메인 로직을 장황하게 넣지 않는다. |

### 구현 체크리스트

1. **Raw body**  
   Next.js `Request`에서 서명 계산에 쓰는 **바이트 그대로**의 문자열/버퍼를 사용한다. `JSON.parse` 후 재직렬화한 문자열로 HMAC 검증하면 실패한다. (`request.text()` 등으로 한 번만 읽고 검증·파싱에 공유.)

2. **상수 시간 비교**  
   기대 서명과 비교할 때 타이밍 공격을 피하기 위해 플랫폼 제공 **`timingSafeEqual`**(또는 동등)을 사용한다.

3. **Replay 방지**  
   PG가 타임스탬프·이벤트 ID를 주면, 허용 시각 윈도우 밖 요청 거절 및 **처리한 이벤트 ID**를 짧은 TTL 캐시/DB로 중복 거부한다.

4. **시크릿 보관**  
   웹훅 HMAC 키·클라이언트 시크릿은 환경 변수만 사용하고, 로그에 원문·서명 전체를 남기지 않는다.

5. **멱등성**  
   PG가 주는 결제·환불 단위 키를 **`idempotencyKey`**(또는 동등 필드)와 매핑해 `PaymentRecord`·`resolvePaymentPatchIdempotency` 계약과 맞춘다. `SECURITY_APP_API_CHECKLIST.md` 상단 **멱등성 설계 원칙** 절 참고.

6. **테스트**  
   단위: 서명 모듈(유효/무효/타임스탬프 만료). 통합: 기존 `bookingPaymentTransition`·`paymentPatchIdempotency` 테스트와 함께 “웹훅 페이로드 → 동일 전이 결과” 시나리오를 추가한다.

### 코드 앵커 (현재 원장 전이)

- 멱등 PATCH 분기: `frontend/src/lib/server/paymentPatchIdempotency.ts`
- 예약 확정·취소(환불) 전이: `frontend/src/lib/server/bookingPaymentTransition.ts`

## Rollout notes

1. Deploy client changes that call `withAppActor()` before or with the server changes.
2. Keep `APP_SYNC_ENFORCE_WRITE` off until the BFF sends `x-app-sync-secret` for import/PUT sync.
3. No `APP_API_ENFORCE_ACTOR` flag is required anymore for owner checks — those routes always enforce `x-app-actor-id` where documented above.
