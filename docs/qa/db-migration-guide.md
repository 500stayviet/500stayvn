# DB 마이그레이션·운영 가이드

스키마와 마이그레이션은 **`frontend/prisma/schema.prisma`** 및 **`frontend/prisma/migrations/`** 를 기준으로 한다.

## 원칙

1. **스키마 변경은 PR에 마이그레이션 SQL 포함**  
   로컬에서 `npx prisma migrate dev`로 생성한 디렉터리를 커밋한다. 빈 PR(코드만 바꾸고 마이그레이션 없음)은 운영 DB와 불일치를 만든다.

2. **배포 순서**  
   일반적으로 **마이그레이션 적용 → 앱 배포**(호환되는 구 스키마를 읽는 구버전이 없다는 전제) 또는 **확장만 하는 변경**(컬럼 추가 nullable 등)으로 롤링을 설계한다. 컬럼 삭제·타입 축소는 다단계(배포 1: 코드가 구컬럼 미사용, 배포 2: 마이그레이션)를 고려한다.

3. **프로덕션 적용**  
   - `npx prisma migrate deploy --schema prisma/schema.prisma`  
   - 실행 위치: **`frontend/`** (CI/CD 또는 절차화된 작업).  
   - 자동 배포 파이프라인에 넣을 때는 실패 시 롤백·알람 정책을 명시한다.

4. **이미 운영에 수동 반영된 DB**  
   저장소의 마이그레이션 이력만 맞출 때는 **`frontend`에서 `npm run db:baseline`** (`scripts/prisma-baseline.cjs`)로 `migrate resolve --applied`를 일괄 수행한다. **운영 DB에 직접 적용하기 전**에 백업·스테이징 검증을 한다.

5. **백업**  
   마이그레이션 전 **논리 백업 또는 스냅샷**을 권장한다. 특히 데이터 백필·NOT NULL 추가가 있으면 필수다.

6. **시크릿**  
   `DATABASE_URL` 등은 저장소에 넣지 않는다. 호스팅 환경 변수·시크릿 매니저만 사용한다.

7. **관측**  
   마이그레이션 직후 에러율·느린 쿼리를 확인한다. `docs/runbook.md`의 로그·Sentry 절차를 참고한다.

## 로컬 개발

```bash
cd frontend
npx prisma migrate dev --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

새 클론 후 DB가 비어 있으면 `migrate dev` 또는 환경에 맞는 시드 절차를 따른다.

## Node 버전

Prisma CLI는 **CI와 동일 Node(현재 20.x)** 에서 실행하는 것이 안전하다. `docs/qa/ci-runtime-policy.md` 참고.
