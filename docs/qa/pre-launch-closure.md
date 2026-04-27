# 진입 전 마무리 — 문서·운영 클로저

**목적:** 법무·Sentry·상용 연동 범위/일정·웹훅/멱등·보안·다국어·결제 동선·품질 게이트를 **한 장**에서 “닫혔는지” 판단할 수 있게 한다.  
**원칙:** 세부 규격은 아래 링크 문서가 단일 출처(SoT)이며, 이 문서는 **체크리스트·담당·증거·일정**만 적는다.

| 관련 SoT | 용도 |
|----------|------|
| [runbook.md](../runbook.md) | 장애 1차 대응 순서 |
| [sentry-ops.md](./sentry-ops.md) | Sentry 신호·알림·온콜 |
| [pipeline-principles.md](./pipeline-principles.md) | CI·Amplify 품질 게이트 |
| [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) | App API 봉투·액터·멱등·웹훅 설계 |
| [phase4-staging-checklist.md](./phase4-staging-checklist.md) | 배포 직전 UI·다국어·메일 |
| [p0-1-failure-ui-matrix.md](./p0-1-failure-ui-matrix.md) | 결제·KYC 실패 시 UI 기대 동작 |
| [store-listing-draft.md](./store-listing-draft.md) | 스토어 문구·URL·운영자 표기 |
| [refactor-backlog.md](./refactor-backlog.md) | 졸업 게이트·백로그 동기화 |

---

## 1. 법무·정책 (운영 클로저)

아래는 **법인/사업자 확정 전**에도 방향을 정하고, **실 URL·실명 반영**은 법인 후 증거 칸을 채운다.

| ☐ | 항목 | 담당 | 목표일 | 증거(URL·저장소 경로·계약서 보관처) |
|---|------|------|--------|--------------------------------------|
| ☐ | **개인정보처리방침** 게시·프로덕션 호스트 확정 | | | `https://<PROD_HOST>/privacy` |
| ☐ | **이용약관** 게시(해당 시) | | | |
| ☐ | **계정 삭제** 안내·절차가 스토어/앱/웹 **동일 호스트** | | | `https://<PROD_HOST>/delete-account` |
| ☐ | **고객 지원·개인정보 문의**가 스토어·앱·문서 **한 줄이라도 불일치 없음** | | | [store-listing-draft.md](./store-listing-draft.md), `frontend/src/constants/operator-contact.ts` |
| ☐ | **PG·호스팅·이메일** 등 데이터 처리 위탁/하위처리자 목록 정리 | | | |
| ☐ | **로그·감사** 보관 기간·마스킹 원칙 (PII) 합의 | | | [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) 감사 절 |
| ☐ | **크로스보더·현지 규제**(해당 시) 검토 메모 | | | |

**미적용/보류 항목**은 “의도적 제외 + 담당 + 재검토일”을 표 아래에 한 줄로 남긴다.

---

## 2. Sentry·관측

**Sentry 점검 완료일:** 2026-04-27 — 설정·알림 수신 확인 완료.

**클로저 완료 (2026-04-27):** 1차 온콜 본인 기준으로 Alerts·Production 필터·이메일 수신·샘플 메일·Issues 가시성(URL/OS/Browser) 확인.

| 상태 | 항목 | 담당 | 확인일 | 증거·비고 |
|------|------|------|--------|-----------|
| ✅ | **Alerts** — 치명 규칙(5xx 급증 등)·`production` 필터 | Kyungyup Back | 2026-04-27 | Sentry → Alerts |
| ✅ | **이메일 수신** | 동일 | 2026-04-27 | 샘플 에러 메일 수신 |
| ✅ | **장애 추적 가시성** | 동일 | 2026-04-27 | URL, OS, Browser 등 이슈 상세 확인 |
| ☐ | **2차·결제 심화 온콜** | _팀 확장 시_ | | [sentry-ops.md](./sentry-ops.md) §5 — 인원 늘 때 기입 |

환경 변수: `API_SLOW_MS`, (진단 시만) `API_ACCESS_LOG` — [sentry-ops.md](./sentry-ops.md) §1, [runbook.md](../runbook.md) §2.

---

## 3. 상용 연동 범위·일정

“언제 모의에서 실연동으로 바꾸는지”를 **한 표**로 고정한다. 비어 있으면 진입 판단 불가.

