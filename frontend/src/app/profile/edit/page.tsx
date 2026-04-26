/**
 * 개인정보 수정 페이지
 *
 * 데이터·핸들러는 `useEditProfilePage`, 마크업은 `EditProfilePageView` — 라우트는 조합만 담당한다.
 */

'use client';

import { useEditProfilePage } from './hooks/useEditProfilePage';
import { EditProfilePageView } from './components/EditProfilePageView';

export default function EditProfilePage() {
  const vm = useEditProfilePage();
  return <EditProfilePageView vm={vm} />;
}
