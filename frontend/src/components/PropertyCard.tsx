/**
 * PropertyCard 컴포넌트
 * 
 * 33m2 스타일의 매물 카드 컴포넌트
 */

'use client';

import { Bed, Bath, Square, MapPin, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import { PropertyData } from '@/lib/api/properties';
import { useTranslation } from '@/hooks/useTranslation';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';
import { 
  formatPrice, 
  parseDate, 
  isAvailableNow, 
  formatDate, 
  formatDateForBadge 
} from '@/lib/utils/propertyUtils';

interface PropertyCardProps {
  property: PropertyData;
  isSelected: boolean;
  onClick: () => void;
  currentLanguage: SupportedLanguage;
}

export default function PropertyCard({
  property,
  isSelected,
  onClick,
  currentLanguage,
}: PropertyCardProps) {
  const { translated: translatedDescription, loading: descriptionLoading } = useTranslation(
    property.original_description,
    currentLanguage,
    'vi'
  );

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

  const displayDescription =
    currentLanguage === 'vi'
      ? property.original_description
      : descriptionLoading
        ? getUIText('translationLoading', currentLanguage)
        : translatedDescription || property.original_description;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform ${
        isSelected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
    >
      {/* 이미지 섹션 */}
      <div className="relative h-48 w-full">
        <Image src={imageUrl} alt={property.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
        
        {/* 즉시 입주 가능 배지 */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isAvailable ? (
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {currentLanguage === 'ko' ? '즉시 입주 가능' : currentLanguage === 'vi' ? 'Có thể vào ngay' : 'Available Now'}
            </div>
          ) : property.checkInDate && (
            <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
              {formatDateForBadge(property.checkInDate, currentLanguage)}
            </div>
          )}
        </div>

        {/* 가격 배지 */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
          <p className="text-sm font-bold text-gray-900">
            {formatPrice(property.price, property.priceUnit)}
            <span className="text-[10px] text-gray-500 font-normal ml-1">
              {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : '/week'}
            </span>
          </p>
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{displayTitle}</h3>
          <div className="flex items-center gap-1.5 text-gray-500 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate">{property.address}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed h-10">
          {displayDescription}
        </p>

        {/* 하단 아이콘 정보 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-500">
              <Bed className="w-4 h-4" />
              <span className="text-xs font-medium">{property.bedrooms || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Bath className="w-4 h-4" />
              <span className="text-xs font-medium">{property.bathrooms || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Square className="w-4 h-4" />
              <span className="text-xs font-medium">{property.area}m²</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">{(property.maxAdults || 0) + (property.maxChildren || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
