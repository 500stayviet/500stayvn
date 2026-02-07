# Firebase Authentication 설정 가이드

## 문제: `auth/configuration-not-found` 에러

이 에러는 Firebase Authentication이 활성화되지 않았거나 설정이 잘못되었을 때 발생합니다.

## 해결 방법

### 1단계: Firebase Console에서 Authentication 활성화

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - 프로젝트 선택: `stayviet-26ae4`

2. **Authentication 활성화**
   - 왼쪽 메뉴에서 **Authentication** 클릭
   - **Get Started** 또는 **시작하기** 버튼 클릭
   - 이제 Authentication이 활성화됩니다

3. **이메일/비밀번호 로그인 활성화**
   - Authentication 페이지에서 **Sign-in method** 탭 클릭
   - **이메일/비밀번호** 제공업체 찾기
   - 클릭하여 활성화 (Enabled) 토글을 켜기
   - **저장** 클릭

### 2단계: .env.local 파일 확인

`frontend/.env.local` 파일이 있는지 확인하고, 다음 내용이 포함되어 있는지 확인하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC4lLSAbv7r2FSEH0JKVu5hCjxN0FCRPVI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stayviet-26ae4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stayviet-26ae4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stayviet-26ae4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=786068960824
NEXT_PUBLIC_FIREBASE_APP_ID=1:786068960824:web:c7e460864a985ce8a258cd
```

### 3단계: 개발 서버 재시작

`.env.local` 파일을 수정했다면 개발 서버를 재시작하세요:

```bash
# 터미널에서 Ctrl+C로 서버 중지
# 그 다음 다시 시작
npm run dev
```

### 4단계: 브라우저 캐시 클리어

브라우저 개발자 도구(F12)를 열고:
- Network 탭에서 "Disable cache" 체크
- 또는 Ctrl+Shift+R (하드 리프레시)

## 확인 사항

✅ Firebase Console → Authentication → Sign-in method에서 이메일/비밀번호가 활성화되어 있는가?
✅ .env.local 파일이 frontend 폴더에 존재하는가?
✅ .env.local 파일의 값들이 올바른가? (특히 API_KEY와 APP_ID)
✅ 개발 서버를 재시작했는가?

## 추가 도움말

만약 여전히 문제가 발생한다면:

1. **Firebase 프로젝트 설정 확인**
   - Firebase Console → Project Settings
   - 웹 앱이 등록되어 있는지 확인

2. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 다른 에러 메시지가 있는지 확인

3. **Firebase 지원**
   - Firebase 문서: https://firebase.google.com/docs/auth/web/start
