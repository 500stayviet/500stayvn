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

const LEGACY_KO_TO_KEY: Record<string, UITextKey> = {
  '상대방이 입장했습니다': 'chatSystemPeerJoined',
  '상대방이 입장했습니다.': 'chatSystemPeerJoined',
  '이미지 전송': 'chatSystemImageSent',
  '이미지를 전송했습니다': 'chatSystemImageSent',
  '이미지를 전송했습니다.': 'chatSystemImageSent',
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
