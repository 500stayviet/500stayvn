# Operations Runbook

이 문서는 `frontend` 앱 운영 시 필요한 최소 절차를 정리합니다.

## 1) DB 백업 / 복구

PostgreSQL 기준. 운영 DB 접근 권한은 최소 인원에게만 부여합니다.

### 백업

```bash
# PowerShell / bash 공통 (환경에 맞게 값 교체)
set PGHOST=...
set PGPORT=5432
set PGUSER=...
set PGPASSWORD=...
set PGDATABASE=...

pg_dump --format=custom --file backup_YYYYMMDD_HHMM.dump
```

- 권장 주기: 1일 1회 + 배포 직전 수동 1회
- 백업 파일은 암호화된 저장소(S3 버킷 또는 보안 스토리지)에 업로드
- 백업 보존 정책(예: 7일 단기 + 4주 주간 + 12개월 월간) 유지

### 복구

```bash
set PGHOST=...
set PGPORT=5432
set PGUSER=...
set PGPASSWORD=...
set PGDATABASE=...

pg_restore --clean --if-exists --no-owner --no-privileges --dbname=%PGDATABASE% backup_YYYYMMDD_HHMM.dump
```

- 운영 직접 복구 전 반드시 스테이징에서 복구 검증
- 복구 후 최소 검증:
  - `User`, `Property`, `Booking`, `ChatRoom`, `Message` row count 확인
  - 앱 로그인 / 매물 조회 / 채팅 조회 smoke test

## 2) Prisma 마이그레이션 실패 대응

이 프로젝트는 `frontend/prisma/schema.prisma`를 단일 소스로 사용합니다.

### 배포 전

```bash
cd frontend
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
```

### 실패 시 기본 원칙

1. **새 마이그레이션으로 정정**(권장)  
   - 이미 운영에 일부 적용된 이력은 수정/재작성하지 않고, 후속 migration으로 보정
2. `migrate resolve`는 마지막 수단  
   - 실제 DB 상태를 정확히 아는 경우에만 적용
3. 애플리케이션 배포보다 DB 상태를 먼저 정상화

### 롤백(긴급)

- 코드 롤백만으로 DB 스키마가 되돌아가지 않음을 전제로 판단
- 스키마/데이터 불일치가 큰 경우:
  1. 트래픽 제한/점검 공지
  2. 최신 정상 백업 복구
  3. 해당 버전 앱 재배포
  4. 장애 원인 migration을 수정 후 재배포

## 3) 배포 체크리스트

## 사전 점검

- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 통과 (`frontend`)
- [ ] 주요 API smoke test:
  - [ ] `/api/app/users`
  - [ ] `/api/app/properties`
  - [ ] `/api/app/bookings`
  - [ ] `/api/app/chat/rooms/*`
- [ ] `NEXT_PUBLIC_LOCAL_FALLBACK_MODE` 의도값 확인 (`readwrite|readonly|off`)
- [ ] 새 환경변수/시크릿 누락 없음

## 배포 절차

1. 백업 생성
2. `prisma migrate deploy`
3. 애플리케이션 배포
4. 배포 후 smoke test
5. 모니터링 대시보드/로그 확인 (5xx, 지연, 인증 실패율)

## 배포 후 검증

- [ ] 로그인/회원가입
- [ ] 매물 목록 조회/상세 조회
- [ ] 예약 생성/상태 변경
- [ ] 채팅방 진입 + 메시지 송수신 + unread 감소
- [ ] 관리자 주요 화면 (users, settlements, audit)

## 4) 장애 시 커뮤니케이션

- 장애 시작 시각, 영향 범위, 우회 방법, 다음 업데이트 시각을 즉시 공유
- 기술 메시지보다 사용자 영향 중심으로 공지
- 복구 후 24시간 내 간단한 회고(원인/재발 방지) 기록

## 5) 모니터링 (Sentry)

현재 앱은 Sentry SDK를 기본 탑재하며, 핵심 `/api/app/*` 라우트에서 다음을 수집합니다.

- API 예외 (`captureException`)
- 느린 API 경고 (`captureMessage: api_slow`)

### 초기 설정

1. Sentry 프로젝트 생성 (Next.js)
2. 환경변수 설정
   - `SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - 선택: `SENTRY_TRACES_SAMPLE_RATE`, `API_SLOW_MS`
3. 배포 후 확인
   - 강제 예외 1건 발생시켜 이슈 수집 확인
   - 느린 API(임계 초과) 경고 이벤트 확인

### 운영 기준(권장)

- `5xx` 이슈 알림: 즉시(온콜)
- `api_slow` 경고: 5분 집계(노이즈 완화)
- 릴리즈 태그/환경 태그를 항상 함께 보내 배포 버전 추적

상세 알림 규칙/대시보드 템플릿: `SENTRY_ALERTS_PLAYBOOK.md`

