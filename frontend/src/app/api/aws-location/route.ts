/**
 * AWS Location Service API Route
 * 서버 사이드에서 AWS Location Service를 호출하여 CORS 문제 해결
 */

import { NextRequest, NextResponse } from 'next/server';

function readFirstNonEmpty(...values: Array<string | undefined>): string {
  for (const v of values) {
    const trimmed = (v || '').trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
}

function resolveAwsLocationConfig() {
  const region = readFirstNonEmpty(
    process.env.NEXT_PUBLIC_AWS_REGION,
    process.env.AWS_REGION,
    'ap-southeast-1'
  );
  const apiKey = readFirstNonEmpty(
    process.env.NEXT_PUBLIC_AWS_API_KEY,
    process.env.AWS_API_KEY
  );
  const placeIndexName = readFirstNonEmpty(
    process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME,
    process.env.AWS_PLACE_INDEX_NAME
  );
  return {
    region,
    apiKey,
    placeIndexName,
    baseUrl: `https://places.geo.${region}.amazonaws.com`,
  };
}

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * 주소 자동완성 (SearchPlaceIndexForSuggestions)
 */
export async function POST(request: NextRequest) {
  try {
    const cfg = resolveAwsLocationConfig();

    if (!cfg.apiKey) {
      console.error('[aws-location] missing env var: NEXT_PUBLIC_AWS_API_KEY or AWS_API_KEY');
      return NextResponse.json(
        { error: 'AWS API Key is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!cfg.placeIndexName) {
      console.error('[aws-location] missing env var: NEXT_PUBLIC_AWS_PLACE_INDEX_NAME or AWS_PLACE_INDEX_NAME');
      console.error('[aws-location] env snapshot:', {
        NEXT_PUBLIC_AWS_REGION: Boolean((process.env.NEXT_PUBLIC_AWS_REGION || '').trim()),
        NEXT_PUBLIC_AWS_API_KEY: Boolean((process.env.NEXT_PUBLIC_AWS_API_KEY || '').trim()),
        NEXT_PUBLIC_AWS_MAP_NAME: Boolean((process.env.NEXT_PUBLIC_AWS_MAP_NAME || '').trim()),
        NEXT_PUBLIC_AWS_PLACE_INDEX_NAME: Boolean((process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME || '').trim()),
        AWS_REGION: Boolean((process.env.AWS_REGION || '').trim()),
        AWS_API_KEY: Boolean((process.env.AWS_API_KEY || '').trim()),
        AWS_MAP_NAME: Boolean((process.env.AWS_MAP_NAME || '').trim()),
        AWS_PLACE_INDEX_NAME: Boolean((process.env.AWS_PLACE_INDEX_NAME || '').trim()),
      });
      return NextResponse.json(
        { error: 'AWS Place Index Name is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { action, text, language, latitude, longitude, placeId } = body;

    let url = '';
    let requestBody: any = {};

    switch (action) {
      case 'suggestions':
        if (!text || text.trim().length === 0) {
          return NextResponse.json({ Suggestions: [] }, { headers: corsHeaders });
        }
        url = `${cfg.baseUrl}/places/v0/indexes/${cfg.placeIndexName}/search/suggestions?key=${encodeURIComponent(cfg.apiKey)}`;
        requestBody = {
          Text: text,
          MaxResults: 10,
          Language: language || 'vi',
          FilterCountries: ['VNM'], // 베트남만 검색
          // 아파트/건물 검색을 위해 카테고리 필터 추가 (주소, 상업시설, 주거단지)
          // FilterCategories는 AWS Location Service에서 지원하지 않을 수 있으므로 주석 처리
          // FilterCategories: ['Address', 'Commercial', 'Residential'],
        };
        
        // 거리 기반 가중치: BiasPosition 추가 (호치민 좌표 또는 사용자 위치)
        if (latitude && longitude) {
          requestBody.BiasPosition = [longitude, latitude];
        }
        break;

      case 'search':
        // 빈 검색어 체크
        if (!text || text.trim().length === 0) {
          return NextResponse.json({ Results: [] }, { headers: corsHeaders });
        }
        url = `${cfg.baseUrl}/places/v0/indexes/${cfg.placeIndexName}/search/text?key=${encodeURIComponent(cfg.apiKey)}`;
        // 400 에러 방지: FilterCategories 제거, 기본 파라미터만 사용
        requestBody = {
          Text: text,
          MaxResults: 15,
          Language: language || 'vi',
          FilterCountries: ['VNM'],
        };
        break;

      case 'getPlace':
        // PlaceId를 이용한 상세 조회
        if (!placeId || placeId.trim().length === 0) {
          return NextResponse.json({ error: 'PlaceId is required' }, { status: 400, headers: corsHeaders });
        }
        // AWS Location Service의 GetPlace API 엔드포인트
        url = `${cfg.baseUrl}/places/v0/indexes/${cfg.placeIndexName}/places/${encodeURIComponent(placeId)}?key=${encodeURIComponent(cfg.apiKey)}`;
        // GetPlace는 GET 요청이므로 requestBody는 사용하지 않음
        break;

      case 'position':
        url = `${cfg.baseUrl}/places/v0/indexes/${cfg.placeIndexName}/search/position?key=${encodeURIComponent(cfg.apiKey)}`;
        requestBody = {
          Position: [longitude, latitude],
          MaxResults: 1,
          Language: language || 'vi',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        );
    }

    // GetPlace는 GET 요청, 나머지는 POST 요청
    const isGetRequest = action === 'getPlace';
    const fetchOptions: RequestInit = {
      method: isGetRequest ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (!isGetRequest) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AWS Location Service API error:', response.status, errorText);
      return NextResponse.json(
        { error: `AWS API error: ${response.status}`, details: errorText },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in AWS Location Service API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
