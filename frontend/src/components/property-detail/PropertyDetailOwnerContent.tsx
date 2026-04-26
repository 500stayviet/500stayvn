"use client";

import { PropertyDescription } from "@/components/PropertyDescription";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice } from "@/lib/utils/propertyUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { PropertyDetailFacilitiesSection } from "./PropertyDetailFacilitiesSection";

const SECTION_DASHED = { borderBottom: "1.5px dashed rgba(254, 215, 170, 0.8)" };

type TFn = (ko: string, vi: string, en: string, ja?: string, zh?: string) => string;

type ColorTokens = {
  primary: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

type Props = {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  colors: ColorTokens;
  t: TFn;
  cityDistrictLine: string;
  propertyTypeLabel: string;
};

/**
 * 임대인 모드: 내 매물 확인 — 단위/외부캘린더 등 임대인 전용 필드 포함.
 */
export function PropertyDetailOwnerContent({ property, currentLanguage, colors, t, cityDistrictLine, propertyTypeLabel }: Props) {
  return (
    <>
      {property.propertyType && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("매물 종류", "Loại BĐS", "Property Type", "物件タイプ", "房源类型")}
          </p>
          <p className="text-sm" style={{ color: colors.text }}>
            {propertyTypeLabel}
          </p>
        </section>
      )}
      {(property.bedrooms !== undefined ||
        property.bathrooms !== undefined ||
        property.maxAdults != null ||
        property.maxChildren != null) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <div className="grid grid-cols-3 gap-2">
            {property.bedrooms !== undefined && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {t("방 개수", "Số phòng", "Bedrooms", "寝室数", "卧室数")}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.bedrooms}
                </p>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {t("화장실 수", "Số phòng tắm", "Bathrooms", "浴室数", "浴室数")}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.bathrooms}
                </p>
              </div>
            )}
            {(property.maxAdults != null || property.maxChildren != null) && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  {t("최대 인원", "Số người tối đa", "Max Guests", "最大人数", "最多人数")}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {(property.maxAdults || 0) + (property.maxChildren || 0)}
                  {currentLanguage === "ko"
                    ? "명"
                    : currentLanguage === "vi"
                      ? " người"
                      : currentLanguage === "ja"
                        ? "名"
                        : currentLanguage === "zh"
                          ? "人"
                          : " guests"}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {t("도시·구", "Thành phố·Quận", "City·District", "都市・区", "城市・区")}
        </p>
        <p className="text-sm" style={{ color: colors.text }}>
          {cityDistrictLine}
        </p>
      </section>
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {t("주소", "Địa chỉ", "Address", "住所", "地址")}
        </p>
        <p className="text-sm break-words leading-relaxed" style={{ color: colors.text }}>
          {property.address || "—"}
        </p>
      </section>
      {property.unitNumber && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("동호수", "Số phòng", "Unit", "号室", "房号")}
          </p>
          <p className="text-sm" style={{ color: colors.text }}>
            {property.unitNumber}
          </p>
          <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
            {t(
              "예약 완료 후 임차인에게만 표시",
              "Chỉ hiển thị cho người thuê sau khi đặt chỗ",
              "Shown to tenants after booking",
              "予約完了後にテナントにのみ表示",
              "预订完成后仅向租户显示",
            )}
          </p>
        </section>
      )}

      {(property.checkInDate || property.checkOutDate) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("이용 가능 기간", "Khoảng trống", "Available period", "利用可能期間", "可用期间")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {t("시작일", "Ngày bắt đầu", "Start Date", "開始日", "开始日期")}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkInDate ? formatDate(property.checkInDate, currentLanguage) : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {t("종료일", "Ngày kết thúc", "End Date", "終了日", "结束日期")}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkOutDate ? formatDate(property.checkOutDate, currentLanguage) : "—"}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {t("1주일 임대료", "Giá thuê 1 tuần", "Weekly Rent", "1週間賃貸料", "1周租金")}
        </p>
        <p className="text-lg font-bold" style={{ color: colors.text }}>
          {formatFullPrice(property.price, property.priceUnit)}
          <span className="text-sm font-normal ml-1.5" style={{ color: colors.textMuted }}>
            {t("공과금/관리비 포함", "Bao gồm phí", "incl. utilities", "光熱・管理費込み", "含水电")}
          </span>
        </p>
      </section>

      <PropertyDetailFacilitiesSection
        property={property}
        currentLanguage={currentLanguage}
        colors={colors}
        title={t(
          "숙소시설 및 정책",
          "Tiện ích và chính sách",
          "Facilities & Policy",
          "施設とポリシー",
          "设施与政策",
        )}
      />

      {(property.checkInTime || property.checkOutTime) && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("체크인/체크아웃 시간", "Giờ check-in/out", "Check-in/out time", "チェックイン・アウト", "入住/退房时间")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {t("체크인", "Check-in", "Check-in", "チェックイン", "入住")}
              </p>
              <p className="text-base" style={{ color: colors.text }}>
                {property.checkInTime || "14:00"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {t("체크아웃", "Check-out", "Check-out", "チェックアウト", "退房")}
              </p>
              <p className="text-base" style={{ color: colors.text }}>
                {property.checkOutTime || "12:00"}
              </p>
            </div>
          </div>
        </section>
      )}

      {property.original_description && (
        <section className="py-3 text-left" style={SECTION_DASHED}>
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("매물 설명", "Mô tả BĐS", "Description", "物件説明", "房源描述")}
          </p>
          <div style={{ color: colors.text }}>
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
          <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
            {t("외부 캘린더", "Lịch ngoài", "External Calendar", "外部カレンダー", "外部日历")}
          </p>
          <div className="space-y-2">
            {property.icalPlatform && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  {t("플랫폼", "Nền tảng", "Platform", "プラットフォーム", "平台")}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.icalPlatform}
                </p>
              </div>
            )}
            {property.icalCalendarName && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  {t("캘린더", "Lịch", "Calendar", "カレンダー", "日历")}
                </p>
                <p className="text-sm" style={{ color: colors.text }}>
                  {property.icalCalendarName}
                </p>
              </div>
            )}
            {property.icalUrl && (
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                  iCal URL
                </p>
                <p className="text-sm break-all" style={{ color: colors.text }}>
                  {property.icalUrl}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
