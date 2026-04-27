# Sentry·알람 운영 (Phase 2-3)

코드 앵커: `frontend/src/lib/server/apiMonitoring.ts`, `@sentry/nextjs` 초기화(`sentry.*.config.ts`, `instrumentation.ts`).  
장애 대응 절차의 요약은 [runbook.md](../runbook.md) §2·§5를 본다.

## 1. 환경 변수 (서버·빌드 타임)

| 변수 | 기본·의미 | 운영 메모 |
|------|-----------|-----------|
| `API_SLOW_MS` | `1200` (ms) | 이 값 이상 응답 시간이면 Sentry에 **`api_slow`**(warning). 임계만 올리기 전에 DB·쿼리 원인을 본다. |
| `API_ACCESS_LOG` | `0` / `1` | `1`이면 완료 요청을 stdout JSON 한 줄(`k: "api_route"`)로 남김. **일시 진단용**; 상시 ON 시 로그 비용·PII 주의. |
| Sentry DSN 등 | (플랫폼 비밀) | 저장소에 넣지 않고 호스팅·Amplify 환경 변수로만 설정. |

## 2. Sentry에 남는 신호 (검색 키)

| 구분 | 메시지·이벤트 | 레벨 | 태그·추적 |
|------|----------------|------|-----------|
| 느린 HTTP API | `api_slow` | warning | `route`, `status`, `extra.durationMs`, `extra.slowThresholdMs` |
| HTTP 5xx 응답 | `api_http_5xx` | error | `route`, `status`, `extra.durationMs` |
| 라우트 밖 느린 작업 | `slow_operation` | warning | `operation` (태그) |
| 처리 중 예외 | `captureException` | error | `route` (태그), `reportApiException` 경유 |

클라이언트·전역 오류: `global-error.tsx` 등에서 `captureException`이 연결될 수 있다.

## 3. Sentry 콘솔에서 할 일 (샘플 장애 재현)

1. **Issues** → 시간 범위를 “장애 보고 시각” 기준으로 좁힌다.  
2. 필터: 메시지 `api_http_5xx` 또는 `api_slow`, 또는 태그 **`route`** = 의심 경로.  
3. 한 이슈에서 **이벤트 빈도**, **첫 발생 vs 배포 시각**, **release**(설정 시)를 확인한다.  
4. 같은 `route`가 연쇄면 **배포·DB·외부 API**를 의심하고 runbook §3(결제) 등으로 넘긴다.

## 4. 알림·채널

### 4.1 팀 운영 모델 (결정)

| 경로 | 용도 |
|------|------|
| **이메일** | 서버·앱 **치명적** 장애, **5xx 급증**, 운영 판단상 즉시 대응이 필요한 신호. **1차 수신 = 온콜(본인).** |
| **관리자 페이지** | **일상적인** 동작 이상·로그·운영 확인 — Sentry 이메일과 중복되지 않게, 기본 점검 루트로 유지. |
| **인프라·보안** | DDoS, WAF, 호스팅 다운 등은 Sentry 밖에서도 같은 이메일(또는 티켓)로 모으는 것을 권장. |

### 4.2 Sentry에서 할 **다음 작업** (순서대로)

1. [sentry.io](https://sentry.io) → 해당 **Organization** → **Projects** → 이 앱 프로젝트 선택.  
2. **Settings → Alerts** (또는 **Alerts** 메뉴)에서 **Create Alert**.  
3. **Notification actions**에 **이메일**을 넣고, 수신 주소를 온콜(본인) 계정과 동일하게 맞춘다.  
4. 규칙을 **2~3개만** 만든다 — 이메일은 “위험한 것만” (아래 표). `api_slow`·클라이언트 잡음은 **이메일에서 제외**하거나 별도 “낮은 우선순위” 규칙으로 두지 않는다.  
5. **Environment** 필터를 **`production`**(실제 운영 환경명)으로 제한한다.  
6. **테스트:** 배포 환경에서 의도적으로 테스트 이벤트를 올리거나, 기존 `sentry-example-page` / Issues에서 “Send test notification”이 있으면 발송 확인.  
7. 한 번 **Issues**에서 이벤트를 열어 `route`, 시간, 환경이 보이는지 확인한다 (위 **§3** 절차).  
8. [pre-launch-closure.md](./pre-launch-closure.md) §2 표에 “Alerts 생성·이메일 확인·드릴 날짜”를 적어 둔다.

### 4.3 이메일로 보낼 권장 규칙 (최소 세트)

| 규칙 이름(예) | 조건 예시 | 목적 |
|---------------|-----------|------|
| Production 5xx 급증 | 환경 `production` + 메시지/이슈에 `api_http_5xx` + (팀에 맞는) 분당 건수 임계 | 사용자 영향·서버 오류 |
| Production 새 에러 급증 | `production` + Issue 유형 Error + 짧은 창에서 이벤트 수 급증 | 배포 깨짐·연쇄 장애 |
| (선택) 회귀 | Resolved 이슈가 동일 환경에서 재발 | 배포 품질 |

**Nightly E2E 실패:** GitHub Actions `e2e-nightly-full`은 `SLACK_WEBHOOK_URL` 시크릿이 있으면 Slack으로 요약을 보낸다. Sentry 이메일과 역할이 겹치지 않게 둔다.

## 5. 담당·에스컬레이션 (템플릿)

운영 팀이 아래를 채운다.

| 역할 | 담당(이름/역할) | 연락 | 비고 |
|------|-----------------|------|------|
| 1차 온콜 | Kyungyup Back | **Sentry 치명 알림 → 이메일** | 서버·5xx 급증 등 §4.1 |
| 일상 운영 확인 | 동일 팀 | **관리자 페이지** | 일반 오류·로그 조회 |
| 2차(백엔드/인프라) | _미정_ | | DB·배포·PG 이슈 — 필요 시 연락처 기입 |
| 결제·정산 심화 | _미정_ | | runbook §3 + 관리자 화면 |

에스컬레이션: **15~30분 내 이슈 미분류** 또는 **5xx 지속** 시 2차로 올린다(팀 규칙에 맞게 조정).

## 6. 관련 문서

- `docs/qa/pre-launch-closure.md` — 법무·Sentry·연동 일정·웹훅·보안·다국어·게이트 **진입 전 클로저** (알림·온콜 실명 포함)
- `docs/runbook.md` — 액세스 로그, 결제·DB, 등급별 대응  
- `docs/qa/pipeline-principles.md` — CI·Amplify 품질 게이트  
- `.github/workflows/frontend-quality.yml` — PR·스케줄 E2E
