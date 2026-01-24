/**
 * KYC (Know Your Customer) 인증 API (AWS S3 & LocalStorage 버전)
 * * 임대인 인증을 위한 데이터 저장 로직
 * 이미지 파일은 프론트엔드에서 S3에 업로드 후 URL만 받아 저장합니다.
 */

import {
  VerificationStatus,
  PhoneVerificationData,
  IdDocumentData,
  FaceVerificationData,
  PrivateData,
} from "@/types/kyc.types";
import { getUsers, saveUsers } from "./auth";

/**
 * [Step 1] 전화번호 인증 완료 후 데이터 저장
 */
export async function savePhoneVerification(
  uid: string,
  data: PhoneVerificationData,
): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.uid === uid);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    users[userIndex] = {
      ...users[userIndex],
      phoneNumber: data.phoneNumber,
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step1: true,
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
  } catch (error) {
    console.error("Error saving phone verification:", error);
    throw error;
  }
}

/**
 * [Step 2] 신분증 정보 및 S3 URL 저장
 */
export async function saveIdDocument(
  uid: string,
  idData: IdDocumentData,
  frontImageUrl: string, // S3 업로드 완료된 URL
  backImageUrl?: string, // S3 업로드 완료된 URL (선택사항)
): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.uid === uid);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // 민감 정보를 private_data 필드에 S3 URL 주소로 저장
    const privateData: PrivateData = {
      fullName: idData.fullName,
      idNumber: idData.idNumber,
      dateOfBirth: idData.dateOfBirth,
      phoneNumber: users[userIndex].phoneNumber || "",
      idType: idData.type,
      ...(idData.issueDate && { issueDate: idData.issueDate }),
      ...(idData.expiryDate && { expiryDate: idData.expiryDate }),
      idDocumentFrontImage: frontImageUrl, // S3 URL 저장
      ...(backImageUrl && { idDocumentBackImage: backImageUrl }), // S3 URL 저장
    };

    users[userIndex] = {
      ...users[userIndex],
      private_data: privateData,
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step2: true,
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
  } catch (error) {
    console.error("Error saving ID document URL:", error);
    throw error;
  }
}

/**
 * [Step 3] 얼굴 인증 S3 URL 저장
 */
export async function saveFaceVerification(
  uid: string,
  faceImages: { direction: string; imageUrl: string }[], // S3 업로드 완료된 리스트
): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.uid === uid);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    users[userIndex] = {
      ...users[userIndex],
      private_data: {
        ...(users[userIndex].private_data as PrivateData),
        faceImageUrl: faceImages[0]?.imageUrl || "", // 첫 번째 사진(정면)을 메인으로
        faceImages: faceImages, // 모든 방향의 S3 URL 저장
      },
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step3: true,
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
  } catch (error) {
    console.error("Error saving face verification URL:", error);
    throw error;
  }
}

/**
 * KYC 인증 프로세스 최종 완료 처리
 */
export async function completeKYCVerification(uid: string): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.uid === uid);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const kycSteps = users[userIndex].kyc_steps || {};
    const allStepsCompleted =
      kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

    if (allStepsCompleted) {
      users[userIndex] = {
        ...users[userIndex],
        verification_status: "verified" as VerificationStatus,
        is_owner: true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      users[userIndex] = {
        ...users[userIndex],
        verification_status: "pending" as VerificationStatus,
        updatedAt: new Date().toISOString(),
      };
    }

    saveUsers(users);
  } catch (error) {
    console.error("Error completing KYC verification:", error);
    throw error;
  }
}

/**
 * 사용자의 인증 상태 가져오기
 */
export async function getVerificationStatus(
  uid: string,
): Promise<VerificationStatus> {
  try {
    const users = getUsers();
    const user = users.find((u) => u.uid === uid);
    return (user?.verification_status as VerificationStatus) || "none";
  } catch (error) {
    console.error("Error getting verification status:", error);
    return "none";
  }
}
