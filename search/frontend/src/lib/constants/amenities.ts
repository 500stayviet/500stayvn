import { Wifi, Snowflake, Sun, Refrigerator, Wind, Bed, Dumbbell, Waves, Car, Building, Dog } from 'lucide-react';
import { SupportedLanguage } from '../api/translation';

export interface AmenityOption {
  id: string;
  label: Record<SupportedLanguage, string>;
  icon: any;
}

export const AMENITY_OPTIONS: AmenityOption[] = [
  { id: 'wifi', label: { ko: '와이파이', vi: 'Wifi', en: 'WiFi', ja: 'Wifi', zh: '无线网络' }, icon: Wifi },
  { id: 'aircon', label: { ko: '에어컨', vi: 'Điều hòa', en: 'AC', ja: 'エアコン', zh: '空调' }, icon: Snowflake },
  { id: 'heating', label: { ko: '난방', vi: 'Sưởi ấm', en: 'Heating', ja: '暖房', zh: '暖气' }, icon: Sun },
  { id: 'refrigerator', label: { ko: '냉장고', vi: 'Tủ lạnh', en: 'Refrigerator', ja: '冷蔵庫', zh: '冰箱' }, icon: Refrigerator },
  { id: 'hairdryer', label: { ko: '드라이기', vi: 'Máy sấy tóc', en: 'Hair Dryer', ja: 'ドライヤー', zh: '吹风机' }, icon: Wind },
  { id: 'bed', label: { ko: '침대', vi: 'Giường', en: 'Bed', ja: 'ベッド', zh: '床' }, icon: Bed },
  { id: 'gym', label: { ko: '헬스장', vi: 'Phòng gym', en: 'Gym', ja: 'ジム', zh: '健身房' }, icon: Dumbbell },
  { id: 'pool', label: { ko: '수영장', vi: 'Hồ bơi', en: 'Pool', ja: 'プール', zh: '游泳池' }, icon: Waves },
  { id: 'parking', label: { ko: '주차장', vi: 'Bãi đậu xe', en: 'Parking', ja: '駐車場', zh: '停车场' }, icon: Car },
  { id: 'elevator', label: { ko: '엘리베이터', vi: 'Thang máy', en: 'Elevator', ja: 'エレ베ーター', zh: '电梯' }, icon: Building },
  { id: 'pet', label: { ko: '반려동물 동반', vi: 'Thú cưng', en: 'Pet Friendly', ja: 'ペット可', zh: '允许携带宠物' }, icon: Dog },
];
