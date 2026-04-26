# P0.1 전수 조사: 예약·결제·KYC 상태 전이 (1단계)

**작성:** 2026-04-26  
**범위:** `bookingPaymentTransition` · `/api/app/payments` · `useKycPageState` / `loadKycProgressFromUser`  
**다음 단계(2~5):** 이 문서의 [갭]·[위험] 항목을 근거로 UI 합의 → 서버/클라이언트 보강 → 실패 시나리오 테스트

**2026-04-26 후속:** G1~G6 1차 보강(실패 배너·KYC 등) — `p0-1-failure-ui-matrix.md` 참고.  
**2026-04-27:** `PATCH` 응답 `transition` — `parsePaymentPatchData`·`emitUserFacingAppToast`·`AppToastBanner`·`completePayment`/`approveRefundBooking` + **성공 직후 `refreshBookingsFromServer`**로 UI·캐시 정합. G2(전이→UI) **닫힘**.

---

## 1) `transitionBookingOnPaymentUpdate` (서버, 순수 전이)

**파일:** `frontend/src/lib/server/bookingPaymentTransition.ts`  
**호출자:** `PATCH /api/app/payments/[bookingId]/route.ts` (트랜잭션 내부, 결제 row 업데이트 직후)

### 1.1 입력

| 필드 | 의미 |
| --- | --- |
| `bookingId` | `Booking` 조회 키 |
| `paymentStatus` | PATCH body의 `status`를 trim·lower 한 값 (`undefined` → PATCH에서 `null`로 전달) |
| `refundStatus` | PATCH body의 `refundStatus` (없으면 `null` 유지) |

**유효 "결제 완료" 판정:** `paymentStatus` ∈ { `paid`, `succeeded`, `success`, `completed` } (대소문자 무시)  
**유효 "환불 완료" 판정:** `refundStatus` ∈ { `refunded`, `refund_completed`, `refund_succeeded` }

### 1.2 출력

`{ bookingConfirmed: boolean, bookingCancelled: boolean }` — **동시에 둘 다 true는 아님**

### 1.3 상태 전이 표 (의사 결정)

| 조건 (순서대로 평가) | `Booking` 업데이트 | `bookingConfirmed` | `bookingCancelled` |
| --- | --- | --- | --- |
| 예약 row 없음 | 없음 | false | false |
| `refundStatus`가 환불 집합 **이고** `booking.status` ∈ { `pending`, `confirmed` } | `status` → `cancelled_before` 또는 `cancelled_after`, `detailJson`에 `paymentStatus: 'refund…'`, `cancelReason` 등 | false | true |
| `refundStatus` 환변이지만 `booking.status`가 위가 아님 (예: `completed` 등) | 없음 | false | false |
| `paymentStatus`가 유효 결제 완료 **아님** **또는** `booking.status` ≠ `pending` | 없음 | false | false |
| 그 외: 결제 완료 + `pending` | `status` → `confirmed`, `detailJson`에 `paymentStatus: 'paid'`, `confirmedAt` 등 | true | false |

**참고:** `confirmed` 예약에 대해 `paymentStatus`만 `paid`로 올리는 PATCH는 **업데이트 없음** (이미 확정). 환불은 `pending`/`confirmed`에서만 취소 전이.

### 1.4 기존 단위 테스트

**파일:** `frontend/src/lib/server/bookingPaymentTransition.test.ts`  
**커버:** `paid`/`completed` 확정, `failed` 무변경, 환불 → `cancelled_before` / `cancelled_after`, `completed` 예약+환불 무변경, `confirmed`+`paid` 재확인 무변경, 예약 없음.

**조사 갭 (서버 전이만):**  
- `refundStatus`는 환불이 먼저 체크되어, **같은 요청에 결제완료+환불**이 오면 **환불 분기**가 우선(테스트는 `paymentStatus: 'paid'`, `refundStatus: 'refunded'` 혼합 케이스로 검증).

---

## 2) API: `/api/app/payments`

