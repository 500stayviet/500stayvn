/**
 * PropertyCard 컴포넌트 (업데이트)
 * 
 * 33m2 스타일의 매물 카드 컴포넌트
 * - Firestore 데이터 구조 사용
 * - 실시간 번역 지원
 * - 언어 선택에 따라 동적으로 번역 표시
 */

'use client';

import { Bed, Bath, Square, MapPin, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import { PropertyData } from '@/lib/api/properties';
import { useTranslation } from '@/hooks/useTranslation';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

interface PropertyCardProps {
  property: PropertyData;
  isSelected: boolean;
  onClick: () => void;
  currentLanguage: SupportedLanguage; // 현재 선택된 언어
}

/**
 * 가격 포맷팅 함수
 */
const formatPrice = (price: number, unit: string): string => {
  if (unit === 'vnd') {
    return `${(price / 1000000).toFixed(1)}M VND`;
  }
  return `$${price.toLocaleString()}`;
};


/**
 * PropertyCard 컴포넌트
 * 
 * @param property - Firestore에서 가져온 매물 데이터
 * @param isSelected - 현재 선택된 매물인지 여부
 * @param onClick - 카드 클릭 시 실행될 함수
 * @param currentLanguage - 현재 선택된 언어 (ko, vi, en 등)
 */
export default function PropertyCard({
  property,
  isSelected,
  onClick,
  currentLanguage,
}: PropertyCardProps) {
  // 실시간 번역 Hook - 설명
  // - 언어가 변경되면 자동으로 번역 API 호출
  // - 로딩 상태와 에러 상태도 관리
  const { translated: translatedDescription, loading: descriptionLoading } = useTranslation(
    property.original_description,
    currentLanguage,
    'vi' // 출발 언어는 베트남어로 고정
  );

  // 실시간 번역 Hook - 제목
  // - 제목도 언어에 따라 번역
  const { translated: translatedTitle, loading: titleLoading } = useTranslation(
    property.title,
    currentLanguage,
    'vi' // 출발 언어는 베트남어로 고정
  );

  // 이미지 URL: 실제 이미지가 없으면 플레이스홀더 사용
  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

  // ISO 문자열 또는 Date 객체를 Date로 변환하는 헬퍼 함수
  const parseDate = (dateInput: string | Date | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  // 즉시 입주 가능 여부 확인
  const isAvailableNow = () => {
    const checkIn = parseDate(property.checkInDate);
    if (!checkIn) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    return checkIn <= today;
  };

  // 날짜 포맷팅 (상세 페이지용)
  const formatDate = (dateInput: string | Date | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return '';
    return date.toLocaleDateString(
      currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  // 날짜 포맷팅 (사진 위 표시용: "1월 21일부터")
  const formatDateForBadge = (dateInput: string | Date | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return '';
    if (currentLanguage === 'ko') {
      return `${date.getMonth() + 1}월 ${date.getDate()}일부터`;
    } else if (currentLanguage === 'vi') {
      return `Từ ${date.getDate()}/${date.getMonth() + 1}`;
    } else {
      return `From ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  // 표시할 제목 텍스트 결정
  // - 한국어/영어 선택 시: 번역된 텍스트 또는 원문
  // - 베트남어 선택 시: 원문
  // - 번역 중이면 로딩 표시
  const displayTitle =
    currentLanguage === 'vi'
      ? property.title
      : titleLoading
        ? getUIText('translationLoading', currentLanguage)
        : translatedTitle || property.title;

  // 표시할 설명 텍스트 결정
  // - 한국어/영어 선택 시: 번역된 텍스트 또는 원문
  // - 베트남어 선택 시: 원문
  // - 번역 중이면 로딩 표시
  const displayDescription =
    currentLanguage === 'vi'
      ? property.original_description
      : descriptionLoading
        ? getUIText('translationLoading', currentLanguage)
        : translatedDescription || property.translated_description || property.original_description;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 cursor-pointer overflow-hidden
        transition-all duration-200
        ${isSelected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* 이미지 영역 */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* 좌측 상단: 즉시입주가능 또는 임대 시작 날짜 */}
        {isAvailableNow() ? (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm z-20 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-bold">
              {currentLanguage === 'ko' ? '즉시입주가능' : 
               currentLanguage === 'vi' ? 'Có thể vào ở ngay' : 
               'Available Now'}
            </span>
          </div>
        ) : (
          property.checkInDate ? (
            <div className="absolute top-3 left-3 bg-blue-500 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm z-20 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-bold">
                {formatDateForBadge(property.checkInDate)}
              </span>
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-gray-500 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm z-20 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-bold">
                {currentLanguage === 'ko' ? '날짜 미정' : 
                 currentLanguage === 'vi' ? 'Chưa xác định' : 
                 'Date TBD'}
              </span>
            </div>
          )
        )}

        {/* 가격 배지 (이미지 위에 오버레이) */}
        <div className="absolute top-3 right-3">
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg">
            <span className="text-sm font-bold">
              {formatPrice(property.price, property.priceUnit)}
            </span>
          </div>
        </div>

        {/* 우측 하단: 방 개수, 화장실 개수 */}
        {(property.bedrooms !== undefined || property.bathrooms !== undefined) && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm z-10 flex items-center gap-2">
            {property.bedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{property.bathrooms}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-4">
        {/* 제목 영역 */}
        <h3 className={`text-lg font-bold text-gray-900 mb-2 line-clamp-1 ${titleLoading ? 'opacity-50' : ''}`}>
          {displayTitle}
        </h3>

        {/* 설명 영역: 베트남어와 번역 구분 표시 */}
        <div className="space-y-2 mb-3">
          {/* 베트남어 원문 (작은 글씨, 이탤릭) */}
          {currentLanguage !== 'vi' && (
            <p className="text-xs text-gray-500 italic line-clamp-1">
              {property.original_description}
            </p>
          )}

          {/* 번역된 설명 또는 원문 */}
          <p
            className={`text-sm text-gray-700 line-clamp-2 ${
              descriptionLoading ? 'opacity-50' : ''
            }`}
          >
            {displayDescription}
          </p>
        </div>

        {/* 가격 박스 (33m2 스타일) */}
        <div className="mb-3">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg">
            <span className="text-lg font-bold">
              {formatPrice(property.price, property.priceUnit)}
            </span>
          </div>
        </div>

        {/* 상세 정보 - 언어별 라벨 표시 */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Square className="w-4 h-4" />
            <span>{property.area} {getUIText('area', currentLanguage)}</span>
          </div>
        </div>

        {/* 임대 가능 날짜 */}
        {(property.checkInDate || property.checkOutDate) && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {property.checkInDate && formatDate(property.checkInDate)}
              {property.checkInDate && property.checkOutDate && ' ~ '}
              {property.checkOutDate && formatDate(property.checkOutDate)}
            </span>
          </div>
        )}

        {/* 최대 인원 수 */}
        {(property.maxAdults || property.maxChildren) && (
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            {property.maxAdults !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' ? `성인 ${property.maxAdults}명` : 
                   currentLanguage === 'vi' ? `${property.maxAdults} người lớn` : 
                   `${property.maxAdults} adults`}
                </span>
              </div>
            )}
            {property.maxChildren !== undefined && property.maxChildren > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ko' ? `어린이 ${property.maxChildren}명` : 
                   currentLanguage === 'vi' ? `${property.maxChildren} trẻ em` : 
                   `${property.maxChildren} children`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 위치 정보 */}
        {property.address && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{property.address.split(',').filter((part) => {
              // 동호수 패턴 제거 (예: "C동 301호", "A동 0001호" 등)
              const trimmed = part.trim();
              return !trimmed.match(/[가-힣A-Za-z]동\s*\d+호/);
            }).filter((part, index, arr) => {
              // 중복 제거
              const trimmed = part.trim();
              if (index === 0) return true;
              return trimmed !== arr[index - 1].trim();
            }).join(', ').trim()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
