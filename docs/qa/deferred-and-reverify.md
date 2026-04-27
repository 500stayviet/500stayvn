# 미룬 작업 · 재점검 메모 (팀 핸드오프용)

**목적:** 출시 전에 일부러 보류했거나, **실환경·실키·실도메인**이 있어야 끝낼 수 있는 항목을 한 곳에 모은다.  
**사용법:** 담당·목표일·완료 증거(스크린샷·PR·로그)를 표 옆에 직접 적어 갱신한다. 상세 규격은 링크된 SoT 문서를 본다.

**관련 클로저 요약:** [pre-launch-closure.md](./pre-launch-closure.md)

**최근 갱신 (Phase 3):** AWS Amplify 기본 도메인을 프로덕션 호스트로 간주해 코드·Gradle·`amplify.yml`·스토어 초안을 맞춤 (`main.dn98z8m9jfvd5.amplifyapp.com`). 아래 표에서 ✅는 저장소 기준 반영 완료, ☐는 **커스텀 도메인·스토어 출시·실키** 등 이후 작업.

---

## 1. 도메인 · TWA · Digital Asset Links

| 상태 | 할 일 | 저장소 / 메모 | 재점검 시 확인 |
|------|--------|----------------|----------------|
| ✅ | Phase 3 **Amplify 호스트** 로 코드·문서 정렬 | `frontend/src/constants/production-host.ts`, `gradle.properties` `twaHostname`, [store-listing-draft.md](./store-listing-draft.md), `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST` in [amplify.yml](../../amplify.yml) | 커스텀 도메인 전환 시 위 파일·Amplify env **한 번에** 치환 |
| ☐ | **커스텀 도메인** 확정 시 재치환 | 동일 경로 + DNS·Amplify 도메인 설정 | `twaHostname`·`metadataBase`·스토어 URL·`.well-known` 모두 동일 호스트 |
| ☐ | 배포 후 **정책 URL·assetlinks** 라이브 검증 | `/privacy`, `/terms`, `/.well-known/assetlinks.json` | 최신 빌드 배포 뒤 브라우저 200·본문·JSON 유효 (이전 배포는 404일 수 있음) |
| ☐ | TWA 로컬/CI 빌드·서명 | [phase3-mobile-app-readiness.md](./phase3-mobile-app-readiness.md) §Android Studio 없이 | `assembleDebug` / `bundleRelease`·keystore |
| ☐ | Play App Signing **SHA-256** 지문 반영 | `frontend/public/.well-known/assetlinks.json` | 플레이스홀더 치환 후 [검증 도구](https://developers.google.com/digital-asset-links/tools/generator) |

---

## 2. MoMo 결제 웹훅 (Phase 4)

| 상태 | 할 일 | 저장소 / 메모 | 재점검 시 확인 |
|------|--------|----------------|----------------|
| ☐ | **`MOMO_PARTNER_SECRET_KEY`** 배포 환경 주입 | `frontend/src/app/api/webhook/momo/route.ts` | 키 없을 때 501, 잘못된 서명 시 401 |
| ☐ | 실 IPN 샘플로 **서명 raw 문자열** 교차 검증 | `frontend/src/lib/payments/momoIpnSignature.ts` — 필드 순서·누락 필드 처리 | MoMo 콘솔/문서와 해시 일치 |
| ☐ | 멱등 적용 + 비즈니스 전이 | `paymentPatchIdempotency.ts`, `bookingPaymentTransition.ts` 등 [SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) | 동일 `orderId`/`transId` 재전송 시 중복 과금·이중 전이 없음 |
| ☐ | MoMo 응답 규격 | 동 라우트 | 처리 후 **HTTP 204**, **15초** 이내 (문서 기준) |
| ☐ | 로그 마스킹 | 운영 가이드 | 시크릿·서명 원문 미기록 |

---

## 3. i18n · 스캔 (선택 강화)

| 상태 | 할 일 | 메모 | 재점검 시 확인 |
|------|--------|------|----------------|
| ☐ | CI에 `scan:ui-ko` / `scan:ui-ko:gate` 편입 여부 결정 | [pipeline-principles.md](./pipeline-principles.md) 와 합의 | PR 파이프라인에서 실패 시 차단 정책 명확 |
| ☐ | 채팅 레거시 본문 마이그레이션 (선택) | `frontend/src/lib/chat/chatMessageDisplay.ts` — 유니코드 키로 남은 **구 한글 시스템 문구**를 `__SV_CHAT:*` 코드로 치환할지 정책 결정 | 구 데이터 조회 시에도 표시 정상 |

---

## 4. 품질 게이트 (주기적)

| 상태 | 할 일 | 명령 / 위치 |
|------|--------|-------------|
| ☐ | 테스트·린트·빌드 | `npm test`, `npx tsc --noEmit`, `npm run lint` 또는 `npm run lint:p3-tier3`, `npm run build` |
| ☐ | E2E / 스모크 | 팀이 정한 Playwright 잡 (예: `mock-scenario-regression`) |

---

## 5. 법무 · 운영 (증거 필요)

[pre-launch-closure.md](./pre-launch-closure.md) **§1** 표를 단일 출처로 두고, 아래만 중복 요약한다.

- 개인정보처리방침·계정 삭제·고객 지원 연락처가 **스토어 / 앱 / 웹 / `operator-contact.ts`** 에서 한 줄로도 어긋나지 않을 것.
- PG·호스팅 등 **하위처리자** 목록·보관 기간은 법무 합의 후 증거 링크 기입.

---

## 6. 환경 변수 치트시트 (나중에 채움)

배포 시 실값 넣을 때 이 표를 복사해 인프라 README나 시크릿 관리 도구에 붙여도 된다.

| 변수 | 용도 | 비고 |
|------|------|------|
| `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST` | 클라이언트·`metadataBase`·법무 각주 | Phase 3 기본값: `main.dn98z8m9jfvd5.amplifyapp.com` (`amplify.yml`·`production-host.ts`) |
| `MOMO_PARTNER_SECRET_KEY` | MoMo IPN HMAC | 서버 전용, 클라이언트 번들 금지 |
| `NEXT_PUBLIC_GEMINI_API_KEY` | 채팅 번역 등 | [translation.ts](../../frontend/src/lib/api/translation.ts) |
| `NEXT_PUBLIC_MY_S3_*` | S3 업로드 | [s3-client.ts](../../frontend/src/lib/s3-client.ts) |

*(기타 `APP_SYNC_*`, Sentry 등은 [pre-launch-closure.md](./pre-launch-closure.md)·[SECURITY_APP_API_CHECKLIST.md](../../frontend/SECURITY_APP_API_CHECKLIST.md) 참고.)*

---

*문서 갱신 시: 완료한 행은 ✅로 바꾸고 날짜·PR 링크를 남기면 추적이 쉽다.*
