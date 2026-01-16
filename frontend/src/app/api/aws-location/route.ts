/**
 * AWS Location Service API Route
 * 서버 사이드에서 AWS Location Service를 호출하여 CORS 문제 해결
 */

import { NextRequest, NextResponse } from 'next/server';

const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-southeast-1';
const AWS_API_KEY = process.env.NEXT_PUBLIC_AWS_API_KEY || '';
const AWS_PLACE_INDEX_NAME = process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME || '';

const BASE_URL = `https://places.geo.${AWS_REGION}.amazonaws.com`;

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
    if (!AWS_API_KEY) {
      return NextResponse.json(
        { error: 'AWS API Key is not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!AWS_PLACE_INDEX_NAME) {
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
        url = `${BASE_URL}/places/v0/indexes/${AWS_PLACE_INDEX_NAME}/search/suggestions?key=${encodeURIComponent(AWS_API_KEY)}`;
        requestBody = {
          Text: text,
          MaxResults: 10,
          Language: language || 'vi',
        };
        
        // 거리 기반 가중치: BiasPosition 추가
        if (latitude && longitude) {
          requestBody.BiasPosition = [longitude, latitude];
        }
        break;

      case 'search':
        // 빈 검색어 체크
        if (!text || text.trim().length === 0) {
          return NextResponse.json({ Results: [] }, { headers: corsHeaders });
        }
        url = `${BASE_URL}/places/v0/indexes/${AWS_PLACE_INDEX_NAME}/search/text?key=${encodeURIComponent(AWS_API_KEY)}`;
        requestBody = {
          Text: text, // 대문자 T 주의
          MaxResults: 10,
          Language: language || 'vi',
        };
        break;

      case 'getPlace':
        // PlaceId를 이용한 상세 조회
        if (!placeId || placeId.trim().length === 0) {
          return NextResponse.json({ error: 'PlaceId is required' }, { status: 400, headers: corsHeaders });
        }
        // AWS Location Service의 GetPlace API 엔드포인트
        url = `${BASE_URL}/places/v0/indexes/${AWS_PLACE_INDEX_NAME}/places/${encodeURIComponent(placeId)}?key=${encodeURIComponent(AWS_API_KEY)}`;
        // GetPlace는 GET 요청이므로 requestBody는 사용하지 않음
        break;

      case 'position':
        url = `${BASE_URL}/places/v0/indexes/${AWS_PLACE_INDEX_NAME}/search/position?key=${encodeURIComponent(AWS_API_KEY)}`;
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
