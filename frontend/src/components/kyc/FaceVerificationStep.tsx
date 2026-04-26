/**
 * KYC Step 3: 얼굴 인증 컴포넌트 (테스트 모드)
 *
 * 5방향 얼굴 촬영: 정면, 상, 하, 좌, 우
 * 테스트 모드: 촬영 없이도 인증 완료 가능
 */

'use client';

import { useFaceVerificationStepState } from '@/components/kyc/face/useFaceVerificationStepState';
import { FaceVerificationStepView } from '@/components/kyc/face/FaceVerificationStepView';
import type { FaceVerificationStepProps } from '@/components/kyc/face/types';

export type { FaceVerificationStepProps } from '@/components/kyc/face/types';

export default function FaceVerificationStep(props: FaceVerificationStepProps) {
  return <FaceVerificationStepView {...useFaceVerificationStepState(props)} />;
}
