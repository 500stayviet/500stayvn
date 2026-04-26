import type { SupportedLanguage } from '@/lib/api/translation';

export interface AddressVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    address: string;
    lat: number;
    lng: number;
    apartmentName?: string;
    blockNumber?: string;
  }) => void;
  currentLanguage?: SupportedLanguage;
  initialAddress?: string;
}
