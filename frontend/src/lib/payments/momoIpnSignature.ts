import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * MoMo Payment IPN(JSON) 서명 검증용 raw 문자열을 만든다.
 *
 * 규격: HMAC_SHA256(secret, data) — `data`는 `key1=value1&key2=value2...` (MoMo 공식 “Digital Signature” 절).
 * IPN 필드 순서는 파트너 문서·샘플과 동일하게 유지해야 한다.
 * @see https://developers.momo.vn/v3/docs/payment/api/other/signature/
 * @see https://developers.momo.vn/v3/docs/payment/api/result-handling/notification/
 *
 * Phase 4에서 MoMo 콘솔/샘플과 교차 검증 후 필드 목록·누락 필드 처리(빈 문자열 등)를 조정한다.
 */
export const MOMO_IPN_SIGNATURE_FIELD_ORDER = [
  "accessKey",
  "amount",
  "extraData",
  "message",
  "orderId",
  "orderInfo",
  "orderType",
  "partnerCode",
  "payType",
  "requestId",
  "responseTime",
  "resultCode",
  "transId",
] as const;

export type MomoIpnBody = Record<string, unknown>;

function formatIpnValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

/**
 * `signature` 제외. MoMo IPN 예시에는 `accessKey`가 없을 수 있으므로,
 * **본문에 존재하는 키만** 고정 순서로 포함한다(값은 문자열화, `null` → 빈 문자열).
 * Phase 4에서 실제 IPN 샘플로 “전 필드 고정” 방식과 맞춘다.
 */
export function buildMomoIpnSignatureRawData(body: MomoIpnBody): string {
  const parts: string[] = [];
  for (const key of MOMO_IPN_SIGNATURE_FIELD_ORDER) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    parts.push(`${key}=${formatIpnValue(body[key])}`);
  }
  return parts.join("&");
}

export function computeMomoIpnSignatureHmacHex(secretKey: string, rawData: string): string {
  return createHmac("sha256", secretKey).update(rawData, "utf8").digest("hex");
}

/** 대소문자 무시 hex 비교(타이밍 안전). */
export function verifyMomoIpnSignatureHex(provided: string, expectedHex: string): boolean {
  const a = provided.trim().toLowerCase();
  const b = expectedHex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(a) || !/^[0-9a-f]{64}$/.test(b)) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
