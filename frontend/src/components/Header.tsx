/**
 * Header 컴포넌트
 * 
 * 33m2 스타일의 심플한 헤더 바
 * - StayViet 로고
 * - 로그인 버튼
 * - 언어 선택 버튼
 * 
 * Next.js 컴포넌트 구조:
 * - 'use client': 클라이언트 컴포넌트로 선언 (상태 관리 및 이벤트 핸들러 사용)
 * - 컴포넌트는 함수로 정의되며, Props를 받아 JSX를 반환
 */

'use client';

import { useState } from 'react';
import { Home, LogIn, Globe } from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

interface HeaderProps {
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

/**
 * Header 컴포넌트
 * @param currentLanguage - 현재 선택된 언어
 * @param onLanguageChange - 언어 변경 시 호출되는 콜백 함수
 */
export default function Header({ currentLanguage = 'en', onLanguageChange }: HeaderProps) {
  // 언어 선택 드롭다운 열림/닫힘 상태 관리
  // useState: React Hook으로 컴포넌트의 상태를 관리
  // [상태값, 상태변경함수] = useState(초기값)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  // 언어 옵션 정의 (영어, 베트남어, 한국어 순서)
  const languages: { code: SupportedLanguage; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  // 현재 선택된 언어 정보 찾기
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  /**
   * 언어 변경 핸들러
   * @param lang - 선택된 언어 코드
   */
  const handleLanguageSelect = (lang: SupportedLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    setIsLanguageMenuOpen(false); // 메뉴 닫기
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 영역 */}
          <div className="flex items-center gap-3">
            {/* Home 아이콘: lucide-react에서 가져온 아이콘 컴포넌트 */}
            <Home className="w-8 h-8 text-blue-600" />
            {/* 로고 텍스트 */}
            <h1 className="text-2xl font-bold text-gray-900">StayViet</h1>
          </div>

          {/* 우측 버튼 영역 */}
          <div className="flex items-center gap-3">
            {/* 언어 선택 버튼 */}
            <div className="relative">
              {/* 
                버튼 클릭 시 드롭다운 메뉴 토글
                onClick: 이벤트 핸들러로 상태를 변경
              */}
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang.flag}</span>
                <span>{currentLang.name}</span>
              </button>

              {/* 
                조건부 렌더링: isLanguageMenuOpen이 true일 때만 드롭다운 표시
                && 연산자: 왼쪽이 true면 오른쪽 JSX를 렌더링
              */}
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        currentLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 로그인 버튼 - 언어별 텍스트 표시 */}
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <LogIn className="w-4 h-4" />
              <span>{getUIText('login', currentLanguage)}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
