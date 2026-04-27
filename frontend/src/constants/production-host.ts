/**
 * Phase 3 프로덕션 호스트 단일 원본 (AWS Amplify 기본 도메인).
 * 커스텀 도메인 전환 시 Amplify 환경 변수 `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST` 만 바꾸면
 * 클라이언트·메타데이터·법무 각주가 함께 따라간다.
 */
const AMPLIFY_PHASE3_DEFAULT_HOST = "main.dn98z8m9jfvd5.amplifyapp.com";

function readPublicProductionHost(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST
      ? process.env.NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST.trim()
      : "";
  return (fromEnv || AMPLIFY_PHASE3_DEFAULT_HOST).replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** 호스트만 (스킴 없음). TWA `twaHostname` 과 동일 규칙. */
export const STAYVIET_PRODUCTION_HOST = readPublicProductionHost();

/** `https://` + 호스트. canonical·OG·정책 각주에 사용. */
export const STAYVIET_PRODUCTION_ORIGIN = `https://${STAYVIET_PRODUCTION_HOST}`;
