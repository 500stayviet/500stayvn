import { describe, expect, it } from 'vitest';
import { derivePhoneVerificationPhase } from './phoneVerificationPhase';

describe('derivePhoneVerificationPhase', () => {
  it('returns loading_profile when still checking user', () => {
    expect(
      derivePhoneVerificationPhase({
        checkingUser: true,
        isPhoneVerified: true,
        userPhoneNumber: '+82010',
        otpSent: false,
      }),
    ).toBe('loading_profile');
  });

  it('returns verified_readonly when phone already verified', () => {
    expect(
      derivePhoneVerificationPhase({
        checkingUser: false,
        isPhoneVerified: true,
        userPhoneNumber: '+821012345678',
        otpSent: false,
      }),
    ).toBe('verified_readonly');
  });

  it('returns await_otp after OTP sent', () => {
    expect(
      derivePhoneVerificationPhase({
        checkingUser: false,
        isPhoneVerified: false,
        userPhoneNumber: '',
        otpSent: true,
      }),
    ).toBe('await_otp');
  });

  it('returns enter_phone by default', () => {
    expect(
      derivePhoneVerificationPhase({
        checkingUser: false,
        isPhoneVerified: false,
        userPhoneNumber: '',
        otpSent: false,
      }),
    ).toBe('enter_phone');
  });
});
