"use client";

import React, { useState } from 'react';
import { Languages, Loader2, AlertCircle, User } from 'lucide-react';
import { useTranslationToggle } from '@/hooks/useTranslationToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';
import { resolveChatMessageBody } from '@/lib/chat/chatMessageDisplay';
import { TranslationConsentModal } from './TranslationConsentModal';

interface ChatMessageProps {
  // 메시지 내용
  message: string;
  
  // 발신자 정보
  sender: {
    id: string;
    name: string;
    isCurrentUser: boolean;
  };
  
  // 메시지 시간
  timestamp: string;
  
  // 소스 언어 (메시지 원문 언어, 기본값: 'vi')
  sourceLanguage?: 'vi' | 'ko' | 'en' | 'ja' | 'zh';
  
  // 타겟 언어 (선택된 UI 언어와 동일할 때 번역 버튼 숨김)
  targetLanguage?: 'vi' | 'ko' | 'en' | 'ja' | 'zh';
  
  // 캐시 키 (선택사항)
  cacheKey?: string;
  
  // 추가 클래스명
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  sender,
  timestamp,
  sourceLanguage = 'vi',
  targetLanguage: targetLanguageProp,
  cacheKey,
  className = '',
}) => {
  const { currentLanguage } = useLanguage();
  const resolvedBody = resolveChatMessageBody(message, currentLanguage);
  const textForTranslation = resolvedBody.displayText;
  const translationSource = resolvedBody.skipTranslation
    ? currentLanguage
    : sourceLanguage;
  const translationTarget = resolvedBody.skipTranslation
    ? currentLanguage
    : (targetLanguageProp ?? currentLanguage);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLanguagePackModal, setShowLanguagePackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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
    text: textForTranslation,
    sourceLanguage: translationSource,
    targetLanguage: translationTarget,
    cacheKey: cacheKey || `chat-msg-${sender.id}-${timestamp}`,
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
  
  // 번역 버튼 클릭 핸들러 (웹은 Gemini 사용으로 동의 없이 번역)
  const handleTranslationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  
  // 현재 사용자의 메시지인지 확인
  const isCurrentUser = sender.isCurrentUser;
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {/* 발신자 정보 (상대방 메시지일 때만) */}
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {sender.name}
            </span>
          </div>
        )}
        
        {/* 메시지 버블 */}
        <div
          className={`
            relative rounded-2xl px-4 py-3
            ${isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }
          `}
        >
          {/* 메시지 내용 */}
          <p className="whitespace-pre-line break-words">
            {displayText}
          </p>
          
          {/* 번역 안내 문구 */}
          {isTranslated && (
            <div className={`mt-2 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
              <p className="text-[10px] italic">
                {environment === 'web'
                  ? getUIText('chatTranslatedByGemini', currentLanguage)
                  : getUIText('chatTranslatedByDevice', currentLanguage)}
              </p>
            </div>
          )}
          
          {/* 에러 메시지 */}
          {error && (
            <div className={`mt-2 flex items-center gap-2 ${isCurrentUser ? 'text-blue-200' : 'text-red-600'} text-xs`}>
              <AlertCircle className="w-3 h-3" />
              <span>{getUIText('chatTranslationErrorLabel', currentLanguage)}</span>
            </div>
          )}
          
          {/* 시간 표시 */}
          <div className={`mt-2 text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {timestamp}
          </div>
        </div>
        
        {/* 번역 버튼 (말풍선 우측 하단) */}
        {canTranslate && (
          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mt-1`}>
            <button
              onClick={handleTranslationClick}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                transition-all duration-200
                ${isLoading 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : isTranslated
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={
                isTranslated
                  ? getUIText('chatTranslateShowOriginalTitle', currentLanguage)
                  : getUIText('chatTranslateShowTranslatedTitle', currentLanguage)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{getUIText('chatTranslating', currentLanguage)}</span>
                </>
              ) : (
                <>
                  <Languages className="w-3 h-3" />
                  <span>{buttonText}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* 사용자 아바타 (현재 사용자 메시지일 때만) */}
      {isCurrentUser && (
        <div className="order-1 ml-2 self-end">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
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

// ChatMessage를 사용하는 예시 컴포넌트
export const ChatMessageExample: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const guestName = getUIText('chatExampleDemoGuestName', currentLanguage);
  const hostName = getUIText('chatExampleDemoHostName', currentLanguage);
  const exampleMessages = [
    {
      id: '1',
      message: 'Xin chào, tôi muốn đặt phòng từ ngày 15 đến ngày 22 tháng 2.',
      sender: {
        id: 'guest1',
        name: guestName,
        isCurrentUser: false,
      },
      timestamp: getUIText('chatExampleDemoTime1', currentLanguage),
      sourceLanguage: 'vi' as const,
    },
    {
      id: '2',
      message: getUIText('chatExampleDemoMsgHostReply', currentLanguage),
      sender: {
        id: 'host1',
        name: hostName,
        isCurrentUser: true,
      },
      timestamp: getUIText('chatExampleDemoTime2', currentLanguage),
      sourceLanguage: currentLanguage,
    },
    {
      id: '3',
      message: 'Cảm ơn bạn. Tôi muốn biết giá cả và chính sách hủy phòng.',
      sender: {
        id: 'guest1',
        name: guestName,
        isCurrentUser: false,
      },
      timestamp: getUIText('chatExampleDemoTime3', currentLanguage),
      sourceLanguage: 'vi' as const,
    },
  ];
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        {getUIText('chatExampleTitle', currentLanguage)}
      </h2>

      <div className="space-y-4 mb-6">
        {exampleMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            sender={msg.sender}
            timestamp={msg.timestamp}
            sourceLanguage={msg.sourceLanguage}
            cacheKey={`example-chat-${msg.id}`}
          />
        ))}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">
          {getUIText('chatExampleHowToTitle', currentLanguage)}
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• {getUIText('chatExampleBullet1', currentLanguage)}</li>
          <li>• {getUIText('chatExampleBullet2', currentLanguage)}</li>
          <li>• {getUIText('chatExampleBullet3', currentLanguage)}</li>
          <li>• {getUIText('chatExampleBullet4', currentLanguage)}</li>
          <li>• {getUIText('chatExampleBullet5', currentLanguage)}</li>
        </ul>
      </div>
    </div>
  );
};