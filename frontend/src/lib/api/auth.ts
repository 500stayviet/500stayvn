/**
 * LocalStorage Authentication API (임시 버전)
 * 
 * Firebase가 정지된 상태에서 UI/로직 테스트를 위한 임시 구현
 * 브라우저 LocalStorage에 사용자 데이터를 저장하고 관리
 */

import { VerificationStatus, PrivateData } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';

/**
 * 사용자 정보 인터페이스
 */
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  preferredLanguage?: 'ko' | 'vi' | 'en';
  role?: 'user' | 'admin';
  is_owner?: boolean;
  verification_status?: VerificationStatus;
  private_data?: PrivateData;
  kyc_steps?: {
    step1?: boolean;
    step2?: boolean;
    step3?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  password?: string; // LocalStorage용 (실제로는 해시되어야 하지만 테스트용)
  deleted?: boolean; // 탈퇴 여부
  deletedAt?: string; // 탈퇴 일시
}

/**
 * 회원가입 데이터 인터페이스
 */
export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  preferredLanguage?: 'ko' | 'vi' | 'en';
}

/**
 * 임대인 인증 데이터 인터페이스
 */
export interface OwnerVerificationData {
  fullName: string;
  phoneNumber: string;
}

/**
 * LocalStorage 키
 */
const USERS_STORAGE_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

/**
 * 간단한 비밀번호 해시 (테스트용)
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * 사용자 목록 가져오기
 */
