# P0.1 실패·거절 → UI/동작 (2단계)

**전제:** `p0-1-state-transition-survey.md`의 G1~G6를 줄이는 것이 목표.  
**구현 후:** 밑줄 항목이 코드/테스트에 반영됨.

| 구역 | 시나리오 | 사용자/운영이 기대하는 동작 | 구현 힌트 |
| --- | --- | --- | --- |
| 결제 POST | Payment row 생성 실패(4xx/5xx, 본문 `ok: false`, 네트워크) | **토스트/배너**로 “결제 메타를 남기지 못함”, 예약은 이미 있음을 인지. | `createPaymentMetaForBooking` → `emitUserFacingSyncError` |
| 결제 POST | 401(미들웨어, `{ error: "unauthorized" }`) | 로그인/액터 문제 안내(기존 `USER_FACING_CLIENT_AUTH_ERROR_MESSAGE`). | `parseAppPaymentResponse` |
| 결제 PATCH | `paid` 반영 실패 | **“결제 반영 실패”**, 로컬·서버 불일치 시 **GET 예약으로 재동기화**, **성공 화면으로 가지 않음**. | `completePayment` → patch 실패 시 `throw` + `refreshBookingsFromServer` |
| 결제 PATCH | 404 `not_found` (Payment row 없음) | 위와 동일(원인은 다르지만 복구 동일). | 동일 |
| 결제 PATCH | **200 + `data.transition` (성공)** | **토스트(성공/안내)**: `bookingConfirmed`·`bookingCancelled`·무전이(정보) 분기, 직후 **GET 예약으로 캐시 정렬**. | `completePayment` / `approveRefundBooking` + `AppToastBanner` (2026-04-27) |
| KYC | `loadKycProgressFromUser` 실패 | 스텝 옆(또는 상단) **한국어 오류** + **새로고침 권고**. | `setError` |
| KYC | 전화 인증 **저장** 실패 | **다음 단계로 가지 않음**, 재시도 유도. | `savePhoneVerification` throw 시 stop |
| KYC | 신분증 **저장** 실패(명시 `mock_kyc_id_failed` 등) | **같은 단계 유지**, 메시지 표시(기존). | `setError` + return |
| KYC | 신분증 기타 API 실패 | **같은 단계**, 일반 메시지. | 더 이상 “테스트용 스킵”으로 넘기지 않음 |
| KYC | 얼굴 인증 실패 | **프로필로 잠못리다이렉트 금지**, 3단계에 머물며 메시지. | catch에서 `setError`만 |
| 환불(어드민) | Payment PATCH 실패 | **원장(환불 승인)을 ledger에 쓰지 않음**, 실패 시 `false` + 재조회. | `approveRefundBooking`에서 patch 후에만 ledger |

---

**다음(3~5단계):** API 계약은 이미 `appApiError`+미들웨어 예외만 보강 파서로 흡수, 회귀는 `appPaymentResponse.test.ts` + 기존 `bookingPaymentTransition.test.ts`로 고정.
