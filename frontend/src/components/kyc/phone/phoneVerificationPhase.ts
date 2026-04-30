/**
 * 전화 인증 UI의 **유도 phase** (OTP + Firebase).
 * 단일 `useState` 대신 기존 플래그들의 조합으로만 정의해, 리렌더/동기화를 바꾸지 않는다.
 */
export type PhoneVerificationPhase =
  | 'loading_profile'
  | 'verified_readonly'
  | 'enter_phone'
  | 'await_otp';

export type PhoneVerificationPhaseInput = {
  checkingUser: boolean;
  isPhoneVerified: boolean;
  userPhoneNumber: string;
  otpSent: boolean;
};

export function derivePhoneVerificationPhase(i: PhoneVerificationPhaseInput): PhoneVerificationPhase {
  if (i.checkingUser) return 'loading_profile';
  if (i.isPhoneVerified && i.userPhoneNumber) return 'verified_readonly';
  if (i.otpSent) return 'await_otp';
  return 'enter_phone';
}
