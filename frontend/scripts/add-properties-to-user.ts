/**
 * 특정 사용자에게 매물 추가 스크립트
 * 
 * 실행 방법:
 * 브라우저 콘솔에서 실행하거나, Node.js 환경에서 실행
 */

// LocalStorage에서 사용자 찾기
function findUserByEmail(email: string) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users.find((user: any) => user.email === email);
}

// 랜덤 값 생성 함수들
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 주소 생성
const addresses = [
  'Quận 1, Thành phố Hồ Chí Minh',
  'Quận 2, Thành phố Hồ Chí Minh',
  'Quận 3, Thành phố Hồ Chí Minh',
  'Quận 7, Thành phố Hồ Chí Minh',
  'Quận Bình Thạnh, Thành phố Hồ Chí Minh',
  'Quận Phú Nhuận, Thành phố Hồ Chí Minh',
];

// 랜덤 좌표 생성 (호치민 시 근처)
function randomCoordinates() {
  return {
    lat: 10.7 + (Math.random() * 0.3), // 10.7 ~ 11.0
    lng: 106.6 + (Math.random() * 0.3), // 106.6 ~ 106.9
  };
}

// 랜덤 편의시설 선택
const allAmenities = ['bed', 'aircon', 'sofa', 'kitchen', 'washing', 'refrigerator', 'table', 'wardrobe', 'wifi'];
function randomAmenities(): string[] {
  const count = randomInt(3, 7);
  const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 랜덤 날짜 생성 (1월 ~ 3월)
function randomDate(startMonth: number = 1, endMonth: number = 3): Date {
  const year = 2025;
  const month = randomInt(startMonth, endMonth);
  const day = randomInt(1, 28);
  return new Date(year, month - 1, day);
}

// 매물 생성 함수
function createRandomProperty(ownerId: string, index: number) {
  const checkInDate = randomDate(1, 3);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + randomInt(7, 28)); // 7일 ~ 28일 후

  const address = randomChoice(addresses);
  const coords = randomCoordinates();

  const titles = [
    'Căn hộ đẹp, thoáng mát, gần trung tâm',
    'Phòng trọ sạch sẽ, tiện nghi',
    'Nhà nguyên căn, đầy đủ tiện ích',
    'Studio hiện đại, view đẹp',
  ];

  const descriptions = [
    'Căn hộ rộng rãi, thoáng mát, đầy đủ tiện nghi. Gần chợ, siêu thị, trường học. Phù hợp cho gia đình hoặc nhóm bạn.',
    'Phòng trọ sạch sẽ, yên tĩnh. Có đầy đủ đồ dùng cần thiết. Chủ nhà thân thiện, dễ tính.',
    'Nhà nguyên căn mới xây, thiết kế hiện đại. Có sân vườn, chỗ đậu xe. Gần các tiện ích công cộng.',
    'Studio hiện đại, view đẹp. Nội thất đầy đủ, sẵn sàng vào ở ngay.',
  ];

  const translatedDescriptions = [
    '넓고 쾌적한 아파트, 모든 편의시설 완비. 시장, 슈퍼마켓, 학교 근처. 가족이나 친구 그룹에 적합합니다.',
    '깨끗하고 조용한 원룸. 필요한 모든 물건이 갖춰져 있습니다. 친절하고 이해심 많은 집주인.',
    '새로 지은 단독주택, 현대적인 디자인. 정원과 주차 공간이 있습니다. 공공 편의시설 근처.',
    '현대적인 스튜디오, 아름다운 전망. 가구 완비, 즉시 입주 가능.',
  ];

  return {
    title: titles[index % titles.length],
    original_description: descriptions[index % descriptions.length],
    translated_description: translatedDescriptions[index % translatedDescriptions.length],
    price: randomInt(2000000, 10000000), // 2백만 ~ 1천만 VND
    priceUnit: 'vnd' as const,
    area: randomInt(25, 80), // 25 ~ 80 m²
    bedrooms: randomInt(1, 3),
    bathrooms: randomInt(1, 2),
    coordinates: coords,
    address: address,
    unitNumber: `${String.fromCharCode(65 + index)}동 ${String(randomInt(101, 999)).padStart(3, '0')}호`, // A동 101호 ~ C동 999호
    images: [], // 이미지는 빈 배열로 설정
    amenities: randomAmenities(),
    maxAdults: randomInt(1, 4),
    maxChildren: randomInt(0, 2),
    ownerId: ownerId,
    checkInDate: checkInDate.toISOString(),
    checkOutDate: checkOutDate.toISOString(),
    status: 'active' as const,
  };
}

// 메인 실행 함수
function addPropertiesToUser(email: string, count: number = 4) {
  if (typeof window === 'undefined') {
    console.error('This script must be run in a browser environment');
    return;
  }

  // 사용자 찾기
  const user = findUserByEmail(email);
  if (!user) {
    console.error(`User with email ${email} not found`);
    return;
  }

  console.log(`Found user: ${user.email} (UID: ${user.uid})`);

  // 기존 매물 가져오기
  const existingProperties = JSON.parse(localStorage.getItem('properties') || '[]');
  console.log(`Current properties count: ${existingProperties.length}`);

  // 새 매물 생성 및 추가
  const newProperties = [];
  for (let i = 0; i < count; i++) {
    const property = createRandomProperty(user.uid, i);
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
    const now = new Date().toISOString();
    
    const newProperty = {
      ...property,
      id,
      createdAt: now,
      updatedAt: now,
    };

    newProperties.push(newProperty);
    existingProperties.push(newProperty);
    console.log(`Created property ${i + 1}: ${property.title} (ID: ${id})`);
  }

  // LocalStorage에 저장
  localStorage.setItem('properties', JSON.stringify(existingProperties));
  
  console.log(`\n✅ Successfully added ${count} properties to ${email}`);
  console.log(`Total properties: ${existingProperties.length}`);
  
  return newProperties;
}

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  (window as any).addPropertiesToUser = addPropertiesToUser;
  console.log('Function addPropertiesToUser is now available. Run: addPropertiesToUser("111@gmail.com", 4)');
}

// Node.js 환경에서 직접 실행
if (typeof window === 'undefined' && require.main === module) {
  console.log('This script should be run in a browser console.');
  console.log('To use it, open your browser console and run:');
  console.log('addPropertiesToUser("111@gmail.com", 4)');
}

export { addPropertiesToUser, createRandomProperty };
