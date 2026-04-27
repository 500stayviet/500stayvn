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

## 4. 알림·채널 (팀에서 채우기)

Sentry 프로젝트 **Alerts**에서 아래를 권장한다. 실제 수신 채널(Slack/메일/PagerDuty)과 규칙 이름은 팀이 등록한다.

| 권장 규칙 | 조건 예시 | 목적 |
|-----------|-----------|------|
| API 5xx 급증 | `message:api_http_5xx` + Issue 이벤트 수 N/분 | 사용자 영향 라우트 조기 탐지 |
| 신규 이슈(미할당) | 새 Issue + 환경 production | 분류·담당 배정 |
| 회귀 | 이전 해결 버전 재발 | 배포 품질 |

**Nightly E2E 실패:** GitHub Actions `e2e-nightly-full`은 `SLACK_WEBHOOK_URL` 시크릿이 있으면 Slack으로 요약을 보낸다. Sentry와 별도 채널이어도 된다.

## 5. 담당·에스컬레이션 (템플릿)

운영 팀이 아래를 채운다.

| 역할 | 담당(이름/역할) | 연락 | 비고 |
|------|-----------------|------|------|
| 1차 온콜 | _미정_ | _슬랙/전화_ | Sentry 알림 1차 확인 |
| 2차(백엔드/인프라) | _미정_ | | DB·배포·PG 이슈 |
| 결제·정산 심화 | _미정_ | | runbook §3 + 관리자 화면 |

에스컬레이션: **15~30분 내 이슈 미분류** 또는 **5xx 지속** 시 2차로 올린다(팀 규칙에 맞게 조정).

## 6. 관련 문서

- `docs/runbook.md` — 액세스 로그, 결제·DB, 등급별 대응  
- `docs/qa/pipeline-principles.md` — CI·Amplify 품질 게이트  
- `.github/workflows/frontend-quality.yml` — PR·스케줄 E2E
