import type { LessorProfile, Prisma, User as PrismaUser } from '@prisma/client';
import type { UserData } from '@/lib/api/auth';
import type { VerificationStatus } from '@/types/kyc.types';

/** 클라이언트와 동일한 테스트용 해시 — 이후 bcrypt 등으로 교체 권장 */
export function appSimpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
}

type ProfileJson = {
  private_data?: UserData['private_data'];
  kyc_steps?: UserData['kyc_steps'];
};

/**
 * User.profileJson.kyc_steps 와 동기화되지 않았을 때 LessorProfile 플래그로 KYC 재개 상태를 보강한다.
 */
export function mergeKycStepsFromLessorProfile(
  user: UserData,
  lessor: Pick<
    LessorProfile,
    | 'kycStep1Completed'
    | 'kycStep2Completed'
    | 'kycStep3Completed'
    | 'phoneNumber'
    | 'phoneVerified'
  > | null,
): UserData {
  if (!lessor) return user;
  const kyc = { ...(user.kyc_steps || {}) };
  if (lessor.kycStep1Completed) kyc.step1 = true;
  if (lessor.kycStep2Completed) kyc.step2 = true;
  if (lessor.kycStep3Completed) kyc.step3 = true;
  const phoneFromLessor =
    lessor.phoneNumber && lessor.phoneVerified ? lessor.phoneNumber : undefined;
  return {
    ...user,
    kyc_steps: kyc,
    ...(user.phoneNumber || !phoneFromLessor
      ? {}
      : { phoneNumber: phoneFromLessor }),
  };
}

export function prismaUserToUserData(u: PrismaUser): UserData {
  const pj = (u.profileJson || null) as ProfileJson | null;
  const roleFromDb = u.role;
  const role: UserData['role'] =
    roleFromDb === 'admin'
      ? 'admin'
      : u.isOwner || roleFromDb === 'owner'
        ? 'owner'
        : 'user';

  return {
    uid: u.id,
    email: u.email ?? '',
    displayName: u.displayName ?? u.name ?? undefined,
    phoneNumber: u.phoneNumber ?? undefined,
    photoURL: u.image ?? undefined,
    gender: (u.gender as UserData['gender']) ?? undefined,
    preferredLanguage: (u.preferredLanguage as UserData['preferredLanguage']) ?? undefined,
    role,
    is_owner: u.isOwner,
    verification_status: (u.verificationStatus as VerificationStatus) || 'none',
    private_data: pj?.private_data,
    kyc_steps: pj?.kyc_steps,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    deleted: u.deleted,
    deletedAt: u.deletedAt?.toISOString(),
    blocked: u.blocked,
    blockedAt: u.blockedAt?.toISOString(),
    blockedReason: u.blockedReason ?? undefined,
  };
}

/** import / PATCH 용: UserData 일부 → Prisma 업데이트 객체 */
export function userDataPatchToPrisma(
  patch: Partial<UserData>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.email !== undefined) out.email = patch.email || null;
  if (patch.displayName !== undefined) {
    out.displayName = patch.displayName || null;
    out.name = patch.displayName || null;
  }
  if (patch.phoneNumber !== undefined) out.phoneNumber = patch.phoneNumber || null;
  if (patch.photoURL !== undefined) out.image = patch.photoURL || null;
  if (patch.gender !== undefined) out.gender = patch.gender || null;
  if (patch.preferredLanguage !== undefined) {
    out.preferredLanguage = patch.preferredLanguage || null;
  }
  if (patch.is_owner !== undefined) out.isOwner = !!patch.is_owner;
  if (patch.role !== undefined) {
    if (patch.role === 'admin') out.role = 'admin';
    else if (patch.role === 'owner') {
      out.role = 'user';
      out.isOwner = true;
    } else out.role = 'user';
  }
  if (patch.verification_status !== undefined) {
    out.verificationStatus = patch.verification_status || 'none';
  }
  if (patch.blocked !== undefined) out.blocked = patch.blocked;
  if ("blockedAt" in patch && patch.blockedAt !== undefined) {
    out.blockedAt = patch.blockedAt ? new Date(patch.blockedAt) : null;
  } else if (patch.blocked === false) {
    out.blockedAt = null;
    out.blockedReason = null;
  }
  if (patch.blockedReason !== undefined) out.blockedReason = patch.blockedReason ?? null;
  if (patch.deleted !== undefined) out.deleted = patch.deleted;
  if (patch.deletedAt !== undefined) {
    out.deletedAt = patch.deletedAt ? new Date(patch.deletedAt) : null;
  }
  return out;
}

export function mergeProfileJson(
  existing: PrismaUser['profileJson'],
  patch: Partial<UserData>
): Prisma.InputJsonValue {
  const base = (existing || {}) as ProfileJson;
  const next: ProfileJson = { ...base };
  if (patch.private_data !== undefined) next.private_data = patch.private_data;
  if (patch.kyc_steps !== undefined) next.kyc_steps = patch.kyc_steps;
  return next as Prisma.InputJsonValue;
}

/** 로컬 스토리지에서 옮기기: password 필드는 이미 appSimpleHash 결과로 가정 */
export function localStorageUserToPrismaUncheckedCreate(
  u: UserData
): Prisma.UserUncheckedCreateInput {
  const pj: ProfileJson = {};
  if (u.private_data) pj.private_data = u.private_data;
  if (u.kyc_steps) pj.kyc_steps = u.kyc_steps;
  return {
    id: u.uid,
    email: u.email ? u.email : null,
    passwordHash: u.password ?? null,
    displayName: u.displayName ?? null,
    name: u.displayName ?? null,
    phoneNumber: u.phoneNumber ?? null,
    image: u.photoURL ?? null,
    gender: u.gender ?? null,
    preferredLanguage: u.preferredLanguage ?? null,
    role: u.role === 'admin' ? 'admin' : 'user',
    isOwner: !!u.is_owner,
    blocked: !!u.blocked,
    blockedAt: u.blockedAt ? new Date(u.blockedAt) : null,
    blockedReason: u.blockedReason ?? null,
    deleted: !!u.deleted,
    deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
    verificationStatus: u.verification_status || 'none',
    profileJson: Object.keys(pj).length ? (pj as Prisma.InputJsonValue) : undefined,
  };
}
