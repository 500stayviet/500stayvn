"use client";

import React from 'react';
import { X, Download, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationConsentModalProps {
  // 모달 타입
  type: 'consent' | 'language-pack';
  
  // 모달 상태
  isOpen: boolean;
  onClose: () => void;
  
  // 동의 처리
  onConsent: (consent: boolean) => void;
  
  // 추가 정보
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
  
  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;
  
  // 다국어 텍스트
  const getText = () => {
    const texts = {
      ko: {
        consent: {
          title: '번역 서비스 동의',
          description: '번역 기능을 사용하려면 동의가 필요합니다. 번역은 기기 내장 엔진을 사용하여 오프라인에서도 작동할 수 있습니다.',
          agree: '동의하고 계속하기',
          disagree: '거절',
        },
        languagePack: {
          title: '언어 팩 다운로드',
          description: '기기 내장 번역 엔진을 사용하려면 언어 팩 다운로드가 필요합니다. 약 50MB의 저장 공간이 필요하며, Wi-Fi 연결을 권장합니다.',
          agree: '다운로드하고 계속하기',
          disagree: '나중에',
        },
      },
      vi: {
        consent: {
          title: 'Đồng ý sử dụng dịch vụ dịch thuật',
          description: 'Cần có sự đồng ý để sử dụng tính năng dịch. Dịch có thể hoạt động ngoại tuyến bằng cách sử dụng công cụ dịch tích hợp trong thiết bị.',
          agree: 'Đồng ý và tiếp tục',
          disagree: 'Từ chối',
        },
        languagePack: {
          title: 'Tải gói ngôn ngữ',
          description: 'Cần tải gói ngôn ngữ để sử dụng công cụ dịch tích hợp trong thiết bị. Cần khoảng 50MB dung lượng lưu trữ và khuyến nghị kết nối Wi-Fi.',
          agree: 'Tải xuống và tiếp tục',
          disagree: 'Để sau',
        },
      },
      en: {
        consent: {
          title: 'Translation Service Consent',
          description: 'Consent is required to use the translation feature. Translation can work offline using the built-in device engine.',
          agree: 'Agree and Continue',
          disagree: 'Decline',
        },
        languagePack: {
          title: 'Language Pack Download',
          description: 'Language pack download is required to use the built-in translation engine. Requires about 50MB of storage space, Wi-Fi connection is recommended.',
          agree: 'Download and Continue',
          disagree: 'Later',
        },
      },
      ja: {
        consent: {
          title: '翻訳サービスの同意',
          description: '翻訳機能を使用するには同意が必要です。翻訳はデバイス内蔵エンジンを使用してオフラインでも動作できます。',
          agree: '同意して続行',
          disagree: '拒否',
        },
        languagePack: {
          title: '言語パックのダウンロード',
          description: 'デバイス内蔵翻訳エンジンを使用するには言語パックのダウンロードが必要です。約50MBのストレージ容量が必要で、Wi-Fi接続を推奨します。',
          agree: 'ダウンロードして続行',
          disagree: '後で',
        },
      },
      zh: {
        consent: {
          title: '翻译服务同意',
          description: '使用翻译功能需要同意。翻译可以使用设备内置引擎在离线状态下工作。',
          agree: '同意并继续',
          disagree: '拒绝',
        },
        languagePack: {
          title: '语言包下载',
          description: '使用内置翻译引擎需要下载语言包。需要约50MB存储空间，建议使用Wi-Fi连接。',
          agree: '下载并继续',
          disagree: '稍后',
        },
      },
    };
    
    return texts[currentLanguage as keyof typeof texts] || texts.ko;
  };
  
  const text = getText();
  const modalText = type === 'consent' ? text.consent : text.languagePack;
  
  // 엔진 이름
  const getEngineName = () => {
    switch (engine) {
      case 'apple': return 'Apple Translation Framework';
      case 'mlkit': return 'Google ML Kit';
      case 'gemini': return 'Gemini AI';
      default: return engine;
    }
  };
  
  // 환경 아이콘
  const getEnvironmentIcon = () => {
    switch (environment) {
      case 'ios': return <Smartphone className="w-5 h-5" />;
      case 'android': return <Smartphone className="w-5 h-5" />;
      case 'web': return <Globe className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getEnvironmentIcon()}
              <h3 className="text-lg font-bold text-gray-900">
                {modalText.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* 내용 */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {modalText.description}
          </p>
          
          {/* 엔진 정보 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                사용 엔진: {getEngineName()}
              </span>
            </div>
            <p className="text-xs text-blue-600">
              {environment === 'web' 
                ? '인터넷 연결이 필요합니다.' 
                : '오프라인에서도 사용 가능합니다.'}
            </p>
          </div>
          
          {/* 언어 팩 정보 (언어 팩 모달일 때만) */}
          {type === 'language-pack' && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  저장 공간 필요: 약 50MB
                </span>
              </div>
              <p className="text-xs text-yellow-600">
                Wi-Fi 연결을 권장합니다. 다운로드 후 오프라인에서 사용 가능합니다.
              </p>
            </div>
          )}
        </div>
        
        {/* 푸터 */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onConsent(false);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {modalText.disagree}
            </button>
            <button
              onClick={() => {
                onConsent(true);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              {modalText.agree}
            </button>
          </div>
          
          {/* 약관 링크 */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {type === 'consent' 
              ? '동의함으로써 개인정보 처리방침에 동의하는 것으로 간주됩니다.' 
              : '언어 팩은 기기 저장공간에 다운로드됩니다.'}
          </p>
        </div>
      </div>
    </div>
  );
};