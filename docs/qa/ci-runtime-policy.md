# CI·런타임 Node 버전 정책

앱 본체(Next.js BFF + Prisma)는 **`frontend/`** 디렉터리가 기준이다. CI와 프로덕션 빌드는 **동일 메이저 Node**에서 돌리는 것을 원칙으로 한다.

## 고정 버전

| 구분 | Node.js | 근거 |
|------|---------|------|
| GitHub Actions (`frontend-quality.yml` 등) | **20.x** (`node-version: "20"`) | 워크플로와 로컬 기대치를 맞춤 |
| 로컬 개발 | **20.x LTS** 권장 | CI 실패·네이티브 모듈 불일치 방지 |

`frontend/package.json`에 `engines` 필드가 없을 수 있으나, **실질 표준은 CI에 명시된 20**으로 본다. 향후 팀 합의 시 `engines.node`를 추가해 `npm`/`pnpm`이 경고를 내도록 할 수 있다.

## 업그레이드 절차

1. **CI 워크플로**의 `node-version`을 변경한다 (예: `22`).
2. 로컬·스테이징에서 `npm ci`, `npm run lint`, `npm test`, `npm run build`를 통과시킨다.
3. Prisma·Next·`@types/node`가 새 Node와 호환되는지 릴리스 노트를 확인한다.
4. 문서 본 절과 `docs/runbook.md` 등에 반영일을 남긴다.

## 런타임(호스팅) 정렬

- 프로덕션 컨테이너·호스트의 Node도 **CI 메이저와 동일**하게 맞춘다.
- “개발만 22, CI만 20”처럼 메이저를 갈라 쓰지 않는다. 예외가 필요하면 이 문서에 예외 사유·담당·만료일을 적는다.

## GitHub Actions 핀 (본 저장소, 점검 시 갱신)

PR·메인·스케줄에 쓰는 워크플로: **`.github/workflows/frontend-quality.yml`**.

| 액션 | 현재 메이저 태그 | 용도 |
|------|------------------|------|
| `actions/checkout` | **v4** | 소스 체크아웃 |
| `actions/setup-node` | **v4** (`node-version: "20"`, `cache: npm`) | Node·npm 캐시 |
| `actions/upload-artifact` | **v4** | Nightly Playwright 리포트 업로드 |

**유지보수:** 분기 1회 또는 Dependabot 알림 시 [actions 릴리스](https://github.com/actions)에서 메이저 변경 사항을 확인하고, 동일 변경을 적용한 뒤 `frontend-quality.yml` 한 줄과 본 표를 맞춘다. Node 20 EOL 전에는 `docs/qa/ci-runtime-policy.md`의 업그레이드 절차를 따른다.

**Amplify:** 루트 `amplify.yml`의 `preBuild`에서 `nvm use 20`으로 CI와 동일 메이저를 맞춘다.

## 관련 문서

- `docs/qa/pipeline-principles.md` — 린트·테스트 게이트 순서
- `docs/qa/db-migration-guide.md` — DB 변경 시 Node와 무관하게 적용할 운영 규칙
- `docs/qa/sentry-ops.md` — 느림·5xx Sentry 신호와 알림 권장
