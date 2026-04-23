import CalendarComponent from "@/components/CalendarComponent";
import type { SupportedLanguage } from "@/lib/api/translation";

type SearchCalendarModalProps = {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onCheckInSelect: (date: Date) => void;
  onCheckOutSelect: (date: Date) => void;
  currentLanguage: SupportedLanguage;
  onClose: () => void;
  mode: "checkin" | "checkout";
  onCheckInReset: () => void;
};

export function SearchCalendarModal({
  checkInDate,
  checkOutDate,
  onCheckInSelect,
  onCheckOutSelect,
  currentLanguage,
  onClose,
  mode,
  onCheckInReset,
}: SearchCalendarModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <CalendarComponent
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          onCheckInSelect={onCheckInSelect}
          onCheckOutSelect={onCheckOutSelect}
          currentLanguage={currentLanguage}
          onClose={onClose}
          mode={mode}
          onCheckInReset={onCheckInReset}
        />
      </div>
    </div>
  );
}
