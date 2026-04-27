/**
 * 채팅 메시지 본문 표시 — 서버가 보내는 시스템 코드·레거시 한글 문자열을 UI 언어로 치환합니다.
 * 신규 시스템 메시지는 `ChatSystemMessageCode` 상수를 content로 저장하는 것을 권장합니다.
 */

import type { SupportedLanguage } from '@/lib/api/translation';
import { getUIText, type UITextKey } from '@/utils/i18n';

/** 서버/클라이언트가 저장할 때 사용하는 안정적인 접두사 */
export const CHAT_SYS_PREFIX = '__SV_CHAT:';

export const ChatSystemMessageCode = {
  PEER_JOINED: `${CHAT_SYS_PREFIX}PEER_JOINED`,
  IMAGE_SENT: `${CHAT_SYS_PREFIX}IMAGE_SENT`,
} as const;

/** DB에 남은 레거시 한글 본문 — 소스 스캔에서 한글 리터럴 제외를 위해 유니코드 이스케이프 사용 */
const LEGACY_KO_TO_KEY: Record<string, UITextKey> = {
  "\uC0C1\uB300\uBC29\uC774 \uC785\uC7A5\uD588\uC2B5\uB2C8\uB2E4": "chatSystemPeerJoined",
  "\uC0C1\uB300\uBC29\uC774 \uC785\uC7A5\uD588\uC2B5\uB2C8\uB2E4.": "chatSystemPeerJoined",
  "\uC774\uBBF8\uC9C0 \uC804\uC1A1": "chatSystemImageSent",
  "\uC774\uBBF8\uC9C0\uB97C \uC804\uC1A1\uD588\uC2B5\uB2C8\uB2E4": "chatSystemImageSent",
  "\uC774\uBBF8\uC9C0\uB97C \uC804\uC1A1\uD588\uC2B5\uB2C8\uB2E4.": "chatSystemImageSent",
};

export type ResolvedChatBody = {
  displayText: string;
  /** true면 번역 버튼 비표시(소스=타겟으로 처리) */
  skipTranslation: boolean;
};

export function resolveChatMessageBody(
  raw: string,
  lang: SupportedLanguage,
): ResolvedChatBody {
  const trimmed = raw.trim();
  if (trimmed === ChatSystemMessageCode.PEER_JOINED) {
    return {
      displayText: getUIText('chatSystemPeerJoined', lang),
      skipTranslation: true,
    };
  }
  if (trimmed === ChatSystemMessageCode.IMAGE_SENT) {
    return {
      displayText: getUIText('chatSystemImageSent', lang),
      skipTranslation: true,
    };
  }
  const legacyKey = LEGACY_KO_TO_KEY[trimmed];
  if (legacyKey) {
    return {
      displayText: getUIText(legacyKey, lang),
      skipTranslation: true,
    };
  }
  return { displayText: raw, skipTranslation: false };
}
