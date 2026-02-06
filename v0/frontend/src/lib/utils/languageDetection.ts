/**
 * 채팅 메시지 언어 감지 (휴리스틱)
 * - 현재 사용 언어와 메시지 언어가 다를 때만 번역 버튼 표시하기 위함 (매물 설명과 동일 검증)
 */

import type { SupportedLanguage } from '@/lib/api/translation';

// 한글 (Hangul)
const HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF]/;
// 히라가나/가타카나 (Japanese)
const JAPANESE = /[\u3040-\u309F\u30A0-\u30FF]/;
// 한자 (CJK - Chinese/Japanese/Korean)
const CJK = /[\u4E00-\u9FFF]/;
// 베트남어 흔한 문자 (ă, â, đ, ê, ô, ơ, ư 등)
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđăâêôơư]/i;

/**
 * 메시지 텍스트의 언어를 휴리스틱으로 추정.
 * 채팅에서 "현재 사용 언어 !== 메시지 언어"일 때만 번역하기 버튼 표시용.
 */
export function detectMessageLanguage(text: string): SupportedLanguage {
  const t = (text || '').trim();
  if (!t) return 'en';

  // 한글 포함 → 한국어
  if (HANGUL.test(t)) return 'ko';
  // 히라가나/가타카나 포함 → 일본어
  if (JAPANESE.test(t)) return 'ja';
  // 한자만 있거나 중국어로 보이는 경우 → 중국어
  if (CJK.test(t)) return 'zh';
  // 베트남어 특유 문자 포함 → 베트남어
  if (VIETNAMESE.test(t)) return 'vi';

  // 그 외(순수 라틴 등) → 영어로 간주 (다른 언어 선택 시 번역 버튼 노출)
  return 'en';
}
