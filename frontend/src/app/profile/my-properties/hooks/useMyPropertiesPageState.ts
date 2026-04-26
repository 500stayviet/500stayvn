import { useMyPropertiesPageData } from "./useMyPropertiesPageData";
import { useMyPropertiesPageActions } from "./useMyPropertiesPageActions";

export type { HostInventoryTab, LiveExistsConfirmState } from "./useMyPropertiesPageState.types";
export { parseHostTab } from "./useMyPropertiesPageState.types";

interface UseMyPropertiesPageStateParams {
  user: { uid: string } | null;
  authLoading: boolean;
  router: { push: (path: string) => void; replace: (path: string) => void };
  searchParams: import("next/navigation").ReadonlyURLSearchParams;
}

/** 내 매물 목록: Data + Actions 조합 (`MyPropertiesPageView` 계약 유지). */
export function useMyPropertiesPageState(params: UseMyPropertiesPageStateParams) {
  const pageData = useMyPropertiesPageData(params);
  const actions = useMyPropertiesPageActions(pageData);
  return { ...pageData, ...actions };
}
