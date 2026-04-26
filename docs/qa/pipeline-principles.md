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

**Job `test-and-typecheck`** (Ubuntu, `working-directory: frontend`) 실행 순서:

1. `npm ci`
2. `npm test`
3. `npx tsc --noEmit`
4. `npm run lint:p3-tier3` — `src/app/api/**/*.ts`, `src/lib/server/**/*.ts`, `src/lib/**`(server 제외), `src/components/**`
5. `npm run build`

클라이언트 빌드용 **Firebase 플레이스홀더**는 워크플로 `env`에 고정되어 있어, 시크릿 없이도 타입·빌드가 재현 가능하다.

**Job `e2e-smoke`** (Windows, PR만): Playwright Chromium + 스모크 스펙 일괄 실행. `test-and-typecheck` 성공 후에만 실행된다.

**실행 결과 확인:** GitHub 저장소 → **Actions** 탭 → 워크플로 **Frontend Quality** → 최근 run. `lint:p3-tier3` 단계 로그에서 ESLint 출력을 확인한다. (로컬에 `gh` CLI가 있으면 `gh run list --workflow=frontend-quality.yml`로 동일 정보 조회 가능.)

---

## 3. AWS Amplify (`amplify.yml`)

**앱 루트:** `frontend`

**의도적 정렬:** `build` 단계에서 GitHub `test-and-typecheck`와 **동일한 증거**를 남긴다. Amplify `preBuild`는 `npm ci --ignore-scripts`이므로 **`prisma generate`를 타입체크·테스트보다 먼저** 실행한다.

1. `npx prisma generate --schema=./prisma/schema.prisma`
2. `npm test`
3. `npx tsc --noEmit`
4. `npm run lint:p3-tier3`
5. `npm run build` (내부에서 Prisma generate가 한 번 더 호출될 수 있음 — 무해)

이렀로 Amplify만 통과하고 GitHub에서 린트가 깨지는 **이분법**을 줄인다. Amplify 콘솔에 설정한 **환경 변수**(DB, OAuth, AWS Location 등)는 기존과 같이 필요하며, Next 빌드 시 필요한 `NEXT_PUBLIC_*` 누락은 빌드 로그로 즉시 드러난다.

**참고:** 예전에는 `prisma generate` 후 `npm run build`만 있었을 수 있다. 이 문서 시점부터 위 품질 단계가 빌드 전에 포함되는 것이 표준이다.

---

## 4. 로컬에서 PR 전 검증 (권장 순서)

`frontend` 디렉터리에서:

```bash
npm ci
npm test
npx tsc --noEmit
npm run lint:p3-tier3
npm run build
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

---

## 6. 관련 문서

- `frontend/SECURITY_APP_API_CHECKLIST.md` — API 봉투·actor·**상용 오픈 전** 보안 체크리스트
- `docs/qa/refactor-backlog.md` — Fixed Completion Gate, P3 졸업 기준
