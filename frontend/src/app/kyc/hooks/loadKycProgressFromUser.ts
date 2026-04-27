import type { UserData } from '@/lib/api/auth';
import { deriveKycResumeState, type KycResumeState } from '@/app/kyc/deriveKycResumeState';

/** @deprecated 이름 호환 — `KycResumeState`와 동일 */
export type KycProgress = KycResumeState;

/**
 * 서버 GET /api/app/users + LessorProfile 병합(kyc_steps) 기준으로 재개 스텝 복원.
 * 로컬 캐시는 네트워크 실패 시에만 폴백.
 */
export async function loadKycProgressFromUser(userId: string): Promise<KycProgress> {
  let userData: UserData | null = null;
  try {
    const { withAppActor } = await import('@/lib/api/withAppActor');
    const { parseAppUserPayload } = await import('@/lib/api/appUserApiParse');
    const res = await fetch(
      `/api/app/users/${encodeURIComponent(userId)}`,
      withAppActor({ cache: 'no-store' }),
    );
    if (res.ok) {
      userData = parseAppUserPayload(await res.json());
    }
  } catch {
    /* 네트워크 오류 시 로컬 폴백 */
  }
  if (!userData) {
    const { getCurrentUserData } = await import('@/lib/api/auth');
    userData = await getCurrentUserData(userId);
  }
  return deriveKycResumeState(userData ?? null);
}
