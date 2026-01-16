/**
 * 브라우저 콘솔에서 실행할 코드
 * 
 * 사용법:
 * 1. 브라우저 개발자 도구 열기 (F12)
 * 2. Console 탭 선택
 * 3. 아래 코드를 복사해서 붙여넣고 실행
 */

(function() {
  // 사용자 찾기
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === '111@gmail.com');
  
  if (!user) {
    console.error('❌ User 111@gmail.com not found');
    return;
  }
  
  console.log('✅ Found user:', user.email, '(UID:', user.uid + ')');
  
  // 랜덤 값 생성 함수
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // 랜덤 주소
  const addresses = [
    'Quận 1, Thành phố Hồ Chí Minh',
    'Quận 2, Thành phố Hồ Chí Minh',
    'Quận 3, Thành phố Hồ Chí Minh',
    'Quận 7, Thành phố Hồ Chí Minh',
    'Quận Bình Thạnh, Thành phố Hồ Chí Minh',
  ];
  
  // 랜덤 좌표 (호치민 시)
  const randomCoords = () => ({
    lat: 10.7 + (Math.random() * 0.3),
    lng: 106.6 + (Math.random() * 0.3),
  });
  
  // 랜덤 편의시설
  const allAmenities = ['bed', 'aircon', 'sofa', 'kitchen', 'washing', 'refrigerator', 'table', 'wardrobe', 'wifi'];
  const randomAmenities = () => {
    const count = randomInt(3, 7);
    const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  // 랜덤 날짜
  const randomDate = (startMonth = 1, endMonth = 3) => {
    const year = 2025;
    const month = randomInt(startMonth, endMonth);
    const day = randomInt(1, 28);
    return new Date(year, month - 1, day);
  };
  
  // 기존 매물 가져오기
  const properties = JSON.parse(localStorage.getItem('properties') || '[]');
  console.log('📦 Current properties:', properties.length);
  
  // 매물 데이터
  const titles = [
    'Căn hộ đẹp, thoáng mát, gần trung tâm',
    'Phòng trọ sạch sẽ, tiện nghi',
    'Nhà nguyên căn, đầy đủ tiện ích',
    'Studio hiện đại, view đẹp',
  ];
  
  const descriptions = [
    'Căn hộ rộng rãi, thoáng mát, đầy đủ tiện nghi. Gần chợ, siêu thị, trường học.',
    'Phòng trọ sạch sẽ, yên tĩnh. Có đầy đủ đồ dùng cần thiết.',
    'Nhà nguyên căn mới xây, thiết kế hiện đại. Có sân vườn, chỗ đậu xe.',
    'Studio hiện đại, view đẹp. Nội thất đầy đủ, sẵn sàng vào ở ngay.',
  ];
  
  const translatedDescriptions = [
    '넓고 쾌적한 아파트, 모든 편의시설 완비. 시장, 슈퍼마켓, 학교 근처.',
    '깨끗하고 조용한 원룸. 필요한 모든 물건이 갖춰져 있습니다.',
    '새로 지은 단독주택, 현대적인 디자인. 정원과 주차 공간이 있습니다.',
    '현대적인 스튜디오, 아름다운 전망. 가구 완비, 즉시 입주 가능.',
  ];
  
  // 4개 매물 생성
  const newProperties = [];
  for (let i = 0; i < 4; i++) {
    const checkInDate = randomDate(1, 3);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + randomInt(7, 28));
    
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
    const now = new Date().toISOString();
    
    const property = {
      id,
      title: titles[i],
      original_description: descriptions[i],
      translated_description: translatedDescriptions[i],
      price: randomInt(2000000, 10000000),
      priceUnit: 'vnd',
      area: randomInt(25, 80),
      bedrooms: randomInt(1, 3),
      bathrooms: randomInt(1, 2),
      coordinates: randomCoords(),
      address: randomChoice(addresses),
      unitNumber: `${String.fromCharCode(65 + i)}동 ${String(randomInt(101, 999)).padStart(3, '0')}호`,
      images: [],
      amenities: randomAmenities(),
      maxAdults: randomInt(1, 4),
      maxChildren: randomInt(0, 2),
      ownerId: user.uid,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
    
    newProperties.push(property);
    properties.push(property);
    
    console.log(`✅ Created property ${i + 1}: ${property.title}`);
    console.log(`   - Price: ${property.price.toLocaleString()} VND`);
    console.log(`   - Area: ${property.area}m², ${property.bedrooms}BR/${property.bathrooms}BA`);
    console.log(`   - Address: ${property.address}`);
    console.log(`   - Check-in: ${checkInDate.toLocaleDateString()}`);
  }
  
  // LocalStorage에 저장
  localStorage.setItem('properties', JSON.stringify(properties));
  
  console.log('\n🎉 Successfully added 4 properties to 111@gmail.com');
  console.log(`📊 Total properties: ${properties.length}`);
  console.log('\n💡 Refresh the page to see the new properties in "내 매물 관리"');
})();
