# 도메인 이벤트 연결표

서버에서 주요 데이터가 바뀔 때, **누가 어떤 화면을 “실시간에 가깝게” 볼 수 있는지**를 정리합니다.  
이 저장소의 **관리자 실시간 경로**는 Prisma 미들웨어가 `AdminDomainEvent` 행을 쌓고, 관리자 레이아웃의 **SSE**(`/api/admin/domain-events/stream`)가 이를 푸시한 뒤, 브라우저에서 `admin-domain-event` 커스텀 이벤트로 퍼지는 구조입니다.

## 1. 서버가 기록하는 `resource` (Prisma → `AdminDomainEvent`)

| Prisma 모델 (쓰기 시) | `resource` 문자열 | 비고 |
|----------------------|-------------------|------|
| `User` | `user` | 가입·프로필·차단 등 |
| `Property` | `property` | 매물 노출·상태 등 |
| `AdminPropertyActionLog` | `property` | 관리자 매물 조치 로그 |
| `Booking` | `booking` | 예약 생성·상태 변경 |
| `PaymentRecord` | `payment` | 결제/환불 관련 기록 |
| `LessorProfile` | `lessor_profile` | 호스트(임대인) 프로필 |
| `AdminModerationAudit` | `audit` | 관리 감사(모더레이션) |
| `AdminFinanceLedger` | `adminFinanceLedger` | 재무 원장 |
| `AdminBankAccount` | `admin_bank_account` | 관리자/정산용 은행 계좌 설정 |
| `AdminWithdrawalRequest` | `adminWithdrawalRequest` | 출금 요청 |
| `AdminSharedMemo` | `admin_memo` | 관리자 공유 메모 |
| `AdminAccount` | `admin_account` | 관리자 계정 |
| `AdminSystemLog` | `system_log` | 시스템 로그 |
| `ChatRoom` | `chat` | 채팅방 (메시지 `Message`는 과다 이벤트 방지로 **원장에서 제외**) |

미들웨어 구현: `frontend/src/lib/server/adminDomainEvents.ts`  
SSE + 배지·ack 연동: `frontend/src/components/admin/AdminDomainEventBridge.tsx`, `frontend/src/lib/adminDomainEventsClient.ts`, `frontend/src/lib/adminAckState.ts`

---

## 2. 비즈니스 “사건” → 역할별 기대 UI 갱신

아래 **실시간** 열에서:

- **관리자(SSE)** = `/admin` 레이아웃에 마운트된 `AdminDomainEventBridge`가 SSE를 받은 뒤, `useAdminDomainRefresh([...])`가 구독한 `resource`와 맞으면 해당 페이지의 `load` / `setTick` 등이 실행되고, 일부 `resource`는 상단 **배지**(`refreshAdminBadges`)·**ack 캐시 무효화**까지 이어짐.
- **호스트 / 게스트** = 별도의 `AdminDomainEvent` SSE가 없음. 같은 탭에서 앱 API가 캐시를 갱신할 때는 `bookingsUpdated` 등 커스텀 이벤트가 있을 수 있으나, **다른 사용자·관리자 조치만으로는 자동 푸시되지 않는 것이 기본**이다. 대체로 **탭 전환·창 포커스·주기 폴링·채팅 unread 구독** 등으로 “느슨한” 일관성을 맞춘다.

| 사건(예) | 트리거에 가까운 `resource` | 관리자(실시간) | 호스트 UI | 게스트 UI |
|----------|----------------------------|----------------|------------|-----------|
| 예약 요청·승인·취소·완료 | `booking` (+ 필요 시 `payment`) | 정산·환불·계약·사용자 상세·감사 등 `booking` 구독 화면 refetch; 배지 관련 집계는 `badge-counts`와 연동 | 예약 목록: **포커스/가시 시 재조회** 보강됨(`host/bookings`). 채팅 unread는 별도 구독 | 동일 보강(`my-bookings`), 채팅 unread 별도 |
| 결제 상태 변경 | `payment` | 정산·환불·계약·배지 등 | 예약·결제 상세는 재진입·포커스 시 서버 재조회에 의존 | 동일 |
| 신규 사용자 / 프로필 변경 | `user` | 사용자 목록·상세·KYC·매물 상세(오너 정보)·배지 | 로그인 세션·마이페이지는 별도 흐름 | 동일 |
| 매물 등록·수정·승인/노출 | `property` | 매물 목록·상세·로그·배지 | 공개 매물 목록: `subscribeToProperties`(이벤트+주기 폴링) | 검색/목록 동일 패턴 |
| 호스트 프로필(KYC 연동) | `lessor_profile` | KYC·사용자 관련 화면; **매물 상세**에서도 refetch 보강 | 호스트 전용 폼은 재방문 시 로드 | 해당 없음 |
| 관리자 감사·원장 반영 | `audit`, `adminFinanceLedger` | 감사 통합 화면·배지·ack | 직접 SSE 없음 | 없음 |
| 정산 큐·출금·관리 계좌 | `admin_bank_account`, `adminWithdrawalRequest`, `adminFinanceLedger`, `booking`, `payment` | 정산·출금·환불·계약·감사·배지 | 정산 페이지: `useAdminDomainRefresh`는 **관리자 브리지가 있을 때만** 의미 있음; **가시성 변경 시 재조회**로 보완(`profile/settlement`) | 없음 |
| 관리자 메모 | `admin_memo` | 매물 상세 등 | 없음 | 없음 |
| 채팅방 생성/변경 | `chat` | 배지 집합에는 넣지 않음(코멘트 참고). 채팅 목록은 폴링/SSE 별도 경로 | 채팅: `subscribeToChatRooms` 폴링, 방 단위 SSE 등 | 동일 |

