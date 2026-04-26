/**
 * TopBar 컴포넌트 (인기 앱 스타일)
 *
 * Airbnb/직방 스타일의 깔끔한 헤더
 * - 좌측: 500stayviet 로고 (홈 버튼)
 * - 우측: 언어 선택 + 로그인 상태에 따라 로그인 아이콘 또는 개인정보 버튼
 */

'use client';

import { useTopBarState } from './topbar/useTopBarState';
import { TopBarView } from './topbar/TopBarView';
import type { TopBarProps } from './topbar/types';

export type { TopBarProps } from './topbar/types';

export default function TopBar(props: TopBarProps) {
  return <TopBarView {...useTopBarState(props)} />;
}
