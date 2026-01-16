/**
 * Calendar Component (달력 컴포넌트)
 * 
 * 체크인/체크아웃 날짜 선택을 위한 달력 컴포넌트
 * - 체크인: 오늘 이후의 모든 날짜 선택 가능
 * - 체크아웃: 체크인 날짜 기준 7일, 14일, 21일, 28일 후만 선택 가능
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarComponentProps {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onCheckInSelect: (date: Date) => void;
  onCheckOutSelect: (date: Date) => void;
  currentLanguage: 'ko' | 'vi' | 'en';
  onClose: () => void;
  mode: 'checkin' | 'checkout';
}

export default function CalendarComponent({
  checkInDate,
  checkOutDate,
  onCheckInSelect,
  onCheckOutSelect,
  currentLanguage,
  onClose,
  mode,
}: CalendarComponentProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckIn, setSelectingCheckIn] = useState(mode === 'checkin');
  
  // mode가 변경되면 selectingCheckIn 업데이트
  useEffect(() => {
    setSelectingCheckIn(mode === 'checkin');
  }, [mode]);

  // 체크인 날짜가 변경되면 해당 월로 이동
  useEffect(() => {
    const checkIn = getCheckInDateAsDate();
    if (checkIn) {
      setCurrentMonth(new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));
    }
  }, [checkInDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // checkInDate를 Date 객체로 변환
  const getCheckInDateAsDate = (): Date | null => {
    if (!checkInDate) return null;
    try {
      if (checkInDate instanceof Date) {
        return checkInDate;
      } else if (checkInDate && typeof checkInDate.toDate === 'function') {
        return checkInDate.toDate();
      } else if ((checkInDate as any).seconds) {
        return new Date((checkInDate as any).seconds * 1000);
      } else if (typeof checkInDate === 'string') {
        const d = new Date(checkInDate);
        return isNaN(d.getTime()) ? null : d;
      }
    } catch {
      return null;
    }
    return null;
  };

  // 현재 달의 첫 날과 마지막 날
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // 날짜가 체크인 날짜부터 28일 이내인지 확인
  const isInAvailableRange = (date: Date): boolean => {
    const checkIn = getCheckInDateAsDate();
    if (!checkIn) return false;
    const diffTime = date.getTime() - checkIn.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 28;
  };

  // 날짜가 체크아웃 가능한 날짜인지 확인 (체크인 날짜부터 7일, 14일, 21일, 28일 기간)
  const isCheckoutDate = (date: Date): boolean => {
    const checkIn = getCheckInDateAsDate();
    if (!checkIn) return false;
    const diffTime = date.getTime() - checkIn.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return [7, 14, 21, 28].includes(diffDays);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // 과거 날짜는 선택 불가
    if (dateOnly < todayOnly) return;

    if (selectingCheckIn) {
      // 체크인 날짜 선택
      onCheckInSelect(date);
    } else {
      // 체크아웃 모드에서
      const checkIn = getCheckInDateAsDate();
      if (checkIn && isCheckoutDate(date)) {
        // 7/14/21/28일 후인 경우 체크아웃 날짜로 선택
        onCheckOutSelect(date);
        onClose();
      } else {
        // 7일 단위가 아닌 날짜를 클릭하면 새로운 체크인 날짜로 설정
        onCheckInSelect(date);
      }
    }
  };

  // 날짜 스타일 결정
  const getDateStyle = (date: Date): string => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateStr = date.toDateString();
    
    if (dateOnly < todayOnly) {
      return 'text-gray-300 cursor-not-allowed';
    }

    // checkInDate가 Date 객체인지 확인
    let checkInDateStr = '';
    if (checkInDate) {
      if (checkInDate instanceof Date) {
        checkInDateStr = checkInDate.toDateString();
      } else if (checkInDate.toDate) {
        checkInDateStr = checkInDate.toDate().toDateString();
      } else if ((checkInDate as any).seconds) {
        checkInDateStr = new Date((checkInDate as any).seconds * 1000).toDateString();
      } else if (typeof checkInDate === 'string') {
        checkInDateStr = new Date(checkInDate).toDateString();
      }
    }
    
    // checkOutDate가 Date 객체인지 확인
    let checkOutDateStr = '';
    if (checkOutDate) {
      if (checkOutDate instanceof Date) {
        checkOutDateStr = checkOutDate.toDateString();
      } else if (checkOutDate.toDate) {
        checkOutDateStr = checkOutDate.toDate().toDateString();
      } else if ((checkOutDate as any).seconds) {
        checkOutDateStr = new Date((checkOutDate as any).seconds * 1000).toDateString();
      } else if (typeof checkOutDate === 'string') {
        checkOutDateStr = new Date(checkOutDate).toDateString();
      }
    }

    if (checkInDateStr && dateStr === checkInDateStr) {
      return 'bg-blue-600 text-white rounded-full font-semibold cursor-pointer';
    }

    if (checkOutDateStr && dateStr === checkOutDateStr) {
      return 'bg-blue-600 text-white rounded-full font-semibold cursor-pointer';
    }

    if (selectingCheckIn) {
      return 'text-gray-700 hover:bg-blue-100 rounded-full cursor-pointer bg-white';
    } else {
      const checkIn = getCheckInDateAsDate();
      if (!checkIn) {
        return 'text-gray-400 cursor-not-allowed';
      }

      if (isInAvailableRange(date)) {
        if (isCheckoutDate(date)) {
          // 7/14/21/28일 후 날짜 (체크아웃 가능)
          return 'bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 cursor-pointer';
        }
        // 7일 단위가 아닌 날짜 (새로운 체크인으로 설정 가능)
        return 'bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 cursor-pointer';
      }

      // 체크인 날짜 이후 28일 범위 밖의 날짜 (새로운 체크인으로 설정 가능)
      if (dateOnly > checkIn) {
        return 'text-gray-700 hover:bg-blue-100 rounded-full cursor-pointer bg-white';
      }

      return 'text-gray-400 cursor-not-allowed';
    }
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = currentLanguage === 'ko' 
    ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    : currentLanguage === 'vi'
    ? ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayNames = currentLanguage === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : currentLanguage === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 달력 날짜 생성
  const calendarDays = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    calendarDays.push(date);
  }

  return (
    <div className="bg-white rounded-xl shadow-xl w-[420px] p-6 min-h-[520px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {selectingCheckIn
            ? (currentLanguage === 'ko' ? '체크인 날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày nhận phòng' : 'Select Check-in Date')
            : (currentLanguage === 'ko' ? '체크아웃 날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày trả phòng' : 'Select Check-out Date')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goToPreviousMonth}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="text-xl font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={goToNextMonth}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-3">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isPast = dateOnly < todayOnly;
          const checkIn = getCheckInDateAsDate();
          // 체크아웃 모드에서: 과거 날짜만 비활성화 (7일 단위가 아닌 날짜도 클릭 가능하여 새로운 체크인으로 설정 가능)
          // 체크인 모드에서: 과거 날짜만 비활성화
          const isDisabled = isPast;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isDisabled) {
                  handleDateClick(date);
                }
              }}
              disabled={isDisabled}
              className={`aspect-square flex items-center justify-center text-base font-medium transition-all duration-200 ${getDateStyle(date)}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-auto pt-4 border-t border-gray-200 min-h-[80px]">
        {selectingCheckIn ? (
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex-shrink-0"></div>
              <span>{currentLanguage === 'ko' ? '오늘 이후의 모든 날짜를 선택할 수 있습니다' : currentLanguage === 'vi' ? 'Có thể chọn bất kỳ ngày nào sau hôm nay' : 'You can select any date after today'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-full flex-shrink-0"></div>
              <span>{currentLanguage === 'ko' ? '체크인 날짜 선택 후 7일, 14일, 21일, 28일 단위로 예약이 가능합니다' : currentLanguage === 'vi' ? 'Sau khi chọn ngày nhận phòng, có thể đặt phòng theo đơn vị 7, 14, 21, 28 ngày' : 'After selecting check-in date, you can book in 7, 14, 21, 28 day units'}</span>
            </div>
          </div>
        ) : checkInDate ? (
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-full flex-shrink-0"></div>
              <span>{currentLanguage === 'ko' ? '체크인 날짜부터 4주 범위' : currentLanguage === 'vi' ? 'Phạm vi 4 tuần từ ngày nhận phòng' : '4 weeks range from check-in'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <span>{currentLanguage === 'ko' ? '체크아웃 가능 날짜 (7일, 14일, 21일, 28일 기간)' : currentLanguage === 'vi' ? 'Ngày trả phòng có thể (7, 14, 21, 28 ngày)' : 'Available check-out dates (7, 14, 21, 28 days period)'}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600">
            {currentLanguage === 'ko' ? '체크인 날짜를 먼저 선택해주세요' : currentLanguage === 'vi' ? 'Vui lòng chọn ngày nhận phòng trước' : 'Please select check-in date first'}
          </div>
        )}
      </div>
    </div>
  );
}
