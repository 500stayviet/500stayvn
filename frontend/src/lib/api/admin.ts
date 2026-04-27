/**
 * 관리자용 API — PostgreSQL 원장 기반 KYC 조회·CSV
 */

import type { SupportedLanguage } from '@/lib/api/translation';
import type { UserData } from './auth';
import { getDateLocaleForLanguage, getUIText } from '@/utils/i18n';

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

async function loadUsersForKyc(): Promise<UserData[]> {
  if (typeof window === 'undefined') return [];
  const users: UserData[] = [];
  let offset = 0;
  const limit = 200;
  for (let i = 0; i < 200; i += 1) {
    const res = await fetch(`/api/admin/users?limit=${limit}&offset=${offset}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error(`users_api_${res.status}`);
    const data = (await res.json()) as {
      users?: UserData[];
      page?: { hasMore?: boolean; nextOffset?: number };
    };
    const chunk = Array.isArray(data.users) ? data.users : [];
    users.push(...chunk);
    if (!data.page?.hasMore || chunk.length === 0) break;
    offset = Number(data.page?.nextOffset ?? offset + chunk.length);
  }
  return users;
}

/**
 * 모든 KYC 사용자 데이터 가져오기 (PostgreSQL 원장 기반)
 */
export async function getAllKYCUsers(): Promise<KYCUserData[]> {
  try {
    const users = await loadUsersForKyc();
    
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
    return [];
  }
}

/**
 * KYC 데이터를 CSV 형식으로 변환 (UTF-8 BOM 포함)
 */
export function convertKYCToCSV(users: KYCUserData[], language: SupportedLanguage): string {
  const L = language;
  const headers = [
    getUIText('csvKycColFullName', L),
    getUIText('csvKycColPhone', L),
    getUIText('csvKycColIdType', L),
    getUIText('csvKycColIdNumber', L),
    getUIText('csvKycColDateOfBirth', L),
    getUIText('csvKycColIdFrontUrl', L),
    getUIText('csvKycColIdBackUrl', L),
    getUIText('csvKycColFaceUrl', L),
    getUIText('csvKycColSubmittedAt', L),
    getUIText('csvKycColVerificationStatus', L),
  ];

  const rows = users.map((user) => {
    const locale = getDateLocaleForLanguage(L);
    const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleString(locale) : '';

    const idTypeLabel =
      user.idType === 'passport'
        ? getUIText('adminKycIdTypePassportLabel', L)
        : user.idType === 'id_card'
          ? getUIText('adminKycIdTypeIdCardLabel', L)
          : '';

    const statusLabel =
      user.verificationStatus === 'pending'
        ? getUIText('adminKycStatusPending', L)
        : user.verificationStatus === 'verified'
          ? getUIText('adminKycStatusVerified', L)
          : user.verificationStatus === 'rejected'
            ? getUIText('adminKycStatusRejected', L)
            : getUIText('adminKycStatusUnverified', L);

    return [
      user.fullName || '',
      user.phoneNumber || '',
      idTypeLabel,
      user.idNumber || '',
      user.dateOfBirth || '',
      user.idDocumentFrontUrl || '',
      user.idDocumentBackUrl || '',
      user.faceImageUrl || '',
      dateStr,
      statusLabel,
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
export async function downloadAllKYCData(language: SupportedLanguage): Promise<void> {
  const users = await getAllKYCUsers();
  const csvContent = convertKYCToCSV(users, language);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `kyc_data_${timestamp}.csv`);
}