**미들웨어(`frontend/src/middleware.ts`):** `pathname.startsWith('/api/app/payments')`이면 `isPaymentApiAuthorized` 실패 시 **401**과 `{ "error": "unauthorized" }` — **`appApiError` 형식(`ok: false`)과 다름**. 클라이언트가 통일 파싱하려면 이 케이스를 포함해야 함.

### 2.1 공통 응답 형식

- **성공:** `{ ok: true, data: T }` (`appApiOk`)
- **실패:** `{ ok: false, error: { code, message } }` (`appApiError`), HTTP status 동반

**파일:** `frontend/src/lib/server/appApiResponses.ts`, `appApiErrors.ts`

### 2.2 `GET /api/app/payments?bookingId=…` 또는 `?userId=…`

| 단계 | HTTP / code | data |
| --- | --- | --- |
| 둘 다 없음 | 400 `missing_scope` | — |
| `userId` — 액터 불일치 | (가드) | — |
| `bookingId` — 참가자 아님 | (가드) | — |
| DB 조회 실패 | 503 `database_unavailable` | — |
| 성공 | 200 | `data.payments` = row 배열(최대 200) |

**클라이언트 사용처(직접):** `bookingsClient`에는 **GET 결제 목록** 호출이 없고, **POST/PATCH**만 래핑.

### 2.3 `POST /api/app/payments`

| 단계 | HTTP / code | 비고 |
| --- | --- | --- |
| JSON 파싱 실패 | 400 `invalid_body` | |
| `bookingId` / `userId` / `amount` 누락·NaN | 400 `invalid_fields` | |
| 예약 없음 | 404 `booking_not_found` | |
| `userId`가 게스트/오너가 아님 | 403 `invalid_payment_actor` | |
| 쓰기 가드 | (가드 응답) | |
| `idempotencyKey`로 기존 row 있음 | 200, 기존 `payment` | **201 아님** |
| insert 성공 | 201, 새 `payment` | |
| 예외 | 503 `database_unavailable` | |

**DB 전이:** POST는 **`transitionBookingOnPaymentUpdate`를 호출하지 않음** — payment row만 삽입.

### 2.4 `PATCH /api/app/payments/[bookingId]`

| 단계 | HTTP / code | data |
| --- | --- | --- |
| `bookingId` 빈 값 | 400 `invalid_booking_id` | |
| JSON 실패 | 400 `invalid_body` | |
| 예약 없음 | 404 `booking_not_found` | |
| 쓰기 가드 | (가드) | |
| 해당 `bookingId`에 **PaymentRecord 없음** | 404 `not_found` | |
| 트랜잭션 성공 | 200 | `data: { payment, transition }` — `transition` = `transitionBookingOnPaymentUpdate` 반환 |
| 예외 | 503 `database_unavailable` | |

**PATCH `status`:** body에 `status`가 없으면 `normalizedStatus`는 `null`이고, SQL에서 `COALESCE($2, "status")`이므로 **기존 status 유지**. 전이 함수에는 `paymentStatus: null`이 넘어가 **결제완료로는 처리되지 않음**.

---

## 3) 클라이언트: 결제 메타 + 예약 흐름 (UI와의 맞물림)

**파일:** `frontend/src/lib/api/bookingsClient.ts`

| 함수 | 서버 호출 | 응답 검증 | 실패 시 UI |
| --- | --- | --- | --- |
| `createPaymentMetaForBooking` | `POST /api/app/payments` | **`res.ok` / JSON 미검사** | `console.warn`만, **사용자 메시지 없음** |
| `patchPaymentMetaByBooking` | `PATCH /api/app/payments/[bookingId]` | **미검사** (네트워크 예외만 catch) | `console.warn`만 |
| `completePayment` | 로컬 `paymentStatus: 'paid'` + `syncBookingsNow` + `patch...({ status: 'paid' })` | PATCH 실패해도 **로컬은 이미 paid** | **서버/원장 불일치 가능**, 사용자에게 “결제 반영 실패” 없음 |
| `approveRefundBooking` (어드민) | 로컬 + `patch...` 환불 필드 | 동일 | 동일 이슈 가능 |

