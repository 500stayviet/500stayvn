'use client';

import { useState } from 'react';
import { translate, SupportedLanguage } from '@/lib/api/translation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';

interface TranslationButtonProps {
  text: string;
  sourceLanguage?: SupportedLanguage;
  targetLanguage?: SupportedLanguage;
  className?: string;
  onTranslated?: (translatedText: string) => void;
  showOriginal?: boolean;
}

export default function TranslationButton({
  text,
  sourceLanguage,
  targetLanguage: propTargetLanguage,
  className = '',
  onTranslated,
  showOriginal = false,
}: TranslationButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentLanguage } = useLanguage();
  const targetLanguage = propTargetLanguage || currentLanguage;

  const needsTranslation = !sourceLanguage || sourceLanguage !== targetLanguage;

  const handleTranslate = async () => {
    if (!text.trim() || !needsTranslation) {
      setTranslatedText(text);
      setShowTranslated(true);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translate(text, targetLanguage, sourceLanguage);

      setTranslatedText(result.translatedText);
      setShowTranslated(true);

      if (onTranslated) {
        onTranslated(result.translatedText);
      }
    } catch (err) {
      console.error('Translation failed:', err);
      setError(getUIText('uiTranslateGenericFail', currentLanguage));
      setTranslatedText(text);
      setShowTranslated(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggle = () => {
    if (!translatedText && !showTranslated) {
      void handleTranslate();
    } else {
      setShowTranslated(!showTranslated);
    }
  };

  const handleReset = () => {
    setTranslatedText(null);
    setShowTranslated(false);
    setError(null);
  };

  const displayText = showTranslated && translatedText ? translatedText : text;
  const isTranslated = showTranslated && translatedText && translatedText !== text;

  return (
    <div className={`translation-container ${className}`}>
      <div className="translation-content mb-2">
        <p className={`text-gray-800 ${isTranslated ? 'italic' : ''}`}>
          {displayText}
          {isTranslated && (
            <span className="ml-2 text-xs text-green-600 font-semibold">
              ({getUIText('uiTranslatedBadge', currentLanguage)})
            </span>
          )}
        </p>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <div className="translation-controls flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isTranslating || !text.trim()}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${
              isTranslating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isTranslated
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
            }
          `}
        >
          {isTranslating ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {getUIText('uiTranslateButtonLoading', currentLanguage)}
            </span>
          ) : isTranslated ? (
            getUIText('uiTranslateViewOriginal', currentLanguage)
          ) : (
            getUIText('uiTranslateShowTranslation', currentLanguage)
          )}
        </button>

        {isTranslated && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {getUIText('uiTranslateReset', currentLanguage)}
          </button>
        )}

        {needsTranslation && !isTranslated && !showTranslated && (
          <span className="text-xs text-gray-500">
            {sourceLanguage
              ? `${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}`
              : `→ ${targetLanguage.toUpperCase()}`}
          </span>
        )}
      </div>

      {!showOriginal && (
        <p className="text-xs text-gray-400 mt-2">
          💡 {getUIText('uiTranslateCostSavingHint', currentLanguage)}
        </p>
      )}
    </div>
  );
}
