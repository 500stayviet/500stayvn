/**
 * 인증/사용자 DTO (클라이언트) — 구현은 `auth`. 외부는 `@/lib/api/auth`로 import 유지
 */

import type { VerificationStatus, PrivateData } from "@/types/kyc.types";
import type { SupportedLanguage } from "@/lib/api/translation";

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  gender?: "male" | "female";
  preferredLanguage?: SupportedLanguage;
  role?: "user" | "admin" | "owner";
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
  /** 폴백(로컬) 경로에서만 존재 — 서버 응답에는 포함되지 않음 */
  password?: string;
  deleted?: boolean;
  deletedAt?: string;
  blocked?: boolean;
  blockedAt?: string;
  blockedReason?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: "male" | "female";
  preferredLanguage?: SupportedLanguage;
}

export interface OwnerVerificationData {
  fullName: string;
  phoneNumber: string;
}
