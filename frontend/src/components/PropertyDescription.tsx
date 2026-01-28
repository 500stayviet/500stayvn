"use client";

import React, { useState } from 'react';
import { Languages, Loader2, AlertCircle } from 'lucide-react';
import { useTranslationToggle } from '@/hooks/useTranslationToggle';
import { TranslationConsentModal } from './TranslationConsentModal';
import { useTranslation } from '@/contexts/TranslationProvider';

interface PropertyDescriptionProps {
  // 매물 설명 (베트남어 원문)
  description: string;
  
  // 소스 언어 (기본값: 'vi' - 베트남어)
  sourceLanguage?: 'vi' | 'ko' | 'en' | 'ja' | 'zh';
  
  // 캐시 키 (선택사항)
  cacheKey?: string;
  
  // 추가 클래스명
  className?: string;
}

export const PropertyDescription: React.FC<PropertyDescriptionProps> = ({
  description,
  sourceLanguage = 'vi',
  cacheKey,
  className = '',
}) => {
  // 모달 상태
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLanguagePackModal, setShowLanguagePackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // 번역 컨텍스트
  const translationContext = useTranslation();
  
  // 번역 토글 훅
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
  } = useTranslationToggle({
    text: description,
    sourceLanguage,
    cacheKey: cacheKey || `property-desc-${description.substring(0, 50)}`,
  }, {
    onConsentGiven: () => {
      // 동의 후 번역 실행
      handleTranslateWithConsent();
    },
    onLanguagePackConsentGiven: () => {
      // 언어 팩 동의 후 번역 실행
      handleTranslateWithConsent();
    },
  });
  
  // 동의 모달 표시 요청
  const requestConsent = (action: () => void, isLanguagePack = false) => {
    setPendingAction(() => action);
    
    if (isLanguagePack) {
      setShowLanguagePackModal(true);
    } else {
      setShowConsentModal(true);
    }
  };
  
  // 동의 처리
  const handleConsent = (consent: boolean, isLanguagePack = false) => {
    if (isLanguagePack) {
      setShowLanguagePackModal(false);
    } else {
      setShowConsentModal(false);
    }
    
    // 동의 저장
    saveConsent(consent, isLanguagePack);
    
    if (consent && pendingAction) {
      pendingAction();
    }
    
    setPendingAction(null);
  };
  
  // 동의 후 번역 실행
  const handleTranslateWithConsent = () => {
    // 동의 후 실제 번역 실행
    toggleTranslation();
  };
  
  // 번역 버튼 클릭 핸들러
  const handleTranslationClick = () => {
    // 번역 불가능하면 무시
    if (!canTranslate) return;
    
    // 이미 번역된 상태면 토글
    if (isTranslated) {
      toggleTranslation();
      return;
    }
    
    // 동의 체크
    if (!hasConsent) {
      requestConsent(() => toggleTranslation(), false);
      return;
    }
    
    // 네이티브 환경에서 언어 팩 동의 체크
    if (environment !== 'web' && !hasLanguagePackConsent) {
      requestConsent(() => toggleTranslation(), true);
      return;
    }
    
    // 모든 조건 충족 시 번역 실행
    toggleTranslation();
  };
  
  // 설명이 비어있으면 아무것도 렌더링하지 않음
  if (!description || description.trim() === '') {
    return null;
  }

  // 디버깅 정보 (개발 환경에서만 표시)
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className={`relative ${className}`}>
      {/* 설명 텍스트 컨테이너 - 글자 수에 맞게 조절 */}
      <div className="mb-2">
        <div className="text-gray-700 whitespace-pre-line break-words">
          {displayText}
        </div>
        
        {/* 번역 안내 문구 */}
        {isTranslated && (
          <div className="mt-1">
            <p className="text-xs text-gray-500 italic">
              {environment === 'web' 
                ? 'Gemini AI를 사용한 자동 번역 결과입니다.' 
                : '기기 엔진을 사용한 자동 번역 결과입니다.'}
            </p>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mt-1 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>번역 중 오류가 발생했습니다.</span>
          </div>
        )}

        {/* 디버깅 정보 (개발 환경에서만) */}
        {isDevelopment && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <p>디버깅 정보:</p>
            <p>• canTranslate: {canTranslate ? 'true' : 'false'}</p>
            <p>• sourceLanguage: {sourceLanguage}</p>
            <p>• environment: {environment}</p>
            <p>• engine: {engine}</p>
            <p>• hasConsent: {hasConsent ? 'true' : 'false'}</p>
            <p>• hasLanguagePackConsent: {hasLanguagePackConsent ? 'true' : 'false'}</p>
            <p>• isTranslated: {isTranslated ? 'true' : 'false'}</p>
            <p>• isLoading: {isLoading ? 'true' : 'false'}</p>
          </div>
        )}
      </div>
      
      {/* 번역 버튼 - 우측 하단에 위치 */}
      {canTranslate && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleTranslationClick}
            disabled={isLoading}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isLoading 
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
      
      {/* 동의 모달 */}
      <TranslationConsentModal
        type="consent"
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={(consent) => handleConsent(consent, false)}
        environment={environment}
        engine={engine}
      />
      
      {/* 언어 팩 모달 */}
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

// PropertyDescription을 사용하는 예시 컴포넌트
export const PropertyDescriptionExample: React.FC = () => {
  const exampleDescription = `Căn hộ studio mới xây, nằm ở trung tâm Quận 1, TP.HCM. 
  Diện tích 33m2, đầy đủ tiện nghi: máy lạnh, tủ lạnh, máy giặt, bếp từ.
  Gần chợ Bến Thành, công viên 23/9, các trung tâm thương mại.
  Phù hợp cho khách du lịch, người đi công tác ngắn hạn.
  Giá thuê: 15,000,000 VND/tháng (đã bao gồm điện, nước, internet).`;
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">매물 설명 예시</h2>
      <PropertyDescription
        description={exampleDescription}
        sourceLanguage="vi"
        cacheKey="example-property-1"
      />
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">사용 방법</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 기본적으로 베트남어 원문이 표시됩니다.</li>
          <li>• "번역 보기" 버튼을 클릭하면 번역됩니다.</li>
          <li>• 최초 실행 시 동의 모달이 표시됩니다.</li>
          <li>• 네이티브 앱 환경에서는 언어 팩 다운로드 동의가 필요합니다.</li>
          <li>• 번역 후 "원문 보기" 버튼으로 토글 가능합니다.</li>
        </ul>
      </div>
    </div>
  );
};