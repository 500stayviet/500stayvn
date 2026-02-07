/**
 * 브라우저 콘솔에서 실행할 코드 - 테스트 매물 삭제
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
  
  // 테스트 매물 제목 목록 (add-properties-console.js로 생성된 매물)
  const testTitles = [
    'Căn hộ đẹp, thoáng mát, gần trung tâm',
    'Phòng trọ sạch sẽ, tiện nghi',
    'Nhà nguyên căn, đầy đủ tiện ích',
    'Studio hiện đại, view đẹp'
  ];
  
  // 테스트 매물 찾기
  const testProperties = properties.filter(p => {
    // 제목으로 확인
    if (testTitles.includes(p.title)) {
      return true;
    }
    // ID가 '1', '2', '3', '4', '5'인 경우 (mockProperties)
    if (p.id === '1' || p.id === '2' || p.id === '3' || p.id === '4' || p.id === '5') {
      return true;
    }
    // 좌표가 null이거나 없는 매물도 테스트 매물일 가능성
    if (!p.coordinates || p.coordinates.lat == null || p.coordinates.lng == null) {
      return true;
    }
    return false;
  });
  
  if (testProperties.length === 0) {
    console.log('✅ 삭제할 테스트 매물이 없습니다.');
    return;
  }
  
  console.log('🔍 발견된 테스트 매물:', testProperties.length, '개');
  testProperties.forEach((p, index) => {
    console.log(`  ${index + 1}. ID: ${p.id}, 제목: ${p.title || 'N/A'}, 좌표: ${p.coordinates ? `${p.coordinates.lat}, ${p.coordinates.lng}` : 'null'}`);
  });
  
  // 테스트 매물 제외한 나머지 매물만 필터링
  const filteredProperties = properties.filter(p => {
    return !testProperties.some(tp => tp.id === p.id);
  });
  
  // LocalStorage에 저장
  localStorage.setItem('properties', JSON.stringify(filteredProperties));
  
  console.log('\n✅ 테스트 매물 삭제 완료!');
  console.log(`📊 삭제 전: ${properties.length}개 → 삭제 후: ${filteredProperties.length}개`);
  console.log(`🗑️  삭제된 매물: ${testProperties.length}개`);
  console.log('\n💡 페이지를 새로고침하면 변경사항이 반영됩니다.');
})();