`AdminDomainEventBridge`의 배지 재조회 대상 `resource`는 코드에 명시되어 있다(`BADGE_RELEVANT_RESOURCES`). 채팅·메모 등은 목록 쪽 `useAdminDomainRefresh`로만 맞추는 정책이다.

---

## 3. 관리자 화면별 `useAdminDomainRefresh` 구독 (요약)

| 화면 (경로 예) | 구독 `resource` (요약) |
|----------------|-------------------------|
| 사용자 목록 | `user`, `lessor_profile` |
| 사용자 상세 | `user`, `booking`, `payment`, `admin_memo`, `admin_bank_account`, `adminFinanceLedger` |
| KYC | `user`, `lessor_profile` |
| 매물 목록 | `property`, `user` |
| 매물 상세 | `property`, `user`, `admin_memo`, **`lessor_profile`** (보강) |
| 매물 로그 | `property` |
| 정산 | `booking`, `payment`, `adminFinanceLedger` |
| 환불 / 계약 | `booking`, `payment`, `adminFinanceLedger` |
| 출금 | `booking`, `payment`, `adminWithdrawalRequest`, `adminFinanceLedger`, `admin_bank_account` |
| 감사 | `audit`, `booking`, `payment`, `user`, `property`, `adminFinanceLedger`, `adminWithdrawalRequest` |
| 시스템 로그 | `system_log` |
| 관리자 계정 | `admin_account` |

상단 배지 API: `GET /api/admin/badge-counts` (집계 정의는 이 파일에서 확인).

---

## 4. 호스트·게스트 앱의 갱신 패턴 (요약)

| 영역 | 방식 |
|------|------|
| 예약 목록 (호스트/게스트) | 마운트 시 API 로드 + **`visibilitychange` / `window` `focus` 시 재로드**(보강: `host/bookings`, `my-bookings`). `bookingsUpdated`는 **같은 탭**에서 `bookings` API 모듈이 갱신할 때만 발생. |
| 정산(호스트) | `visibilitychange`로 서버 오버레이 재조회; `useAdminDomainRefresh`는 관리자와 동일 브라우저 컨텍스트에서만 유효. |
| 매물 목록 | `subscribeToProperties` — `propertiesUpdated` / `storage` / 주기 폴링. |
| 채팅 | 방별 SSE 우선, 실패 시 폴링 폴백(`chat` API 모듈 주석 참고). |

---

## 5. 배지 API(`badge-counts`)와 `BADGE_RELEVANT_RESOURCES` (검수)

`GET /api/admin/badge-counts`가 돌리는 집계와, SSE 수신 시 `refreshAdminBadges()`를 호출할지 여부(`AdminDomainEventBridge`의 `BADGE_RELEVANT_RESOURCES`)를 맞춘다.

| 배지 응답 필드 | 내비(대략) | 집계에 쓰는 DB | 배지 갱신에 쓰면 되는 `resource`(SSE) |
|----------------|------------|----------------|----------------------------------------|
| `usersNewUnseen` | 계정 | `User` | `user` |
| `propertiesNewUnseen` | 매물 | `Property` | `property` |
| `kycNewUnseen` / `kycPending` / `kycVerifiedReview` | KYC | `User` | `user` |
| `contractsNewUnseen` | 계약 | `Booking` | `booking` (+ 필요 시 `payment`) |
| `refundsNewUnseen` | 환불 | `Booking` | `booking`, `payment` |
| `settlementsPendingUnseen` | 정산 | `Booking` + 정산 큐/승인 테이블 | `booking` (Raw만 쓰는 정산 경로는 **`bumpBookingUpdatedAtForDomainSignal`**로 `Booking` 쓰기 유도) |
| `withdrawalsPending` | 출금 | `AdminWithdrawalRequest` | `adminWithdrawalRequest` (Raw만 쓰는 출금 API는 **트랜잭션 후 `prisma.adminWithdrawalRequest.update` 한 번**으로 이벤트 유도) |
| `auditRecent` | 감사 | `AdminModerationAudit` + `AdminFinanceLedger` | `audit`, `adminFinanceLedger` (원장만 Raw INSERT인 경우 **`bumpBookingUpdatedAtForDomainSignal`** 등으로 `booking` 신호로 배지 전체 재조회) |
| `systemLogNewUnseen` | 시스템 로그 | `AdminSystemLog` | `system_log` |

**주의:** `$executeRaw` / `$executeRawUnsafe`만 쓰면 Prisma 확장 미들웨어가 `AdminDomainEvent`를 남기지 않는다. 정산·환불 원장·출금 등에서 이미 쓰는 패턴: **`bumpBookingUpdatedAtForDomainSignal`**(`frontend/src/lib/server/bumpBookingDomainSignal.ts`) 또는 해당 모델에 대한 **Prisma `update`/`updateMany` 한 번**.

---

## 6. 이 문서를 바꿀 때

운영 절차는 [runbook.md](./runbook.md)를 참고한다.

- Prisma `modelToResource`에 모델을 추가/변경하면 **표 1·2**를 같이 수정한다.
- 새 관리자 페이지를 만들면 **표 3**에 `useAdminDomainRefresh` 목록을 반영한다.
- 호스트/게스트에 SSE를 도입하면 **표 2의 “실시간” 열**을 업데이트한다.
