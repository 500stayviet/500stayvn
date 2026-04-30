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
- 러너: `windows-latest` (로컬과 OS가 다를 수 있으므로 §8 Flaky 절차 참고)
- 대상 스펙(고정 나열, 한 번에 실행):
  - `tests/e2e/access-control-blocked.spec.ts`
  - `tests/e2e/search-filter-detail.spec.ts`
  - `tests/e2e/my-properties-regression.spec.ts`
  - `tests/e2e/mock-scenario-regression.spec.ts`
  - `tests/e2e/admin-smoke.spec.ts`
- 목적: 핵심 사용자·관리자·mock 결제/KYC 회귀를 PR 단계에서 차단
- 실패 시: GitHub Actions 아티팩트 `e2e-smoke-playwright-report`, `e2e-smoke-test-results`(HTML reporter·trace·스크린샷) — Flaky 분석 시 사용(§8).

야간/수동 전체 검증:
- 잡 이름: `e2e-nightly-full`
- 트리거: `schedule`, `workflow_dispatch`
- 환경: `CI=true`(재시도 정책은 §8과 동일)
- 목적: 전체 E2E 실행 + 진단 아티팩트 보관
- 업로드 산출물:
  - `playwright-report`
  - `playwright-test-results`

---

## 4) 실패 시 확인 순서

1. **한 번에 실패했다면:** 먼저 **재시도 1회가 성공했는지(Green)** 확인한다. Playwright는 CI에서 실패 시 자동 재시도한다(§8).
2. 아티팩트(`playwright-report`, `test-results`) 또는 로컬 `npx playwright show-report`에서 실패 스텝·trace 확인 (`trace: on-first-retry`).
3. **같은 스펙이 재시도 후에도 실패**하면: 앱 회귀 가능성이 높다. 코드·셀렉터·타이밍을 수정한다.
4. 포트 충돌 여부 확인 (`3010`).
5. `.next` 캐시/락 문제 여부 확인(로컬).
6. smoke 범위인지(`e2e-smoke`) full nightly(`e2e-nightly-full`)인지 구분 후 대응.

---

## 5) 유지보수 규칙

- PR 스모크는 **필수 차단선**으로 유지하되, 스펙 개수는 최소한만 유지한다. 편입·제외는 `frontend-quality.yml`의 `Run E2E smoke suite` 명령과 동기화하고, 본 문서 §3 목록도 함께 갱신한다.
- 신규 핵심 플로우가 생기면 smoke 편입 여부를 우선 검토한다.
- 아직 안정화되지 않은 시나리오는 `e2e-nightly-full`에서 먼저 돌리고, 안정화 후 PR smoke로 승격한다.

---

## 6) 야간 결과 알림(옵션)

nightly 테스트 결과를 즉시 알기 위해 webhook 알림을 사용할 수 있다.

- GitHub Actions secret 이름:
  - `SLACK_WEBHOOK_URL`
- 동작 조건:
  - `e2e-nightly-full` 잡 종료 시(성공/실패)
  - secret 값이 설정되어 있을 때만 전송
- 알림 내용:
  - 성공/실패 상태
  - 저장소/브랜치
  - Actions run 링크

---

## 7) 야간 알림 대응 책임/절차

- 1차 확인자(오너):
  - CI 담당자 또는 당일 릴리즈 담당자 1인
- 확인 타이밍:
  - 다음 업무 시작 시점(또는 알림 수신 직후)
- 확인 절차:
  1. Slack 메시지의 Actions run 링크 열기
  2. `e2e-nightly-full`에서 실패 스펙/아티팩트 확인
  3. flaky 여부 판단 후 이슈 등록 또는 즉시 수정
- 결과 기록:
  - 원인/조치/재실행 결과를 팀 노트 또는 이슈에 1줄 이상 남긴다.

---

## 8) Flaky 대응 정책 (재시도·판정·문서화)

**목표:** “한 번은 실패하고 한 번은 성공”하는 **양치기형** 결과로 머지 판단이 흔들리지 않게 한다. 재시도는 **일시적 환경 노이즈**를 걸러 내고, **연속 실패·동일 스펙 반복 실패**는 반드시 추적한다.

### 8.1 용어

| 구분 | 의미 |
|------|------|
| **결정적 실패** | 로컬·CI에서 **재현**되며, 재시도 후에도 같은 단계에서 실패한다. → 제품 또는 테스트 코드 수정 대상. |
| **Flaky** | 동일 커밋에서 **간헐적**으로만 실패하거나, CI에서만/로컬에서만 실패한다. 환경·타이밍·웹서버 기동 경쟁 등이 흔한 원인. |
| **노이즈 로그** | `next dev` 기동 직후 `The user aborted a request` / `Retrying` 로그가 **테스트 실패 없이** 반복되는 경우가 있다. 단독으로는 실패 원인으로 보지 않는다(실패 시 trace·타임아웃을 본다). |

### 8.2 재시도 정책 (현재 설정)

- **설정 위치:** `frontend/playwright.config.ts`
- **로컬:** `retries: 0` — 반복 실패를 숨기지 않고 바로 고친다.
- **CI:** `process.env.CI` 가 truthy일 때 `retries: 1` — **실패 시 1회 재시도**(최대 2번의 실행 시도). GitHub Actions는 기본으로 `CI=true`를 주며, 워크플로에서도 동일하게 유지한다.
- **트레이스:** `trace: on-first-retry` — 재시도가 발생한 테스트만 trace가 남아, Flaky 원인 분석 비용을 줄인다.
- **workers:** `1`, `fullyParallel: false` — PR 스모크에서 경쟁 조건을 줄인다.

**재시도 횟수를 늘리는 것**은 가능하지만, 제품 버그를 가리기 쉬우므로 **연속으로 같은 스펙이 실패하는 경우**에는 재시도 상향 대신 **셀렉터·대기 조건·테스트 데이터**를 고치는 것을 우선한다.

### 8.3 머지·배포 판정 규칙

1. **PR `e2e-smoke`가 최종적으로 Green**이면 품질 게이트 통과로 본다(재시도 후 Green 포함).
2. **같은 PR에서 동일 테스트가 재시도 포함 두 번 모두 실패**하면 **머지하지 않는다.**
3. **서로 다른 PR에서 동일 스펙만 반복 실패**하면 Flaky로 분류하고, 이슈에 스펙명·run 링크·trace 유무를 남기고 **안정화 PR**을 우선한다(머지를 “운으로” 통과시키지 않는다).

### 8.4 Flaky 의심 시 체크리스트

1. 해당 스펙만 단독 실행:  
   `npx playwright test tests/e2e/<파일>.spec.ts --project=chromium --workers=1`
2. `timeout` / `expect` 대기: 고정 `waitForTimeout` 대신 **역할·텍스트·네트워크 idle** 등 명시적 조건 선호.
3. **Windows(CI) vs 로컬:** 경로·줄바꿈·셸이 아닌 **브라우저/API** 단에서 차이 나는지 확인.
4. Next dev 기동: `webServer.timeout`(현재 180s) 내 URL 응답 여부; 기동 직후 첫 요청 abort 로그는 §8.1 노이즈 참고.

### 8.5 문서·백로그 연동

- 파이프라인 전체 맥락: [`pipeline-principles.md`](./pipeline-principles.md)
- Flaky 안정화·스모크 범위 변경 시: [`refactor-backlog.md`](./refactor-backlog.md) P0.2 / §2-2 항목과 함께 기록을 남긴다.
