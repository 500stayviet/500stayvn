# 파이프라인 품질 게이트 원칙 (Phase 2-1)

본 문서는 **500stayvn 프론트엔드** 배포·CI에 공통으로 적용하는 품질 기준을 고정한다. 목표는 **머지/배포 전에 동일한 증거**로 회귀를 막는 것이다.

---

## 1. 원칙 요약

| 게이트 | 의미 | 실패 시 |
|--------|------|---------|
| **Lint 0** | 정해진 ESLint 스코프에서 **경고 0** (`--max-warnings 0`). 임의 억제 금지, 필요 시 근거 있는 disable만. | 머지·배포 불가 |
| **타입체크** | `npx tsc --noEmit` 통과. | 머지·배포 불가 |
| **단위 테스트** | `npm test` (Vitest) 통과. | 머지·배포 불가 |
| **프로덕션 빌드** | `npm run build` (Prisma generate + `next build`) 통과. | 머지·배포 불가 |
| **E2E (필수 슬라이스)** | PR·품질 파이프라인에서 지정한 Playwright 스펙 **그린**. 코어 시나리오(`mock-scenario-regression` 등)는 제거·무반응 시 즉시 복구. | PR 머지 불가 |

**한 줄:** 시스템이 스스로를 증명하려면 **Lint 0 + 타입 + 테스트 + 빌드 + 핵심 E2E**가 한 번에 통과해야 한다.

---

## 2. GitHub Actions (`frontend-quality.yml`)

**워크플로:** 저장소 루트 `.github/workflows/frontend-quality.yml`

**Job `test-and-typecheck`** (Ubuntu, `working-directory: frontend`) 실행 순서 — **Amplify `preBuild`의 린트·i18n 게이트와 동일 순서**를 먼저 두어, 무거운 단테·빌드 전에 빠르게 실패할 수 있게 한다.

1. `npm ci --no-audit` (체크아웃·setup-node 직후)
2. `npm run lint:p3-tier3` — `src/app/api/**/*.ts`, `src/lib/server/**/*.ts`, `src/lib/**`(server 제외), `src/components/**`
3. `npm run p3:i18n` — `scan:ui-ko:gate` + i18n 패리티·정책 Vitest
4. `npm test`
5. `npm run check:banned-terms`
6. `npx tsc --noEmit`
7. `npm run build`

클라이언트 빌드용 **Firebase 플레이스홀더**는 워크플로 `env`에 고정되어 있어, 시크릿 없이도 타입·빌드가 재현 가능하다. Prisma Client는 **`npm ci`의 postinstall** 등으로 생성되어 단테·타입체크에 사용된다(별도 `prisma generate` 스텝은 없음).

**Job `e2e-smoke`** (Windows, PR만): Playwright Chromium + 스모크 스펙 일괄 실행. `test-and-typecheck` 성공 후에만 실행된다. **Flaky·재시도·머지 판정**은 [`docs/qa/e2e-execution-standard.md`](./e2e-execution-standard.md) **§8**을 따른다 (CI에서 `retries: 1`, 로컬 `0`, trace는 재시도 시).

**실행 결과 확인:** GitHub 저장소 → **Actions** 탭 → 워크플로 **Frontend Quality** → 최근 run. (로컬에 `gh` CLI가 있으면 `gh run list --workflow=frontend-quality.yml`로 동일 정보 조회 가능.)

**로컬 원샷 검증:** `frontend`에서 `npm ci` 다음 `npm run ci:parity` — GitHub `test-and-typecheck`의 **린트·`p3:i18n`부터 빌드까지**와 동일한 명령 연쇄(설치 단계는 별도).

---

## 3. AWS Amplify (`amplify.yml`)

**앱 루트:** `frontend`

**역할 분리:** Amplify는 **`preBuild`**(의존성 + 린트·i18n)와 **`build`**(환경 주입·Prisma·단테·타입·최종 빌드)로 나뉜다. GitHub job에는 preBuild에 해당하는 “배포 전 가벼운 게이트”가 없고, 대신 `test-and-typecheck` 안에서 같은 **논리 순서**(린트·`p3:i18n` → test → banned → tsc → build)를 맞춘다. Amplify만의 차이는 **`build` 초반에 `.env`를 생성하고 `prisma generate`를 명시 실행**한다는 점(콘솔 시크릿이 빌드·런타임에 필요).

### `preBuild`

1. `nvm use 20` (또는 install)
2. `npm ci --no-audit --include dev` — Amplify에서 `NODE_ENV=production` 등으로 **devDependencies**가 빠지는 경우를 막기 위해 `--include dev`를 명시한다. **`--ignore-scripts`는 쓰지 않는다** (Next `sharp` 등이 install 스크립트로 Linux 바이너리를 받음).
3. `npm run lint:p3-tier3`
4. `npm run p3:i18n`

실패 시 **exit 1**로 이후 **`build` 단계로 진행하지 않는다.**

### `build`

1. `cat > ./.env <<EOF` … — Amplify 환경 변수로 **DB·OAuth·공개 키·웹훅 시크릿(패스스루)** 등 주입
2. `npx prisma generate --schema=./prisma/schema.prisma`
3. `npm test`
4. `npm run check:banned-terms`
5. `npx tsc --noEmit`
6. `npm run build` (`package.json`의 build는 내부에서 `prisma generate`를 다시 호출할 수 있음 — 무해)

Amplify 콘솔에 설정한 **환경 변수**가 `.env`에 반영되지 않으면 런타임·빌드에서 즉시 드러난다.

---

## 4. 로컬에서 PR 전 검증 (권장 순서)

**GitHub·Amplify `preBuild` 게이트와 맞춘 순서(권장):** `frontend` 디렉터리에서 의존성 설치 후:

```bash
npm ci
npm run lint:p3-tier3
npm run p3:i18n
npm test
npm run check:banned-terms
npx tsc --noEmit
npm run build
```

한 줄로 동일하게 돌리려면:

```bash
npm run ci:parity
```

전역 앱·페이지까지 린트를 맞출 때는 추가로:

```bash
npm run lint
```

---

## 5. 변경 시 체크리스트

- [ ] 새 API/서버 모듈이 `lint:p3-tier3` 범위에 들어가는지 확인한다.
- [ ] E2E 스모크에 포함된 플로를 건드렸다면 로컬에서 해당 스펙을 실행한다.
- [ ] `amplify.yml`과 `frontend-quality.yml`의 **명령 순서**를 이 문서와 맞춘다.
- [ ] 스모크 스펙 목록을 바꿨다면 `e2e-execution-standard.md` §3 목록과 동기화한다.

---

## 6. 관련 문서

- [`e2e-execution-standard.md`](./e2e-execution-standard.md) — Playwright 실행 표준, **§8 Flaky 대응**(재시도·판정·체크리스트)
- `frontend/SECURITY_APP_API_CHECKLIST.md` — API 봉투·actor·**상용 오픈 전** 보안 체크리스트
- `docs/qa/refactor-backlog.md` — Fixed Completion Gate, P3 졸업 기준
- `docs/qa/ci-runtime-policy.md` — Node 20·GitHub Actions 핀
- `docs/qa/sentry-ops.md` — `api_slow` / `api_http_5xx`·알림 권장
- `docs/qa/phase3-mobile-app-readiness.md` — 스토어·TWA·서명·제출물 (Phase 3)
- `docs/qa/phase3-capacitor-ios.md` — Capacitor iOS·시뮬레이터·`server.url`
- `docs/qa/store-listing-draft.md` — 스토어 카피 KO/EN/VI
