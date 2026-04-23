import CalendarComponent from "@/components/CalendarComponent";
import type { SupportedLanguage } from "@/lib/api/translation";

interface EditPropertyCalendarModalProps {
  isOpen: boolean;
  autoExtend: boolean;
  calendarMode: "checkin" | "checkout";
  checkInDate: Date | null;
  checkOutDate: Date | null;
  extensionMaxDate: Date;
  bookedRanges: { checkIn: Date; checkOut: Date }[];
  currentLanguage: SupportedLanguage;
  onClose: () => void;
  onCheckInSelect: (date: Date) => void;
  onCheckOutSelect: (date: Date) => void;
  onCheckInReset: () => void;
}

export default function EditPropertyCalendarModal({
  isOpen,
  autoExtend,
  calendarMode,
  checkInDate,
  checkOutDate,
  extensionMaxDate,
  bookedRanges,
  currentLanguage,
  onClose,
  onCheckInSelect,
  onCheckOutSelect,
  onCheckInReset,
}: EditPropertyCalendarModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <CalendarComponent
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          minDate={autoExtend && checkInDate ? checkInDate : undefined}
          maxDate={extensionMaxDate}
          lockCheckInForOwnerMode={autoExtend}
          onCheckInSelect={onCheckInSelect}
          onCheckOutSelect={onCheckOutSelect}
          onCheckInReset={onCheckInReset}
          mode={calendarMode}
          bookedRanges={bookedRanges}
          isOwnerMode={true}
          currentLanguage={currentLanguage}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
