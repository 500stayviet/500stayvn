/**
 * 인증·사용자 API — PostgreSQL 원장 우선, DB 불가 시 LocalStorage 폴백
 *
 * KYC 1단계 전화 인증에만 Firebase **Authentication** 클라이언트 SDK를 사용합니다.
 *
 * 모듈 경계: `authState` · `authUserSyncQuery` · `authAccountMutations` 를 이 파일에서
 * 다시 export 하며, 외부 import 경로·이름은 기존과 동일합니다.
 */

export type { UserData, SignUpData, OwnerVerificationData } from "./authTypes";

export { APP_ACTOR_UID_COOKIE, syncAppActorUidCookieFromStorage } from "./authState";

export {
  getUsers,
  setUsersCacheAndStorage,
  mergeAuthenticatedUserIntoCache,
  notifyUsersStorageChanged,
  saveUsers,
  getCurrentUserId,
  setAppSessionUserId,
  getCurrentUserData,
} from "./authState";

export {
  refreshUsersFromServer,
  ensureUsersLoadedForApp,
  refreshUsersCacheForAdmin,
  ensureUsersCacheForAdmin,
  bootstrapUsersFromServer,
} from "./authUserSyncQuery";

export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithFacebook,
  signOut,
  updateUserData,
  updateUserEmail,
  updateUserPhoneNumber,
  updateUserLanguage,
  verifyOwner,
  deleteAccount,
} from "./authAccountMutations";
