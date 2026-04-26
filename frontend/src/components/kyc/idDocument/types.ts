import type { IdDocumentData } from '@/types/kyc.types';
import type { SupportedLanguage } from '@/lib/api/translation';

export interface IdDocumentStepProps {
  currentLanguage: SupportedLanguage;
  onComplete: (data: IdDocumentData, frontImageFile: File, backImageFile?: File) => void;
  /** 테스트용: 다음 단계로만 이동 */
  onNext?: () => void;
}
