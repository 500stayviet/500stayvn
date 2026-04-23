# E2E 실행 환경 표준 (Playwright)

E2E 결과가 로컬/CI에서 다르게 나오는 문제를 줄이기 위해, 아래 실행 규칙을 표준으로 사용한다.

---

## 1) 고정 실행 규칙

- 포트: `3010`
- Playwright workers: `1`
- 병렬 실행: `fullyParallel: false`
- 기본 브라우저: Chromium
- 테스트 시작 전 `.next` 정리 후 dev server 기동

기준 파일:
- `frontend/playwright.config.ts`

---

## 2) 로컬 실행 표준

작업 디렉터리:
- `frontend`

기본 실행:
- `npm run e2e`

헤디드 실행(디버깅):
- `npm run e2e:headed`

동작 방식:
- Playwright가 내부 webServer를 통해 `next dev -p 3010`을 실행한다.
- 실행 전에 `.next` 디렉터리를 정리해 캐시/락 이슈를 줄인다.

---

## 3) CI 실행 표준

워크플로우:
- `.github/workflows/frontend-quality.yml`

PR 차단선:
- 잡 이름: `e2e-smoke`
- 대상: `access-control-blocked`, `search-filter-detail`
- 목적: 빠른 회귀 감지(핵심 사용자 흐름만)

야간/수동 전체 검증:
- 잡 이름: `e2e-nightly-full`
- 트리거: `schedule`, `workflow_dispatch`
- 목적: 전체 E2E 실행 + 진단 아티팩트 보관
- 업로드 산출물:
  - `playwright-report`
  - `playwright-test-results`

---

## 4) 실패 시 확인 순서

1. 아티팩트(`playwright-report`, `test-results`)에서 실패 스펙/스크린샷 확인
2. 포트 충돌 여부 확인 (`3010`)
3. `.next` 캐시/락 문제 여부 확인
4. smoke 범위인지(full nightly인지) 먼저 구분 후 대응

---

## 5) 유지보수 규칙

- smoke 시나리오는 1~2개 핵심 플로우만 유지한다.
- 신규 핵심 플로우가 생기면 smoke 편입 여부를 우선 검토한다.
- flaky 테스트는 full nightly에 먼저 두고, 안정화 후 PR smoke로 승격한다.

---

## 6) 야간 실패 알림(옵션)

nightly 실패를 즉시 알기 위해 webhook 알림을 사용할 수 있다.

- GitHub Actions secret 이름:
  - `E2E_NIGHTLY_WEBHOOK_URL`
- 동작 조건:
  - `e2e-nightly-full` 잡 실패 시
  - secret 값이 설정되어 있을 때만 전송
- 알림 내용:
  - 저장소/브랜치
  - 실패한 Actions run 링크
