// Firebase Client SDK 초기화
import { FirebaseError, initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';
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

function firebaseErrorFields(error: unknown): {
  code?: string;
  message?: string;
  stack?: string;
} {
  if (error instanceof FirebaseError) {
    return { code: error.code, message: error.message, stack: error.stack };
  }
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return {};
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

const getFirebaseAuthOrThrow = (): Auth => {
  // Prevent Next.js prerender from initializing Firebase Auth on the server.
  if (typeof window === 'undefined') {
    throw new Error('Firebase phone auth is only available in browser runtime.');
  }

  if (!firebaseConfig.apiKey) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY for Firebase phone auth.');
  }

  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return authInstance;
};

// RecaptchaVerifier 생성 함수
export const createRecaptchaVerifier = (containerId: string) => {
  if (typeof window !== 'undefined' && window.__phoneAuthRecaptchaVerifier) {
    phoneAuthDebugWarn('[phone-auth] recaptcha verifier already exists', { containerId });
    return window.__phoneAuthRecaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(getFirebaseAuthOrThrow(), containerId, {
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
    .catch((error: unknown) => {
      phoneAuthDebugWarn('[phone-auth] recaptcha render failed', {
        containerId,
        ...firebaseErrorFields(error),
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
    phoneAuthDebugAlert("SMS send attempt: before signInWithPhoneNumber");
    phoneAuthDebugLog('[phone-auth] before signInWithPhoneNumber', { phoneNumber });
    const confirmationResult = await signInWithPhoneNumber(
      getFirebaseAuthOrThrow(),
      phoneNumber,
      recaptchaVerifier
    );
    phoneAuthDebugAlert("SMS send attempt: after signInWithPhoneNumber");
    phoneAuthDebugLog('[phone-auth] after signInWithPhoneNumber', { phoneNumber });
    return confirmationResult;
  } catch (error: unknown) {
    console.error('Error sending verification code:', {
      ...firebaseErrorFields(error),
      error,
    });
    throw error;
  } finally {
    phoneAuthDebugLog("[phone-auth] auth flow end", { phase: "sendPhoneVerificationCode" });
  }
};

// 인증 코드 확인 함수
export const verifyPhoneCode = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string
) => {
  try {
    const result = await confirmationResult.confirm(verificationCode);
    return result;
  } catch (error: unknown) {
    console.error('Error verifying code:', {
      ...firebaseErrorFields(error),
      error,
    });
    throw error;
  } finally {
    phoneAuthDebugLog("[phone-auth] auth flow end", { phase: "verifyPhoneCode" });
  }
};