| 영역 | 스코프 (모의 / 스테이징 실 / 프로덕션 실) | 스테이징 목표 | 프로덕션 목표 | 담당 | 비고 |
|------|---------------------------------------------|---------------|---------------|------|------|
| KYC | | | | | |
| 결제·원장 | 모의 → 실 PG(MoMo 등) | 법인·계좌 후 | **2026년 5월 말** (법인 설립 및 계좌 개설 후) | | `pre-launch-closure` 갱신 2026-04-27 |
| 은행·정산 | | | | | |
| OTP·알림 | | | | | |
| 이메일 발송 | | | | | [phase4-staging-checklist.md](./phase4-staging-checklist.md) |

**결제·웹훅:** MoMo 인바운드 골격은 `POST /api/webhook/momo` (2026-04-27). 서명·멱등·실연동은 위 프로덕션 목표에 맞춤.

---

## 4. 웹훅·멱등 (문서 ↔ 코드 ↔ 운영)

| ☐ | 구분 | 상태 | SoT / 액션 |
|---|------|------|------------|
| ☐ | **앱 BFF 멱등** — `POST/PATCH` 결제 `idempotencyKey` | 구현·테스트 기준 [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) §멱등성 | `paymentPatchIdempotency.ts`, `bookingPaymentTransition.ts` |
| ☐ | **인바운드 PG 웹훅** — raw body·서명·replay·내부 전이 헬퍼 | **골격:** `frontend/src/app/api/webhook/momo/route.ts` (2026-04-27). 상용 ON 전 구현·검증 | 동 문서 §상용 오픈 전 체크리스트 표, §결제 웹훅 연동 시 |
| ☐ | **웹훅 시크릿** — env만, 로그 마스킹 | 배포 환경에만 존재 | |
| ☐ | **의도적 미구현** | 있으면 담당·일정 명시 | 이 표 하단에 기록 |

---

## 5. 보안 체크리스트 (요약)

전수는 [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md)만 본다.

- **`/api/app/*` JSON** — `appApiOk` / `appApiError` 봉투 (SSE 등 예외는 문서대로).
- **`x-app-actor-id`** — 문서에 적힌 owner-scoped·민감 조회·결제 경로.
- **동기 시크릿** — `APP_SYNC_ENFORCE_WRITE`·`x-app-sync-secret` (import/벌크 PUT).
- **린트 게이트** — CI·Amplify에서 `lint:p3-tier3` 등 [pipeline-principles.md](./pipeline-principles.md).

---

## 6. 다국어·결제 동선·게이트 → **사용자 신뢰 구간**

신뢰 구간: 사용자가 **돈·신원·법적 고지**를 이해하고, 실패 시 **일관된 메시지**를 보는 경계.

| 신뢰 구간 | 사용자에게 보이는 것 | 코드·테스트·게이트 |
|-----------|----------------------|---------------------|
| **결제·환불** | 성공/실패 토스트·배너, 성공 화면 전 **서버 전이** 확인 | [p0-1-failure-ui-matrix.md](./p0-1-failure-ui-matrix.md), `appPaymentResponse`·전이 테스트, mock E2E (`mock-scenario-regression` 등) |
| **KYC·신원** | 단계 유지, 저장 실패 시 다음 단계 금지 | 동 매트릭스 KYC 절 |
| **5개 언어 일관성** | 한 화면에 언어 혼선 없음 | [phase4-staging-checklist.md](./phase4-staging-checklist.md) UI 표 |
| **법적·지원 URL** | privacy / delete-account / 이메일 한 source | [store-listing-draft.md](./store-listing-draft.md), `operator-contact.ts` |

**품질 게이트 (머지·배포 증거):**

1. `npm test`  
2. `npx tsc --noEmit`  
3. `npm run lint` 또는 CI 동등 `npm run lint:p3-tier3` ([pipeline-principles.md](./pipeline-principles.md))  
4. `npm run build`  
5. 핵심 Playwright 스모크(예: `mock-scenario-regression` 포함 PR job)

**선택(다국어 회귀):** 로컬/주기적으로 `npm run scan:ui-ko:gate` — 임계 초과 시 UI 문자열 이슈. CI 편입 여부는 팀이 [pipeline-principles.md](./pipeline-principles.md)에 맞춰 결정.

---

## 7. 최종 승인 (진입 판단)

| 역할 | 이름 | 날짜 | 서명 |
|------|------|------|------|
| 제품/운영 | | | |
| 기술 | | | |

**조건:** §1~§6에서 **미체크 항목이 “의도적 제외”로 문서화**되었거나, **완료 증거**가 채워졌을 것.

---

*갱신 시: 상용 일정·담당·URL이 바뀌면 본 문서와 `store-listing-draft.md`·`operator-contact.ts`를 같은 PR에서 맞춘다.*
