import { Calendar } from "lucide-react";

type PropertyType = "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached";

interface EditPropertyCoreSectionProps {
  currentLanguage: string;
  colors: {
    border: string;
    error: string;
    text: string;
    textSecondary: string;
    white: string;
    primary: string;
  };
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxAdults: number;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  weeklyRent: string;
  needsRentalCalendarAck: boolean;
  rentalCalendarAcknowledged: boolean;
  openCheckInCalendar: () => void;
  openCheckOutCalendar: () => void;
  setPropertyType: (value: PropertyType) => void;
  setBedrooms: (value: number) => void;
  setBathrooms: (value: number) => void;
  setMaxAdults: (value: number) => void;
  setMaxChildren: (value: number) => void;
  setWeeklyRent: (value: string) => void;
}

const getDateText = (value: Date | null, currentLanguage: string) => {
  if (!value) {
    return currentLanguage === "ko"
      ? "날짜 선택"
      : currentLanguage === "zh"
        ? "选择日期"
        : currentLanguage === "vi"
          ? "Chọn ngày"
          : currentLanguage === "ja"
            ? "日付を選択"
            : "Select date";
  }

  try {
    return value.toLocaleDateString(
      currentLanguage === "ko"
        ? "ko-KR"
        : currentLanguage === "zh"
          ? "zh-CN"
          : currentLanguage === "vi"
            ? "vi-VN"
            : currentLanguage === "ja"
              ? "ja-JP"
              : "en-US",
      { month: "short", day: "numeric" },
    );
  } catch {
    return "Select date";
  }
};

