'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  Bed,
  Bath,
  Maximize2,
  X,
} from 'lucide-react';
import { PropertyData } from '@/types/property';
import { getBookedRangesForProperty } from '@/lib/api/properties';
import { toISODateString } from '@/lib/api/bookings';
import CalendarComponent from '@/components/CalendarComponent';
import { PropertyDescription } from '@/components/PropertyDescription';
import { useAuth } from '@/hooks/useAuth';
import {
  FACILITY_OPTIONS,
  FACILITY_CATEGORIES,
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from '@/lib/constants/facilities';
import {
  formatFullPrice,
  getBookableDateSegments,
  getCityDistrictFromCoords,
} from '@/lib/utils/propertyUtils';
import {
  parseDate,
  isAvailableNow,
  formatDateForBadge,
  formatDate,
} from '@/lib/utils/dateUtils';
import { VIETNAM_CITIES, getDistrictsByCityId } from '@/lib/data/vietnam-regions';
import { getUIText } from '@/utils/i18n';
import type { SupportedLanguage } from '@/lib/api/translation';

const COLORS = {
  primary: '#E63946',
  primaryLight: '#FF6B6B',
  secondary: '#FF6B35',
  accent: '#FFB627',
  success: '#10B981',
  error: '#DC2626',
  white: '#FFFFFF',
  background: '#FFF8F0',
  surface: '#FFFFFF',
  border: '#FED7AA',
  borderFocus: '#E63946',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

/** 앱 스타일: 제목용 부드러운 색 (붉은색 대신) */
const LABEL_COLOR = '#78716c';
/** 섹션 구분: 부드러운 점선 */
const SECTION_DASHED = { borderBottom: '1.5px dashed rgba(254, 215, 170, 0.8)' };
/** 행 구분선 */
const ROW_LINE = { borderColor: 'rgba(254, 215, 170, 0.4)' };

export type PropertyDetailViewMode = 'tenant' | 'owner';

export interface PropertyDetailViewProps {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  mode: PropertyDetailViewMode;
  onBack?: () => void;
  onClose?: () => void;
  onEdit?: () => void;
}

export default function PropertyDetailView({
  property,
  currentLanguage,
  mode,
  onBack,
  onClose,
  onEdit,
}: PropertyDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [imageIndex, setImageIndex] = useState(0);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout'>('checkin');
  const [selectedGuests, setSelectedGuests] = useState(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const [addPetSelected, setAddPetSelected] = useState(false);
  const [selectedPetCount, setSelectedPetCount] = useState(1);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petDropdownRef = useRef<HTMLDivElement>(null);

  const maxGuests = Math.max(1, (property?.maxAdults ?? 0) + (property?.maxChildren ?? 0));
  const maxPets = Math.max(1, property?.maxPets ?? 1);
  const petAllowed = !!(property?.petAllowed && (property?.petFee ?? 0) > 0);

  useEffect(() => {
    const max = Math.max(1, (property?.maxAdults ?? 0) + (property?.maxChildren ?? 0));
    setSelectedGuests((prev) => (prev > max ? max : prev));
  }, [property?.maxAdults, property?.maxChildren]);

  useEffect(() => {
    const max = Math.max(1, property?.maxPets ?? 1);
    setSelectedPetCount((prev) => (prev > max ? max : prev));
  }, [property?.maxPets]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(e.target as Node)) {
        setShowGuestDropdown(false);
      }
      if (petDropdownRef.current && !petDropdownRef.current.contains(e.target as Node)) {
        setShowPetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadBookedRanges = async () => {
      if (!property?.id) {
        setBookedRanges([]);
        return;
      }
      try {
        let ranges = await getBookedRangesForProperty(property.id);
        if (property.icalUrl && property.icalUrl.trim()) {
          const res = await fetch('/api/ical/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: property.icalUrl.trim() }),
          });
          if (res.ok) {
            const { events } = await res.json();
            const icalRanges = (events || []).map(
              (e: { start: string; end: string }) => ({
                checkIn: new Date(e.start),
                checkOut: new Date(e.end),
              })
            );
            ranges = [...ranges, ...icalRanges];
          }
        }
        setBookedRanges(ranges);
      } catch {
        setBookedRanges([]);
      }
    };
    loadBookedRanges();
  }, [property?.id, property?.icalUrl]);

  if (!property) return null;

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];

  const { cityName, districtName } = property.coordinates
    ? getCityDistrictFromCoords(property.coordinates.lat, property.coordinates.lng, currentLanguage)
    : { cityName: '', districtName: '' };

  const getCityName = () => {
    if (!property.cityId) return '';
    const city = VIETNAM_CITIES.find((c) => c.id === property.cityId);
    if (!city) return '';
    const langMap: Record<string, string> = {
      ko: city.nameKo,
      vi: city.nameVi,
      en: city.name,
      ja: city.nameJa ?? city.name,
      zh: city.nameZh ?? city.name,
    };
    return langMap[currentLanguage] ?? city.name;
  };

  const getDistrictName = () => {
    if (!property.districtId || !property.cityId) return '';
    const districts = getDistrictsByCityId(property.cityId);
    const district = districts.find((d) => d.id === property.districtId);
    if (!district) return '';
    const langMap: Record<string, string> = {
      ko: district.nameKo,
      vi: district.nameVi,
      en: district.name,
      ja: district.nameJa ?? district.name,
      zh: district.nameZh ?? district.name,
    };
    return langMap[currentLanguage] ?? district.name;
  };

  const getPropertyTypeDisplay = () => {
    if (!property.propertyType) return '';
    const typeMap: Record<string, Record<string, string>> = {
      studio: {
        ko: '스튜디오',
        vi: 'Studio',
        en: 'Studio',
        ja: 'スタジオ',
        zh: '工作室',
      },
      one_room: {
        ko: '원룸(방·거실 분리)',
        vi: 'Phòng đơn (phòng ngủ & phòng khách riêng)',
        en: 'One Room (bedroom & living room separate)',
        ja: 'ワンルーム（寝室・リビング別）',
        zh: '一室（卧室与客厅分开）',
      },
      two_room: {
        ko: '2룸',
        vi: '2 phòng',
        en: '2 Rooms',
        ja: '2ルーム',
        zh: '2室',
      },
      three_plus: {
        ko: '3+룸',
        vi: '3+ phòng',
        en: '3+ Rooms',
        ja: '3+ルーム',
        zh: '3+室',
      },
      detached: {
        ko: '독채',
        vi: 'Nhà riêng',
        en: 'Detached House',
        ja: '一戸建て',
        zh: '独栋房屋',
      },
    };
    return typeMap[property.propertyType]?.[currentLanguage] || property.propertyType;
  };

  const hasFullFurniture =
    FULL_FURNITURE_IDS.length > 0 &&
    FULL_FURNITURE_IDS.every((id) => property.amenities?.includes(id));
  const hasFullElectronics =
    FULL_ELECTRONICS_IDS.length > 0 &&
    FULL_ELECTRONICS_IDS.every((id) => property.amenities?.includes(id));
  const hasFullKitchen =
    FULL_OPTION_KITCHEN_IDS.length > 0 &&
    FULL_OPTION_KITCHEN_IDS.every((id) => property.amenities?.includes(id));

  const displayTitle =
    mode === 'owner'
      ? property.propertyNickname || property.title || property.address || ''
      : property.title || property.address || '';

  const t = (ko: string, vi: string, en: string, ja?: string, zh?: string) => {
    if (currentLanguage === 'ko') return ko;
    if (currentLanguage === 'vi') return vi;
    if (currentLanguage === 'ja') return ja ?? en;
    if (currentLanguage === 'zh') return zh ?? en;
    return en;
  };

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <div
        className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* 헤더: 상단바는 수정하지 않음 - 이 컴포넌트는 상단바 밑 콘텐츠만 담당 */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={onBack ?? onClose}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {t('뒤로', 'Quay lại', 'Back', '戻る', '返回')}
            </span>
          </button>
          {mode === 'owner' && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('수정', 'Chỉnh sửa', 'Edit', '編集', '编辑')}
              </span>
            </button>
          )}
          {mode === 'tenant' && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-0 py-0 pb-6" style={{ backgroundColor: COLORS.background }}>
          {/* 이미지 슬라이더: 모달 폭 꽉 차게, 좌측 현재 사진 + 우측 다음 사진 살짝 보이게, 1/N 표시, 이전/다음 버튼 */}
          <section className="overflow-hidden mb-0 w-full">
            <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
              {/* 좌측 현재 사진 꽉 차고 우측에 다음 사진 살짝 보이게 (88% + 12% 간격, 컨테이너 기준) */}
              {images.length > 1 ? (
                <div
                  className="flex h-full transition-transform duration-300 ease-out"
                  style={{
                    width: `${images.length * 100}%`,
                    transform: `translateX(-${imageIndex * (100 / images.length)}%)`,
                  }}
                >
                  {images.map((src, idx) => (
                    <div key={idx} className="relative shrink-0 h-full" style={{ width: `${88 / images.length}%`, marginRight: `${12 / images.length}%` }}>
                      <Image
                        src={src}
                        alt={`${property.title || ''} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 430px) 100vw, 430px"
                      />
                    </div>
                  ))}
                </div>
              ) : images.length === 1 ? (
                <div className="relative w-full h-full">
                  <Image
                    src={images[0]}
                    alt={property.title || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 430px) 100vw, 430px"
                  />
                </div>
              ) : null}

              {/* 즉시 입주 가능 뱃지 */}
              {isAvailableNow(property.checkInDate) ? (
                <div className="absolute top-1.5 left-1.5 bg-green-600 text-white px-1.5 py-0.5 rounded-sm z-20 flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold">
                    {getUIText('immediateEntry', currentLanguage)}
                  </span>
                </div>
              ) : property.checkInDate ? (
                <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white px-1.5 py-0.5 rounded-sm z-20 flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-bold">
                    {formatDateForBadge(property.checkInDate, currentLanguage)}
                  </span>
                </div>
              ) : null}

              {/* 이미지 개수 표시 (1 / N) */}
              {images.length > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-md z-10 flex items-center gap-1">
                  <span className="text-xs font-medium">{imageIndex + 1} / {images.length}</span>
                </div>
              )}

              {/* 이전/다음 버튼 */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* 가격 정보 - 우측 상단 */}
              <div className="absolute top-1.5 right-1.5 bg-black/80 text-white px-1.5 py-0.5 rounded-sm z-10">
                <p className="text-xs font-bold">
                  {formatFullPrice(property.price, property.priceUnit)}
                </p>
                <p className="text-[9px] text-gray-300">
                  {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : currentLanguage === 'ja' ? '/週' : currentLanguage === 'zh' ? '/周' : '/week'}
                </p>
              </div>

              {/* 방/욕실 정보 - 우측 하단 (개수 표시와 겹치지 않게 왼쪽으로) */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded-sm z-10 flex items-center gap-1">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center gap-0.5">
                    <Bed className="w-3 h-3" />
                    <span className="text-[9px] font-medium">{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div className="flex items-center gap-0.5">
                    <Bath className="w-3 h-3" />
                    <span className="text-[9px] font-medium">{property.bathrooms}</span>
                  </div>
                )}
              </div>

              {/* 전체화면 버튼 (임대인용) */}
              {mode === 'owner' && (
                <button
                  type="button"
                  onClick={() => setFullScreenImageIndex(imageIndex)}
                  className="absolute bottom-2 left-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors z-10"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* 사진 아래: 점선 위에 뱃지 깔끔하게 (박스 없음) */}
            <div className="py-2 px-4 border-b border-dashed" style={{ borderColor: COLORS.border, borderBottomWidth: '1.5px' }}>
              {(hasFullFurniture || hasFullElectronics || hasFullKitchen) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {hasFullFurniture && (
                    <span className="text-[10px] font-semibold" style={{ color: LABEL_COLOR }}>
                      {t('풀 가구', 'Full nội thất', 'Full Furniture', 'フル家具', '全家具')}
                    </span>
                  )}
                  {hasFullElectronics && (
                    <span className="text-[10px] font-semibold" style={{ color: LABEL_COLOR }}>
                      {t('풀 가전', 'Full điện tử', 'Full Electronics', 'フル家電', '全家电')}
                    </span>
                  )}
                  {hasFullKitchen && (
                    <span className="text-[10px] font-semibold" style={{ color: LABEL_COLOR }}>
                      {t('풀옵션 주방', 'Bếp đầy đủ', 'Full Kitchen', 'フルキッチン', '全配厨房')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="px-4">
          {/* 제목·주소 — 매물등록과 동일: 상단 제목, 하단 내용 */}
          <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
            <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>
              {mode === 'owner'
                ? t('매물명', 'Tên BĐS', 'Property', '物件名', '房源')
                : getUIText('address', currentLanguage)}
            </p>
            <p className="text-[11px] leading-snug" style={{ color: COLORS.textSecondary }}>{displayTitle}</p>
          </section>

          {/* 임차인 — 매물등록과 동일 순서·글자크기 */}
          {mode === 'tenant' && (
            <>
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>
                  {getUIText('weeklyRent', currentLanguage)}
                </p>
                <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                  {formatFullPrice(property.price, property.priceUnit)}
                  <span className="ml-1.5" style={{ color: COLORS.textMuted }}>
                    {getUIText('utilitiesIncluded', currentLanguage)}
                    {(property.checkInTime || property.checkOutTime) && ` · ${property.checkInTime || '14:00'}/${property.checkOutTime || '12:00'}`}
                  </span>
                </p>
              </section>

              {(property.checkInDate || property.checkOutDate) && (() => {
                const segments =
                  property.checkInDate && property.checkOutDate
                    ? getBookableDateSegments(
                        property.checkInDate,
                        property.checkOutDate,
                        bookedRanges
                      )
                    : [];
                return (
                  <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                    <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>
                      {getUIText('availableDates', currentLanguage)}
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
                      {segments.length > 0
                        ? segments.length === 1
                          ? `${formatDate(segments[0].start, currentLanguage)} ~ ${formatDate(segments[0].end, currentLanguage)}`
                          : segments.map((seg, i) => `${formatDate(seg.start, currentLanguage)} ~ ${formatDate(seg.end, currentLanguage)}`).join(' · ')
                        : t('예약 가능한 구간 없음', 'Không còn khoảng trống', 'No available periods', '予約可能期間なし', '无可用时段')}
                    </p>
                  </section>
                );
              })()}

              {/* 방·화장실·인원 (한 줄) */}
              {(property.maxAdults || property.maxChildren) && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>
                    {getUIText('maxGuests', currentLanguage)}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
                    {[property.bedrooms != null && `${property.bedrooms} ${t('방', 'Phòng', 'Rooms', '部屋', '房间')}`, property.bathrooms != null && `${property.bathrooms} ${t('화장실', 'Phòng tắm', 'Bathrooms', '浴室', '浴室')}`, (property.maxAdults != null || property.maxChildren != null) && `${(property.maxAdults || 0) + (property.maxChildren || 0)} ${t('인원', 'Người', 'Guests', '人数', '人数')}`].filter(Boolean).join(' · ')}
                  </p>
                </section>
              )}

              {/* 숙소시설 및 정책 — 매물등록과 동일 */}
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                  {getUIText('amenities', currentLanguage)}
                </p>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {FACILITY_OPTIONS.filter((opt) => property.amenities?.includes(opt.id)).map(
                      (amenity) => {
                        const Icon = amenity.icon;
                        const label =
                          (amenity.label as Record<string, string>)[currentLanguage] ||
                          amenity.label.en;
                        const isPet = amenity.id === 'pet';
                        const isCleaning = amenity.id === 'cleaning';
                        const petFee =
                          isPet && property.petAllowed && property.petFee != null
                            ? property.petFee
                            : null;
                        const cleaningCount =
                          isCleaning && (property.cleaningPerWeek ?? 0) > 0
                            ? property.cleaningPerWeek
                            : null;
                        return (
                          <div key={amenity.id} className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3 shrink-0" style={{ color: LABEL_COLOR }} />
                            <span className="text-[10px]" style={{ color: COLORS.text }}>
                              {label}
                              {petFee != null && ` · ${property.priceUnit === 'vnd' ? `${petFee.toLocaleString('vi-VN')} VND` : `$${petFee.toLocaleString()}`}`}
                              {cleaningCount != null && ` · ${cleaningCount}${currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : currentLanguage === 'ja' ? '回/週' : currentLanguage === 'zh' ? '次/周' : '/week'}`}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="text-xs py-0.5" style={{ color: COLORS.textMuted }}>
                    {getUIText('noAmenities', currentLanguage)}
                  </p>
                )}
              </section>

              {property.original_description && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    {getUIText('description', currentLanguage)}
                  </p>
                  <div style={{ color: COLORS.textSecondary }}>
                    <PropertyDescription
                      description={property.original_description}
                      sourceLanguage="vi"
                      targetLanguage={currentLanguage}
                      cacheKey={`property-detail-tenant-${property.id}`}
                      className="text-[11px] leading-relaxed"
                    />
                  </div>
                </section>
              )}

              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                  {getUIText('selectDatesAndGuests', currentLanguage)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setCalendarMode('checkin');
                      setShowCalendar(true);
                      setShowGuestDropdown(false);
                    }}
                    className={`flex flex-col items-center px-1.5 py-2 rounded-none border-b border-solid transition-all ${
                      checkInDate ? 'border-orange-400' : 'border-transparent hover:border-orange-200'
                    }`}
                    style={checkInDate ? undefined : ROW_LINE}
                  >
                    <span className="text-[9px] text-gray-500 mb-0.5">
                      {getUIText('checkIn', currentLanguage)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${checkInDate ? 'text-orange-600' : 'text-gray-400'}`}
                    >
                      {checkInDate
                        ? checkInDate.toLocaleDateString(
                            currentLanguage === 'ko'
                              ? 'ko-KR'
                              : currentLanguage === 'vi'
                                ? 'vi-VN'
                                : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )
                        : getUIText('selectDate', currentLanguage)}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setCalendarMode('checkout');
                      setShowCalendar(true);
                      setShowGuestDropdown(false);
                    }}
                    className={`flex flex-col items-center px-1.5 py-2 rounded-none border-b border-solid transition-all ${
                      checkOutDate ? 'border-orange-400' : 'border-transparent hover:border-orange-200'
                    }`}
                    style={checkOutDate ? undefined : ROW_LINE}
                  >
                    <span className="text-[9px] text-gray-500 mb-0.5">
                      {getUIText('checkOut', currentLanguage)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${checkOutDate ? 'text-orange-600' : 'text-gray-400'}`}
                    >
                      {checkOutDate
                        ? checkOutDate.toLocaleDateString(
                            currentLanguage === 'ko'
                              ? 'ko-KR'
                              : currentLanguage === 'vi'
                                ? 'vi-VN'
                                : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )
                        : getUIText('selectDate', currentLanguage)}
                    </span>
                  </button>
                  <div className="relative" ref={guestDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuestDropdown(!showGuestDropdown);
                        setShowCalendar(false);
                      }}
                      className={`w-full min-h-[44px] flex flex-col items-center justify-center px-1.5 py-2 rounded-none border-b border-solid transition-all ${
                        showGuestDropdown ? 'border-orange-400' : 'border-transparent hover:border-orange-200'
                      }`}
                      style={showGuestDropdown ? undefined : ROW_LINE}
                    >
                      <span className="text-[9px] text-gray-500 mb-0.5">
                        {getUIText('guestSelect', currentLanguage)}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 flex items-center gap-0.5">
                        {selectedGuests}
                        <ChevronDown
                          className={`w-3 h-3 text-gray-500 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </button>
                    {showGuestDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-32 overflow-y-auto">
                        {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setSelectedGuests(n);
                              setShowGuestDropdown(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-xs ${selectedGuests === n ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {n}{' '}
                            {currentLanguage === 'ko'
                              ? '명'
                              : currentLanguage === 'vi'
                                ? 'người'
                                : currentLanguage === 'ja'
                                  ? '名'
                                  : currentLanguage === 'zh'
                                    ? '人'
                                    : ''}
                            {n === maxGuests && (
                              <span className="text-gray-500 font-normal">
                                {' '}
                                {getUIText('maxSuffix', currentLanguage)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {petAllowed && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addPetSelected}
                        onChange={(e) => {
                          setAddPetSelected(e.target.checked);
                          if (!e.target.checked) setSelectedPetCount(0);
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600"
                      />
                      <span className="text-xs text-gray-700">
                        {t(
                          '애완동물과 함께 여행하시나요?',
                          'Bạn có đi cùng thú cưng?',
                          'Traveling with pets?',
                          'ペットと一緒に旅行しますか？',
                          '与宠物一起旅行吗？'
                        )}
                      </span>
                    </label>
                    {addPetSelected && (
                      <div className="relative" ref={petDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowPetDropdown(!showPetDropdown)}
                          className="flex items-center gap-1 px-2 py-1 border-b border-solid text-xs font-medium"
                          style={{ borderColor: LABEL_COLOR, color: LABEL_COLOR }}
                        >
                          {selectedPetCount}
                          {currentLanguage === 'ko'
                            ? '마리'
                            : currentLanguage === 'vi'
                              ? ' con'
                              : currentLanguage === 'ja'
                                ? '匹'
                                : currentLanguage === 'zh'
                                  ? '只'
                                  : ' pet(s)'}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${showPetDropdown ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {showPetDropdown && (
                          <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[70px]">
                            {Array.from({ length: maxPets }, (_, i) => i + 1).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setSelectedPetCount(n);
                                  setShowPetDropdown(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 text-xs ${selectedPetCount === n ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                {n}{' '}
                                {currentLanguage === 'ko'
                                  ? '마리'
                                  : currentLanguage === 'vi'
                                    ? 'con'
                                    : currentLanguage === 'ja'
                                      ? '匹'
                                      : currentLanguage === 'zh'
                                        ? '只'
                                        : ''}
                                {n === maxPets && (
                                  <span className="text-gray-500">
                                    {' '}
                                    {getUIText('maxSuffix', currentLanguage)}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {maxGuests > 0 && selectedGuests === maxGuests && (
                  <p className="mt-2 text-[10px] text-red-600 font-medium">
                    {getUIText('guestOverMaxNotice', currentLanguage)}
                  </p>
                )}
              </section>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!checkInDate || !checkOutDate || !property.id) return;
                    const pets = addPetSelected ? selectedPetCount : 0;
                    const query = `propertyId=${property.id}&checkIn=${toISODateString(checkInDate)}&checkOut=${toISODateString(checkOutDate)}&guests=${selectedGuests}&pets=${pets}`;
                    if (!user) {
                      router.push(
                        `/login?returnUrl=${encodeURIComponent(`/booking?${query}`)}`
                      );
                      return;
                    }
                    router.push(`/booking?${query}`);
                  }}
                  disabled={!checkInDate || !checkOutDate}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                    checkInDate && checkOutDate
                      ? 'bg-orange-500 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {checkInDate && checkOutDate
                    ? getUIText('bookNow', currentLanguage)
                    : getUIText('selectDatesFirst', currentLanguage)}
                </button>
              </div>
            </>
          )}

          {/* 임대인 — 매물등록과 동일 순서: 매물종류 → 방|화장실|인원 → 주소 → 도시·구 → 동호수 → 이용기간 → 임대료 → 숙소시설 → 체크인/아웃 → 설명 → 외부캘린더 */}
          {mode === 'owner' && (
            <>
              {/* 매물 종류 */}
              {property.propertyType && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>{t('매물 종류', 'Loại BĐS', 'Property Type', '物件タイプ', '房源类型')}</p>
                  <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>{getPropertyTypeDisplay()}</p>
                </section>
              )}
              {/* 방 개수 | 화장실 수 | 최대 인원 (한 줄) */}
              {(property.bedrooms !== undefined || property.bathrooms !== undefined || (property.maxAdults != null || property.maxChildren != null)) && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <div className="grid grid-cols-3 gap-2">
                    {property.bedrooms !== undefined && (
                      <div>
                        <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.textSecondary }}>{t('방 개수', 'Số phòng', 'Bedrooms', '寝室数', '卧室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bedrooms}</p>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div>
                        <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.textSecondary }}>{t('화장실 수', 'Số phòng tắm', 'Bathrooms', '浴室数', '浴室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bathrooms}</p>
                      </div>
                    )}
                    {(property.maxAdults != null || property.maxChildren != null) && (
                      <div>
                        <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.textSecondary }}>{t('최대 인원', 'Số người tối đa', 'Max Guests', '最大人数', '最多人数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>
                          {(property.maxAdults || 0) + (property.maxChildren || 0)}
                          {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? ' người' : currentLanguage === 'ja' ? '名' : currentLanguage === 'zh' ? '人' : ' guests'}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
              {/* 주소 */}
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>{t('주소', 'Địa chỉ', 'Address', '住所', '地址')}</p>
                <p className="text-[11px] break-words" style={{ color: COLORS.textSecondary }}>{property.address || '—'}</p>
              </section>
              {/* 도시·구 */}
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>{t('도시·구', 'Thành phố·Quận', 'City·District', '都市・区', '城市・区')}</p>
                <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>{getCityName() || cityName || '—'} / {getDistrictName() || districtName || '—'}</p>
              </section>
              {/* 동호수 */}
              {property.unitNumber && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>{t('동호수', 'Số phòng', 'Unit', '号室', '房号')}</p>
                  <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>{property.unitNumber}</p>
                  <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                    {t('예약 완료 후 임차인에게만 표시', 'Chỉ hiển thị cho người thuê sau khi đặt chỗ', 'Shown to tenants after booking', '予約完了後にテナントにのみ表示', '预订完成后仅向租户显示')}
                  </p>
                </section>
              )}

              {/* 이용기간 (시작일/종료일) */}
              {(property.checkInDate || property.checkOutDate) && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>{t('이용 가능 기간', 'Khoảng trống', 'Available period', '利用可能期間', '可用期间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('시작일', 'Ngày bắt đầu', 'Start Date', '開始日', '开始日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkInDate ? formatDate(property.checkInDate, currentLanguage) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('종료일', 'Ngày kết thúc', 'End Date', '終了日', '结束日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkOutDate ? formatDate(property.checkOutDate, currentLanguage) : '—'}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* 1주일 임대료 */}
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-1.5" style={{ color: COLORS.text }}>{t('1주일 임대료', 'Giá thuê 1 tuần', 'Weekly Rent', '1週間賃貸料', '1周租金')}</p>
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>
                  {formatFullPrice(property.price, property.priceUnit)}
                  <span className="text-[11px] font-normal ml-1.5" style={{ color: COLORS.textMuted }}>
                    {t('공과금/관리비 포함', 'Bao gồm phí', 'incl. utilities', '光熱・管理費込み', '含水电')}
                  </span>
                </p>
              </section>

              {/* 숙소시설 및 정책 — 매물등록과 동일: 카테고리별 제목 + 아이콘/텍스트 */}
              <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                <p className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                  {t('숙소시설 및 정책', 'Tiện ích và chính sách', 'Facilities & Policy', '施設とポリシー', '设施与政策')}
                </p>
                <div className="space-y-4">
                  {FACILITY_CATEGORIES.map((cat) => {
                    const categoryFacilities = FACILITY_OPTIONS.filter((o) => o.category === cat.id);
                    const selectedFacilitiesInCategory = categoryFacilities.filter((opt) =>
                      property.amenities?.includes(opt.id)
                    );
                    if (selectedFacilitiesInCategory.length === 0) return null;
                    return (
                      <div key={cat.id} className="pt-2" style={{ borderTop: '1.5px dashed rgba(254,215,170,0.6)' }}>
                        <p className="text-[11px] font-bold mb-2 text-gray-500">
                          {(cat.label as Record<string, string>)[currentLanguage] ?? cat.label.en}
                        </p>
                        <div className="grid grid-cols-4 gap-2 justify-items-start">
                          {selectedFacilitiesInCategory.map((opt) => {
                            const Icon = opt.icon;
                            const label = (opt.label as Record<string, string>)[currentLanguage] || opt.label.en;
                            const isPet = opt.id === 'pet';
                            const isCleaning = opt.id === 'cleaning';
                            return (
                              <div key={opt.id} className="flex flex-col items-center gap-1 text-left">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.border}40` }}>
                                  <Icon className="w-5 h-5" style={{ color: LABEL_COLOR }} />
                                </div>
                                <span className="text-[10px] font-medium" style={{ color: COLORS.textSecondary }}>
                                  {label}
                                  {isPet && property.petAllowed && property.petFee != null && ` · ${property.priceUnit === 'vnd' ? `${property.petFee.toLocaleString('vi-VN')} VND` : `$${property.petFee.toLocaleString()}`}`}
                                  {isCleaning && property.cleaningPerWeek && ` · ${property.cleaningPerWeek}${currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : currentLanguage === 'ja' ? '回/週' : currentLanguage === 'zh' ? '次/周' : '/week'}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 체크인/체크아웃 시간 */}
              {(property.checkInTime || property.checkOutTime) && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>{t('체크인/체크아웃 시간', 'Giờ check-in/out', 'Check-in/out time', 'チェックイン・アウト', '入住/退房时间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('체크인', 'Check-in', 'Check-in', 'チェックイン', '入住')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkInTime || '14:00'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('체크아웃', 'Check-out', 'Check-out', 'チェックアウト', '退房')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkOutTime || '12:00'}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* 매물 설명 */}
              {property.original_description && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    {t('매물 설명', 'Mô tả BĐS', 'Description', '物件説明', '房源描述')}
                  </p>
                  <div style={{ color: COLORS.text }}>
                    <PropertyDescription
                      description={property.original_description}
                      sourceLanguage="vi"
                      targetLanguage={currentLanguage}
                      cacheKey={`property-detail-owner-${property.id}`}
                      className="text-[11px] leading-relaxed"
                    />
                  </div>
                </section>
              )}

              {/* 외부 캘린더 */}
              {(property.icalPlatform || property.icalCalendarName || property.icalUrl) && (
                <section className="py-3 pb-3 text-left" style={SECTION_DASHED}>
                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    {t('외부 캘린더', 'Lịch ngoài', 'External Calendar', '外部カレンダー', '外部日历')}
                  </p>
                  <div className="space-y-2">
                    {property.icalPlatform && (
                      <div>
                        <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('플랫폼', 'Nền tảng', 'Platform', 'プラットフォーム', '平台')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.icalPlatform}</p>
                      </div>
                    )}
                    {property.icalCalendarName && (
                      <div>
                        <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>{t('캘린더', 'Lịch', 'Calendar', 'カレンダー', '日历')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.icalCalendarName}</p>
                      </div>
                    )}
                    {property.icalUrl && (
                      <div>
                        <p className="text-[11px] font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>iCal URL</p>
                        <p className="text-sm break-all" style={{ color: COLORS.text }}>{property.icalUrl}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </div>

        {/* 임차인: 캘린더 오버레이 */}
        {mode === 'tenant' && showCalendar && (
          <div
            className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCalendar(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onCheckInSelect={(date) => {
                  setCheckInDate(date);
                  setCheckOutDate(null);
                  setCalendarMode('checkout');
                }}
                onCheckOutSelect={(date) => {
                  setCheckOutDate(date);
                  setShowCalendar(false);
                }}
                onCheckInReset={() => {
                  setCheckInDate(null);
                  setCheckOutDate(null);
                  setCalendarMode('checkin');
                }}
                currentLanguage={currentLanguage}
                onClose={() => setShowCalendar(false)}
                mode={calendarMode}
                minDate={parseDate(property.checkInDate) || undefined}
                maxDate={parseDate(property.checkOutDate) || undefined}
                bookedRanges={bookedRanges}
              />
            </div>
          </div>
        )}

        {/* 임대인: 전체화면 이미지 */}
        {mode === 'owner' && fullScreenImageIndex !== null && (
          <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
            <img
              src={images[fullScreenImageIndex]}
              alt={`Full screen ${fullScreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setFullScreenImageIndex(null)}
              className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2 hover:bg-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
