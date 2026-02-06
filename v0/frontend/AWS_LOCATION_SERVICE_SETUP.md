# AWS Location Service를 사용한 GrabMaps 연동 가이드

## 개요

AWS Location Service는 GrabMaps를 포함한 여러 지도 제공업체를 지원하는 서비스입니다. 이 가이드를 따라 GrabMaps를 연동하세요.

## 1. AWS 계정 설정

### 1.1 AWS 계정 생성
1. [AWS 콘솔](https://console.aws.amazon.com/)에 접속
2. 계정이 없으면 새로 생성

### 1.2 IAM 사용자 생성 (프로그래밍 방식 접근용)
1. IAM 콘솔로 이동: https://console.aws.amazon.com/iam/
2. "사용자" > "사용자 추가"
3. 사용자 이름 입력 (예: `location-service-user`)
4. "프로그래밍 방식 액세스" 선택
5. 권한 정책 연결:
   - `AmazonLocationServiceFullAccess` (또는 필요한 권한만)
6. 액세스 키 ID와 비밀 액세스 키를 안전하게 저장

## 2. Location Service 설정

### 2.1 Location Service 활성화
1. AWS 콘솔에서 "Location Service" 검색
2. "지도" 섹션에서 "지도 생성" 클릭
3. 지도 이름 입력 (예: `grabmaps-map`)
4. 데이터 제공업체 선택: **GrabMaps**
5. 가격 플랜 선택 (필요에 따라)
6. "지도 생성" 클릭

### 2.2 Place Index 생성 (주소 검색용)
1. "Place Index" 섹션에서 "Place Index 생성" 클릭
2. 이름 입력 (예: `grabmaps-place-index`)
3. 데이터 제공업체: **GrabMaps**
4. "Place Index 생성" 클릭

### 2.3 Geocoding API 사용 (주소 ↔ 좌표 변환)
- Place Index를 사용하면 자동으로 Geocoding 기능 사용 가능

## 3. 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가하세요:

```env
# AWS 설정
NEXT_PUBLIC_AWS_REGION=ap-southeast-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_id
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Location Service 리소스 이름
NEXT_PUBLIC_AWS_MAP_NAME=grabmaps-map
NEXT_PUBLIC_AWS_PLACE_INDEX_NAME=grabmaps-place-index
```

**보안 주의사항:**
- ⚠️ **중요**: `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 사이드에 노출됩니다
- 프로덕션 환경에서는 API Route를 만들어 서버 사이드에서만 AWS SDK를 사용하는 것을 강력히 권장합니다
- 현재 구현은 개발/테스트 목적으로만 사용하세요
- 프로덕션에서는 `/api/aws-location` 같은 API Route를 만들어 서버 사이드에서 처리하세요

## 4. 패키지 설치

이미 `package.json`에 추가되어 있습니다:

```bash
npm install
```

설치되는 패키지:
- `@aws-sdk/client-location`: AWS Location Service 클라이언트
- `@aws-sdk/credential-providers`: AWS 자격 증명 제공자

## 5. 사용 방법

### 5.1 주소 자동완성 (SearchPlaceIndexForSuggestions)

```typescript
import { LocationClient, SearchPlaceIndexForSuggestionsCommand } from '@aws-sdk/client-location';

const client = new LocationClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const searchSuggestions = async (text: string) => {
  const command = new SearchPlaceIndexForSuggestionsCommand({
    IndexName: process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME!,
    Text: text,
    Language: 'vi', // 베트남어
    MaxResults: 5,
  });
  
  const response = await client.send(command);
  return response.Results;
};
```

### 5.2 주소 검색 (SearchPlaceIndexForText)

```typescript
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';

const searchPlace = async (text: string) => {
  const command = new SearchPlaceIndexForTextCommand({
    IndexName: process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME!,
    Text: text,
    Language: 'vi',
  });
  
  const response = await client.send(command);
  return response.Results;
};
```

### 5.3 좌표 → 주소 변환 (SearchPlaceIndexForPosition)

```typescript
import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';

const reverseGeocode = async (latitude: number, longitude: number) => {
  const command = new SearchPlaceIndexForPositionCommand({
    IndexName: process.env.NEXT_PUBLIC_AWS_PLACE_INDEX_NAME!,
    Position: [longitude, latitude], // [경도, 위도] 순서
  });
  
  const response = await client.send(command);
  return response.Results;
};
```

### 5.4 지도 표시 (GrabMaps)

GrabMaps는 웹 SDK를 제공합니다. HTML에 직접 스크립트를 추가하거나, Next.js의 `next/script`를 사용할 수 있습니다.

```typescript
import Script from 'next/script';

// GrabMaps SDK 로드
<Script
  src="https://maps.grab.com/grab-maps-sdk/latest/grab-maps-sdk.js"
  strategy="lazyOnload"
  onLoad={() => {
    // GrabMaps 초기화
    const map = new GrabMaps.Map('map-container', {
      center: [106.6297, 10.8231], // [경도, 위도]
      zoom: 13,
    });
  }}
/>
```

## 6. 가격 정보

### AWS Location Service 가격
- **지도 타일**: 월 1,000회 무료, 이후 $0.50/1,000회
- **Place Index 검색**: 월 1,000회 무료, 이후 $0.50/1,000회
- **Geocoding**: Place Index 검색에 포함

### GrabMaps 가격
- GrabMaps 자체 가격 정책 확인 필요
- AWS를 통한 사용 시 AWS 가격이 적용됩니다

## 7. 보안 권장사항

### 프로덕션 환경
1. **서버 사이드 API 사용**: 클라이언트에서 직접 AWS 자격 증명을 사용하지 마세요
2. **API Gateway + Lambda**: AWS API Gateway와 Lambda를 사용하여 프록시 API 생성
3. **Cognito Identity Pool**: 클라이언트에서 임시 자격 증명 사용
4. **CORS 설정**: 필요한 도메인만 허용

### 개발 환경
- `.env.local` 파일을 `.gitignore`에 추가
- 자격 증명을 코드에 하드코딩하지 마세요

## 8. 참고 자료

- [AWS Location Service 문서](https://docs.aws.amazon.com/location/)
- [GrabMaps 문서](https://docs.grab.com/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)

## 9. 문제 해결

### 자격 증명 오류
- IAM 사용자의 권한 확인
- AWS_REGION이 올바른지 확인
- 액세스 키가 올바른지 확인

### Place Index를 찾을 수 없음
- Place Index 이름이 환경 변수와 일치하는지 확인
- 같은 리전에 생성되었는지 확인

### GrabMaps 지도가 표시되지 않음
- GrabMaps SDK가 올바르게 로드되었는지 확인
- API 키가 필요한지 확인 (GrabMaps 정책에 따라 다름)