export default function EditPropertyCoreSection({
  currentLanguage,
  colors,
  propertyType,
  bedrooms,
  bathrooms,
  maxAdults,
  checkInDate,
  checkOutDate,
  weeklyRent,
  needsRentalCalendarAck,
  rentalCalendarAcknowledged,
  openCheckInCalendar,
  openCheckOutCalendar,
  setPropertyType,
  setBedrooms,
  setBathrooms,
  setMaxAdults,
  setMaxChildren,
  setWeeklyRent,
}: EditPropertyCoreSectionProps) {
  return (
    <>
      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: `${colors.border}20`,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <h2 className="text-sm font-bold mb-4" style={{ color: colors.text }}>
          {currentLanguage === "ko"
            ? "매물 종류"
            : currentLanguage === "vi"
              ? "Loại bất động sản"
              : "Property Type"}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "studio" as const, ko: "스튜디오", vi: "Studio", en: "Studio", ja: "スタジオ", zh: "工作室" },
              {
                value: "one_room" as const,
                ko: "원룸(방·거실 분리)",
                vi: "Phòng đơn (phòng ngủ & phòng khách riêng)",
                en: "One Room (bedroom & living room separate)",
                ja: "ワンルーム（寝室・リビング別）",
                zh: "一室（卧室与客厅分开）",
              },
              { value: "two_room" as const, ko: "2룸", vi: "2 phòng", en: "2 Rooms", ja: "2ルーム", zh: "2室" },
              { value: "three_plus" as const, ko: "3+룸", vi: "3+ phòng", en: "3+ Rooms", ja: "3+ルーム", zh: "3+室" },
              { value: "detached" as const, ko: "독채", vi: "Nhà riêng", en: "Detached House", ja: "一戸建て", zh: "独栋房屋" },
            ] as const
          ).map(({ value, ko, vi, en, ja, zh }) => {
            const label =
              currentLanguage === "ko"
                ? ko
                : currentLanguage === "vi"
                  ? vi
                  : currentLanguage === "ja"
                    ? ja
                    : currentLanguage === "zh"
                      ? zh
                      : en;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPropertyType(value)}
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: propertyType === value ? colors.primary : colors.white,
                  color: propertyType === value ? colors.white : colors.text,
                  border: `1px solid ${propertyType === value ? colors.primary : colors.border}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {propertyType && (
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}40` }}>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {currentLanguage === "ko" ? "방 개수" : currentLanguage === "vi" ? "Số phòng" : "Bedrooms"}
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                disabled={propertyType === "studio" || propertyType === "one_room" || propertyType === "two_room"}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                {(() => {
                  const opts =
                    propertyType === "studio" || propertyType === "one_room"
                      ? [1]
                      : propertyType === "two_room"
                        ? [2]
                        : propertyType === "three_plus"
                          ? [2, 3, 4, 5]
                          : propertyType === "detached"
                            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            : [];
                  return opts.map((n) => (
                    <option key={n} value={n}>
                      {n === 5 && propertyType === "three_plus" ? "5+" : n}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {currentLanguage === "ko" ? "화장실 수" : currentLanguage === "vi" ? "Số phòng tắm" : "Bathrooms"}
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                {(() => {
                  const opts =
                    propertyType === "studio" || propertyType === "one_room"
                      ? [1, 2]
                      : propertyType === "two_room"
                        ? [1, 2, 3]
                        : propertyType === "three_plus"
                          ? [1, 2, 3, 4, 5, 6]
                          : propertyType === "detached"
                            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            : [];
                  return opts.map((n) => (
                    <option key={n} value={n}>
                      {n === 6 && propertyType === "three_plus" ? "5+" : n}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                {currentLanguage === "ko" ? "최대 인원" : currentLanguage === "vi" ? "Số người tối đa" : "Max Guests"}
              </label>
              <select
                value={maxAdults}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxAdults(v);
                  setMaxChildren(0);
                }}
                className="w-full px-2 py-2 rounded-md text-sm min-h-[36px] focus:outline-none transition-all"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                    {currentLanguage === "ko" ? "명" : currentLanguage === "vi" ? " người" : " guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {currentLanguage === "ko"
            ? "임대 희망 날짜"
            : currentLanguage === "zh"
              ? "期望租赁日期"
              : currentLanguage === "vi"
                ? "Ngày cho thuê mong muốn"
                : currentLanguage === "ja"
                  ? "希望賃貸期間"
                  : "Desired Rental Dates"}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={openCheckInCalendar}
            className={`flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 ${
              needsRentalCalendarAck && !rentalCalendarAcknowledged ? "border-red-500" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">
                  {currentLanguage === "ko"
                    ? "시작일"
                    : currentLanguage === "zh"
                      ? "开始日期"
                      : currentLanguage === "vi"
                        ? "Ngày bắt đầu"
                        : currentLanguage === "ja"
                          ? "開始日"
                          : "Start Date"}
                </div>
                <div className="text-sm font-medium text-gray-900">{getDateText(checkInDate, currentLanguage)}</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={openCheckOutCalendar}
            className={`flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 ${
              needsRentalCalendarAck && !rentalCalendarAcknowledged ? "border-red-500" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">
                  {currentLanguage === "ko"
                    ? "종료일"
                    : currentLanguage === "zh"
                      ? "结束日期"
                      : currentLanguage === "vi"
                        ? "Ngày kết thúc"
                        : currentLanguage === "ja"
                          ? "終了日"
                          : "End Date"}
                </div>
                <div className="text-sm font-medium text-gray-900">{getDateText(checkOutDate, currentLanguage)}</div>
              </div>
            </div>
          </button>
        </div>
        {needsRentalCalendarAck && !rentalCalendarAcknowledged && (
          <p className="text-[11px] text-red-600 mt-2">
            {currentLanguage === "ko"
              ? "임대날짜를 다시 확인하세요."
              : currentLanguage === "vi"
                ? "Vui lòng kiểm tra lại ngày thuê."
                : currentLanguage === "ja"
                  ? "賃貸日程を再確認してください。"
                  : currentLanguage === "zh"
                    ? "请再次确认租赁日期。"
                    : "Please confirm rental dates again."}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentLanguage === "ko"
            ? "1주일 임대료"
            : currentLanguage === "zh"
              ? "每周租金"
              : currentLanguage === "vi"
                ? "Giá thuê 1 tuần"
                : currentLanguage === "ja"
                  ? "1週間賃料"
                  : "Weekly Rent"}
          <span className="text-red-500 text-xs ml-1">*</span>
          <span className="text-gray-500 text-xs ml-2 font-normal">
            (
            {currentLanguage === "ko"
              ? "공과금/관리비 포함"
              : currentLanguage === "zh"
                ? "包含水电费/管理费"
                : currentLanguage === "vi"
                  ? "Bao gồm phí dịch vụ/quản lý"
                  : currentLanguage === "ja"
                    ? "光熱費・管理費込み"
                    : "Utilities/Management fees included"}
            )
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={weeklyRent ? parseInt(weeklyRent.replace(/\D/g, "") || "0", 10).toLocaleString() : ""}
            onChange={(e) => setWeeklyRent(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
          <span className="text-gray-600 font-medium">VND</span>
        </div>
      </div>
    </>
  );
}
