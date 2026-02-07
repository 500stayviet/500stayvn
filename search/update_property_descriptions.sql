-- 이전 매물의 주소가 설명으로 저장된 문제 해결 스크립트
-- 이 스크립트는 데이터베이스에서 주소가 설명으로 저장된 매물들을 찾아서 설명을 비우거나 수정합니다.

-- 1. 현재 상태 확인
SELECT 
    id,
    title,
    address,
    original_description,
    LENGTH(original_description) as desc_length,
    CASE 
        WHEN original_description = address THEN '주소와 동일'
        WHEN original_description LIKE CONCAT('%', address, '%') THEN '주소 포함'
        ELSE '다름'
    END as desc_address_match
FROM "Property"
WHERE original_description IS NOT NULL 
  AND original_description != ''
  AND (original_description = address OR original_description LIKE CONCAT('%', address, '%'))
ORDER BY created_at DESC
LIMIT 20;

-- 2. 주소와 완전히 동일한 설명을 빈 문자열로 업데이트
-- UPDATE "Property"
-- SET original_description = ''
-- WHERE original_description IS NOT NULL 
--   AND original_description = address;

-- 3. 주소를 포함하는 설명에서 주소 부분 제거 (선택적)
-- 예: "ABC 아파트, 123 Nguyen Van Linh Street" -> "ABC 아파트"
-- UPDATE "Property"
-- SET original_description = TRIM(REPLACE(original_description, address, ''))
-- WHERE original_description IS NOT NULL 
--   AND original_description LIKE CONCAT('%', address, '%')
--   AND original_description != address;

-- 4. 업데이트 후 확인
-- SELECT 
--     id,
--     title,
--     address,
--     original_description,
--     LENGTH(original_description) as desc_length
-- FROM "Property"
-- WHERE id IN (업데이트된_ID_목록)
-- ORDER BY created_at DESC;

-- 5. 전체 통계
-- SELECT 
--     COUNT(*) as total_properties,
--     COUNT(CASE WHEN original_description IS NULL OR original_description = '' THEN 1 END) as empty_descriptions,
--     COUNT(CASE WHEN original_description IS NOT NULL AND original_description != '' THEN 1 END) as has_descriptions,
--     COUNT(CASE WHEN original_description = address THEN 1 END) as address_as_description
-- FROM "Property";

-- 중요: 실제 실행 전에 백업을 권장합니다.
-- 실행 방법:
-- 1. 먼저 1번 쿼리로 현재 상태 확인
-- 2. 문제가 있는 데이터 확인 후 2번 UPDATE 실행 (주석 해제)
-- 3. 필요시 3번 UPDATE 실행 (선택적)
-- 4. 4번 쿼리로 결과 확인