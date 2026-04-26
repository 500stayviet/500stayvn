import type { FaceVerificationData } from '@/types/kyc.types';
import type { SupportedLanguage } from '@/lib/api/translation';

export interface FaceVerificationStepProps {
  currentLanguage: SupportedLanguage;
  onComplete: (data: FaceVerificationData, images: { direction: string; file: File }[]) => void;
}
