/**
 * KYC Step 1: 전화번호 인증
 *
 * Firebase **Authentication** 클라이언트 SDK만 사용 (`signInWithPhoneNumber`).
 * Firestore / Storage 등 Firebase DB는 사용하지 않음.
 */

'use client';

import { usePhoneVerificationStepState } from '@/components/kyc/phone/usePhoneVerificationStepState';
import { PhoneVerificationStepView } from '@/components/kyc/phone/PhoneVerificationStepView';
import type { PhoneVerificationStepProps } from '@/components/kyc/phone/types';

export type { PhoneVerificationStepProps } from '@/components/kyc/phone/types';

export default function PhoneVerificationStep(props: PhoneVerificationStepProps) {
  return <PhoneVerificationStepView {...usePhoneVerificationStepState(props)} />;
}
