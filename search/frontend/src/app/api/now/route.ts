import { NextResponse } from 'next/server';

/**
 * 서버 현재 시각 반환 (정산/임대수익 등 금전 로직용)
 * - ISO 8601 형식(UTC) 및 Unix timestamp(ms) 제공
 * - 클라이언트 시계 조작에 영향받지 않도록 비교 시 이 값을 사용
 */
export async function GET() {
  const now = new Date();
  const iso = now.toISOString();
  const timestamp = now.getTime();
  return NextResponse.json({ iso, timestamp });
}
