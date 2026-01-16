# Firebase 설정 가이드

## 1. Firebase 프로젝트 설정

### Firestore 데이터베이스 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `stayviet-26ae4` 프로젝트 선택
3. 좌측 메뉴에서 **"Firestore Database"** 클릭
4. **"데이터베이스 만들기"** 클릭
5. **프로덕션 모드** 선택 (나중에 규칙 설정 가능)
6. 위치 선택: `asia-southeast1` (싱가포르) 또는 `us-central1`

### Firestore 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // properties 컬렉션: 읽기는 모두 허용, 쓰기는 인증 필요
    match /properties/{propertyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 2. 환경 변수 설정

`.env.local` 파일에 Firebase 설정 추가:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stayviet-26ae4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stayviet-26ae4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stayviet-26ae4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Functions
NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-stayviet-26ae4.cloudfunctions.net
```

### Firebase API 키 발급 방법
1. Firebase Console > 프로젝트 설정
2. "일반" 탭에서 "앱" 섹션 확인
3. 웹 앱이 없으면 "앱 추가" > "웹" 선택
4. 앱 닉네임 입력 후 등록
5. 생성된 설정 정보를 `.env.local`에 복사

## 3. 샘플 데이터 업로드

```bash
cd frontend
npm run seed
```

이 명령어는 `scripts/seed-firestore.ts`를 실행하여 샘플 매물 데이터를 Firestore에 업로드합니다.

## 4. 데이터 구조

### properties 컬렉션 구조

```typescript
{
  title: string;                    // 베트남어 제목
  original_description: string;     // 베트남어 원문 설명
  translated_description: string;   // 번역된 설명 (한국어)
  price: number;                    // 가격
  priceUnit: 'vnd' | 'usd';         // 통화 단위
  area: number;                     // 면적 (m²)
  bedrooms?: number;                // 침실 수
  bathrooms?: number;               // 욕실 수
  coordinates: {
    lat: number;                    // 위도
    lng: number;                    // 경도
  };
  address?: string;                 // 주소 문자열
  images?: string[];               // 이미지 URL 배열
  createdAt: Timestamp;            // 생성 시간
  updatedAt: Timestamp;            // 수정 시간
  status: 'active' | 'pending' | 'sold' | 'rented' | 'inactive';
}
```

## 5. 기능 확인

### 실시간 데이터 동기화
- Firestore에 데이터를 추가/수정/삭제하면 프론트엔드가 자동으로 업데이트됩니다.
- `useProperties` Hook이 실시간 리스너를 사용합니다.

### 번역 API 연동
- 언어 선택 시 `useTranslation` Hook이 자동으로 Firebase Functions의 translate API를 호출합니다.
- 번역 결과는 실시간으로 UI에 반영됩니다.

### Geocoding 연동
- 새 매물 등록 시 주소를 입력하면 자동으로 좌표가 생성됩니다.
- Google Geocoding API를 사용합니다.
