"use client";

import React, { useState } from 'react';
import { Languages, Loader2, AlertCircle } from 'lucide-react';
import { useTranslationToggle } from '@/hooks/useTranslationToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';
import { TranslationConsentModal } from './TranslationConsentModal';

interface PropertyDescriptionProps {
  description: string;
  sourceLanguage?: 'vi' | 'ko' | 'en' | 'ja' | 'zh';
  targetLanguage?: 'vi' | 'ko' | 'en' | 'ja' | 'zh';
  cacheKey?: string;
  className?: string;
}

export const PropertyDescription: React.FC<PropertyDescriptionProps> = ({
  description,
  sourceLanguage = 'vi',
  targetLanguage: targetLanguageProp,
  cacheKey,
  className = '',
}) => {
  const { currentLanguage } = useLanguage();
  const targetLanguage = targetLanguageProp ?? currentLanguage;
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLanguagePackModal, setShowLanguagePackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const {
    displayText,
    buttonText,
    isLoading,
    error,
    isTranslated,
    canTranslate,
    toggleTranslation,
    saveConsent,
    hasConsent,
    hasLanguagePackConsent,
    environment,
    engine,
  } = useTranslationToggle(
    {
      text: description,
      sourceLanguage,
      targetLanguage,
      cacheKey: cacheKey || `property-desc-${description.substring(0, 50)}`,
    },
    {
      onConsentGiven: () => {
        handleTranslateWithConsent();
      },
      onLanguagePackConsentGiven: () => {
        handleTranslateWithConsent();
      },
    },
  );

  const requestConsent = (action: () => void, isLanguagePack = false) => {
    setPendingAction(() => action);

    if (isLanguagePack) {
      setShowLanguagePackModal(true);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleConsent = (consent: boolean, isLanguagePack = false) => {
    if (isLanguagePack) {
      setShowLanguagePackModal(false);
    } else {
      setShowConsentModal(false);
    }

    saveConsent(consent, isLanguagePack);

    if (consent && pendingAction) {
      pendingAction();
    }

    setPendingAction(null);
  };

  const handleTranslateWithConsent = () => {
    toggleTranslation();
  };

  const handleTranslationClick = () => {
    if (!canTranslate) return;
    if (isTranslated) {
      toggleTranslation();
      return;
    }
    if (environment === 'web') {
      toggleTranslation();
      return;
    }
    if (!hasConsent) {
      requestConsent(() => toggleTranslation(), false);
      return;
    }
    if (!hasLanguagePackConsent) {
      requestConsent(() => toggleTranslation(), true);
      return;
    }
    toggleTranslation();
  };

  if (!description || description.trim() === '') {
    return null;
  }

  const canTranslateDescription = description.trim() !== '';

  return (
    <div className={`relative ${className}`}>
      <div className="mb-2">
        <div className="text-gray-700 whitespace-pre-line break-words text-sm leading-relaxed">
          {displayText}
        </div>

        {isTranslated && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 italic">
              {environment === 'web'
                ? getUIText('chatTranslatedByGemini', currentLanguage)
                : getUIText('chatTranslatedByDevice', currentLanguage)}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-1 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{getUIText('propertyDescriptionTranslateError', currentLanguage)}</span>
          </div>
        )}
      </div>

      {canTranslate && canTranslateDescription && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleTranslationClick}
            disabled={isLoading}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                isLoading
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : isTranslated
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{buttonText}</span>
              </>
            ) : (
              <>
                <Languages className="w-3.5 h-3.5" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      )}

      <TranslationConsentModal
        type="consent"
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={(consent) => handleConsent(consent, false)}
        environment={environment}
        engine={engine}
      />

      <TranslationConsentModal
        type="language-pack"
        isOpen={showLanguagePackModal}
        onClose={() => setShowLanguagePackModal(false)}
        onConsent={(consent) => handleConsent(consent, true)}
        environment={environment}
        engine={engine}
      />
    </div>
  );
};

export const PropertyDescriptionExample: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const exampleDescription = `Căn hộ studio mới xây, nằm ở trung tâm Quận 1, TP.HCM. 
  Diện tích 33m2, đầy đủ tiện nghi: máy lạnh, tủ lạnh, máy giặt, bếp từ.
  Gần chợ Bến Thành, công viên 23/9, các trung tâm thương mại.
  Phù hợp cho khách du lịch, người đi công tác ngắn hạn.
  Giá thuê: 15,000,000 VND/tháng (đã bao gồm điện, nước, internet).`;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        {getUIText('propertyDescExampleTitle', currentLanguage)}
      </h2>
      <PropertyDescription
        description={exampleDescription}
        sourceLanguage="vi"
        cacheKey="example-property-1"
      />

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">
          {getUIText('propertyDescHowToTitle', currentLanguage)}
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• {getUIText('propertyDescBullet1', currentLanguage)}</li>
          <li>• {getUIText('propertyDescBullet2', currentLanguage)}</li>
          <li>• {getUIText('propertyDescBullet3', currentLanguage)}</li>
          <li>• {getUIText('propertyDescBullet4', currentLanguage)}</li>
          <li>• {getUIText('propertyDescBullet5', currentLanguage)}</li>
        </ul>
      </div>
    </div>
  );
};
