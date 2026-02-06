/**
 * 브라우저 콘솔에서 실행할 코드 - Mock 매물 삭제
 * 
 * 사용법:
 * 1. 브라우저 개발자 도구 열기 (F12)
 * 2. Console 탭 선택
 * 3. 아래 코드를 복사해서 붙여넣고 실행
 */

(function() {
  // LocalStorage에서 매물 데이터 가져오기
  const properties = JSON.parse(localStorage.getItem('properties') || '[]');
  console.log('📦 현재 매물 개수:', properties.length);
  
  // Mock 매물 ID 목록
  const mockPropertyIds = ['1', '2', '3', '4', '5'];
  
  // Mock 매물 이름 목록
  const mockPropertyNames = [
    'Modern Apartment in District 1',
    'Cozy Studio in District 3',
    'Luxury Condo in District 7',
    'Budget Room in Binh Thanh',
    'Family House in District 2'
  ];
  
  // Mock 매물 찾기
  const mockProperties = properties.filter(p => {
    // ID로 확인
    if (mockPropertyIds.includes(p.id)) {
      return true;
    }
    // 이름으로 확인
    if (mockPropertyNames.includes(p.name) || mockPropertyNames.includes(p.title)) {
      return true;
    }
    return false;
  });
  
  if (mockProperties.length === 0) {
    console.log('✅ 삭제할 Mock 매물이 없습니다.');
    return;
  }
  
  console.log('🔍 발견된 Mock 매물:', mockProperties.length, '개');
  mockProperties.forEach((p, index) => {
    console.log(`  ${index + 1}. ID: ${p.id}, 이름: ${p.name || p.title || 'N/A'}`);
  });
  
  // Mock 매물 제외한 나머지 매물만 필터링
  const filteredProperties = properties.filter(p => {
    return !mockProperties.some(mp => mp.id === p.id);
  });
  
  // LocalStorage에 저장
  localStorage.setItem('properties', JSON.stringify(filteredProperties));
  
  console.log('\n✅ Mock 매물 삭제 완료!');
  console.log(`📊 삭제 전: ${properties.length}개 → 삭제 후: ${filteredProperties.length}개`);
  console.log(`🗑️  삭제된 매물: ${mockProperties.length}개`);
  console.log('\n💡 페이지를 새로고침하면 변경사항이 반영됩니다.');
})();