export function getUsers(): UserData[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 사용자 목록 저장하기
 */
export function saveUsers(users: UserData[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * 현재 로그인한 사용자 ID 가져오기
 */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * 현재 로그인한 사용자 정보 가져오기 (동기 버전)
 */
export function getCurrentUserData(): UserData | null;
/**
 * 특정 사용자 정보 가져오기 (비동기 버전)
 */
export async function getCurrentUserData(uid: string): Promise<UserData | null>;
export function getCurrentUserData(uid?: string): UserData | null | Promise<UserData | null> {
  if (uid) {
    // 비동기 버전 (uid 제공)
    const users = getUsers();
    return Promise.resolve(users.find(u => u.uid === uid) || null);
  } else {
    // 동기 버전 (현재 로그인한 사용자)
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    const users = getUsers();
    return users.find(u => u.uid === userId) || null;
  }
}

/**
 * 현재 사용자 설정
 */
function setCurrentUser(uid: string | null): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  if (uid) {
    localStorage.setItem(CURRENT_USER_KEY, uid);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(data: SignUpData): Promise<any> {
  try {
    const users = getUsers();
    
    // 이메일 중복 확인 (삭제되지 않은 사용자만 체크)
    const existingUser = users.find(u => u.email === data.email && !u.deleted);
    if (existingUser) {
      // ⚠️ Turbopack 에러 오버레이 방지를 위해 Error 대신 객체 반환
      return { error: { code: 'auth/email-already-in-use', message: 'Email already in use' } };
    }
    
    // 삭제된 사용자가 있으면 복구 가능 (30일 이내)
    const deletedUser = users.find(u => u.email === data.email && u.deleted);
    if (deletedUser && deletedUser.deletedAt) {
      const deletedDate = new Date(deletedUser.deletedAt);
      const daysSinceDeletion = (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // 30일 이내면 복구 가능
      if (daysSinceDeletion <= 30) {
        // 기존 사용자 데이터 복구
        const userIndex = users.findIndex(u => u.uid === deletedUser.uid);
        if (userIndex !== -1) {
          users[userIndex] = {
            ...deletedUser,
            password: simpleHash(data.password), // 새 비밀번호로 업데이트
            deleted: false,
            deletedAt: undefined,
            updatedAt: new Date().toISOString(),
          };
          saveUsers(users);
          setCurrentUser(deletedUser.uid);
          
          return {
            user: {
              uid: deletedUser.uid,
              email: deletedUser.email,
              displayName: deletedUser.displayName || null,
              updateProfile: async (profile: { displayName?: string }) => {
                const users = getUsers();
                const userIndex = users.findIndex(u => u.uid === deletedUser.uid);
                if (userIndex !== -1) {
                  users[userIndex].displayName = profile.displayName;
                  users[userIndex].updatedAt = new Date().toISOString();
                  saveUsers(users);
                }
              },
            },
          };
        }
      }
    }

    // 새 사용자 생성
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const userData: UserData = {
      uid,
      email: data.email,
      password: simpleHash(data.password), // 해시된 비밀번호 저장
      ...(data.fullName && { displayName: data.fullName }),
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.gender && { gender: data.gender }),
      ...(data.preferredLanguage && { preferredLanguage: data.preferredLanguage }),
      role: 'user',
      is_owner: false,
      verification_status: 'none',
      createdAt: now,
      updatedAt: now,
    };

    users.push(userData);
    saveUsers(users);
    
    // 자동 로그인
    setCurrentUser(uid);

    // Firebase UserCredential과 호환되는 형태로 반환
    return {
      user: {
        uid,
        email: data.email,
        displayName: data.fullName || null,
        updateProfile: async (profile: { displayName?: string }) => {
          const users = getUsers();
          const userIndex = users.findIndex(u => u.uid === uid);
          if (userIndex !== -1) {
            users[userIndex].displayName = profile.displayName;
            users[userIndex].updatedAt = new Date().toISOString();
            saveUsers(users);
          }
        },
      },
    };
  } catch (error: any) {
    // 예기치 못한 시스템 에러만 로깅
    console.error('Sign up unexpected system error:', error);
    return { error: { code: 'auth/internal-error', message: error.message } };
  }
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signInWithEmail(email: string, password: string): Promise<any> {
  try {
    const users = getUsers();
    const hashedPassword = simpleHash(password);
    
    // 이메일로 사용자 찾기 (비밀번호 확인 전)
    const userByEmail = users.find(u => u.email === email && !u.deleted);
    
    if (!userByEmail) {
      // 삭제된 사용자인지 확인
      const deletedUser = users.find(u => u.email === email && u.deleted);
      if (deletedUser) {
        return { error: { code: 'auth/account-deleted', message: 'Account deleted' } };
      }
      // 이메일이 존재하지 않음
      return { error: { code: 'auth/user-not-found', message: 'User not found' } };
    }
    
    // 비밀번호 확인
    if (userByEmail.password !== hashedPassword) {
      return { error: { code: 'auth/wrong-password', message: 'Wrong password' } };
    }
    
    // 로그인 성공
    const user = userByEmail;
    setCurrentUser(user.uid);

    // Firebase UserCredential과 호환되는 형태로 반환
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
      },
    };
  } catch (error: any) {
    // 예기치 못한 시스템 에러만 로깅
    console.error('Sign in unexpected system error:', error);
    return { error: { code: 'auth/internal-error', message: error.message } };
  }
}

/**
 * Google로 로그인 (임시로 비활성화)
 */
export async function signInWithGoogle(): Promise<any> {
  throw new Error('Google 로그인은 현재 사용할 수 없습니다. 이메일/비밀번호로 로그인해주세요.');
}

/**
 * Facebook으로 로그인 (임시로 비활성화)
 */
export async function signInWithFacebook(): Promise<any> {
  throw new Error('Facebook 로그인은 현재 사용할 수 없습니다. 이메일/비밀번호로 로그인해주세요.');
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
  setCurrentUser(null);
}

/**
 * Firestore에 사용자 정보 저장 (LocalStorage 버전)
 */
async function saveUserToFirestore(user: any): Promise<void> {
  const users = getUsers();
  const existingUser = users.find(u => u.uid === user.uid);
  
  if (!existingUser) {
    const now = new Date().toISOString();
    const userData: UserData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      role: 'user',
      is_owner: false,
      verification_status: 'none',
      createdAt: now,
      updatedAt: now,
    };
    users.push(userData);
    saveUsers(users);
  }
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUserData(uid: string, updates: Partial<UserData>): Promise<void> {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.uid === uid);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveUsers(users);
}

/**
 * 사용자 이메일 업데이트
 */
export async function updateUserEmail(uid: string, newEmail: string): Promise<void> {
  await updateUserData(uid, { email: newEmail });
}

/**
 * 사용자 전화번호 업데이트
 */
export async function updateUserPhoneNumber(uid: string, newPhoneNumber: string): Promise<void> {
  await updateUserData(uid, { phoneNumber: newPhoneNumber });
}

/**
 * 사용자 언어 설정 업데이트
 */
export async function updateUserLanguage(uid: string, language: SupportedLanguage): Promise<void> {
  await updateUserData(uid, { preferredLanguage: language });
}

/**
 * 임대인 인증 (이름, 전화번호 인증)
 */
export async function verifyOwner(uid: string, data: OwnerVerificationData): Promise<void> {
  await updateUserData(uid, {
    displayName: data.fullName,
    phoneNumber: data.phoneNumber,
    is_owner: true,
  });
}

/**
 * 회원 탈퇴
 * - 사용자 데이터는 삭제하지 않고 deleted 플래그만 설정
 * - 30일 후 재가입 가능
 */
export async function deleteAccount(uid: string): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // 삭제 플래그 설정 (실제 데이터는 보관)
    users[userIndex] = {
      ...users[userIndex],
      deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
    
    // 로그아웃
    setCurrentUser(null);
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}
