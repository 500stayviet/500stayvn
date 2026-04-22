// Firebase Client SDK 초기화
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseConfig } from './config';

const PHONE_AUTH_DEBUG = process.env.NEXT_PUBLIC_PHONE_AUTH_DEBUG === 'true';

declare global {
  interface Window {
    __phoneAuthRecaptchaVerifier?: RecaptchaVerifier;
  }
}

const phoneAuthDebugLog = (message: string, payload?: unknown) => {
  if (!PHONE_AUTH_DEBUG) return;
  if (payload !== undefined) {
    console.log(message, payload);
    return;
  }
  console.log(message);
};

const phoneAuthDebugWarn = (message: string, payload?: unknown) => {
  if (!PHONE_AUTH_DEBUG) return;
  if (payload !== undefined) {
    console.warn(message, payload);
    return;
  }
  console.warn(message);
};

const phoneAuthDebugAlert = (message: string) => {
  if (!PHONE_AUTH_DEBUG || typeof window === 'undefined') return;
  window.alert(message);
};

// Firebase 앱 초기화 (싱글톤 패턴)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth 인스턴스
export const auth = getAuth(app);

// RecaptchaVerifier 생성 함수
export const createRecaptchaVerifier = (containerId: string) => {
  if (typeof window !== 'undefined' && window.__phoneAuthRecaptchaVerifier) {
    phoneAuthDebugWarn('[phone-auth] recaptcha verifier already exists', { containerId });
    return window.__phoneAuthRecaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
      phoneAuthDebugLog('[phone-auth] recaptcha callback fired');
    },
  });

  phoneAuthDebugLog('[phone-auth] recaptcha initialized', { containerId, size: 'invisible' });

  verifier
    .render()
    .then((widgetId) => {
      phoneAuthDebugLog('[phone-auth] recaptcha render completed', { containerId, widgetId });
    })
    .catch((error) => {
      phoneAuthDebugWarn('[phone-auth] recaptcha render failed', {
        containerId,
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
      });
    });

  if (typeof window !== 'undefined') {
    window.__phoneAuthRecaptchaVerifier = verifier;
  }

  return verifier;
};

// 전화번호 인증 함수
export const sendPhoneVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
) => {
  try {
    phoneAuthDebugAlert('문자 발송 시도: before signInWithPhoneNumber');
    phoneAuthDebugLog('[phone-auth] before signInWithPhoneNumber', { phoneNumber });
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    phoneAuthDebugAlert('문자 발송 시도: after signInWithPhoneNumber');
    phoneAuthDebugLog('[phone-auth] after signInWithPhoneNumber', { phoneNumber });
    return confirmationResult;
  } catch (error) {
    console.error('Error sending verification code:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      error,
    });
    throw error;
  } finally {
    phoneAuthDebugLog('[phone-auth] 인증 프로세스 종료', { phase: 'sendPhoneVerificationCode' });
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
    console.error('Error verifying code:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      error,
    });
    throw error;
  } finally {
    phoneAuthDebugLog('[phone-auth] 인증 프로세스 종료', { phase: 'verifyPhoneCode' });
  }
};

export default app;