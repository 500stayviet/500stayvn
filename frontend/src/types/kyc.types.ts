/**
 * KYC (Know Your Customer) 인증 관련 타입 정의
 */

/**
 * 인증 상태
 */
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

/**
 * 신분증 유형
 */
export type IdType = 'passport' | 'id_card';

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
  verificationId?: string; // Firebase Phone Auth verification ID
}

/**
 * 신분증 정보
 */
export interface IdDocumentData {
  type: IdType; // 'passport' | 'id_card'
  idNumber: string; // 신분증 번호
  fullName: string; // 이름
  dateOfBirth: string; // 생년월일 (YYYY-MM-DD)
  issueDate?: string; // 발급일
  expiryDate?: string; // 만료일
  imageUrl?: string; // 촬영된 신분증 이미지 URL
}

/**
 * 얼굴 인증 데이터
 */
export interface FaceVerificationData {
  imageUrl?: string; // 촬영된 얼굴 이미지 URL
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
 * Firestore에 저장될 민감 정보 (private_data 필드)
 */
export interface PrivateData {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  idType: IdType;
  issueDate?: string;
  expiryDate?: string;
  idDocumentFrontImage?: string;
  idDocumentBackImage?: string;
  faceImageUrl?: string;
  faceImages?: {
    direction: string;
    imageUrl: string;
  }[];
}
