/**
 * 채팅방 페이지
 *
 * 로직: `useChatRoomPage` · UI: `ChatRoomPageView` — 라우트는 Suspense + 조합만 담당한다.
 */

'use client';

import { Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';
import { useChatRoomPage } from './hooks/useChatRoomPage';
import { ChatRoomPageView } from './components/ChatRoomPageView';

function ChatRoomPageInner() {
  const vm = useChatRoomPage();
  return <ChatRoomPageView vm={vm} />;
}

export default function ChatRoomPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
        </div>
      }
    >
      <ChatRoomPageInner />
    </Suspense>
  );
}
