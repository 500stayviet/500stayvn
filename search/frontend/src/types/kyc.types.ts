/**
 * KYC (Know Your Customer) 인증 관련 타입 정의
 */

/**
 * 인증 상태
 */
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

/**
 * 신분증 유형
 */
export type IdType = "passport" | "id_card";

/**
 * KYC 단계
 */
export type KYCStep = 1 | 2 | 3;

/**
 * 전화번호 인증 데이터
 */
export interface PhoneVerificationData {
  phoneNumber: string;
  verificationCode?: string;
  verificationId?: string;
}

/**
 * 신분증 정보
 */
export interface IdDocumentData {
  type: IdType;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  issueDate?: string;
  expiryDate?: string;
  imageUrl?: string; // (참고용)
  frontImageUrl?: string; // S3 업로드 URL
  backImageUrl?: string; // S3 업로드 URL
}

/**
 * 얼굴 인증 데이터
 */
export interface FaceVerificationData {
  imageUrl?: string;
  faceImages?: {
    direction: string;
    imageUrl: string;
  }[];
}

/**
 * KYC 전체 데이터
 */
export interface KYCData {
  phoneVerification: PhoneVerificationData;
  idDocument: IdDocumentData;
  faceVerification: FaceVerificationData;
}

/**
 * 유저 정보 및 관리자 페이지 연동을 위한 민감 정보 (private_data 필드)
 * 모든 필드에 ?를 추가하여 데이터가 아직 없는 상태에서도 admin.ts에서 에러가 나지 않도록 합니다.
 */
export interface PrivateData {
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  idType?: IdType | string;
  issueDate?: string;
  expiryDate?: string;

  // AWS S3 이미지 주소 저장을 위한 필드
  idDocumentFrontImage?: string;
  idDocumentBackImage?: string;
  faceImageUrl?: string;
  faceImages?: {
    direction: string;
    imageUrl: string;
  }[];
}
