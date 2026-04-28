import { describe, expect, it } from 'vitest';
import {
  buildMomoIpnSignatureRawData,
  computeMomoIpnSignatureHmacHex,
  verifyMomoIpnSignatureHex,
} from '@/lib/payments/momoIpnSignature';

function signedMomoIpnWire(secret: string, fields: Record<string, unknown>): string {
  const rawData = buildMomoIpnSignatureRawData(fields);
  const sig = computeMomoIpnSignatureHmacHex(secret, rawData);
  return JSON.stringify({ ...fields, signature: sig });
}

describe('momoIpnSignature', () => {
  const secret = 'test-partner-secret';

  it('필드 고정 순서 문자열로 HMAC을 계산하고 검증에 통과한다', () => {
    const fields = {
      orderId: 'ord_test_1',
      transId: '78901234',
      resultCode: 0,
      amount: 50000,
    };
    const rawData = buildMomoIpnSignatureRawData(fields);
    const hex = computeMomoIpnSignatureHmacHex(secret, rawData);
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyMomoIpnSignatureHex(hex, hex)).toBe(true);
  });

  it('같은 의미의 JSON 키 순서가 달라도 파싱 후 rawData는 동일하다(서명은 파싱 객체·고정 필드 순서 기준)', () => {
    const jsonA = '{"orderId":"o1","transId":"t1","resultCode":0,"amount":100}';
    const jsonB = '{"amount":100,"orderId":"o1","resultCode":0,"transId":"t1"}';
    const a = JSON.parse(jsonA) as Record<string, unknown>;
    const b = JSON.parse(jsonB) as Record<string, unknown>;
    expect(buildMomoIpnSignatureRawData(a)).toBe(buildMomoIpnSignatureRawData(b));
  });

  it('JSON.stringify로 재직렬화한 문자열로는 HMAC을 만들지 않는다(라우트는 parse 후 buildMomoIpnSignatureRawData 사용)', () => {
    const fields = { orderId: 'x', transId: 'y', resultCode: 0, amount: 1 };
    const wire = JSON.stringify(fields);
    const fromParse = buildMomoIpnSignatureRawData(JSON.parse(wire) as Record<string, unknown>);
    const notFromString = computeMomoIpnSignatureHmacHex(secret, wire);
    const fromCanonical = computeMomoIpnSignatureHmacHex(secret, fromParse);
    expect(fromCanonical).not.toBe(notFromString);
  });

  it('잘못된 서명 hex는 검증 실패', () => {
    const fields = { orderId: 'a', transId: 'b', resultCode: 1, amount: 0 };
    const raw = buildMomoIpnSignatureRawData(fields);
    const good = computeMomoIpnSignatureHmacHex(secret, raw);
    const bad = '0'.repeat(64);
    expect(verifyMomoIpnSignatureHex(bad, good)).toBe(false);
  });

  it('서명 헬퍼로 만든 본문은 같은 secret으로 검증 통과한다', () => {
    const fields = {
      orderId: 'order-e2e',
      transId: 'trans-e2e',
      resultCode: 0,
      amount: 1000,
    };
    const wire = signedMomoIpnWire(secret, fields);
    const body = JSON.parse(wire) as Record<string, unknown>;
    const sig = body.signature;
    expect(typeof sig).toBe('string');
    const expected = computeMomoIpnSignatureHmacHex(
      secret,
      buildMomoIpnSignatureRawData(body),
    );
    expect(verifyMomoIpnSignatureHex(sig as string, expected)).toBe(true);
  });
});
