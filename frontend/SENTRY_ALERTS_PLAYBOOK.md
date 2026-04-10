# Sentry Alerts Playbook

이 문서는 Sentry를 운영에서 바로 쓰기 위한 알림 규칙/대시보드 기준을 정의합니다.

## 1) 필수 알림 규칙

## A. API 오류(즉시)

- **이름**: `prod-api-errors-immediate`
- **대상**: `environment:production` + `route:/api/app/*`
- **조건**: 이벤트 레벨 `error` 이상, 또는 이슈 재발(opened/reopened)
- **알림 채널**: 온콜(즉시), 팀 채널(요약)
- **목표**: 5xx/예외를 즉시 감지

## B. 느린 API(집계)

- **이름**: `prod-api-slow-5m`
- **대상**: 메시지 `api_slow`
- **조건**: 5분 동안 N회 이상(초기값 20) 발생
- **알림 채널**: 팀 채널(비긴급)
- **목표**: 노이즈 없이 성능 저하 추세 파악

## C. 인증 관련 오류(즉시)

- **이름**: `prod-auth-errors`
- **대상**: `/api/app/auth/*`, `/api/auth/*`
- **조건**: 10분 내 오류 급증(기준선 대비)
- **알림 채널**: 온콜 + 팀 채널

## 2) 대시보드 위젯 권장

## A. API 에러 Top N

- 필터: `environment:production route:/api/app/*`
- 그룹: `route`, `error.type`
- 기간: 1h / 24h

## B. API 지연 추이

- 필터: `message:"api_slow"`
- 그룹: `tags.route`
- 기간: 24h / 7d

## C. 릴리즈별 오류 분포

- 필터: `environment:production`
- 그룹: `release`, `route`

## D. 사용자 영향

- 필터: `environment:production`
- 지표: affected users/session

## 3) 트리아지 규칙

1. **P1 (즉시 대응)**
   - 로그인 불가
   - `/api/app/bookings|properties|users` 전반 5xx 급증
   - 결제/환불 API 오류
2. **P2 (당일 대응)**
   - 특정 라우트만 오류 증가
   - 느린 API 경고 지속
3. **P3 (계획 반영)**
   - 간헐 경고, 재현 어려운 단건

## 4) Sentry 환경 변수 최소값

```env
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
API_SLOW_MS=1200
```

## 5) 운영 팁

- 릴리즈 이름을 배포 버전과 일치시켜 이슈 회귀 추적
- 온콜 알림은 `error`/`critical` 위주로 제한
- `api_slow`는 경고 전용(긴급 채널 금지)로 분리
- 분기별로 알림 임계값 재조정(트래픽 변동 반영)

