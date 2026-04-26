/**
 * Profile Page (개인정보 페이지)
 *
 * 로직: `useProfilePage` · UI: `ProfilePageView`.
 */

"use client";

import { useProfilePage } from "./hooks/useProfilePage";
import { ProfilePageView } from "./components/ProfilePageView";

export default function ProfilePage() {
  const vm = useProfilePage();
  return <ProfilePageView vm={vm} />;
}
