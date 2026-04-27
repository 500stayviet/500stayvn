"use client";

import React from 'react';
import { TranslationProvider } from '@/contexts/TranslationProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface TranslationProvidersProps {
  children: React.ReactNode;
}

/**
 * Composes LanguageProvider and TranslationProvider for the app shell.
 *
 * Wrap the root layout:
 *
 * ```tsx
 * import { TranslationProviders } from '@/components/providers/TranslationProviders';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TranslationProviders>{children}</TranslationProviders>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export const TranslationProviders: React.FC<TranslationProvidersProps> = ({
  children,
}) => {
  return (
    <LanguageProvider>
      <TranslationProvider>{children}</TranslationProvider>
    </LanguageProvider>
  );
};
