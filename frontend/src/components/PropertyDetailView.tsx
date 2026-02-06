'use client';

/**
 * PropertyDetailView — 매물 상세 공통 UI (AddProperty 페이지 테마 동일)
 * - mode="tenant": 예약하는 개념 — 날짜/인원 선택 + 예약하기 버튼 (본문 삭제 없음)
 * - mode="owner": 내 매물 확인 개념 — 수정 버튼, 전체화면 사진 등 (본문 삭제 없음)
 * tenant/owner 동일 디자인(섹션·폰트·여백), 상단바는 수정하지 않음.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Sparkles,
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

  const propertyImages =
    property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=400&fit=crop'];

  const N = propertyImages.length;
  const SLIDER_MID = N;
  const SLIDER_MAX = 3 * N;
  const [imageIndex, setImageIndex] = useState(N > 1 ? SLIDER_MID : 0);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderViewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const [sliderNoTransition, setSliderNoTransition] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    const el = sliderViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setSliderWidth(e.contentRect.width);
    });
    ro.observe(el);
    setSliderWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [N]);

  const displayDotIndex = imageIndex < 0 ? N - 1 : imageIndex > SLIDER_MAX ? 0 : imageIndex % N;
  // 슬라이드: 78% 너비, 좌우 사진 각 10%가 중앙 사진 뒤로 겹침
  const SLIDE_WIDTH_PCT = 0.78;
  const OVERLAP_PCT = 0.10;
  const slideWidthPx = sliderWidth * SLIDE_WIDTH_PCT;
  const overlapPx = slideWidthPx * OVERLAP_PCT;
  const stepPx = slideWidthPx - overlapPx;
  const initialOffsetPx = sliderWidth * (1 - SLIDE_WIDTH_PCT) / 2;
  const sliderOffsetPx =
    N <= 1 || sliderWidth <= 0
      ? 0
      : imageIndex < 0
        ? 0
        : imageIndex > SLIDER_MAX
          ? (3 * N + 1) * stepPx
          : (imageIndex + 1) * stepPx;

  const goToSlide = useCallback((dotIndex: number) => {
    const target = SLIDER_MID + dotIndex;
    if (imageIndex < 0 || imageIndex > SLIDER_MAX) {
      setSliderNoTransition(true);
      setImageIndex(target);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSliderNoTransition(false));
      });
    } else {
      setImageIndex(target);
    }
  }, [imageIndex, N]);

  const goToPrevSlide = useCallback(() => {
    if (N <= 1) return;
    setImageIndex((i) => (i <= 0 ? -1 : i - 1));
  }, [N]);

  const goToNextSlide = useCallback(() => {
    if (N <= 1) return;
    setImageIndex((i) => (i >= SLIDER_MAX - 1 ? SLIDER_MAX : i + 1));
  }, [N, SLIDER_MAX]);

  const handleSwipeStart = useCallback((clientX: number) => {
    touchStartX.current = clientX;
  }, []);

  const handleSwipeEnd = useCallback((clientX: number) => {
    const diff = clientX - touchStartX.current;
    const minSwipe = 50;
    if (Math.abs(diff) < minSwipe || N <= 1) return;
    if (diff > 0) goToPrevSlide();
    else goToNextSlide();
  }, [N, goToPrevSlide, goToNextSlide]);

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
          {mode === 'tenant' && (
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-700 hover:text-gray-900 transition-colors border"
                  style={{ borderColor: COLORS.border }}
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {t('닫기', 'Đóng', 'Close', '閉じる', '关闭')}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-visible px-0 py-0 pb-6 min-h-0" style={{ backgroundColor: COLORS.background }}>
          {/* 매물 사진 슬라이더 (3D 피크: 옆 슬라이드가 살짝 보이고, 넘길 때 입체감) */}
          <section className="overflow-hidden mb-0 w-full" ref={sliderRef}>
            <div
              ref={sliderViewportRef}
              className="relative w-full overflow-hidden bg-gray-200 select-none"
              style={{ aspectRatio: '4/3', perspective: 1200 }}
              onMouseDown={(e) => handleSwipeStart(e.clientX)}
              onMouseUp={(e) => handleSwipeEnd(e.clientX)}
              onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
              onTouchEnd={(e) => e.changedTouches[0] && handleSwipeEnd(e.changedTouches[0].clientX)}
            >
              {/* 트랙: 3복제+좌우 클론 — 루프 시 중간 세트로만 리셋해서 “1번으로 돌아온다” 느낌 없음 */}
              <div
                className="flex h-full items-stretch ease-out"
                style={{
                  paddingLeft: sliderWidth > 0 ? `${initialOffsetPx}px` : '11%',
                  transform: N > 1
                    ? `translate3d(-${sliderOffsetPx}px, 0, 0)`
                    : 'none',
                  transformStyle: 'preserve-3d',
                  transition: sliderNoTransition ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onTransitionEnd={() => {
                  if (N <= 1) return;
                  if (imageIndex === SLIDER_MAX) {
                    setSliderNoTransition(true);
                    setImageIndex(SLIDER_MID);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSliderNoTransition(false));
                    });
                  } else if (imageIndex === -1) {
                    setSliderNoTransition(true);
                    setImageIndex(2 * N - 1);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSliderNoTransition(false));
                    });
                  }
                }}
              >
                {(N > 1
                  ? [
                      propertyImages[N - 1],
                      ...propertyImages,
                      ...propertyImages,
                      ...propertyImages,
                      propertyImages[0],
                    ]
                  : propertyImages
                ).map((src, idx) => {
                  const currentPos = imageIndex < 0 ? 0 : imageIndex + 1;
                  const isCenter = idx === currentPos;
                  const offsetFromCenter = idx - currentPos;
                  const isLast = N > 1 && idx === 3 * N + 1;
                  return (
                    <div
                      key={idx}
                      className="relative shrink-0 h-full transition-all duration-300 ease-out rounded-xl overflow-hidden"
                      style={{
                        width: sliderWidth > 0 ? `${slideWidthPx}px` : '78%',
                        minWidth: sliderWidth > 0 ? slideWidthPx : undefined,
                        height: '100%',
                        marginRight: sliderWidth > 0 && !isLast ? -overlapPx : 0,
                        transform: isCenter
                          ? 'scale(1) translateZ(20px)'
                          : `scale(0.9) translateZ(${-20 + Math.abs(offsetFromCenter) * -10}px)`,
                        transformOrigin: 'center center',
                        opacity: isCenter ? 1 : 0.75,
                        zIndex: isCenter ? 20 : Math.max(1, 10 - Math.abs(offsetFromCenter)),
                        boxShadow: isCenter
                          ? '0 12px 40px rgba(0,0,0,0.3)'
                          : '0 4px 12px rgba(0,0,0,0.15)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <Image
                        src={src}
                        alt={`${property.title || ''} ${(N > 1 ? (idx === 0 ? N : idx <= 3 * N ? ((idx - 1) % N) + 1 : 1) : idx + 1)}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 430px) 85vw, 360px"
                        priority={idx <= 1}
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 즉시 입주 / 입주일 뱃지 */}
              {isAvailableNow(property.checkInDate) ? (
                <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-md z-40 flex items-center gap-1 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-bold">
                    {getUIText('immediateEntry', currentLanguage)}
                  </span>
                </div>
              ) : property.checkInDate ? (
                <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-md z-40 flex items-center gap-1 shadow-lg">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-bold">
                    {formatDateForBadge(property.checkInDate, currentLanguage)}
                  </span>
                </div>
              ) : null}

              {/* 사진 인디케이터: 1/5 형식 + 도트 */}
              {N > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                  <span>{displayDotIndex + 1} / {N}</span>
                  <div className="flex gap-1">
                    {propertyImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                        className={`rounded-full transition-all ${idx === displayDotIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                        aria-label={`사진 ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 좌우 화살표 */}
              {N > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToPrevSlide(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full z-40 transition-all"
                    aria-label="이전 사진"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToNextSlide(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full z-40 transition-all"
                    aria-label="다음 사진"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* 가격 - 우측 상단 */}
              <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg z-40 shadow">
                <p className="text-sm font-bold">{formatFullPrice(property.price, property.priceUnit)}</p>
                <p className="text-xs text-white/80">
                  {currentLanguage === 'ko' ? '/주' : currentLanguage === 'vi' ? '/tuần' : currentLanguage === 'ja' ? '/週' : currentLanguage === 'zh' ? '/周' : '/week'}
                </p>
              </div>

              {/* 방/욕실 - 우측 하단 */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg z-40 flex items-center gap-2 shadow">
                {property.bedrooms !== undefined && (
                  <span className="flex items-center gap-1 text-xs">
                    <Bed className="w-3.5 h-3.5" />{property.bedrooms}
                  </span>
                )}
                {property.bathrooms !== undefined && (
                  <span className="flex items-center gap-1 text-xs">
                    <Bath className="w-3.5 h-3.5" />{property.bathrooms}
                  </span>
                )}
              </div>

              {/* 전체화면 (임대인) */}
              {mode === 'owner' && (
                <button
                  type="button"
                  onClick={() => setFullScreenImageIndex(displayDotIndex)}
                  className="absolute bottom-3 left-3 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full z-40 hover:bg-black/70 transition-colors"
                  aria-label="전체화면"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* 사진 아래: 점선 위에 뱃지 깔끔하게 (박스 없음) - 스냅 모드와 조화 */}
            <div className="py-3 px-4 border-b border-dashed" style={{ borderColor: COLORS.border, borderBottomWidth: '1.5px' }}>
              {(hasFullFurniture || hasFullElectronics || hasFullKitchen) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                  {hasFullFurniture && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50" style={{ color: COLORS.primary }}>
                      {t('풀 가구', 'Full nội thất', 'Full Furniture', 'フル家具', '全家具')}
                    </span>
                  )}
                  {hasFullElectronics && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50" style={{ color: COLORS.primary }}>
                      {t('풀 가전', 'Full điện tử', 'Full Electronics', 'フル家電', '全家电')}
                    </span>
                  )}
                  {hasFullKitchen && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50" style={{ color: COLORS.primary }}>
                      {t('풀옵션 주방', 'Bếp đầy đủ', 'Full Kitchen', 'フルキッチン', '全配厨房')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="px-4">
          {/* 매물명 */}
          <section className="py-3 text-left" style={SECTION_DASHED}>
            <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
              {mode === 'owner'
                ? t('매물명', 'Tên BĐS', 'Property', '物件名', '房源')
                : getUIText('address', currentLanguage)}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>{displayTitle}</p>
          </section>

          {/* 임차인(예약): 임대인과 동일 순서·간격·모양 — 매물종류 → 방|화장실|인원 → 주소 → 도시·구 → 이용기간 → 임대료 → 숙소시설 → 체크인/아웃 → 설명 → 날짜·인원·예약하기 */}
          {mode === 'tenant' && (
            <>
              {property.propertyType && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('매물 종류', 'Loại BĐS', 'Property Type', '物件タイプ', '房源类型')}</p>
                  <p className="text-sm" style={{ color: COLORS.text }}>{getPropertyTypeDisplay()}</p>
                </section>
              )}
              {(property.bedrooms !== undefined || property.bathrooms !== undefined || (property.maxAdults != null || property.maxChildren != null)) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <div className="grid grid-cols-3 gap-2">
                    {property.bedrooms !== undefined && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('방 개수', 'Số phòng', 'Bedrooms', '寝室数', '卧室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bedrooms}</p>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('화장실 수', 'Số phòng tắm', 'Bathrooms', '浴室数', '浴室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bathrooms}</p>
                      </div>
                    )}
                    {(property.maxAdults != null || property.maxChildren != null) && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('최대 인원', 'Số người tối đa', 'Max Guests', '最大人数', '最多人数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>
                          {(property.maxAdults || 0) + (property.maxChildren || 0)}
                          {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? ' người' : currentLanguage === 'ja' ? '名' : currentLanguage === 'zh' ? '人' : ' guests'}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('주소', 'Địa chỉ', 'Address', '住所', '地址')}</p>
                <p className="text-sm break-words leading-relaxed" style={{ color: COLORS.text }}>{property.address || '—'}</p>
              </section>
              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('도시·구', 'Thành phố·Quận', 'City·District', '都市・区', '城市・区')}</p>
                <p className="text-sm" style={{ color: COLORS.text }}>{getCityName() || cityName || '—'} / {getDistrictName() || districtName || '—'}</p>
              </section>
              {(property.checkInDate || property.checkOutDate) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('이용 가능 기간', 'Khoảng trống', 'Available period', '利用可能期間', '可用期间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('시작일', 'Ngày bắt đầu', 'Start Date', '開始日', '开始日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>
                        {property.checkInDate && property.checkOutDate
                          ? (() => {
                              const segments = getBookableDateSegments(property.checkInDate!, property.checkOutDate!, bookedRanges);
                              return segments.length > 0
                                ? segments.length === 1
                                  ? formatDate(segments[0].start, currentLanguage)
                                  : formatDate(segments[0].start, currentLanguage) + ' ~'
                                : '—';
                            })()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('종료일', 'Ngày kết thúc', 'End Date', '終了日', '结束日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>
                        {property.checkInDate && property.checkOutDate
                          ? (() => {
                              const segments = getBookableDateSegments(property.checkInDate!, property.checkOutDate!, bookedRanges);
                              return segments.length > 0
                                ? segments.length === 1
                                  ? formatDate(segments[0].end, currentLanguage)
                                  : formatDate(segments[segments.length - 1].end, currentLanguage)
                                : '—';
                            })()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </section>
              )}
              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('1주일 임대료', 'Giá thuê 1 tuần', 'Weekly Rent', '1週間賃貸料', '1周租金')}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.text }}>
                  {formatFullPrice(property.price, property.priceUnit)}
                  <span className="text-sm font-normal ml-1.5" style={{ color: COLORS.textMuted }}>
                    {t('공과금/관리비 포함', 'Bao gồm phí', 'incl. utilities', '光熱・管理費込み', '含水电')}
                  </span>
                </p>
              </section>

              {/* 숙소시설 및 정책 (임대인과 동일 블록 스타일) */}
              <section
                className="p-5 rounded-2xl text-left"
                style={{
                  backgroundColor: `${COLORS.border}20`,
                  border: `1.5px dashed ${COLORS.border}`,
                }}
              >
                <h2 className="text-base font-bold mb-4 text-left" style={{ color: COLORS.text }}>
                  {currentLanguage === 'ko' ? '숙소시설 및 정책' : currentLanguage === 'vi' ? 'Tiện ích và chính sách' : currentLanguage === 'ja' ? '施設とポリシー' : currentLanguage === 'zh' ? '设施与政策' : 'Facilities & Policy'}
                </h2>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="space-y-6 text-left">
                    {FACILITY_CATEGORIES.map((cat, catIndex) => {
                      const selectedInCategory = FACILITY_OPTIONS.filter(
                        (o) => o.category === cat.id && property.amenities?.includes(o.id)
                      );
                      if (selectedInCategory.length === 0) return null;
                      const hasPrevSelected = FACILITY_CATEGORIES.slice(0, catIndex).some((c) => FACILITY_OPTIONS.some((o) => o.category === c.id && property.amenities?.includes(o.id)));
                      const isBadgeCategory = ['furniture', 'electronics', 'kitchen'].includes(cat.id);
                      const fullFurniture = cat.id === 'furniture' && FULL_FURNITURE_IDS.every((id) => property.amenities?.includes(id));
                      const fullElectronics = cat.id === 'electronics' && FULL_ELECTRONICS_IDS.every((id) => property.amenities?.includes(id));
                      const fullOptionKitchen = cat.id === 'kitchen' && FULL_OPTION_KITCHEN_IDS.every((id) => property.amenities?.includes(id));
                      return (
                        <div
                          key={cat.id}
                          className={`pb-2 text-left ${hasPrevSelected ? 'pt-4' : ''}`}
                          style={hasPrevSelected ? { borderTop: `1.5px dashed ${COLORS.border}` } : undefined}
                        >
                          <div className="flex items-center gap-2 mb-2 justify-start text-left">
                            <p className="text-xs font-bold text-gray-500 text-left">{(cat.label as Record<string, string>)[currentLanguage] ?? cat.label.en}</p>
                            {isBadgeCategory && (fullFurniture || fullElectronics || fullOptionKitchen) && (
                              <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-orange-500" />
                                <p className="text-[10px] text-orange-600 font-medium">{currentLanguage === 'ko' ? '뱃지 획득' : 'Badge'}</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-x-3 gap-y-4 justify-items-center">
                            {selectedInCategory.map((opt) => {
                              const Icon = opt.icon;
                              const label = (opt.label as Record<string, string>)[currentLanguage] || opt.label.en;
                              const isPet = opt.id === 'pet';
                              const isCleaning = opt.id === 'cleaning';
                              return (
                                <div key={opt.id} className="flex flex-col items-center w-full min-w-0">
                                  <div
                                    className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border transition-all"
                                    style={{
                                      backgroundColor: COLORS.primary,
                                      borderColor: COLORS.primary,
                                    }}
                                  >
                                    <Icon className="w-6 h-6 text-white shrink-0" />
                                  </div>
                                  <span className="text-[10px] text-gray-600 font-medium leading-tight text-center mt-1.5 w-full break-words">{label}</span>
                                  {isPet && property.petAllowed && (
                                    <div className="w-full mt-1 text-center">
                                      <p className="text-[10px]" style={{ color: COLORS.textSecondary }}>
                                        {property.maxPets != null && `${currentLanguage === 'ko' ? '최대 ' : ''}${property.maxPets}${currentLanguage === 'ko' ? '마리' : currentLanguage === 'vi' ? ' con' : ''}`}
                                        {property.petFee != null && ` · ${property.priceUnit === 'vnd' ? `${property.petFee.toLocaleString('vi-VN')} VND` : `$${property.petFee.toLocaleString()}`}`}
                                      </p>
                                    </div>
                                  )}
                                  {isCleaning && property.cleaningPerWeek != null && (
                                    <p className="text-[10px] mt-1 w-full text-center" style={{ color: COLORS.textSecondary }}>
                                      {property.cleaningPerWeek}{currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : '/week'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{getUIText('noAmenities', currentLanguage)}</p>
                )}
              </section>

              {(property.checkInTime || property.checkOutTime) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('체크인/체크아웃 시간', 'Giờ check-in/out', 'Check-in/out time', 'チェックイン・アウト', '入住/退房时间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('체크인', 'Check-in', 'Check-in', 'チェックイン', '入住')}</p>
                      <p className="text-base" style={{ color: COLORS.text }}>{property.checkInTime || '14:00'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('체크아웃', 'Check-out', 'Check-out', 'チェックアウト', '退房')}</p>
                      <p className="text-base" style={{ color: COLORS.text }}>{property.checkOutTime || '12:00'}</p>
                    </div>
                  </div>
                </section>
              )}

              {property.original_description && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
                    {getUIText('description', currentLanguage)}
                  </p>
                  <div style={{ color: COLORS.text }}>
                    <PropertyDescription
                      description={property.original_description}
                      sourceLanguage="vi"
                      targetLanguage={currentLanguage}
                      cacheKey={`property-detail-tenant-${property.id}`}
                      className="text-base leading-relaxed"
                    />
                  </div>
                </section>
              )}

              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
                  {getUIText('selectDatesAndGuests', currentLanguage)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setCalendarMode('checkin');
                      setShowCalendar(true);
                      setShowGuestDropdown(false);
                    }}
                    className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
                      checkInDate ? 'bg-orange-50/50' : 'bg-white'
                    }`}
                    style={{ borderColor: checkInDate ? COLORS.secondary : '#d1d5db' }}
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
                    className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
                      checkOutDate ? 'bg-orange-50/50' : 'bg-white'
                    }`}
                    style={{ borderColor: checkOutDate ? COLORS.secondary : '#d1d5db' }}
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
                      className={`w-full min-h-[52px] flex flex-col items-center justify-center px-2 py-2 rounded-lg border-2 border-solid transition-all ${
                        showGuestDropdown ? 'bg-orange-50/50' : 'bg-white'
                      }`}
                      style={{ borderColor: showGuestDropdown ? COLORS.secondary : '#d1d5db' }}
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

          {/* 임대인(내 매물 확인): 동일 디자인 유지, 수정·전체화면 등 */}
          {mode === 'owner' && (
            <>
              {property.propertyType && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('매물 종류', 'Loại BĐS', 'Property Type', '物件タイプ', '房源类型')}</p>
                  <p className="text-sm" style={{ color: COLORS.text }}>{getPropertyTypeDisplay()}</p>
                </section>
              )}
              {(property.bedrooms !== undefined || property.bathrooms !== undefined || (property.maxAdults != null || property.maxChildren != null)) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <div className="grid grid-cols-3 gap-2">
                    {property.bedrooms !== undefined && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('방 개수', 'Số phòng', 'Bedrooms', '寝室数', '卧室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bedrooms}</p>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('화장실 수', 'Số phòng tắm', 'Bathrooms', '浴室数', '浴室数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.bathrooms}</p>
                      </div>
                    )}
                    {(property.maxAdults != null || property.maxChildren != null) && (
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>{t('최대 인원', 'Số người tối đa', 'Max Guests', '最大人数', '最多人数')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>
                          {(property.maxAdults || 0) + (property.maxChildren || 0)}
                          {currentLanguage === 'ko' ? '명' : currentLanguage === 'vi' ? ' người' : currentLanguage === 'ja' ? '名' : currentLanguage === 'zh' ? '人' : ' guests'}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('주소', 'Địa chỉ', 'Address', '住所', '地址')}</p>
                <p className="text-sm break-words leading-relaxed" style={{ color: COLORS.text }}>{property.address || '—'}</p>
              </section>
              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('도시·구', 'Thành phố·Quận', 'City·District', '都市・区', '城市・区')}</p>
                <p className="text-sm" style={{ color: COLORS.text }}>{getCityName() || cityName || '—'} / {getDistrictName() || districtName || '—'}</p>
              </section>
              {property.unitNumber && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('동호수', 'Số phòng', 'Unit', '号室', '房号')}</p>
                  <p className="text-sm" style={{ color: COLORS.text }}>{property.unitNumber}</p>
                  <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>
                    {t('예약 완료 후 임차인에게만 표시', 'Chỉ hiển thị cho người thuê sau khi đặt chỗ', 'Shown to tenants after booking', '予約完了後にテナントにのみ表示', '预订完成后仅向租户显示')}
                  </p>
                </section>
              )}

              {(property.checkInDate || property.checkOutDate) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('이용 가능 기간', 'Khoảng trống', 'Available period', '利用可能期間', '可用期间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('시작일', 'Ngày bắt đầu', 'Start Date', '開始日', '开始日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkInDate ? formatDate(property.checkInDate, currentLanguage) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('종료일', 'Ngày kết thúc', 'End Date', '終了日', '结束日期')}</p>
                      <p className="text-sm" style={{ color: COLORS.text }}>{property.checkOutDate ? formatDate(property.checkOutDate, currentLanguage) : '—'}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="py-3 text-left" style={SECTION_DASHED}>
                <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('1주일 임대료', 'Giá thuê 1 tuần', 'Weekly Rent', '1週間賃貸料', '1周租金')}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.text }}>
                  {formatFullPrice(property.price, property.priceUnit)}
                  <span className="text-sm font-normal ml-1.5" style={{ color: COLORS.textMuted }}>
                    {t('공과금/관리비 포함', 'Bao gồm phí', 'incl. utilities', '光熱・管理費込み', '含水电')}
                  </span>
                </p>
              </section>

              {/* 숙소시설 및 정책 */}
              <section
                className="p-5 rounded-2xl text-left"
                style={{
                  backgroundColor: `${COLORS.border}20`,
                  border: `1.5px dashed ${COLORS.border}`,
                }}
              >
                <h2 className="text-base font-bold mb-4 text-left" style={{ color: COLORS.text }}>
                  {t('숙소시설 및 정책', 'Tiện ích và chính sách', 'Facilities & Policy', '施設とポリシー', '设施与政策')}
                </h2>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="space-y-6 text-left">
                    {FACILITY_CATEGORIES.map((cat, catIndex) => {
                      const selectedInCategory = FACILITY_OPTIONS.filter(
                        (o) => o.category === cat.id && property.amenities?.includes(o.id)
                      );
                      if (selectedInCategory.length === 0) return null;
                      const hasPrevSelected = FACILITY_CATEGORIES.slice(0, catIndex).some((c) => FACILITY_OPTIONS.some((o) => o.category === c.id && property.amenities?.includes(o.id)));
                      const isBadgeCategory = ['furniture', 'electronics', 'kitchen'].includes(cat.id);
                      const fullFurniture = cat.id === 'furniture' && FULL_FURNITURE_IDS.every((id) => property.amenities?.includes(id));
                      const fullElectronics = cat.id === 'electronics' && FULL_ELECTRONICS_IDS.every((id) => property.amenities?.includes(id));
                      const fullOptionKitchen = cat.id === 'kitchen' && FULL_OPTION_KITCHEN_IDS.every((id) => property.amenities?.includes(id));
                      return (
                        <div
                          key={cat.id}
                          className={`pb-2 text-left ${hasPrevSelected ? 'pt-4' : ''}`}
                          style={hasPrevSelected ? { borderTop: `1.5px dashed ${COLORS.border}` } : undefined}
                        >
                          <div className="flex items-center gap-2 mb-2 justify-start text-left">
                            <p className="text-xs font-bold text-gray-500 text-left">{(cat.label as Record<string, string>)[currentLanguage] ?? cat.label.en}</p>
                            {isBadgeCategory && (fullFurniture || fullElectronics || fullOptionKitchen) && (
                              <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-orange-500" />
                                <p className="text-[10px] text-orange-600 font-medium">{currentLanguage === 'ko' ? '뱃지 획득' : 'Badge'}</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-x-3 gap-y-4 justify-items-center">
                            {selectedInCategory.map((opt) => {
                              const Icon = opt.icon;
                              const label = (opt.label as Record<string, string>)[currentLanguage] || opt.label.en;
                              const isPet = opt.id === 'pet';
                              const isCleaning = opt.id === 'cleaning';
                              return (
                                <div key={opt.id} className="flex flex-col items-center w-full min-w-0">
                                  <div
                                    className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border transition-all"
                                    style={{
                                      backgroundColor: COLORS.primary,
                                      borderColor: COLORS.primary,
                                    }}
                                  >
                                    <Icon className="w-6 h-6 text-white shrink-0" />
                                  </div>
                                  <span className="text-[10px] text-gray-600 font-medium leading-tight text-center mt-1.5 w-full break-words">{label}</span>
                                  {isPet && property.petAllowed && (
                                    <div className="w-full mt-1 text-center">
                                      <p className="text-[10px]" style={{ color: COLORS.textSecondary }}>
                                        {property.maxPets != null && `${currentLanguage === 'ko' ? '최대 ' : ''}${property.maxPets}${currentLanguage === 'ko' ? '마리' : currentLanguage === 'vi' ? ' con' : ''}`}
                                        {property.petFee != null && ` · ${property.priceUnit === 'vnd' ? `${property.petFee.toLocaleString('vi-VN')} VND` : `$${property.petFee.toLocaleString()}`}`}
                                      </p>
                                    </div>
                                  )}
                                  {isCleaning && property.cleaningPerWeek != null && (
                                    <p className="text-[10px] mt-1 w-full text-center" style={{ color: COLORS.textSecondary }}>
                                      {property.cleaningPerWeek}{currentLanguage === 'ko' ? '회/주' : currentLanguage === 'vi' ? ' lần/tuần' : '/week'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color: COLORS.textMuted }}>{getUIText('noAmenities', currentLanguage)}</p>
                )}
              </section>

              {(property.checkInTime || property.checkOutTime) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>{t('체크인/체크아웃 시간', 'Giờ check-in/out', 'Check-in/out time', 'チェックイン・アウト', '入住/退房时间')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('체크인', 'Check-in', 'Check-in', 'チェックイン', '入住')}</p>
                      <p className="text-base" style={{ color: COLORS.text }}>{property.checkInTime || '14:00'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: COLORS.text }}>{t('체크아웃', 'Check-out', 'Check-out', 'チェックアウト', '退房')}</p>
                      <p className="text-base" style={{ color: COLORS.text }}>{property.checkOutTime || '12:00'}</p>
                    </div>
                  </div>
                </section>
              )}

              {property.original_description && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
                    {t('매물 설명', 'Mô tả BĐS', 'Description', '物件説明', '房源描述')}
                  </p>
                  <div style={{ color: COLORS.text }}>
                    <PropertyDescription
                      description={property.original_description}
                      sourceLanguage="vi"
                      targetLanguage={currentLanguage}
                      cacheKey={`property-detail-owner-${property.id}`}
                      className="text-base leading-relaxed"
                    />
                  </div>
                </section>
              )}

              {(property.icalPlatform || property.icalCalendarName || property.icalUrl) && (
                <section className="py-3 text-left" style={SECTION_DASHED}>
                  <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
                    {t('외부 캘린더', 'Lịch ngoài', 'External Calendar', '外部カレンダー', '外部日历')}
                  </p>
                  <div className="space-y-2">
                    {property.icalPlatform && (
                      <div>
                        <p className="text-sm font-bold mb-0.5" style={{ color: COLORS.text }}>{t('플랫폼', 'Nền tảng', 'Platform', 'プラットフォーム', '平台')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.icalPlatform}</p>
                      </div>
                    )}
                    {property.icalCalendarName && (
                      <div>
                        <p className="text-sm font-bold mb-0.5" style={{ color: COLORS.text }}>{t('캘린더', 'Lịch', 'Calendar', 'カレンダー', '日历')}</p>
                        <p className="text-sm" style={{ color: COLORS.text }}>{property.icalCalendarName}</p>
                      </div>
                    )}
                    {property.icalUrl && (
                      <div>
                        <p className="text-sm font-bold mb-0.5" style={{ color: COLORS.text }}>iCal URL</p>
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

        {/* 임대인: 전체화면 이미지 (3D 슬라이더) */}
        {mode === 'owner' && fullScreenImageIndex !== null && (
          <div
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
            style={{ perspective: 1400 }}
            onClick={() => setFullScreenImageIndex(null)}
          >
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 중앙 이미지 (3D 전환 효과) */}
              <div
                className="relative w-full max-w-4xl h-[80vh] mx-4 flex items-center justify-center overflow-hidden rounded-xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  key={fullScreenImageIndex}
                  src={propertyImages[fullScreenImageIndex]}
                  alt={`사진 ${fullScreenImageIndex + 1}`}
                  className="w-full h-full object-contain rounded-xl shadow-2xl transition-all duration-300"
                  style={{
                    transform: 'translateZ(0) scale(1)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                  }}
                />
              </div>

              {/* 좌우 네비게이션 */}
              {N > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImageIndex((i) => (i! <= 0 ? N - 1 : i! - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full z-50 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImageIndex((i) => (i! >= N - 1 ? 0 : i! + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full z-50 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* 인디케이터 */}
              {N > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  <span>{fullScreenImageIndex + 1} / {N}</span>
                  <div className="flex gap-1.5">
                    {propertyImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullScreenImageIndex(idx);
                        }}
                        className={`rounded-full transition-all ${idx === fullScreenImageIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 닫기 */}
              <button
                type="button"
                onClick={() => setFullScreenImageIndex(null)}
                className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2.5 hover:bg-white transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
