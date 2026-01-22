/**
 * Firebase Configuration
 * Frontend와 Firebase 프로젝트 연결 설정
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'stayviet-26ae4.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stayviet-26ae4',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stayviet-26ae4.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Firebase Functions Base URL
 */
export const FIREBASE_FUNCTIONS_BASE_URL = 
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL || 
  'https://us-central1-stayviet-26ae4.cloudfunctions.net';

/**
 * Firebase Functions Endpoints
 */
export const FIREBASE_FUNCTIONS = {
  translate: `${FIREBASE_FUNCTIONS_BASE_URL}/translate`,
  translateBatch: `${FIREBASE_FUNCTIONS_BASE_URL}/translateBatch`,
  detectLanguage: `${FIREBASE_FUNCTIONS_BASE_URL}/detectLanguage`,
  getSupportedLanguages: `${FIREBASE_FUNCTIONS_BASE_URL}/getSupportedLanguages`,
} as const;