**[갭 1] P0.1 핵심:** 결제/환불 API가 4xx/5xx를 반환해도 **클라이언트는 본문 `ok: false`를 읽지 않음** → **실패가 UI에 전달되지 않음**.  
**[갭 2]** `transition`/`bookingConfirmed`를 **어떤 UI도 소비하지 않음** (성공/실패 알림·재시도 없음).

---

## 4) KYC: `loadKycProgressFromUser` + `useKycPageState`

### 4.1 `loadKycProgressFromUser` (`loadKycProgressFromUser.ts`)

- `getCurrentUserData(userId)` → `kyc_steps.step1/2/3` 불린으로 복원.
- **스텝 표시:** 완료 안 된 **가장 이전** 스텝을 `currentStepToShow`로 돌려줌.
- **로드 실패:** `useKycPageState`에서 `catch` 시 **`console.error`만** — 사용자 `error` 상태 없음, **스텝은 기본 1에 머물 가능(서버는 더 앞섰는데 UI만 어긋남)**.

**[갭 3]** 서버·클라이언트 KYC 단계 **불일치 시** 사용자 알림/재로드 없음.

### 4.2 `useKycPageState` — 핵심 동작 (실패/거절)

| 핸들러 | 의도 | 실제 |
| --- | --- | --- |
| `handlePhoneVerificationComplete` | API 저장 후 2단계 | `savePhoneVerification` **실패해도** catch 후 **2단계로 진행** (`setCurrentStep(2)`) — **“테스트 모드” 묵시 통과** |
| `handleIdDocumentComplete` | 거절 시 멈춤? | `mock_kyc_id_failed` 포함 메시지면 **`setError` + return**. 그 외 API 실패는 **로그 후 3단계로 진행** |
| `handleIdDocumentNext` (더미) | 동일 | 동일 패턴 |
| `handleFaceVerificationComplete` | 완료 후 프로필 | `saveFace`/`completeKYC` 실패 시 **에러 로그 + `router.push("/profile")`** — **실패해도 이탈** |

**[갭 4]** 전화/신분증(특정 문자열 제외)은 **실패 = 다음 단계**로, **얼굴은 실패 = 프로필로 이동**으로 **정책이 일관되지 않음**.  
**[갭 5]** `loadKycProgressFromUser` 오류·거절 시 **복구(재시도, 현재 스텝 고정)**가 없음.

---

## 5) 요약: 우선 정리할 위험 (다음 단계 입력)

| ID | 구역 | 요약 |
| --- | --- | --- |
| G1 | 결제 API 클라 | POST/PATCH **HTTP·`ok` 검사** 없음, 실패가 UI·원장과 단절 |
| G2 | 전이 결과 | `transition` 미사용 — 서버는 확정/취소했는데 **클라이언트는 모름** |
| G3 | KYC 로드 | `loadKycProgressFromUser` 실패 시 **무음** |
| G4 | KYC 단계 | 전화/신분은 **에러에도 스킵** 가능, 얼굴은 **에러에도 /profile** |
| G5 | ID 거절 | `mock_kyc_id_failed`만 **명시적 거절** — 실서비스 거절 코드가 더 있으면 **동일 취급 필요** |
| G6 | 결제 API 인증 | 미들웨어 401 응답 **JSON 형식**이 라우트 `appApiError`와 **불일치** |

---

## 6) 2단계(다음)에서 할 일 (참고)

1. **실패·거절 → UI/액션** 한 줄씩 합의표 (결제, KYC).  
2. **서버 계약** 고정(이미 `appApiError` 형식 있음) 후 **클라이언트**에서 `ok`·`transition` 반영.  
3. KYC: Provider·에러 코드와 `useKycPageState` 분기 **정렬**.  
4. **테스트:** 전이(이미 있음) + **클라이언트/헬퍼** 실패 경로(추가 예정).

이 문서는 P0.1 **1단계(전수 조사)** 산출물이며, 구현이 진행될수록 [갭]을 닫힌/미해결로 갱신할 것.
