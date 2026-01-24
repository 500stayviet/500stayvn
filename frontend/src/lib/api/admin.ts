/**
 * 관리자용 API (Firebase 제거 및 로컬 데이터 연동 버전)
 * * 모든 KYC 데이터를 조회하고 CSV로 변환하는 기능을 제공합니다.
 */

import { getUsers } from './auth'; // 로컬 저장소 유저 데이터를 가져옵니다.

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
  createdAt?: string; // ISO String
  verificationStatus?: string;
}

/**
 * 모든 KYC 사용자 데이터 가져오기 (LocalStorage 기반)
 */
export async function getAllKYCUsers(): Promise<KYCUserData[]> {
  try {
    // 1. 로컬 저장소에서 모든 유저 목록을 가져옵니다.
    const users = getUsers();
    
    // 2. 관리자 페이지 형식에 맞게 데이터를 매핑합니다.
    const kycUsers: KYCUserData[] = users.map(user => {
      const privateData = user.private_data || {};
      
      return {
        uid: user.uid,
        email: user.email || '',
        fullName: privateData.fullName || user.displayName || '',
        phoneNumber: user.phoneNumber || privateData.phoneNumber || '',
        idType: privateData.idType || '',
        idNumber: privateData.idNumber || '',
        dateOfBirth: privateData.dateOfBirth || '',
        idDocumentFrontUrl: privateData.idDocumentFrontImage || '',
        idDocumentBackUrl: privateData.idDocumentBackImage || '',
        faceImageUrl: privateData.faceImageUrl || '',
        faceImages: privateData.faceImages || [],
        createdAt: user.updatedAt || user.createdAt || new Date().toISOString(),
        verificationStatus: user.verification_status || 'none',
      };
    });

    return kycUsers;
  } catch (error) {
    console.error('Error fetching KYC users:', error);
    return []; // 에러 시 빈 배열 반환하여 빌드 중단 방지
  }
}

/**
 * KYC 데이터를 CSV 형식으로 변환 (UTF-8 BOM 포함)
 */
export function convertKYCToCSV(users: KYCUserData[]): string {
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

  const rows = users.map((user) => {
    // 날짜 포맷팅
    const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleString('ko-KR') : '';

    return [
      user.fullName || '',
      user.phoneNumber || '',
      user.idType === 'passport' ? '여권' : user.idType === 'id_card' ? '신분증' : '',
      user.idNumber || '',
      user.dateOfBirth || '',
      user.idDocumentFrontUrl || '',
      user.idDocumentBackUrl || '',
      user.faceImageUrl || '',
      dateStr,
      user.verificationStatus === 'pending' ? '심사중' :
      user.verificationStatus === 'verified' ? '인증완료' :
      user.verificationStatus === 'rejected' ? '거부' : '미인증',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  return BOM + csvContent;
}

/**
 * CSV 파일 다운로드 실행
 */
export function downloadCSV(csvContent: string, filename: string = 'kyc_data.csv'): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 모든 KYC 데이터를 CSV로 추출 및 다운로드
 */
export async function downloadAllKYCData(): Promise<void> {
  try {
    const users = await getAllKYCUsers();
    const csvContent = convertKYCToCSV(users);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `kyc_data_${timestamp}.csv`);
  } catch (error) {
    console.error('Error downloading KYC data:', error);
    alert('CSV 다운로드 중 오류가 발생했습니다.');
  }
}