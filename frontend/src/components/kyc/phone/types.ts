import type { PhoneVerificationData } from '@/types/kyc.types';
import type { SupportedLanguage } from '@/lib/api/translation';

export interface PhoneVerificationStepProps {
  currentLanguage: SupportedLanguage;
  onComplete: (data: PhoneVerificationData) => void;
  initialPhoneNumber?: string;
}
