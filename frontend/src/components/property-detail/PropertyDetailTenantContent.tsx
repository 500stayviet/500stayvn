"use client";

import { ChevronDown } from "lucide-react";
import { PropertyDescription } from "@/components/PropertyDescription";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { formatFullPrice, getBookableDateSegments } from "@/lib/utils/propertyUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { PropertyDetailFacilitiesSection } from "./PropertyDetailFacilitiesSection";
import type { PropertyDetailBookingVm } from "./usePropertyDetailBooking";

const SECTION_DASHED = { borderBottom: "1.5px dashed rgba(254, 215, 170, 0.8)" };

type TFn = (ko: string, vi: string, en: string, ja?: string, zh?: string) => string;

type ColorTokens = {
  primary: string;
  secondary: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

type Props = {
  property: PropertyData;
  currentLanguage: SupportedLanguage;
  colors: ColorTokens;
  labelColor: string;
  t: TFn;
  cityDistrictLine: string;
  propertyTypeLabel: string;
  booking: PropertyDetailBookingVm;
};

/**
 * 임차인 모드: 매물 메타·이용기간(예약과 무관한 노출 기간)·시설·체크인·설명·날짜/인원/예약 CTA.
 */
export function PropertyDetailTenantContent({
  property,
  currentLanguage,
  colors,
  labelColor,
  t,
  cityDistrictLine,
  propertyTypeLabel,
  booking: b,
}: Props) {
  const {
    bookedRanges,
    checkInDate,
    checkOutDate,
    showGuestDropdown,
    setShowGuestDropdown,
    guestDropdownRef,
    addPetSelected,
    setAddPetSelected,
    selectedPetCount,
    setSelectedPetCount,
    showPetDropdown,
    setShowPetDropdown,
    petDropdownRef,
    selectedGuests,
    setSelectedGuests,
    maxGuests,
    maxPets,
    petAllowed,
    bookNow,
  } = b;

  const facilitiesTitle =
    currentLanguage === "ko"
      ? "숙소시설 및 정책"
      : currentLanguage === "vi"
        ? "Tiện ích và chính sách"
        : currentLanguage === "ja"
          ? "施設とポリシー"
          : currentLanguage === "zh"
            ? "设施与政策"
            : "Facilities & Policy";

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
          {t("주소", "Địa chỉ", "Address", "住所", "地址")}
        </p>
        <p className="text-sm break-words leading-relaxed" style={{ color: colors.text }}>
          {property.address || "—"}
        </p>
      </section>
      <section className="py-3 text-left" style={SECTION_DASHED}>
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {t("도시·구", "Thành phố·Quận", "City·District", "都市・区", "城市・区")}
        </p>
        <p className="text-sm" style={{ color: colors.text }}>
          {cityDistrictLine}
        </p>
      </section>
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
                {property.checkInDate && property.checkOutDate
                  ? (() => {
                      const segments = getBookableDateSegments(
                        property.checkInDate!,
                        property.checkOutDate!,
                        bookedRanges,
                      );
                      return segments.length > 0
                        ? segments.length === 1
                          ? formatDate(segments[0].start, currentLanguage)
                          : formatDate(segments[0].start, currentLanguage) + " ~"
                        : "—";
                    })()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                {t("종료일", "Ngày kết thúc", "End Date", "終了日", "结束日期")}
              </p>
              <p className="text-sm" style={{ color: colors.text }}>
                {property.checkInDate && property.checkOutDate
                  ? (() => {
                      const segments = getBookableDateSegments(
                        property.checkInDate!,
                        property.checkOutDate!,
                        bookedRanges,
                      );
                      return segments.length > 0
                        ? segments.length === 1
                          ? formatDate(segments[0].end, currentLanguage)
                          : formatDate(segments[segments.length - 1].end, currentLanguage)
                        : "—";
                    })()
                  : "—"}
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
        colors={{
          primary: colors.primary,
          border: colors.border,
          text: colors.text,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
        }}
        title={facilitiesTitle}
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
            {getUIText("description", currentLanguage)}
          </p>
          <div style={{ color: colors.text }}>
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
        <p className="text-base font-bold mb-1.5" style={{ color: colors.text }}>
          {getUIText("selectDatesAndGuests", currentLanguage)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              b.setCalendarMode("checkin");
              b.setShowCalendar(true);
              setShowGuestDropdown(false);
            }}
            className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
              checkInDate ? "bg-orange-50/50" : "bg-white"
            }`}
            style={{ borderColor: checkInDate ? colors.secondary : "#d1d5db" }}
          >
            <span className="text-[9px] text-gray-500 mb-0.5">{getUIText("checkIn", currentLanguage)}</span>
            <span className={`text-xs font-semibold ${checkInDate ? "text-orange-600" : "text-gray-400"}`}>
              {checkInDate
                ? checkInDate.toLocaleDateString(
                    currentLanguage === "ko" ? "ko-KR" : currentLanguage === "vi" ? "vi-VN" : "en-US",
                    { month: "short", day: "numeric" },
                  )
                : getUIText("selectDate", currentLanguage)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              b.setCalendarMode("checkout");
              b.setShowCalendar(true);
              setShowGuestDropdown(false);
            }}
            className={`flex flex-col items-center justify-center min-h-[52px] px-2 py-2 rounded-lg border-2 border-solid transition-all ${
              checkOutDate ? "bg-orange-50/50" : "bg-white"
            }`}
            style={{ borderColor: checkOutDate ? colors.secondary : "#d1d5db" }}
          >
            <span className="text-[9px] text-gray-500 mb-0.5">{getUIText("checkOut", currentLanguage)}</span>
            <span className={`text-xs font-semibold ${checkOutDate ? "text-orange-600" : "text-gray-400"}`}>
              {checkOutDate
                ? checkOutDate.toLocaleDateString(
                    currentLanguage === "ko" ? "ko-KR" : currentLanguage === "vi" ? "vi-VN" : "en-US",
                    { month: "short", day: "numeric" },
                  )
                : getUIText("selectDate", currentLanguage)}
            </span>
          </button>
          <div className="relative" ref={guestDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowGuestDropdown(!showGuestDropdown);
                b.setShowCalendar(false);
              }}
              className={`w-full min-h-[52px] flex flex-col items-center justify-center px-2 py-2 rounded-lg border-2 border-solid transition-all ${
                showGuestDropdown ? "bg-orange-50/50" : "bg-white"
              }`}
              style={{ borderColor: showGuestDropdown ? colors.secondary : "#d1d5db" }}
            >
              <span className="text-[9px] text-gray-500 mb-0.5">
                {getUIText("guestSelect", currentLanguage)}
              </span>
              <span className="text-xs font-semibold text-gray-900 flex items-center gap-0.5">
                {selectedGuests}
                <ChevronDown
                  className={`w-3 h-3 text-gray-500 transition-transform ${showGuestDropdown ? "rotate-180" : ""}`}
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
                    className={`w-full text-left px-2 py-1.5 text-xs ${
                      selectedGuests === n ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n}{" "}
                    {currentLanguage === "ko"
                      ? "명"
                      : currentLanguage === "vi"
                        ? "người"
                        : currentLanguage === "ja"
                          ? "名"
                          : currentLanguage === "zh"
                            ? "人"
                            : ""}
                    {n === maxGuests && (
                      <span className="text-gray-500 font-normal"> {getUIText("maxSuffix", currentLanguage)}</span>
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
                  "애완동물과 함께 여행하시나요?",
                  "Bạn có đi cùng thú cưng?",
                  "Traveling with pets?",
                  "ペットと一緒に旅行しますか？",
                  "与宠物一起旅行吗？",
                )}
              </span>
            </label>
            {addPetSelected && (
              <div className="relative" ref={petDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPetDropdown(!showPetDropdown)}
                  className="flex items-center gap-1 px-2 py-1 border-b border-solid text-xs font-medium"
                  style={{ borderColor: labelColor, color: labelColor }}
                >
                  {selectedPetCount}
                  {currentLanguage === "ko"
                    ? "마리"
                    : currentLanguage === "vi"
                      ? " con"
                      : currentLanguage === "ja"
                        ? "匹"
                        : currentLanguage === "zh"
                          ? "只"
                          : " pet(s)"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showPetDropdown ? "rotate-180" : ""}`}
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
                        className={`w-full text-left px-2 py-1.5 text-xs ${
                          selectedPetCount === n ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {n}{" "}
                        {currentLanguage === "ko"
                          ? "마리"
                          : currentLanguage === "vi"
                            ? "con"
                            : currentLanguage === "ja"
                              ? "匹"
                              : currentLanguage === "zh"
                                ? "只"
                                : ""}
                        {n === maxPets && (
                          <span className="text-gray-500"> {getUIText("maxSuffix", currentLanguage)}</span>
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
          <p className="mt-2 text-[10px] text-red-600 font-medium">{getUIText("guestOverMaxNotice", currentLanguage)}</p>
        )}
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={bookNow}
          disabled={!checkInDate || !checkOutDate}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
            checkInDate && checkOutDate
              ? "bg-orange-500 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {checkInDate && checkOutDate ? getUIText("bookNow", currentLanguage) : getUIText("selectDatesFirst", currentLanguage)}
        </button>
      </div>
    </>
  );
}
