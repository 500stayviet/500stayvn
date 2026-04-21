# 5단계 품질 점검 / E2E 가이드

골든 패스: **비로그인 구경 → 로그인 → 예약 → 결제 → 관리자 승인 → 정산**

## 1) 시나리오 점검 결과 (코드 전수)

### A. 서버 원천으로 전환된 경로
- `properties` 원천:
  - `frontend/src/lib/api/properties.ts`
  - `getAllProperties()`, `getAvailableProperties()`, `getProperty()`가 `/api/app/properties*` 기반으로 동작.
  - 비로그인은 마스킹 DTO(`toPublicProperty`)를 받음.
- `bookings` 원천:
  - `frontend/src/lib/api/bookings.ts`
  - LS seed/mirror/bootstrap-import 제거, 서버 스냅샷 기반(`refreshBookingsFromServer`)으로 동작.
- 공개 API 보안:
  - `frontend/src/lib/server/publicApiGuard.ts` (UA/Rate-limit 429)
  - `frontend/src/middleware.ts` (`/booking*`, `/api/app/payments*` 인증 강제, webhook 예외)

### B. 아직 localStorage를 쓰는 항목(의도/비의도)
- **의도된 UI/세션 보조**
  - `frontend/src/lib/api/auth.ts`: `currentUser`, 사용자 캐시, 쿠키 동기화(앱 액터 유지)
  - `frontend/src/components/GrabMapComponent.tsx`: 위치권한 모달 dismiss timestamp
  - `frontend/src/components/HeroSection.tsx`, `TopBar.tsx`: 알림/권한 UI 상태
- **비즈니스 원천이 아닌지 확인 완료**
  - 매물/예약 원천 데이터는 서버 API 기준.

### C. 결론
- 골든 패스의 핵심 비즈니스 데이터(`properties`, `bookings`, 결제 메타, 관리자 승인/정산)는 서버 중심으로 흐른다.
- LS는 UI/세션 보조 용도로만 남아 있으며, 비즈니스 원천 저장소 역할은 제거된 상태.

---

## 2) 엣지 케이스 테스트 코드

추가된 파일:
- `frontend/scripts/edge-api-check.mjs`
- `frontend/package.json` 스크립트: `npm run qa:edge`

검증 항목:
- 비로그인 결제 API 접근 차단 (`/api/app/payments` → `401`)
- 봇 User-Agent 차단 (`/api/app/properties` + `curl/*` → `429`)
- 공개 API rate-limit (`/api/app/properties` 반복 요청 → `429`)
- 중복 예약 기간(겹침) 방어 (`PUT /api/app/bookings` 겹침 payload → `409`, 인증 강제 환경은 `401/403`)

실행 예:
- 로컬 서버 기동 후
  - `cd frontend`
  - `BASE_URL=http://localhost:3000 npm run qa:edge`

---

## 3) 브라우저 스모크 테스트 체크리스트

### 0. 사전 조건
- 관리자/호스트/게스트 계정 1개씩 준비
- 테스트용 매물 1개(활성), 예약 가능한 날짜 범위 확보

### 1. 비로그인 구경
- [ ] `/map`, `/search`, `/properties/[id]`에서 목록/상세가 보인다.
- [ ] 주소는 시/군/구 수준만 보이고 상세 주소/연락처는 비노출.
- [ ] 개발자도구 Network에서 `/api/app/properties*` 응답이 내려온다.

성공 기준:
- UI가 빈 화면이 아니고, 마스킹된 데이터가 일관되게 노출된다.

### 2. 로그인
- [ ] 로그인 직후 새로고침해도 목록/상세가 정상.
- [ ] 비로그인에서 보이던 값과 로그인 후 값의 권한 차이가 정책대로 반영.

성공 기준:
- 인증 상태 전환 후에도 서버 fetch 기반으로 데이터가 이어진다(LS 의존 깨짐 없음).

### 3. 예약 생성
- [ ] 예약 생성 시 `bookings` 목록에 즉시 반영.
- [ ] 새로고침 후에도 서버에서 동일 예약이 조회된다.

성공 기준:
- 클라이언트 임시 상태가 아니라 서버 원장 기준으로 재로딩 일치.

### 4. 결제 진행/중단
- [ ] 결제 성공 시 `paymentStatus=paid` 반영.
- [ ] 결제 중단/실패 시 상태가 `failed` 또는 미완료로 남고, 다음 단계로 강행되지 않음.
- [ ] 비로그인으로 `/api/app/payments*` 직접 호출 시 `401`.

성공 기준:
- 결제 상태 전이가 서버 응답 코드/데이터와 일치하고, 미인증 접근이 차단된다.

### 5. 관리자 승인(계약/정산/환불/출금)
- [ ] 관리자 화면 조치 후 호스트/게스트 화면 재진입 시 서버 최신 상태 반영.
- [ ] 배지/목록이 SSE/refresh 규칙에 맞게 갱신.

성공 기준:
- 조치 후 stale 데이터가 남지 않고, 재조회 시 서버 상태와 동일.

### 6. 정산
- [ ] 승인/보류/복구 상태 전이에 따라 정산 화면 숫자/상태가 맞게 변한다.
- [ ] 관련 감사(ledger/audit) 화면에서도 이벤트가 반영된다.

성공 기준:
- 정산 상태/금액/배지·감사가 서버 원장과 동일.

---

## 4) 실패 시 빠른 확인 포인트
- `docs/runbook.md`의 API 로그/Sentry 확인 순서 따라가기
- 미들웨어 인증 차단이 과도한지 (`/booking*`, `/api/app/payments*`) 확인
- 공개 API 429가 정상 사용자까지 차단하는지(User-Agent/Rate limit) 점검

