/**
 * PropertyCard 컴포넌트 (리뉴얼)
 * 
 * 현대적이고 세련된 부동산 매물 카드 디자인
 * - 최소한의 정보로 깔끔한 레이아웃
 * - 마커는 진한 색상으로 눈에 띄게
 * - 방/욕실/인원 정보 강조
 */

'use client';

import { Bed, Bath, Users, Wifi, Sofa, Tv, UtensilsCrossed } from 'lucide-react';
import Image from 'next/image';
import { PropertyData } from '@/types/property';
import { useTranslation } from '@/hooks/useTranslation';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';
import { formatPrice } from '@/lib/utils/propertyUtils';
import { isAvailableNow, formatDateForBadge } from '@/lib/utils/dateUtils';
import { 
  FULL_FURNITURE_IDS, 
  FULL_ELECTRONICS_IDS, 
  FULL_OPTION_KITCHEN_IDS 
} from '@/lib/constants/facilities';

interface PropertyCardProps {
  property: PropertyData;
  isSelected: boolean;
  onClick: () => void;
  currentLanguage: SupportedLanguage;
}

// 컬러 팔레트
const colors = {
  primary: '#E63946',        // Coral Red
  primaryLight: '#FF6B6B',   // Light Coral
  secondary: '#FF6B35',      // Golden Orange
  accent: '#FFB627',         // Sunshine Yellow
  success: '#10B981',        // Emerald Green
  background: '#FFF8F0',     // Warm Cream
  surface: '#FFFFFF',        // White
};

export default function PropertyCard({
  property,
  isSelected,
  onClick,
  currentLanguage,
}: PropertyCardProps) {
  const { translated: translatedTitle, loading: titleLoading } = useTranslation(
    property.title,
    currentLanguage,
    'vi'
  );

  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

  const isAvailable = isAvailableNow(property.checkInDate);

  const displayTitle =
    currentLanguage === 'vi'
      ? property.title
      : titleLoading
        ? getUIText('translationLoading', currentLanguage)
        : translatedTitle || property.title;

  // 뱃지 확인 로직
  const hasWifi = property.amenities?.includes('wifi') || false;
  
  const hasFullFurniture = FULL_FURNITURE_IDS.every(id => 
    property.amenities?.includes(id) || false
  );
  
  const hasFullElectronics = FULL_ELECTRONICS_IDS.every(id => 
    property.amenities?.includes(id) || false
  );
  
  const hasFullOptionKitchen = FULL_OPTION_KITCHEN_IDS.every(id => 
    property.amenities?.includes(id) || false
  );

  const occupancy = (property.maxAdults || 0) + (property.maxChildren || 0);

  return (
    <div
      onClick={onClick}
      style={{ '--card-primary': colors.primary } as React.CSSProperties & { '--card-primary': string }}
      className={`flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 transform ${
        isSelected 
          ? 'ring-4 shadow-2xl' 
          : 'shadow-md hover:shadow-lg hover:scale-[1.02]'
      }`}
      style={{
        ...({
          '--card-primary': colors.primary,
          borderColor: isSelected ? colors.primary : 'transparent',
        } as React.CSSProperties),
        backgroundColor: colors.surface,
      }}
    >
      {/* 이미지 섹션 */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
        <Image 
          src={imageUrl} 
          alt={property.title} 
          fill 
          className="object-cover" 
          sizes="(max-width: 768px) 100vw, 400px" 
        />
        
        {/* 즉시 입주 가능 배지 - 상단 왼쪽 */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg"
              style={{ backgroundColor: colors.success }}
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {currentLanguage === 'ko' ? '즉시입주' : currentLanguage === 'vi' ? 'Vào ngay' : 'Available'}
            </div>
          ) : property.checkInDate && (
            <div 
              className="px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg"
              style={{ backgroundColor: colors.secondary }}
            >
              {formatDateForBadge(property.checkInDate, currentLanguage)}
            </div>
          )}
        </div>

        {/* 가격 배지 - 상단 오른쪽 */}
        <div 
          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl shadow-lg text-white font-bold"
          style={{ backgroundColor: colors.primary }}
        >
          <p className="text-sm">
            {formatPrice(property.price, property.priceUnit)}
            <span className="text-[10px] font-normal ml-1">
              {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : '/week'}
            </span>
          </p>
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="p-4 flex flex-col gap-3 flex-1" style={{ backgroundColor: colors.surface }}>
        {/* 제목 */}
        <div>
          <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug">{displayTitle}</h3>
        </div>

        {/* 마커 뱃지 섹션 - 진한 색상 */}
        {(isAvailable || hasWifi || hasFullFurniture || hasFullElectronics || hasFullOptionKitchen) && (
          <div className="flex flex-wrap gap-2">
            {/* 즉시입주 마커 */}
            {isAvailable && (
              <div 
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: colors.success }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                {currentLanguage === 'ko' ? '즉시입주' : currentLanguage === 'vi' ? 'Vào ngay' : 'Now'}
              </div>
            )}
            
            {/* 와이파이 마커 */}
            {hasWifi && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: colors.secondary }}
              >
                <Wifi className="w-3.5 h-3.5" />
                WiFi
              </div>
            )}
            
            {/* 풀가구 마커 */}
            {hasFullFurniture && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: colors.accent }}
              >
                <Sofa className="w-3.5 h-3.5" />
                {currentLanguage === 'ko' ? '풀가구' : 'Furniture'}
              </div>
            )}
            
            {/* 풀가전 마커 */}
            {hasFullElectronics && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: colors.primary }}
              >
                <Tv className="w-3.5 h-3.5" />
                {currentLanguage === 'ko' ? '풀가전' : 'Electronics'}
              </div>
            )}
            
            {/* 풀옵션 주방 마커 */}
            {hasFullOptionKitchen && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {currentLanguage === 'ko' ? '주방' : 'Kitchen'}
              </div>
            )}
          </div>
        )}

        {/* 하단 정보 - 방/욕실/인원 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-4">
            {/* 방 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1" style={{ color: colors.primary }}>
                <Bed className="w-4 h-4" />
                <span className="text-sm font-bold">{property.bedrooms || 0}</span>
              </div>
              <span className="text-[10px] text-gray-500">{currentLanguage === 'ko' ? '침실' : 'Bed'}</span>
            </div>
            
            {/* 욕실 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1" style={{ color: colors.secondary }}>
                <Bath className="w-4 h-4" />
                <span className="text-sm font-bold">{property.bathrooms || 0}</span>
              </div>
              <span className="text-[10px] text-gray-500">{currentLanguage === 'ko' ? '욕실' : 'Bath'}</span>
            </div>

            {/* 인원 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1" style={{ color: colors.accent }}>
                <Users className="w-4 h-4" />
                <span className="text-sm font-bold">{occupancy}</span>
              </div>
              <span className="text-[10px] text-gray-500">{currentLanguage === 'ko' ? '인원' : 'Pax'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
