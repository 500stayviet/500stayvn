/**
 * 관리자용 API
 * 
 * KYC 데이터 CSV 다운로드 등 관리자 기능
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * KYC 데이터 인터페이스
 */
export interface KYCUserData {
  uid: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  faceImageUrl?: string;
  faceImages?: Array<{ direction: string; imageUrl: string }>;
  createdAt?: any;
  verificationStatus?: string;
}

/**
 * 모든 KYC 사용자 데이터 가져오기
 */
export async function getAllKYCUsers(): Promise<KYCUserData[]> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const kycUsers: KYCUserData[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      
      // verification_info 서브컬렉션에서 데이터 가져오기
      const verificationInfoRef = collection(db, 'users', userDoc.id, 'verification_info');
      const verificationInfoSnap = await getDocs(verificationInfoRef);

      let idDocumentData: any = {};
      let faceVerificationData: any = {};

      verificationInfoSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (doc.id === 'id_document') {
          idDocumentData = data;
        } else if (doc.id === 'face_verification') {
          faceVerificationData = data;
        }
      });

      // private_data에서도 정보 가져오기 (호환성)
      const privateData = userData.private_data || {};

      kycUsers.push({
        uid: userDoc.id,
        email: userData.email || '',
        fullName: idDocumentData.fullName || privateData.fullName || userData.displayName || '',
        phoneNumber: userData.phoneNumber || privateData.phoneNumber || '',
        idType: idDocumentData.type || privateData.idType || '',
        idNumber: idDocumentData.idNumber || privateData.idNumber || '',
        dateOfBirth: idDocumentData.dateOfBirth || privateData.dateOfBirth || '',
        idDocumentFrontUrl: idDocumentData.frontImageUrl || '',
        idDocumentBackUrl: idDocumentData.backImageUrl || '',
        faceImageUrl: faceVerificationData.primaryImageUrl || privateData.faceImageUrl || '',
        faceImages: faceVerificationData.images || [],
        createdAt: userData.createdAt,
        verificationStatus: userData.verification_status || 'none',
      });
    }

    return kycUsers;
  } catch (error) {
    console.error('Error fetching KYC users:', error);
    throw error;
  }
}

/**
 * KYC 데이터를 CSV 형식으로 변환 (UTF-8 BOM 포함)
 */
export function convertKYCToCSV(users: KYCUserData[]): string {
  // CSV 헤더
  const headers = [
    '성함',
    '연락처',
    '신분증종류',
    '번호',
    '생년월일',
    '신분증사진URL(앞면)',
    '신분증사진URL(뒷면)',
    '얼굴사진URL',
    '신청일시',
    '인증상태',
  ];

  // CSV 행 생성
  const rows = users.map((user) => {
    const createdAt = user.createdAt
      ? new Date(user.createdAt.seconds * 1000).toLocaleString('ko-KR')
      : '';

    return [
      user.fullName || '',
      user.phoneNumber || '',
      user.idType === 'passport' ? '여권' : user.idType === 'id_card' ? '신분증' : '',
      user.idNumber || '',
      user.dateOfBirth || '',
      user.idDocumentFrontUrl || '',
      user.idDocumentBackUrl || '',
      user.faceImageUrl || '',
      createdAt,
      user.verificationStatus === 'pending' ? '심사중' :
      user.verificationStatus === 'verified' ? '인증완료' :
      user.verificationStatus === 'rejected' ? '거부' : '미인증',
    ];
  });

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸기
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ),
  ].join('\n');

  // UTF-8 BOM 추가 (한글/베트남어 깨짐 방지)
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string = 'kyc_data.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // URL 해제
  URL.revokeObjectURL(url);
}

/**
 * 모든 KYC 데이터를 CSV로 다운로드
 */
export async function downloadAllKYCData(): Promise<void> {
  try {
    const users = await getAllKYCUsers();
    const csvContent = convertKYCToCSV(users);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `kyc_data_${timestamp}.csv`);
  } catch (error) {
    console.error('Error downloading KYC data:', error);
    throw error;
  }
}
