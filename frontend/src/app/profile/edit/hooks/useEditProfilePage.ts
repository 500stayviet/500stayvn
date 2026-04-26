"use client";

import { useEditProfilePageData } from "./useEditProfilePageData";
import { useEditProfilePageActions } from "./useEditProfilePageActions";

/**
 * 프로필 수정: Data + Actions 조합.
 */
export function useEditProfilePage() {
  const pageData = useEditProfilePageData();
  const actions = useEditProfilePageActions(pageData);
  return { ...pageData, ...actions };
}

export type EditProfilePageViewModel = ReturnType<typeof useEditProfilePage>;
