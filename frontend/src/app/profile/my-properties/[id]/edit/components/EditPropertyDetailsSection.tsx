import { ChevronDown, ChevronUp } from "lucide-react";

interface EditPropertyDetailsSectionProps {
  currentLanguage: string;
  checkInTime: string;
  checkOutTime: string;
  propertyName: string;
  propertyDescription: string;
  showIcalDropdown: boolean;
  icalPlatform: string;
  icalCalendarName: string;
  icalUrl: string;
  setCheckInTime: (value: string) => void;
  setCheckOutTime: (value: string) => void;
  setPropertyName: (value: string) => void;
  setPropertyDescription: (value: string) => void;
  setShowIcalDropdown: (value: boolean) => void;
  setIcalPlatform: (value: string) => void;
  setIcalCalendarName: (value: string) => void;
  setIcalUrl: (value: string) => void;
}

export default function EditPropertyDetailsSection({
  currentLanguage,
  checkInTime,
  checkOutTime,
  propertyName,
  propertyDescription,
  showIcalDropdown,
  icalPlatform,
  icalCalendarName,
  icalUrl,
  setCheckInTime,
  setCheckOutTime,
  setPropertyName,
  setPropertyDescription,
  setShowIcalDropdown,
  setIcalPlatform,
  setIcalCalendarName,
  setIcalUrl,
}: EditPropertyDetailsSectionProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentLanguage === "ko" ? "체크인/체크아웃 시간" : currentLanguage === "vi" ? "Giờ check-in/check-out" : "Check-in/Check-out Time"}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {currentLanguage === "ko" ? "체크인" : "Check-in"}
            </label>
            <select
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return [`${hour}:00`, `${hour}:30`];
              })
                .flat()
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {currentLanguage === "ko" ? "체크아웃" : "Check-out"}
            </label>
            <select
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return [`${hour}:00`, `${hour}:30`];
              })
                .flat()
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentLanguage === "ko" ? "매물명" : currentLanguage === "vi" ? "Tên bất động sản" : "Property Name"}
          <span className="text-red-500 text-xs ml-1">*</span>
        </label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder={currentLanguage === "ko" ? "예: 내 첫 번째 스튜디오" : currentLanguage === "vi" ? "VD: Studio đầu tiên của tôi" : "e.g., My first studio"}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentLanguage === "ko" ? "매물 설명" : currentLanguage === "vi" ? "Mô tả bất động sản" : "Property Description"}
          <span className="text-red-500 text-xs ml-1">*</span>
        </label>
        <textarea
          value={propertyDescription}
          onChange={(e) => setPropertyDescription(e.target.value)}
          placeholder={
            currentLanguage === "ko"
              ? "매물에 대한 상세 설명을 입력해주세요."
              : currentLanguage === "vi"
                ? "Nhập mô tả chi tiết về bất động sản."
                : "Enter detailed description of the property."
          }
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIcalDropdown(!showIcalDropdown)}
          className="w-full py-3.5 px-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="text-sm font-medium text-gray-700">
            {currentLanguage === "ko" ? "외부 캘린더 가져오기" : currentLanguage === "vi" ? "Đồng bộ lịch ngoài" : "Import External Calendar"}
          </span>
          {showIcalDropdown ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>
        {showIcalDropdown && (
          <div className="p-4 pt-2 border-t border-gray-200 bg-white space-y-3">
            <p className="text-xs text-gray-500">
              {currentLanguage === "ko"
                ? "에어비앤비·아고다 등 예약을 500stay와 동기화합니다. iCal URL(.ics)을 입력하세요."
                : currentLanguage === "vi"
                  ? "Đồng bộ đặt phòng từ Airbnb, Agoda,... với 500stay. Nhập URL iCal (.ics)."
                  : "Sync bookings from Airbnb, Agoda, etc. with 500stay. Enter iCal URL (.ics)."}
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{currentLanguage === "ko" ? "플랫폼" : "Platform"}</label>
              <select
                value={icalPlatform}
                onChange={(e) => setIcalPlatform(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{currentLanguage === "ko" ? "선택 안 함" : "None"}</option>
                <option value="airbnb">Airbnb</option>
                <option value="agoda">Agoda</option>
                <option value="booking_com">Booking.com</option>
                <option value="other">{currentLanguage === "ko" ? "기타" : "Other"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{currentLanguage === "ko" ? "캘린더 이름" : "Calendar name"}</label>
              <input
                type="text"
                value={icalCalendarName}
                onChange={(e) => setIcalCalendarName(e.target.value)}
                placeholder={currentLanguage === "ko" ? "예: 에어비앤비 예약" : "e.g. Airbnb Bookings"}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">iCal URL (.ics)</label>
              <input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
