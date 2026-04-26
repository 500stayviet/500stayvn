'use client';

/**
 * PropertyDetailView — 매물 상세 공통 UI (AddProperty 페이지 테마 동일)
 * - mode="tenant": 예약(훅 `usePropertyDetailBooking` + `PropertyDetailTenantContent`)
 * - mode="owner": 내 매물 확인(`PropertyDetailOwnerContent`) + 이미지 히어로/전체화면
 */

import { ArrowLeft, Edit, X } from 'lucide-react';
import { PropertyData } from '@/types/property';
import { getCityDistrictFromCoords } from '@/lib/utils/propertyUtils';
import { parseDate } from '@/lib/utils/dateUtils';
import { VIETNAM_CITIES, getDistrictsByCityId } from '@/lib/data/vietnam-regions';
import { getUIText } from '@/utils/i18n';
import type { SupportedLanguage } from '@/lib/api/translation';
import { usePropertyDetailImageSlider } from '@/components/property-detail/usePropertyDetailImageSlider';
import { PropertyDetailImageHero } from '@/components/property-detail/PropertyDetailImageHero';
import { PropertyDetailOwnerImageOverlay } from '@/components/property-detail/PropertyDetailOwnerImageOverlay';
import { usePropertyDetailBooking } from '@/components/property-detail/usePropertyDetailBooking';
import { PropertyDetailTenantContent } from '@/components/property-detail/PropertyDetailTenantContent';
import { PropertyDetailOwnerContent } from '@/components/property-detail/PropertyDetailOwnerContent';
import {
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from '@/lib/constants/facilities';
import CalendarComponent from '@/components/CalendarComponent';

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

const LABEL_COLOR = '#78716c';
const SECTION_DASHED = { borderBottom: '1.5px dashed rgba(254, 215, 170, 0.8)' };

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
  const imageSlider = usePropertyDetailImageSlider(property);
  const booking = usePropertyDetailBooking(property);

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
      studio: { ko: '스튜디오', vi: 'Studio', en: 'Studio', ja: 'スタジオ', zh: '工作室' },
      one_room: {
        ko: '원룸(방·거실 분리)',
        vi: 'Phòng đơn (phòng ngủ & phòng khách riêng)',
        en: 'One Room (bedroom & living room separate)',
        ja: 'ワンルーム（寝室・リビング別）',
        zh: '一室（卧室与客厅分开）',
      },
      two_room: { ko: '2룸', vi: '2 phòng', en: '2 Rooms', ja: '2ルーム', zh: '2室' },
      three_plus: { ko: '3+룸', vi: '3+ phòng', en: '3+ Rooms', ja: '3+ルーム', zh: '3+室' },
      detached: { ko: '독채', vi: 'Nhà riêng', en: 'Detached House', ja: '一戸建て', zh: '独栋房屋' },
    };
    return typeMap[property.propertyType]?.[currentLanguage] || property.propertyType;
  };

  const hasFullFurniture =
    FULL_FURNITURE_IDS.length > 0 && FULL_FURNITURE_IDS.every((id) => property.amenities?.includes(id));
  const hasFullElectronics =
    FULL_ELECTRONICS_IDS.length > 0 && FULL_ELECTRONICS_IDS.every((id) => property.amenities?.includes(id));
  const hasFullKitchen =
    FULL_OPTION_KITCHEN_IDS.length > 0 && FULL_OPTION_KITCHEN_IDS.every((id) => property.amenities?.includes(id));

  const displayTitle = mode === 'owner' ? property.title || '' : '';

  const t = (ko: string, vi: string, en: string, ja?: string, zh?: string) => {
    if (currentLanguage === 'ko') return ko;
    if (currentLanguage === 'vi') return vi;
    if (currentLanguage === 'ja') return ja ?? en;
    if (currentLanguage === 'zh') return zh ?? en;
    return en;
  };

  const propertyTypeLabel = getPropertyTypeDisplay();
  const cityDistrictLine = `${getCityName() || cityName || '—'} / ${getDistrictName() || districtName || '—'}`;

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: COLORS.background }}>
      <div
        className="w-full max-w-[430px] min-h-screen shadow-xl flex flex-col relative"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={onBack ?? onClose}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t('뒤로', 'Quay lại', 'Back', '戻る', '返回')}</span>
          </button>
          {mode === 'owner' && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">{t('수정', 'Chỉnh sửa', 'Edit', '編集', '编辑')}</span>
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
                  <span className="text-sm font-medium">{t('닫기', 'Đóng', 'Close', '閉じる', '关闭')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-visible px-0 py-0 pb-6 min-h-0" style={{ backgroundColor: COLORS.background }}>
          <PropertyDetailImageHero
            property={property}
            currentLanguage={currentLanguage}
            mode={mode}
            colors={{ primary: COLORS.primary, border: COLORS.border, text: COLORS.text }}
            hasFullFurniture={hasFullFurniture}
            hasFullElectronics={hasFullElectronics}
            hasFullKitchen={hasFullKitchen}
            t={t}
            slider={imageSlider}
          />

          <div className="px-4">
            <section className="py-3 text-left" style={SECTION_DASHED}>
              <p className="text-base font-bold mb-1.5" style={{ color: COLORS.text }}>
                {mode === 'owner' ? t('매물명', 'Tên BĐS', 'Property', '物件名', '房源') : getUIText('address', currentLanguage)}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>
                {displayTitle}
              </p>
            </section>

            {mode === 'tenant' && (
              <PropertyDetailTenantContent
                property={property}
                currentLanguage={currentLanguage}
                colors={{
                  primary: COLORS.primary,
                  secondary: COLORS.secondary,
                  border: COLORS.border,
                  text: COLORS.text,
                  textSecondary: COLORS.textSecondary,
                  textMuted: COLORS.textMuted,
                }}
                labelColor={LABEL_COLOR}
                t={t}
                cityDistrictLine={cityDistrictLine}
                propertyTypeLabel={propertyTypeLabel}
                booking={booking}
              />
            )}

            {mode === 'owner' && (
              <PropertyDetailOwnerContent
                property={property}
                currentLanguage={currentLanguage}
                colors={{
                  primary: COLORS.primary,
                  border: COLORS.border,
                  text: COLORS.text,
                  textSecondary: COLORS.textSecondary,
                  textMuted: COLORS.textMuted,
                }}
                t={t}
                cityDistrictLine={cityDistrictLine}
                propertyTypeLabel={propertyTypeLabel}
              />
            )}
          </div>
        </div>

        {mode === 'tenant' && booking.showCalendar && (
          <div
            className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
            onClick={() => booking.setShowCalendar(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <CalendarComponent
                checkInDate={booking.checkInDate}
                checkOutDate={booking.checkOutDate}
                onCheckInSelect={(date) => {
                  booking.setCheckInDate(date);
                  booking.setCheckOutDate(null);
                  booking.setCalendarMode('checkout');
                }}
                onCheckOutSelect={(date) => {
                  booking.setCheckOutDate(date);
                  booking.setShowCalendar(false);
                }}
                onCheckInReset={() => {
                  booking.setCheckInDate(null);
                  booking.setCheckOutDate(null);
                  booking.setCalendarMode('checkin');
                }}
                currentLanguage={currentLanguage}
                onClose={() => booking.setShowCalendar(false)}
                mode={booking.calendarMode}
                minDate={parseDate(property.checkInDate) || undefined}
                maxDate={parseDate(property.checkOutDate) || undefined}
                bookedRanges={booking.bookedRanges}
              />
            </div>
          </div>
        )}

        {mode === 'owner' && (
          <PropertyDetailOwnerImageOverlay
            open={imageSlider.fullScreenImageIndex !== null}
            propertyImages={imageSlider.propertyImages}
            N={imageSlider.N}
            fullScreenImageIndex={imageSlider.fullScreenImageIndex}
            setFullScreenImageIndex={imageSlider.setFullScreenImageIndex}
          />
        )}
      </div>
    </div>
  );
}
