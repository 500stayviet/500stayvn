'use client';

import { useState } from 'react';
import { translate, translateBatch, detectLanguage, getSupportedLanguages } from '@/lib/api/translation';
import { SupportedLanguage } from '@/lib/api/translation';
import { Loader2, CheckCircle2, XCircle, Languages } from 'lucide-react';

export default function AdminPage() {
  const [text, setText] = useState('Căn hộ 2PN Quận 7, Miễn phí quản lý, Không cần đặt cọc');
  const [sourceLang, setSourceLang] = useState<SupportedLanguage | ''>('');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('en');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedLangs, setSupportedLangs] = useState<SupportedLanguage[]>([]);

  const languages: SupportedLanguage[] = ['en', 'ko', 'vi'];
  const languageNames: Record<SupportedLanguage, string> = {
    en: 'English',
    ko: '한국어',
    vi: 'Tiếng Việt',
  };

  // 지원 언어 목록 조회
  const handleGetSupportedLanguages = async () => {
    setLoading(true);
    setError(null);
    try {
      const langs = await getSupportedLanguages();
      setSupportedLangs(langs);
      setResult({ languages: langs });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 언어 감지
  const handleDetectLanguage = async () => {
    if (!text.trim()) {
      setError('텍스트를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detected = await detectLanguage(text);
      setResult({ detectedLanguage: detected });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 단일 번역
  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('텍스트를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const translation = await translate(
        text,
        targetLang,
        sourceLang || undefined
      );
      setResult(translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 배치 번역
  const handleTranslateBatch = async () => {
    const texts = text.split('\n').filter(t => t.trim());
    if (texts.length === 0) {
      setError('번역할 텍스트를 입력해주세요. (줄바꿈으로 구분)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const batchResult = await translateBatch(
        texts,
        targetLang,
        sourceLang || undefined
      );
      setResult(batchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Languages className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">번역 API 테스트 (관리자 페이지)</h1>
          </div>

          {/* 입력 영역 */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                번역할 텍스트
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="번역할 텍스트를 입력하세요..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발 언어 (선택)
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as SupportedLanguage | '')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">자동 감지</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {languageNames[lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목표 언어
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {languageNames[lang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={handleGetSupportedLanguages}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Languages className="w-5 h-5" />
              )}
              지원 언어 조회
            </button>

            <button
              onClick={handleDetectLanguage}
              disabled={loading}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '언어 감지'}
            </button>

            <button
              onClick={handleTranslate}
              disabled={loading}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '단일 번역'}
            </button>

            <button
              onClick={handleTranslateBatch}
              disabled={loading}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '배치 번역'}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 결과 영역 */}
          {result && (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">결과</h2>
              </div>
              <pre className="bg-white p-4 rounded-lg border border-gray-200 overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
