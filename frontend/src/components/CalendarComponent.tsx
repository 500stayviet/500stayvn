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
  onCheckInReset?: () => void; // 체크인 날짜 초기화 콜백
  currentLanguage: 'ko' | 'vi' | 'en';
  onClose: () => void;
  mode: 'checkin' | 'checkout';
  minDate?: Date; // 선택 가능한 최소 날짜 (매물의 임대 시작일)
  maxDate?: Date; // 선택 가능한 최대 날짜 (매물의 임대 종료일)
  isOwnerMode?: boolean; // 임대인 모드 (매물 등록/수정 시 사용)
}

export default function CalendarComponent({
  checkInDate,
  checkOutDate,
  onCheckInSelect,
  onCheckOutSelect,
  onCheckInReset,
  currentLanguage,
  onClose,
  mode,
  minDate,
  maxDate,
  isOwnerMode = false,
}: CalendarComponentProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckIn, setSelectingCheckIn] = useState(mode === 'checkin');
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [ownerWarningMessage, setOwnerWarningMessage] = useState<string>('');
  
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
      } else if (checkInDate && typeof (checkInDate as any).toDate === 'function') {
        return (checkInDate as any).toDate();
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

  // 날짜가 체크아웃 가능한 날짜인지 확인 (체크인 날짜부터 7일, 14일, 21일, 28일 기간, maxDate 이내)
  const isCheckoutDate = (date: Date): boolean => {
    const checkIn = getCheckInDateAsDate();
    if (!checkIn) return false;
    
    const diffTime = date.getTime() - checkIn.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // 7일 단위가 아니면 false
    if (![7, 14, 21, 28].includes(diffDays)) return false;
    
    // maxDate가 있으면 그 이내인지 확인
    if (maxDate) {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (dateOnly > maxDateOnly) return false;
    }
    
    return true;
  };

  // 날짜가 허용 범위 내인지 확인
  const isWithinAllowedRange = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (minDate) {
      const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (dateOnly < minDateOnly) return false;
    }
    
    if (maxDate) {
      const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (dateOnly > maxDateOnly) return false;
    }
    
    return true;
  };

  // 선택한 체크인 날짜에서 7일 후 체크아웃이 가능한지 확인 (maxDate 이내)
  const hasAtLeast7DaysAvailable = (checkInDateToCheck: Date): boolean => {
    if (!maxDate) return true; // maxDate가 없으면 제한 없음
    
    const checkInOnly = new Date(checkInDateToCheck.getFullYear(), checkInDateToCheck.getMonth(), checkInDateToCheck.getDate());
    const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    
    // 체크인 + 7일 날짜
    const minCheckoutDate = new Date(checkInOnly);
    minCheckoutDate.setDate(minCheckoutDate.getDate() + 7);
    
    // 체크인 + 7일이 maxDate를 넘으면 예약 불가
    return minCheckoutDate <= maxDateOnly;
  };

  // 경고 팝업 닫기 및 체크인 초기화
  const handleWarningClose = () => {
    setShowWarningPopup(false);
    setOwnerWarningMessage('');
    if (!isOwnerMode) {
      onCheckInReset?.();
    }
  };

  // 임대인 모드: 종료일이 시작일 + 7일 이상인지 확인
  const isValidOwnerEndDate = (endDate: Date): boolean => {
    const checkIn = getCheckInDateAsDate();
    if (!checkIn) return false;
    
    const checkInOnly = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const diffTime = endDateOnly.getTime() - checkInOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 7;
  };

  // 임대인 모드: 시작일 기준 7일 미만인 날짜인지 확인
  const isOwnerDateLessThan7Days = (date: Date): boolean => {
    const checkIn = getCheckInDateAsDate();
    if (!checkIn) return false;
    
    const checkInOnly = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = dateOnly.getTime() - checkInOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays < 7;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // 과거 날짜는 선택 불가
    if (dateOnly < todayOnly) return;
    
    // 허용 범위 밖 날짜는 선택 불가
    if (!isWithinAllowedRange(date)) return;

    // 임대인 모드
    if (isOwnerMode) {
      if (selectingCheckIn) {
        // 시작일 선택
        onCheckInSelect(date);
      } else {
        // 종료일 선택
        const checkIn = getCheckInDateAsDate();
        if (checkIn) {
          // 시작일보다 이전 또는 같은 날짜 선택 시 새로운 시작일로 설정
          if (dateOnly <= checkIn) {
            onCheckInSelect(date);
            return;
          }
          
          // 7일 미만인지 확인 → 7일 미만이면 새로운 시작일로 설정 + 팝업
          if (!isValidOwnerEndDate(date)) {
            setOwnerWarningMessage(
              currentLanguage === 'ko' 
                ? '최소 7일 이상의 임대 기간이 필요합니다. 새로운 시작일로 설정됩니다.'
                : currentLanguage === 'vi'
                ? 'Cần tối thiểu 7 ngày cho thuê. Đã đặt làm ngày bắt đầu mới.'
                : 'Minimum 7 days rental period required. Set as new start date.'
            );
            setShowWarningPopup(true);
            // 새로운 시작일로 설정
            onCheckInSelect(date);
            return;
          }
          
          onCheckOutSelect(date);
          onClose();
        } else {
          // 시작일이 없으면 시작일로 설정
          onCheckInSelect(date);
        }
      }
      return;
    }

    // 임차인 모드 (기존 로직)
    if (selectingCheckIn) {
      // 체크인 날짜 선택 시 7일 이상 예약 가능한지 확인
      if (!hasAtLeast7DaysAvailable(date)) {
        setShowWarningPopup(true);
        return;
      }
      onCheckInSelect(date);
    } else {
      // 체크아웃 모드에서
      const checkIn = getCheckInDateAsDate();
      if (checkIn && isCheckoutDate(date)) {
        // 7/14/21/28일 후인 경우 체크아웃 날짜로 선택
        onCheckOutSelect(date);
        onClose();
      } else {
        // 7일 단위가 아닌 날짜를 클릭하면 새로운 체크인 날짜로 설정 시도
        // 새로운 체크인으로 설정 전에 7일 이상 예약 가능한지 확인
        if (!hasAtLeast7DaysAvailable(date)) {
          setShowWarningPopup(true);
          return;
        }
        onCheckInSelect(date);
      }
    }
  };

  // 날짜 스타일 결정
  const getDateStyle = (date: Date): string => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateStr = date.toDateString();
    
    // 과거 날짜
    if (dateOnly < todayOnly) {
      return 'text-gray-300 cursor-not-allowed';
    }
    
    // 허용 범위 밖 날짜
    if (!isWithinAllowedRange(date)) {
      return 'text-gray-300 cursor-not-allowed';
    }
    
    // 임차인 모드에서 체크인 시 7일 미만인 날짜는 연한 빨간색으로 표시
    if (!isOwnerMode && selectingCheckIn && !hasAtLeast7DaysAvailable(date)) {
      return 'text-red-300 cursor-pointer';
    }

    // checkInDate가 Date 객체인지 확인
    let checkInDateStr = '';
    if (checkInDate) {
      if (checkInDate instanceof Date) {
        checkInDateStr = checkInDate.toDateString();
      } else if (typeof (checkInDate as any).toDate === 'function') {
        checkInDateStr = (checkInDate as any).toDate().toDateString();
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
      } else if (typeof (checkOutDate as any).toDate === 'function') {
        checkOutDateStr = (checkOutDate as any).toDate().toDateString();
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

    // 임대인 모드
    if (isOwnerMode) {
      if (selectingCheckIn) {
        // 시작일 선택 모드: 모든 미래 날짜 선택 가능
        return 'text-gray-700 hover:bg-blue-100 rounded-full cursor-pointer bg-white';
      } else {
        // 종료일 선택 모드
        const checkIn = getCheckInDateAsDate();
        if (!checkIn) {
          return 'text-gray-400 cursor-not-allowed';
        }
        
        // 시작일 이전 또는 같은 날짜는 새로운 시작일로 선택 가능
        if (dateOnly <= checkIn) {
          return 'text-gray-700 hover:bg-blue-100 rounded-full cursor-pointer bg-white';
        }
        
        // 7일 이상인 날짜는 녹색으로 표시, 7일 미만도 동일하게 표시 (클릭하면 새 시작일로 설정됨)
        if (isValidOwnerEndDate(date)) {
          return 'bg-green-100 text-green-700 rounded-full hover:bg-green-200 cursor-pointer';
        }
        
        // 7일 미만 날짜도 클릭 가능 (새로운 시작일로 설정됨)
        return 'text-gray-700 hover:bg-blue-100 rounded-full cursor-pointer bg-white';
      }
    }

    // 임차인 모드 (기존 로직)
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
    <div className="bg-white rounded-xl shadow-xl w-[420px] p-6 min-h-[520px] flex flex-col relative">
      {/* 7일 미만 경고 팝업 */}
      {showWarningPopup && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-[320px] shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {isOwnerMode 
                  ? (currentLanguage === 'ko' 
                      ? '기간 설정 불가' 
                      : currentLanguage === 'vi' 
                      ? 'Không thể đặt thời gian' 
                      : 'Cannot Set Period')
                  : (currentLanguage === 'ko' 
                      ? '예약 불가' 
                      : currentLanguage === 'vi' 
                      ? 'Không thể đặt phòng' 
                      : 'Cannot Book')}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {ownerWarningMessage || (currentLanguage === 'ko' 
                  ? '최소 7일 단위로만 예약이 가능합니다. 선택한 날짜부터 임대 종료일까지 7일 미만이므로 다른 날짜를 선택해주세요.'
                  : currentLanguage === 'vi'
                  ? 'Chỉ có thể đặt phòng tối thiểu 7 ngày. Từ ngày đã chọn đến ngày kết thúc thuê còn dưới 7 ngày, vui lòng chọn ngày khác.'
                  : 'Bookings are only available in 7-day units. The selected date has less than 7 days until the rental end date. Please select another date.')}
              </p>
              <button
                onClick={handleWarningClose}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === 'ko' ? '확인' : currentLanguage === 'vi' ? 'Xác nhận' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isOwnerMode
            ? (selectingCheckIn
                ? (currentLanguage === 'ko' ? '임대 시작일 선택' : currentLanguage === 'vi' ? 'Chọn ngày bắt đầu thuê' : 'Select Rental Start Date')
                : (currentLanguage === 'ko' ? '임대 종료일 선택' : currentLanguage === 'vi' ? 'Chọn ngày kết thúc thuê' : 'Select Rental End Date'))
            : (selectingCheckIn
                ? (currentLanguage === 'ko' ? '체크인 날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày nhận phòng' : 'Select Check-in Date')
                : (currentLanguage === 'ko' ? '체크아웃 날짜 선택' : currentLanguage === 'vi' ? 'Chọn ngày trả phòng' : 'Select Check-out Date'))}
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
        {isOwnerMode ? (
          // 임대인 모드 범례
          selectingCheckIn ? (
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '임대 시작일로 선택 가능' : currentLanguage === 'vi' ? 'Có thể chọn làm ngày bắt đầu' : 'Can select as start date'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '선택된 시작일' : currentLanguage === 'vi' ? 'Ngày bắt đầu đã chọn' : 'Selected start date'}</span>
              </div>
            </div>
          ) : checkInDate ? (
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '7일 이상 (종료일 선택 가능)' : currentLanguage === 'vi' ? '7 ngày trở lên (có thể chọn ngày kết thúc)' : '7+ days (can select as end date)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '7일 미만 (클릭 시 새 시작일로 설정)' : currentLanguage === 'vi' ? 'Dưới 7 ngày (nhấp để đặt ngày bắt đầu mới)' : 'Less than 7 days (click to set new start date)'}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-600">
              {currentLanguage === 'ko' ? '임대 시작일을 먼저 선택해주세요' : currentLanguage === 'vi' ? 'Vui lòng chọn ngày bắt đầu trước' : 'Please select start date first'}
            </div>
          )
        ) : (
          // 임차인 모드 범례
          selectingCheckIn ? (
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '선택 가능한 날짜' : currentLanguage === 'vi' ? 'Ngày có thể chọn' : 'Available dates'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '7일 미만 (예약 불가)' : currentLanguage === 'vi' ? 'Dưới 7 ngày (không thể đặt)' : 'Less than 7 days (cannot book)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>{currentLanguage === 'ko' ? '7일, 14일, 21일, 28일 단위로 예약 가능' : currentLanguage === 'vi' ? 'Có thể đặt theo đơn vị 7, 14, 21, 28 ngày' : 'Book in 7, 14, 21, 28 day units'}</span>
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
          )
        )}
      </div>
    </div>
  );
}
