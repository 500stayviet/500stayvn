# Search/Add/Edit 스모크 체크 (고정 1회)

검색 리팩터링 이후 최소 회귀 확인을 위해, 아래 시나리오를 **한 번 고정 실행**한다.  
목표는 기능 통과 여부와 권한 기반 차단(BLOCKED)을 분리해 기록하는 것이다.

자동화 표준 실행 규칙은 `docs/qa/e2e-execution-standard.md`를 따른다.

---

## 1) 실행 전 준비

- 앱 실행:
  - `cd frontend`
  - `npm run dev`
- 선택 검증:
  - `npm run build` 1회
- 기준 URL:
  - `http://localhost:3000`

---

## 2) 판정 규칙

- `PASS`: 기능이 기대대로 동작함
- `BLOCKED`: 권한/데이터 선행조건 부족으로 정상 차단됨 (실패 아님)
- `FAIL`: 런타임 오류, 화면 깨짐, 의도와 다른 흐름

---

## 3) 고정 시나리오

### A. 검색 -> 필터 -> 상세 진입

1. `/search` 진입
2. 검색어 입력 또는 도시/구 선택
3. 고급 필터 1개 이상 적용 (가격/편의시설/날짜 중 택1 이상)
4. 검색 결과 카드 클릭
5. `/properties/[id]` 상세 진입 확인

기대 결과:
- 검색 페이지가 정상 렌더링됨
- 필터 적용 후 결과 목록이 변경됨
- 상세로 이동 가능

---

### B. Add 등록 흐름

1. `/add-property` 진입
2. 접근 가능 상태 확인
3. 인증/KYC 미완료 시 차단 메시지/리다이렉트 확인
4. 인증/KYC 완료 계정이면 기본 입력 단계 진입 확인

기대 결과:
- 비로그인/미인증은 정책대로 차단(BLOCKED)
- 조건 충족 계정은 등록 폼 진입 가능(PASS)

---

### C. Edit 등록 흐름

1. `/profile/my-properties` 진입
2. 본인 매물에서 수정 진입 또는 `/profile/my-properties/[id]/edit` 접근
3. 권한/소유권 검증 확인

기대 결과:
- 비로그인/비소유자는 정책대로 차단(BLOCKED)
- 본인 매물은 수정 진입 가능(PASS)

---

## 4) 실행 기록 템플릿

실행 일시:
- YYYY-MM-DD HH:mm (KST/ICT)

환경:
- 브랜치/커밋:
- 브라우저:
- 로그인 상태:

결과:
- Search flow: `PASS | BLOCKED | FAIL`
- Add flow: `PASS | BLOCKED | FAIL`
- Edit flow: `PASS | BLOCKED | FAIL`
- Overall: `PASS | FAIL` (BLOCKED는 Overall FAIL 아님)

메모:
- 오류 메시지/콘솔 에러:
- 차단 지점(권한/데이터):

---

## 5) 현재 최신 실행 요약

- Build 1회: PASS (`npm run build`)
- Search flow: PASS
- Add flow: BLOCKED (인증/KYC 선행 조건)
- Edit flow: BLOCKED (로그인 + 소유 매물 선행 조건)

위 결과는 정책상 정상 차단을 포함한 스모크 PASS로 본다.

