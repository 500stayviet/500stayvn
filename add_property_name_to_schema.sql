-- 매물명(propertyName) 필드 추가를 위한 데이터베이스 스키마 업데이트 스크립트
-- 이 스크립트는 기존 Property 테이블에 propertyName 필드를 추가합니다.

-- 1. 현재 스키마 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Property'
ORDER BY ordinal_position;

-- 2. Property 테이블에 propertyName 필드 추가 (PostgreSQL)
-- ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "propertyName" VARCHAR(255);

-- 3. Firestore/NoSQL 데이터베이스의 경우:
--    - 기존 매물 데이터에 propertyName 필드가 없으면 자동으로 null/undefined로 처리됨
--    - 새 매물 등록시 propertyName 필드가 추가됨

-- 4. Prisma 스키마 업데이트 (frontend/prisma/schema.prisma)
--    model Property {
--      id                     String   @id @default(cuid())
--      title                  String
--      propertyName           String?  // 새로 추가된 필드 (선택사항)
--      original_description   String
--      translated_description String
--      // ... 기존 필드들
--    }

-- 5. 백엔드 API 업데이트 필요사항:
--    - Property 타입 정의에 propertyName 필드 추가 (완료)
--    - 매물 등록 API에서 propertyName 필드 수신 및 저장 (완료)
--    - 매물 조회 API에서 propertyName 필드 반환 (필요시)

-- 6. 마이그레이션 실행 방법:
--    a. PostgreSQL: 2번 ALTER TABLE 실행
--    b. Firestore: 자동으로 처리됨 (필드 추가 없이도 작동)
--    c. Prisma: `npx prisma db push` 또는 `npx prisma migrate dev`

-- 7. 테스트 방법:
--    a. 새 매물 등록시 propertyName 입력 확인
--    b. my-properties 페이지에서 매물명 표시 확인
--    c. 기존 매물은 propertyName 없이도 정상 작동 확인

-- 중요: 프로덕션 환경에서는 백업 후 실행