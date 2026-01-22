import { Wifi, Snowflake, Sun, Refrigerator, Wind, Bed, Dumbbell, Waves, Car, Building, Dog } from 'lucide-react';

export const AMENITY_OPTIONS = [
  { id: 'wifi', label: { ko: '와이파이', vi: 'Wifi', en: 'WiFi' }, icon: Wifi },
  { id: 'aircon', label: { ko: '에어컨', vi: 'Điều hòa', en: 'AC' }, icon: Snowflake },
  { id: 'heating', label: { ko: '난방', vi: 'Sưởi ấm', en: 'Heating' }, icon: Sun },
  { id: 'refrigerator', label: { ko: '냉장고', vi: 'Tủ lạnh', en: 'Refrigerator' }, icon: Refrigerator },
  { id: 'hairdryer', label: { ko: '드라이기', vi: 'Máy sấy tóc', en: 'Hair Dryer' }, icon: Wind },
  { id: 'bed', label: { ko: '침대', vi: 'Giường', en: 'Bed' }, icon: Bed },
  { id: 'gym', label: { ko: '헬스장', vi: 'Phòng gym', en: 'Gym' }, icon: Dumbbell },
  { id: 'pool', label: { ko: '수영장', vi: 'Hồ bơi', en: 'Pool' }, icon: Waves },
  { id: 'parking', label: { ko: '주차장', vi: 'Bãi đậu xe', en: 'Parking' }, icon: Car },
  { id: 'elevator', label: { ko: '엘리베이터', vi: 'Thang máy', en: 'Elevator' }, icon: Building },
  { id: 'pet', label: { ko: '반려동물 동반', vi: 'Thú cưng', en: 'Pet Friendly' }, icon: Dog },
];
