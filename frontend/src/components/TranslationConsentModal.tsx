"use client";

import React from 'react';
import { X, Download, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';

interface TranslationConsentModalProps {
  type: 'consent' | 'language-pack';
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: boolean) => void;
  environment?: 'web' | 'ios' | 'android';
  engine?: string;
}

export const TranslationConsentModal: React.FC<TranslationConsentModalProps> = ({
  type,
  isOpen,
  onClose,
  onConsent,
  environment = 'web',
  engine = 'gemini',
}) => {
  const { currentLanguage } = useLanguage();

  if (!isOpen) return null;

  const modalText =
    type === 'consent'
      ? {
          title: getUIText('translationConsentTitle', currentLanguage),
          description: getUIText('translationConsentDescription', currentLanguage),
          agree: getUIText('translationConsentAgree', currentLanguage),
          disagree: getUIText('translationConsentDecline', currentLanguage),
        }
      : {
          title: getUIText('translationLangPackTitle', currentLanguage),
          description: getUIText('translationLangPackDescription', currentLanguage),
          agree: getUIText('translationLangPackAgree', currentLanguage),
          disagree: getUIText('translationLangPackDecline', currentLanguage),
        };

  const getEngineName = () => {
    switch (engine) {
      case 'apple':
        return 'Apple Translation Framework';
      case 'mlkit':
        return 'Google ML Kit';
      case 'gemini':
        return 'Gemini AI';
      default:
        return engine;
    }
  };

  const engineLine = getUIText('translationModalEngineLine', currentLanguage).replace(
    /\{\{engine\}\}/g,
    getEngineName(),
  );

  const getEnvironmentIcon = () => {
    switch (environment) {
      case 'ios':
        return <Smartphone className="w-5 h-5" />;
      case 'android':
        return <Smartphone className="w-5 h-5" />;
      case 'web':
        return <Globe className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getEnvironmentIcon()}
              <h3 className="text-lg font-bold text-gray-900">{modalText.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={getUIText('close', currentLanguage)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">{modalText.description}</p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">{engineLine}</span>
            </div>
            <p className="text-xs text-blue-600">
              {environment === 'web'
                ? getUIText('translationModalWebRequiresNetwork', currentLanguage)
                : getUIText('translationModalOfflineCapable', currentLanguage)}
            </p>
          </div>

          {type === 'language-pack' && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {getUIText('translationLangPackStorageTitle', currentLanguage)}
                </span>
              </div>
              <p className="text-xs text-yellow-600">
                {getUIText('translationLangPackStorageHint', currentLanguage)}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onConsent(false);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {modalText.disagree}
            </button>
            <button
              type="button"
              onClick={() => {
                onConsent(true);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              {modalText.agree}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            {type === 'consent'
              ? getUIText('translationFooterConsentPrivacy', currentLanguage)
              : getUIText('translationFooterLangPackDevice', currentLanguage)}
          </p>
        </div>
      </div>
    </div>
  );
};
