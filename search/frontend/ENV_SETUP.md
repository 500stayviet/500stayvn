# 환경 변수 설정 가이드

## .env.local 파일 생성

`frontend` 폴더에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI

# Firebase Functions URLs
NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-stayviet-26ae4.cloudfunctions.net
```

## 파일 생성 방법

### Windows (PowerShell)
```powershell
cd frontend
@"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-stayviet-26ae4.cloudfunctions.net
"@ | Out-File -FilePath .env.local -Encoding utf8
```

### Windows (CMD)
```cmd
cd frontend
echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI > .env.local
echo NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI >> .env.local
echo NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI >> .env.local
echo NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-stayviet-26ae4.cloudfunctions.net >> .env.local
```

### 수동 생성
1. `frontend` 폴더로 이동
2. `.env.local` 파일 생성 (새 텍스트 파일)
3. 위의 내용을 복사하여 붙여넣기
4. 파일 저장

## 중요 사항

- `.env.local` 파일은 Git에 커밋되지 않습니다 (이미 .gitignore에 포함됨)
- 환경 변수 변경 후에는 개발 서버를 재시작해야 합니다
- `NEXT_PUBLIC_` 접두사가 붙은 변수만 클라이언트에서 사용 가능합니다
