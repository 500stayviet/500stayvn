// Firebase Client SDK 초기화
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseConfig } from './config';

// Firebase 앱 초기화 (싱글톤 패턴)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth 인스턴스
export const auth = getAuth(app);

// RecaptchaVerifier 생성 함수
export const createRecaptchaVerifier = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
  });
};

// 전화번호 인증 함수
export const sendPhoneVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

// 인증 코드 확인 함수
export const verifyPhoneCode = async (
  confirmationResult: any,
  verificationCode: string
) => {
  try {
    const result = await confirmationResult.confirm(verificationCode);
    return result;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

export default app;