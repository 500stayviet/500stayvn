"use client";

import React from 'react';
import { TranslationProvider } from '@/contexts/TranslationProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface TranslationProvidersProps {
  children: React.ReactNode;
}

/**
 * 번역 관련 모든 Provider를 통합하는 컴포넌트
 * 
 * 이 컴포넌트는 다음과 같은 기능을 제공합니다:
 * 1. 언어 설정 관리 (LanguageProvider)
 * 2. 번역 엔진 관리 (TranslationProvider)
 * 3. 환경 감지 (웹/iOS/Android)
 * 4. 하이브리드 번역 엔진 선택
 */
export const TranslationProviders: React.FC<TranslationProvidersProps> = ({
  children,
}) => {
  return (
    <LanguageProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </LanguageProvider>
  );
};

/**
 * TranslationProvider를 사용하는 방법:
 * 
 * 1. 앱의 최상위 레이아웃에 TranslationProviders 추가:
 * 
 * ```tsx
 * // app/layout.tsx
 * import { TranslationProviders } from '@/components/providers/TranslationProviders';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TranslationProviders>
 *           {children}
 *         </TranslationProviders>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * 2. 컴포넌트에서 번역 기능 사용:
 * 
 * ```tsx
 * // PropertyDescription 컴포넌트 사용
 * import { PropertyDescription } from '@/components/PropertyDescription';
 * 
 * function PropertyPage() {
 *   return (
 *     <PropertyDescription
 *       description="베트남어 원문..."
 *       sourceLanguage="vi"
 *     />
 *   );
 * }
 * ```
 * 
 * 3. 채팅 메시지에서 번역 기능 사용:
 * 
 * ```tsx
 * // ChatMessage 컴포넌트 사용
 * import { ChatMessage } from '@/components/ChatMessage';
 * 
 * function ChatPage() {
 *   return (
 *     <ChatMessage
 *       message="베트남어 메시지..."
 *       sender={{ id: '1', name: '사용자', isCurrentUser: false }}
 *       timestamp="오후 2:30"
 *       sourceLanguage="vi"
 *     />
 *   );
 * }
 * ```
 */