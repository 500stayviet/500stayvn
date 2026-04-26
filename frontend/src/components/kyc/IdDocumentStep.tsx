/**
 * KYC Step 2: 신분증 촬영 컴포넌트 (실시간 카메라)
 *
 * getUserMedia를 사용한 실시간 카메라 촬영
 * - 베트남 신분증: 앞면 -> 뒷면
 * - 여권: 정보면 1회
 */

'use client';

import { useIdDocumentStepState } from '@/components/kyc/idDocument/useIdDocumentStepState';
import { IdDocumentStepView } from '@/components/kyc/idDocument/IdDocumentStepView';
import type { IdDocumentStepProps } from '@/components/kyc/idDocument/types';

export type { IdDocumentStepProps } from '@/components/kyc/idDocument/types';

export default function IdDocumentStep(props: IdDocumentStepProps) {
  return <IdDocumentStepView {...useIdDocumentStepState(props)} />;
}
