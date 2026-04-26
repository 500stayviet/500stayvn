/**
 * HTTP `Response` 본문 JSON (앱/레거시 공통) — `AppApi` 봉투 파싱은 도메인 파서(`parseApp*Payload`)에 위임.
 */
export async function readResponseJsonOrMarker(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { __jsonParseError: true as const };
  }
}
