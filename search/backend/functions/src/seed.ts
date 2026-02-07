import { prisma } from './config/database';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a test user
  const user = await prisma.user.upsert({
    where: { email: '111@gmail.com' },
    update: {},
    create: {
      id: 'user_test_123',
      email: '111@gmail.com',
      displayName: 'Test User',
      role: 'owner',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // 2. Create sample properties
  const properties = [
    {
      title: 'Căn hộ đẹp, thoáng mát, gần trung tâm',
      original_description: 'Căn hộ rộng rãi, thoáng mát, đầy đủ tiện nghi. Gần chợ, siêu thị, trường học.',
      translated_description: '넓고 쾌적한 아파트, 모든 편의시설 완비. 시장, 슈퍼마켓, 학교 근처.',
      price: 5000000,
      area: 45,
      bedrooms: 1,
      bathrooms: 1,
      address: 'Quận 1, Thành phố Hồ Chí Minh',
      ownerId: user.id,
      amenities: ['bed', 'aircon', 'kitchen', 'wifi'],
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'],
    },
    {
      title: 'Studio hiện đại, view đẹp',
      original_description: 'Studio hiện đại, view đẹp. Nội thất đầy đủ, sẵn sàng vào ở ngay.',
      translated_description: '현대적인 스튜디오, 아름다운 전망. 가구 완비, 즉시 입주 가능.',
      price: 8000000,
      area: 30,
      bedrooms: 1,
      bathrooms: 1,
      address: 'Quận 7, Thành phố Hồ Chí Minh',
      ownerId: user.id,
      amenities: ['bed', 'aircon', 'sofa', 'refrigerator', 'wifi'],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop'],
    }
  ];

  for (const prop of properties) {
    await prisma.property.create({
      data: prop,
    });
  }

  console.log('✅ Successfully seeded 2 properties');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
